import type { CSSProperties } from 'react';
import type { Locale } from '@/types/content';
import { getBrandConfig, getDictionary, getExperience, getPublishedCases } from '@/lib/content';
import { getFounderMedia, type FounderAssetId } from '@/content/site/founder-media';
import { getServiceCommercial } from '@/content/site/service-commercial';
import { consultationHref, localizedPath } from '@/lib/urls';
import { BulletList, Button, Container, DetailGrid, Section, SectionHeading, TextLink } from '@/components/ui/primitives';
import { CaseCard } from '@/components/cases/cases';
import ui from '@/components/ui/ui.module.css';
import styles from './experience.module.css';

export function FounderPhoto({ id, locale, className = '', sizes = '(max-width: 767px) calc(100vw - 40px), 46vw' }: { id: FounderAssetId; locale: Locale; className?: string; sizes?: string }) {
  const m = getFounderMedia(id, locale);
  const desktop = m.variants.find(v => v.role === 'desktop' && v.format === 'webp')!;
  const mobile = m.variants.find(v => v.role === 'mobile' && v.format === 'webp')!;
  return <figure className={`${styles.photo} ${className}`} data-reveal data-founder-photo={id} style={{ '--desktop-ratio': `${desktop.width}/${desktop.height}`, '--mobile-ratio': `${mobile.width}/${mobile.height}` } as CSSProperties}>
    <picture>{(['mobile', 'desktop'] as const).flatMap(role => m.variants.filter(v => v.role === role).map(v => <source key={v.file} type={`image/${v.format}`} media={role === 'mobile' ? '(max-width: 767px)' : '(min-width: 768px)'} srcSet={`${v.file} ${v.width}w`} sizes={sizes} width={v.width} height={v.height} />))}
      <img src={desktop.file} width={desktop.width} height={desktop.height} alt={m.alt} loading="lazy" decoding="async" sizes={sizes} />
    </picture>
  </figure>;
}

export function CustomTaskCTA({ locale, sourcePage }: { locale: Locale; sourcePage: string }) {
  const c = getExperience(locale).custom;
  return <Section id="custom-task" className={styles.custom}><div><h2>{c.title}</h2><p>{c.body}</p></div><Button href={consultationHref(locale, { sourcePage })} location="custom-task">{c.cta}</Button></Section>;
}

export function TestStage({ locale, service, sourcePage }: { locale: Locale; service?: string; sourcePage?: string }) {
  const e = getExperience(locale), c = e.test;
  const scope = service ? getServiceCommercial(service, locale) : undefined;
  return <Section id="test-stage" className={styles.test}><div className={styles.testGrid}>
    <div><p className={ui.eyebrow}><span />{c.eyebrow}</p><h2>{scope ? e.serviceCta.testTitle : c.title}</h2><span className={styles.testNumber} aria-hidden="true">{scope ? '↗' : '01—02'}</span></div>
    <div className={styles.copy}>{scope ? <p className={styles.lead}>{scope.test}</p> : c.paragraphs.map(p => <p key={p}>{p}</p>)}<BulletList items={scope ? c.facts.slice(1) : c.facts} />
      <Button href={consultationHref(locale, { service, sourcePage: sourcePage ?? localizedPath(locale) })} location="test-stage" service={service}>{scope ? e.serviceCta.test : c.cta}</Button>
    </div></div></Section>;
}

export function WhyNow({ locale, extended = false }: { locale: Locale; extended?: boolean }) {
  const e = getExperience(locale), c = e.why;
  return <Section id="why-now"><div className={styles.editorialSplit}><SectionHeading eyebrow={c.eyebrow} title={c.title} /><div className={styles.copy}>{c.paragraphs.map(p => <p key={p}>{p}</p>)}</div></div>
    {extended && <div className={styles.values}><article><h3>{c.missionLabel}</h3><p>{c.mission}</p></article><article><h3>{c.visionLabel}</h3><p>{c.vision}</p></article></div>}
  </Section>;
}

export function PricingPreview({ locale, service, sourcePage, page = false }: { locale: Locale; service?: string; sourcePage?: string; page?: boolean }) {
  const e = getExperience(locale), c = e.pricing;
  const scope = service ? getServiceCommercial(service, locale) : undefined;
  return <Section id="pricing" className={styles.pricing}>
    <SectionHeading eyebrow={c.eyebrow} title={scope ? e.serviceCta.priceTitle : c.title} body={scope ? scope.price : c.body} />
    {!scope && <ol className={styles.priceCards}>{c.items.map((item, i) => <li key={item} data-reveal><span aria-hidden="true">0{i + 1}</span><p>{item}</p></li>)}</ol>}
    {page && <div className={styles.values}><article><h3>{c.scopeTitle}</h3><p>{c.scopeBody}</p></article><article><h3>{c.paymentTitle}</h3><p>{c.payment}</p></article></div>}
    <div className={styles.actions}><Button href={consultationHref(locale, { service, sourcePage: sourcePage ?? localizedPath(locale) })} location="pricing" service={service}>{c.cta}</Button>{!page && <TextLink href={localizedPath(locale, '/pricing')}>{c.link}</TextLink>}</div>
  </Section>;
}

export function PublishedCasePreview({ locale }: { locale: Locale }) {
  const item = getPublishedCases(locale)[0];
  if (!item) return null;
  const c = getDictionary(locale).cases;
  return <Section id="verified-case"><SectionHeading eyebrow={c.eyebrow} title={c.title} /><CaseCard item={item} locale={locale} /></Section>;
}

export function WhoBehind({ locale, page = false }: { locale: Locale; page?: boolean }) {
  const e = getExperience(locale), c = e.behind, b = getBrandConfig(locale);
  const Heading = page ? 'h1' : 'h2';
  return <section id="who-behind" className={styles.who}><Container>
    <p className={ui.eyebrow} style={{textTransform:'none'}}><span />{c.eyebrow}</p><Heading className={styles.chapterTitle}>{c.title}</Heading>
    <div className={styles.editorialSplit}><div className={styles.facts}><p><strong>{b.portfolioProjects}+</strong><span>{locale === 'uk' ? 'digital- та AI-проєктів' : 'digital and AI projects'}</span></p><p><strong>~{b.additionalExperiments}</strong><span>{locale === 'uk' ? 'окремих тестів та експериментів' : 'additional tests and experiments'}</span></p></div><div className={styles.copy}>{c.paragraphs.map(p => <p key={p}>{p}</p>)}</div></div>
    {!page && <div className={styles.founderPreview}><FounderPhoto locale={locale} id="jetski" /><div className={styles.copy}><h3>{e.founder.title}</h3><p>{e.founder.paragraphs[0]}</p><p>{e.founder.responsibility}</p><TextLink href={localizedPath(locale, '/about')}>{c.link}</TextLink></div></div>}
  </Container></section>;
}

export function FounderStory({ locale }: { locale: Locale }) {
  const e = getExperience(locale), c = e.founder;
  return <Section id="founder-story" className={styles.story}>
    <div className={styles.founderIntro}><div className={styles.stickyPortrait}><FounderPhoto id="portrait" locale={locale} /><p className={styles.photoCaption}>{getBrandConfig(locale).founderIdentity}</p></div><div className={styles.copy}><p className={ui.eyebrow}>{locale === 'uk' ? 'ІСТОРІЯ ЗАСНОВНИКА' : 'THE FOUNDER STORY'}</p><h2>{c.title}</h2>{c.paragraphs.map(p => <p key={p}>{p}</p>)}<p>{c.education}</p></div></div>
    <div className={styles.storyChapter}><SectionHeading title={c.timelineTitle} /><ol className={styles.history}>{c.timeline.map((step, i) => <li key={step.title} data-reveal><span className={styles.historyDot} aria-hidden="true" /><span className={styles.chapterIndex}>{String(i + 1).padStart(2, '0')}</span><div><h3>{step.title}</h3><p>{step.body}</p></div></li>)}</ol></div>
    <div className={styles.storyChapter}><div className={styles.chapterHeader}><span className={styles.chapterIndex}>01 /</span><div><h3>{c.hockey.title}</h3>{c.hockey.paragraphs.map(p => <p key={p}>{p}</p>)}</div></div><div className={styles.staggeredPhotos}><FounderPhoto id="hockey-team" locale={locale} /><FounderPhoto id="hockey-puck" locale={locale} /></div></div>
    <div className={styles.storyChapter}><div className={styles.waterIntro}><div><span className={styles.chapterIndex}>02 /</span><h3>{c.water.title}</h3>{c.water.paragraphs.map(p => <p key={p}>{p}</p>)}</div><div className={styles.waterPhotos}><FounderPhoto id="gopro" locale={locale} /><FounderPhoto id="jetski" locale={locale} /></div></div><FounderPhoto id="boat" locale={locale} className={styles.widePhoto} sizes="(max-width:767px) calc(100vw - 40px), (max-width:1280px) 90vw, 1120px" /></div>
    <div className={styles.storyChapter}><SectionHeading title={c.competenciesTitle} /><DetailGrid items={c.competencies} /></div>
    <div className={styles.storyChapter}><SectionHeading title={c.principlesTitle} /><DetailGrid items={c.principles} /></div>
    <div className={styles.storyChapter}><div className={styles.philosophy}><FounderPhoto id="urban" locale={locale} className={styles.cityPhoto} sizes="(max-width:767px) 240px, 300px" /><div className={styles.copy}><h3>{c.philosophyTitle}</h3><blockquote>{c.philosophy.map(p => <p key={p}>{p}</p>)}</blockquote><h3>{c.responsibilityTitle}</h3><p>{c.responsibility}</p><Button href={consultationHref(locale, { sourcePage: localizedPath(locale, '/about') })} location="founder-story">{getDictionary(locale).ui.book}</Button></div></div></div>
  </Section>;
}

export function CompanyEcosystem({ locale }: { locale: Locale }) {
  const e = getExperience(locale), c = e.company;
  return <Section id="ecosystem" className={styles.ecosystem}><SectionHeading title={c.title} /><div className={styles.editorialSplit}><div className={styles.copy}>{c.paragraphs.map(p => <p key={p}>{p}</p>)}</div><div className={styles.copy}>{c.productParagraphs.map(p => <p key={p}>{p}</p>)}<p className={styles.lead}>{e.formula}</p></div></div><DetailGrid items={c.items} /></Section>;
}
