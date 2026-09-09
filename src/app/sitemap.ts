import type { MetadataRoute } from 'next';
import { getAllServices,getPublishedCases,shouldShowCasesInNavigation } from '@/lib/content';
import { getLocaleAlternates,getSiteUrl,locales,localizedPath } from '@/lib/urls';
export default function sitemap():MetadataRoute.Sitemap {return locales.flatMap(locale=>['','/services','/about','/ai-systems','/pricing','/process','/contact','/consultation',...(shouldShowCasesInNavigation()?['/cases']:[]),...getAllServices(locale).map(s=>'/services/'+s.slug),...getPublishedCases(locale).map(c=>'/cases/'+c.slug)].map(path=>({url:getSiteUrl()+localizedPath(locale,path),alternates:{languages:Object.fromEntries(Object.entries(getLocaleAlternates(localizedPath(locale,path))).map(([key,url])=>[key,getSiteUrl()+url]))}})));}
