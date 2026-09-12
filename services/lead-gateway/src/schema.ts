import { referencePattern } from './contract.ts';
import type { LeadSource } from './config.ts';

export interface Lead {
  referenceId: string; submittedAt: string; fullName: string; company: string; role: string;
  email: string; contactMethod: string; companyUrl: string; selectedService: string; message: string;
  communicationLanguage: 'uk' | 'en'; currentLocale: 'uk' | 'en'; sourcePage: string;
  collaborationModel: '' | 'production' | 'system'; consent: true; projectName?: string; projectLabel?: string;
}
const iaddsServices = ['ai-video-ads', 'ai-ugc', 'performance-creatives', 'product-visuals', 'virtual-models',
  'ai-spokesperson', 'video-localization', 'explainer-videos', 'brand-characters', 'not-sure', 'several', 'custom-ai-system'];
const limits = { referenceId: [36, 36], submittedAt: [20, 30], fullName: [2, 100], company: [2, 120], role: [0, 100],
  email: [3, 254], contactMethod: [0, 80], companyUrl: [1, 300], selectedService: [1, 80], message: [10, 1500],
  communicationLanguage: [2, 2], currentLocale: [2, 2], sourcePage: [1, 200], collaborationModel: [0, 10],
  projectName: [0, 100], projectLabel: [0, 120] } as const;
const optional = new Set(['role', 'contactMethod', 'collaborationModel', 'projectName', 'projectLabel']);
export function parseLead(raw: unknown, source: LeadSource): Lead | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return;
  const input = raw as Record<string, unknown>;
  if (Object.keys(input).some(key => key !== 'consent' && !Object.hasOwn(limits, key)) || input.consent !== true) return;
  const data: Record<string, string | true> = { consent: true };
  for (const [key, [min, max]] of Object.entries(limits)) {
    if (input[key] === undefined && optional.has(key)) { data[key] = ''; continue; }
    if (typeof input[key] !== 'string') return;
    const value = input[key].trim();
    if (value.length < min || value.length > max || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value)) return;
    data[key] = value;
  }
  const lead = data as unknown as Lead;
  if (!referencePattern.test(lead.referenceId) || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(lead.submittedAt) || !Number.isFinite(Date.parse(lead.submittedAt))) return;
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(lead.email)) return;
  try {
    const url = new URL(lead.companyUrl);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname.includes('.') || /[\s<>]/.test(lead.companyUrl)) return;
  } catch { return; }
  if (!['uk', 'en'].includes(lead.currentLocale) || !['uk', 'en'].includes(lead.communicationLanguage) || !['', 'production', 'system'].includes(lead.collaborationModel)) return;
  if (!/^\/(?:[a-zA-Z0-9_-]+\/?)*$/.test(lead.sourcePage)) return;
  const services = source.slug === 'iadds' ? iaddsServices : source.services;
  if (services ? !services.includes(lead.selectedService) : !/^[a-z][a-z0-9-]{0,79}$/.test(lead.selectedService)) return;
  lead.email = lead.email.toLowerCase();
  return lead;
}
