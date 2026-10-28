/** Explicit reviewed v2 rollout only. Existing migrate:nfc stays001–011. No startup import. */
import {readFile,lstat} from 'node:fs/promises';
import {isAbsolute} from 'node:path';
import {createHash} from 'node:crypto';
import {database} from '../src/nfc-card/store.ts';
import {V2_MIGRATION_SHA256,v2SchemaReady} from '../src/nfc-card/v2/runtime.ts';
const target='012_v35_enquiries';
let pool:ReturnType<typeof database>|undefined;
try{
 const operation=process.argv[2];if(!['preflight','migrate'].includes(operation))throw Error('explicit_v2_operation_required');
 const url=new URL(process.env.NFC_DATABASE_URL??'');if(!['postgres:','postgresql:'].includes(url.protocol))throw Error('database_required');
 pool=database(url.href);
 const info=(await pool.query("SELECT current_database() AS db,current_setting('server_version_num') AS version")).rows[0];
 if(!String(info.version).startsWith('17'))throw Error('postgres17_required');
 const sql=await readFile(new URL('../migrations/nfc-card/'+target+'.sql',import.meta.url),'utf8');
 if(createHash('sha256').update(sql).digest('hex')!==V2_MIGRATION_SHA256)throw Error('reviewed_migration_sha_required');
 const old=await pool.query('SELECT version,checksum FROM nfc_card.schema_migrations ORDER BY version');
 for(const row of old.rows){
  if(row.version===target)continue;
  if(!/^0(?:0[1-9]|1[01])_[a-z0-9_]+$/.test(row.version))throw Error('unreviewed_schema_version');
  const source=await readFile(new URL('../migrations/nfc-card/'+row.version+'.sql',import.meta.url));
  if(createHash('sha256').update(source).digest('hex')!==row.checksum)throw Error('legacy_schema_checksum_mismatch');
 }
 if(old.rows.filter(x=>x.version!==target).length!==11)throw Error('complete_legacy_schema_required');
 const integrity=(await pool.query("SELECT count(*)::int AS missing_outbox FROM nfc_card.leads l LEFT JOIN nfc_card.notification_outbox o USING(lead_id) WHERE o.lead_id IS NULL")).rows[0];
 if(integrity.missing_outbox!==0)throw Error('legacy_identity_set_reconciliation_required');
 const applied=old.rows.find(x=>x.version===target);if(applied&&applied.checksum!==V2_MIGRATION_SHA256)throw Error('migration_checksum_mismatch');
 if(operation==='preflight')console.log(JSON.stringify({ok:true,operation,database:info.db,postgresMajor:17,legacyMigrations:11,target,targetChecksum:V2_MIGRATION_SHA256,applied:!!applied,v2Ready:await v2SchemaReady(pool),writes:0}));
 else{
  if(process.env.NFC_V2_APPLY_MIGRATION!==target)throw Error('explicit_apply_fence_required');
  const p=process.env.NFC_V2_ROLLOUT_APPROVAL_FILE??'';if(!isAbsolute(p))throw Error('reviewed_rollout_artifact_required');
  const st=await lstat(p);if(!st.isFile()||st.isSymbolicLink()||st.size>32768)throw Error('reviewed_rollout_artifact_required');
  const a=JSON.parse(await readFile(p,'utf8')),now=Date.now();
  if(a.operation!==target||a.database!==info.db||a.migrationSha256!==V2_MIGRATION_SHA256||a.operatorApproved!==true||
    typeof a.approvalReference!=='string'||a.approvalReference.length<10||!a.backup||a.backup.encrypted!==true||a.backup.restoreVerified!==true||
    !/^[a-f0-9]{64}$/.test(a.backup.artifactSha256??'')||!Number.isFinite(Date.parse(a.backup.createdAt))||now-Date.parse(a.backup.createdAt)>86400000||Date.parse(a.backup.createdAt)-now>300000||
    !/^[a-f0-9]{40}$/.test(a.gatewayCommit??'')||a.gatewayCommit!==process.env.RAILWAY_GIT_COMMIT_SHA)throw Error('backup_restore_commit_approval_required');
  const c=await pool.connect();try{
   await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");await c.query("SET LOCAL statement_timeout='60s'");await c.query('SELECT pg_advisory_xact_lock(174813,1)');
   const again=await c.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1',[target]);
   if(again.rowCount){if(again.rows[0].checksum!==V2_MIGRATION_SHA256)throw Error('migration_checksum_mismatch');}
   else{await c.query(sql);await c.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)',[target,V2_MIGRATION_SHA256]);}
   await c.query('COMMIT');console.log(JSON.stringify({ok:true,operation,target,applied:!again.rowCount,checksum:V2_MIGRATION_SHA256,v2Ready:await v2SchemaReady(pool),legacyDataRepriced:false,destructiveDownMigration:false}));
  }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
 }
}catch{console.error(JSON.stringify({ok:false,code:'nfc_v2_operation_failed_no_automatic_retry'}));process.exitCode=1;}
finally{await pool?.end();}
