import { copy as en } from '@/content/en/site';
import { copy as uk } from '@/content/uk/site';
import { services as enServices } from '@/content/en/services';
import { services as ukServices } from '@/content/uk/services';
import * as enProcess from '@/content/en/process';
import * as ukProcess from '@/content/uk/process';
import { cases } from '@/content/cases';
import { siteConfig } from '@/content/site/settings';
import { serviceGroups } from '@/content/site/service-groups';
import { experience as enExperience } from '@/content/en/experience';
import { experience as ukExperience } from '@/content/uk/experience';
import type { CaseStudy, Locale, Media, Metric, Testimonial } from '@/types/content';
import { localizedPath, safeExternalUrl } from '@/lib/urls';

export const defaultLocale = siteConfig.defaultLocale;
export function getSiteConfig() { return siteConfig; }
export function getSiteSettings() { return siteConfig; }
export function getBrandConfig(locale: Locale) { return { ...siteConfig.brand, founderName: siteConfig.brand.founderName[locale] }; }
export function getDictionary(locale: Locale = defaultLocale) { return locale === 'uk' ? uk : en; }
export function getExperience(locale: Locale) { return locale === 'uk' ? ukExperience : enExperience; }
export function getNavigation(locale: Locale) {
  const dictionary = getDictionary(locale);
  const nav = [...dictionary.nav];
  if (shouldShowCasesInNavigation()) nav.splice(1, 0, { label: dictionary.cases.title, href: '/cases' });
  return nav.map(item => ({ ...item, href: localizedPath(locale, item.href) }));
}
export function getServiceGroups(locale: Locale) { return serviceGroups(locale); }
export function getAllServices(locale: Locale = defaultLocale) { return (locale === 'uk' ? ukServices : enServices).filter(s => s.enabled); }
export function getServiceBySlug(locale: Locale, slug: string) { return getAllServices(locale).find(s => s.slug === slug); }
export function getRelatedServices(locale: Locale, slug: string) {
  return (getServiceBySlug(locale, slug)?.relatedSlugs ?? []).flatMap(related => { const service=getServiceBySlug(locale,related); return service && service.slug!==slug ? [service] : []; });
}
export function isVerifiedTestimonial(item?: Testimonial) {
  return Boolean(item?.verified && item.publicationApproved && item.quote.trim() && item.author.trim() && item.role.trim() && item.company.trim() && item.approvalSource?.trim() && (!item.sourceUrl || safeExternalUrl(item.sourceUrl)) && (!item.rating || (item.rating.value >= 0 && item.rating.max > 0 && item.rating.value <= item.rating.max)) && (!item.avatar || (item.avatar.publicationApproved && item.avatar.sourceStatus === 'approved')));
}
export function isPublishedCase(item: CaseStudy) {
  const translation = item.translations?.uk;
  const approvedMedia = (media?: Media) => Boolean(media && media.src.trim() && !/\/api\/format-media\/|\/media\/examples\/example-/.test(media.src) && media.status === 'client' && media.publicationApproved && media.sourceStatus === 'approved' && !media.illustrative && !media.decorative && media.alt.trim() && media.width > 0 && media.height > 0 && (media.type !== 'video' || media.poster.trim()));
  const complete = (record: Pick<CaseStudy, 'projectTitle'|'summary'|'challenge'|'idea'|'responsibilities'|'process'|'deliverables'|'media'|'metrics'|'testimonial'|'seo'|'contextMedia'>) => Boolean(record.projectTitle.trim() && record.summary.trim() && record.challenge.trim() && record.idea.trim() && record.responsibilities.length && record.process.length && record.deliverables.length && record.seo.title.trim() && record.seo.description.trim() && record.media.length >= 2 && record.media.length <= 3 && record.media.every(approvedMedia) && (!record.contextMedia || (record.contextMedia.interface?.type === 'video' && approvedMedia(record.contextMedia.interface) && record.contextMedia.input?.type === 'image' && approvedMedia(record.contextMedia.input))) && record.metrics.every(isVerifiedMetric) && isVerifiedTestimonial(record.testimonial));
  return item.status === 'published' && item.approvals.clientPublication && item.approvals.clientNameVerified === true && Boolean(item.clientName.trim()) && Boolean(item.approvals.approvedAt) && !Number.isNaN(Date.parse(item.approvals.approvedAt!)) && Boolean(safeExternalUrl(item.publicUrl)) && complete(item) && Boolean(translation && complete(translation));
}
export function getPublishedCases(locale: Locale = defaultLocale, records: CaseStudy[] = cases) { return records.filter(isPublishedCase).map(item => locale === 'uk' ? { ...item, ...item.translations!.uk } : item); }
export function shouldShowCasesInNavigation(records: CaseStudy[] = cases) { return records.some(isPublishedCase); }
export function getCaseBySlug(locale: Locale, slug: string) { return getPublishedCases(locale).find(item => item.slug === slug); }
export function isVerifiedMetric(metric: Metric) { return metric.verified && Boolean(metric.source.trim()) && Boolean(metric.approvedAt) && !Number.isNaN(Date.parse(metric.approvedAt)); }
function processContent(locale: Locale) { return locale === 'uk' ? ukProcess : enProcess; }
export function getProcessSteps(locale: Locale = defaultLocale) { return processContent(locale).processSteps; }
export const getProcessPreview = getProcessSteps;
export function getProcessDetails(locale: Locale = defaultLocale) { return processContent(locale).processDetails; }
export function getCommercialNotes(locale: Locale = defaultLocale) { return processContent(locale).commercialNotes; }
export function getFaq(locale: Locale = defaultLocale) { return processContent(locale).globalFaq; }
export const getGlobalFaq = getFaq;
export function getConsultationContent(locale: Locale) { return getDictionary(locale).consultation; }
export function getContactDetails() {
  const c = siteConfig.contacts;
  return { ...c,
    socialLinks: [{ label: 'Telegram', url: c.telegram }, { label: 'Instagram', url: c.instagram }],
    legalLinks: siteConfig.legalLinks.filter(link => link.label && safeExternalUrl(link.url)),
  };
}
