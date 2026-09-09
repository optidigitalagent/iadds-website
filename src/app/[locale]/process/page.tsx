import { getDictionary,getProcessSteps,getProcessDetails } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { PageHero,ProcessTimeline,ConsultationCTA } from '@/components/sections/sections';
import { Section,SectionHeading,DetailGrid } from '@/components/ui/primitives';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.process,'/process',locale);}
export default async function Process({params}:{params:LocaleParams}) {const locale=await routeLocale(params),c=getDictionary(locale).process;return <><PageHero eyebrow={c.eyebrow} title={c.title} body={c.body} /><Section><ProcessTimeline steps={getProcessSteps(locale)} headingLevel={2} /></Section><Section><SectionHeading title={c.frameworkTitle} body={c.frameworkBody} /><DetailGrid items={getProcessDetails(locale)} /></Section><ConsultationCTA locale={locale} sourcePage={'/'+locale+'/process'} /></>;}
