import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import { verifyLeadSignature } from '../contract.ts';
import type { NfcConfig } from './config.ts';
import { ENDPOINT, ORIGIN, UUID, NfcError, challenge, parseNfcLead, sourcePath, verifyChallenge } from './contract.ts';
import { persist, type Receipt } from './store.ts';
import { nfcLog } from './logger.ts';

async function body(request: Request): Promise<Uint8Array> {
  if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get('content-type') || '')) throw new NfcError(415, 'unsupported_media');
  if (Number(request.headers.get('content-length')) > 16384) throw new NfcError(413, 'too_large');
  if (!request.body) throw new NfcError(422, 'invalid_payload');
  const reader = request.body.getReader(), chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      length += next.value.length;
      if (length > 16384) { await reader.cancel(); throw new NfcError(413, 'too_large'); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks, length);
}
export function createNfcHandler(pool: Pool, config: NfcConfig, options: { now?: () => number; log?: (line: string) => void;
  save?: (lead: ReturnType<typeof parseNfcLead>, key: string, enabled: boolean) => Promise<Receipt> } = {}) {
  const now = options.now ?? Date.now;
  const rates = new Map<string, { count: number; until: number }>();
  function consume(key: string, limit: number) {
    for (const [id, item] of rates) if (item.until <= now()) rates.delete(id);
    const item = rates.get(key) ?? { count: 0, until: now() + 60000 };
    if (item.count >= limit || (!rates.has(key) && rates.size >= 1000)) throw new NfcError(429, 'rate_limit');
    item.count++; rates.set(key, item);
  }
  return async (request: Request): Promise<Response | undefined> => {
    const url = new URL(request.url), signed = url.pathname === '/v1/leads' && request.headers.get('x-lead-source') === 'NFC_CARD';
    if (!signed && url.pathname !== ENDPOINT && url.pathname !== ENDPOINT + '/challenge') return;
    const origin = request.headers.get('origin'), browser = !signed;
    const headers = new Headers({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Vary': 'Origin' });
    if (browser && origin === ORIGIN) {
      headers.set('Access-Control-Allow-Origin', ORIGIN);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
      headers.set('Access-Control-Max-Age', '600');
    }
    const respond = (status: number, payload: unknown) => Response.json(payload, { status, headers });
    try {
      if (browser && origin !== ORIGIN) throw new NfcError(403, 'origin_not_allowed');
      if (browser && request.method === 'OPTIONS') {
        const method = request.headers.get('access-control-request-method');
        const requested = (request.headers.get('access-control-request-headers') ?? '').toLowerCase().split(',').map(s => s.trim()).filter(Boolean);
        if (!['GET', 'POST'].includes(method || '') || requested.some(h => !['content-type', 'idempotency-key'].includes(h))) throw new NfcError(403, 'preflight_not_allowed');
        return new Response(null, { status: 204, headers });
      }
      // Global cap cannot be bypassed with forged proxy IP headers; peer grouping is defense in depth.
      consume(browser ? 'public-global' : 'signed-global', browser ? 120 : 60);
      if (browser) {
        const peer = (request.headers.get('x-forwarded-for') || 'unknown').split(',').at(-1)!.trim().slice(0, 100);
        consume('peer:' + createHash('sha256').update(peer).digest('hex'), 20);
      }
      if (url.pathname === ENDPOINT + '/challenge') {
        if (request.method !== 'GET') throw new NfcError(405, 'method_not_allowed');
        if (!config.publicIntake) throw new NfcError(503, 'preview_intake_disabled');
        const path = sourcePath(url.searchParams.get('sourcePage'));
        return respond(200, { challenge: challenge(config.secret, path, now()), minimumDelayMs: 2000, expiresInSeconds: 1800 });
      }
      if (request.method !== 'POST') throw new NfcError(405, 'method_not_allowed');
      if (browser && !config.publicIntake) throw new NfcError(503, 'preview_intake_disabled');
      const key = request.headers.get(browser ? 'idempotency-key' : 'x-idempotency-key') || '';
      if (!UUID.test(key)) throw new NfcError(422, 'invalid_idempotency_key');
      const raw = await body(request);
      if (signed) {
        const at = request.headers.get('x-lead-timestamp') || '';
        const signedBody = Buffer.concat([Buffer.from('NFC_CARD.' + key + '.'), raw]);
        if (!/^\d{10}$/.test(at) || Math.abs(now() / 1000 - Number(at)) > 300 || !verifyLeadSignature(config.secret, at, signedBody, request.headers.get('x-lead-signature') || '')) throw new NfcError(401, 'unauthorized');
      }
      let input;
      try { input = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(raw)); } catch { throw new NfcError(422, 'invalid_payload'); }
      const lead = parseNfcLead(input, browser);
      if (browser) {
        if (input.website !== '') throw new NfcError(422, 'invalid_payload');
        verifyChallenge(config.secret, input.challenge, lead.sourcePage, now());
      }
      const enabled = config.telegramEnabled && !config.testOnly;
      const result = await (options.save ? options.save(lead, key, enabled) : persist(pool, lead, key, { deliveryEnabled: enabled }));
      nfcLog({ leadId: result.leadId, category: 'accepted', status: 202 }, options.log);
      return respond(202, result);
    } catch (error) {
      const known = error instanceof NfcError ? error : new NfcError(503, 'storage_unavailable');
      if (known.status === 429) headers.set('Retry-After', '60');
      if (known.status === 503) headers.set('Retry-After', '30');
      nfcLog({ category: known.status === 429 ? 'rate_limit' : known.status === 503 ? 'database' : 'invalid_payload', status: known.status }, options.log);
      return respond(known.status, { ok: false, code: known.message });
    }
  };
}
