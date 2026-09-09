import type { Metadata } from 'next';
import { getBrandConfig, getContactDetails, getDictionary } from '@/lib/content';
import { getLocaleAlternates, getSiteUrl, localizedPath } from '@/lib/urls';
import type { Locale, Service } from '@/types/content';
export function pageMetadata(seo:{title:string;description:string},path:string,locale:Locale):Metadata {
 const canonical=getSiteUrl()+localizedPath(locale,path);
 const languages=Object.fromEntries(Object.entries(getLocaleAlternates(localizedPath(locale,path))).map(([lang,url])=>[lang,getSiteUrl()+url]));
 const image=getSiteUrl()+localizedPath(locale,'/opengraph-image');
 return {title:{absolute:seo.title},description:seo.description,alternates:{canonical,languages},openGraph:{title:seo.title,description:seo.description,url:canonical,siteName:getBrandConfig(locale).metadataName,locale:locale==='uk'?'uk_UA':'en_US',alternateLocale:[locale==='uk'?'en_US':'uk_UA'],type:'website',images:[{url:image,width:1200,height:630,alt:getDictionary(locale).intro.title}]},twitter:{card:'summary_large_image',title:seo.title,description:seo.description,images:[image]}};
}
export function JsonLd({data}:{data:Record<string,unknown>}) {return <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}} />;}
export function organizationData(locale:Locale) {const b=getBrandConfig(locale),c=getContactDetails();return {'@context':'https://schema.org','@type':'Organization','@id':getSiteUrl()+'/#organization',name:b.name,brand:{'@type':'Brand',name:b.productName,logo:getSiteUrl()+b.logo.symbol},url:getSiteUrl()+localizedPath(locale),description:getDictionary(locale).metadata.about.description,founder:{'@type':'Person',name:b.founderName},email:c.email,telephone:c.phoneHref.slice(4),sameAs:[c.telegram,c.instagram],areaServed:[{'@type':'Country',name:'Ukraine'},{'@type':'Continent',name:'Europe'}],contactPoint:{'@type':'ContactPoint',email:c.email,telephone:c.phoneHref.slice(4),availableLanguage:['Ukrainian','English']}};}
export function OrganizationSchema({locale}:{locale:Locale}) {return <JsonLd data={organizationData(locale)} />;}
export function ServiceSchema({service,locale}:{service:Service;locale:Locale}) {return <JsonLd data={{'@context':'https://schema.org','@type':'Service',name:service.title,description:service.shortPromise,serviceType:service.professionalLabel,url:getSiteUrl()+localizedPath(locale,'/services/'+service.slug),provider:{'@id':getSiteUrl()+'/#organization'}}} />;}
export function BreadcrumbSchema({items}:{items:{name:string;path:string}[]}) {return <JsonLd data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map((item,i)=>({'@type':'ListItem',position:i+1,name:item.name,item:getSiteUrl()+item.path}))}} />;}
