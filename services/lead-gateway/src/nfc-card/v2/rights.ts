/** Read-only rights planning; mutation helper is restricted to synthetic PG17 QA. */
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import type {Pool,PoolClient} from 'pg';
import {UUID_V4} from './contract.ts';

type Snapshot={request_id:string;idempotency_key:string;state:string;normalized:Record<string,any>|null;receipt:unknown;payload:unknown;tombstoned:boolean};
const digest=(x:unknown)=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
const hex=(x:unknown)=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const iso=(x:unknown)=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x)&&Number.isFinite(Date.parse(x));
const cleanRef=(x:unknown)=>typeof x==='string'&&x.length<=600&&!/[\u0000-\u001f\u007f]/.test(x);
export type RightsCase={schemaVersion:1;operation:'ERASE_REQUEST_PERSONAL_DATA';caseId:string;requestId:string;planSha256:string;ownerApproved:true;ownerActor:'Artem Antonov';approvalReference:string;ownerApprovalEvidenceSha256:string;identityVerified:true;purposeAndOrderRetentionReviewed:true;approvedAt:string;pairedOwnerDeskRestrictionReference:string;backupRestoreRestrictionReference:string};
const caseKeys=['schemaVersion','operation','caseId','requestId','planSha256','ownerApproved','ownerActor','approvalReference','ownerApprovalEvidenceSha256','identityVerified','purposeAndOrderRetentionReviewed','approvedAt','pairedOwnerDeskRestrictionReference','backupRestoreRestrictionReference'].sort();
/** Validate the case and the exact separate human-approval record; generic D3 is not a case. */
export function validateRightsCase(value:unknown,ownerApprovalRecord:Uint8Array):RightsCase{
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==caseKeys.join(','))throw Error('specific_owner_rights_case_required');
 const c=value as RightsCase;
 if(c.schemaVersion!==1||c.operation!=='ERASE_REQUEST_PERSONAL_DATA'||!UUID_V4.test(c.caseId)||!UUID_V4.test(c.requestId)||!hex(c.planSha256)||
  c.ownerApproved!==true||c.ownerActor!=='Artem Antonov'||c.identityVerified!==true||c.purposeAndOrderRetentionReviewed!==true||!hex(c.ownerApprovalEvidenceSha256)||!iso(c.approvedAt)||Date.parse(c.approvedAt)>Date.now()+300000||
  !cleanRef(c.approvalReference)||!c.approvalReference.startsWith('CASE:'+c.caseId+':REQUEST:'+c.requestId+':')||
  !cleanRef(c.pairedOwnerDeskRestrictionReference)||!new RegExp('^'+c.caseId+':PLAN:[a-f0-9]{64}:.+').test(c.pairedOwnerDeskRestrictionReference)||
  !cleanRef(c.backupRestoreRestrictionReference)||!c.backupRestoreRestrictionReference.startsWith(c.caseId+':')||c.backupRestoreRestrictionReference.length<=c.caseId.length+1)throw Error('specific_owner_rights_case_required');
 if(ownerApprovalRecord.length>32768||createHash('sha256').update(ownerApprovalRecord).digest('hex')!==c.ownerApprovalEvidenceSha256)throw Error('case_approval_record_mismatch');
 let proof:Record<string,unknown>;try{
  const text=new TextDecoder('utf-8',{fatal:true}).decode(ownerApprovalRecord);proof=JSON.parse(text);
  // JSON.parse otherwise discards duplicate keys. Inspect decoded key tokens at
  // every nesting level so the JS/Python human-record interpretations agree.
  const tokens=/"(?:\\.|[^"\\])*"|[{}\[\]:,]/g,stack:(Set<string>|null)[]=[];let match:RegExpExecArray|null;
  while((match=tokens.exec(text))!==null){const token=match[0];if(token==='{')stack.push(new Set());else if(token==='[')stack.push(null);else if(token==='}'||token===']')stack.pop();
   else if(token.startsWith('"')&&/^\s*:/.test(text.slice(tokens.lastIndex))){const key=JSON.parse(token),keys=stack.at(-1);if(!keys||keys.has(key))throw Error();keys.add(key);}if(stack.length>20)throw Error();}
 }catch{throw Error('case_approval_record_mismatch');}
 for(const key of caseKeys)if(key!=='ownerApprovalEvidenceSha256'&&proof[key]!==c[key as keyof RightsCase])throw Error('case_approval_record_mismatch');
 return structuredClone(c);
}
/** Raw bodies are absent; retained IDs/digests/audit references are still pseudonymous data. */
export function completeRightsBodyScrub(value:unknown,requestId:string):boolean{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const p=value as Record<string,any>;
 if(p.schemaVersion!==2||p.requestId!==requestId||p.idempotencyTombstone!==true)return false;
 if(Object.keys(p).sort().join(',')==='idempotencyTombstone,requestId,schemaVersion')return true;
 if(Object.keys(p).sort().join(',')!=='idempotencyTombstone,requestId,rightsCaseAudit,schemaVersion')return false;
 const a=p.rightsCaseAudit;
 return a&&typeof a==='object'&&Object.keys(a).sort().join(',')==='appliedAt,approvedAt,caseId,caseSha256,ownerApprovalEvidenceSha256'&&UUID_V4.test(a.caseId)&&hex(a.caseSha256)&&hex(a.ownerApprovalEvidenceSha256)&&iso(a.approvedAt)&&iso(a.appliedAt);
}
async function snapshot(c:Pick<PoolClient,'query'>,requestId:string,lock=false):Promise<Snapshot>{
 if(!UUID_V4.test(requestId))throw Error('invalid_rights_target');
 const r=await c.query(`SELECT r.request_id,r.idempotency_key,r.state,r.normalized,r.receipt,o.payload,k.tombstoned
  FROM nfc_card.v2_requests r JOIN nfc_card.v2_identity_keys k ON k.cart_request_id=r.request_id
  JOIN nfc_card.v2_notification_outbox o ON o.request_id=r.request_id WHERE r.request_id=$1${lock?' FOR UPDATE OF r,k,o':''}`,[requestId]);
 if(r.rowCount!==1)throw Error('rights_target_unavailable');return r.rows[0] as Snapshot;
}
export async function planV2Rights(pool:Pool,requestId:string){
 const row=await snapshot(pool,requestId);
 return {operation:'REVIEW_REQUIRED_NO_MUTATION',requestId,sourceState:row.state,planSha256:digest(row),
  gatewayCopies:['v2_requests.normalized','v2_requests.receipt','v2_notification_outbox.payload'],
  retainedOpaqueIdentity:['v2_identity_keys','v2_publications'],
  outsideGatewayRequiresPairedOwnerReview:['OwnerDesk inbox and restriction ledger','operational logs','backup copies and restore restrictions'],
  purposeAndOrderRetentionReviewRequired:true,identityVerificationRequired:true,
  automaticallyDeletes:false,erasureDeadline:null,changesHistoricalPrice:false};
}
/** Manual case-scoped private operation. No HTTP route or scheduler invokes it. */
export async function applyV2RightsCase(pool:Pool,value:unknown,ownerApprovalRecord:Uint8Array){
 const approval=validateRightsCase(value,ownerApprovalRecord),caseSha256=digest(Object.fromEntries(Object.entries(approval).sort(([a],[b])=>a<b?-1:a>b?1:0))),c=await pool.connect();
 try{
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");
  const row=await snapshot(c,approval.requestId,true);
  if(row.state==='tombstone'||row.tombstoned){
   const audit=(row.payload as any)?.rightsCaseAudit;
   if(row.state!=='tombstone'||row.tombstoned!==true||row.normalized!==null||row.receipt!==null||!completeRightsBodyScrub(row.payload,approval.requestId)||audit?.caseSha256!==caseSha256)throw Error('rights_case_conflict');
   await c.query('COMMIT');return{requestId:approval.requestId,caseId:approval.caseId,caseSha256,applied:false,alreadyErased:true,bodyScrubbed:true,pseudonymousIdentityRetained:true};
  }
  if(digest(row)!==approval.planSha256||row.state!=='accepted')throw Error('rights_target_changed');
  const payload={schemaVersion:2,requestId:approval.requestId,idempotencyTombstone:true,rightsCaseAudit:{caseId:approval.caseId,caseSha256,ownerApprovalEvidenceSha256:approval.ownerApprovalEvidenceSha256,approvedAt:approval.approvedAt,appliedAt:new Date().toISOString()}};
  await c.query("UPDATE nfc_card.v2_requests SET normalized=NULL,receipt=NULL,state='tombstone' WHERE request_id=$1",[approval.requestId]);
  await c.query('UPDATE nfc_card.v2_identity_keys SET tombstoned=true WHERE cart_request_id=$1',[approval.requestId]);
  await c.query('UPDATE nfc_card.v2_notification_outbox SET payload=$2 WHERE request_id=$1',[approval.requestId,payload]);
  const after=await snapshot(c,approval.requestId);
  if(after.normalized!==null||after.receipt!==null||after.state!=='tombstone'||after.tombstoned!==true||!completeRightsBodyScrub(after.payload,approval.requestId))throw Error('incomplete_rights_restriction');
  await c.query('COMMIT');return{requestId:approval.requestId,caseId:approval.caseId,caseSha256,applied:true,alreadyErased:false,bodyScrubbed:true,pseudonymousIdentityRetained:true};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
}
/** Exercises the paired-erasure invariants ONLY on owned test data. Never a production erase API. */
export async function eraseSyntheticV2(pool:Pool,requestId:string,expectedPlanSha256:string){
 if(!/^[a-f0-9]{64}$/.test(expectedPlanSha256))throw Error('reviewed_plan_required');
 const c=await pool.connect();
 try{
  const info=await c.query("SELECT current_database() AS db,current_setting('server_version_num') AS version");
  if(!/^nfc_v35_[a-z0-9_]+_test$/.test(info.rows[0].db)||!String(info.rows[0].version).startsWith('17'))throw Error('isolated_postgres17_required');
  await c.query('BEGIN');await c.query("SET LOCAL lock_timeout='5s'");
  const row=await snapshot(c,requestId,true);
  if(digest(row)!==expectedPlanSha256)throw Error('rights_target_changed');
  const n=row.normalized,contact=n?.contact??{};
  if(row.state!=='accepted'||row.tombstoned||!n?.customerName?.startsWith('Synthetic')||
    (contact.email&&!/^[^@]+@[^@]+\.invalid$/i.test(contact.email))||
    (contact.phone&&contact.phone!=='+12025550123')||
    (contact.telegram&&!contact.telegram.startsWith('@synthetic')))throw Error('synthetic_rights_target_required');
  const minimal={schemaVersion:2,requestId,idempotencyTombstone:true};
  await c.query("UPDATE nfc_card.v2_requests SET normalized=NULL,receipt=NULL,state='tombstone' WHERE request_id=$1",[requestId]);
  await c.query('UPDATE nfc_card.v2_identity_keys SET tombstoned=true WHERE cart_request_id=$1',[requestId]);
  await c.query('UPDATE nfc_card.v2_notification_outbox SET payload=$2 WHERE request_id=$1',[requestId,minimal]);
  const after=await snapshot(c,requestId);
  if(after.normalized!==null||after.receipt!==null||after.state!=='tombstone'||after.tombstoned!==true||!isDeepStrictEqual(after.payload,minimal))throw Error('incomplete_rights_restriction');
  await c.query('COMMIT');return {requestId,syntheticOnly:true,erasureComplete:true,identityRetained:true,outboxScrubbed:true};
 }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
}
