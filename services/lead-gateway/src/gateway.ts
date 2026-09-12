import { createHash } from 'node:crypto';
import type { GatewayConfig } from './config.ts';
import { MAX_BODY_BYTES, MAX_CLOCK_SKEW_SECONDS, referencePattern, sourcePattern, verifyLeadSignature } from './contract.ts';
import { parseLead } from './schema.ts';
import { formatLead } from './format.ts';
import { DeliveryError, telegramSender } from './telegram.ts';
import { safeLog } from './logger.ts';

type Result = { status: number; body: { ok?: true; referenceId?: string; code?: string }; retryAfter?: number };
type Entry = { digest: string; until: number; partsSent: number; delivered: boolean; pending?: Promise<Result> };
function json(result: Result): Response {
  return Response.json(result.body, { status: result.status, headers: { 'Cache-Control': 'no-store',
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}) } });
}
async function boundedBody(request: Request): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BODY_BYTES) throw new DeliveryError(413, 'too_large');
  if (!request.body) throw new DeliveryError(400, 'invalid_payload');
  const reader = request.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) {
      const item = await reader.read(); if (item.done) break;
      size += item.value.length;
      if (size > MAX_BODY_BYTES) { await reader.cancel(); throw new DeliveryError(413, 'too_large'); }
      chunks.push(item.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, size);
}
export function createGateway(config: GatewayConfig, options: { send?: (text: string, deadline: number) => Promise<number>; now?: () => number; log?: (line: string) => void; nfc?: (request: Request) => Promise<Response | undefined> } = {}) {
  const entries = new Map<string, Entry>();
  const rates = new Map<string, { count: number; until: number }>();
  const now = options.now ?? Date.now, send = options.send ?? telegramSender(config);
  return async function handle(request: Request): Promise<Response> {
    const started = now(); let referenceId: string | undefined, trustedSource: string | undefined;
    try {
      const url = new URL(request.url);
      if (url.pathname === '/healthz' && request.method === 'GET') return Response.json({ ok: true, service: 'antonov-lead-gateway' }, { headers: { 'Cache-Control': 'no-store' } });
      const nfcResponse = await options.nfc?.(request);
      if (nfcResponse) return nfcResponse;
      if (url.pathname !== '/v1/leads') return json({ status: 404, body: { code: 'not_found' } });
      if (request.method !== 'POST') return json({ status: 405, body: { code: 'method_not_allowed' } });
      if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') || '')) return json({ status: 415, body: { code: 'unsupported_media' } });
      const slug = request.headers.get('x-lead-source') || '';
      if (slug.length > 64 || !sourcePattern.test(slug)) return json({ status: 401, body: { code: 'unauthorized' } });
      const source = config.sources.get(slug);
      if (!source) return json({ status: 401, body: { code: 'unauthorized' } });
      const timestamp = request.headers.get('x-lead-timestamp') || '';
      if (!/^\d{10}$/.test(timestamp)) return json({ status: 401, body: { code: 'unauthorized' } });
      if (Math.abs(Math.floor(now() / 1000) - Number(timestamp)) > MAX_CLOCK_SKEW_SECONDS) return json({ status: 408, body: { code: 'expired_request' } });
      const raw = await boundedBody(request);
      if (!verifyLeadSignature(source.secret, timestamp, raw, request.headers.get('x-lead-signature') || '')) return json({ status: 401, body: { code: 'unauthorized' } });
      trustedSource = source.slug;
      let input: unknown;
      try { input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)); }
      catch { return json({ status: 400, body: { code: 'invalid_payload' } }); }
      const lead = parseLead(input, source);
      const key = request.headers.get('x-idempotency-key') || '';
      if (!lead || !referencePattern.test(key) || key !== lead.referenceId) return json({ status: 400, body: { code: 'invalid_payload' } });
      referenceId = lead.referenceId;
      for (const [key, entry] of entries) if (!entry.pending && entry.until <= now()) entries.delete(key);
      for (const [key, rate] of rates) if (rate.until <= now()) rates.delete(key);
      const cacheKey = source.slug + ':' + key;
      // submittedAt is generated again by the website when retrying after a cold start.
      const digest = createHash('sha256').update(JSON.stringify({ ...lead, submittedAt: '' })).digest('hex');
      let entry = entries.get(cacheKey);
      if (entry && entry.digest !== digest) return json({ status: 409, body: { code: 'idempotency_conflict' } });
      if (entry?.delivered) return json({ status: 200, body: { ok: true, referenceId } });
      if (entry?.pending) return json(await entry.pending);
      const rate = rates.get(source.slug) ?? { count: 0, until: now() + 60_000 };
      if (rate.count >= config.requestsPerMinute) return json({ status: 429, body: { code: 'rate_limit' }, retryAfter: Math.max(1, Math.ceil((rate.until - now()) / 1000)) });
      rate.count++; rates.set(source.slug, rate);
      if (!entry && entries.size >= config.maxEntries) return json({ status: 503, body: { code: 'unavailable' }, retryAfter: 60 });
      entry ??= { digest, until: now() + config.idempotencyTtlMs, partsSent: 0, delivered: false };
      entries.set(cacheKey, entry);
      const current = entry;
      current.pending = (async (): Promise<Result> => {
        let retryCount = 0;
        try {
          const messages = formatLead(lead, source.label); const deadline = now() + 10_500;
          for (let index = current.partsSent; index < messages.length; index++) {
            retryCount += await send(messages[index], deadline); current.partsSent = index + 1;
          }
          current.delivered = true; current.until = now() + config.idempotencyTtlMs;
          safeLog({ referenceId, source: trustedSource, status: 200, category: 'delivered', latency: now() - started, retryCount }, options.log);
          return { status: 200, body: { ok: true, referenceId } };
        } catch (error) {
          const known = error instanceof DeliveryError ? error : new DeliveryError(500, 'internal');
          safeLog({ referenceId, source: trustedSource, status: known.status, category: known.category, latency: now() - started, retryCount: retryCount + known.retries }, options.log);
          return { status: known.status, body: { code: known.status === 503 ? 'unavailable' : 'delivery_failed' } };
        }
      })();
      const result = await current.pending; current.pending = undefined;
      return json(result);
    } catch (error) {
      const status = error instanceof DeliveryError ? error.status : 500;
      safeLog({ referenceId, source: trustedSource, status, category: 'internal', latency: now() - started }, options.log);
      return json({ status, body: { code: status === 413 ? 'too_large' : 'unavailable' } });
    }
  };
}
