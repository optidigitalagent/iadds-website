import { siteConfig } from '@/content/site/settings';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import path from 'node:path';
import { emptyInput, type ConsultationInput } from '@/lib/validation/consultation';

export class SubmissionError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}
export interface SubmissionPayload extends ConsultationInput { referenceId: string; submittedAt: string }
export interface SubmissionResult { referenceId: string; mode: 'local' | 'webhook' }
export interface ConsultationSubmissionProvider { submit(payload: SubmissionPayload): Promise<SubmissionResult> }
export function payloadDigest(data: ConsultationInput) { return createHash('sha256').update(JSON.stringify(Object.fromEntries(Object.keys(emptyInput).map(key => [key, data[key as keyof ConsultationInput]])))).digest('hex'); }

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
export class WebhookSubmissionProvider implements ConsultationSubmissionProvider {
  constructor(private url: string, private secret?: string, private transport: typeof fetch = fetch, private resolveAddresses: (hostname: string) => Promise<{ address: string }[]> = hostname => lookup(hostname, { all: true })) {}
  async submit(payload: SubmissionPayload): Promise<SubmissionResult> {
    try {
      const url = new URL(this.url);
      if (url.protocol !== 'https:' || url.username || url.password || (url.port && url.port !== '443')) throw new SubmissionError(503, 'unavailable');
      const signal = AbortSignal.timeout(8000);
      const addresses = await Promise.race([
        this.resolveAddresses(url.hostname),
        new Promise<never>((_, reject) => signal.addEventListener('abort', () => reject(new SubmissionError(503, 'unavailable')), { once: true })),
      ]);
      if (!addresses.length || addresses.some(item => !isPublicAddress(item.address))) throw new SubmissionError(503, 'unavailable');
      const response = await this.transport(url, {
        method: 'POST', redirect: 'error', signal,
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': payload.referenceId, 'X-Enquiry-Reference': payload.referenceId, ...(this.secret ? { Authorization: `Bearer ${this.secret}` } : {}) },
        body: JSON.stringify({ ...payload, projectName: siteConfig.brand.productName, projectLabel: siteConfig.brand.productLabel }), cache: 'no-store',
      });
      await response.body?.cancel();
      if (!response.ok) throw new SubmissionError(502, 'provider_error');
      return { referenceId: payload.referenceId, mode: 'webhook' };
    } catch (error) {
      if (error instanceof SubmissionError) throw error;
      throw new SubmissionError(503, 'unavailable');
    }
  }
}
export function createSubmissionProvider(env: NodeJS.ProcessEnv = process.env): ConsultationSubmissionProvider {
  if (env.CONSULTATION_WEBHOOK_URL) return new WebhookSubmissionProvider(env.CONSULTATION_WEBHOOK_URL, env.CONSULTATION_WEBHOOK_SECRET);
  if (env.NODE_ENV === 'production') throw new SubmissionError(503, 'unavailable');
  return new LocalSubmissionProvider(path.join(process.cwd(), '.data', path.basename(env.CONSULTATION_LOCAL_DIR || 'consultations')));
}
