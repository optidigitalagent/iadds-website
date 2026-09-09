import type {Locale} from '@/types/content';
import type {ExampleMedia} from '@/types/service-media';
import {getServiceMedia} from '@/lib/media/service-media';
import {getMediaCopy} from '@/content/site/media-copy';
import {getDictionary} from '@/lib/content';
import {consultationHref,localizedPath} from '@/lib/urls';
import {Button,Container,MediaFrame} from '@/components/ui/primitives';
import {FormatMedia} from './format-media';
import type {Service} from '@/types/content';
import styles from './format-media.module.css';

export function FeaturedExample({service,locale}:{service:Service;locale:Locale}) {
 const m=getServiceMedia(service.slug,locale),c=getMediaCopy(locale);
 if(!m.featured)return <MediaFrame media={service.heroMedia} labels={getDictionary(locale).ui} hero />;
 return <div className={styles.heroExample}><FormatMedia media={m.featured} priority labels={c} /><p>{c.label}</p></div>;
}
export function VariationSet({id,label,items,locale}:{id:string;label:string;items:ExampleMedia[];locale:Locale}) {
 const c=getMediaCopy(locale);
 return <article className={styles.variation} data-variation-set={id}><h3>{label}</h3><div className={styles.pair}>{items.map(m=><figure key={m.id} className={styles.item}><FormatMedia media={m} labels={c} /><figcaption>{m.alt}</figcaption></figure>)}</div></article>;
}
export function ServiceExamples({slug,locale}:{slug:string;locale:Locale}) {
 const m=getServiceMedia(slug,locale),c=getMediaCopy(locale),url=consultationHref(locale,{service:slug,sourcePage:localizedPath(locale,'/services/'+slug)});
 const localization=slug==='video-localization',empty=localization?!m.pairs.length:!m.gallery.length&&!m.variations.length&&!m.featured;
 return <section className={styles.section} data-service-examples={slug} data-coverage={m.coverageStatus}><Container>
 {empty?<div className={styles.empty}>{localization&&<div className={styles.emptyMark} aria-hidden="true"><span>Original</span><span>→</span><span>UK / EN</span></div>}<h2>{localization?c.localizationTitle:c.productionTitle}</h2><p className={styles.intro}>{localization?c.localizationBody:c.productionBody}</p><Button href={url} location="service-media" service={slug}>{getDictionary(locale).ui.book}</Button></div>:<>
 <span className={styles.label}>{c.label}</span><h2>{m.variations.length?c.variations:c.title}</h2><p className={styles.intro}>{m.variations.length?c.variationsBody:c.body}</p>{m.note&&<p className={styles.note}>{m.note}</p>}
 {m.gallery.length>0&&<div className={styles.gallery}>{m.gallery.map(media=><figure key={media.id} className={styles.item}><FormatMedia media={media} labels={c} /><figcaption>{[28,35].includes(media.id)?c.motion:[18,27,37].includes(media.id)?c.brandWorld:media.alt}</figcaption></figure>)}</div>}
 {m.variations.map(set=><VariationSet {...set} key={set.id} locale={locale} />)}
 {localization&&m.pairs.map(pair=><VariationSet id={pair.id} label={`${pair.original.language} → ${pair.localized.language}`} items={[pair.originalMedia,pair.localizedMedia]} locale={locale} key={pair.id} />)}
 </>}
 </Container></section>;
}
