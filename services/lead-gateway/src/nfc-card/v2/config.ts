/** Opt-in runtime configuration. Existing v1 configuration has no new requirements. */
import { approvedPolicy,type ApprovedPolicy } from './policy.ts';
import { readFileSync,lstatSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isAbsolute,dirname,join } from 'node:path';
export type V2RuntimeConfig={mode:'disabled'|'synthetic-preview'|'approved-intake';origin:string;secret:string;databaseName:string;gatewayCommit?:string;inboundReadSecret?:string;policy?:ApprovedPolicy};
export function readV2Config(env:Record<string,string|undefined>=process.env):V2RuntimeConfig {
 const mode=env.NFC_V2_MODE??'disabled';
 if(mode==='disabled')return {mode,origin:'',secret:'',databaseName:''};
 if(!['synthetic-preview','approved-intake'].includes(mode))throw new Error('invalid_nfc_v2_configuration');
 const origin=env.NFC_V2_ORIGIN??'',secret=env.NFC_V2_SECRET??'',inboundReadSecret=env.NFC_V2_INBOUND_READ_SECRET??'';
 if(secret.length<32||inboundReadSecret.length<32||secret===inboundReadSecret||[secret,inboundReadSecret].some(s=>[env.LEAD_SOURCE_NFC_CARD_SECRET,env.LEAD_SOURCE_IADDS_SECRET,env.NFC_INBOUND_READ_SECRET].includes(s)))throw new Error('invalid_nfc_v2_secret_isolation');
 let db:URL;try{db=new URL(env.NFC_DATABASE_URL??'');}catch{throw new Error('invalid_nfc_v2_database');}
 if(!['postgres:','postgresql:'].includes(db.protocol))throw new Error('invalid_nfc_v2_database');
 const databaseName=decodeURIComponent(db.pathname.slice(1));
 let policy:unknown;
 if(mode==='approved-intake'){
  const path=env.NFC_V2_POLICY_FILE??'';
  if(!isAbsolute(path))throw new Error('notice_policy_not_approved');
  try{
   const st=lstatSync(path);if(!st.isFile()||st.isSymbolicLink()||st.size>262144)throw new Error();
   policy=JSON.parse(readFileSync(path,'utf8'));
   const proofPath=env.NFC_V2_APPROVAL_FILE??join(dirname(path),'B05_OWNER_APPROVAL.json');if(!isAbsolute(proofPath))throw new Error();
   const ps=lstatSync(proofPath);if(!ps.isFile()||ps.isSymbolicLink()||ps.size>32768)throw new Error();
   const raw=readFileSync(proofPath),record=JSON.parse(raw.toString('utf8')),p=policy as ApprovedPolicy&{sourceApprovalSha256?:string;publicTextSha256?:string};
   if(!/^[a-f0-9]{64}$/.test(p.sourceApprovalSha256??'')||!p.publicTextSha256||
     createHash('sha256').update(raw).digest('hex')!==p.sourceApprovalSha256||record.decisionId!==p.approvalReference||
     record.policyBodySHA256!==p.policySha256||record.publicTextSHA256!==p.publicTextSha256)throw new Error();
  }catch{throw new Error('notice_policy_not_approved');}
 }
 if(mode==='synthetic-preview'&&(!/^nfc_v35_[a-z0-9_]+_test$/.test(databaseName)||!/^http:\/\/(?:localhost|127\.0\.0\.1):\d+$/.test(origin)))throw new Error('isolated_preview_configuration_required');
 if(mode==='approved-intake'&&(!/^https:\/\/[a-z0-9.-]+(?::443)?$/i.test(origin)||!approvedPolicy(policy)))throw new Error('notice_policy_not_approved');
 return {mode:mode as V2RuntimeConfig['mode'],origin,secret,databaseName,inboundReadSecret,...(/^[a-f0-9]{40}$/.test(env.RAILWAY_GIT_COMMIT_SHA??'')?{gatewayCommit:env.RAILWAY_GIT_COMMIT_SHA}:{}),...(mode==='approved-intake'?{policy:policy as import('./policy.ts').ApprovedPolicy}:{})};
}
