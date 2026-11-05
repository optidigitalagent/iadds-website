import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {routeEntries,planV1,planV2,readRoutingConfig,ROUTING_APPROVAL,ENTRY_ROUTE,drainRoutes,migrationSql,migrationSha,routingSchemaReady,type RoutingConfig} from '../src/nfc-card/order-routing.ts';
import {orderTelegram} from '../src/nfc-card/telegram.ts';
import {database,migrate,persist} from '../src/nfc-card/store.ts';
import {parseNfcLead} from '../src/nfc-card/contract.ts';
import {persistV2,migrateV2} from '../src/nfc-card/v2/store.ts';
import {normalizeRequest} from '../src/nfc-card/v2/contract.ts';
import {ACTIVE_ENTRIES,MENU_VARIANTS} from '../src/nfc-card/v2/registry.ts';
import {readV2Config} from '../src/nfc-card/v2/config.ts';
import {drain} from '../src/nfc-card/outbox.ts';
import type {GatewayConfig} from '../src/config.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/nfc-v35-requests.json',import.meta.url),'utf8'));
const wireFor=(entry:string)=>{
 const f=fixtures.positive.find((x:any)=>x.wire.kind==='physical_order'&&x.wire.lines.length===1&&x.wire.lines[0].entryId===entry);
 assert.ok(f,entry);const w=structuredClone(f.wire);w.customerName='Synthetic order routing';
 w.contact=entry==='nfc-instagram-card'?{preferredMethod:'whatsapp',phone:'+12025550123'}:{preferredMethod:'email',email:'routing@example.invalid'};
 return w;
};
test('all exact active SKU routes, variants, unknown and mixed boundaries',()=>{
 assert.deepEqual(Object.keys(ENTRY_ROUTE).sort(),ACTIVE_ENTRIES.map(x=>x.entryId).sort());
 for(const entry of ACTIVE_ENTRIES){const n=normalizeRequest(wireFor(entry.entryId));const p=planV2(n);assert.equal(p.route,ENTRY_ROUTE[entry.entryId]);assert.equal(p.chatId,p.route==='ORIG'?'-5531022071':'-5441287655');}
 for(const variant of MENU_VARIANTS){const w=wireFor('nfc-menu-card');w.lines[0].variantId=variant;const n=normalizeRequest(w);assert.equal(planV2(n).route,'BRAND');assert.equal(n.lines[0].variantId,variant);}
 assert.equal(routeEntries(['review-card','nfc-instagram-card']).route,'ORIG');
 assert.deepEqual(routeEntries(['review-card','branded-review-card']),{route:'MIXED',chatId:null,reason:'NO_APPROVED_MIXED_SPLIT_RULE'});
 assert.equal(routeEntries(['fake-Mini-Review']).route,'UNKNOWN');assert.equal(routeEntries([]).route,'UNKNOWN');
 assert.equal(planV1(parseNfcLead({language:'en',product:'branded-review-card',quantity:1,customerName:'Synthetic',contact:{preferredMethod:'email',email:'a@example.invalid'},sourcePage:'/nfc-card-website/en/order'})).route,'BRAND');
});
test('routing opt-in requires exact owner policy and explicit UTC new-event boundary',()=>{
 assert.equal(readRoutingConfig({},undefined),undefined);
 for(const env of [{NFC_ORDER_ROUTING_ENABLED:'true'},{NFC_ORDER_ROUTING_ENABLED:'1'},{NFC_ORDER_ROUTING_ENABLED:'true',NFC_ORDER_ROUTING_CUTOVER:'yesterday'}])assert.throws(()=>readRoutingConfig(env,undefined));
 const policyPath=(name:string)=>fileURLToPath(new URL('../policies/'+name,import.meta.url));
 const env={NFC_V2_MODE:'approved-intake',NFC_V2_ORIGIN:'https://optidigitalagent.github.io',NFC_V2_SECRET:'a'.repeat(40),NFC_V2_INBOUND_READ_SECRET:'b'.repeat(40),NFC_DATABASE_URL:'postgres://synthetic@127.0.0.1/nfc_v35_routing_test',NFC_V2_POLICY_FILE:policyPath('nfc-card-v38-orders-approved.json'),NFC_V2_APPROVAL_FILE:policyPath('ORDER_ROUTING_OWNER_APPROVAL.json'),NFC_V2_PREVIOUS_POLICY_FILE:policyPath('nfc-card-v37-approved.json'),NFC_V2_PREVIOUS_APPROVAL_FILE:policyPath('B05_OWNER_APPROVAL.json')};
 const c=readV2Config(env);assert.equal(c.policy?.approvalReference,ROUTING_APPROVAL);assert.equal(c.previousPolicy?.privacyNoticeVersion,'NFC-CARD-PRIVACY-V37');
 assert.throws(()=>parseNfcLead({language:'uk',product:'branded-review-card',quantity:2,customerName:'Synthetic missing binding',contact:{preferredMethod:'viber',phone:'+12025550123'},sourcePage:'/nfc-card-website/solutions/branded-review-card',selection:{variant:'branded',quantity:'2'},consent:true,formVersion:'NFC-CARD-FORM-V34',privacyNoticeVersion:c.policy!.privacyNoticeVersion},true,{currentPolicy:c.policy}));
 assert.equal(readRoutingConfig({NFC_ORDER_ROUTING_ENABLED:'true',NFC_ORDER_ROUTING_CUTOVER:'2026-11-05T00:00:00.000Z'},c.policy)?.approvalReference,ROUTING_APPROVAL);
});
const cfg:GatewayConfig={sources:new Map(),token:'8722696590:synthetic_DO_NOT_SEND_123456789',chatId:'5674963513',apiTimeoutMs:1000,requestsPerMinute:30,idempotencyTtlMs:1000,maxEntries:10};
test('one document transport retains full source, verifies chat and receipt, classifies retry versus uncertain outcome',async()=>{
 const message={chatId:'-5441287655',caption:'NEW NFC CARD LEAD\n/nfc_lead@skdfjeriobot\nOrder #'+randomUUID(),fileName:'synthetic.json',bytes:Buffer.from('{"notes":"full original"}')};let calls=0;
 const send=orderTelegram(cfg,async(url,options)=>{calls++;assert.ok(String(url).endsWith('/sendDocument'));const form=options?.body as FormData;assert.equal(form.get('chat_id'),message.chatId);assert.equal(form.get('caption'),message.caption);assert.equal(await(form.get('document') as File).text(),Buffer.from(message.bytes).toString());assert.equal(JSON.parse(form.get('caption_entities') as string)[0].type,'bot_command');return Response.json({ok:true,result:{message_id:81,chat:{id:-5441287655},document:{file_unique_id:'SYNTHETIC_ONLY'}}});});
 assert.deepEqual(await send(message),{status:'sent',messageId:81,chatId:'-5441287655',documentUniqueId:'SYNTHETIC_ONLY'});assert.equal(calls,1);
 assert.deepEqual(await orderTelegram(cfg,async()=>Response.json({ok:false,error_code:429,parameters:{retry_after:30}},{status:429}))(message),{status:'retry',category:'rate_limit',retryAfter:30});
 assert.deepEqual(await orderTelegram(cfg,async()=>Response.json({ok:false,error_code:503},{status:503}))(message),{status:'retry',category:'upstream'});
 for(const transport of [async()=>{throw Error('synthetic timeout');},async()=>Response.json({ok:true,result:{message_id:1,chat:{id:-5531022071}}}),async()=>new Response('not-json')])assert.deepEqual(await orderTelegram(cfg,transport)(message),{status:'failed',category:'outcome_unknown'});
 assert.deepEqual(await orderTelegram(cfg,async()=>Response.json({ok:false,error_code:403},{status:403}))(message),{status:'failed',category:'configuration'});
});
test('durable existing PG17 outboxes: new-only, exact-key replay, concurrent replay, retry, unknown, crash and no legacy duplicate',{skip:!process.env.NFC_TEST_DATABASE_URL},async t=>{
 const u=new URL(process.env.NFC_TEST_DATABASE_URL!);assert.equal(u.hostname,'127.0.0.1');assert.equal(u.pathname,'/nfc_v35_routing_test');assert.equal(u.port,'55105');
 const pool=database(u.href),config:RoutingConfig={cutover:new Date(Date.now()-1000).toISOString(),approvalReference:ROUTING_APPROVAL};
 const oldN=normalizeRequest(wireFor('review-card')),oldKey=randomUUID();
 try{
  await migrate(pool);await migrateV2(pool,{isolatedSyntheticDatabase:true});
  const oldReceipt=await persistV2(pool,oldN,oldKey);
  const before=(await pool.query('SELECT row_to_json(o) row FROM nfc_card.v2_notification_outbox o WHERE request_id=$1',[oldReceipt.requestId])).rows[0].row;
  await pool.query('BEGIN');await pool.query(migrationSql());await pool.query("INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES('013_order_routing',$1)",[migrationSha()]);await pool.query('COMMIT');assert.equal(await routingSchemaReady(pool),true);
  assert.deepEqual(await persistV2(pool,oldN,oldKey,{orderRouting:config}),oldReceipt);
  assert.equal((await pool.query('SELECT routing_route,delivery_enabled,state FROM nfc_card.v2_notification_outbox WHERE request_id=$1',[oldReceipt.requestId])).rows[0].routing_route,null);
  assert.equal(before.delivery_enabled,false);
  const saved:any[]=[],documents:any[]=[],keys:string[]=[];let count=0;
  const sender=orderTelegram(cfg,async(_url,opts)=>{const f=opts?.body as FormData,d=JSON.parse(await(f.get('document') as File).text());documents.push({chat:f.get('chat_id'),caption:f.get('caption'),body:d});count++;return Response.json({ok:true,result:{message_id:100+count,chat:{id:Number(f.get('chat_id'))},document:{file_unique_id:'SYNTHETIC_'+count}}});});
  await t.test('every active exact entry commits and all original configurations/quotes survive fake delivery',async()=>{
   for(const entry of ACTIVE_ENTRIES){const n=normalizeRequest(wireFor(entry.entryId)),key=randomUUID(),r=await persistV2(pool,n,key,{orderRouting:config});keys.push(key);saved.push(r);assert.equal(r.notificationStatus,'queued');assert.deepEqual(await persistV2(pool,n,key,{orderRouting:config}),r);}
   for(let i=0;i<9;i++)await drainRoutes(pool,config,sender);
   assert.equal(count,9);assert.equal(documents.filter(x=>x.chat==='-5531022071').length,4);assert.equal(documents.filter(x=>x.chat==='-5441287655').length,5);
   for(const r of saved){const doc=documents.find(x=>x.body.sourceApplicationId===r.requestId);assert.deepEqual(doc.body.sourceRecord,r);assert.equal(doc.body.recordType,'LEAD');assert.equal(doc.body.sellerStatus,'UNKNOWN');assert.equal(doc.body.paymentStatus,'UNCONFIRMED');assert.ok(doc.caption.includes('NEW NFC CARD LEAD'));}
   const rows=(await pool.query("SELECT * FROM nfc_card.v2_notification_outbox WHERE state='sent'")).rows;assert.equal(rows.length,9);assert.ok(rows.every(x=>x.telegram_message_id&&x.delivery_payload_sha256&&x.attempt_count===1));
   assert.deepEqual(await persistV2(pool,saved[0].acceptedRequest,keys[0],{orderRouting:config}),saved[0]);await drainRoutes(pool,config,sender);assert.equal(count,9);
  });
  await t.test('mixed source commits once with WAIT_ROUTING; no approved split is invented',async()=>{
   const w=wireFor('review-card'),b=wireFor('branded-review-card');b.lines[0].lineId=randomUUID();w.lines.push(b.lines[0]);const n=normalizeRequest(w),key=randomUUID(),r=await persistV2(pool,n,key,{orderRouting:config});assert.equal(r.notificationStatus,'disabled');assert.deepEqual(await persistV2(pool,n,key,{orderRouting:config}),r);const row=(await pool.query('SELECT * FROM nfc_card.v2_notification_outbox WHERE request_id=$1',[r.requestId])).rows[0];assert.equal(row.state,'waiting_routing');assert.equal(row.delivery_enabled,false);await drainRoutes(pool,config,sender);assert.equal(count,9);
  });
  await t.test('concurrent exact-key handler replay returns one request and one outgoing record',async()=>{
   const key=randomUUID(),n=normalizeRequest(wireFor('review-card')),r=await Promise.all([persistV2(pool,n,key,{orderRouting:config}),persistV2(pool,n,key,{orderRouting:config})]);assert.deepEqual(r[0],r[1]);assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_notification_outbox WHERE request_id=$1',[r[0].requestId])).rows[0].n,1);await drainRoutes(pool,config,sender);assert.equal(count,10);
  });
  const save=async()=>persistV2(pool,normalizeRequest(wireFor('review-card')),randomUUID(),{orderRouting:config});
  const get=async(id:string)=>(await pool.query('SELECT * FROM nfc_card.v2_notification_outbox WHERE request_id=$1',[id])).rows[0];
  await t.test('explicit temporary failure delays retry; successful source receipt stays durable',async()=>{
   const r=await save();let attempts=0;await drainRoutes(pool,config,async()=>{attempts++;return{status:'retry',category:'rate_limit',retryAfter:30};});assert.equal((await get(r.requestId)).state,'retry');await drainRoutes(pool,config,async()=>{throw Error('must not retry before delay');});assert.equal((await get(r.requestId)).attempt_count,1);await pool.query("UPDATE nfc_card.v2_notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE request_id=$1",[r.requestId]);await drainRoutes(pool,config,sender);assert.equal((await get(r.requestId)).state,'sent');assert.equal((await get(r.requestId)).attempt_count,2);assert.equal(attempts,1);assert.deepEqual((await pool.query('SELECT receipt FROM nfc_card.v2_requests WHERE request_id=$1',[r.requestId])).rows[0].receipt,r);
  });
  await t.test('timeout/unknown and expired sending claims never blindly resend',async()=>{
   const a=await save();let attempts=0;await drainRoutes(pool,config,async()=>{attempts++;throw Error('outcome unknown');});assert.equal((await get(a.requestId)).state,'outcome_unknown');await drainRoutes(pool,config,sender);assert.equal(attempts,1);
   const b=await save();await pool.query("UPDATE nfc_card.v2_notification_outbox SET state='sending',attempt_count=1,claimed_at=now()-interval '3 minutes' WHERE request_id=$1",[b.requestId]);await drainRoutes(pool,config,async()=>{throw Error('expired claim must not send');});assert.equal((await get(b.requestId)).state,'outcome_unknown');assert.equal((await get(b.requestId)).attempt_count,1);
  });
  await t.test('temporary failures stop after four total attempts',async()=>{
   const r=await save();let calls=0;for(let i=0;i<4;i++){await drainRoutes(pool,config,async()=>{calls++;return{status:'retry',category:'upstream'};});await pool.query("UPDATE nfc_card.v2_notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE request_id=$1",[r.requestId]);}assert.equal(calls,4);assert.equal((await get(r.requestId)).state,'failed');assert.equal((await get(r.requestId)).safe_error_category,'exhausted');await drainRoutes(pool,config,sender);assert.equal(calls,4);
  });
  await t.test('v1 approved route shares durable outbox and personal dispatcher cannot double-send it',async()=>{
   const n=parseNfcLead({language:'en',product:'branded-review-card',quantity:1,customerName:'Synthetic legacy route',contact:{preferredMethod:'email',email:'legacy@example.invalid'},sourcePage:'/nfc-card-website/en/order'}),key=randomUUID(),r=await persist(pool,n,key,{orderRouting:config});assert.equal(r.notificationStatus,'queued');assert.deepEqual(await persist(pool,n,key,{orderRouting:config}),r);let personal=0;
   await drain(pool,{secret:'x'.repeat(40),databaseUrl:u.href,publicIntake:true,telegramEnabled:true,testOnly:false},async()=>{personal++;return{status:'sent'};},()=>{});assert.equal(personal,0);await drainRoutes(pool,config,sender);const row=(await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1',[r.leadId])).rows[0];assert.equal(row.routing_chat_id,'-5441287655');assert.equal(row.status,'sent');assert.ok(row.telegram_message_id);
  });
  await t.test('future cutoff does not enable old forms on replay; transaction failure leaves no partial application/outbox',async()=>{
   const n=normalizeRequest(wireFor('review-card')),key=randomUUID(),r=await persistV2(pool,n,key,{orderRouting:{...config,cutover:new Date(Date.now()+60000).toISOString()}});assert.equal(r.notificationStatus,'disabled');assert.equal((await get(r.requestId)).routing_route,null);assert.deepEqual(await persistV2(pool,n,key,{orderRouting:config}),r);
   const badKey=randomUUID();await assert.rejects(persistV2(pool,n,badKey,{orderRouting:config,beforePublish:async()=>{throw Error('synthetic transaction failure');}}));assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.v2_identity_keys WHERE idempotency_key=$1',[badKey])).rows[0].n,0);
  });
 }finally{await pool.end();}
});
