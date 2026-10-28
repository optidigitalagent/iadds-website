import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {parseNfcLead,NfcError} from '../src/nfc-card/contract.ts';
import {persist} from '../src/nfc-card/store.ts';
import {policyDigest,LEGACY_NOTICE_SHA256} from '../src/nfc-card/v2/policy.ts';
import {publicationPage,GENERATION} from '../src/nfc-card/v2/store.ts';
import {createNfcV2Handler,V2_ENDPOINT} from '../src/nfc-card/v2/handler.ts';
import {CORE_SHA256,DIGEST_PROFILE,NORMALIZATION_PROFILE} from '../src/nfc-card/v2/contract.ts';
const policy={ownerApproved:true as const,scope:'NFC_CARD_V2_RICH_REQUEST' as const,formVersion:'NFC-CARD-FORM-V37',privacyNoticeVersion:'NFC-CARD-PRIVACY-V37',approvalReference:'OFFLINE SYNTHETIC UNIT POLICY ONLY',legacyNoticeSha256:LEGACY_NOTICE_SHA256,checkbox:{uk:'Test',en:'Test',pl:'Test'},sections:{uk:[{heading:'Test',text:'Offline test only'}],en:[{heading:'Test',text:'Offline test only'}],pl:[{heading:'Test',text:'Offline test only'}]},policySha256:''};policy.policySha256=policyDigest(policy);
const old=()=>({language:'uk',product:'branded-review-card',quantity:2,customerName:'Synthetic current notice',contact:{preferredMethod:'email',email:'Case+qa@example.invalid'},sourcePage:'/nfc-card-website/solutions/branded-review-card/',selection:{variant:'branded',quantity:'2'},consent:true,formVersion:'NFC-CARD-FORM-V36',privacyNoticeVersion:'NFC-CARD-PRIVACY-V35',emailProposal:{intent:'commercial_offer_by_email',businessName:'Synthetic Demo',niche:'other',requested:true}});
const current=()=>({...old(),privacyNoticeVersion:policy.privacyNoticeVersion,currentPolicySha256:policy.policySha256});
test('current V36 notice/hash requires exact approved config, form, source and proposal authority',()=>{
 const n=parseNfcLead(current(),true,{currentPolicy:policy});assert.equal(n.notice?.privacyNoticeVersion,policy.privacyNoticeVersion);assert.equal(n.notice?.policyBinding?.policySha256,policy.policySha256);assert.equal(n.emailProposal?.intent,'commercial_offer_by_email');
 assert.throws(()=>parseNfcLead(current(),true));
 for(const patch of [{currentPolicySha256:'0'.repeat(64)},{currentPolicySha256:undefined},{formVersion:'NFC-CARD-FORM-V35'},{product:'review-card'},{sourcePage:'/nfc-card-website/order'},{formVersion:'NFC-CARD-FORM-V34'},{privacyNoticeVersion:'NFC-CARD-PRIVACY-V35'}])assert.throws(()=>parseNfcLead({...current(),...patch},true,{currentPolicy:policy}));
 assert.throws(()=>parseNfcLead(current(),true,{currentPolicy:{...policy,ownerApproved:false}as any}));
});
test('generic messenger fallback preserves V34; never invents email proposal',()=>{
 const {emailProposal,...body}=current();assert.equal(emailProposal.requested,true);
 const n=parseNfcLead({...body,formVersion:'NFC-CARD-FORM-V34',contact:{preferredMethod:'viber',phone:'+12025550123'}},true,{currentPolicy:policy});
 assert.equal(n.notice?.formVersion,'NFC-CARD-FORM-V34');assert.equal(n.notice?.privacyNoticeVersion,policy.privacyNoticeVersion);assert.equal(n.emailProposal,undefined);assert.equal(n.contact.preferredMethod,'viber');
});
test('historical V36/V35 normalized JSON is unchanged even when current policy configured',()=>{
 const a=parseNfcLead(old(),true),b=parseNfcLead(old(),true,{currentPolicy:policy});assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.notice?.policyBinding,undefined);assert.deepEqual(Object.keys(a.notice!).sort(),['capture','consent','formVersion','privacyNoticeVersion']);
});
test('new V36 processing evidence preserves current binding and request-specific email intent',async()=>{
 const n=parseNfcLead(current(),true,{currentPolicy:policy});let evidence:any;
 const pool={connect:async()=>({release(){},query:async(sql:string,args:any[])=>{if(sql.startsWith('INSERT INTO nfc_card.leads')){evidence=JSON.parse(args[35]);return{rowCount:1,rows:[{}]};}return{rows:[]};}})}as any;
 const r=await persist(pool,n,randomUUID(),{deliveryEnabled:false});assert.equal(r.quote?.amount,3600);assert.equal(evidence.policyBinding.policySha256,policy.policySha256);assert.equal(evidence.formVersion,'NFC-CARD-FORM-V36');assert.equal(evidence.privacyNoticeVersion,policy.privacyNoticeVersion);assert.equal(evidence.emailProposal.intent,'commercial_offer_by_email');assert.equal(evidence.replyEmail,'case+qa@example.invalid');assert.equal(evidence.emailMarketingPermission,false);
});
test('v1 exact new identity-fence constraints map409/410, unrelated failures remain503',async()=>{
 for(const[code,constraint,status]of [['23505','v2_identity_global_key',409],['23514','v2_identity_tombstone',410],['23505','unrelated_constraint',503],['23514','unrelated_constraint',503]]){
  const pool={connect:async()=>({release(){},query:async(sql:string)=>{if(sql.startsWith('INSERT'))throw{code,constraint};return{rows:[]};}})}as any;
  await assert.rejects(persist(pool,parseNfcLead(old(),true),randomUUID()),(e:any)=>e instanceof NfcError&&e.status===status);
 }
});
const tombstone=()=>{const id=randomUUID();return{seq:'5',generation:GENERATION,entity_kind:'cart_request',request_id:id,published_request_id:id,cart_request_id:id,idempotency_key:randomUUID(),state:'tombstone',tombstoned:true,normalized:null,receipt:null,outbox_payload:{schemaVersion:2,requestId:id,idempotencyTombstone:true},normalization_profile:NORMALIZATION_PROFILE,identity_registry_revision:CORE_SHA256,digest_profile:DIGEST_PROFILE,request_digest:'a'.repeat(64)};};
test('complete scrubbed tombstone advances feed without new item/receipt shape',async()=>{
 const row=tombstone(),page=await publicationPage({query:async()=>({rows:[row]})}as any,0);assert.deepEqual(page,{schemaVersion:2,generation:GENERATION,items:[],next:{generation:GENERATION,afterSeq:5}});
});
test('partial/corrupt erasure fails closed and cannot silently skip an accepted record',async()=>{
 for(const patch of [{tombstoned:false},{state:'accepted'},{normalized:{}},{receipt:{}},{outbox_payload:{}},{request_digest:'bad'},{published_request_id:randomUUID()}])await assert.rejects(publicationPage({query:async()=>({rows:[{...tombstone(),...patch}]})}as any,0),(e:any)=>e.code==='unavailable');
});
test('legacy migration runner and server never auto apply012; SQL bytes are immutable',()=>{
 const source=readFileSync(new URL('../src/nfc-card/store.ts',import.meta.url),'utf8'),server=readFileSync(new URL('../src/server.ts',import.meta.url),'utf8');assert.ok(!source.includes("'012_v35_enquiries'"));assert.ok(!server.includes('migrateV2'));assert.ok(server.includes('composeNfcHandlers'));
});

test('read-only deploymentstatus fails closed for disabled/synthetic/schema failure and leaks no secrets',async()=>{
 const fakePool={query:async()=>{throw Error('must not read customer data');}}as any;
 const request=()=>new Request('http://local'+V2_ENDPOINT+'/status');
 assert.equal((await createNfcV2Handler(fakePool,{mode:'disabled',origin:'',secret:'',databaseName:''})(request()))?.status,503);
 const preview={mode:'synthetic-preview' as const,origin:'http://127.0.0.1:4196',secret:'offline browser synthetic secret 1234567890',inboundReadSecret:'offline reader synthetic secret 1234567890',databaseName:'nfc_v35_status_test'};
 assert.equal((await createNfcV2Handler(fakePool,preview,{ready:async()=>true})(request()))?.status,503);
 const approved={...preview,mode:'approved-intake' as const,origin:'https://optidigitalagent.github.io',policy,gatewayCommit:'a'.repeat(40)};
 assert.equal((await createNfcV2Handler(fakePool,approved,{ready:async()=>false})(request()))?.status,503);
 const ready=createNfcV2Handler(fakePool,approved,{ready:async()=>true});const r=await ready(request());assert.equal(r?.status,200);const b=await r!.json();assert.deepEqual(Object.keys(b).sort(),['apiVersion','contractId','formVersion','gatewayCommit','mode','ok','policySha256','pricingRevision','privacyNoticeVersion','service']);assert.equal(b.gatewayCommit,'a'.repeat(40));assert.equal(b.policySha256,policy.policySha256);
 assert.equal((await ready(new Request('http://local'+V2_ENDPOINT+'/status',{method:'POST',body:'not read'})))?.status,405);
});
