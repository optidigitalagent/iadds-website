import { getDictionary } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { PageHero,ContactLinks,ConsultationCTA } from '@/components/sections/sections';
import { Section } from '@/components/ui/primitives';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.contact,'/contact',locale);}
export default async function Contact({params}:{params:LocaleParams}) {const locale=await routeLocale(params),c=getDictionary(locale).contact;return <><PageHero eyebrow={c.eyebrow} title={c.title} body={c.body} /><Section><ContactLinks locale={locale} /></Section><ConsultationCTA locale={locale} sourcePage={'/'+locale+'/contact'} /></>;}
