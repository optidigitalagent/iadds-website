import { sourcePattern } from './contract.ts';

export interface LeadSource { slug: string; label: string; secret: string; services?: string[] }
export interface GatewayConfig {
  sources: Map<string, LeadSource>; token: string; chatId: string; threadId?: number;
  apiTimeoutMs: number; requestsPerMinute: number; idempotencyTtlMs: number; maxEntries: number;
}
function integer(value: string | undefined, fallback: number, min: number, max: number): number {
  const number = Number(value ?? fallback);
  if (!Number.isInteger(number) || number < min || number > max) throw new Error('invalid_gateway_configuration');
  return number;
}
export function readConfig(env: Record<string, string | undefined> = process.env): GatewayConfig {
  const sources = new Map<string, LeadSource>();
  for (const [key, secret] of Object.entries(env)) {
    const match = /^LEAD_SOURCE_([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*)_SECRET$/.exec(key);
    if (!match || !secret || match[1] === 'NFC_CARD') continue;
    const slug = match[1].toLowerCase().replaceAll('_', '-');
    if (!sourcePattern.test(slug) || slug.length > 64 || Buffer.byteLength(secret) < 32) throw new Error('invalid_gateway_configuration');
    const label = (env[`LEAD_SOURCE_${match[1]}_LABEL`] || slug).trim();
    if (!label || label.length > 80 || /[\x00-\x1f\x7f]/.test(label)) throw new Error('invalid_gateway_configuration');
    const services = env[`LEAD_SOURCE_${match[1]}_SERVICES`]?.split(',').map(value => value.trim());
    sources.set(slug, { slug, label, secret, services });
  }
  const token = env.TELEGRAM_BOT_TOKEN || '';
  const chatId = env.TELEGRAM_CHAT_ID || '';
  // Personal chat only. Missing configuration fails delivery closed, while health remains usable.
  if ((token && !/^\d+:[A-Za-z0-9_-]{20,}$/.test(token)) || (chatId && !/^[1-9]\d{0,18}$/.test(chatId))) throw new Error('invalid_gateway_configuration');
  return { sources, token, chatId,
    threadId: env.TELEGRAM_MESSAGE_THREAD_ID ? integer(env.TELEGRAM_MESSAGE_THREAD_ID, 0, 1, 2_147_483_647) : undefined,
    apiTimeoutMs: integer(env.TELEGRAM_API_TIMEOUT_MS, 3000, 100, 8000),
    requestsPerMinute: integer(env.MAX_REQUESTS_PER_MINUTE, 30, 1, 300),
    idempotencyTtlMs: integer(env.IDEMPOTENCY_TTL_SECONDS, 86400, 60, 604800) * 1000,
    maxEntries: 10000 };
}
