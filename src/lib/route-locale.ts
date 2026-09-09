import { notFound } from 'next/navigation';
import { isLocale } from './urls';
export type LocaleParams = Promise<{locale:string}>;
export async function routeLocale(params:LocaleParams) {const {locale}=await params;if(!isLocale(locale)) notFound();return locale;}
