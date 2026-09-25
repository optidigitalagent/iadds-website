import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';
import { parseSelection, type Selection } from './commerce.ts';
import { normalizePhone } from '../contact.ts';

export const ORIGIN = 'https://optidigitalagent.github.io';
export const BASE_PATH = '/nfc-card-website';
export const ENDPOINT = '/v1/public/leads/nfc-card';
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const PRODUCTS = ['review-card', 'branded-review-card', 'review-card-3d', 'nfc-instagram-card', 'nfc-menu-card'] as const;
export type Contact = { preferredMethod: 'phone' | 'sms' | 'email' | 'telegram' | 'whatsapp' | 'viber'; phone?: string; email?: string; telegram?: string };
export interface InstagramDetails { productSchemaVersion: 1; product_id: 'nfc-instagram-card'; sku: 'NFC-IG-READY'; offer: 'ready'; instagramUrl: string; comment?: string; consent: true }
export interface Review3dDetails { productSchemaVersion: 1; product_id: 'nfc-review-card-3d'; design: 'fixed_shown_design'; google_location_url?: string; comment?: string; consent: true }
export const MENU_VARIANTS = ['square_100_black', 'square_100_white', 'square_60_black', 'square_60_white', 'round_70_black', 'round_70_white'] as const;
export type MenuVariant = typeof MENU_VARIANTS[number];
export type MenuItem = { variant_id: MenuVariant; quantity: number };
export interface MenuDetails { productSchemaVersion: 1; product_id: 'nfc-menu-card'; intent: 'card_order' | 'menu_consultation'; menu_status: 'existing' | 'needs_development'; menu_url?: string; items: MenuItem[]; comment?: string; consent: true }
export interface NfcLead { language: 'uk' | 'en'; product: typeof PRODUCTS[number]; quantity: number; customerName: string; contact: Contact; sourcePage: string; utm: Record<string, string>; selection?: Selection; instagram?: InstagramDetails; review3d?: Review3dDetails; menu?: MenuDetails }
export class NfcError extends Error {
  readonly status: number;
  readonly leadId?: string;
  constructor(status: number, code: string, leadId?: string) { super(code); this.status = status; this.leadId = leadId; }
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
  if (!new RegExp('^' + BASE_PATH + '(?:/en)?(?:/(?:order|contact|about|instagram-card|menu-card|solutions/(?:review-card|branded-review-card|review-card-3d|instagram-card|menu-card)))?$').test(path)) invalid();
  return path === BASE_PATH ? path + '/' : path;
}
export function parseNfcLead(value: unknown, publicRequest = false): NfcLead {
  const instagramFields = ['productSchemaVersion', 'product_id', 'sku', 'offer', 'instagramUrl', 'comment', 'consent'];
  const menuFields = ['intent', 'menu_status', 'menu_url', 'items'];
  const review3dFields = ['design', 'google_location_url'];
  const input = object(value, ['language', 'product', 'quantity', 'customerName', 'contact', 'sourcePage', 'utm', 'selection', ...instagramFields, ...menuFields, ...review3dFields, ...(publicRequest ? ['website', 'challenge'] : [])]);
  if (!['uk', 'en'].includes(String(input.language)) || !PRODUCTS.includes(input.product as typeof PRODUCTS[number])) invalid();
  const isMenu = input.product === 'nfc-menu-card';
  const consultation = isMenu && input.intent === 'menu_consultation';
  if (!consultation && (typeof input.quantity !== 'number' || !Number.isSafeInteger(input.quantity) || input.quantity < 1 || input.quantity > 10000)) invalid();
  if (consultation && input.quantity !== undefined) invalid();
  const isInstagram = input.product === 'nfc-instagram-card';
  const isReview3d = input.product === 'review-card-3d';
  if (!isInstagram && !isMenu && !isReview3d && [...instagramFields, ...menuFields, ...review3dFields].some(key => key in input)) invalid();
  if (isInstagram && [...menuFields, ...review3dFields].some(key => key in input)) invalid();
  if (isMenu && ['sku', 'offer', 'instagramUrl', 'selection', ...review3dFields].some(key => key in input)) invalid();
  if (isReview3d && ['sku', 'offer', 'instagramUrl', 'selection', ...menuFields].some(key => key in input)) invalid();
  let instagram: InstagramDetails | undefined;
  if (isInstagram) {
    if (input.productSchemaVersion !== 1 || input.product_id !== 'nfc-instagram-card' || input.sku !== 'NFC-IG-READY' ||
        input.offer !== 'ready' || input.consent !== true || ![1, 2].includes(input.quantity as number)) invalid();
    const instagramUrl = instagramProfileURL(input.instagramUrl);
    const comment = instagramComment(input.comment);
    instagram = { productSchemaVersion: 1, product_id: 'nfc-instagram-card', sku: 'NFC-IG-READY', offer: 'ready', instagramUrl,
      ...(comment ? { comment } : {}), consent: true };
  }
  let review3d: Review3dDetails | undefined;
  if (isReview3d) {
    if (input.productSchemaVersion !== 1 || input.product_id !== 'nfc-review-card-3d' ||
        input.design !== 'fixed_shown_design' || input.consent !== true) invalid();
    const google_location_url = input.google_location_url === undefined || input.google_location_url === '' ? undefined : googleLocationURL(input.google_location_url);
    const comment = instagramComment(input.comment);
    if (comment && comment.length > 1000) invalid();
    review3d = { productSchemaVersion: 1, product_id: 'nfc-review-card-3d', design: 'fixed_shown_design',
      ...(google_location_url ? { google_location_url } : {}), ...(comment ? { comment } : {}), consent: true };
  }
  let menu: MenuDetails | undefined;
  if (isMenu) {
    if (input.productSchemaVersion !== 1 || input.product_id !== 'nfc-menu-card' || input.consent !== true ||
        !['card_order', 'menu_consultation'].includes(String(input.intent)) ||
        !['existing', 'needs_development'].includes(String(input.menu_status))) invalid();
    const intent = input.intent as MenuDetails['intent'];
    const menu_status = input.menu_status as MenuDetails['menu_status'];
    if (intent === 'menu_consultation' && menu_status !== 'needs_development') invalid();
    let menu_url: string | undefined;
    if (menu_status === 'existing') menu_url = publicMenuURL(input.menu_url);
    else if (input.menu_url !== undefined && input.menu_url !== null && input.menu_url !== '') invalid();
    const items = normalizeMenuItems(input.items, intent);
    const quantity = items.reduce((sum, item) => sum + item.quantity, 0);
    if (intent === 'card_order' && input.quantity !== quantity) invalid();
    const comment = instagramComment(input.comment);
    if (comment && comment.length > 1000) invalid();
    menu = { productSchemaVersion: 1, product_id: 'nfc-menu-card', intent, menu_status,
      ...(menu_url ? { menu_url } : {}), items, ...(comment ? { comment } : {}), consent: true };
  }
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
  if (isInstagram && (!phone || !['telegram', 'whatsapp', 'viber'].includes(String(c.preferredMethod)))) invalid();
  const contact: Contact = { preferredMethod: c.preferredMethod as Contact['preferredMethod'], ...(phone ? { phone } : {}),
    ...(emailInput ? { email: emailInput.toLowerCase() } : {}), ...(telegramInput ? { telegram: '@' + telegramInput.replace(/^@/, '') } : {}) };
  const utmInput = object(input.utm ?? {}, ['source', 'medium', 'campaign', 'term', 'content']);
  const utm: Record<string, string> = {};
  for (const key of ['source', 'medium', 'campaign', 'term', 'content']) { const val = text(utmInput[key], 100, true); if (val) utm[key] = val; }
  const quantity = consultation ? 0 : input.quantity as number;
  const selection = isMenu || isReview3d ? undefined : parseSelection(input.selection, String(input.product), quantity);
  return { language: input.language as NfcLead['language'], product: input.product as NfcLead['product'], quantity,
    customerName: text(input.customerName, 100)!, contact, sourcePage: sourcePath(input.sourcePage), utm, ...(selection ? { selection } : {}),
    ...(instagram ? { instagram } : {}), ...(review3d ? { review3d } : {}), ...(menu ? { menu } : {}) };
}
// A Google place may be supplied with the request or agreed later. Validate only;
// never fetch a visitor-supplied URL from the gateway.
export function googleLocationURL(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000 || /[\x00-\x20\x7f\\]/.test(value)) invalid();
  const authority = value.match(/^https:\/\/([^/?#]+)/i)?.[1];
  if (!authority || authority.includes(':')) invalid();
  let url: URL;
  try { url = new URL(value); } catch { invalid(); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== 'https:' || url.username || url.password || url.port || url.href.length > 1000 ||
      !(/^([a-z0-9-]+\.)*google\.com$/.test(host) || ['maps.app.goo.gl', 'g.page', 'goo.gl'].includes(host))) invalid();
  return url.href;
}
export function normalizeMenuItems(value: unknown, intent: MenuDetails['intent']): MenuItem[] {
  if (intent === 'menu_consultation') {
    if (value !== undefined && (!Array.isArray(value) || value.length !== 0)) invalid();
    return [];
  }
  if (!Array.isArray(value) || value.length < 1 || value.length > 100) invalid();
  const quantities = new Map<MenuVariant, number>();
  for (const raw of value) {
    const item = object(raw, ['variant_id', 'quantity']);
    if (!MENU_VARIANTS.includes(item.variant_id as MenuVariant) || typeof item.quantity !== 'number' ||
        !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000) invalid();
    const variant = item.variant_id as MenuVariant;
    const next = (quantities.get(variant) ?? 0) + item.quantity;
    if (next > 10000) invalid();
    quantities.set(variant, next);
  }
  const items = MENU_VARIANTS.filter(variant => quantities.has(variant)).map(variant => ({ variant_id: variant, quantity: quantities.get(variant)! }));
  if (items.reduce((sum, item) => sum + item.quantity, 0) > 10000) invalid();
  return items;
}
export function publicMenuURL(value: unknown): string {
  if (typeof value !== 'string' || value.length > 1000 || /[\x00-\x20\x7f\\]/.test(value)) invalid();
  let url: URL;
  try { url = new URL(value); } catch { invalid(); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.href.length > 1000 ||
      !url.hostname || url.hostname.endsWith('.') || url.hostname.includes('%')) invalid();
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) invalid();
  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const [a, b, c] = host.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
        (a === 192 && (b === 168 || (b === 0 && [0, 2].includes(c)))) || (a === 100 && b >= 64 && b <= 127) ||
        (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) || (a === 203 && b === 0 && c === 113)) invalid();
  } else if (ipVersion === 6) {
    // Literal IPv6 is uncommon for guest menus; reject it without DNS resolution.
    invalid();
  } else if (!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])$/i.test(host)) invalid();
  return url.href;
}
// Match the Pages profile grammar; never fetch or claim to verify an account.
export function instagramProfileURL(value: unknown): string {
  if (typeof value !== 'string' || value.length > 250 || !/^https:\/\/(?:www\.)?instagram\.com\/[A-Za-z0-9._]{1,30}\/?$/i.test(value)) invalid();
  const name = value.split('/')[3].toLowerCase();
  if (name.startsWith('.') || name.endsWith('.') || name.includes('..') ||
      ['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv'].includes(name)) invalid();
  return 'https://www.instagram.com/' + name + '/';
}
function instagramComment(value: unknown): string | undefined {
  if (value === undefined) return;
  if (typeof value !== 'string' || value.length > 2000 || /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/u.test(value)) invalid();
  const normalized = value.replace(/\r\n?/g, '\n').trim().normalize('NFC');
  if (normalized.length > 2000) invalid();
  return normalized || undefined;
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
