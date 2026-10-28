/** Real PG17 COMMIT/HTTP/restore in a freshly owned synthetic DB. No external sender. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID,createHmac} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {Readable} from 'node:stream';
import {execFileSync} from 'node:child_process';
import {database,migrate,persist} from '../src/nfc-card/store.ts';
import {parseNfcLead,ORIGIN} from '../src/nfc-card/contract.ts';
import {createNfcHandler} from '../src/nfc-card/handler.ts';
import {readV2Config} from '../src/nfc-card/v2/config.ts';
import {composeNfcHandlers,v2SchemaReady} from '../src/nfc-card/v2/runtime.ts';
import {migrateV2,persistV2,publicationPage,GENERATION} from '../src/nfc-card/v2/store.ts';
import {normalizeRequest,requestDigest,validateReceipt} from '../src/nfc-card/v2/contract.ts';
import {planV2Rights,eraseSyntheticV2} from '../src/nfc-card/v2/rights.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/nfc-v35-requests.json',import.meta.url),'utf8'));
test('v36.2 production contracts on isolated native PG17, actual HTTP and backup restore',{skip:!process.env.NFC_TEST_DATABASE_URL},async t=>{
 const url=new URL(process.env.NFC_TEST_DATABASE_URL!);assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname.endsWith('_test')&&!url.search);
 const admin=database(url.href),name='nfc_v35_release_'+randomUUID().replaceAll('-','')+'_test',restoreName='nfc_v35_restore_'+randomUUID().replaceAll('-','')+'_test';
 const checks:Record<string,unknown>[]=[];let pool:ReturnType<typeof database>|undefined,restored:ReturnType<typeof database>|undefined,server:ReturnType<typeof createServer>|undefined;
 const record=async(name:string,fn:()=>Promise<void>)=>{let failure:unknown;await t.test(name,async()=>{try{await fn();checks.push({name,status:'PASS'});}catch(e){failure=e;throw e;}});if(failure)throw failure;};
 const pg=(await admin.query("SELECT current_database() AS db,current_setting('server_version_num') AS version")).rows[0];assert.match(String(pg.version),/^17/);
 await admin.query('CREATE DATABASE "'+name+'"');url.pathname='/'+name;pool=database(url.href);
 try{
  await migrate(pool);const v1secret=randomBytes(32).toString('hex'),secret=randomBytes(32).toString('hex'),reader=randomBytes(32).toString('hex');
  const policyFile=new URL('../policies/nfc-card-v37-approved.json',import.meta.url).pathname;
  const config=readV2Config({NFC_V2_MODE:'approved-intake',NFC_V2_ORIGIN:ORIGIN,NFC_V2_SECRET:secret,NFC_V2_INBOUND_READ_SECRET:reader,NFC_DATABASE_URL:url.href,NFC_V2_POLICY_FILE:policyFile,RAILWAY_GIT_COMMIT_SHA:'1'.repeat(40)}),policy=config.policy!;
  const oldBody={language:'uk',product:'branded-review-card',quantity:2,customerName:'Synthetic preserved legacy',contact:{preferredMethod:'email',email:'legacy@example.invalid'},sourcePage:'/nfc-card-website/solutions/branded-review-card',selection:{variant:'branded',quantity:'2'},consent:true,formVersion:'NFC-CARD-FORM-V36',privacyNoticeVersion:'NFC-CARD-PRIVACY-V35',emailProposal:{intent:'commercial_offer_by_email',businessName:'Synthetic Demo',niche:'other',requested:true}};
  const oldLead=parseNfcLead(oldBody,true),legacyKey=randomUUID(),oldReceipt=await persist(pool,oldLead,legacyKey,{deliveryEnabled:false});
  // Owned synthetic fixture models the historical agreed2600quote; production is never repriced.
  await pool.query("UPDATE nfc_card.leads SET price_quote=jsonb_set(price_quote,'{amount}','2600'::jsonb) WHERE lead_id=$1",[oldReceipt.leadId]);
  const legacyBefore=(await pool.query('SELECT row_to_json(l) AS row FROM nfc_card.leads l WHERE lead_id=$1',[oldReceipt.leadId])).rows[0].row;
  await record('additive012 migration retains populated legacy rows/outbox/oldquote and is idempotent',async()=>{
   assert.equal((await migrateV2(pool!,{isolatedSyntheticDatabase:true})).applied,true);assert.equal((await migrateV2(pool!,{isolatedSyntheticDatabase:true})).applied,false);assert.equal(await v2SchemaReady(pool!),true);
   assert.deepEqual((await pool!.query('SELECT row_to_json(l) AS row FROM nfc_card.leads l WHERE lead_id=$1',[oldReceipt.leadId])).rows[0].row,legacyBefore);
   assert.equal((await persist(pool!,oldLead,legacyKey)).quote?.amount,2600);
  });
  const legacyConfig={secret:v1secret,databaseUrl:url.href,publicIntake:true,telegramEnabled:false,testOnly:false,inboundReadSecret:randomBytes(32).toString('hex')};
  const handle=composeNfcHandlers(pool,createNfcHandler(pool,legacyConfig,{currentPolicy:policy}),config);
  server=createServer(async(incoming,outgoing)=>{try{const headers=new Headers();for(const[k,v]of Object.entries(incoming.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);const body=['GET','HEAD'].includes(incoming.method??'GET')?undefined:Readable.toWeb(incoming);const r=await handle(new Request('http://gateway.internal'+incoming.url,{method:incoming.method,headers,body,...(body?{duplex:'half'}:{})}as RequestInit));outgoing.writeHead(r?.status??404,Object.fromEntries(r?.headers??[]));outgoing.end(r?await r.text():'{}');}catch{outgoing.writeHead(500);outgoing.end('{}');}});
  await new Promise<void>(r=>server!.listen(0,'127.0.0.1',r));const addr=server.address();assert.ok(addr&&typeof addr!=='string');const origin='http://127.0.0.1:'+addr.port,V2='/v2/public/requests/nfc-card';
  const get=async(path:string,headers:Record<string,string>={})=>{assert.ok(path.startsWith('/'));return fetch(origin+path,{headers});};
  const post=async(path:string,wire:unknown,key:string)=>fetch(origin+path,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(wire)});
  const saved:any[]=[];
  await record('public status exposes only exact approved policy/schema/pricing/release metadata',async()=>{const r=await get(V2+'/status');assert.equal(r.status,200);const b=await r.json();assert.equal(b.policySha256,'d76bda8aff9b69e79731a2a536254e8c6e6b9d8b62faa986407f06e3e05806b4');assert.equal(b.gatewayCommit,'1'.repeat(40));assert.equal(b.mode,'approved-intake');assert.equal(b.formVersion,'NFC-CARD-FORM-V37');assert.equal(JSON.stringify(b).includes('secret'),false);});
  await record('all82 approved-policy fixtures COMMIT with server quotes, rich lines and exact-key replay over HTTP',async()=>{
   for(const example of fixtures.positive){
    const wire=structuredClone(example.wire);wire.customerName='Synthetic PG HTTP';wire.contact={preferredMethod:'email',email:'qa@example.invalid',...(wire.lines.some((x:any)=>x.entryId==='nfc-instagram-card')?{preferredMethod:'whatsapp',phone:'+12025550123'}:{})};wire.consent={requestProcessing:true,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion};
    const key=randomUUID(),challenge=await get(V2+'/challenge?sourcePage='+encodeURIComponent(wire.sourcePage));assert.equal(challenge.status,200);wire.challenge=(await challenge.json()).challenge;
    // Test clock is not changed: each actually issued challenge waits the real browser minimum.
    await new Promise(r=>setTimeout(r,2050));
    const r=await post(V2,wire,key);assert.equal(r.status,202,example.id+' '+await r.clone().text());const receipt=await r.json(),n=normalizeRequest(wire,{consentProfile:policy});assert.equal(validateReceipt(n,receipt),true);assert.equal(receipt.durableSaved,true);assert.equal(receipt.notificationStatus,'disabled');
    assert.deepEqual(await(await post(V2,wire,key)).json(),receipt);saved.push({key,wire,n,receipt});
   }
   assert.equal(saved.length,82);assert.equal((await pool!.query('SELECT count(*)::int AS n FROM nfc_card.v2_requests')).rows[0].n,82);
  });
  await record('actual PG shared identity namespace returns409 both directions and preserves original receipts',async()=>{
   await assert.rejects(persistV2(pool!,saved[0].n,legacyKey,{policyBinding:{scope:policy.scope,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion,policySha256:policy.policySha256,approvalReference:policy.approvalReference}}),(e:any)=>e.status===409);
   await assert.rejects(persist(pool!,oldLead,saved[0].key),(e:any)=>e.status===409);assert.equal((await persist(pool!,oldLead,legacyKey)).quote?.amount,2600);
  });
  await record('V36 currentnotice preserves explicit email request and generic V34 messenger fallback in actual PG',async()=>{
   for(const email of [true,false]){
    const body={...oldBody,privacyNoticeVersion:policy.privacyNoticeVersion,currentPolicySha256:policy.policySha256,...(!email?{formVersion:'NFC-CARD-FORM-V34',emailProposal:undefined,contact:{preferredMethod:'viber',phone:'+12025550123'}}:{})};
    const n=parseNfcLead(body,true,{currentPolicy:policy}),r=await persist(pool!,n,randomUUID(),{deliveryEnabled:false});const row=(await pool!.query('SELECT processing_evidence FROM nfc_card.leads WHERE lead_id=$1',[r.leadId])).rows[0].processing_evidence;
    assert.equal(row.policyBinding.policySha256,policy.policySha256);assert.equal(row.privacyNoticeVersion,policy.privacyNoticeVersion);assert.equal(!!row.emailProposal,email);assert.equal(row.emailMarketingPermission,false);
   }
  });
  await record('signed private feed is dedicated-reader authenticated and includes full mixed-cart COMMIT receipts',async()=>{
   const path='/v2/internal/nfc-card/requests?afterSeq=0&generation='+GENERATION,at=String(Date.now());const headers={'x-nfc-timestamp':at,'x-nfc-hmac':createHmac('sha256',reader).update(at+'.'+path).digest('hex')};
   assert.equal((await get(path,{'x-nfc-timestamp':at,'x-nfc-hmac':createHmac('sha256',secret).update(at+'.'+path).digest('hex')})).status,401);
   const r=await get(path,headers);assert.equal(r.status,200);const b=await r.json();assert.equal(b.items.length,82);assert.ok(b.items.some((x:any)=>x.receipt.acceptedRequest.lines.length>1));assert.ok(b.items.some((x:any)=>x.receipt.quote.completeness==='partial'));assert.equal(b.items[0].receipt.durableSaved,true);
  });
  await record('COMMIT survives a fresh pool/connection, no notification transport is enabled',async()=>{const fresh=database(url.href);try{assert.equal((await fresh.query('SELECT count(*)::int AS n FROM nfc_card.v2_requests')).rows[0].n,82);assert.equal((await fresh.query('SELECT count(*)::int AS n FROM nfc_card.v2_notification_outbox WHERE delivery_enabled OR state<>\'disabled\'')).rows[0].n,0);assert.deepEqual((await fresh.query('SELECT receipt FROM nfc_card.v2_requests WHERE request_id=$1',[saved[0].receipt.requestId])).rows[0].receipt,saved[0].receipt);}finally{await fresh.end();}});
  const snapshotEnv={...process.env,PGHOST:url.hostname,PGPORT:url.port,PGUSER:decodeURIComponent(url.username),PGPASSWORD:decodeURIComponent(url.password),PGDATABASE:name};
  const pgBin=process.env.NFC_PG17_BIN??'/opt/homebrew/opt/postgresql@17/bin';
  const dump=execFileSync(pgBin+'/pg_dump',['--format=custom','--no-owner','--no-acl'],{env:snapshotEnv,maxBuffer:32*1024*1024});
  await record('synthetic erasure scrubs every gateway PIIdata copy, keeps410 and advances feed without newshape',async()=>{
   const target=saved[0],plan=await planV2Rights(pool!,target.receipt.requestId);assert.equal(plan.automaticallyDeletes,false);await eraseSyntheticV2(pool!,target.receipt.requestId,plan.planSha256);
   await assert.rejects(persistV2(pool!,target.n,target.key,{policyBinding:{scope:policy.scope,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion,policySha256:policy.policySha256,approvalReference:policy.approvalReference}}),(e:any)=>e.status===410);
   const page=await publicationPage(pool!,0);assert.equal(page.items.length,81);assert.ok(!page.items.some((x:any)=>x.receipt.requestId===target.receipt.requestId));assert.ok(page.next.afterSeq>=82);
  });
  await record('actual synthetic custom backup restores, then restriction reapplies before receiver can read/recreate',async()=>{
   await admin.query('CREATE DATABASE "'+restoreName+'"');execFileSync(pgBin+'/pg_restore',['--no-owner','--no-acl','--dbname='+restoreName],{env:{...snapshotEnv,PGDATABASE:restoreName},input:dump,maxBuffer:32*1024*1024});
   const restoredUrl=new URL(url);restoredUrl.pathname='/'+restoreName;restored=database(restoredUrl.href);assert.equal((await restored.query('SELECT count(*)::int AS n FROM nfc_card.v2_requests')).rows[0].n,82);
   const target=saved[0],plan=await planV2Rights(restored,target.receipt.requestId);await eraseSyntheticV2(restored,target.receipt.requestId,plan.planSha256);assert.equal((await publicationPage(restored,0)).items.length,81);
   await assert.rejects(persistV2(restored,target.n,target.key,{policyBinding:{scope:policy.scope,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion,policySha256:policy.policySha256,approvalReference:policy.approvalReference}}),(e:any)=>e.status===410);
  });
 }finally{
  if(server)await new Promise<void>(r=>server!.close(()=>r()));await restored?.end();await pool?.end();
  await admin.query('DROP DATABASE IF EXISTS "'+restoreName+'"');await admin.query('DROP DATABASE "'+name+'"');await admin.end();
  if(process.env.NFC_V362_PG_EVIDENCE)writeFileSync(process.env.NFC_V362_PG_EVIDENCE,JSON.stringify({scope:'Isolated native PG17 owned synthetic databases only',checks,pass:checks.length,productionConnections:0,notificationCalls:0,ownedDatabasesRemoved:true},null,2)+'\n');
 }
});
