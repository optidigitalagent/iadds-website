import { createHash } from 'node:crypto';
import { getAllServices, getDictionary } from '@/lib/content';
import { validateConsultation } from '@/lib/validation/consultation';
import { getSiteUrl, isLocale } from '@/lib/urls';
import { createSubmissionProvider, payloadDigest, SubmissionError, type ConsultationSubmissionProvider, type SubmissionResult } from './provider';

const MAX_BYTES = 16_384;
const RATE_WINDOW = 10 * 60 * 1000;
const rates = new Map<string, { count: number; until: number }>();
const submissions = new Map<string, { digest: string; until: number; result: Promise<SubmissionResult> }>();
function prune() {
  const now = Date.now();
  for (const [key, value] of rates) if (value.until <= now) rates.delete(key);
  for (const [key, value] of submissions) if (value.until <= now) submissions.delete(key);
}
function json(data: object, status: number, headers?: HeadersInit) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', ...headers } }); }
async function readBoundedBody(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length') || 0) > MAX_BYTES) throw new SubmissionError(413, 'too_large');
  if (!request.body) throw new SubmissionError(400, 'invalid');
  const reader = request.body.getReader(); let length = 0; let text = '';
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); throw new SubmissionError(413, 'too_large'); }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) { if (error instanceof SubmissionError) throw error; throw new SubmissionError(400, 'invalid'); }
  finally { reader.releaseLock(); }
}
export async function handleConsultation(request: Request, providerFactory: () => ConsultationSubmissionProvider = createSubmissionProvider): Promise<Response> {
  try {
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ code: 'unsupported_media' }, 415);
    const origin = request.headers.get('origin');
    if (origin && ![new URL(request.url).origin, getSiteUrl()].includes(origin)) return json({ code: 'forbidden' }, 403);
    const idempotency = request.headers.get('idempotency-key');
    if (!idempotency || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(idempotency)) return json({ code: 'invalid_reference' }, 400);
    prune();
    const address = process.env.TRUST_PROXY === 'true' ? (request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown') : 'shared';
    const rateKey = createHash('sha256').update(address).digest('hex');
    const limit = process.env.TRUST_PROXY === 'true' ? 8 : 40;
    const rate = rates.get(rateKey) || { count: 0, until: Date.now() + RATE_WINDOW };
    if (rate.count >= limit || rates.size > 10000) return json({ code: 'rate_limit' }, 429, { 'Retry-After': String(Math.ceil((rate.until - Date.now()) / 1000)) });
    rate.count++; rates.set(rateKey, rate);
    const raw = await readBoundedBody(request);
    if (raw && typeof raw === 'object' && 'companyFax' in raw && raw.companyFax) return json({ code: 'invalid' }, 422);
    const locale = raw && typeof raw === 'object' && 'currentLocale' in raw ? raw.currentLocale : undefined;
    if (!isLocale(locale)) return json({ code: 'invalid_context' }, 422);
    const result = validateConsultation(raw, getAllServices(locale).map(s => s.slug), getDictionary(locale).consultation.validation);
    if (!result.valid) return json({ code: 'validation', errors: result.errors }, 422);
    const digest = payloadDigest(result.data);
    const existing = submissions.get(idempotency);
    if (existing && existing.digest !== digest) return json({ code: 'idempotency_conflict' }, 409);
    if (existing) return json(await existing.result, 200);
    if (submissions.size > 10000) throw new SubmissionError(503, 'unavailable');
    const provider = providerFactory();
    const pending = provider.submit({ ...result.data, referenceId: idempotency, submittedAt: new Date().toISOString() });
    submissions.set(idempotency, { digest, until: Date.now() + 60 * 60 * 1000, result: pending });
    try { return json(await pending, 201); }
    catch (error) { submissions.delete(idempotency); throw error; }
  } catch (error) {
    if (error instanceof SubmissionError) return json({ code: error.code }, error.status);
    return json({ code: 'unavailable' }, 503);
  }
}
