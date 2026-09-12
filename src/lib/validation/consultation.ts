import { isLocale,publicWebsite,safeSourcePage,validModel } from '@/lib/urls';
import type { CollaborationModel,Locale } from '@/types/content';
import { contactMethods,normalizePhone,type PreferredContact } from '../../../services/lead-gateway/src/contact';
export interface ConsultationInput {
 formSchemaVersion:2; source:'iadds'; fullName:string; phone:string; phoneNormalized:string; preferredContact:PreferredContact|''; company:string; email:string; companyUrl:string; selectedService:string;
 message:string; communicationLanguage:Locale|''; consent:boolean; collaborationModel:CollaborationModel|''; currentLocale:Locale; sourcePage:string;
}
export type FieldName='fullName'|'phone'|'preferredContact'|'company'|'email'|'companyUrl'|'selectedService'|'message'|'communicationLanguage'|'consent';
export type FormErrors=Partial<Record<FieldName,string>>;
export type ValidationMessages=Record<FieldName,string>;
export const fieldOrder:FieldName[]=['fullName','phone','preferredContact','selectedService','email','company','companyUrl','message','communicationLanguage','consent'];
export const emptyInput:ConsultationInput={formSchemaVersion:2,source:'iadds',fullName:'',phone:'',phoneNormalized:'',preferredContact:'',company:'',email:'',companyUrl:'',selectedService:'',message:'',communicationLanguage:'uk',consent:false,collaborationModel:'',currentLocale:'uk',sourcePage:'/uk'};
export function omitEmptyOptionalFields(data:ConsultationInput) {
 const {email,company,companyUrl,message,...required}=data;
 return {...required,...(email?{email}:{}),...(company?{company}:{}),...(companyUrl?{companyUrl}:{}),...(message?{message}:{})};
}
function clean(value:unknown) {return typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim():'';}
export function validateConsultation(raw:unknown,serviceSlugs:string[],messages:ValidationMessages):{data:ConsultationInput;errors:FormErrors;valid:boolean} {
 const input=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const currentLocale=isLocale(input.currentLocale)?input.currentLocale:'uk';
 const phone=typeof input.phone==='string'?input.phone.trim():'';
 const data:ConsultationInput={formSchemaVersion:2,source:'iadds',fullName:clean(input.fullName),phone,phoneNormalized:normalizePhone(phone)||'',preferredContact:contactMethods.includes(input.preferredContact as PreferredContact)?input.preferredContact as PreferredContact:'',company:clean(input.company),email:typeof input.email==='string'?input.email.trim().toLowerCase():'',companyUrl:typeof input.companyUrl==='string'?input.companyUrl.trim():'',selectedService:clean(input.selectedService),message:clean(input.message),communicationLanguage:input.communicationLanguage===undefined?currentLocale:isLocale(input.communicationLanguage)?input.communicationLanguage:'',consent:input.consent===true,collaborationModel:validModel(input.collaborationModel),currentLocale,sourcePage:safeSourcePage(input.sourcePage,currentLocale)};
 const errors:FormErrors={};
 for(const name of ['email','company','companyUrl','message'] as const) if(input[name]!==undefined&&typeof input[name]!=='string') errors[name]=messages[name];
 for(const [name,min,max] of [['fullName',2,100],['company',0,120],['message',0,1500]] as const) if(data[name].length<min||data[name].length>max) errors[name]=messages[name];
 if(!data.phoneNormalized) errors.phone=messages.phone;
 if(!data.preferredContact) errors.preferredContact=messages.preferredContact;
 if((data.preferredContact==='email'&&!data.email)||data.email.length>254||(data.email&&!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email))) errors.email=messages.email;
 if(data.companyUrl.length>300||(data.companyUrl&&!publicWebsite(data.companyUrl))) errors.companyUrl=messages.companyUrl;
 if(![...serviceSlugs,'not-sure','several','custom-ai-system'].includes(data.selectedService)) errors.selectedService=messages.selectedService;
 if(!data.communicationLanguage) errors.communicationLanguage=messages.communicationLanguage;
 if(!data.consent) errors.consent=messages.consent;
 return {data,errors,valid:Object.keys(errors).length===0};
}
