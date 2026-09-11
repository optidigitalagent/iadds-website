import Link from 'next/link';
import { getDictionary, getServiceBySlug, isVerifiedMetric, isVerifiedTestimonial } from '@/lib/content';
import { safeExternalUrl, consultationHref, localizedPath } from '@/lib/urls';
import type { CaseStudy, Locale } from '@/types/content';
import { Breadcrumbs, BulletList, Container, MediaFrame, Section, SectionHeading, Tag, TextLink } from '@/components/ui/primitives';
import { ConsultationCTA, ProcessTimeline } from '@/components/sections/sections';
import { ServiceGrid } from '@/components/services/service-grid';
import styles from './cases.module.css';
export function CasesEmptyState({locale}:{locale:Locale}) {
  const c = getDictionary(locale).cases;
  return <div className={styles.empty}><div className={styles.emptyVisual} aria-hidden="true"><div /><span>↗</span></div><div className={styles.emptyCopy}><p className={styles.label}>{c.emptyLabel}</p><h2>{c.emptyTitle}</h2><p>{c.emptyBody}</p><TextLink href={consultationHref(locale,{sourcePage:localizedPath(locale,'/cases')})}>{c.cta}</TextLink></div></div>;
}
export function CaseCard({ item, locale }: { item: CaseStudy; locale: Locale }) { return <Link href={localizedPath(locale,`/cases/${item.slug}`)} className={styles.caseCard}>{item.media[0] && <MediaFrame labels={getDictionary(locale).ui} media={item.media[0]} />}<Tag>{item.sector}</Tag><h3>{item.projectTitle}</h3><p>{item.summary}</p></Link>; }
export function CaseTemplate({ item, locale }: { item: CaseStudy; locale: Locale }) {
  const c = getDictionary(locale); const metrics = item.metrics.filter(isVerifiedMetric);
  const related = item.services.flatMap(slug => { const service = getServiceBySlug(locale, slug); return service ? [service] : []; });
  const publicUrl = safeExternalUrl(item.publicUrl);
  return <><section className={styles.caseHero} data-hero><Container><Breadcrumbs label={c.ui.breadcrumb} items={[{ label: c.cases.title, href: localizedPath(locale, '/cases') }, { label: item.projectTitle }]} /><p className={styles.label}>{item.clientName} / {item.sector}</p><h1>{item.projectTitle}</h1><p className={styles.summary}>{item.summary}</p></Container></section>
    <Section><div className={styles.storyGrid}><div><SectionHeading title={c.cases.challenge} /><p>{item.challenge}</p></div><div><SectionHeading title={c.cases.idea} /><p>{item.idea}</p></div></div></Section>
    <Section><SectionHeading title={c.cases.responsibility} /><BulletList items={item.responsibilities} /></Section>
    <Section><SectionHeading title={c.cases.process} /><ProcessTimeline steps={item.process} /></Section>
    {item.contextMedia?.interface && <Section><SectionHeading title={c.cases.interfaceMedia} /><MediaFrame labels={c.ui} media={item.contextMedia.interface} /></Section>}
    {item.contextMedia?.input && <Section><SectionHeading title={c.cases.inputMedia} /><MediaFrame labels={c.ui} media={item.contextMedia.input} /></Section>}
    <Section><SectionHeading title={c.cases.deliverables} /><BulletList items={item.deliverables} /><div className={styles.gallery}>{item.media.map(media => <MediaFrame labels={c.ui} key={media.src} media={media} />)}</div>{publicUrl && <a href={publicUrl} target="_blank" rel="noopener noreferrer" className={styles.publicLink}>{c.ui.projectLink} ↗</a>}</Section>
    {metrics.length > 0 && <Section><SectionHeading title={c.cases.results} /><dl className={styles.metrics}>{metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl></Section>}
    {isVerifiedTestimonial(item.testimonial) && item.testimonial && <Section><SectionHeading title={c.cases.testimonial} /><blockquote className={styles.quote}>{item.testimonial.avatar && <MediaFrame labels={c.ui} media={item.testimonial.avatar} />}<p>{item.testimonial.quote}</p><footer>{item.testimonial.author} · {item.testimonial.role} · {item.testimonial.company}</footer>{item.testimonial.rating && <p>{item.testimonial.rating.value} / {item.testimonial.rating.max}</p>}{item.testimonial.sourceUrl && <a href={safeExternalUrl(item.testimonial.sourceUrl)} target="_blank" rel="noopener noreferrer">{c.ui.projectLink} ↗</a>}</blockquote></Section>}
    {related.length > 0 && <Section><SectionHeading title={c.service.related} eyebrow={c.service.relatedEyebrow} /><ServiceGrid locale={locale} services={related} uniform /></Section>}
    <ConsultationCTA locale={locale} model={item.collaborationModel} service={item.collaborationModel === 'system' ? undefined : item.services[0]} sourcePage={localizedPath(locale, '/cases')} />
  </>;
}
