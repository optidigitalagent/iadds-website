import { UUID } from './contract.ts';
const categories = new Set(['accepted', 'database', 'sent', 'retry', 'failed', 'outcome_unknown', 'configuration', 'rate_limit', 'invalid_payload', 'shutdown']);
export function nfcLog(input: Record<string, unknown>, sink: (line: string) => void = console.log): void {
  const output: Record<string, unknown> = { timestamp: new Date().toISOString(), source: 'NFC_CARD' };
  if (typeof input.leadId === 'string' && UUID.test(input.leadId)) output.leadId = input.leadId;
  if (typeof input.category === 'string' && categories.has(input.category)) output.category = input.category;
  for (const key of ['status', 'retryCount', 'latency']) if (typeof input[key] === 'number' && Number.isFinite(input[key])) output[key] = input[key];
  sink(JSON.stringify(output));
}
