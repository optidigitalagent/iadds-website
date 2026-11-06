/** One owner-approved batch. Existing browser HMAC + idempotency authorization;
 * no public grant endpoint and no alternative routing/parser. */
import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import type {Pool} from 'pg';
import type {NormalizedRequest} from './v2/contract.ts';
export const CONTROL_RUN='NFC-E2E-20261106T113357Z-69d56f61';
export const CONTROL_HEADER='x-nfc-control-context';
export const CONTROL_CASES=Object.freeze({
 [CONTROL_RUN+'-WEB-BRAND']:{origin:'WEB',entryId:'branded-review-card',chatId:'-5441287655'},
 [CONTROL_RUN+'-WEB-ORIG']:{origin:'WEB',entryId:'review-card',chatId:'-5531022071'},
 [CONTROL_RUN+'-HUMAN-BRAND']:{origin:'HUMAN',entryId:null,chatId:'-5441287655'},
 [CONTROL_RUN+'-HUMAN-ORIG']:{origin:'HUMAN',entryId:'review-card',chatId:'-5531022071'},
} as const);
export type ControlContext={version:1;runId:string;caseId:string|null;origin:'WEB';trusted:boolean;state:'VALID'|'QUARANTINED';reason:string|null;blockEffects:true;expectedChatId:string|null};
type Grant={version:1;runId:string;caseId:string;nonce:string;expiresAt:number};
const UUID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const entry=(id:string)=>CONTROL_CASES[id as keyof typeof CONTROL_CASES];
const mac=(secret:string,text:string)=>createHmac('sha256',secret).update(text).digest('base64url');
function same(a:string,b:string){return a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));}
/** Called only by the authorised operator using the existing private gateway key. */
export function issueControlGrant(secret:string,caseId:string,nonce:string,now=Date.now()):string{
 if(secret.length<32||entry(caseId)?.origin!=='WEB'||!UUID.test(nonce))throw Error('invalid_control_grant');
 const g:Grant={version:1,runId:CONTROL_RUN,caseId,nonce,expiresAt:now+86400000};
 const raw=Buffer.from(JSON.stringify(g)).toString('base64url');
 return raw+'.'+mac(secret,'nfc-control-grant-v1.'+raw);
}
export function resolveControlContext(token:string|null,key:string,n:NormalizedRequest,secret:string,now=Date.now()):ControlContext|null{
 const marker=Object.keys(CONTROL_CASES).find(id=>JSON.stringify(n).includes(id));
 if(!token&&!marker)return null;
 let grant:Partial<Grant>={},signatureOK=false;
 if(token&&token.length<=2048){
  const parts=token.split('.');
  if(parts.length===2&&/^[A-Za-z0-9_-]+$/.test(parts[0])&&/^[A-Za-z0-9_-]{43}$/.test(parts[1])){
   try{const v=JSON.parse(Buffer.from(parts[0],'base64url').toString('utf8'));if(v&&typeof v==='object'&&!Array.isArray(v))grant=v;signatureOK=same(parts[1],mac(secret,'nfc-control-grant-v1.'+parts[0]));}catch{/* preserve as quarantined, not a public test grant */}
  }
 }
 const caseId=typeof grant.caseId==='string'&&entry(grant.caseId)?grant.caseId:marker??null;
 const spec=caseId?entry(caseId):undefined;
 const trusted=signatureOK&&grant.version===1&&grant.runId===CONTROL_RUN&&spec?.origin==='WEB'&&grant.nonce===key&&UUID.test(key);
 let reason=!token?'MISSING_PROOF':!signatureOK?'INVALID_PROOF':!trusted?'CONTEXT_CONFLICT':!Number.isSafeInteger(grant.expiresAt)||Number(grant.expiresAt)<now?'EXPIRED_PROOF':null;
 if(!reason&&(n.kind!=='physical_order'||n.lines.length!==1||n.lines[0].entryId!==spec?.entryId||n.lines[0].quantity!==1))reason='CASE_CONTENT_CONFLICT';
 if(!reason&&marker&&marker!==caseId)reason='CASE_MARKER_CONFLICT';
 return {version:1,runId:CONTROL_RUN,caseId,origin:'WEB',trusted,state:reason?'QUARANTINED':'VALID',reason,blockEffects:true,expectedChatId:spec?.chatId??null};
}
/** Run-scoped verifier; never export the gateway's broader browser HMAC key. */
export function controlVerifierKey(secret:string):Buffer{return createHmac('sha256',secret).update('nfc-control-verify-v1.'+CONTROL_RUN).digest();}
export function controlMessageLine(context:ControlContext,sourceId:string,secret:string):string{
 if(!UUID.test(sourceId))throw Error('invalid_control_source');
 const body=['CT1',CONTROL_RUN,context.caseId??'-',sourceId,context.trusted?'TEST':'REVIEW',context.reason??'-'].join('|');
 return body+'|'+createHmac('sha256',controlVerifierKey(secret)).update('nfc-control-message-v1.'+body).digest('hex');
}
export const controlMigrationSql=()=>readFileSync(new URL('../../migrations/nfc-card/014_control_context.sql',import.meta.url),'utf8');
export const controlMigrationSha=()=>createHash('sha256').update(controlMigrationSql()).digest('hex');
export async function controlSchemaReady(pool:Pool):Promise<boolean>{
 const r=await pool.query("SELECT checksum FROM nfc_card.schema_migrations WHERE version='014_control_context'");
 return r.rows.length===1&&r.rows[0].checksum===controlMigrationSha();
}
