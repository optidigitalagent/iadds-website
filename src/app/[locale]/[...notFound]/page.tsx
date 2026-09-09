import { notFound } from 'next/navigation';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
import { getDictionary } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';
export async function generateMetadata({params}:{params:LocaleParams}) {const locale=await routeLocale(params);return {...pageMetadata(getDictionary(locale).metadata.notFound,'',locale),robots:{index:false,follow:true},alternates:{canonical:undefined}};}
export default function MissingPage() {notFound();}
