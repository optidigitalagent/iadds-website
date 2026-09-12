import { referencePattern } from './contract.ts';

const categories = new Set(['delivered', 'configuration', 'rate_limit', 'upstream', 'network', 'invalid_response', 'internal']);
// Allowlist serialization: error objects, request bodies, headers and arbitrary strings never reach stdout.
export function safeLog(input: Record<string, unknown>, sink: (line: string) => void = console.log): void {
  const output: Record<string, string | number> = { timestamp: new Date().toISOString() };
  if (typeof input.referenceId === 'string' && referencePattern.test(input.referenceId)) output.referenceId = input.referenceId;
  if (typeof input.source === 'string' && /^[a-z][a-z0-9-]{0,63}$/.test(input.source)) output.source = input.source;
  if (typeof input.category === 'string' && categories.has(input.category)) output.category = input.category;
  for (const key of ['status', 'latency', 'retryCount']) if (typeof input[key] === 'number' && Number.isFinite(input[key])) output[key] = input[key];
  sink(JSON.stringify(output));
}
