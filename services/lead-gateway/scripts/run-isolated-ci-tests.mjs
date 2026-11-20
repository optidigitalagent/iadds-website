// CI-only: acquire fresh databases, never adopt/reset a pre-existing database.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {readdirSync,mkdirSync,mkdtempSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import pg from 'pg';

const service=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const specs=[
  ['NFC_TEST_DATABASE_URL','55105','nfc_v35_routing_test'],
  ['NFC_ROUTING_HTTP_DATABASE_URL','55105','nfc_v35_routing_http_test'],
  ['NFC_CONTROL_TEST_DATABASE_URL','55106','nfc_v35_control_test'],
];
function target(value,spec){
  const u=new URL(value);
  assert.ok(['postgres:','postgresql:'].includes(u.protocol),'test database protocol');
  assert.equal(u.hostname,'127.0.0.1','test database host');
  assert.equal(u.port,spec[1],'test database port');
  assert.equal(u.pathname,'/'+spec[2],'test database name');
  assert.equal(u.username,'nfc_test','ephemeral test role');
  assert.equal(u.password,'','no inherited credentials');
  assert.equal(u.search+u.hash,'','no connection overrides');
  return {variable:spec[0],port:Number(spec[1]),name:spec[2],url:u.href};
}
function authorize(t,owned,observed){
  const record=owned.get(t.name);
  assert.ok(record,'database not acquired by this runner');
  assert.equal(observed.systemId,record.systemId,'database server identity changed');
  assert.equal(observed.marker,record.marker,'database ownership marker changed');
}
function guardChecks(){
  const spec=specs[0],url='postgres://nfc_test@127.0.0.1:55105/nfc_v35_routing_test';
  const t=target(url,spec),proof={systemId:'synthetic-system',marker:'synthetic-owner'};
  const owned=new Map([[t.name,proof]]),checks=[];
  for(const [name,value] of [
    ['wrong-host',url.replace('127.0.0.1','localhost')],
    ['wrong-port',url.replace('55105','5432')],
    ['wrong-name',url.replace('nfc_v35_routing_test','production')],
    ['connection-override',url+'?host=elsewhere'],
  ]){assert.throws(()=>target(value,spec));checks.push({name,rejectedBeforeReset:true});}
  for(const [name,map,observed] of [
    ['unowned-target',new Map(),proof],
    ['changed-server',owned,{...proof,systemId:'different'}],
    ['changed-owner',owned,{...proof,marker:'different'}],
  ]){assert.throws(()=>authorize(t,map,observed));checks.push({name,rejectedBeforeReset:true});}
  return checks;
}
if(process.argv.includes('--check-guards')){
  console.log(JSON.stringify({helperChecks:guardChecks(),databaseResets:0}));
  process.exit(0);
}

const reportDir=process.env.NFC_CI_REPORT_DIR?resolve(process.env.NFC_CI_REPORT_DIR):mkdtempSync(join(tmpdir(),'nfc-ci-'));
assert.ok(reportDir!==service&&!reportDir.startsWith(service+'/'),'evidence must be outside source');
mkdirSync(reportDir,{recursive:true});
const report={scope:'OWNED_LOOPBACK_SYNTHETIC_CI_ONLY',node:process.version,helperChecks:guardChecks(),files:[],resets:[],cleanup:[],aggregate:{tests:0,pass:0,fail:0,cancelled:0,skipped:0,todo:0}};
const save=()=>writeFileSync(join(reportDir,'summary.json'),JSON.stringify(report,null,2)+'\n');
const targets=specs.map(s=>target(process.env[s[0]],s));
const marker='nfc-ci-owned-'+randomUUID(),owned=new Map(),pools=new Map();
const pool=t=>{
  if(!pools.has(t.port))pools.set(t.port,new pg.Pool({host:'127.0.0.1',port:t.port,user:'nfc_test',password:'',database:'postgres',ssl:false,options:'',max:1,connectionTimeoutMillis:5000}));
  return pools.get(t.port);
};
async function observation(t){
  const p=pool(t);
  const version=Number((await p.query('SHOW server_version_num')).rows[0].server_version_num);
  assert.equal(Math.floor(version/10000),17,'PostgreSQL17 required');
  const systemId=(await p.query('SELECT system_identifier::text AS id FROM pg_control_system()')).rows[0].id;
  const rows=(await p.query("SELECT shobj_description(oid,'pg_database') AS marker FROM pg_database WHERE datname=$1",[t.name])).rows;
  return {systemId,exists:rows.length===1,marker:rows[0]?.marker??null};
}
async function create(t){
  const p=pool(t);
  await p.query('CREATE DATABASE "'+t.name+'"');
  await p.query('COMMENT ON DATABASE "'+t.name+'" IS \''+marker+'\'');
  const observed=await observation(t);
  assert.equal(observed.marker,marker);
  owned.set(t.name,{systemId:observed.systemId,marker});
}
async function remove(t){
  // Validate the endpoint again and ownership before the first destructive query.
  target(t.url,specs.find(s=>s[0]===t.variable));
  authorize(t,owned,await observation(t));
  await pool(t).query('DROP DATABASE "'+t.name+'" WITH (FORCE)');
  owned.delete(t.name);
}

// Only harmless platform paths and the explicit owned test endpoints reach tests.
// DATABASE_URL, arbitrary PG settings, application credentials and inherited NODE_OPTIONS do not.
const childEnv={NODE_ENV:'test',NFC_TELEGRAM_ENABLED:'false',NFC_V2_MODE:'disabled'};
for(const key of ['PATH','TMPDIR','TMP','TEMP','LANG','LC_ALL','NFC_PG17_BIN','NFC_PG17_CONTAINER_ID'])if(process.env[key])childEnv[key]=process.env[key];
for(const t of targets)childEnv[t.variable]=t.url;
const networkDir=join(reportDir,'network');mkdirSync(networkDir,{recursive:true});
const guard=`import {writeFileSync} from 'node:fs';const real=globalThis.fetch;let loopback=0,blocked=0;globalThis.fetch=(input,options)=>{const u=new URL(input instanceof Request?input.url:String(input));if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname)){blocked++;throw Error('CI external fetch forbidden');}loopback++;return real(input,options);};process.on('exit',()=>writeFileSync(${JSON.stringify(networkDir)}+'/'+process.pid+'.json',JSON.stringify({loopback,blocked,externalSent:0})));`;
childEnv.NODE_OPTIONS='--import=data:text/javascript;base64,'+Buffer.from(guard).toString('base64');
try{
  for(const t of targets)assert.equal((await observation(t)).exists,false,'refuse pre-existing database '+t.name);
  for(const t of targets)await create(t);
  report.ownership={acquiredFresh:true,markerSha256:createHash('sha256').update(marker).digest('hex'),targets:targets.map(t=>({name:t.name,host:'127.0.0.1',port:t.port,systemId:owned.get(t.name).systemId}))};
  const bin=childEnv.NFC_PG17_BIN;assert.ok(bin,'matching PostgreSQL17 backup clients required');
  report.backupClients={};
  for(const name of ['pg_dump','pg_restore']){
    const p=spawnSync(join(bin,name),['--version'],{env:childEnv,encoding:'utf8'});
    assert.equal(p.status,0,p.stderr);assert.match(p.stdout,/\(PostgreSQL\) 17\./);report.backupClients[name]=p.stdout.trim();
  }
  const files=readdirSync(join(service,'tests')).filter(n=>n.endsWith('.test.ts')).sort();
  assert.equal(files.length,22,'complete existing gateway test inventory');
  report.inventory=files;save();
  for(const file of files){
    for(const t of targets){await remove(t);await create(t);report.resets.push({before:file,database:t.name,port:t.port,ownershipVerified:true});}
    console.log('[isolated gateway CI] '+file);
    const result=spawnSync(process.execPath,['--experimental-strip-types','--test','--test-reporter=tap',join(service,'tests',file)],{cwd:service,env:childEnv,encoding:'utf8',timeout:300000,maxBuffer:32*1024*1024});
    const output=(result.stdout??'')+(result.stderr??'');
    writeFileSync(join(reportDir,file+'.log'),output);process.stdout.write(output);
    const counts={};
    for(const key of Object.keys(report.aggregate)){
      const matches=[...output.matchAll(new RegExp('^# '+key+' (\\d+)$','gm'))];
      counts[key]=matches.length?Number(matches.at(-1)[1]):null;
      report.aggregate[key]+=counts[key]??0;
    }
    const pass=result.status===0&&counts.tests>0&&counts.tests===counts.pass&&['fail','cancelled','skipped','todo'].every(k=>counts[k]===0);
    report.files.push({file,exitCode:result.status,signal:result.signal,error:result.error?.code??null,counts,pass});save();
  }
  assert.ok(report.files.every(f=>f.pass),'every existing file must pass without skips');
  assert.equal(report.aggregate.tests,367,'all existing gateway tests required');
  report.pass=true;
}catch(error){report.pass=false;report.error=error.message;process.exitCode=1;}
finally{
  for(const t of targets)if(owned.has(t.name)){
    try{await remove(t);report.cleanup.push({database:t.name,droppedOwned:true});}
    catch(error){report.cleanup.push({database:t.name,droppedOwned:false,error:error.message});report.pass=false;process.exitCode=1;}
  }
  for(const p of pools.values())await p.end();
  save();console.log('[isolated gateway CI] '+JSON.stringify({files:report.files.length,...report.aggregate,helperChecks:report.helperChecks.length,pass:report.pass,reportDir}));
}
