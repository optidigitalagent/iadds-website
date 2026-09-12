import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { getAllServices, getDictionary } from '../src/lib/content';
import { validateConsultation } from '../src/lib/validation/consultation';
import { handleConsultation } from '../src/lib/consultation/handler';
import { WebhookSubmissionProvider } from '../src/lib/consultation/provider';
import { createGateway } from '../services/lead-gateway/src/gateway';
import { readConfig } from '../services/lead-gateway/src/config';
import { parseLead, type LeadV2 } from '../services/lead-gateway/src/schema';
import { normalizePhone } from '../services/lead-gateway/src/contact';
import { formatLead } from '../services/lead-gateway/src/format';

const secret='synthetic-source-secret-for-v2-integration';
const source={slug:'iadds',label:'iADDS',secret};
const minimal=(locale:'uk'|'en'='uk'):LeadV2=>({formSchemaVersion:2,source:'iadds',referenceId:randomUUID(),submittedAt:new Date().toISOString(),fullName:'Test Lead',phone:'+1 (202) 555-0123',phoneNormalized:'+12025550123',preferredContact:'phone',selectedService:'not-sure',currentLocale:locale,communicationLanguage:locale,sourcePage:`/${locale}/consultation`,collaborationModel:'',consent:true});
const request=(body:ReturnType<typeof minimal>|object)=>new Request('http://localhost:3100/api/consultation',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID()},body:JSON.stringify(body)});
for(const locale of ['uk','en'] as const) {
 const copy=getDictionary(locale).consultation;
 const validate=(changes:object={})=>validateConsultation({...minimal(locale),...changes},getAllServices(locale).map(s=>s.slug),copy.validation);
 test(`${locale} minimal v2 client/server/gateway/Telegram integration omits optional fields`,async()=>{
  for(const preferredContact of ['phone','telegram'] as const) {
   const messages:string[]=[];const logs:string[]=[];let forwarded:Record<string,unknown>={};
   const gateway=createGateway(readConfig({LEAD_SOURCE_IADDS_SECRET:secret}),{send:async text=>{messages.push(text);return 0;},log:line=>logs.push(line)});
   const provider=new WebhookSubmissionProvider('https://gateway.example/v1/leads',secret,async(url,options)=>{forwarded=JSON.parse(String(options?.body));return gateway(new Request(String(url),options));},async()=>[{address:'8.8.8.8'}]);
   const response=await handleConsultation(request({...minimal(locale),preferredContact,email:'',company:'',companyUrl:'',message:'',role:'Must never be forwarded',phoneNormalized:'forged'}),()=>provider);
   assert.equal(response.status,201);assert.equal((await response.json()).mode,'webhook');assert.equal(messages.length,1);
   for(const field of ['role','email','company','companyUrl','message','contactMethod']) assert.equal(field in forwarded,false);
   assert.equal(forwarded.phoneNormalized,'+12025550123');assert.equal(forwarded.formSchemaVersion,2);assert.equal(forwarded.source,'iadds');
   assert.match(messages[0],/Телефон: \+12025550123/);assert.ok(messages[0].includes(String(forwarded.referenceId)));
   assert.doesNotMatch(messages[0],/Роль:|Посада:|Role:|Email:|Компанія \/ проєкт:|Сайт:|Коментар:/);
   assert.ok(!logs.join('').includes('Test Lead'));assert.ok(!logs.join('').includes('12025550123'));
  }
 });
 test(`${locale} required and conditional contact validation preserves entered phone`,()=>{
  for(const phone of ['', 'abc', '+12', '1'.repeat(16), '+12+3456789']) {
   const result=validate({phone});assert.equal(result.errors.phone,copy.validation.phone);assert.equal(result.data.phone,phone);
  }
  assert.equal(validate({preferredContact:''}).errors.preferredContact,copy.validation.preferredContact);
  assert.equal(validate({selectedService:''}).errors.selectedService,copy.validation.selectedService);
  assert.equal(validate({consent:false}).errors.consent,copy.validation.consent);
  assert.equal(validate({preferredContact:'email',email:''}).errors.email,copy.validation.email);
  assert.equal(validate({email:'invalid'}).errors.email,copy.validation.email);
  assert.equal(validate({email:'<b></b>'}).errors.email,copy.validation.email);
  assert.equal(validate({email:123}).errors.email,copy.validation.email);
  assert.equal(validate({companyUrl:'<script></script>'}).errors.companyUrl,copy.validation.companyUrl);
  assert.equal(validate({preferredContact:'email',email:'qa@example.com'}).valid,true);
  assert.equal(validate({message:'',email:'',company:'',companyUrl:''}).valid,true);
  assert.equal(validate({message:'a'}).valid,true);
  assert.equal(validate({message:'a'.repeat(1501)}).errors.message,copy.validation.message);
  for(const selectedService of ['not-sure','several','custom-ai-system',...getAllServices(locale).map(s=>s.slug)]) assert.equal(validate({selectedService}).valid,true);
 });
 test(`${locale} server rejects missing phone or conditional email without calling provider`,async()=>{
  let sends=0;const provider={submit:async()=>{sends++;throw new Error('must not send');}};
  for(const changes of [{phone:''},{phone:'abcdefg'},{preferredContact:'email',email:''},{email:'bad'},{preferredContact:''},{selectedService:''}]) {
   const result=await handleConsultation(request({...minimal(locale),...changes}),()=>provider);assert.equal(result.status,422);
  }
  assert.equal(sends,0);
 });
}
test('phone normalization accepts international numbers and rejects invalid syntax and lengths',()=>{
 assert.equal(normalizePhone('+44 (20) 7946-0958'),'+442079460958');assert.equal(normalizePhone('202 555 0123'),'2025550123');
 assert.equal(normalizePhone('1234567'),'1234567');assert.equal(normalizePhone('+123456789012345'),'+123456789012345');
 for(const value of ['123456','1234567890123456','+','++12025550123','1234567 ext 4','<b>1234567</b>']) assert.equal(normalizePhone(value),undefined);
});
test('v2 gateway validates optional fields, normalized phone, contact enum and trusted source',()=>{
 assert.ok(parseLead(minimal(),source));assert.ok(parseLead({...minimal(),email:'',company:'',companyUrl:'',message:''},source));
 for(const changes of [{phone:''},{phoneNormalized:'1234567'},{preferredContact:'other'},{preferredContact:'email',email:''},{email:'invalid'},{role:'Forbidden in v2'},{source:'another-site'},{message:'a'.repeat(1501)},{companyUrl:'https://user:pass@example.com'},{formSchemaVersion:3}]) assert.equal(parseLead({...minimal(),...changes},source),undefined);
 const safe=formatLead({...minimal(),fullName:'<b>Owner</b>',message:'<script>unsafe</script>'},'iADDS').join('\n');assert.ok(safe.includes('&lt;b&gt;Owner&lt;/b&gt;'));assert.ok(safe.includes('Коментар:'));assert.ok(!safe.includes('<script>'));
});
test('old open forms cross the new website and gateway without retaining legacy role',async()=>{
 const messages:string[]=[];const gateway=createGateway(readConfig({LEAD_SOURCE_IADDS_SECRET:secret}),{send:async text=>{messages.push(text);return 0;},log:()=>{}});
 const provider=new WebhookSubmissionProvider('https://gateway.example/v1/leads',secret,async(url,options)=>gateway(new Request(String(url),options)),async()=>[{address:'8.8.8.8'}]);
 const legacy={fullName:'Legacy Test',company:'Test Company',role:'Must disappear',email:'test@example.com',contactMethod:'',companyUrl:'https://example.com',selectedService:'not-sure',message:'Old page kept open before deployment.',currentLocale:'uk',communicationLanguage:'uk',sourcePage:'/uk/consultation',collaborationModel:'',consent:true,companyFax:''};
 assert.equal((await handleConsultation(request(legacy),()=>provider)).status,201);
 assert.equal(messages.length,1);assert.ok(!messages[0].includes('Must disappear'));assert.ok(messages[0].includes('Телефон: не вказано у старій формі'));
});
