import type { Locale, ExternalLink } from '@/types/content';

/** Owner-approved facts. Product name and public contacts are edited only here. */
export const siteConfig = {
  brand: {
    name: 'Antonov Digital',
    productName: 'iADDS',
    get endorsement() { return `By ${this.name}`; },
    get productLabel() { return `${this.productName} — ${this.endorsement}`; },
    get metadataName() { return `${this.productName} by ${this.name}`; },
    logo: { symbol: '/media/brand/iadds-symbol-128.png', monochrome: '/media/brand/iadds-symbol-white-128.png', favicon: '/media/brand/iadds-favicon-32.png', apple: '/media/brand/iadds-app-180.png', needsVectorMaster: true },
    founderName: { uk: 'Артем Антонов', en: 'Artem Antonov' } satisfies Record<Locale, string>,
    get founderRole() { return `Founder & CEO of ${this.name}`; },
    get founderIdentity() { return `${this.founderName.en} — ${this.founderRole}`; },
    teamSize: 2,
    team: ['founder', 'undisclosed-developer-partner'] as const,
    portfolioProjects: 30,
    additionalExperiments: 50,
    markets: ['Ukraine', 'Europe'],
    workingLanguages: ['uk', 'en'] as Locale[],
  },
  defaultLocale: 'uk' as Locale,
  availableLocales: ['uk', 'en'] as const,
  localeCookie: 'site_locale',
  contacts: {
    email: 'ant.artem20111@gmail.com',
    get emailHref() { return `mailto:${this.email}`; },
    phone: '+380 98 042 16 19',
    get phoneHref() { return `tel:${this.phone.replace(/[^+\d]/g, '')}`; },
    telegram: 'https://t.me/TijGabumG',
    instagram: 'https://www.instagram.com/antonovdigital/',
  },
  features: { casesNavigation: 'when-published' as const },
  commercial: { internalStatus: 'TODO_COMMERCIAL_TERMS' as const },
  legalLinks: [] as ExternalLink[],
  analytics: { provider: null },
};
export const siteSettings = siteConfig;
