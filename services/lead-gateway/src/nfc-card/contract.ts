import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { normalizePhone } from '../contact.ts';

export const ORIGIN = 'https://optidigitalagent.github.io';
export const BASE_PATH = '/nfc-card-website';
export const ENDPOINT = '/v1/public/leads/nfc-card';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const PRODUCTS = ['review-card', 'branded-review-card'] as const;
export type Contact = { preferredMethod: 'phone' | 'sms' | 'email' | 'telegram' | 'whatsapp' | 'viber'; phone?: string; email?: string; telegram?: string };
export interface NfcLead { language: 'uk' | 'en'; product: typeof PRODUCTS[number]; quantity: number; customerName: string; contact: Contact; sourcePage: string; utm: Record<string, string> }
export class NfcError extends Error {
  readonly status: number;
  constructor(status: number, code: string) { super(code); this.status = status; }
}
function invalid(): never { throw new NfcError(422, 'invalid_payload'); }
export function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !keys.includes(key))) invalid();
  return value as Record<string, unknown>;
}
function text(value: unknown, max: number, optional = false): string | undefined {
  if (optional && (value === undefined || value === '')) return;
  if (typeof value !== 'string' || value.length > max || /[\x00-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(value)) invalid();
  const normalized = value.trim().normalize('NFC');
  if (!normalized || normalized.length > max) invalid();
  return normalized;
}
export function sourcePath(value: unknown): string {
  const raw = text(value, 300)!;
  if (!raw.startsWith(BASE_PATH + '/') || /[%\\]/.test(raw)) invalid();
  const path = raw.split(/[?#]/, 1)[0].replace(/\/$/, '');
  if (!new RegExp('^' + BASE_PATH + '(?:/en)?(?:/(?:order|contact|about|solutions/(?:review-card|branded-review-card)))?$').test(path)) invalid();
  return path === BASE_PATH ? path + '/' : path;
}
export function parseNfcLead(value: unknown, publicRequest = false): NfcLead {
  const input = object(value, ['language', 'product', 'quantity', 'customerName', 'contact', 'sourcePage', 'utm', ...(publicRequest ? ['website', 'challenge'] : [])]);
  if (!['uk', 'en'].includes(String(input.language)) || !PRODUCTS.includes(input.product as typeof PRODUCTS[number])) invalid();
  if (typeof input.quantity !== 'number' || !Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 10000) invalid();
  const c = object(input.contact, ['preferredMethod', 'phone', 'email', 'telegram']);
  if (!['phone', 'sms', 'email', 'telegram', 'whatsapp', 'viber'].includes(String(c.preferredMethod))) invalid();
  const phoneInput = text(c.phone, 50, true), emailInput = text(c.email, 254, true), telegramInput = text(c.telegram, 33, true);
  const phone = phoneInput ? normalizePhone(phoneInput) : undefined;
  if (phoneInput && !phone) invalid();
  if (emailInput && !/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/.test(emailInput)) invalid();
  if (telegramInput && !/^@?[A-Za-z][A-Za-z0-9_]{4,31}$/.test(telegramInput)) invalid();
  if (!phone && !emailInput && !telegramInput) invalid();
  if (c.preferredMethod === 'email' && !emailInput) invalid();
  if (['phone', 'sms', 'whatsapp', 'viber'].includes(String(c.preferredMethod)) && !phone) invalid();
  if (c.preferredMethod === 'telegram' && !telegramInput && !phone) invalid();
  const contact: Contact = { preferredMethod: c.preferredMethod as Contact['preferredMethod'], ...(phone ? { phone } : {}),
    ...(emailInput ? { email: emailInput.toLowerCase() } : {}), ...(telegramInput ? { telegram: '@' + telegramInput.replace(/^@/, '') } : {}) };
  const utmInput = object(input.utm ?? {}, ['source', 'medium', 'campaign', 'term', 'content']);
  const utm: Record<string, string> = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) { const val = text(utmInput[key], 100, true); if (val) utm[key] = val; }
  return { language: input.language as NfcLead['language'], product: input.product as NfcLead['product'], quantity: input.quantity,
    customerName: text(input.customerName, 100)!, contact, sourcePage: sourcePath(input.sourcePage), utm };
}
export function challenge(secret: string, path: string, now: number): string {
  const payload = Buffer.from(JSON.stringify({ at: now, path, nonce: randomUUID() })).toString('base64url');
  return payload + '.' + createHmac('sha256', secret).update('nfc-browser-v1.' + payload).digest('base64url');
}
export function verifyChallenge(secret: string, token: unknown, path: string, now: number): void {
  if (typeof token !== 'string' || token.length > 800 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) throw new NfcError(422, 'invalid_challenge');
  const [body, signature] = token.split('.');
  const expected = createHmac('sha256', secret).update('nfc-browser-v1.' + body).digest();
  const supplied = Buffer.from(signature, 'base64url');
  if (supplied.length !== expected.length || !timingSafeEqual(expected, supplied)) throw new NfcError(422, 'invalid_challenge');
  let decoded: { at: number; path: string };
  try { decoded = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { throw new NfcError(422, 'invalid_challenge'); }
  if (decoded.path !== path || !Number.isSafeInteger(decoded.at) || now - decoded.at < 2000 || now - decoded.at > 1800000) throw new NfcError(422, 'expired_or_early_challenge');
}
