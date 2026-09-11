import { getDictionary,getPublishedCases,shouldShowCasesInNavigation } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { ConsultationCTA, PageHero } from '@/components/sections/sections';
import { Section } from '@/components/ui/primitives';
import { CasesEmptyState,CaseCard } from '@/components/cases/cases';
import styles from '@/components/cases/cases.module.css';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return {...pageMetadata(getDictionary(locale).metadata.cases,'/cases',locale),robots:{index:shouldShowCasesInNavigation(),follow:true}};}
export default async function Cases({params}:{params:LocaleParams}) {const locale=await routeLocale(params),c=getDictionary(locale).cases,cases=getPublishedCases(locale);return <><PageHero eyebrow={c.eyebrow} title={c.title} body={c.body} /><Section>{cases.length?<div className={styles.gallery}>{cases.map(item=><CaseCard key={item.id} item={item} locale={locale} />)}</div>:<CasesEmptyState locale={locale} />}</Section><ConsultationCTA locale={locale} sourcePage={'/'+locale+'/cases'} /></>;}
