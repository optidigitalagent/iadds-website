import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Media, FAQ, Step } from '@/types/content';
import styles from './ui.module.css';
import { MediaImage } from './media-image';
import type { Dictionary } from '@/content/en/site';
import { siteConfig } from '@/content/site/settings';

export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={diagonal ? 'M6 18 18 6M6 6h12v12' : 'M4 12h15m-6-6 6 6-6 6'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
export function BrandWordmark({ endorsed = true }: { endorsed?: boolean }) {
  const b=siteConfig.brand;
  return <span className={styles.wordmark} role="img" aria-label={b.productLabel}><span className={styles.brandIcon} aria-hidden="true" style={{ backgroundImage:`url(${b.logo.symbol})` }} /><span className={styles.brandText} aria-hidden="true">{b.productName}{endorsed && <>{' '}<span>{b.endorsement}</span></>}</span></span>;
}
export function Container({ children, className = '' }: { children: ReactNode; className?: string }) { return <div className={`${styles.container} ${className}`}>{children}</div>; }
export function Section({ children, id, className = '' }: { children: ReactNode; id?: string; className?: string }) { return <section id={id} className={`${styles.section} ${className}`}><Container>{children}</Container></section>; }
export function SectionHeading({ eyebrow, title, body, children }: { eyebrow?: string; title: string; body?: string; children?: ReactNode }) {
  return <div className={styles.sectionHeading} data-reveal><div>{eyebrow && <p className={styles.eyebrow}><span />{eyebrow}</p>}<h2>{title}</h2>{body && <p className={styles.intro}>{body}</p>}</div>{children && <div className={styles.headingAside}>{children}</div>}</div>;
}
export function Button({ href, children, secondary = false, location, service, external = false }: { href: string; children: ReactNode; secondary?: boolean; location?: string; service?: string; external?: boolean }) {
  return <Link prefetch={false} href={href} className={`${styles.button} ${secondary ? styles.secondary : ''}`} data-cta={location} data-service={service} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}<Arrow diagonal /></Link>;
}
export function TextLink({ href, children }: { href: string; children: ReactNode }) { return <Link prefetch={false} href={href} className={styles.textLink}>{children}<Arrow /></Link>; }
export function Tag({ children }: { children: ReactNode }) { return <span className={styles.tag}>{children}</span>; }
export function MediaFrame({ media, labels, hero = false, className = '', caption = true }: { media: Media; labels: Pick<Dictionary['ui'], 'mediaUnavailable' | 'clientWork' | 'conceptProject'>; hero?: boolean; className?: string; caption?: boolean }) {
  return <figure className={`${styles.media} ${className}`}>
    <MediaImage media={media} hero={hero} fallbackLabel={labels.mediaUnavailable} />
    {caption && media.status && (media.status !== 'client' || media.publicationApproved) && <figcaption>{media.status === 'client' ? labels.clientWork : labels.conceptProject}</figcaption>}
  </figure>;
}
export function FAQAccordion({ items }: { items: FAQ[] }) {
  return <div className={styles.faq}>{items.map((item, i) => <details key={item.question} name="service-faq"><summary><span className={styles.faqNumber}>{String(i + 1).padStart(2, '0')}</span><span>{item.question}</span><span className={styles.plus} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div>;
}
export function BulletList({ items }: { items: string[] }) { return <ul className={styles.bullets}>{items.map(item => <li key={item}>{item}</li>)}</ul>; }
export function DetailGrid({ items }: { items: Step[] }) { return <div className={styles.detailGrid}>{items.map((item, i) => <article key={item.title} data-reveal><span className={styles.itemNumber}>{String(i + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>; }
export function Breadcrumbs({ items, label }: { items: { label: string; href?: string }[]; label: string }) { return <nav aria-label={label} className={styles.breadcrumb}><ol>{items.map(item => <li key={item.label}>{item.href ? <Link prefetch={false} href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}</li>)}</ol></nav>; }
