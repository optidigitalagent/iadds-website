/** Owner-approved new-only Telegram routing, inside the existing outboxes/dispatcher. */
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import type {Pool,PoolClient} from 'pg';
import type {NfcLead} from './contract.ts';
import type {NormalizedRequest,Receipt} from './v2/contract.ts';
import type {ApprovedPolicy} from './v2/policy.ts';
import {nfcLog} from './logger.ts';

export const ROUTING_APPROVAL='NFC-CARD-SITE-ORDERS-OWNER-20261105';
export const ROUTES=Object.freeze({ORIG:'-5531022071',BRAND:'-5441287655'});
export const ENTRY_ROUTE:Readonly<Record<string,'ORIG'|'BRAND'>>=Object.freeze({
 'review-card':'ORIG','beauty-review-card':'ORIG','restaurant-review-card':'ORIG','nfc-instagram-card':'ORIG',
 'branded-review-card':'BRAND','branded-beauty-review-card':'BRAND','branded-restaurant-review-card':'BRAND',
 'nfc-menu-card':'BRAND','review-card-3d':'BRAND',
});
export type RoutingConfig={cutover:string;approvalReference:typeof ROUTING_APPROVAL};
export type RoutePlan={route:'ORIG'|'BRAND'|'MIXED'|'UNKNOWN';chatId:string|null;reason:string|null};
export function routeEntries(entries:readonly string[]):RoutePlan {
 const routes=entries.map(id=>Object.hasOwn(ENTRY_ROUTE,id)?ENTRY_ROUTE[id]:undefined);
 if(!routes.length||routes.some(x=>!x))return {route:'UNKNOWN',chatId:null,reason:'UNMAPPED_EXACT_ENTRY'};
 const unique=[...new Set(routes)];
 if(unique.length!==1)return {route:'MIXED',chatId:null,reason:'NO_APPROVED_MIXED_SPLIT_RULE'};
 const route=unique[0]!;return {route,chatId:ROUTES[route],reason:null};
}
export function planV2(n:NormalizedRequest):RoutePlan{return routeEntries(n.lines.length?n.lines.map(x=>x.entryId):n.serviceContext?[n.serviceContext.entryId]:[]);}
export function planV1(n:NfcLead):RoutePlan {
 const id=n.solution?.solution_id??n.product;
 return routeEntries([id]);
}
export function readRoutingConfig(env:Record<string,string|undefined>,policy:ApprovedPolicy|undefined):RoutingConfig|undefined {
 const flag=env.NFC_ORDER_ROUTING_ENABLED??'false';if(!['true','false'].includes(flag))throw Error('invalid_order_routing_flag');
 if(flag==='false')return;
 const cutover=env.NFC_ORDER_ROUTING_CUTOVER??'';
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(cutover)||!Number.isFinite(Date.parse(cutover))||
  policy?.approvalReference!==ROUTING_APPROVAL)throw Error('approved_new_only_order_routing_required');
 return {cutover,approvalReference:ROUTING_APPROVAL};
}
export const migrationSql=()=>readFileSync(new URL('../../migrations/nfc-card/013_order_routing.sql',import.meta.url),'utf8');
export const migrationSha=()=>createHash('sha256').update(migrationSql()).digest('hex');
export async function routingSchemaReady(pool:Pool):Promise<boolean>{
 const r=await pool.query("SELECT checksum FROM nfc_card.schema_migrations WHERE version='013_order_routing'");
 return r.rows.length===1&&r.rows[0].checksum===migrationSha();
}
export async function markRoute(c:PoolClient,kind:'v1'|'v2',id:string,plan:RoutePlan,config:RoutingConfig,acceptedAt:string):Promise<boolean>{
 if(Date.parse(acceptedAt)<Date.parse(config.cutover))return false;
 const enabled=plan.chatId!==null,table=kind==='v1'?'notification_outbox':'v2_notification_outbox',state=kind==='v1'?'status':'state';
 await c.query(`UPDATE nfc_card.${table} SET routing_route=$2,routing_chat_id=$3,routing_approval_reference=$4,
  routing_source_accepted_at=$5,routing_enabled_after=$6,delivery_enabled=$7,${state}=$8,safe_error_category=$9
  ${kind==='v2'?",payload=jsonb_set(payload,'{send_authorized}',to_jsonb($7::boolean))":''}
  WHERE ${kind==='v1'?'lead_id':'request_id'}=$1 AND routing_route IS NULL`,
 [id,plan.route,plan.chatId,config.approvalReference,acceptedAt,config.cutover,enabled,enabled?'pending':'waiting_routing',plan.reason]);
 return enabled;
}
export type RoutingMessage={chatId:string;caption:string;fileName:string;bytes:Uint8Array};
export type RoutingDelivery={status:'sent';messageId:number;chatId:string;documentUniqueId?:string}|{status:'retry'|'failed';category:'rate_limit'|'upstream'|'configuration'|'outcome_unknown';retryAfter?:number};
export type RoutingSender=(message:RoutingMessage)=>Promise<RoutingDelivery>;
export function routingMessage(kind:'v1'|'v2',id:string,chatId:string,data:Record<string,unknown>):RoutingMessage {
 const receipt=kind==='v2'?data as unknown as Receipt:undefined;
 const n=receipt?.acceptedRequest;
 const legacy=data.lead as Record<string,any>|undefined;
 const entries=n?(n.lines.length?n.lines.map(x=>x.entryId):n.serviceContext?[n.serviceContext.entryId]:[]):
  [String(legacy?.mini_context?.solution_id??legacy?.solution?.solution_id??legacy?.product??'')];
 const quantity=n?(n.kind==='physical_order'?n.lines.reduce((s,x)=>s+x.quantity,0):null):
  (legacy?.intent==='menu_consultation'||legacy?.solution?.schemaVersion===1||['advice','free_design_concepts'].includes(legacy?.mini_context?.quantity_mode)?null:legacy?.quantity);
 const customer=n?.customerName??legacy?.customer_name??legacy?.customerName;
 const caption=['NEW NFC CARD LEAD','/nfc_lead@skdfjeriobot','Order #'+id,'Source: NFC_CARD '+kind,
  'SKU: '+[...new Set(entries)].join(', '),quantity===null||quantity===undefined?null:'Quantity: '+quantity,
  customer?'Client: '+customer:null,'LEAD — seller, agreement and payment unconfirmed.',
  'Full submitted fields and original quote: attached source document.'].filter(Boolean).join('\n');
 if(caption.length>1024)throw Error('routing_caption_overflow');
 const document={source:'NFC_CARD',sourceApplicationId:id,sourceVersion:kind,recordType:'LEAD',sellerStatus:'UNKNOWN',
  paymentStatus:'UNCONFIRMED',agreedOrder:false,priceMeaning:'SOURCE_QUOTE_NOT_AGREED_SALE_OR_PAYMENT',sourceRecord:data};
 return {chatId,caption,fileName:'NFC_CARD_'+id+'.json',bytes:Buffer.from(JSON.stringify(document,null,2)+'\n')};
}
function legacyData(row:Record<string,any>):Record<string,unknown>{
 // Preserve every persisted application field and its original quote, without database-only identity/queue metadata.
 const skip=new Set(['id','idempotency_key','request_digest','routing_route','routing_chat_id']);
 return {acceptedAt:row.created_at instanceof Date?row.created_at.toISOString():row.created_at,
  lead:Object.fromEntries(Object.entries(row).filter(([k])=>!skip.has(k))),quote:row.price_quote};
}
export async function drainRoutes(pool:Pool,config:RoutingConfig|undefined,send:RoutingSender):Promise<number>{
 if(!config)return 0;let processed=0;
 for(const kind of ['v2','v1'] as const){
  const table=kind==='v1'?'notification_outbox':'v2_notification_outbox',state=kind==='v1'?'status':'state',key=kind==='v1'?'lead_id':'request_id';
  const expired=await pool.query(`UPDATE nfc_card.${table} SET ${state}='outcome_unknown',safe_error_category='outcome_unknown',updated_at=now()
   WHERE routing_route IS NOT NULL AND ${state}='sending' AND claimed_at<now()-interval '2 minutes' RETURNING ${key} source_id`);
  for(const item of expired.rows)nfcLog({leadId:item.source_id,category:'outcome_unknown'});
  const c=await pool.connect();let row:any,message:RoutingMessage|undefined;
  try{
   await c.query('BEGIN');
   row=(await c.query(`SELECT * FROM nfc_card.${table} WHERE routing_route IN ('ORIG','BRAND') AND delivery_enabled
    AND routing_approval_reference=$1 AND routing_source_accepted_at>=routing_enabled_after AND routing_enabled_after=$2
    AND ${state} IN ('pending','retry') AND attempt_count<4 AND next_attempt_at<=now()
    ORDER BY next_attempt_at,${key} LIMIT 1 FOR UPDATE SKIP LOCKED`,[config.approvalReference,config.cutover])).rows[0];
   if(row){
    const source=(await c.query(`SELECT * FROM nfc_card.${kind==='v1'?'leads':'v2_requests'} WHERE ${key}=$1`,[row[key]])).rows[0];
    if(!source||source.state==='tombstone'||source.is_test||source.is_final_test){
     await c.query(`UPDATE nfc_card.${table} SET ${state}='failed',delivery_enabled=false,safe_error_category='SOURCE_NOT_SENDABLE',updated_at=now() WHERE ${key}=$1`,[row[key]]);
    }else{
     const data=kind==='v2'?source.receipt:legacyData(source);
     message=routingMessage(kind,row[key],String(row.routing_chat_id),data);
     await c.query(`UPDATE nfc_card.${table} SET ${state}='sending',attempt_count=attempt_count+1,claimed_at=now(),updated_at=now(),delivery_payload_sha256=$2 WHERE ${key}=$1`,[row[key],createHash('sha256').update(message.bytes).digest('hex')]);
    }
   }
   await c.query('COMMIT');
  }catch(e){await c.query('ROLLBACK').catch(()=>{});throw e;}finally{c.release();}
  if(!row||!message)continue;
  let result:RoutingDelivery;try{result=await send(message);}catch{result={status:'failed',category:'outcome_unknown'};}
  const attempt=row.attempt_count+1;
  const status=result.status==='sent'?'sent':result.category==='outcome_unknown'?'outcome_unknown':result.status==='retry'&&attempt<4?'retry':'failed';
  const category=result.status==='sent'?null:result.status==='retry'&&attempt>=4?'exhausted':result.category;
  const delay=result.status==='sent'?0:Math.max(10*2**(attempt-1),result.retryAfter??0);
  await pool.query(`UPDATE nfc_card.${table} SET ${state}=$2,safe_error_category=$3,next_attempt_at=now()+($4*interval '1 second'),updated_at=now(),
   sent_at=CASE WHEN $2='sent' THEN now() ELSE NULL END,telegram_message_id=$5,telegram_document_unique_id=$6
   WHERE ${key}=$1 AND ${state}='sending'`,[row[key],status,category,delay,result.status==='sent'?result.messageId:null,result.status==='sent'?result.documentUniqueId??null:null]);
  processed++;
  nfcLog({leadId:row[key],category:status,retryCount:attempt-1});
 }
 return processed;
}
