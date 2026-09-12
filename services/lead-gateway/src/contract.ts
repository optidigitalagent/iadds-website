import { createHmac, timingSafeEqual } from 'node:crypto';

export const MAX_BODY_BYTES = 32_768;
export const MAX_CLOCK_SKEW_SECONDS = 300;
export const referencePattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
export const sourcePattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
export function signLead(secret: string, timestamp: string, rawBody: string | Uint8Array): string {
  return createHmac('sha256', secret).update(timestamp + '.').update(rawBody).digest('hex');
}
export function verifyLeadSignature(secret: string, timestamp: string, rawBody: Uint8Array, signature: string): boolean {
  if (!/^[0-9a-f]{64}$/.test(signature)) return false;
  return timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(signLead(secret, timestamp, rawBody), 'hex'));
}
export function leadHeaders(secret: string, source: string, referenceId: string, rawBody: string, now = Date.now()): Record<string, string> {
  const timestamp = String(Math.floor(now / 1000));
  return { 'Content-Type': 'application/json', 'x-lead-source': source, 'x-lead-timestamp': timestamp,
    'x-lead-signature': signLead(secret, timestamp, rawBody), 'x-idempotency-key': referenceId };
}
