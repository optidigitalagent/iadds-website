import { getDictionary } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { ConsultationCTA } from '@/components/sections/sections';
import { WhoBehind,FounderStory,CompanyEcosystem,WhyNow } from '@/components/sections/experience-sections';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.about,'/about',locale);}
export default async function About({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return <><WhoBehind locale={locale} page /><FounderStory locale={locale} /><CompanyEcosystem locale={locale} /><WhyNow locale={locale} extended /><ConsultationCTA locale={locale} sourcePage={'/'+locale+'/about'} /></>;}
