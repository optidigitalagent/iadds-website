/** Opt-in versioned transport with exact policy/schema gates; notification delivery remains disabled. */
import { createHmac,randomBytes,timingSafeEqual } from 'node:crypto';
import type { Pool } from 'pg';
import { parseWire,normalizeSourcePage,quoteRequest,requestDigest,NfcV2Error,UUID_V4,errorEnvelope,type NormalizedRequest } from './contract.ts';
import { persistV2,publicationPage,GENERATION } from './store.ts';
import { approvedPolicy } from './policy.ts';
import type { V2RuntimeConfig } from './config.ts';
import { CONTRACT_ID,pricingRevision } from './registry.ts';
export const V2_ENDPOINT='/v2/public/requests/nfc-card';
export type PreviewConfig=V2RuntimeConfig;
export function syntheticContact(n:NormalizedRequest):boolean {
 const c=n.contact;return n.customerName.startsWith('Synthetic')
  &&(!c.email||/^[^@]+@[^@]+\.invalid$/.test(c.email))&&(!c.phone||c.phone==='+12025550123')
  &&(!c.telegram||c.telegram.startsWith('@synthetic'));
}
async function readBody(request:Request):Promise<Uint8Array>{
 if(!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type')||'')||request.headers.has('content-encoding'))throw new NfcV2Error(400,'invalid_encoding');
 if(Number(request.headers.get('content-length'))>16384)throw new NfcV2Error(413,'request_too_large');
 if(!request.body)throw new NfcV2Error(400,'malformed_json');
 const reader=request.body.getReader();const chunks:Uint8Array[]=[];let length=0;
 try{while(true){const v=await reader.read();if(v.done)break;length+=v.value.length;if(length>16384){await reader.cancel();throw new NfcV2Error(413,'request_too_large');}chunks.push(v.value);}}finally{reader.releaseLock();}
 return Buffer.concat(chunks,length);
}
function mac(secret:string,value:string){return createHmac('sha256',secret).update(value).digest('hex');}
function equal(a:string,b:string):boolean{return /^[a-f0-9]{64}$/.test(a)&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
export function issueChallenge(secret:string,path:string,now=Date.now()):string{
 const payload=Buffer.from(JSON.stringify({path,at:now,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 return payload+'.'+createHmac('sha256',secret).update('nfc-browser-v2.'+payload).digest('base64url');
}
export function verifyV2Challenge(secret:string,token:unknown,path:string,now=Date.now()):void{
 if(typeof token!=='string'||token.length>800||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token))throw new NfcV2Error(422,'invalid_challenge',true);
 const [raw,sig]=token.split('.');const expected=createHmac('sha256',secret).update('nfc-browser-v2.'+raw).digest('base64url');
 if(sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw new NfcV2Error(422,'invalid_challenge',true);
 let decoded:{path:string;at:number};try{decoded=JSON.parse(Buffer.from(raw,'base64url').toString());}catch{throw new NfcV2Error(422,'invalid_challenge',true);}
 if(decoded.path!==path||!Number.isSafeInteger(decoded.at)||now-decoded.at<2000||now-decoded.at>1800000)throw new NfcV2Error(422,'expired_or_early_challenge',true);
}
export function createNfcV2Handler(pool:Pool,config:PreviewConfig,options:{now?:()=>number;ready?:()=>Promise<boolean>}={}){
 if(config.mode==='synthetic-preview'&&(!/^nfc_v35_[a-z0-9_]+_test$/.test(config.databaseName)||!/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(config.origin)||config.secret.length<32))throw new Error('isolated_preview_configuration_required');
 if(config.mode==='approved-intake'&&(!approvedPolicy(config.policy)||!/^https:\/\/[a-z0-9.-]+(?::443)?$/i.test(config.origin)||config.secret.length<32||!config.inboundReadSecret||config.inboundReadSecret===config.secret||config.inboundReadSecret.length<32))throw new Error('notice_policy_not_approved');
 if(config.mode==='approved-intake'&&!options.ready)throw new Error('nfc_v2_readiness_required');
 const now=options.now??Date.now;let rate={until:0,count:0};
 return async(request:Request):Promise<Response|undefined>=>{
  const url=new URL(request.url);if(![V2_ENDPOINT,V2_ENDPOINT+'/challenge',V2_ENDPOINT+'/status','/__preview/quote','/v2/internal/nfc-card/requests'].includes(url.pathname))return;
  const headers=new Headers({'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin'});
  if(request.headers.get('origin')===config.origin&&url.pathname!=='/v2/internal/nfc-card/requests'){
   headers.set('Access-Control-Allow-Origin',config.origin);headers.set('Access-Control-Allow-Methods','GET, POST, OPTIONS');
   headers.set('Access-Control-Allow-Headers','Content-Type, Idempotency-Key'+(config.mode==='synthetic-preview'?', X-Nfc-Preview-Fault':''));headers.set('Access-Control-Max-Age','600');
  }
  const reply=(status:number,data:unknown)=>Response.json(data,{status,headers});
  if(config.mode==='disabled')return reply(503,errorEnvelope(new NfcV2Error(503,'notice_policy_not_approved')));
  try{
   if(options.ready&&!(await options.ready()))throw new NfcV2Error(503,'unavailable',true);
   if(now()>rate.until)rate={until:now()+60000,count:0};if(++rate.count>240)throw new NfcV2Error(429,'rate_limited',true);
   if(url.pathname==='/v2/internal/nfc-card/requests'){
    const at=request.headers.get('x-nfc-timestamp')||'',sig=request.headers.get('x-nfc-hmac')||'';
    if(request.method!=='GET'||request.headers.has('origin')||!/^\d{13}$/.test(at)||Math.abs(now()-Number(at))>300000||!equal(sig,mac(config.inboundReadSecret??config.secret,at+'.'+url.pathname+url.search)))return reply(401,{code:'unauthorized'});
    if([...url.searchParams.keys()].some(k=>!['afterSeq','generation'].includes(k))||url.searchParams.getAll('afterSeq').length>1||url.searchParams.getAll('generation').length>1)throw new NfcV2Error(422,'invalid_payload');
    return reply(200,await publicationPage(pool,Number(url.searchParams.get('afterSeq')??0),url.searchParams.get('generation')??GENERATION));
   }
   if(url.pathname===V2_ENDPOINT+'/status'){
    if(request.method!=='GET')return reply(405,{code:'method_not_allowed'});
    if(url.search||config.mode!=='approved-intake'||!config.policy)return reply(503,{code:'notice_policy_not_approved'});
    return reply(200,{ok:true,service:'antonov-lead-gateway',apiVersion:2,mode:config.mode,contractId:CONTRACT_ID,
     policySha256:config.policy.policySha256,formVersion:config.policy.formVersion,privacyNoticeVersion:config.policy.privacyNoticeVersion,
     pricingRevision:{UA:pricingRevision('UA'),PL:pricingRevision('PL')},gatewayCommit:config.gatewayCommit??null});
   }
   if(config.mode==='approved-intake'&&url.pathname==='/__preview/quote')return reply(404,{code:'not_found'});
   const origin=request.headers.get('origin');if(origin&&origin!==config.origin) return reply(403,{code:'origin_forbidden'});
   if(request.method==='OPTIONS'){
    const method=request.headers.get('access-control-request-method'),requested=(request.headers.get('access-control-request-headers')??'').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
    const allowed=['content-type','idempotency-key',...(config.mode==='synthetic-preview'?['x-nfc-preview-fault']:[])];
    if(origin!==config.origin||method!==(url.pathname.endsWith('/challenge')?'GET':'POST')||requested.some(h=>!allowed.includes(h)))return reply(403,{code:'origin_forbidden'});
    return new Response(null,{status:204,headers});
   }
   if(url.pathname.endsWith('/challenge')){
    if(request.method!=='GET'||[...url.searchParams.keys()].some(k=>k!=='sourcePage')||url.searchParams.getAll('sourcePage').length!==1)throw new NfcV2Error(422,'invalid_payload');
    const source=url.searchParams.get('sourcePage')||'';const lang=source.startsWith('/nfc-card-website/pl/')?'pl':source.startsWith('/nfc-card-website/en/')?'en':'uk';const path=normalizeSourcePage(source,lang);
    return reply(200,{challenge:issueChallenge(config.secret,path,now()),minimumDelayMs:2000,expiresInSeconds:1800});
   }
   if(request.method!=='POST')return reply(405,{code:'method_not_allowed'});
   if(origin!==config.origin) return reply(403,{code:'origin_forbidden'});
   const bytes=await readBody(request);const n=parseWire(bytes,{consentProfile:config.mode==='approved-intake'?config.policy:undefined});
   if(config.mode==='synthetic-preview'&&!syntheticContact(n))throw new NfcV2Error(422,'invalid_payload');
   if(url.pathname==='/__preview/quote')return reply(200,{normalized:n,digestSha256:requestDigest(n),quote:quoteRequest(n,{quoteId:'00000000-0000-4000-8000-000000000001'})});
   const key=request.headers.get('idempotency-key')||'';if(!UUID_V4.test(key))throw new NfcV2Error(422,'invalid_id');
   const raw=JSON.parse(new TextDecoder().decode(bytes));verifyV2Challenge(config.secret,raw.challenge,n.sourcePage,now());
   const fault=request.headers.get('x-nfc-preview-fault');if(config.mode!=='synthetic-preview'&&fault)throw new NfcV2Error(422,'invalid_payload');if(fault==='unavailable')throw new NfcV2Error(503,'unavailable',true);
   if(fault&&!['timeout_after_commit','receipt_mismatch'].includes(fault))throw new NfcV2Error(422,'invalid_payload');
   const p=config.policy;const receipt=await persistV2(pool,n,key,p?{policyBinding:{scope:p.scope,formVersion:p.formVersion,privacyNoticeVersion:p.privacyNoticeVersion,policySha256:p.policySha256,approvalReference:p.approvalReference}}:{});
   if(fault==='timeout_after_commit')throw new NfcV2Error(503,'outcome_unknown',true);
   if(fault==='receipt_mismatch'){const changed=structuredClone(receipt);changed.acceptedRequest.customerName='Synthetic Wrong Receipt';return reply(202,changed);}
   return reply(202,receipt);
  }catch(e){const error=e instanceof NfcV2Error?e:new NfcV2Error(503,'unavailable',true);return reply(error.status,errorEnvelope(error));}
 };
}
