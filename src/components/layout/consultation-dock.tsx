'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Arrow } from '@/components/ui/primitives';
import styles from './layout.module.css';
import { useSiteLocale } from './locale-context';
import { consultationHref, safeSourcePage } from '@/lib/urls';
export function ConsultationDock({ label }: { label: string }) {
  const {locale} = useSiteLocale(); const pathname = usePathname(); const dock = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hero = document.querySelector('[data-hero]'); const footer = document.querySelector('[data-site-footer]');
    function update() {
      const heroGone = Boolean(hero && hero.getBoundingClientRect().bottom < 64);
      const footerNear = Boolean(footer && footer.getBoundingClientRect().top < window.innerHeight + 30);
      const formActive = Boolean(document.activeElement?.closest('form'));
      if (dock.current) dock.current.hidden = !(heroGone && !footerNear && !formActive && !document.querySelector('dialog[open]'));
    }
    const observer = new IntersectionObserver(update, { rootMargin: '30px' });
    if (hero) observer.observe(hero); if (footer) observer.observe(footer);
    update();
    window.addEventListener('navigation:change', update); document.addEventListener('focusin', update); document.addEventListener('focusout', update); window.addEventListener('scroll', update, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener('navigation:change', update); document.removeEventListener('focusin', update); document.removeEventListener('focusout', update); window.removeEventListener('scroll', update); };
  }, [pathname]);
  if (pathname === `/${locale}/consultation`) return null;
  const service = pathname.startsWith(`/${locale}/services/`) ? pathname.split('/')[3] : undefined;
  return <div ref={dock} className={styles.dock} hidden><Link prefetch={false} href={consultationHref(locale,{service,model:pathname.endsWith('/ai-systems')?'system':undefined,sourcePage:safeSourcePage(pathname,locale)})} data-cta="mobile-dock" data-service={service}>{label}<Arrow diagonal /></Link></div>;
}
