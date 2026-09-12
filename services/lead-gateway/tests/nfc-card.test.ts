import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ENDPOINT, ORIGIN, challenge, parseNfcLead, sourcePath, verifyChallenge } from '../src/nfc-card/contract.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { readNfcConfig, type NfcConfig } from '../src/nfc-card/config.ts';
import { formatNfc } from '../src/nfc-card/format.ts';
import { nfcLog } from '../src/nfc-card/logger.ts';
import { readConfig } from '../src/config.ts';
import { createGateway } from '../src/gateway.ts';
import { nfcTelegram } from '../src/nfc-card/telegram.ts';
const secret = randomBytes(32).toString('hex');
export const payload = () => ({ language: 'uk', product: 'review-card', quantity: 1, customerName: 'Synthetic <QA>',
  contact: { phone: '+1 (202) 555-0123', preferredMethod: 'phone' }, sourcePage: '/nfc-card-website/order', utm: { source: 'test' } });
const config: NfcConfig = { secret, databaseUrl: '', telegramEnabled: false, publicIntake: true, testOnly: true };
const noPool = {} as Pool;
const quiet = () => {};
test('NFC normalizes contacts/path and keeps actual product IDs', () => {
  const p = parseNfcLead({ ...payload(), sourcePage: '/nfc-card-website/order?variant=standard#form' });
  assert.equal(p.contact.phone, '+12025550123'); assert.equal(p.sourcePage, '/nfc-card-website/order');
  assert.equal(sourcePath('/nfc-card-website/'), '/nfc-card-website/');
  assert.equal(parseNfcLead({ ...payload(), product: 'branded-review-card' }).product, 'branded-review-card');
});
for (const [name, patch] of Object.entries({ language: { language: 'ru' }, product: { product: 'arbitrary' }, zero: { quantity: 0 }, negative: { quantity: -1 }, fractional: { quantity: 1.5 }, string: { quantity: '1' }, huge: { quantity: 10001 }, name: { customerName: '' }, controls: { customerName: 'a\nb' }, source: { source: 'iadds' }, leadId: { leadId: randomUUID() }, price: { price: 1 }, timestamp: { timestamp: new Date().toISOString() }, badPage: { sourcePage: '/iadds/' }, escapedPage: { sourcePage: '/nfc-card-website/%2e%2e/order' }, duplicateSlash: { sourcePage: '//nfc-card-website/order' }, utm: { utm: { token: 'forbidden' } }, longUtm: { utm: { source: 'a'.repeat(101) } }, noContact: { contact: { preferredMethod: 'phone' } }, missingEmail: { contact: { phone: '2025550123', preferredMethod: 'email' } }, badEmail: { contact: { email: 'a@bad', preferredMethod: 'email' } }, badPhone: { contact: { phone: 'not-a-phone', preferredMethod: 'phone' } }, badTelegram: { contact: { telegram: '<tag>', preferredMethod: 'telegram' } } })) {
  test('NFC rejects ' + name, () => assert.throws(() => parseNfcLead({ ...payload(), ...patch })));
}
test('NFC contact method requirements and optional omissions', () => {
  for (const method of ['phone', 'sms', 'whatsapp', 'viber']) assert.equal(parseNfcLead({ ...payload(), contact: { phone: '+12025550123', preferredMethod: method } }).contact.preferredMethod, method);
  const lead = parseNfcLead({ ...payload(), contact: { preferredMethod: 'email', email: ' QA@EXAMPLE.INVALID ' } });
  assert.equal(lead.contact.email, 'qa@example.invalid'); assert.equal(lead.contact.phone, undefined);
});
test('challenge enforces age, signature and exact path without client secret', () => {
  const path = '/nfc-card-website/order', t = challenge(secret, path, 10000);
  verifyChallenge(secret, t, path, 12000);
  for (const at of [9999, 11999, 1810001]) assert.throws(() => verifyChallenge(secret, t, path, at));
  assert.throws(() => verifyChallenge(secret, t, path + '/bad', 12000));
  assert.throws(() => verifyChallenge('other-secret', t, path, 12000));
  assert.throws(() => verifyChallenge(secret, 'bad', path, 12000));
  assert.ok(!t.includes(secret));
});
test('NFC reserved source does not fall into legacy direct Telegram lane', async () => {
  const legacy = readConfig({ LEAD_SOURCE_IADDS_SECRET: secret, LEAD_SOURCE_NFC_CARD_SECRET: secret });
  assert.deepEqual([...legacy.sources.keys()], ['iadds']);
  let sends = 0; const gateway = createGateway(legacy, { send: async () => { sends++; return 0; }, log: quiet });
  for (const source of ['NFC_CARD', 'nfc-card']) assert.equal((await gateway(new Request('http://local/v1/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lead-source': source }, body: '{}' }))).status, 401);
  assert.equal(sends, 0);
});
test('NFC config fails closed and protects iADDS secrets', () => {
  assert.equal(readNfcConfig({}), undefined);
  const env = { LEAD_SOURCE_NFC_CARD_SECRET: secret, LEAD_SOURCE_NFC_CARD_LABEL: 'NFC CARD', NFC_DATABASE_URL: 'postgres://local/test' };
  assert.equal(readNfcConfig(env)!.telegramEnabled, false);
  assert.throws(() => readNfcConfig({ ...env, LEAD_SOURCE_IADDS_SECRET: secret }));
  assert.throws(() => readNfcConfig({ ...env, NFC_TELEGRAM_ENABLED: 'true' }));
  assert.throws(() => readNfcConfig({ ...env, NODE_ENV: 'production' }));
});
test('CORS permits exact origin/preflight; blocks missing, hostile origin and secret headers', async () => {
  const handler = createNfcHandler(noPool, config, { log: quiet });
  for (const origin of ['', 'https://evil.invalid', ORIGIN + '.evil.invalid']) {
    const res = await handler(new Request('http://local' + ENDPOINT, { method: 'OPTIONS', headers: { Origin: origin } }));
    assert.equal(res!.status, 403); assert.equal(res!.headers.get('Access-Control-Allow-Origin'), null);
  }
  const request = (headers: Record<string, string>) => new Request('http://local' + ENDPOINT, { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST', ...headers } });
  const res = await handler(request({ 'Access-Control-Request-Headers': 'content-type,idempotency-key' }));
  assert.equal(res!.status, 204); assert.equal(res!.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.equal(res!.headers.get('Access-Control-Allow-Credentials'), null);
  assert.equal((await handler(request({ 'Access-Control-Request-Headers': 'authorization' })))!.status, 403);
});
test('public validated intake, honeypot, duplicate key, safe storage failure and no PII logs', async () => {
  let saves = 0, fail = false; const lines: string[] = [], now = 12000, id = randomUUID();
  const handler = createNfcHandler(noPool, config, { now: () => now, log: s => lines.push(s), save: async (_, key, enabled) => {
    assert.equal(key, id); assert.equal(enabled, false); saves++; if (fail) throw new Error('token PII must not leak');
    return { ok: true, source: 'NFC_CARD', leadId: id, durableSaved: true, notificationStatus: 'disabled' };
  } });
  const input = { ...payload(), website: '', challenge: challenge(secret, payload().sourcePage, 10000) };
  const post = (data: unknown) => handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': id }, body: JSON.stringify(data) }));
  assert.equal((await post(input))!.status, 202);
  assert.equal((await post({ ...input, website: 'bot' }))!.status, 422); assert.equal(saves, 1);
  fail = true; const failure = await post(input); assert.equal(failure!.status, 503); assert.equal((await failure!.json()).code, 'storage_unavailable');
  assert.ok(!lines.join().includes('Synthetic')); assert.ok(!lines.join().includes('202555')); assert.ok(!lines.join().includes(secret));
});
test('public preview disabled makes no storage or delivery call', async () => {
  const handler = createNfcHandler(noPool, { ...config, publicIntake: false }, { log: quiet, save: async () => { throw new Error('must not call'); } });
  const res = await handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: { Origin: ORIGIN } }));
  assert.equal(res!.status, 503); assert.equal((await res!.json()).code, 'preview_intake_disabled');
});
test('public rate limiting cannot be evaded by rotated proxy headers', async () => {
  let now = 12000; const handler = createNfcHandler(noPool, config, { now: () => now, log: quiet });
  for (let i = 0; i < 120; i++) assert.equal((await handler(new Request('http://local' + ENDPOINT + '/challenge?sourcePage=/nfc-card-website/order', { headers: { Origin: ORIGIN, 'x-forwarded-for': String(i) } })))!.status, 200);
  assert.equal((await handler(new Request('http://local' + ENDPOINT + '/challenge', { headers: { Origin: ORIGIN, 'x-forwarded-for': 'new' } })))!.status, 429);
  now += 60001;
  assert.equal((await handler(new Request('http://local' + ENDPOINT + '/challenge?sourcePage=/nfc-card-website/order', { headers: { Origin: ORIGIN } })))!.status, 200);
});
test('signed NFC HMAC lane is separate and never accepts iADDS source secret', async () => {
  const now = Date.now(), at = String(Math.floor(now / 1000)), data = JSON.stringify(payload()), key = randomUUID();
  let saves = 0;
  const handler = createNfcHandler(noPool, config, { now: () => now, log: quiet, save: async () => { saves++; return { ok: true, source: 'NFC_CARD', leadId: key, durableSaved: true, notificationStatus: 'disabled' }; } });
  for (const signing of [randomBytes(32).toString('hex'), secret]) {
    const sig = createHmac('sha256', signing).update(at + '.NFC_CARD.' + key + '.' + data).digest('hex');
    const response = await handler(new Request('http://local/v1/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lead-source': 'NFC_CARD', 'x-lead-timestamp': at, 'x-lead-signature': sig, 'x-idempotency-key': key }, body: data }));
    assert.equal(response!.status, signing === secret ? 202 : 401);
    const replay = await handler(new Request('http://local/v1/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-lead-source': 'NFC_CARD', 'x-lead-timestamp': at, 'x-lead-signature': sig, 'x-idempotency-key': randomUUID() }, body: data }));
    assert.equal(replay!.status, 401);
  }
  assert.equal(saves, 1);
});
test('NFC streamed oversize request is rejected before storage', async () => {
  const handler = createNfcHandler(noPool, config, { log: quiet });
  const response = await handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() }, body: 'x'.repeat(16385) }));
  assert.equal(response!.status, 413);
});
test('NFC formatter escapes HTML and omits empty contacts, fits a single message', () => {
  const text = formatNfc(parseNfcLead(payload()), randomUUID(), new Date().toISOString(), true);
  assert.ok(text.startsWith('🧪 TEST — NFC CARD')); assert.ok(text.includes('source: NFC_CARD')); assert.ok(text.includes('&lt;QA&gt;'));
  assert.ok(!text.includes('email:')); assert.ok(!text.includes('<QA>')); assert.ok(text.length < 4096);
});
test('NFC log allowlist drops arbitrary PII and unsafe error values', () => {
  const lines: string[] = []; nfcLog({ leadId: 'person@example.invalid', customerName: 'PERSON', token: secret, category: secret, status: 503 }, x => lines.push(x));
  assert.ok(!lines[0].includes(secret)); assert.ok(!lines[0].includes('PERSON')); assert.ok(!lines[0].includes('@'));
});
test('NFC Telegram transport retries only confirmed rejection and never ambiguous delivery', async () => {
  const cfg = readConfig({}); cfg.token = 'synthetic'; cfg.chatId = 'synthetic';
  let calls = 0;
  const uncertain = nfcTelegram(cfg, async () => { calls++; throw new Error('secret URL'); });
  assert.deepEqual(await uncertain('test'), { status: 'failed', category: 'outcome_unknown' }); assert.equal(calls, 1);
  const limited = nfcTelegram(cfg, async () => Response.json({ ok: false, error_code: 429, parameters: { retry_after: 10 } }));
  assert.deepEqual(await limited('test'), { status: 'retry', category: 'rate_limit', retryAfter: 10 });
  const success = nfcTelegram(cfg, async (_, options) => { assert.ok(JSON.parse(String(options?.body)).text); return Response.json({ ok: true, result: { message_id: 1, chat: { id: 'synthetic' } } }); });
  assert.deepEqual(await success('test'), { status: 'sent' });
});

test('NFC commerce intent preserves 3+ and consultation without trusting a price', async () => {
  const { quote } = await import('../src/nfc-card/commerce.ts');
  for (const [product, expected] of [['review-card',[1500,2600]],['branded-review-card',[2000,3600]]] as const) {
    for (const quantity of [1,2]) assert.equal(quote(parseNfcLead({...payload(),product,quantity})).amount,expected[quantity-1]);
  }
  for (const variant of ['standard','branded','bulk','consultation']) {
    const input = {...payload(),product:variant==='branded'?'branded-review-card':'review-card',quantity:3,selection:{variant,quantity:'more'}};
    const lead = parseNfcLead(input); assert.equal(quote(lead).status,'custom');
    const message = formatNfc(lead,randomUUID(),new Date().toISOString());assert.ok(message.includes('quantity: 3+'));
    if(['bulk','consultation'].includes(variant))assert.ok(message.includes('product: '+variant));
    for (const patch of [{quantity:2},{selection:{variant:'branded',quantity:'1'}},{price:1},{isFinalTest:true}])
      assert.throws(()=>parseNfcLead({...input,...patch}));
  }
  assert.equal(quote(parseNfcLead({...payload(),selection:{variant:'consultation',quantity:'1'}})).amount,null);
});
test('NFC PUBLIC operational flags validate without touching the legacy source', () => {
  const env={LEAD_SOURCE_NFC_CARD_SECRET:secret,LEAD_SOURCE_NFC_CARD_LABEL:'NFC CARD',NFC_DATABASE_URL:'postgres://local/test',NFC_TELEGRAM_MODE:'live',NFC_TELEGRAM_ENABLED:'true',NFC_PUBLIC_INTAKE_ENABLED:'true',NFC_FINAL_TEST_KEY:randomUUID()};
  assert.equal(readNfcConfig(env)?.finalTestKey,env.NFC_FINAL_TEST_KEY);
  assert.throws(()=>readNfcConfig({...env,NFC_FINAL_TEST_KEY:'invalid'}));
  assert.ok(formatNfc(parseNfcLead(payload()),randomUUID(),new Date().toISOString(),true,true).startsWith('🧪 FINAL TEST — NFC CARD'));
  assert.ok(formatNfc(parseNfcLead(payload()),randomUUID(),new Date().toISOString(),false,true).startsWith('🆕 Нова заявка'));
});
