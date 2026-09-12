'use client';
import {useEffect,useRef,useState,useSyncExternalStore,type FormEvent,type ReactNode} from 'react';
import {Arrow} from '@/components/ui/primitives';
import type {Dictionary} from '@/content/en/site';
import type {CollaborationModel,Locale} from '@/types/content';
import {emptyInput,fieldOrder,omitEmptyOptionalFields,validateConsultation,type ConsultationInput,type FieldName,type FormErrors} from '@/lib/validation/consultation';
import {track} from '@/lib/analytics';
import styles from './form.module.css';
type FormCopy=Dictionary['consultation'];
type Props={copy:FormCopy;locale:Locale;sourcePage:string;services:{slug:string;title:string}[];selectedService?:string;collaborationModel:CollaborationModel|'';support:{label:string;email:string;emailHref:string;telegram:string}};
type Success={referenceId:string;mode:'local'|'webhook'};
const subscribeToHydration=()=>()=>undefined;
function FormField({name,label,optional,hint,error,children}:{name:string;label:string;optional?:boolean;hint?:string;error?:string;children:ReactNode}) {return <div className={styles.field+' '+(['companyUrl','selectedService','message','communicationLanguage'].includes(name)?styles.fullWidth:'')}><label htmlFor={'field-'+name}>{label} {!optional&&<span aria-hidden="true">*</span>}</label>{hint&&<p id={'hint-'+name} className={styles.hint}>{hint}</p>}{children}<p id={'error-'+name} className={styles.fieldError}>{error||'\u00a0'}</p></div>;}
function FormErrorSummary({errors,title,copy}:{errors:FormErrors;title:string;copy:FormCopy}) {return <div className={styles.errorSummary} role="alert"><p>{title}</p><ul>{fieldOrder.filter(name=>errors[name]).map(name=><li key={name}><a href={'#field-'+name} onClick={e=>{e.preventDefault();document.getElementById('field-'+name)?.focus();}}>{name==='consent'?copy.validation.consent:copy.fields[name]}</a></li>)}</ul></div>;}
function FormSuccessState({result,copy,reset}:{result:Success;copy:FormCopy;reset:()=>void}) {const heading=useRef<HTMLHeadingElement>(null);useEffect(()=>{heading.current?.focus();},[]);return <div className={styles.success} role="status" aria-live="polite"><span className={styles.successIcon} aria-hidden="true">✓</span><h2 ref={heading} tabIndex={-1}>{result.mode==='local'?copy.localTitle:copy.successTitle}</h2><p>{result.mode==='local'?copy.localBody:copy.successBody}</p><div className={styles.reference}><span>{copy.reference}</span><code data-reference>{result.referenceId}</code></div><button type="button" onClick={reset} className={styles.reset}>{copy.newEnquiry}<Arrow /></button></div>;}
export function ConsultationForm({copy,locale,sourcePage,services,selectedService,collaborationModel,support}:Props) {
 const hydrated=useSyncExternalStore(subscribeToHydration,()=>true,()=>false);
 const initial:ConsultationInput={...emptyInput,currentLocale:locale,communicationLanguage:locale,sourcePage,collaborationModel,selectedService:services.some(s=>s.slug===selectedService)?selectedService!:collaborationModel==='system'?'custom-ai-system':''};
 const [values,setValues]=useState(initial),[errors,setErrors]=useState<FormErrors>({}),[showSummary,setShowSummary]=useState(false);
 const [pending,setPending]=useState(false),[serverMessage,setServerMessage]=useState(''),[success,setSuccess]=useState<Success|null>(null);
 const started=useRef(false),submitting=useRef(false),preselectionTracked=useRef(false),attempt=useRef<{key:string;body:string}|null>(null),honeypot=useRef<HTMLInputElement>(null);
 const slugs=services.map(s=>s.slug);
 useEffect(()=>{if(selectedService&&!preselectionTracked.current){preselectionTracked.current=true;track({name:'consultation_service_preselected',properties:{locale,sourcePage,serviceSlug:selectedService}});}},[selectedService,locale,sourcePage]);
 function update(name:FieldName,value:string|boolean) {setValues(previous=>({...previous,[name]:value}));setErrors(previous=>({...previous,[name]:undefined,...(name==='preferredContact'?{email:undefined}:{})}));setServerMessage('');}
 function blur(name:FieldName) {const validation=validateConsultation(values,slugs,copy.validation);setErrors(previous=>({...previous,[name]:validation.errors[name]}));}
 function attributes(name:FieldName,hint=false) {return {id:'field-'+name,name,'aria-invalid':Boolean(errors[name]),'aria-describedby':(hint?'hint-'+name+' ':'')+'error-'+name,onBlur:()=>blur(name)};}
 async function submit(event:FormEvent<HTMLFormElement>) {
  event.preventDefault();if(submitting.current) return;
  const validation=validateConsultation(values,slugs,copy.validation);setErrors(validation.errors);setShowSummary(!validation.valid);setServerMessage('');
  if(!validation.valid){document.getElementById('field-'+fieldOrder.find(name=>validation.errors[name]))?.focus();return;}
  submitting.current=true;setPending(true);
  const body=JSON.stringify({...omitEmptyOptionalFields(validation.data),companyFax:honeypot.current?.value||''});
  if(!attempt.current||attempt.current.body!==body) attempt.current={key:crypto.randomUUID(),body};
  try {
   const response=await fetch('/api/consultation',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.current.key},body:JSON.stringify({...JSON.parse(body),referenceId:attempt.current.key}),signal:AbortSignal.timeout(15000)});
   const result:{code?:string;referenceId?:string;mode?:'local'|'webhook';errors?:FormErrors}=await response.json();
   if(response.ok&&result.referenceId&&(result.mode==='local'||result.mode==='webhook')) {setSuccess({referenceId:result.referenceId,mode:result.mode});track({name:'consultation_submit_success',properties:{locale,sourcePage,serviceSlug:validation.data.selectedService,collaborationModel:validation.data.collaborationModel||undefined}});}
   else {
    if(result.code==='validation'&&result.errors){const safeErrors:FormErrors={};for(const name of fieldOrder) if(result.errors[name]) safeErrors[name]=copy.validation[name];setErrors(safeErrors);setShowSummary(true);document.getElementById('field-'+fieldOrder.find(name=>safeErrors[name]))?.focus();}
    setServerMessage(response.status===429?copy.rateLimit:response.status===422?copy.invalid:copy.unavailable);track({name:'consultation_submit_error',properties:{locale,sourcePage,errorType:String(response.status)}});
   }
  } catch {setServerMessage(copy.network);track({name:'consultation_submit_error',properties:{locale,sourcePage,errorType:'network'}});}
  finally {submitting.current=false;setPending(false);}
 }
 function reset(){setSuccess(null);setValues(initial);setErrors({});setShowSummary(false);setServerMessage('');attempt.current=null;started.current=false;}
 if(success) return <div className={styles.formPanel}><FormSuccessState result={success} copy={copy} reset={reset} /></div>;
 const inputs=[{name:'fullName',autoComplete:'name',maxLength:100,type:'text'},{name:'phone',autoComplete:'tel',maxLength:50,type:'tel'}] as const;
 const optionalInputs=[{name:'email',autoComplete:'email',maxLength:254,type:'email'},{name:'company',autoComplete:'organization',maxLength:120,type:'text'},{name:'companyUrl',autoComplete:'url',maxLength:300,type:'url'}] as const;
 return <div className={styles.formPanel}><h2>{copy.formTitle}</h2><p className={styles.formNote}>{copy.formNote}</p>{collaborationModel&&<p className={styles.modelContext} data-model-context>{copy.modelLabel}: <strong>{collaborationModel==='system'?copy.systemModel:copy.productionModel}</strong></p>}<noscript><p className={styles.errorSummary}>{copy.javascript}</p></noscript><form action="/api/consultation" method="post" onSubmit={submit} noValidate aria-busy={pending} onFocus={()=>{if(!started.current){started.current=true;track({name:'consultation_form_start',properties:{locale,sourcePage}});}}}>
 {showSummary&&Object.values(errors).some(Boolean)&&<FormErrorSummary errors={errors} title={copy.errorTitle} copy={copy} />}
 <fieldset disabled={pending} className={styles.fieldset}><div className={styles.fields}>
 {inputs.map(input=><FormField key={input.name} name={input.name} label={copy.fields[input.name]} error={errors[input.name]}><input {...attributes(input.name)} type={input.type} autoComplete={input.autoComplete} maxLength={input.maxLength} value={values[input.name]} required onChange={e=>update(input.name,e.target.value)} /></FormField>)}
 <FormField name="preferredContact" label={copy.fields.preferredContact} error={errors.preferredContact}><select {...attributes('preferredContact')} value={values.preferredContact} required onChange={e=>update('preferredContact',e.target.value)}><option value="">{copy.contactSelect}</option>{copy.contactOptions.map(option=><option value={option.value} key={option.value}>{option.label}</option>)}</select></FormField>
 <FormField name="selectedService" label={copy.fields.selectedService} error={errors.selectedService}><select {...attributes('selectedService')} value={values.selectedService} required onChange={e=>update('selectedService',e.target.value)}><option value="">{copy.select}</option>{services.map(service=><option value={service.slug} key={service.slug}>{service.title}</option>)}<option value="not-sure">{copy.unsure}</option><option value="several">{copy.several}</option><option value="custom-ai-system">{copy.system}</option></select></FormField>
 {optionalInputs.map(input=>{const required=input.name==='email'&&values.preferredContact==='email';return <FormField key={input.name} name={input.name} label={required?copy.emailRequiredLabel:copy.fields[input.name]} optional={!required} hint={input.name==='companyUrl'?copy.hints.companyUrl:undefined} error={errors[input.name]}><input {...attributes(input.name,input.name==='companyUrl')} type={input.type} autoComplete={input.autoComplete} maxLength={input.maxLength} value={values[input.name]} required={required} onChange={e=>update(input.name,e.target.value)} /></FormField>;})}
 <FormField name="message" label={copy.fields.message} optional hint={copy.hints.message} error={errors.message}><textarea {...attributes('message',true)} rows={4} maxLength={1500} value={values.message} onChange={e=>update('message',e.target.value)} /></FormField>
 <FormField name="communicationLanguage" label={copy.fields.communicationLanguage} error={errors.communicationLanguage}><select {...attributes('communicationLanguage')} required value={values.communicationLanguage} onChange={e=>update('communicationLanguage',e.target.value)}>{copy.languageOptions.map(option=><option key={option.value} value={option.value}>{option.label}</option>)}</select></FormField>
 </div><div className={styles.honeypot} aria-hidden="true"><label htmlFor="company-fax">{copy.honeypot}</label><input id="company-fax" name="companyFax" tabIndex={-1} autoComplete="off" ref={honeypot} /></div>
 <div className={styles.consent}><label><input {...attributes('consent')} type="checkbox" checked={values.consent} required onChange={e=>update('consent',e.target.checked)} /><span>{copy.consent} <span aria-hidden="true">*</span></span></label><p id="error-consent" className={styles.fieldError}>{errors.consent||'\u00a0'}</p></div>
 <div aria-live="polite" className={styles.serverMessage}>{serverMessage&&<p role="alert">{serverMessage}</p>}</div><button className={styles.submit} type="submit" disabled={!hydrated||pending}>{pending&&<span className={styles.spinner} aria-hidden="true" />}{pending?copy.submitting:copy.submit}{!pending&&<Arrow diagonal />}</button><p className={styles.privacy}>{copy.privacy}</p></fieldset></form><div className={styles.support}><p>{support.label}</p><a href={support.emailHref} data-contact="email">{support.email}</a><a href={support.telegram} target="_blank" rel="noopener noreferrer" data-contact="telegram">Telegram</a></div></div>;
}
