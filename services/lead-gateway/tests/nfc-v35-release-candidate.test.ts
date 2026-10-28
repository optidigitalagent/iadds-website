import type {Pool} from 'pg';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac,createHash} from 'node:crypto';
import {readFileSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {readV2Config} from '../src/nfc-card/v2/config.ts';
import {approvedPolicy,SYNTHETIC_PROFILE,policyDigest,LEGACY_NOTICE_SHA256} from '../src/nfc-card/v2/policy.ts';
import {composeNfcHandlers,v2SchemaReady,V2_MIGRATION_SHA256} from '../src/nfc-card/v2/runtime.ts';
import {createNfcV2Handler,issueChallenge,verifyV2Challenge,V2_ENDPOINT} from '../src/nfc-card/v2/handler.ts';
import {normalizeRequest,parseWire,requestDigest,buildReceipt,validateReceipt,NfcV2Error} from '../src/nfc-card/v2/contract.ts';
import {persistV2} from '../src/nfc-card/v2/store.ts';
import {groupPrice} from '../src/nfc-card/v2/registry.ts';
const fixtures=JSON.parse(readFileSync(new URL('./fixtures/nfc-v35-requests.json',import.meta.url),'utf8'));
const wire=()=>structuredClone(fixtures.positive[0].wire);
const policy={ownerApproved:true as const,scope:'NFC_CARD_V2_RICH_REQUEST' as const,formVersion:'TEST-ONLY-NFC-FORM-2',privacyNoticeVersion:'TEST-ONLY-NFC-NOTICE-2',approvalReference:'OFFLINE TEST ONLY, NOT OWNER APPROVAL',legacyNoticeSha256:LEGACY_NOTICE_SHA256,checkbox:{uk:'Offline unit test uk',en:'Offline unit test en',pl:'Offline unit test pl'},sections:{uk:[{heading:'Offline test',text:'This is an isolated test fixture uk.'}],en:[{heading:'Offline test',text:'This is an isolated test fixture en.'}],pl:[{heading:'Offline test',text:'This is an isolated test fixture pl.'}]},policySha256:''};
policy.policySha256=policyDigest(policy);
const secret='synthetic browser secret 123456789012345',reader='synthetic reader secret 1234567890123456';
const env={NFC_V2_MODE:'synthetic-preview',NFC_V2_ORIGIN:'http://127.0.0.1:4189',NFC_V2_SECRET:secret,NFC_V2_INBOUND_READ_SECRET:reader,NFC_DATABASE_URL:'postgresql://synthetic:synthetic@127.0.0.1/nfc_v35_rc_test'};
function fakePool(rows:unknown[]=[]){return {query:async()=>({rows}),connect:async()=>{throw new Error('unexpected DB write');}} as unknown as Pool;}
test('default disabled v2 composes with untouched v1 and unrelated routes; no DB accessed',async()=>{
 assert.equal(readV2Config({}).mode,'disabled');let legacy=0;
 const handler=composeNfcHandlers(undefined,async r=>{legacy++;return new Response(new URL(r.url).pathname,{status:201});},readV2Config({}));
 assert.equal((await handler(new Request('http://local/v1/public/leads/nfc-card')))?.status,201);
 assert.equal((await handler(new Request('http://local/v1/leads')))?.status,201);
 assert.equal((await handler(new Request('http://local'+V2_ENDPOINT)))?.status,503);assert.equal(legacy,2);
});
test('runtime config enforces isolated preview and separate v1/v2 browser/feed keys',()=>{
 assert.equal(readV2Config(env).mode,'synthetic-preview');
 for(const patch of [{NFC_V2_MODE:'guess'},{NFC_V2_INBOUND_READ_SECRET:secret},{LEAD_SOURCE_NFC_CARD_SECRET:secret},{NFC_V2_ORIGIN:'https://nfc-card.com'},{NFC_DATABASE_URL:'postgresql://s:s@127.0.0.1/production'}])assert.throws(()=>readV2Config({...env,...patch}));
 assert.throws(()=>composeNfcHandlers(undefined,undefined,readV2Config(env)),/database_required/);
});
test('approved intake requires scope/hash/reference/exact real versions and excludes synthetic/proposal policy',()=>{
 assert.equal(approvedPolicy(policy),true);
 for(const patch of [{ownerApproved:false},{scope:'GENERIC'},{policySha256:'wrong'},{approvalReference:''},{formVersion:'SYNTHETIC-NOT-APPROVED'},{privacyNoticeVersion:'PHASE3-PROPOSAL'},{legacyNoticeSha256:'a'.repeat(64)},{sections:{...policy.sections,en:[{heading:'Modified',text:'Copy changed without changing the approval hash'}]}}])assert.equal(approvedPolicy({...policy,...patch}),false);
 const production={...env,NFC_V2_MODE:'approved-intake',NFC_V2_ORIGIN:'https://nfc-card.com'};
 assert.throws(()=>readV2Config(production),/notice_policy_not_approved/);
 const dir=mkdtempSync(join(tmpdir(),'nfc-rc-policy-'));try { const path=join(dir,'offline-policy.json');
 const proof={decisionId:policy.approvalReference,policyBodySHA256:policy.policySha256,publicTextSHA256:'1'.repeat(64)},proofBytes=JSON.stringify(proof);
 const withProof={...policy,sourceApprovalSha256:createHash('sha256').update(proofBytes).digest('hex'),publicTextSha256:proof.publicTextSHA256};
 writeFileSync(path,JSON.stringify(withProof));assert.throws(()=>readV2Config({...production,NFC_V2_POLICY_FILE:path}),/notice_policy_not_approved/);
 writeFileSync(join(dir,'B05_OWNER_APPROVAL.json'),proofBytes);
 const config=readV2Config({...production,NFC_V2_POLICY_FILE:path});
 assert.equal(config.mode,'approved-intake');assert.deepEqual(config.policy,withProof);
 writeFileSync(path,JSON.stringify({...policy,checkbox:{...policy.checkbox,pl:'Altered legal copy'}}));assert.throws(()=>readV2Config({...production,NFC_V2_POLICY_FILE:path}));
 } finally {rmSync(dir,{recursive:true});}
});
test('historical consent normalization/digest remains byte-identical; candidate consent exact profile only',()=>{
 const old=fixtures.positive[0],n=normalizeRequest(old.wire);assert.equal(requestDigest(n),old.digestSha256);assert.deepEqual(n.consent,{requestProcessing:true,...SYNTHETIC_PROFILE});
 const candidate={...wire(),consent:{requestProcessing:true,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion}};
 assert.throws(()=>normalizeRequest(candidate));const accepted=parseWire(JSON.stringify(candidate),{consentProfile:policy});
 assert.deepEqual(accepted.consent,candidate.consent);assert.notEqual(requestDigest(accepted),requestDigest(n));
 assert.throws(()=>normalizeRequest({...candidate,consent:{...candidate.consent,requestProcessing:false}},{consentProfile:policy}));
 const receipt=buildReceipt(accepted,{requestId:'00000000-0000-4000-8000-000000000001',acceptedAt:'2026-10-27T10:00:00.000Z',quoteId:'00000000-0000-4000-8000-000000000002'});
 assert.equal(validateReceipt(accepted,receipt),true);assert.equal(receipt.notificationStatus,'disabled');
});
test('strict pricing profile dispatch retains old2600/new3600/PL299 and rejects unknown/crossmarket',()=>{
 assert.equal(groupPrice('branded-review-card',2,'UA').amountMinor,360000);
 assert.equal(groupPrice('branded-review-card',2,'UA','NFC-V35-V2-CANDIDATE-01-UA').amountMinor,260000);
 assert.equal(groupPrice('branded-review-card',2,'PL').amountMinor,29900);
 assert.throws(()=>groupPrice('branded-review-card',2,'UA','NFC-V35-V2-CANDIDATE-01-PL'));
 assert.throws(()=>groupPrice('branded-review-card',2,'UA','NFC-V35-V2-OWNER-999-UA'));
});
test('persistence cannot accept a non-synthetic profile without matching processing evidence',async()=>{
 const body=wire();body.consent={requestProcessing:true,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion};
 const accepted=normalizeRequest(body,{consentProfile:policy}),key='00000000-0000-4000-8000-000000000003';
 await assert.rejects(persistV2(fakePool(),accepted,key),(e:unknown)=>e instanceof NfcV2Error&&e.code==='notice_policy_not_approved');
 const binding={scope:policy.scope,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion,policySha256:policy.policySha256,approvalReference:policy.approvalReference};
 await assert.rejects(persistV2(fakePool(),accepted,key,{policyBinding:{...binding,privacyNoticeVersion:'WRONG'}}),(e:unknown)=>e instanceof NfcV2Error&&e.code==='notice_policy_not_approved');
 await assert.rejects(persistV2(fakePool(),normalizeRequest(wire()),key,{policyBinding:binding}),(e:unknown)=>e instanceof NfcV2Error&&e.code==='notice_policy_not_approved');
});
test('schema readiness uses exact immutable migration checksum and required tables, fails closed on outage',async()=>{
 let n=0;const pool={query:async()=>({rows:++n===1?[{checksum:V2_MIGRATION_SHA256}]:[{ready:true}]})} as unknown as Pool;
 assert.equal(await v2SchemaReady(pool),true);assert.equal(await v2SchemaReady(fakePool([{checksum:'0'.repeat(64)}])),false);
 assert.equal(await v2SchemaReady({query:async()=>{throw Error('private DSN');}} as unknown as Pool),false);
 const h=createNfcV2Handler(fakePool(),readV2Config(env),{ready:async()=>false});
 const r=await h(new Request('http://local'+V2_ENDPOINT+'/challenge?sourcePage='+encodeURIComponent('/nfc-card-website/')));assert.equal(r?.status,503);assert.equal((await r!.json()).code,'unavailable');
});
test('approved candidate blocks debug quote/faults and synthetic notices before write',async()=>{
 const config={...readV2Config(env),mode:'approved-intake' as const,origin:'https://nfc-card.com',policy};const h=createNfcV2Handler(fakePool(),config,{now:()=>2000000,ready:async()=>true});
 assert.equal((await h(new Request('http://local/__preview/quote')))?.status,404);
 const request=(body:unknown,headers:Record<string,string>={})=>new Request('http://local'+V2_ENDPOINT,{method:'POST',headers:{origin:config.origin,'content-type':'application/json','idempotency-key':'00000000-0000-4000-8000-000000000004',...headers},body:JSON.stringify(body)});
 assert.equal((await h(request(wire())))?.status,422);
 const good={...wire(),consent:{requestProcessing:true,formVersion:policy.formVersion,privacyNoticeVersion:policy.privacyNoticeVersion},challenge:issueChallenge(secret,normalizeRequest(wire()).sourcePage,1997000)};
 assert.equal((await h(request(good,{'x-nfc-preview-fault':'timeout_after_commit'})))?.status,422);
 assert.equal((await h(request(good,{origin:'https://foreign.example'})))?.status,403);
});
test('feed HMAC uses dedicated reader key, exact cursor query, timestamp and GET without Origin',async()=>{
 const path='/v2/internal/nfc-card/requests?afterSeq=0&generation=nfc-v35-preview-1',at='1793100000000';
 const h=createNfcV2Handler(fakePool(),readV2Config(env),{now:()=>Number(at),ready:async()=>true});
 const get=(key=reader,patch:Record<string,string>={})=>new Request('http://local'+path,{headers:{'x-nfc-timestamp':at,'x-nfc-hmac':createHmac('sha256',key).update(at+'.'+path).digest('hex'),...patch}});
 assert.equal((await h(get(secret)))?.status,401);assert.equal((await h(get(reader,{origin:env.NFC_V2_ORIGIN})))?.status,401);
 const response=await h(get());assert.equal(response?.status,200);assert.deepEqual((await response!.json()).items,[]);
});
test('browser CORS permits only exact configured origin/method/headers; internal feed never permits browsers',async()=>{
 const config=readV2Config(env),h=createNfcV2Handler(fakePool(),config,{ready:async()=>true});
 const preflight=(patch:Record<string,string>={})=>new Request('http://local'+V2_ENDPOINT,{method:'OPTIONS',headers:{origin:config.origin,'access-control-request-method':'POST','access-control-request-headers':'content-type, idempotency-key',...patch}});
 const allowed=await h(preflight());assert.equal(allowed?.status,204);assert.equal(allowed?.headers.get('Access-Control-Allow-Origin'),config.origin);assert.equal(allowed?.headers.get('Access-Control-Allow-Credentials'),null);
 for(const patch of [{origin:'https://foreign.example'},{'access-control-request-method':'PUT'},{'access-control-request-headers':'x-nfc-hmac'}]as Record<string,string>[])assert.equal((await h(preflight(patch)))?.status,403);
 const denied=await h(new Request('http://local/v2/internal/nfc-card/requests',{method:'OPTIONS',headers:{origin:config.origin,'access-control-request-method':'GET'}}));assert.equal(denied?.status,401);assert.equal(denied?.headers.get('Access-Control-Allow-Origin'),null);
});
test('challenge clock backward/early/forward faults are explicit pre-write; exact window unchanged',()=>{
 const token=issueChallenge(secret,'/nfc-card-website/',100000);
 for(const now of [99000,100050,1900001])assert.throws(()=>verifyV2Challenge(secret,token,'/nfc-card-website/',now),(e:unknown)=>e instanceof NfcV2Error&&e.code==='expired_or_early_challenge');
 verifyV2Challenge(secret,token,'/nfc-card-website/',102000);verifyV2Challenge(secret,token,'/nfc-card-website/',1900000);
 assert.throws(()=>verifyV2Challenge(secret,token,'/nfc-card-website/pl/',103000));
});
test('durable replay returns immutable historical receipt, no inserts/outbox/reprice; conflict rolls back',async()=>{
 const fixture=fixtures.positive.find((x:{receipt:{quote:{pricingRevision:string}}})=>x.receipt.quote.pricingRevision==='NFC-V35-V2-CANDIDATE-01-UA');
 const n=normalizeRequest(fixture.wire),r=fixture.receipt;const commands:string[]=[];
 const row={tombstoned:false,state:'accepted',entity_kind:'cart_request',digest_profile:'NFC-V35-CJSON-1',normalization_profile:'NFC-V35-NORM-1',identity_registry_revision:'1d347dbb26ee1f09b303eea0bb33a1b27a93131d6361acef720690ac23119f24',request_digest:requestDigest(n),receipt:r,cart_request_id:r.requestId,request_id:r.requestId,normalized:n};
 const pool={connect:async()=>({release(){},query:async(sql:string)=>{commands.push(sql);return sql.startsWith('INSERT')?{rowCount:0,rows:[]}:sql.startsWith('SELECT k.')?{rowCount:1,rows:[row]}:{rows:[]};}})} as unknown as Pool;
 assert.deepEqual(await persistV2(pool,n,fixture.idempotencyKey),r);assert.equal(commands.filter(s=>s.startsWith('INSERT')).length,1);assert.equal(commands.at(-1),'COMMIT');
 row.request_digest='0'.repeat(64);await assert.rejects(persistV2(pool,n,fixture.idempotencyKey),(e:unknown)=>e instanceof NfcV2Error&&e.code==='idempotency_conflict');assert.equal(commands.at(-1),'ROLLBACK');
});
