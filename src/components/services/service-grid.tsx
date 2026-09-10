import {getServiceMedia} from '@/lib/media/service-media';
import {getMediaCopy} from '@/content/site/media-copy';
import {FormatMedia} from './format-media';
import Link from 'next/link';
import type { Locale, Service } from '@/types/content';
import { getDictionary, getServiceGroups } from '@/lib/content';
import { localizedPath } from '@/lib/urls';
import { Arrow, MediaFrame } from '@/components/ui/primitives';
import styles from './services.module.css';
export function ServiceCard({service,locale,uniform=false,priority=false}:{service:Service;locale:Locale;uniform?:boolean;priority?:boolean}) {
 const labels=getDictionary(locale).ui; const status=service.cardMedia.status; const examples=getServiceMedia(service.slug,locale).card; const copy=getMediaCopy(locale);
 return <article className={styles.card+' '+(service.accent==='acid'?styles.acid:'')+' '+(uniform?styles.uniform:styles['span'+service.cardSpan])} data-reveal data-format-card={examples.length>0||undefined} data-card-surface={service.slug}>
 <Link prefetch={false} href={localizedPath(locale,'/services/'+service.slug)} className={styles.cardLink} data-service-card={service.slug} aria-label={service.title} />
 <div className={styles.cardTop}><span>{service.professionalLabel}</span><span className={styles.cardArrow}><Arrow diagonal /></span></div>{examples.length?<div className={styles.cardMedia+' '+(examples.length===2?styles.splitPreview:'')}>{examples.map((media,index)=><FormatMedia key={media.id} media={media} card priority={priority&&index===0} labels={copy} />)}</div>:<MediaFrame media={service.cardMedia} labels={labels} hero={priority} className={styles.cardMedia} caption={false} />}<div className={styles.cardContent}>{examples.length>0&&<span className={styles.formatLabel}>{copy.label}</span>}{!examples.length&&status&&(status!=='client'||service.cardMedia.publicationApproved)&&<span className={styles.illustrative}>{status==='client'?labels.clientWork:labels.conceptProject}</span>}<h3>{service.title}</h3><p>{service.shortPromise}</p></div></article>;
}
export function ServiceGrid({services,locale,uniform=false}:{services:Service[];locale:Locale;uniform?:boolean}) { return <div className={styles.grid+' '+(uniform?styles.uniformGrid:'')}>{services.map(service=><ServiceCard key={service.id} locale={locale} service={service} uniform={uniform} />)}</div>; }
export function GroupedServiceCatalog({services,locale}:{services:Service[];locale:Locale}) { return <div data-service-catalog className={styles.catalog}>{getServiceGroups(locale).map((group,groupIndex)=><section key={group.id} className={styles.group} aria-labelledby={'group-'+group.id}><h2 id={'group-'+group.id} className={styles.groupTitle}><span>0{groupIndex+1}</span>{group.title}</h2><div className={styles.groupGrid} data-count={group.slugs.length}>{group.slugs.map((slug,index)=>{const service=services.find(item=>item.slug===slug);return service?<ServiceCard key={slug} service={service} locale={locale} uniform priority={groupIndex===0&&index===0} />:null;})}</div></section>)}</div>; }
