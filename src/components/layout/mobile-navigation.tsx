'use client';
import { useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Arrow, BrandWordmark } from '@/components/ui/primitives';
import type { Dictionary } from '@/content/en/site';
import styles from './layout.module.css';
import { LanguageSwitcher } from './language-switcher';
import type { Locale } from '@/types/content';
import { consultationHref } from '@/lib/urls';
export function MobileNavigation({ locale, nav, ui, brand }: { locale: Locale; nav: Dictionary['nav']; ui: Dictionary['ui']; brand: Dictionary['brand'] }) {
  const dialog = useRef<HTMLDialogElement>(null); const trigger = useRef<HTMLButtonElement>(null); const pathname = usePathname();
  function close() { dialog.current?.close(); trigger.current?.focus(); window.dispatchEvent(new CustomEvent('navigation:change', { detail: false })); }
  function open() { dialog.current?.showModal(); window.dispatchEvent(new CustomEvent('navigation:change', { detail: true })); }
  return <div className={styles.mobileNav}>
    <button ref={trigger} onClick={open} className={styles.menuTrigger} aria-label={ui.menu} aria-haspopup="dialog" aria-controls="mobile-navigation"><span /><span /></button>
    <dialog id="mobile-navigation" ref={dialog} className={styles.drawer} aria-label={ui.navigation} onCancel={e => { e.preventDefault(); close(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = Array.from(dialog.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex="0"]') || []).filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
      <div className={styles.drawerTop}><BrandWordmark /><LanguageSwitcher onSelect={close} /><button onClick={close} className={styles.close} aria-label={ui.close}><span aria-hidden="true">×</span></button></div>
      <nav aria-label={ui.navigation}><ul>{nav.map((item, i) => <li key={item.href}><Link href={item.href} onClick={close} aria-current={pathname === item.href ? 'page' : undefined} data-navigation><span className={styles.navIndex}>{String(i + 1).padStart(2,'0')}</span>{item.label}<Arrow diagonal /></Link></li>)}</ul></nav>
      <Link href={consultationHref(locale)} onClick={close} className={styles.drawerCta} data-cta="mobile-menu">{ui.book}<Arrow diagonal /></Link>
      <p className={styles.drawerNote}>{brand.signature}</p>
    </dialog>
  </div>;
}
