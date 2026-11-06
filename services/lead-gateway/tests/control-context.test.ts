import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {randomUUID,createHash} from 'node:crypto';
import {CONTROL_RUN,issueControlGrant,resolveControlContext,controlMigrationSql,controlMigrationSha,controlSchemaReady,controlVerifierKey} from '../src/nfc-card/control-context.ts';
import {database,migrate} from '../src/nfc-card/store.ts';
import {migrateV2,publicationPage} from '../src/nfc-card/v2/store.ts';
import {normalizeRequest} from '../src/nfc-card/v2/contract.ts';
import {createNfcV2Handler,V2_ENDPOINT} from '../src/nfc-card/v2/handler.ts';
import {readV2Config} from '../src/nfc-card/v2/config.ts';
import {migrationSql,migrationSha,drainRoutes,ROUTING_APPROVAL,planV2,routingSchemaReady} from '../src/nfc-card/order-routing.ts';
import {v2SchemaReady} from '../src/nfc-card/v2/runtime.ts';
import {fileURLToPath} from 'node:url';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/nfc-v35-requests.json',import.meta.url),'utf8'));
const secret='x'.repeat(48),run=CONTROL_RUN;
const wire=(entry='branded-review-card')=>{
 const f=fixtures.positive.find((x:any)=>x.wire.kind==='physical_order'&&x.wire.lines.length===1&&x.wire.lines[0].entryId===entry);
 const w=structuredClone(f.wire);w.customerName='Synthetic scoped control';w.lines[0].quantity=1;return w;
};
test('trusted grant binds existing UUID nonce, one exact case/SKU, expiry; public flags/words never authorize',()=>{
 const key=randomUUID(),n=normalizeRequest(wire()),token=issueControlGrant(secret,run+'-WEB-BRAND',key,1000);
 assert.equal(resolveControlContext(null,key,n,secret),null);
 assert.equal(resolveControlContext(token,key,n,secret,2000)?.state,'VALID');
 assert.equal(resolveControlContext(token,randomUUID(),n,secret,2000)?.trusted,false);
 assert.equal(resolveControlContext(token+'x',key,n,secret,2000)?.trusted,false);
 assert.equal(resolveControlContext(token,key,n,secret,86401001)?.reason,'EXPIRED_PROOF');
 const other=normalizeRequest(wire('review-card'));
 assert.equal(resolveControlContext(token,key,other,secret,2000)?.reason,'CASE_CONTENT_CONFLICT');
 assert.equal(planV2(other).route,'ORIG'); // expectation never chooses the route
 const publicMarker=structuredClone(n);publicMarker.customerName=run+'-WEB-BRAND';
 assert.equal(resolveControlContext(null,key,publicMarker,secret)?.trusted,false);
 assert.throws(()=>issueControlGrant(secret,run+'-HUMAN-BRAND',key));
 for(const raw of ['null','[]','"text"'])assert.equal(resolveControlContext(Buffer.from(raw).toString('base64url')+'.'+'a'.repeat(43),key,n,secret)?.trusted,false);
});

test('existing real HTTP + PG + outbox path with trusted, forged, repeated contexts',{skip:!process.env.NFC_CONTROL_TEST_DATABASE_URL},async t=>{
 const u=new URL(process.env.NFC_CONTROL_TEST_DATABASE_URL!);
 assert.equal(u.hostname,'127.0.0.1');assert.equal(u.port,'55106');assert.equal(u.pathname,'/nfc_v35_control_test');
 const pool=database(u.href);let clock=Date.now();const route={cutover:new Date(clock-10000).toISOString(),approvalReference:ROUTING_APPROVAL};
 const origin='https://optidigitalagent.github.io';
 const cfg=readV2Config({NFC_V2_MODE:'approved-intake',NFC_V2_ORIGIN:origin,NFC_V2_SECRET:secret,NFC_V2_INBOUND_READ_SECRET:'y'.repeat(48),NFC_DATABASE_URL:u.href,
  NFC_V2_POLICY_FILE:fileURLToPath(new URL('../policies/nfc-card-v38-orders-approved.json',import.meta.url)),NFC_V2_APPROVAL_FILE:fileURLToPath(new URL('../policies/ORDER_ROUTING_OWNER_APPROVAL.json',import.meta.url))});cfg.orderRouting=route;
 const policy=cfg.policy!;
 const bind=(w:any)=>({...w,consent:{...w.consent,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion}});
 let requests=0,dropAfterCommit=false;
 const handler=createNfcV2Handler(pool,cfg,{now:()=>clock,ready:()=>v2SchemaReady(pool)});
 const server=createServer(async(req,res)=>{
  try{
   const chunks=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));
   const body=Buffer.concat(chunks);const headers=new Headers();for(const[k,v]of Object.entries(req.headers))if(v!==undefined)headers.set(k,Array.isArray(v)?v.join(','):v);
   if(req.method==='POST')requests++;
   const out=await handler(new Request('http://127.0.0.1'+req.url,{method:req.method,headers,...(body.length?{body}: {})}));
   assert.ok(out);if(dropAfterCommit&&req.method==='POST'){dropAfterCommit=false;res.destroy();return;}
   res.writeHead(out.status,Object.fromEntries(out.headers));res.end(await out.text());
  }catch{res.writeHead(500);res.end();}
 });
 await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
 const address=server.address();assert.ok(address&&typeof address!=='string');const base='http://127.0.0.1:'+address.port;
 async function post(w:any,key:string,token?:string){
  const c=await fetch(base+V2_ENDPOINT+'/challenge?'+new URLSearchParams({sourcePage:w.sourcePage}),{headers:{Origin:origin}});const challenge=await c.json();assert.equal(c.status,200);clock+=2100;
  const response=await fetch(base+V2_ENDPOINT,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json','Idempotency-Key':key,...(token?{'X-Nfc-Control-Context':token}: {})},body:JSON.stringify({...w,challenge:challenge.challenge})});
  return {status:response.status,body:await response.json()};
 }
 const reset=async()=>{
  const tables=(await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='nfc_card' AND tablename<>'schema_migrations'")).rows.map(x=>'nfc_card.'+x.tablename);
  await pool.query('TRUNCATE '+tables.join(',')+' CASCADE');await pool.query('INSERT INTO nfc_card.v2_publication_counter(singleton,last_seq) VALUES(true,0)');
 };
 const oldSecret=process.env.NFC_V2_SECRET;process.env.NFC_V2_SECRET=secret;
 try{
  await migrate(pool);await migrateV2(pool,{isolatedSyntheticDatabase:true});
  if(!(await routingSchemaReady(pool))){await pool.query(migrationSql());await pool.query("INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES('013_order_routing',$1)",[migrationSha()]);}
  if(!(await controlSchemaReady(pool))){await pool.query(controlMigrationSql());await pool.query("INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES('014_control_context',$1)",[controlMigrationSha()]);}
  assert.equal(await controlSchemaReady(pool),true);
  await reset();
  await t.test('ordinary receipt unchanged; two approved source rows reach the existing fake Telegram sender, excluded from working publication',async()=>{
   const normal=await post(bind(wire('review-card')),randomUUID());assert.equal(normal.status,202);assert.equal(normal.body.notificationStatus,'queued');
   const messages:any[]=[];const saves:any[]=[];
   for(const [name,entry,chat]of [['WEB-BRAND','branded-review-card','-5441287655'],['WEB-ORIG','review-card','-5531022071']]){
    const key=randomUUID(),body=bind(wire(entry));body.lines[0].configuration.notes='ТЕСТ — НЕ ИЗГОТАВЛИВАТЬ\nrun_id: '+run+'\ncase_id: '+run+'-'+name;
    const token=issueControlGrant(secret,run+'-'+name,key,clock),r=await post(body,key,token);assert.equal(r.status,202);
    assert.deepEqual(await post(body,key,token),r);saves.push({caseId:run+'-'+name,key,body,token,receipt:r.body,chat});
   }
   const sender=async(m:any)=>{
    const source=JSON.parse(Buffer.from(m.bytes).toString());
    assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_requests WHERE request_id=$1',[source.sourceApplicationId])).rows[0].n,1);
    messages.push({caption:m.caption,chatId:m.chatId,fileName:m.fileName,document:source,documentBase64:Buffer.from(m.bytes).toString('base64'),sha256:createHash('sha256').update(m.bytes).digest('hex')});
    return {status:'sent' as const,chatId:m.chatId,messageId:100+messages.length};
   };
   for(let i=0;i<3;i++)await drainRoutes(pool,route,sender);
   assert.equal(messages.length,3);
   for(const item of saves){const m=messages.find(x=>x.document.sourceApplicationId===item.receipt.requestId);assert.equal(m.chatId,item.chat);assert.ok(m.caption.includes('ТЕСТ — НЕ ИЗГОТАВЛИВАТЬ'));assert.ok(m.caption.includes('CT1|'));assert.ok(m.caption.length<=1024);assert.deepEqual(m.document.sourceRecord,item.receipt);}
   const published=await publicationPage(pool,0);assert.equal(published.items.length,1);assert.equal(published.next.afterSeq,3);
   assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_requests')).rows[0].n,3);
   // Cross-language fixture uses only synthetic secrets/data and fake receipts.
   if(process.env.CONTROL_CONTEXT_FIXTURE_OUT)writeFileSync(process.env.CONTROL_CONTEXT_FIXTURE_OUT,JSON.stringify({synthetic:true,verifierKey:controlVerifierKey(secret).toString('hex'),messages:messages.filter(x=>x.document.controlContext)},null,2));
   const changed=structuredClone(saves[0].body);changed.customerName='Changed';assert.equal((await post(changed,saves[0].key,saves[0].token)).status,409);
   const secondKey=randomUUID();assert.equal((await post(saves[0].body,secondKey,issueControlGrant(secret,run+'-WEB-BRAND',secondKey,clock))).status,409);
   const withoutContext=await post(saves[0].body,saves[0].key);assert.equal(withoutContext.status,202);
   assert.equal((await pool.query('SELECT control_context FROM nfc_card.v2_requests WHERE request_id=$1',[saves[0].receipt.requestId])).rows[0].control_context.trusted,true);
   assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_requests')).rows[0].n,3);
  });
  await reset();
  await t.test('forged or missing proof is preserved as working review, never a trusted test or automatic sale',async()=>{
   for(const mode of ['forged','missing']){
    const key=randomUUID(),body=bind(wire());body.customerName=run+'-WEB-BRAND';
    const token=mode==='forged'?issueControlGrant(secret,run+'-WEB-BRAND',key,clock).slice(0,-1)+'X':undefined;
    assert.equal((await post(body,key,token)).status,202);
   }
   const rows=(await pool.query('SELECT control_context FROM nfc_card.v2_requests')).rows;
   assert.equal(rows.length,2);assert.ok(rows.every(x=>!x.control_context.trusted&&x.control_context.blockEffects&&x.control_context.state==='QUARANTINED'));
   assert.equal((await publicationPage(pool,0)).items.length,2);
   const injected=bind(wire());injected.is_test=true;assert.equal((await post(injected,randomUUID())).status,422);
  });
  await reset();
  await t.test('content conflict keeps trusted consequence guard while ordinary SKU selects actual route',async()=>{
   const key=randomUUID(),token=issueControlGrant(secret,run+'-WEB-BRAND',key,clock),r=await post(bind(wire('review-card')),key,token);assert.equal(r.status,202);
   const row=(await pool.query('SELECT r.control_context,o.routing_route,o.routing_chat_id FROM nfc_card.v2_requests r JOIN nfc_card.v2_notification_outbox o USING(request_id)')).rows[0];
   assert.equal(row.control_context.reason,'CASE_CONTENT_CONFLICT');assert.equal(row.control_context.trusted,true);assert.equal(row.routing_route,'ORIG');assert.equal(row.routing_chat_id,'-5531022071');
  });
  await reset();
  await t.test('unknown HTTP outcome leaves a durable control row; reconciliation then same-key replay keeps exactly one row',async()=>{
   const key=randomUUID(),body=bind(wire()),token=issueControlGrant(secret,run+'-WEB-BRAND',key,clock),before=requests;dropAfterCommit=true;
   await assert.rejects(post(body,key,token));assert.equal(requests,before+1);
   assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_requests')).rows[0].n,1);
   assert.equal((await post(body,key,token)).status,202);assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_requests')).rows[0].n,1);
  });
 }finally{if(oldSecret===undefined)delete process.env.NFC_V2_SECRET;else process.env.NFC_V2_SECRET=oldSecret;await new Promise<void>(resolve=>server.close(()=>resolve()));await pool.end();}
});
