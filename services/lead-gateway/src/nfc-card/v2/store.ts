/** CF-01 additive persistence. No notification sender, retention job or automatic migration. */
import { randomUUID,createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { readFile } from 'node:fs/promises';
import type { Pool,PoolClient } from 'pg';
import { completeRightsBodyScrub } from './rights.ts';
import { NfcV2Error,requestDigest,buildReceipt,validateReceipt,DIGEST_PROFILE,NORMALIZATION_PROFILE,CORE_SHA256,UUID_V4,type NormalizedRequest,type Receipt } from './contract.ts';
export const GENERATION='nfc-v35-preview-1';
export async function migrateV2(pool:Pool,options:{isolatedSyntheticDatabase:boolean}):Promise<{applied:boolean;version:string;checksum:string}> {
 if(options.isolatedSyntheticDatabase!==true)throw new Error('isolated_test_database_required');
 const sql=await readFile(new URL('../../../migrations/nfc-card/012_v35_enquiries.sql',import.meta.url),'utf8');
 const checksum=createHash('sha256').update(sql).digest('hex'),version='012_v35_enquiries',c=await pool.connect();
 try {
  const info=await c.query('SELECT current_database() AS db,current_setting(\'server_version_num\') AS version');
  if(!/^nfc_v35_[a-z0-9_]+_test$/.test(info.rows[0].db)||!String(info.rows[0].version).startsWith('17'))throw new Error('isolated_postgres17_required');
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");await c.query('SELECT pg_advisory_xact_lock(174813,1)');
  const old=await c.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1',[version]);
  if(old.rowCount){if(old.rows[0].checksum!==checksum)throw new Error('migration_checksum_mismatch');await c.query('COMMIT');return {applied:false,version,checksum};}
  await c.query(sql);await c.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)',[version,checksum]);await c.query('COMMIT');return {applied:true,version,checksum};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
}
export type SaveOptions={policyBinding?:{scope:'NFC_CARD_V2_RICH_REQUEST';formVersion:string;privacyNoticeVersion:string;policySha256:string;approvalReference:string};makeReceipt?:(n:NormalizedRequest,o:{requestId:string;acceptedAt:string;quoteId:string;notificationStatus:'disabled'})=>Receipt;beforePublish?:(c:PoolClient)=>Promise<void>};
export async function persistV2(pool:Pool,n:NormalizedRequest,key:string,options:SaveOptions={}):Promise<Receipt>{
 if(!UUID_V4.test(key))throw new NfcV2Error(422,'invalid_id');
 const binding=options.policyBinding,synthetic=n.consent.formVersion==='SYNTHETIC-NOT-APPROVED'&&n.consent.privacyNoticeVersion==='SYNTHETIC-NOT-APPROVED';
 if(!synthetic&&(!binding||binding.scope!=='NFC_CARD_V2_RICH_REQUEST'||binding.formVersion!==n.consent.formVersion||binding.privacyNoticeVersion!==n.consent.privacyNoticeVersion||!/^[a-f0-9]{64}$/.test(binding.policySha256)||typeof binding.approvalReference!=='string'||binding.approvalReference.trim().length<10))throw new NfcV2Error(503,'notice_policy_not_approved');
 if(synthetic&&binding)throw new NfcV2Error(503,'notice_policy_not_approved');
 n=structuredClone(n);
 function freeze(v:unknown):void{if(v&&typeof v==='object'){Object.values(v).forEach(freeze);Object.freeze(v);}}
 freeze(n);const digest=requestDigest(n),requestId=randomUUID(),c=await pool.connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");
  const claimed=await c.query(`INSERT INTO nfc_card.v2_identity_keys(idempotency_key,entity_kind,digest_profile,request_digest,cart_request_id)
   VALUES($1,'cart_request',$2,$3,$4) ON CONFLICT(idempotency_key) DO NOTHING RETURNING idempotency_key`,[key,DIGEST_PROFILE,digest,requestId]);
  if(!claimed.rowCount){
   const existing=await c.query(`SELECT k.*,r.request_id,r.normalized,r.receipt,r.normalization_profile,r.identity_registry_revision,r.state,o.payload AS outbox_payload FROM nfc_card.v2_identity_keys k
    LEFT JOIN nfc_card.v2_requests r ON r.request_id=k.cart_request_id LEFT JOIN nfc_card.v2_notification_outbox o ON o.request_id=r.request_id WHERE k.idempotency_key=$1 FOR UPDATE OF k`,[key]);
   const row=existing.rows[0];if(!row)throw new NfcV2Error(409,'request_in_progress',true);
   if(row.tombstoned||row.state==='tombstone')throw new NfcV2Error(410,'idempotency_tombstoned');
   if(row.entity_kind!=='cart_request'||row.digest_profile!==DIGEST_PROFILE)throw new NfcV2Error(409,'idempotency_conflict');
   if(row.normalization_profile!==NORMALIZATION_PROFILE||row.identity_registry_revision!==CORE_SHA256)throw new NfcV2Error(503,'idempotency_profile_unavailable');
   if(row.request_digest!==digest)throw new NfcV2Error(409,'idempotency_conflict');
   if(!row.receipt)throw new NfcV2Error(409,'request_in_progress',true);
   if(row.receipt.requestId!==row.cart_request_id||row.receipt.requestId!==row.request_id||!isDeepStrictEqual(row.normalized,n)||!isDeepStrictEqual(row.receipt.acceptedRequest,n)||!validateReceipt(n,row.receipt))throw new NfcV2Error(503,'unavailable',true);
   if(options.policyBinding&&!isDeepStrictEqual(row.outbox_payload?.processingEvidence?.policyBinding,options.policyBinding))throw new NfcV2Error(503,'idempotency_profile_unavailable');
   await c.query('COMMIT');return row.receipt as Receipt;
  }
  const acceptedAt=new Date().toISOString(),quoteId=randomUUID();
  const receipt=structuredClone((options.makeReceipt??buildReceipt)(n,{requestId,acceptedAt,quoteId,notificationStatus:'disabled'}));freeze(receipt);
  if(requestDigest(n)!==digest||receipt.requestDigest.sha256!==digest||!validateReceipt(n,receipt)||receipt.requestId!==requestId||receipt.acceptedAt!==acceptedAt||receipt.quote.quoteId!==quoteId||receipt.notificationStatus!=='disabled')throw new NfcV2Error(503,'unavailable',true);
  if(Buffer.byteLength(JSON.stringify(receipt))>131072)throw new NfcV2Error(413,'request_too_large');
  await c.query(`INSERT INTO nfc_card.v2_requests(request_id,idempotency_key,request_digest,normalization_profile,identity_registry_revision,normalized,receipt)
    VALUES($1,$2,$3,$4,$5,$6,$7)`,[requestId,key,digest,NORMALIZATION_PROFILE,CORE_SHA256,n,receipt]);
  await c.query(`INSERT INTO nfc_card.v2_notification_outbox(request_id,payload) VALUES($1,$2)`,[requestId,{schemaVersion:2,receipt,send_authorized:false,...(options.policyBinding?{processingEvidence:{capture:'submitted_form_consent_flag',scope:'REQUEST_SCOPED_RESPONSE',emailMarketingPermission:false,sourcePage:n.sourcePage,policyBinding:options.policyBinding}}:{})}]);
  await options.beforePublish?.(c);
  // Serialized counter acquisition is the last data-changing operation, held until COMMIT.
  const counter=await c.query('UPDATE nfc_card.v2_publication_counter SET last_seq=last_seq+1 WHERE singleton RETURNING last_seq');
  await c.query(`INSERT INTO nfc_card.v2_publications(seq,generation,entity_kind,cart_request_id) VALUES($1,$2,'cart_request',$3)`,[counter.rows[0].last_seq,GENERATION,requestId]);
  await c.query('COMMIT');return receipt;
 }catch(e){await c.query('ROLLBACK').catch(()=>{});if(e instanceof NfcV2Error)throw e;if((e as {code?:string})?.code==='55P03')throw new NfcV2Error(409,'request_in_progress',true);throw new NfcV2Error(503,'unavailable',true);}finally{c.release();}
}
export async function publicationPage(pool:Pool,afterSeq:number,generation=GENERATION){
 if(generation!==GENERATION||!Number.isSafeInteger(afterSeq)||afterSeq<0)throw new NfcV2Error(422,'invalid_payload');
 // This additive consumer is cart-only. Legacy publications stay on the unchanged v1 feed.
 // Filter the typed stream before pagination; legacy-only tails never advance the cart cursor.
 const rows=await pool.query(`SELECT p.seq,p.generation,p.entity_kind,p.cart_request_id AS published_request_id,r.request_id,r.normalized,r.normalization_profile,r.identity_registry_revision,r.state,r.receipt,k.cart_request_id,k.tombstoned,k.idempotency_key,k.request_digest,k.digest_profile,o.payload AS outbox_payload
 FROM nfc_card.v2_publications p LEFT JOIN nfc_card.v2_requests r ON r.request_id=p.cart_request_id
 LEFT JOIN nfc_card.v2_identity_keys k ON k.cart_request_id=p.cart_request_id
 LEFT JOIN nfc_card.v2_notification_outbox o ON o.request_id=r.request_id
 WHERE p.seq>$1 AND p.entity_kind='cart_request' ORDER BY p.seq LIMIT 100`,[afterSeq]);
 const items:Record<string,unknown>[]=[];let cursor=afterSeq;
 for(const v of rows.rows){
  if(!/^[1-9][0-9]*$/.test(String(v.seq))||!Number.isSafeInteger(Number(v.seq)))throw new NfcV2Error(503,'unavailable',true);
  if(v.generation!==generation)throw new NfcV2Error(503,'unavailable',true);
  if(v.entity_kind==='legacy_lead'){cursor=Number(v.seq);continue;}
  if(v.state==='tombstone'||v.tombstoned){
   // A complete administrative erasure scrubs raw request/receipt/outbox bodies.
   // It advances the frozen feed cursor without inventing a new item shape.
   // A partial or corrupt erase is still a fail-closed integrity failure.
   if(v.entity_kind!=='cart_request'||v.state!=='tombstone'||v.tombstoned!==true||v.normalized!==null||v.receipt!==null||
      v.request_id!==v.cart_request_id||v.request_id!==v.published_request_id||!UUID_V4.test(v.request_id)||!UUID_V4.test(v.idempotency_key)||
      v.normalization_profile!==NORMALIZATION_PROFILE||v.identity_registry_revision!==CORE_SHA256||v.digest_profile!==DIGEST_PROFILE||
      !/^[a-f0-9]{64}$/.test(v.request_digest)||!completeRightsBodyScrub(v.outbox_payload,v.request_id))throw new NfcV2Error(503,'unavailable',true);
   cursor=Number(v.seq);continue;
  }
  if(v.entity_kind!=='cart_request'||!v.receipt||!v.idempotency_key||v.tombstoned||v.state!=='accepted'||v.normalization_profile!==NORMALIZATION_PROFILE||v.identity_registry_revision!==CORE_SHA256||v.request_id!==v.cart_request_id||v.request_id!==v.published_request_id||v.receipt.requestId!==v.request_id||!isDeepStrictEqual(v.normalized,v.receipt.acceptedRequest)||v.digest_profile!==DIGEST_PROFILE||!validateReceipt(v.receipt.acceptedRequest,v.receipt)||v.request_digest!==v.receipt.requestDigest.sha256)throw new NfcV2Error(503,'unavailable',true);
  const item={schemaVersion:2,entityKind:'cart_request',sourceIdentity:{source:'NFC_CARD',requestId:v.receipt.requestId,idempotencyKey:v.idempotency_key,digestProfile:v.digest_profile,digestSha256:v.request_digest},publication:{generation,seq:Number(v.seq)},receipt:v.receipt};
  const candidate={schemaVersion:2,generation,items:[...items,item],next:{generation,afterSeq:Number(v.seq)}};
  if(Buffer.byteLength(JSON.stringify(candidate))>2*1024*1024){if(!items.length)throw new NfcV2Error(503,'unavailable',true);break;}
  items.push(item);cursor=Number(v.seq);
 }
 return {schemaVersion:2,generation,items,next:{generation,afterSeq:cursor}};
}
