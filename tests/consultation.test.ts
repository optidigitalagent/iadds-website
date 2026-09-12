import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { getAllServices, getDictionary } from '../src/lib/content';
import { validateConsultation, type ConsultationInput } from '../src/lib/validation/consultation';
import { createSubmissionProvider, isPublicAddress, LocalSubmissionProvider, SubmissionError, WebhookSubmissionProvider, type ConsultationSubmissionProvider } from '../src/lib/consultation/provider';
import { handleConsultation } from '../src/lib/consultation/handler';
import { createGateway } from '../services/lead-gateway/src/gateway';
import { readConfig } from '../services/lead-gateway/src/config';
import { verifyLeadSignature } from '../services/lead-gateway/src/contract';

const valid: ConsultationInput = { fullName:'QA Test',company:'Test Company',role:'',email:'qa@example.com',contactMethod:'',companyUrl:'https://example.com',selectedService:'ai-video-ads',message:'This is a local test enquiry for a product launch.',consent:true,communicationLanguage:'uk',currentLocale:'uk',sourcePage:'/uk/services/ai-video-ads',collaborationModel:'production' };
const validate = (input:unknown) => validateConsultation(input,getAllServices().map(s=>s.slug),getDictionary().consultation.validation);
const request = (body:unknown = valid, key: string = randomUUID(), extra:Record<string,string> = {}) => new Request('http://localhost:3100/api/consultation', {method:'POST',headers:{'content-type':'application/json','idempotency-key':key,...extra},body:JSON.stringify(body)});
test('shared schema accepts all required fields and optional empty values',()=> { assert.equal(validate(valid).valid,true); assert.equal(validate({...valid,selectedService:'not-sure'}).valid,true); });
test('schema rejects invalid email, URL, selectedService, consent and message lengths',()=> {
  const result = validate({...valid,email:'bad',companyUrl:'javascript:alert(1)',selectedService:'missing',consent:'true',message:'short'});
  assert.deepEqual(Object.keys(result.errors).sort(),['companyUrl','consent','email','message','selectedService']);
  assert.equal(validate({...valid,message:'a'.repeat(1501)}).valid,false);
  assert.equal(validate({...valid,companyUrl:'https://user:secret@example.com'}).valid,false);
});
test('schema normalizes plain text and ignores unrecognized fields',()=> { const result = validate({...valid,fullName:'  <b>QA Test</b> ',email:'QA@EXAMPLE.COM',injected:'ignored'}); assert.equal(result.data.fullName,'QA Test'); assert.equal(result.data.email,'qa@example.com'); assert.equal('injected' in result.data,false); });
test('local provider persists the actual enquiry, idempotently, across instances',async()=> {
  const directory = await mkdtemp(path.join(tmpdir(),'antonov-test-'));
  try {
    const payload={...valid,referenceId:randomUUID(),submittedAt:new Date().toISOString()};
    const provider=new LocalSubmissionProvider(directory); await provider.submit(payload);
    await new LocalSubmissionProvider(directory).submit(payload);
    const saved=JSON.parse(await readFile(path.join(directory,`${payload.referenceId}.json`),'utf8'));
    assert.equal(saved.email,valid.email); assert.equal((await readdir(directory)).length,1);
    await assert.rejects(()=>provider.submit({...payload,company:'Another company'}),/idempotency_conflict/);
  } finally { if (!path.resolve(directory).startsWith(path.resolve(tmpdir()) + path.sep + 'antonov-test-')) throw new Error('Unexpected test storage path'); await rm(directory,{recursive:true,force:true}); }
});
test('production without a persistent provider fails closed',async()=> {
  assert.throws(()=>createSubmissionProvider({NODE_ENV:'production'}),SubmissionError);
  const response=await handleConsultation(request(),()=>createSubmissionProvider({NODE_ENV:'production'}));
  assert.equal(response.status,503); assert.equal((await response.json()).code,'unavailable');
});
test('endpoint enforces validation, honeypot, origin and payload size',async()=> {
  assert.equal((await handleConsultation(request({...valid,message:'no'}))).status,422);
  assert.equal((await handleConsultation(request({...valid,companyFax:'spam'}))).status,422);
  assert.equal((await handleConsultation(request(valid,randomUUID(),{origin:'https://untrusted.example'}))).status,403);
  assert.equal((await handleConsultation(request({...valid,message:'a'.repeat(17000)}))).status,413);
  assert.equal((await handleConsultation(request(valid,randomUUID(),{'content-type':'text/plain'}))).status,415);
  assert.equal((await handleConsultation(request(valid,'invalid'))).status,400);
});
test('concurrent identical requests call the provider once; changed payload returns 409',async()=> {
  let calls=0;
  const provider:ConsultationSubmissionProvider={async submit(payload){calls++;await new Promise(resolve=>setTimeout(resolve,20));return{referenceId:payload.referenceId,mode:'local'};}};
  const key=randomUUID();const responses=await Promise.all([handleConsultation(request(valid,key),()=>provider),handleConsultation(request(valid,key),()=>provider)]);
  assert.equal(calls,1);assert.ok(responses.every(r=>r.ok));
  assert.equal((await handleConsultation(request({...valid,company:'Changed company'},key),()=>provider)).status,409);
});
test('provider failure returns an error and allows a retry using the same key',async()=> {
  const key=randomUUID(); const failed=await handleConsultation(request(valid,key),()=>({submit:async()=>{throw new SubmissionError(502,'provider_error');}}));
  assert.equal(failed.status,502);
  const retry=await handleConsultation(request(valid,key),()=>({submit:async p=>({referenceId:p.referenceId,mode:'local'})}));
  assert.equal(retry.status,201);
});
test('webhook address guard rejects local, private and metadata destinations',()=> {
  for(const address of ['127.0.0.1','10.0.0.1','172.16.1.1','192.168.1.1','169.254.169.254','::1','fd00::1','::ffff:127.0.0.1'])assert.equal(isPublicAddress(address),false);
  assert.equal(isPublicAddress('8.8.8.8'),true);
});
test('webhook sends the normalized payload with authentication, idempotency and bounded transport',async()=> {
  let sent:RequestInit|undefined;
  const secret='unit-test-source-secret-with-32-bytes';
  const payload={...valid,referenceId:randomUUID(),submittedAt:new Date().toISOString()};
  const transport:typeof fetch=async(_url,init)=>{sent=init;return Response.json({ok:true,referenceId:payload.referenceId});};
  const provider=new WebhookSubmissionProvider('https://receiver.example/consultation',secret,transport,async()=>[{address:'8.8.8.8'}]);
  assert.deepEqual(await provider.submit(payload),{referenceId:payload.referenceId,mode:'webhook'});
  const headers=new Headers(sent?.headers);
  assert.equal(headers.get('Authorization'),null);
  assert.equal(headers.get('x-idempotency-key'),payload.referenceId);
  assert.equal(headers.get('x-lead-source'),'iadds');
  assert.ok(verifyLeadSignature(secret,headers.get('x-lead-timestamp')!,Buffer.from(String(sent?.body)),headers.get('x-lead-signature')!));
  assert.equal(sent?.redirect,'error');assert.ok(sent?.signal);assert.equal(JSON.parse(String(sent?.body)).company,valid.company);
  const failed=new WebhookSubmissionProvider('https://receiver.example',secret,async()=>new Response(null,{status:500}),async()=>[{address:'8.8.8.8'}]);
  await assert.rejects(()=>failed.submit(payload),/provider_error/);
  const blocked=new WebhookSubmissionProvider('https://receiver.example',secret,transport,async()=>[{address:'127.0.0.1'}]);
  await assert.rejects(()=>blocked.submit(payload),/unavailable/);
});

test('website provider and gateway share one signing contract and preserve every form context field',async()=>{
 const secret='unit-test-source-secret-with-32-bytes';const messages:string[]=[];
 const gateway=createGateway(readConfig({LEAD_SOURCE_IADDS_SECRET:secret,LEAD_SOURCE_IADDS_LABEL:'iADDS'}),{send:async text=>{messages.push(text);return 0;},log:()=>{}});
 const transport:typeof fetch=async(url,init)=>gateway(new Request(String(url),init));
 const provider=new WebhookSubmissionProvider('https://receiver.example/v1/leads',secret,transport,async()=>[{address:'8.8.8.8'}]);
 for(const locale of ['uk','en'] as const){
  const payload={...valid,currentLocale:locale,referenceId:randomUUID(),submittedAt:new Date().toISOString()};
  assert.equal((await provider.submit(payload)).referenceId,payload.referenceId);
  assert.ok(messages.at(-1)!.includes('Мова сайту: '+locale));assert.ok(messages.at(-1)!.includes(payload.selectedService));assert.ok(messages.at(-1)!.includes(payload.sourcePage));
 }
});
test('website never accepts an empty, mismatched or asynchronous gateway success',async()=>{
 const payload={...valid,referenceId:randomUUID(),submittedAt:new Date().toISOString()};
 for(const response of [new Response(null,{status:204}),Response.json({ok:true,referenceId:'wrong'}),Response.json({referenceId:payload.referenceId}),Response.json({ok:true,referenceId:payload.referenceId},{status:202}),Response.json({code:'unavailable'},{status:503}),Response.json({code:'delivery_failed'},{status:502})]){
  const provider=new WebhookSubmissionProvider('https://receiver.example','unit-test-source-secret-with-32-bytes',async()=>response,async()=>[{address:'8.8.8.8'}]);
  await assert.rejects(()=>provider.submit(payload),SubmissionError);
 }
});

test('optional role and contact remain empty; short message and custom system are accepted',()=>{
 const result=validate({...valid,role:'',contactMethod:'',message:'New ad idea',selectedService:'custom-ai-system'});assert.ok(result.valid);
 assert.equal(result.data.role,'');assert.equal(result.data.contactMethod,'');
});
test('locale, communication language, service, model and safe source are independently preserved',()=>{
 const result=validate({...valid,currentLocale:'en',communicationLanguage:'uk',collaborationModel:'system',sourcePage:'/uk/services/ai-video-ads'});
 assert.equal(result.data.currentLocale,'en');assert.equal(result.data.communicationLanguage,'uk');assert.equal(result.data.selectedService,'ai-video-ads');assert.equal(result.data.collaborationModel,'system');assert.equal(result.data.sourcePage,'/uk/services/ai-video-ads');
 assert.equal(validate({...valid,sourcePage:'https://evil.example/name?email=personal'}).data.sourcePage,'/uk');
 assert.equal(validate({...valid,sourcePage:'/uk?secret=personal'}).data.sourcePage,'/uk');
 assert.equal(validate({...valid,communicationLanguage:'fr'}).valid,false);
});
test('required field errors use the submitted locale dictionary',()=>{
 for(const locale of ['uk','en'] as const){const result=validateConsultation({...valid,email:'bad',message:''},getAllServices(locale).map(s=>s.slug),getDictionary(locale).consultation.validation);assert.equal(result.errors.email,getDictionary(locale).consultation.validation.email);assert.equal(result.errors.message,getDictionary(locale).consultation.validation.message);}
});
test('repeated requests eventually receive a rate limit response',async()=> {
  let response:Response|undefined;
  for(let i=0;i<45;i++) response=await handleConsultation(request({...valid,message:'invalid'}));
  assert.equal(response?.status,429);assert.ok(response?.headers.get('retry-after'));
});
