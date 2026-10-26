import {test} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {parseNfcLead} from '../src/nfc-card/contract.ts';
import {database,inboundRows,migrate,persist} from '../src/nfc-card/store.ts';
import {formatNfc} from '../src/nfc-card/format.ts';
const input=()=>({language:'uk',product:'branded-review-card',quantity:1,customerName:'Synthetic local QA',
 contact:{preferredMethod:'email',email:'Test.Case+offer@example.com'},sourcePage:'/nfc-card-website/solutions/branded-review-card',
 selection:{variant:'branded',quantity:'1'},consent:true,formVersion:'NFC-CARD-FORM-V35',privacyNoticeVersion:'NFC-CARD-PRIVACY-V35',
 emailProposal:{intent:'commercial_offer_by_email',businessName:'Synthetic local clinic',niche:'dental_orthodontics',requested:true,businessUrl:'https://clinic.example.com'}});
test('email proposal is explicit, exact and scoped; legacy messenger remains valid',()=>{
 const lead=parseNfcLead(input(),true);
 assert.equal(lead.contact.email,'test.case+offer@example.com');
 assert.equal(lead.contact.phone,undefined);
 assert.equal(lead.notice?.capture,'submitted_form_consent_flag');
 assert.match(formatNfc(lead,randomUUID(),new Date().toISOString()),/commercial_offer_by_email/);
 for(const patch of [{requested:false},{intent:'newsletter'},{niche:'unapproved'},{businessName:'bad\nname'},{businessUrl:'http://localhost/private'}])
  assert.throws(()=>parseNfcLead({...input(),emailProposal:{...input().emailProposal,...patch}},true));
 assert.throws(()=>parseNfcLead({...input(),contact:{preferredMethod:'telegram',phone:'+380671234567'}},true));
 const legacy={...input(),emailProposal:undefined};
 assert.equal(parseNfcLead({...legacy,contact:{preferredMethod:'telegram',phone:'+380671234567'}},true).contact.preferredMethod,'telegram');
});
test('isolated PostgreSQL persists exact basis and feed, idempotency never creates permission', {skip:!process.env.NFC_TEST_DATABASE_URL},async()=>{
 const url=new URL(process.env.NFC_TEST_DATABASE_URL!);
 assert.ok(['localhost','127.0.0.1'].includes(url.hostname)&&url.pathname.endsWith('_test'));
 const admin=database(url.href),name='nfc_email_'+randomUUID().replaceAll('-','')+'_test';
 await admin.query('CREATE DATABASE "'+name+'"');url.pathname='/'+name;const pool=database(url.href);
 try{
  await migrate(pool);const key=randomUUID(),lead=parseNfcLead(input(),true);
  const first=await persist(pool,lead,key,{deliveryEnabled:false});
  const second=await persist(pool,lead,key,{deliveryEnabled:false});assert.equal(first.leadId,second.leadId);
  const feed=await inboundRows(pool,'1970-01-01T00:00:00Z','00000000-0000-0000-0000-000000000000');assert.equal(feed.length,1);
  const row=feed[0];assert.equal(row.email,lead.contact.email);assert.equal(row.preferred_contact,'email');
  assert.equal(row.processing_evidence.replyEmail,lead.contact.email);assert.equal(row.processing_evidence.replyChannel,'EMAIL');
  assert.deepEqual(row.processing_evidence.emailProposal,lead.emailProposal);
  assert.equal(row.processing_evidence.emailMarketingPermission,false);assert.ok(row.created_at);
  assert.equal(row.source_page,lead.sourcePage);assert.equal(row.form_version,'NFC-CARD-FORM-V35');
  await assert.rejects(persist(pool,parseNfcLead({...input(),emailProposal:{...input().emailProposal,businessName:'Different'}} ,true),key));
  assert.equal((await pool.query('SELECT count(*)::int n FROM nfc_card.leads')).rows[0].n,1);
  const delivery=(await pool.query('SELECT delivery_enabled,status FROM nfc_card.notification_outbox')).rows[0];assert.equal(delivery.delivery_enabled,false);assert.equal(delivery.status,'pending');
 }finally{await pool.end();await admin.query('DROP DATABASE "'+name+'"');await admin.end();}
});
