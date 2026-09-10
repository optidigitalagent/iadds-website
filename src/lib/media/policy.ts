import type { MediaApproval, MediaEnvironment } from '@/types/service-media';
/** A global environment flag never approves rights. Production requires explicit per-asset evidence. */
export function approvalEvidenceComplete(a:MediaApproval) {return ['owned','licensed','approved-for-publication'].includes(a.rightsStatus)&&a.reviewStatus==='approved'&&Boolean(a.approvedBy?.trim()&&a.evidence?.trim()&&a.approvedAt&&!Number.isNaN(Date.parse(a.approvedAt)));}
export function publicationApproved(a:MediaApproval) {return a.publicationScope==='production'&&approvalEvidenceComplete(a);}
export function canShowExample(a:MediaApproval,environment:MediaEnvironment){return publicationApproved(a)||(environment==='local'&&a.reviewStatus!=='rejected'&&['local','staging'].includes(a.publicationScope));}
export function mediaEnvironment(env:NodeJS.ProcessEnv=process.env):MediaEnvironment {
 if((env.NODE_ENV==='production'&&env.IADDS_REVIEW_BUILD!=='true')||env.IADDS_MEDIA_MODE!=='local')return 'production';
 try{return ['127.0.0.1','localhost','[::1]'].includes(new URL(env.SITE_URL??'').hostname)?'local':'production';}catch{return 'production';}
}
