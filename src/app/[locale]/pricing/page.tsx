import { getCommercialNotes, getDictionary, getExperience, getFaq } from '@/lib/content';
import { routeLocale, type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { DetailGrid, FAQAccordion, Section, SectionHeading } from '@/components/ui/primitives';
import { ConsultationCTA, PageHero } from '@/components/sections/sections';
import { PricingPreview, TestStage } from '@/components/sections/experience-sections';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.pricing,'/pricing',locale);}
export default async function Pricing({params}:{params:LocaleParams}) {const locale=await routeLocale(params),c=getDictionary(locale),e=getExperience(locale);return <><PageHero eyebrow={e.pricing.eyebrow} title={e.pricing.pageTitle} body={e.pricing.body} /><PricingPreview locale={locale} page sourcePage={'/'+locale+'/pricing'} /><TestStage locale={locale} sourcePage={'/'+locale+'/pricing'} /><Section><SectionHeading title={c.process.frameworkTitle} /><DetailGrid items={getCommercialNotes(locale)} /></Section><Section><SectionHeading eyebrow="FAQ" title={c.ui.faq} /><FAQAccordion items={getFaq(locale).filter((_,i)=>[2,3,4,9,10,11,12].includes(i))} /></Section><ConsultationCTA locale={locale} sourcePage={'/'+locale+'/pricing'} /></>;}
