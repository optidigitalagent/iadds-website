import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createGateway } from '../src/gateway.ts';
import { readConfig } from '../src/config.ts';
import { leadHeaders, signLead, verifyLeadSignature } from '../src/contract.ts';
import { parseLead, type Lead } from '../src/schema.ts';
import { escapeHtml, formatLead } from '../src/format.ts';
import { safeLog } from '../src/logger.ts';
import { telegramSender, DeliveryError } from '../src/telegram.ts';

const secret = randomBytes(32).toString('hex');
const config = () => readConfig({ LEAD_SOURCE_IADDS_SECRET: secret, LEAD_SOURCE_IADDS_LABEL: 'iADDS' });
const valid = (): Lead => ({ referenceId: randomUUID(), submittedAt: new Date().toISOString(), fullName: 'Test Lead', company: 'iADDS QA',
  role: '', email: 'test@example.com', contactMethod: '', companyUrl: 'https://example.com', selectedService: 'ai-video-ads',
  message: 'Backend delivery test — no response required', communicationLanguage: 'uk', currentLocale: 'uk',
  sourcePage: '/uk/services/ai-video-ads', collaborationModel: 'production', consent: true });
const request = (lead: unknown = valid(), headers: Record<string, string> = {}, time = Date.now()) => {
  const raw = JSON.stringify(lead); const key = (lead as Lead).referenceId;
  return new Request('https://gateway.example/v1/leads', { method: 'POST', headers: { ...leadHeaders(secret, 'iadds', key, raw, time), ...headers }, body: raw });
};
const quiet = () => {};
test('health has no env details and sends nothing', async () => {
  let sent = 0; const handle = createGateway(config(), { send: async () => ++sent, log: quiet });
  assert.deepEqual(await (await handle(new Request('https://gateway.example/healthz'))).json(), { ok: true, service: 'antonov-lead-gateway' });
  assert.equal(sent, 0);
});
test('valid payload delivers once with source and reference', async () => {
  const messages: string[] = []; const lead = valid(); const handle = createGateway(config(), { send: async text => { messages.push(text); return 0; }, log: quiet });
  assert.deepEqual(await (await handle(request(lead))).json(), { ok: true, referenceId: lead.referenceId });
  assert.equal(messages.length, 1); assert.match(messages[0], /^🧪 TEST — iADDS lead delivery/); assert.ok(messages[0].includes(lead.referenceId));
});
for (const [name, changes] of Object.entries({
  missingRequired: { fullName: undefined }, invalidEmail: { email: 'invalid' }, invalidUrl: { companyUrl: 'javascript:alert(1)' },
  credentialsInUrl: { companyUrl: 'https://user:pass@example.com' }, unknownService: { selectedService: 'unknown' },
  unknownField: { source: 'injected' }, honeypot: { companyFax: 'spam' }, wrongLocale: { currentLocale: 'fr' },
  wrongLanguage: { communicationLanguage: 'fr' }, wrongModel: { collaborationModel: 'arbitrary' }, wrongConsent: { consent: 'true' },
  longMessage: { message: 'a'.repeat(1501) }, unsafeSourcePage: { sourcePage: '/uk?email=private' }, invalidDate: { submittedAt: 'yesterday' },
})) test(`schema rejects ${name}`, async () => {
  let sent = false; const handle = createGateway(config(), { send: async () => { sent = true; return 0; }, log: quiet });
  assert.equal((await handle(request({ ...valid(), ...changes }))).status, 400); assert.equal(sent, false);
});
test('optional fields may be omitted and strings are trimmed', () => {
  const lead = valid(); const parsed = parseLead({ ...lead, fullName: '  Test Lead ', role: undefined, contactMethod: undefined, collaborationModel: undefined }, config().sources.get('iadds')!);
  assert.ok(parsed); assert.equal(parsed.fullName, 'Test Lead'); assert.equal(parsed.role, ''); assert.equal(parsed.contactMethod, '');
  const formatted = formatLead(parsed, 'iADDS').join('\n'); assert.ok(!formatted.includes('Роль:')); assert.ok(!formatted.includes('Telegram / телефон:'));
});
for (const [name, headers] of Object.entries<Record<string, string>>({ unknownSource: { 'x-lead-source': 'unknown' }, malformedSource: { 'x-lead-source': '../iadds' },
  missingSignature: { 'x-lead-signature': '' }, wrongSignature: { 'x-lead-signature': '0'.repeat(64) },
  uppercaseSignature: { 'x-lead-signature': 'A'.repeat(64) }, missingTime: { 'x-lead-timestamp': '' },
})) test(`authentication rejects ${name}`, async () => {
  assert.equal((await createGateway(config(), { log: quiet })(request(valid(), headers))).status, 401);
});
for (const offset of [-301, 301]) test(`timestamp skew ${offset} is rejected`, async () => {
  assert.equal((await createGateway(config(), { log: quiet })(request(valid(), {}, Date.now() + offset * 1000))).status, 408);
});
test('HMAC binds timestamp and exact raw body; signature agrees with independent crypto', () => {
  const timestamp = '1789190000', raw = '{"a":1}'; const signature = signLead(secret, timestamp, raw);
  assert.equal(signature.length, 64); assert.ok(verifyLeadSignature(secret, timestamp, Buffer.from(raw), signature));
  assert.equal(verifyLeadSignature(secret, timestamp, Buffer.from('{ "a":1}'), signature), false);
  assert.equal(verifyLeadSignature(secret, '1789190001', Buffer.from(raw), signature), false);
});
test('body >32KB rejected with and without content-length', async () => {
  const handle = createGateway(config(), { log: quiet }); const lead = { ...valid(), message: 'a'.repeat(33_000) };
  assert.equal((await handle(request(lead))).status, 413);
  assert.equal((await handle(request(lead, { 'content-length': '33000' }))).status, 413);
});
test('wrong method/media and public debug endpoint denied', async () => {
  const handle = createGateway(config(), { log: quiet });
  assert.equal((await handle(request(valid(), { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await handle(new Request('https://gateway.example/v1/leads'))).status, 405);
  assert.equal((await handle(new Request('https://gateway.example/debug'))).status, 404);
});
test('duplicate/concurrent key sends once; changed payload conflicts', async () => {
  let sent = 0; const lead = valid(); const handle = createGateway(config(), { send: async () => { await new Promise(resolve => setTimeout(resolve, 10)); sent++; return 0; }, log: quiet });
  const results = await Promise.all([handle(request(lead)), handle(request(lead))]);
  assert.ok(results.every(result => result.status === 200)); assert.equal(sent, 1);
  assert.equal((await handle(request({ ...lead, submittedAt: new Date(Date.now() + 1000).toISOString() }))).status, 200); assert.equal(sent, 1);
  assert.equal((await handle(request({ ...lead, company: 'Changed' }))).status, 409);
  assert.equal((await handle(request(lead, { 'x-idempotency-key': randomUUID() }))).status, 400);
});
test('expired key reprocesses, cache capacity is bounded, successful key is not evicted early', async () => {
  let time = Date.now(), sent = 0; const settings = { ...config(), idempotencyTtlMs: 1000, maxEntries: 1 };
  const handle = createGateway(settings, { now: () => time, send: async () => ++sent, log: quiet }); const lead = valid();
  assert.equal((await handle(request(lead))).status, 200);
  assert.equal((await handle(request(valid()))).status, 503);
  assert.equal((await handle(request(lead))).status, 200); assert.equal(sent, 1);
  time += 1001; assert.equal((await handle(request(lead, {}, time))).status, 200); assert.equal(sent, 2);
});
test('source rate limit returns Retry-After and resets', async () => {
  let time = Date.now(); const handle = createGateway({ ...config(), requestsPerMinute: 1 }, { now: () => time, send: async () => 0, log: quiet });
  assert.equal((await handle(request())).status, 200);
  const limited = await handle(request()); assert.equal(limited.status, 429); assert.ok(Number(limited.headers.get('retry-after')) > 0);
  time += 60_001; assert.equal((await handle(request(valid(), {}, time))).status, 200);
});
test('second source has independent secret and trusted label, payload cannot override source', async () => {
  const otherSecret = randomBytes(32).toString('hex'); const settings = readConfig({ LEAD_SOURCE_IADDS_SECRET: secret,
    LEAD_SOURCE_SECOND_SITE_SECRET: otherSecret, LEAD_SOURCE_SECOND_SITE_LABEL: 'Second website', LEAD_SOURCE_SECOND_SITE_SERVICES: 'booking' });
  const messages: string[] = []; const handle = createGateway(settings, { send: async text => { messages.push(text); return 0; }, log: quiet });
  const lead = { ...valid(), selectedService: 'booking', projectName: 'Untrusted label' }, raw = JSON.stringify(lead);
  const make = (signingSecret: string) => new Request('https://gateway.example/v1/leads', { method: 'POST', body: raw, headers: leadHeaders(signingSecret, 'second-site', lead.referenceId, raw) });
  assert.equal((await handle(make(secret))).status, 401); assert.equal((await handle(make(otherSecret))).status, 200);
  assert.ok(messages[0].includes('Second website')); assert.ok(!messages[0].includes('Untrusted label'));
});
test('HTML escaping and long messages preserve text without markup injection', () => {
  assert.equal(escapeHtml('<a>&"\''), '&lt;a&gt;&amp;&quot;&#39;');
  const lead = { ...valid(), fullName: '<b>Owner</b>', message: '<&>'.repeat(500), company: '&'.repeat(120), role: '&'.repeat(100), contactMethod: '&'.repeat(80) };
  const parts = formatLead(lead, '<&>'.repeat(26)); assert.ok(parts.length > 1);
  for (const part of parts) { assert.ok(part.length < 4096); assert.ok(part.includes(lead.referenceId)); assert.ok(!part.includes('<b>')); }
  assert.ok(parts[0].includes('Email:'));
});
test('partial delivery retries only unconfirmed parts and never reports false success', async () => {
  const lead = { ...valid(), message: '<'.repeat(1500) }; let calls = 0;
  const handle = createGateway(config(), { send: async () => { calls++; if (calls === 2) throw new DeliveryError(502, 'upstream'); return 0; }, log: quiet });
  const failed = await handle(request(lead)); assert.equal(failed.status, 502); assert.equal((await failed.json()).ok, undefined);
  assert.equal((await handle(request(lead))).status, 200);
  assert.equal(calls, formatLead(lead, 'iADDS').length + 1);
});
test('allowlist logger removes secrets, PII, exception details and request data', () => {
  const lines: string[] = []; const lead = valid();
  safeLog({ ...lead, source: 'iadds', status: 502, category: 'network', token: secret, signature: secret, chatId: 'private', error: new Error(secret), body: lead }, line => lines.push(line));
  const parsed = JSON.parse(lines[0]); assert.deepEqual(Object.keys(parsed).sort(), ['category', 'referenceId', 'source', 'status', 'timestamp']);
  assert.ok(!lines[0].includes(secret)); assert.ok(!lines[0].includes(lead.email)); assert.ok(!lines[0].includes(lead.fullName));
});
test('missing configuration and unexpected exceptions are redacted', async () => {
  const lines: string[] = []; const handle = createGateway(config(), { log: line => lines.push(line) });
  const response = await handle(request()); assert.equal(response.status, 503); assert.deepEqual(await response.json(), { code: 'unavailable' });
  const broken = createGateway(config(), { send: async () => { throw new Error(secret); }, log: line => lines.push(line) });
  const result = await broken(request()); assert.equal(result.status, 500); assert.ok(!(await result.text()).includes(secret)); assert.ok(!lines.join('').includes(secret));
});

const telegramConfig = () => ({ ...config(), token: 'fake-token-for-unit-tests', chatId: '1234' });
const confirmed = () => Response.json({ ok: true, result: { message_id: 42, chat: { id: 1234 } } });
test('Telegram success checks message ID and expected chat, safe HTML and no previews', async () => {
  let options: RequestInit | undefined;
  const send = telegramSender(telegramConfig(), { transport: async (_url, init) => { options = init; return confirmed(); } });
  assert.equal(await send('Safe message', Date.now() + 10000), 0);
  const payload = JSON.parse(String(options?.body)); assert.equal(payload.parse_mode, 'HTML'); assert.deepEqual(payload.link_preview_options, { is_disabled: true });
  assert.equal(options?.redirect, 'error'); assert.ok(options?.signal);
});
for (const status of [400, 401, 403]) test(`Telegram ${status} does not retry and maps to configuration`, async () => {
  let calls = 0; const send = telegramSender(telegramConfig(), { transport: async () => { calls++; return Response.json({ ok: false, error_code: status, description: secret }, { status }); } });
  await assert.rejects(() => send('test', Date.now() + 10000), (error: DeliveryError) => error.status === 503 && error.category === 'configuration' && !error.message.includes(secret)); assert.equal(calls, 1);
});
for (const status of [429, 500]) test(`Telegram ${status} retries within budget`, async () => {
  let calls = 0; const delays: number[] = [];
  const send = telegramSender(telegramConfig(), { transport: async () => ++calls === 1 ? Response.json({ ok: false, error_code: status, parameters: { retry_after: 1 } }, { status }) : confirmed(),
    sleep: async ms => { delays.push(ms); }, random: () => 0 });
  assert.equal(await send('test', Date.now() + 10000), 1); assert.equal(calls, 2); assert.equal(delays[0], status === 429 ? 1000 : 150);
});
test('network timeout retries are bounded and errors do not disclose token', async () => {
  let calls = 0;
  const send = telegramSender(telegramConfig(), { transport: async () => { calls++; throw new Error(`timeout ${secret}`); }, sleep: async () => {} });
  await assert.rejects(() => send('test', Date.now() + 10000), (error: DeliveryError) => error.status === 502 && error.retries === 2 && !error.message.includes(secret)); assert.equal(calls, 3);
});
test('long retry_after does not exceed total timeout budget', async () => {
  let calls = 0; const send = telegramSender(telegramConfig(), { transport: async () => { calls++; return Response.json({ ok: false, error_code: 429, parameters: { retry_after: 600 } }, { status: 429 }); } });
  await assert.rejects(() => send('test', Date.now() + 10000), /rate_limit/); assert.equal(calls, 1);
});
for (const result of [{ ok: true }, { ok: true, result: { message_id: 1, chat: { id: 999 } } }, { ok: false }]) test('malformed Telegram success never confirms delivery', async () => {
  const send = telegramSender(telegramConfig(), { transport: async () => Response.json(result) });
  await assert.rejects(() => send('test', Date.now() + 10000), /invalid_response/);
});
