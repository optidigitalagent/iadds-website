import test from 'node:test';
import assert from 'node:assert/strict';
import type {Pool} from 'pg';
import {randomBytes} from 'node:crypto';
import {readFileSync,writeFileSync} from 'node:fs';
import {nfcBrowserOriginAllowed,NFC_CUSTOM_DOMAIN_ORIGIN} from '../src/nfc-card/browser-origin.ts';
import {createNfcHandler} from '../src/nfc-card/handler.ts';
import {ORIGIN,ENDPOINT} from '../src/nfc-card/contract.ts';
import {createNfcV2Handler,V2_ENDPOINT} from '../src/nfc-card/v2/handler.ts';
import {createGateway} from '../src/gateway.ts';
import type {GatewayConfig} from '../src/config.ts';
const secret=randomBytes(32).toString('hex'),reader=randomBytes(32).toString('hex');
const policy=JSON.parse(readFileSync(new URL('../policies/nfc-card-v38-orders-approved.json',import.meta.url),'utf8'));
const pool={query:async()=>{throw Error('unit CORS probe must not read data')}} as unknown as Pool;
const legacy=createNfcHandler(pool,{secret,databaseUrl:'postgresql://127.0.0.1/nfc_unit_test',publicIntake:true,telegramEnabled:false,testOnly:true},{log:()=>{},currentPolicy:policy});
const config={mode:'approved-intake' as const,origin:ORIGIN,secret,inboundReadSecret:reader,databaseName:'nfc_v35_cors_test',policy,gatewayCommit:'1'.repeat(40)};
const v2=createNfcV2Handler(pool,config,{ready:async()=>true});
const observations:Record<string,unknown>[]=[];
async function probe(path:string,origin:string|null,method='GET',extra:Record<string,string>={}){
 const headers={...(origin===null?{}:{Origin:origin}),...extra};
 const request=new Request('http://local'+path,{method,headers});
 const response=(await v2(request))??(await legacy(request))??new Response(null,{status:404});
 observations.push({path,origin,method,status:response.status,acao:response.headers.get('access-control-allow-origin'),vary:response.headers.get('vary'),methods:response.headers.get('access-control-allow-methods'),headers:response.headers.get('access-control-allow-headers')});
 return response;
}
function allowed(response:Response,origin:string){assert.equal(response.headers.get('access-control-allow-origin'),origin);assert.equal(response.headers.get('vary'),'Origin');assert.notEqual(response.headers.get('access-control-allow-origin'),'*');}
test('one exact NFC origin is additive, preserving any existing configured origin',()=>{
 assert.equal(NFC_CUSTOM_DOMAIN_ORIGIN,'https://nfc-by-ad.shop');
 for(const existing of [ORIGIN,'https://existing.example']){
  assert.equal(nfcBrowserOriginAllowed(existing,existing,false),true);
  assert.equal(nfcBrowserOriginAllowed(NFC_CUSTOM_DOMAIN_ORIGIN,existing,true),true);
  assert.equal(nfcBrowserOriginAllowed(NFC_CUSTOM_DOMAIN_ORIGIN,existing,false),false);
 }
 for(const value of [null,'','null','http://nfc-by-ad.shop','https://www.nfc-by-ad.shop','https://nfc-by-ad.shop.evil.invalid','https://evil-nfc-by-ad.shop','https://nfc-by-ad.shop:443','https://nfc-by-ad.shop/','https://NFC-BY-AD.SHOP','https://optidigitalagent.github.io.evil.invalid'])assert.equal(nfcBrowserOriginAllowed(value,ORIGIN,true),false);
});
test('both Origins: existing v1/v2 challenge/status surface and exact preflight headers',async()=>{
 for(const origin of [ORIGIN,NFC_CUSTOM_DOMAIN_ORIGIN]){
  for(const endpoint of [ENDPOINT,V2_ENDPOINT]){
   const r=await probe(endpoint+'/challenge?sourcePage='+encodeURIComponent('/nfc-card-website/order/'),origin);assert.equal(r.status,200);allowed(r,origin);
   const post=await probe(endpoint,origin,'OPTIONS',{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,idempotency-key'});assert.equal(post.status,204);allowed(post,origin);assert.equal(post.headers.get('access-control-allow-methods'),'GET, POST, OPTIONS');assert.equal(post.headers.get('access-control-allow-headers'),endpoint===ENDPOINT?'Content-Type, Idempotency-Key':'Content-Type, Idempotency-Key, X-Nfc-Control-Context');
   const get=await probe(endpoint+'/challenge',origin,'OPTIONS',{'Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'content-type'});assert.equal(get.status,204);allowed(get,origin);
   for(const patch of [{'Access-Control-Request-Method':'DELETE'},{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'authorization'},{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'x-nfc-preview-fault'}])assert.equal((await probe(endpoint,origin,'OPTIONS',patch)).status,403);
   assert.equal((await probe(endpoint+'/challenge?sourcePage='+encodeURIComponent('/order/'),origin)).status,422);
  }
  const status=await probe(V2_ENDPOINT+'/status',origin);assert.equal(status.status,200);allowed(status,origin);const body=await status.json();assert.equal(body.policySha256,policy.policySha256);assert.equal(body.contractId,'NFC-CARD-V35-P4-02-CF-01');
  const absent=await probe(ENDPOINT+'/status',origin);assert.equal(absent.status,404);assert.equal(absent.headers.get('access-control-allow-origin'),null);
  assert.equal((await probe(V2_ENDPOINT,origin,'OPTIONS',{'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'x-nfc-control-context'})).status,204);
 }
});
test('foreign, lookalike, null and absent Origin semantics remain closed or exactly historical',async()=>{
 for(const origin of ['https://evil.invalid','http://nfc-by-ad.shop','https://www.nfc-by-ad.shop','https://nfc-by-ad.shop.evil.invalid','https://nfc-by-ad.shop:443','null']){
  for(const endpoint of [ENDPOINT,V2_ENDPOINT]){
   const r=await probe(endpoint+'/challenge?sourcePage=/nfc-card-website/order/',origin);assert.equal(r.status,403);assert.equal(r.headers.get('access-control-allow-origin'),null);
   const pre=await probe(endpoint,origin,'OPTIONS',{'Access-Control-Request-Method':'POST'});assert.equal(pre.status,403);assert.equal(pre.headers.get('access-control-allow-origin'),null);
  }
  const status=await probe(V2_ENDPOINT+'/status',origin);assert.equal(status.status,200);assert.equal(status.headers.get('access-control-allow-origin'),null);
 }
 assert.equal((await probe(ENDPOINT+'/challenge?sourcePage=/nfc-card-website/order/',null)).status,403);
 const anonymous=await probe(V2_ENDPOINT+'/challenge?sourcePage=/nfc-card-website/order/',null);assert.equal(anonymous.status,200);assert.equal(anonymous.headers.get('access-control-allow-origin'),null);
 for(const endpoint of [ENDPOINT,V2_ENDPOINT]){assert.equal((await probe(endpoint,null,'OPTIONS',{'Access-Control-Request-Method':'POST'})).status,403);assert.equal((await probe(endpoint,null,'POST')).status,403);}
});
test('custom Origin gains no internal, signed, iADDS, health or preview-only CORS permissions',async()=>{
 for(const path of ['/v1/internal/nfc-card/leads','/v2/internal/nfc-card/requests','/__preview/quote']){
  const r=await probe(path,NFC_CUSTOM_DOMAIN_ORIGIN);assert.ok([401,404].includes(r.status));assert.equal(r.headers.get('access-control-allow-origin'),null);
 }
 const preview=createNfcV2Handler(pool,{mode:'synthetic-preview',origin:'http://127.0.0.1:4196',secret,inboundReadSecret:reader,databaseName:'nfc_v35_preview_test'});
 const r=await preview(new Request('http://local'+V2_ENDPOINT+'/challenge?sourcePage=/nfc-card-website/order/',{headers:{Origin:NFC_CUSTOM_DOMAIN_ORIGIN}}));assert.equal(r?.status,403);assert.equal(r?.headers.get('access-control-allow-origin'),null);
 const gateway=createGateway({sources:new Map(),maxRequestsPerMinute:10} as GatewayConfig,{nfc:async r=>(await v2(r))??await legacy(r),send:async()=>{throw Error('external send forbidden')},log:()=>{}});
 for(const path of ['/healthz','/v1/leads','/unrelated']){
  const r=await gateway(new Request('http://local'+path,{headers:{Origin:NFC_CUSTOM_DOMAIN_ORIGIN}}));assert.equal(r.headers.get('access-control-allow-origin'),null);
 }
});
test.after(()=>{if(process.env.NFC_CORS_UNIT_REPORT)writeFileSync(process.env.NFC_CORS_UNIT_REPORT,JSON.stringify({scope:'LOCAL_SYNTHETIC_UNIT_ONLY',noCustomerData:true,observations},null,2)+'\n');});
