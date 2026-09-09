'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import type { Locale } from '@/types/content';
import { safeSourcePage, validModel } from '@/lib/urls';
export function SiteEffects({ locale }: { locale: Locale }) {
  const pathname = usePathname(); const router = useRouter();
  useEffect(() => {
    function click(event: MouseEvent) {
      const link = (event.target as Element)?.closest('a'); if (!link) return;
      const sourcePage=safeSourcePage(window.location.pathname,locale);
      const destination=new URL(link.href);
      if (destination.origin===location.origin && /\/(uk|en)\/consultation$/.test(destination.pathname) && !destination.searchParams.has('from')) {
        destination.searchParams.set('from',sourcePage); link.href=destination.href;
        // Next Link closes over its href prop, so changing the DOM href alone loses context.
        if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && event.button === 0 && link.target !== '_blank') {
          event.preventDefault(); router.push(destination.pathname + destination.search + destination.hash);
        }
      }
      const properties={locale,sourcePage,componentLocation:link.dataset.cta,serviceSlug:link.dataset.service};
      if (link.dataset.contact) {
        const contacts={email:'contact_email_click',phone:'contact_phone_click',telegram:'contact_telegram_click',instagram:'contact_instagram_click'} as const;
        const name=contacts[link.dataset.contact as keyof typeof contacts]; if(name) track({name,properties:{locale,sourcePage,destination:link.dataset.contact}});
      } else if (link.dataset.model && validModel(link.dataset.model)) track({name:'collaboration_model_select',properties:{...properties,collaborationModel:validModel(link.dataset.model)||undefined}});
      else if (link.dataset.cta==='test-stage') track({name:'test_stage_cta_click',properties});
      else if (link.dataset.cta) track({name:'consultation_cta_click',properties});
      else if (link.dataset.serviceCard) track({name:'service_card_open',properties:{locale,sourcePage,serviceSlug:link.dataset.serviceCard}});
      else if (link.hasAttribute('data-navigation')) track({name:'navigation_click',properties:{locale,sourcePage,destination:safeSourcePage(destination.pathname,locale)}});
      else if (/\/(uk|en)\/consultation$/.test(destination.pathname)) track({name:'consultation_cta_click',properties:{...properties,componentLocation:'text-link'}});
    }
    document.addEventListener('click', click, true);
    return () => document.removeEventListener('click', click, true);
  }, [locale, router]);
  useEffect(() => {
    const header = document.querySelector<HTMLElement>('[data-site-header]');
    function scroll() { if (header) header.dataset.scrolled = String(window.scrollY > 16); }
    scroll(); window.addEventListener('scroll', scroll, { passive: true });
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.motionPending = 'false'; observer.unobserve(entry.target); }
    }), { threshold: .08 });
    const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
    // Read positions together before writing reveal states to avoid repeated layout work.
    if (!preference.matches) {
      const belowViewport = Array.from(elements).filter(element => element.getBoundingClientRect().top > window.innerHeight);
      belowViewport.forEach(element => { element.dataset.motionPending = 'true'; observer.observe(element); });
    }
    function reduce() { if (preference.matches) { observer.disconnect(); elements.forEach(element => { element.dataset.motionPending = 'false'; }); } }
    preference.addEventListener('change', reduce);
    return () => { observer.disconnect(); elements.forEach(element => { element.dataset.motionPending = 'false'; }); window.removeEventListener('scroll', scroll); preference.removeEventListener('change', reduce); };
  }, [pathname]);
  return null;
}
