import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader, Footer } from '@/components/layout/site-layout';
import { SiteEffects } from '@/components/layout/site-effects';
import { ConsultationDock } from '@/components/layout/consultation-dock';
import { LocaleProvider } from '@/components/layout/locale-context';
import { getDictionary } from '@/lib/content';
import { getSiteUrl, isLocale, locales } from '@/lib/urls';
import { OrganizationSchema } from '@/lib/seo';
import { siteConfig } from '@/content/site/settings';
import '@/styles/globals.css';
export const metadata: Metadata = { metadataBase: new URL(getSiteUrl()), icons: { icon: siteConfig.brand.logo.favicon, apple: siteConfig.brand.logo.apple } };
export function generateStaticParams() { return locales.map(locale=>({locale})); }
export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{locale:string}> }) {
  const {locale}=await params; if(!isLocale(locale)) notFound();
  const c = getDictionary(locale);
  return <html lang={locale} data-scroll-behavior="smooth"><head><link rel="preload" href={locale==='uk'?'/fonts/manrope-cyrillic.woff2':'/fonts/manrope-latin.woff2'} as="font" type="font/woff2" crossOrigin="anonymous" /></head><body><LocaleProvider locale={locale} ui={c.ui}><a className="skip-link" href="#main-content">{c.ui.skip}</a><SiteHeader locale={locale} /><main id="main-content" tabIndex={-1}>{children}</main><Footer locale={locale} /><ConsultationDock label={c.ui.book} /><SiteEffects locale={locale} /><OrganizationSchema locale={locale} /></LocaleProvider></body></html>;
}
