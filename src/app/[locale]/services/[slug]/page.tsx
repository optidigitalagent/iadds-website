import { notFound } from 'next/navigation';
import { getAllServices,getDictionary,getServiceBySlug } from '@/lib/content';
import { routeLocale } from '@/lib/route-locale';
import { localizedPath } from '@/lib/urls';
import { ServiceTemplate } from '@/components/services/service-template';
import { BreadcrumbSchema,pageMetadata,ServiceSchema } from '@/lib/seo';
type Props={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams() {return getAllServices().map(s=>({slug:s.slug}));}
export async function generateMetadata({params}:Props) {const locale=await routeLocale(params),service=getServiceBySlug(locale,(await params).slug);if(!service) notFound();return pageMetadata(service.seo,'/services/'+service.slug,locale);}
export default async function ServicePage({params}:Props) {const locale=await routeLocale(params),service=getServiceBySlug(locale,(await params).slug);if(!service) notFound();return <><ServiceTemplate service={service} locale={locale} /><ServiceSchema service={service} locale={locale} /><BreadcrumbSchema items={[{name:getDictionary(locale).ui.allServices,path:localizedPath(locale,'/services')},{name:service.title,path:localizedPath(locale,'/services/'+service.slug)}]} /></>;}
