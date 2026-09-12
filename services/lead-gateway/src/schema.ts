import { referencePattern } from './contract.ts';
import { contactMethods, normalizePhone, type PreferredContact } from './contact.ts';
import type { LeadSource } from './config.ts';

interface LeadContext {
  referenceId: string; submittedAt: string; fullName: string; selectedService: string;
  communicationLanguage: 'uk' | 'en'; currentLocale: 'uk' | 'en'; sourcePage: string;
  collaborationModel: '' | 'production' | 'system'; consent: true; projectName?: string; projectLabel?: string;
}
export interface LeadV2 extends LeadContext {
  formSchemaVersion: 2; source: string; phone: string; phoneNormalized: string; preferredContact: PreferredContact;
  email?: string; company?: string; companyUrl?: string; message?: string;
}
// Only the migration adapter accepts the old unversioned wire shape. Deprecated role is discarded.
export interface LegacyLead extends LeadContext {
  formSchemaVersion?: never; company: string; email: string; contactMethod: string; companyUrl: string; message: string;
}
export type Lead = LeadV2 | LegacyLead;
const iaddsServices = ['ai-video-ads', 'ai-ugc', 'performance-creatives', 'product-visuals', 'virtual-models',
  'ai-spokesperson', 'video-localization', 'explainer-videos', 'brand-characters', 'not-sure', 'several', 'custom-ai-system'];
const commonLimits = { referenceId: [36, 36], submittedAt: [20, 30], fullName: [2, 100], selectedService: [1, 80],
  communicationLanguage: [2, 2], currentLocale: [2, 2], sourcePage: [1, 200], collaborationModel: [0, 10],
  projectName: [0, 100], projectLabel: [0, 120] } as const;
const v2Limits = { ...commonLimits, phone: [7, 50], phoneNormalized: [7, 16], preferredContact: [1, 8], source: [1, 64],
  email: [0, 254], company: [0, 120], companyUrl: [0, 300], message: [0, 1500] } as const;
const legacyLimits = { ...commonLimits, company: [2, 120], email: [3, 254], contactMethod: [0, 80], companyUrl: [1, 300], message: [10, 1500] } as const;
export function parseLead(raw: unknown, source: LeadSource): Lead | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const input = raw as Record<string, unknown>;
  const v2 = input.formSchemaVersion === 2;
  if (!v2 && input.formSchemaVersion !== undefined) return;
  const limits = v2 ? v2Limits : legacyLimits;
  const optional = new Set(['collaborationModel', 'projectName', 'projectLabel', ...(v2 ? ['email', 'company', 'companyUrl', 'message'] : ['contactMethod'])]);
  if (input.consent !== true || Object.keys(input).some(key => key !== 'consent' && !(v2 && key === 'formSchemaVersion') && !(!v2 && key === 'role') && !Object.hasOwn(limits, key))) return;
  const data: Record<string, unknown> = { consent: true, ...(v2 ? { formSchemaVersion: 2 } : {}) };
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (input[key] === undefined && optional.has(key)) {
      if (key === 'collaborationModel' || key === 'contactMethod') data[key] = '';
      continue;
    }
    if (typeof input[key] !== 'string') return;
    const value = input[key].trim();
    if (value.length < min || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return;
    if (value || !optional.has(key) || key === 'collaborationModel' || key === 'contactMethod') data[key] = value;
  }
  const lead = data as unknown as Lead;
  if (!referencePattern.test(lead.referenceId) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(lead.submittedAt) || !Number.isFinite(Date.parse(lead.submittedAt))) return;
  if (lead.formSchemaVersion === 2) {
    const normalized = normalizePhone(lead.phone);
    if (!normalized || lead.phoneNormalized !== normalized || !contactMethods.includes(lead.preferredContact) || lead.source !== source.slug) return;
    lead.phoneNormalized = normalized;
    if (lead.preferredContact === 'email' && !lead.email) return;
  }
  if (lead.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(lead.email)) return;
  if (lead.companyUrl) {
    try {
      const url = new URL(lead.companyUrl);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || /[\s<>]/.test(lead.companyUrl)) return;
    } catch { return; }
  }
  if (!['uk', 'en'].includes(lead.currentLocale) || !['uk', 'en'].includes(lead.communicationLanguage) || !['', 'production', 'system'].includes(lead.collaborationModel)) return;
  if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(lead.sourcePage)) return;
  const services = source.slug === 'iadds' ? iaddsServices : source.services;
  if (services ? !services.includes(lead.selectedService) : !/^[a-z][a-z0-9-]{0,79}$/.test(lead.selectedService)) return;
  if (lead.email) lead.email = lead.email.toLowerCase();
  return lead;
}
