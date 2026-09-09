import { getAllServices,getContactDetails,getDictionary,getServiceBySlug } from '@/lib/content';
import { Container } from '@/components/ui/primitives';
import { ConsultationValue } from '@/components/sections/sections';
import { ConsultationForm } from '@/components/consultation/consultation-form';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { safeSourcePage,validModel } from '@/lib/urls';
import { pageMetadata } from '@/lib/seo';
import styles from './consultation.module.css';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.consultation,'/consultation',locale);}
export default async function ConsultationPage({params,searchParams}:{params:LocaleParams;searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const locale=await routeLocale(params),query=await searchParams,c=getDictionary(locale),contact=getContactDetails();
 const service=typeof query.service==='string'?getServiceBySlug(locale,query.service)?.slug:undefined;
 return <section className={styles.page} data-consultation-page><Container className={styles.grid}><ConsultationValue locale={locale} /><ConsultationForm copy={c.consultation} locale={locale} sourcePage={safeSourcePage(query.from,locale)} collaborationModel={validModel(query.model)} services={getAllServices(locale).map(s=>({slug:s.slug,title:s.title}))} selectedService={service} support={{label:c.ui.support,email:contact.email,emailHref:contact.emailHref,telegram:contact.telegram}} /></Container></section>;
}
