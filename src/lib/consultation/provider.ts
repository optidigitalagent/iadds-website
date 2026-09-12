import { siteConfig } from '@/content/site/settings';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve4, resolve6 } from 'node:dns/promises';
import path from 'node:path';
import { omitEmptyOptionalFields, type ConsultationInput } from '@/lib/validation/consultation';
import { leadHeaders, sourcePattern } from '../../../services/lead-gateway/src/contract';
import type { LegacyLead } from '../../../services/lead-gateway/src/schema';

export class SubmissionError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}
export type SubmissionPayload = (ReturnType<typeof omitEmptyOptionalFields> & { referenceId:string; submittedAt:string }) | LegacyLead;
export interface SubmissionResult { referenceId: string; mode: 'local' | 'webhook' }
export interface ConsultationSubmissionProvider { submit(payload: SubmissionPayload): Promise<SubmissionResult> }
export function payloadDigest(data: ConsultationInput | SubmissionPayload) { return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.entries(data).filter(([key])=>!['referenceId','submittedAt','projectName','projectLabel'].includes(key)).sort(([a],[b])=>a.localeCompare(b))))).digest('hex'); }

export class LocalSubmissionProvider implements ConsultationSubmissionProvider {
  constructor(private directory: string) {}
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    await mkdir(this.directory, { recursive: true });
    const file = path.join(this.directory, `${payload.referenceId}.json`);
    try { await writeFile(file, JSON.stringify(payload, null, 2), { flag: 'wx', mode: 0o600 }); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw new SubmissionError(503, 'unavailable');
      const existing = JSON.parse(await readFile(file, 'utf8')) as SubmissionPayload;
      if (payloadDigest(existing) !== payloadDigest(payload)) throw new SubmissionError(409, 'idempotency_conflict');
    }
    return { referenceId: payload.referenceId, mode: 'local' };
  }
}
export function isPublicAddress(address: string): boolean {
  if (address.includes(':')) {
    const ip = address.toLowerCase();
    if (ip.startsWith('::ffff:')) return isPublicAddress(ip.slice(7));
    return !ip.startsWith('::') && !ip.startsWith('fc') && !ip.startsWith('fd') && !ip.startsWith('fe8') && !ip.startsWith('fe9') && !ip.startsWith('fea') && !ip.startsWith('feb') && !ip.startsWith('ff');
  }
  const [a, b] = address.split('.').map(Number);
  return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || (a === 198 && (b === 18 || b === 19)));
}
export async function resolveWebhookAddresses(hostname: string): Promise<{ address: string }[]> {
  // Workers supports resolve4/resolve6 but not dns.lookup. Missing one address family is normal.
  const records = await Promise.allSettled([resolve4(hostname), resolve6(hostname)]);
  return records.flatMap(result => result.status === 'fulfilled' ? result.value.map(address => ({ address })) : []);
}
export class WebhookSubmissionProvider implements ConsultationSubmissionProvider {
  constructor(private url: string, private secret?: string, private transport: typeof fetch = fetch, private resolveAddresses: (hostname: string) => Promise<{ address: string }[]> = resolveWebhookAddresses, private source = 'iadds') {}
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      const url = new URL(this.url);
      if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new SubmissionError(503, 'unavailable');
      if (!this.secret || Buffer.byteLength(this.secret) < 32 || !sourcePattern.test(this.source) || this.source.length > 64) throw new SubmissionError(503, 'unavailable');
      // Fits inside the existing browser's 15s timeout, including the gateway's bounded retry budget.
      const signal = AbortSignal.timeout(13000);
      const addresses = await Promise.race([
        this.resolveAddresses(url.hostname),
        new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(new SubmissionError(503, 'unavailable')), { once: true })),
      ]);
      if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new SubmissionError(503, 'unavailable');
      const body = JSON.stringify({ ...payload, projectName: siteConfig.brand.productName, projectLabel: siteConfig.brand.productLabel });
      const response = await this.transport(url, {
        // Workers requires manual redirects; the strict 200 check below rejects every 3xx.
        method: 'POST', redirect: 'manual', signal,
        headers: leadHeaders(this.secret, this.source, payload.referenceId, body), body, cache: 'no-store',
      });
      if (response.status !== 200) { await response.body?.cancel(); throw new SubmissionError(response.status === 503 ? 503 : 502, 'provider_error'); }
      const reader = response.body?.getReader();
      if (!reader) throw new SubmissionError(502, 'provider_error');
      let text = ''; let bytes = 0; const decoder = new TextDecoder();
      try {
        while (true) {
          const part = await reader.read(); if (part.done) break;
          bytes += part.value.length;
          if (bytes > 2048) { await reader.cancel(); throw new SubmissionError(502, 'provider_error'); }
          text += decoder.decode(part.value, { stream: true });
        }
        text += decoder.decode();
      } finally { reader.releaseLock(); }
      const result = JSON.parse(text);
      if (result?.ok !== true || result.referenceId !== payload.referenceId) throw new SubmissionError(502, 'provider_error');
      return { referenceId: payload.referenceId, mode: 'webhook' };
    } catch (error) {
      if (error instanceof SubmissionError) throw error;
      throw new SubmissionError(503, 'unavailable');
    }
  }
}
export function createSubmissionProvider(env: NodeJS.ProcessEnv = process.env): ConsultationSubmissionProvider {
  if (env.CONSULTATION_WEBHOOK_URL) return new WebhookSubmissionProvider(env.CONSULTATION_WEBHOOK_URL, env.CONSULTATION_WEBHOOK_SECRET, undefined, undefined, env.CONSULTATION_WEBHOOK_SOURCE || 'iadds');
  if (env.NODE_ENV === 'production') throw new SubmissionError(503, 'unavailable');
  return new LocalSubmissionProvider(path.join(process.cwd(), '.data', path.basename(env.CONSULTATION_LOCAL_DIR || 'consultations')));
}
