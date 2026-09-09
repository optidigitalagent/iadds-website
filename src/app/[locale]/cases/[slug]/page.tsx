import { notFound } from 'next/navigation';
import { getCaseBySlug,getPublishedCases,getDictionary } from '@/lib/content';
import { routeLocale } from '@/lib/route-locale';
import { pageMetadata,BreadcrumbSchema } from '@/lib/seo';
import { localizedPath } from '@/lib/urls';
import { CaseTemplate } from '@/components/cases/cases';
type Props={params:Promise<{locale:string;slug:string}>};
export function generateStaticParams() {return getPublishedCases().map(item=>({slug:item.slug}));}
export async function generateMetadata({params}:Props) {const locale=await routeLocale(params),item=getCaseBySlug(locale,(await params).slug);if(!item) notFound();return pageMetadata(item.seo,'/cases/'+item.slug,locale);}
export default async function Case({params}:Props) {const locale=await routeLocale(params),item=getCaseBySlug(locale,(await params).slug);if(!item) notFound();return <><CaseTemplate item={item} locale={locale} /><BreadcrumbSchema items={[{name:getDictionary(locale).cases.title,path:localizedPath(locale,'/cases')},{name:item.projectTitle,path:localizedPath(locale,'/cases/'+item.slug)}]} /></>;}
