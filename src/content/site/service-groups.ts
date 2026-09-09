import type { Locale, ServiceGroup } from '@/types/content';
const groups = [
  { id: 'advertising', title: { uk: 'Реклама та performance', en: 'Advertising & Performance' }, slugs: ['ai-video-ads', 'ai-ugc', 'performance-creatives'] },
  { id: 'products', title: { uk: 'Товари та e-commerce', en: 'Product & E-commerce' }, slugs: ['product-visuals', 'virtual-models'] },
  { id: 'communication', title: { uk: 'Комунікація та масштабування', en: 'Communication & Scale' }, slugs: ['ai-spokesperson', 'video-localization', 'explainer-videos'] },
  { id: 'brand', title: { uk: 'Бренд', en: 'Brand' }, slugs: ['brand-characters'] },
] satisfies { id: ServiceGroup['id']; title: Record<Locale, string>; slugs: string[] }[];
export function serviceGroups(locale: Locale): ServiceGroup[] { return groups.map(group => ({ ...group, title: group.title[locale] })); }
