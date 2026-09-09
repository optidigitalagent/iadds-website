'use client';
import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { switchLocalePath, safeSourcePage } from '@/lib/urls';
import { siteConfig } from '@/content/site/settings';
import { track } from '@/lib/analytics';
import { useSiteLocale } from './locale-context';
import styles from './layout.module.css';
const subscribe = (listener: () => void) => { window.addEventListener('popstate', listener); return () => window.removeEventListener('popstate', listener); };
const currentUrl = () => window.location.pathname + window.location.search + window.location.hash;
export function LanguageSwitcher({ onSelect, ariaLabel }: { onSelect?: () => void; ariaLabel?: string }) {
  const pathname = usePathname();
  const url = useSyncExternalStore(subscribe, currentUrl, () => '');
  const { locale, ui } = useSiteLocale();
  return <nav className={styles.languageSwitcher} aria-label={ariaLabel??ui.language}>
    {siteConfig.availableLocales.map(target => <a key={target} href={switchLocalePath(url || pathname, target)} hrefLang={target} lang={target} aria-current={target === locale ? 'true' : undefined}
      aria-label={`${target.toUpperCase()} — ${target === locale ? ui.currentLanguage : ui.switchTo}: ${target === 'uk' ? ui.languageUk : ui.languageEn}`}
      onClick={event => {
        event.currentTarget.href = switchLocalePath(currentUrl(), target);
        document.cookie = `${siteConfig.localeCookie}=${target}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
        track({ name: 'locale_switch', properties: { locale, sourcePage: safeSourcePage(pathname, locale), destination: target } });
        onSelect?.();
      }}><span>{target.toUpperCase()}</span>{target === locale && <span className={styles.languageCheck} aria-hidden="true">✓</span>}</a>)}
  </nav>;
}
