import Link from 'next/link';
import { getBrandConfig, getContactDetails, getDictionary, getNavigation } from '@/lib/content';
import { Container, BrandWordmark, Button } from '@/components/ui/primitives';
import { consultationHref, localizedPath } from '@/lib/urls';
import type { Locale } from '@/types/content';
import { MobileNavigation } from './mobile-navigation';
import { FooterNavigation } from './footer-navigation';
import { LanguageSwitcher } from './language-switcher';
import styles from './layout.module.css';
export function SiteHeader({locale}:{locale:Locale}) {
  const {brand,ui}=getDictionary(locale); const nav=getNavigation(locale); const config=getBrandConfig(locale);
  return <header className={styles.header} data-site-header><Container className={styles.headerInner}>
    <Link prefetch={false} href={localizedPath(locale)} aria-label={config.productLabel} className={styles.brandLink}><BrandWordmark /></Link>
    <nav className={styles.desktopNav} aria-label={ui.navigation}>{nav.map(item=><Link prefetch={false} href={item.href} key={item.href} data-navigation>{item.label}</Link>)}</nav>
    <LanguageSwitcher /><div className={styles.headerCta}><Button href={consultationHref(locale)} location="header">{ui.book}</Button></div>
    <MobileNavigation locale={locale} nav={nav} ui={ui} brand={brand} />
  </Container></header>;
}
export function Footer({locale}:{locale:Locale}) {
  const {footer,ui,contact:copy}=getDictionary(locale); const contact=getContactDetails(); const brand=getBrandConfig(locale);
  const essential=getNavigation(locale).filter(item=>['/services','/ai-systems','/process','/about','/contact'].some(p=>item.href===localizedPath(locale,p)));
  return <footer className={styles.footer} id="contacts" data-site-footer><Container><div className={styles.footerMain}>
    <div className={styles.footerHead}><div className={styles.footerBrand}><Link prefetch={false} href={localizedPath(locale)} aria-label={brand.productLabel}><BrandWordmark /></Link></div><div className={styles.footerLanguage}><LanguageSwitcher ariaLabel={`${ui.language} — ${ui.footerNav}`} /></div></div>
    <FooterNavigation links={essential} label={ui.footerNav} />
    <div className={styles.footerContact}><a href={contact.emailHref} data-contact="email">{contact.email}</a><a href={contact.phoneHref} data-contact="phone" className={styles.phone}>{contact.phone}</a>{contact.socialLinks.map(item=><a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" data-contact={item.label.toLowerCase()} aria-label={copy[item.label.toLowerCase() as 'telegram'|'instagram']}>{item.label}</a>)}</div>
    {contact.legalLinks.length>0&&<nav className={styles.footerLegal} aria-label={footer.legal}>{contact.legalLinks.map(item=><a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer">{item.label}</a>)}</nav>}
  </div><div className={styles.footerBottom}><p>© {new Date().getFullYear()} {brand.name}</p></div></Container></footer>;
}
