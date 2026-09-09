export function safeExternalUrl(value?: string): string | undefined {
  if (!value || value.length > 2048) return undefined;
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return undefined;
    return url.href;
  } catch { return undefined; }
}
export function publicWebsite(value: string): boolean {
  const valid = safeExternalUrl(value);
  if (!valid) return false;
  const hostname = new URL(valid).hostname;
  return hostname.includes('.') && !hostname.startsWith('.') && !hostname.endsWith('.') && !/[\s<>]/.test(value);
}
export function getSiteUrl(): string {
  const url = safeExternalUrl(process.env.SITE_URL) || 'http://127.0.0.1:3100';
  return new URL(url).origin;
}
export const locales = ['uk', 'en'] as const;
export function isLocale(value: unknown): value is Locale { return value === 'uk' || value === 'en'; }
export function localizedPath(locale: Locale, path = '') { return `/${locale}${path === '/' ? '' : path}`; }
export function localeFromPath(path: string): Locale { const locale = path.split('/')[1]; return isLocale(locale) ? locale : 'uk'; }
export function switchLocalePath(current: string, locale: Locale): string {
  const url = new URL(current, 'https://local.invalid');
  const parts = url.pathname.split('/');
  if (isLocale(parts[1])) parts[1] = locale;
  else if (parts[1] === 'ua' || /^[a-z]{2}(?:-[A-Za-z]{2})?$/.test(parts[1])) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join('/').replace(/\/$/, '') + url.search + url.hash;
}
export function getLocaleAlternates(path: string) {
  return { uk: switchLocalePath(path, 'uk'), en: switchLocalePath(path, 'en'), 'x-default': switchLocalePath(path, 'uk') };
}
export function safeSourcePage(value: unknown, locale: Locale): string {
  if (typeof value !== 'string' || value.length > 200 || /[?#%\\]/.test(value)) return localizedPath(locale);
  const all = locales.flatMap(lang => ['', '/services', '/about', '/ai-systems', '/pricing', '/process', '/contact', '/consultation', '/cases', ...serviceGroups(lang).flatMap(group => group.slugs.map(slug => `/services/${slug}`))].map(path => localizedPath(lang, path)));
  return all.includes(value) ? value : localizedPath(locale);
}
export function validModel(value: unknown): CollaborationModel | '' { return value === 'production' || value === 'system' ? value : ''; }
export function consultationHref(locale: Locale, options: { service?: string; model?: CollaborationModel; sourcePage?: string } = {}): string {
  const query = new URLSearchParams();
  if (options.service && serviceGroups(locale).some(group => group.slugs.includes(options.service!))) query.set('service', options.service);
  if (options.model) query.set('model', options.model);
  if (options.sourcePage) query.set('from', safeSourcePage(options.sourcePage, locale));
  return localizedPath(locale, '/consultation') + (query.size ? `?${query}` : '');
}
import type { CollaborationModel, Locale } from '@/types/content';
import { serviceGroups } from '@/content/site/service-groups';
