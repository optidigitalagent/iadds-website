import { siteConfig } from './settings';
import type { Locale } from '@/types/content';

/** Resolve approved brand facts without duplicating their values in translations. */
export function resolveBrandText<T>(content: T, locale: Locale): T {
  const b = siteConfig.brand;
  const tokens: Record<string, string> = {
    brand: b.name, product: b.productName, productUpper: b.productName, productLabel: b.productLabel,
    endorsement: b.endorsement, metadataName: b.metadataName,
    founder: b.founderName[locale], firstName: b.founderName[locale].split(' ')[0],
    founderGenitive: locale === 'uk' ? 'Артема Антонова' : b.founderName.en,
    founderRole: b.founderRole, projectCount: String(b.portfolioProjects), experimentCount: String(b.additionalExperiments),
    teamSize: String(b.teamSize), portfolioCount: `${b.portfolioProjects}+`,
  };
  function visit(value: unknown): unknown {
    if (typeof value === 'string') return value.replace(/\{\{(\w+)\}\}/g, (match, key: string) => tokens[key] ?? match);
    if (Array.isArray(value)) return value.map(visit);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, visit(item)]));
    return value;
  }
  return visit(content) as T;
}
