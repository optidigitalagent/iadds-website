/** Explicit, checksum/backup/commit-bound additive rollout. Never automatic startup DDL. */
import {readFileSync,lstatSync} from 'node:fs';import {isAbsolute} from 'node:path';import {createHash} from 'node:crypto';
import {database} from '../src/nfc-card/store.ts';import {controlMigrationSql as migrationSql,controlMigrationSha as migrationSha,controlSchemaReady as routingSchemaReady} from '../src/nfc-card/control-context.ts';
const version='014_control_context';let pool:ReturnType<typeof database>|undefined;
try{
 const operation=process.argv[2];if(!['preflight','migrate'].includes(operation))throw Error('explicit_operation_required');
 const url=new URL(process.env.NFC_DATABASE_URL??'');pool=database(url.href);
 const info=(await pool.query("SELECT current_database() db,current_setting('server_version_num') version")).rows[0];
 if(!String(info.version).startsWith('17')||!(info.db==='nfc_card'||/^nfc_v35_[a-z0-9_]+_test$/.test(info.db)&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('verified_database_required');
 const old=(await pool.query('SELECT version,checksum FROM nfc_card.schema_migrations ORDER BY version')).rows;
 for(const row of old){if(!/^0(?:0[1-9]|1[0-4])_[a-z0-9_]+$/.test(row.version))throw Error('unreviewed_schema');const bytes=readFileSync(new URL('../migrations/nfc-card/'+row.version+'.sql',import.meta.url));if(createHash('sha256').update(bytes).digest('hex')!==row.checksum)throw Error('migration_checksum_mismatch');}
 if(old.filter(x=>x.version!==version).length!==13)throw Error('complete_prior_schema_required');
 if(operation==='preflight'){
  const ready=await routingSchemaReady(pool),states:unknown[]=[],uncertain:unknown[]=[];
  if(ready)for(const [table,state,key]of [['notification_outbox','status','lead_id'],['v2_notification_outbox','state','request_id']]){
   states.push(...(await pool.query(`SELECT '${table}' outbox,routing_route,${state} state,count(*)::int count FROM nfc_card.${table} WHERE routing_route IS NOT NULL GROUP BY routing_route,${state}`)).rows);
   uncertain.push(...(await pool.query(`SELECT '${table}' outbox,${key} source_application_id,routing_chat_id,telegram_message_id,attempt_count,delivery_payload_sha256 FROM nfc_card.${table} WHERE routing_route IS NOT NULL AND ${state}='outcome_unknown' ORDER BY updated_at LIMIT 100`)).rows);
  }
  console.log(JSON.stringify({ok:true,operation,database:info.db,version,checksum:migrationSha(),ready,states,uncertain,writes:0}));
 }
 else{
  if(process.env.NFC_CONTROL_APPLY_MIGRATION!==version)throw Error('explicit_apply_required');
  const path=process.env.NFC_CONTROL_ROLLOUT_APPROVAL_FILE??'';if(!isAbsolute(path))throw Error('reviewed_rollout_required');
  const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size>32768)throw Error('reviewed_rollout_required');
  const proof=JSON.parse(readFileSync(path,'utf8')),now=Date.now(),backup=proof.backup;
  if(proof.operation!==version||proof.database!==info.db||proof.operatorApproved!==true||proof.migrationSha256!==migrationSha()||
   proof.gatewayCommit!==process.env.RAILWAY_GIT_COMMIT_SHA||!/^[a-f0-9]{40}$/.test(proof.gatewayCommit??'')||
   proof.approvalReference!=='NFC-CONTROL-CONTEXT-OWNER-20261106'||!backup||backup.encrypted!==true||backup.restoreVerified!==true||
   !/^[a-f0-9]{64}$/.test(backup.artifactSha256??'')||!Number.isFinite(Date.parse(backup.createdAt))||now-Date.parse(backup.createdAt)>86400000||Date.parse(backup.createdAt)-now>300000)throw Error('backup_restore_commit_approval_required');
  const c=await pool.connect();try{
   await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");await c.query("SET LOCAL statement_timeout='45s'");await c.query('SELECT pg_advisory_xact_lock(174813,1)');
   const already=(await c.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1',[version])).rows[0];
   if(already){if(already.checksum!==migrationSha())throw Error('migration_checksum_mismatch');await c.query('COMMIT');console.log(JSON.stringify({ok:true,operation,applied:false,version,checksum:migrationSha(),oldDataPreserved:true}));}
   else{
    const tables=(await c.query("SELECT table_name FROM information_schema.tables WHERE table_schema='nfc_card' AND table_name<>'schema_migrations' ORDER BY table_name")).rows.map(x=>x.table_name as string);
    if(tables.some(t=>!/^[a-z0-9_]+$/.test(t)))throw Error('unreviewed_table');
    await c.query('LOCK TABLE '+tables.map(t=>'nfc_card.'+t).join(',')+' IN SHARE ROW EXCLUSIVE MODE');
    const columns:Record<string,string[]>={};for(const t of tables)columns[t]=(await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='nfc_card' AND table_name=$1 ORDER BY ordinal_position",[t])).rows.map(x=>x.column_name);
    const fingerprint=async()=>{const result:Record<string,string>={};for(const t of tables){if(columns[t].some(k=>!/^[a-z0-9_]+$/.test(k)))throw Error('unreviewed_column');const row=(await c.query(`SELECT md5(coalesce(jsonb_agg(v ORDER BY v::text),'[]'::jsonb)::text) hash FROM (SELECT jsonb_build_array(${columns[t].map(k=>'t.'+k).join(',')}) v FROM nfc_card.${t} t) q`)).rows[0];result[t]=row.hash;}return result;};
    const before=await fingerprint();await c.query(migrationSql());const after=await fingerprint();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('original_rows_changed');
    await c.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)',[version,migrationSha()]);await c.query('COMMIT');
    console.log(JSON.stringify({ok:true,operation,applied:true,version,checksum:migrationSha(),oldDataPreserved:true,preservedTables:tables.length,oldRowFingerprints:after,destructiveDownMigration:false,backfillSends:0}));
   }
  }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
 }
}catch{console.error(JSON.stringify({ok:false,code:'control_context_operation_failed_no_automatic_retry'}));process.exitCode=1;}
finally{await pool?.end();}
