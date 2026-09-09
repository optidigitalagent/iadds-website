import type { CaseStudy, Locale, Media, Service } from '@/types/content';
import { isPublishedCase, isVerifiedMetric, isVerifiedTestimonial } from './index';
import { safeExternalUrl } from '@/lib/urls';
import { serviceGroups } from '@/content/site/service-groups';

function checkMedia(media: Media, errors: string[]) {
  if (media.decorative ? media.alt !== '' : !media.alt.trim()) errors.push(`Invalid alt text: ${media.src}`);
  if (!media.src.startsWith('/media/') || media.width <= 0 || media.height <= 0) errors.push(`Invalid media: ${media.src}`);
  if (media.type === 'video' && !media.poster) errors.push(`Missing video poster: ${media.src}`);
  if (media.status === 'client' && (!media.publicationApproved || media.sourceStatus !== 'approved')) errors.push(`Unapproved client media: ${media.src}`);
}
export function validateContent(services: Service[], cases: CaseStudy[], navigation: { href: string }[]) {
  const errors: string[] = [];
  if (services.length !== 9 || services.some(service => service.slug === 'ai-systems')) errors.push('Expected exactly nine catalog services; AI systems are separate');
  const ids = new Set<string>(); const slugs = new Set<string>();
  for (const service of services) {
    if (ids.has(service.id)) errors.push(`Duplicate ID: ${service.id}`);
    if (slugs.has(service.slug)) errors.push(`Duplicate slug: ${service.slug}`);
    ids.add(service.id); slugs.add(service.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(service.slug)) errors.push(`Invalid slug: ${service.slug}`);
    if (!service.seo.title || !service.seo.description) errors.push(`Missing SEO: ${service.slug}`);
    if (!service.title || !service.professionalLabel || !serviceGroups('uk').some(group => group.id === service.group && group.slugs.includes(service.slug))) errors.push(`Invalid service identity/group: ${service.slug}`);
    if (!service.overview || !service.whatItIs || service.problems.length < 3 || service.deliverables.length < 4 || service.faq.length < 5) errors.push(`Incomplete service: ${service.slug}`);
    if (service.relatedSlugs.length !== 3 || new Set(service.relatedSlugs).size !== 3) errors.push(`Expected three related services: ${service.slug}`);
    for (const related of service.relatedSlugs) if (related === service.slug || !services.some(s => s.slug === related && s.enabled)) errors.push(`Broken related service: ${related}`);
    [service.cardMedia, service.heroMedia, ...service.exampleMedia].forEach(m => checkMedia(m, errors));
  }
  const caseSlugs = new Set<string>();
  for (const item of cases) {
    if (ids.has(item.id)) errors.push(`Duplicate ID: ${item.id}`);
    if (caseSlugs.has(item.slug)) errors.push(`Duplicate case slug: ${item.slug}`);
    ids.add(item.id); caseSlugs.add(item.slug);
    if (item.status !== 'published') continue;
    if (!isPublishedCase(item)) errors.push(`Unapproved case publication requirements: ${item.slug}`);
    const translation = item.translations?.uk;
    if (!translation || !translation.projectTitle || !translation.summary || !translation.challenge || !translation.idea || !translation.seo.title || !translation.seo.description || !translation.responsibilities.length || !translation.deliverables.length || !translation.process.length || !translation.media.length) errors.push(`Missing case translation: ${item.slug}`);
    if (translation) {
      translation.media.forEach(media => checkMedia(media, errors));
      for (const metric of translation.metrics) if (!isVerifiedMetric(metric)) errors.push(`Unverified metric: ${item.slug}/uk`);
      if (!isVerifiedTestimonial(translation.testimonial)) errors.push(`Unapproved testimonial: ${item.slug}/uk`);
    }
    if (!item.approvals.clientPublication || !item.approvals.approvedAt || Number.isNaN(Date.parse(item.approvals.approvedAt))) errors.push(`Unapproved case: ${item.slug}`);
    if (!item.clientName || !item.projectTitle || !item.summary || !item.challenge || !item.idea || !item.seo.title || !item.seo.description || !item.responsibilities.length || !item.deliverables.length || !item.process.length || !item.media.length) errors.push(`Incomplete published case: ${item.slug}`);
    if (item.publicUrl && !safeExternalUrl(item.publicUrl)) errors.push(`Invalid public link: ${item.slug}`);
    for (const service of item.services) if (!services.some(s => s.slug === service && s.enabled)) errors.push(`Unknown case service: ${service}`);
    for (const metric of item.metrics) if (!isVerifiedMetric(metric)) errors.push(`Unverified metric: ${item.slug}`);
    if (!isVerifiedTestimonial(item.testimonial)) errors.push(`Unapproved testimonial: ${item.slug}`);
    item.media.forEach(m => checkMedia(m, errors));
  }
  const routes = new Set(['/', '/services', '/cases', '/about', '/ai-systems', '/pricing', '/process', '/contact', '/consultation', ...services.filter(s => s.enabled).map(s => `/services/${s.slug}`), ...cases.filter(c => c.status === 'published' && c.approvals.clientPublication).map(c => `/cases/${c.slug}`)]);
  for (const link of navigation) if (!/^\/(uk|en)(?:\/|$)/.test(link.href) || !routes.has(link.href.replace(/#.*$/, '').replace(/^\/(uk|en)/, '') || '/')) errors.push(`Broken navigation: ${link.href}`);
  if (errors.length) throw new Error(errors.join('\n'));
  return { services: services.length, publishedCases: cases.filter(c => c.status === 'published').length };
}

export function validateLocaleParity(dictionaries: Record<Locale, unknown>, services: Record<Locale, Service[]>) {
  const errors: string[] = [];
  function compare(a: unknown, b: unknown, path: string) {
    if (typeof a === 'string') { if (typeof b !== 'string' || !a.trim() || !b.trim()) errors.push(`Missing translation: ${path}`); return; }
    if (Array.isArray(a)) { if (!Array.isArray(b) || a.length !== b.length) { errors.push(`Locale array parity: ${path}`); return; } a.forEach((item, i) => compare(item, b[i], `${path}[${i}]`)); return; }
    if (a && typeof a === 'object') {
      if (!b || typeof b !== 'object' || Array.isArray(b)) { errors.push(`Locale object parity: ${path}`); return; }
      const left = a as Record<string, unknown>, right = b as Record<string, unknown>;
      if (Object.keys(left).sort().join('|') !== Object.keys(right).sort().join('|')) errors.push(`Locale key parity: ${path}`);
      for (const key of Object.keys(left)) compare(left[key], right[key], `${path}.${key}`);
    }
  }
  compare(dictionaries.en, dictionaries.uk, 'dictionary');
  const left = services.en.map(item => item.slug).sort(), right = services.uk.map(item => item.slug).sort();
  if (left.join('|') !== right.join('|')) errors.push('Missing service translation');
  for (const service of services.en) {
    const translation = services.uk.find(item => item.slug === service.slug); if (!translation) continue;
    for (const key of ['whatItIs', 'overview', 'problems', 'bestFor', 'deliverables', 'formats', 'clientInputs', 'processSteps', 'commercialNotes', 'faq', 'seo'] as const) compare(service[key], translation[key], `service.${service.slug}.${key}`);
  }
  const publicContent = JSON.stringify({ dictionaries, services });
  if (new RegExp('Anton' + 'off', 'i').test(publicContent)) errors.push('Incorrect primary brand spelling');
  if (/four-person|4-person|чотирьох|чотирьома|команд[аиі].{0,30}4\s*(людин|ос[іо]б)/i.test(publicContent)) errors.push('Outdated team composition');
  if (publicContent.includes('TODO_COMMERCIAL_TERMS') || /\{\{\w+\}\}/.test(publicContent)) errors.push('Unresolved internal content marker');
  if (errors.length) throw new Error(errors.join('\n'));
}
