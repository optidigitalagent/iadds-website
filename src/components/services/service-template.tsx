import {FeaturedExample,ServiceExamples} from './service-examples';
import type { Locale, Service } from '@/types/content';
import { getDictionary, getExperience, getRelatedServices } from '@/lib/content';
import { getServiceCommercial } from '@/content/site/service-commercial';
import { consultationHref, localizedPath } from '@/lib/urls';
import { Breadcrumbs, BulletList, Button, Container, DetailGrid, FAQAccordion, Section, SectionHeading, Tag, TextLink } from '@/components/ui/primitives';
import { ConsultationCTA, ProcessTimeline } from '@/components/sections/sections';
import { PricingPreview, TestStage } from '@/components/sections/experience-sections';
import { ServiceGrid } from './service-grid';
import styles from './services.module.css';

export function ServiceTemplate({ service, locale }: { service: Service; locale: Locale }) {
  const c = getDictionary(locale);
  const e = getExperience(locale), scope = getServiceCommercial(service.slug, locale);
  const sourcePage = localizedPath(locale, '/services/' + service.slug);
  const href = consultationHref(locale, { service: service.slug, sourcePage });
  return <><section className={styles.hero} data-hero><Container>
    <Breadcrumbs label={c.ui.breadcrumb} items={[{ label: c.ui.allServices, href: localizedPath(locale, '/services') }, { label: service.title }]} />
    <div className={styles.heroGrid}><div><Tag>{service.professionalLabel}</Tag><h1>{service.title}</h1><p className={styles.promise}>{service.shortPromise}</p><p className={styles.overview}>{service.overview}</p><div className={styles.heroActions}><Button href={href} location="service-hero" service={service.slug}>{e.serviceCta.start}: {service.title}</Button><TextLink href={localizedPath(locale, '/services')}>{c.ui.backServices}</TextLink></div></div><div className={styles.heroMedia}><FeaturedExample service={service} locale={locale} /></div></div>
  </Container></section>
  <Container><section className={styles.what}><h2>{c.service.what}</h2><p>{service.whatItIs}</p></section></Container>
  <Section><div className={styles.split}><div><SectionHeading title={c.service.problems} /><BulletList items={service.problems} /></div><div className={styles.panel}><h3>{c.service.fit}</h3><BulletList items={service.bestFor} /></div></div></Section>
  <Section className={styles.mutedSection}><SectionHeading title={c.service.deliverables} body={scope.result} /><BulletList items={service.deliverables} /><p className={styles.notes}>{c.service.deliverablesNote}</p><div className="page-actions"><Button href={href} location="service-deliverables" service={service.slug}>{e.serviceCta.deliverables}</Button></div></Section>
  <Section><div className={styles.split}><div className={styles.panel}><h2>{c.service.formats}</h2><p>{scope.formats}</p><div className={styles.tags}>{service.formats.map(format => <Tag key={format}>{format}</Tag>)}</div></div><div className={styles.panel}><h2>{c.service.inputs}</h2><p>{scope.inputs}</p><BulletList items={service.clientInputs} /></div></div></Section>
  <Section><SectionHeading title={c.service.process} eyebrow={c.process.eyebrow} /><ProcessTimeline steps={service.processSteps} compact /></Section>
  <TestStage locale={locale} service={service.slug} sourcePage={sourcePage} />
  <PricingPreview locale={locale} service={service.slug} sourcePage={sourcePage} />
  <Section className={styles.mutedSection}><SectionHeading title={c.service.framework} /><DetailGrid items={service.commercialNotes} />{service.ethicalNote && <aside className={styles.ethics}><h3>{c.service.ethics}</h3><p>{service.ethicalNote}</p></aside>}</Section>
  <ServiceExamples slug={service.slug} locale={locale} />
  <Section className={styles.mutedSection}><div className={styles.faqGrid}><SectionHeading title={c.ui.faq} eyebrow={c.ui.faqEyebrow} /><FAQAccordion items={service.faq} /></div></Section>
  <ConsultationCTA locale={locale} sourcePage={sourcePage} service={service.slug} label={e.serviceCta.final} />
  <Section><SectionHeading eyebrow={c.service.relatedEyebrow} title={c.service.related} /><ServiceGrid locale={locale} services={getRelatedServices(locale, service.slug)} uniform /></Section></>;
}
