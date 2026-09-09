import { getAllServices,getDictionary } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { pageMetadata } from '@/lib/seo';
import { Container } from '@/components/ui/primitives';
import { GroupedServiceCatalog } from '@/components/services/service-grid';
import { PageHero,ConsultationCTA } from '@/components/sections/sections';
import { CustomTaskCTA } from '@/components/sections/experience-sections';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return pageMetadata(getDictionary(locale).metadata.services,'/services',locale);}
export default async function Services({params}:{params:LocaleParams}) {const locale=await routeLocale(params),c=getDictionary(locale);return <><PageHero eyebrow={c.services.eyebrow} title={c.services.pageTitle} body={c.services.pageBody} /><Container><GroupedServiceCatalog services={getAllServices(locale)} locale={locale} /></Container><CustomTaskCTA locale={locale} sourcePage={'/'+locale+'/services'} /><ConsultationCTA locale={locale} sourcePage={'/'+locale+'/services'} /></>;}
