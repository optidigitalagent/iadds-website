import { isLocale,publicWebsite,safeSourcePage,validModel } from '@/lib/urls';
import type { CollaborationModel,Locale } from '@/types/content';
export interface ConsultationInput {
 fullName:string; company:string; role:string; email:string; contactMethod:string; companyUrl:string; selectedService:string;
 message:string; communicationLanguage:Locale|''; consent:boolean; collaborationModel:CollaborationModel|''; currentLocale:Locale; sourcePage:string;
}
export type FieldName='fullName'|'company'|'role'|'email'|'contactMethod'|'companyUrl'|'selectedService'|'message'|'communicationLanguage'|'consent';
export type FormErrors=Partial<Record<FieldName,string>>;
export type ValidationMessages=Record<FieldName,string>;
export const fieldOrder:FieldName[]=['fullName','company','role','email','contactMethod','companyUrl','selectedService','message','communicationLanguage','consent'];
export const emptyInput:ConsultationInput={fullName:'',company:'',role:'',email:'',contactMethod:'',companyUrl:'',selectedService:'',message:'',communicationLanguage:'uk',consent:false,collaborationModel:'',currentLocale:'uk',sourcePage:'/uk'};
function clean(value:unknown) {return typeof value==='string'?value.replace(/<[^>]*>/g,'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,'').trim():'';}
export function validateConsultation(raw:unknown,serviceSlugs:string[],messages:ValidationMessages):{data:ConsultationInput;errors:FormErrors;valid:boolean} {
 const input=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const currentLocale=isLocale(input.currentLocale)?input.currentLocale:'uk';
 const data:ConsultationInput={fullName:clean(input.fullName),company:clean(input.company),role:clean(input.role),email:clean(input.email).toLowerCase(),contactMethod:clean(input.contactMethod),companyUrl:clean(input.companyUrl),selectedService:clean(input.selectedService),message:clean(input.message),communicationLanguage:isLocale(input.communicationLanguage)?input.communicationLanguage:'',consent:input.consent===true,collaborationModel:validModel(input.collaborationModel),currentLocale,sourcePage:safeSourcePage(input.sourcePage,currentLocale)};
 const errors:FormErrors={};
 for(const [name,min,max] of [['fullName',2,100],['company',2,120],['role',0,100],['contactMethod',0,80],['message',10,1500]] as const) if(data[name].length<min||data[name].length>max) errors[name]=messages[name];
 if(data.email.length>254||!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(data.email)) errors.email=messages.email;
 if(data.companyUrl.length>300||!publicWebsite(data.companyUrl)) errors.companyUrl=messages.companyUrl;
 if(![...serviceSlugs,'not-sure','several','custom-ai-system'].includes(data.selectedService)) errors.selectedService=messages.selectedService;
 if(!data.communicationLanguage) errors.communicationLanguage=messages.communicationLanguage;
 if(!data.consent) errors.consent=messages.consent;
 return {data,errors,valid:Object.keys(errors).length===0};
}
