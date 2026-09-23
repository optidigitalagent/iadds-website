import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ENDPOINT, MENU_VARIANTS, ORIGIN, challenge, parseNfcLead, publicMenuURL, sourcePath, type NfcLead } from '../src/nfc-card/contract.ts';
import { quote } from '../src/nfc-card/commerce.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { formatNfc } from '../src/nfc-card/format.ts';

const base = () => ({ language: 'uk', product: 'nfc-menu-card', productSchemaVersion: 1, product_id: 'nfc-menu-card',
  intent: 'card_order', menu_status: 'existing', menu_url: 'https://menu.example.com/guest?branch=1',
  items: [{ variant_id: 'square_100_black', quantity: 1 }], quantity: 1, customerName: 'Synthetic Menu QA',
  contact: { preferredMethod: 'email', email: 'menu-qa@example.invalid' }, sourcePage: '/nfc-card-website/solutions/menu-card',
  consent: true });

test('Menu tiers, mixed rows and duplicate normalization are server authoritative', () => {
  for (const [quantity, unitPrice, amount] of [[1,1000,1000],[4,1000,4000],[5,750,3750],[6,750,4500],[9,750,6750],
    [10,600,6000],[15,600,9000],[24,600,14400],[25,500,12500],[26,500,13000]] as const) {
    const lead = parseNfcLead({ ...base(), quantity, items: [{ variant_id: 'square_100_black', quantity }] });
    assert.deepEqual(quote(lead), { currency: 'UAH', status: 'fixed', quantity, unitPrice, amount, deposit: 200,
      balance: amount - 200, unitPriceKopecks: unitPrice * 100, amountKopecks: amount * 100,
      depositKopecks: 20000, balanceKopecks: (amount - 200) * 100, depositIncluded: true });
  }
  const mixed = parseNfcLead({ ...base(), quantity: 6, items: [
    { variant_id: 'round_70_white', quantity: 2 }, { variant_id: 'square_100_black', quantity: 1 },
    { variant_id: 'square_60_black', quantity: 2 }, { variant_id: 'square_100_black', quantity: 1 }] });
  assert.deepEqual(mixed.menu?.items, [
    { variant_id: 'square_100_black', quantity: 2 }, { variant_id: 'square_60_black', quantity: 2 },
    { variant_id: 'round_70_white', quantity: 2 }]);
  assert.equal(quote(mixed).amount, 4500);
  const formatted = formatNfc(mixed, randomUUID(), '2026-09-22T12:00:00.000Z');
  for (const field of ['intent: card_order', 'unit_price: 750 UAH', 'deposit: 200 UAH', 'balance: 4300 UAH',
    'menu_url: https://menu.example.com/guest?branch=1', 'square_60_black']) assert.ok(formatted.includes(field), field);
});

test('Menu six-variant allowlist, bilingual routes and no selection cross-contamination', () => {
  assert.equal(MENU_VARIANTS.length, 6);
  for (const variant_id of MENU_VARIANTS) for (const language of ['uk', 'en']) for (const route of ['/solutions/menu-card', '/menu-card']) {
    const sourcePage = '/nfc-card-website' + (language === 'en' ? '/en' : '') + route;
    const lead = parseNfcLead({ ...base(), language, sourcePage, items: [{ variant_id, quantity: 1 }] });
    assert.equal(lead.sourcePage, sourcePage); assert.equal(lead.menu?.items[0].variant_id, variant_id);
  }
  for (const bad of ['/nfc-card-website/ua/menu-card', '/nfc-card-website/menu-card/extra', '/nfc-card-website/solutions/%6denu-card']) assert.throws(() => sourcePath(bad));
});

test('Menu consultation has no card quantity, purchase, subtotal, deposit or balance', () => {
  const lead = parseNfcLead({ ...base(), intent: 'menu_consultation', menu_status: 'needs_development',
    menu_url: undefined, items: undefined, quantity: undefined });
  assert.equal(lead.quantity, 0); assert.deepEqual(lead.menu?.items, []);
  assert.deepEqual(quote(lead), { currency: 'UAH', status: 'consultation', quantity: 0, unitPrice: null,
    amount: null, deposit: null, balance: null, unitPriceKopecks: null, amountKopecks: null,
    depositKopecks: null, balanceKopecks: null, depositIncluded: false });
  const msg = formatNfc(lead, randomUUID(), 'now');
  assert.ok(msg.includes('price: consultation only')); assert.ok(!msg.includes('deposit:'));
  assert.ok(!msg.includes('balance:')); assert.ok(!msg.includes('menu_url:'));
});

test('Menu URL validation is syntactic, rejects credentials, private and unsafe destinations', () => {
  assert.equal(publicMenuURL('HTTPS://MENU.EXAMPLE.COM/guest?x=1#/section'), 'https://menu.example.com/guest?x=1#/section');
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'data:text/html,hello', 'http://localhost/menu',
    'http://shop.local/menu', 'http://user:secret@menu.example.com/', 'http://127.0.0.1/', 'http://2130706433/',
    'http://10.0.0.1/', 'http://172.16.0.1/', 'http://192.168.1.1/', 'http://169.254.1.2/',
    'http://[::1]/', 'http://[fc00::1]/', 'https://menu.example.com/\n']) {
    assert.throws(() => publicMenuURL(url), url);
  }
});

test('Menu rejects malformed rows, mismatched quantity, stale URL and browser price tampering', () => {
  const patches = [
    { quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: true }, { quantity: '1' },
    { quantity: Number.NaN }, { quantity: Number.POSITIVE_INFINITY },
    { items: [] }, { items: [{ variant_id: 'unknown', quantity: 1 }] },
    { items: [{ variant_id: 'square_100_black', quantity: 0 }] },
    { items: [{ variant_id: 'square_100_black', quantity: -1 }] },
    { items: [{ variant_id: 'square_100_black', quantity: 1.5 }] },
    { items: [{ variant_id: 'square_100_black', quantity: true }] },
    { items: [{ variant_id: 'square_100_black', quantity: '1' }] },
    { items: [{ variant_id: 'square_100_black', quantity: 2 }] },
    { items: [{ variant_id: 'square_100_black', quantity: 1, price: 1 }] },
    { menu_status: 'needs_development', menu_url: 'https://stale.example.com/menu' },
    { menu_status: 'existing', menu_url: undefined },
    { intent: 'menu_consultation', menu_status: 'existing', quantity: undefined, items: undefined },
    { intent: 'menu_consultation', menu_status: 'needs_development', menu_url: undefined, quantity: 1, items: [] },
    { intent: 'menu_consultation', menu_status: 'needs_development', menu_url: undefined, quantity: undefined, items: [{ variant_id: 'square_100_black', quantity: 1 }] },
    { price: 1 }, { unitPrice: 1 }, { subtotal: 1 }, { quote: { amount: 1 } },
    { selection: { variant: 'instagram', quantity: '1' } }, { consent: false }, { product_id: 'nfc-instagram-card' },
  ];
  for (const patch of patches) assert.throws(() => parseNfcLead({ ...base(), ...patch }), JSON.stringify(patch));
  const noUrl = parseNfcLead({ ...base(), menu_status: 'needs_development', menu_url: undefined });
  assert.equal(noUrl.menu?.menu_url, undefined);
  assert.throws(() => parseNfcLead({ ...base(), comment: 'x'.repeat(1001) }));
  assert.throws(() => parseNfcLead({ ...base(), menu_url: 'https://menu.example.com/' + 'x'.repeat(1000) }));
});

test('Largest accepted Menu message fits one Telegram text after HTML parsing', () => {
  const lead = parseNfcLead({ ...base(), quantity: 6, items: MENU_VARIANTS.map(variant_id => ({ variant_id, quantity: 1 })),
    customerName: '&'.repeat(100), comment: '&'.repeat(1000), menu_url: 'https://menu.example.com/?q=' + '&'.repeat(970),
    contact: { preferredMethod: 'telegram', phone: '+123456789012345', email: 'a'.repeat(238) + '@example.invalid', telegram: '@' + 'a'.repeat(32) },
    utm: Object.fromEntries(['source','medium','campaign','term','content'].map(key => [key, '&'.repeat(100)])) });
  const message = formatNfc(lead, randomUUID(), '2026-09-22T12:00:00.000Z');
  assert.ok(message.replace(/&(amp|lt|gt|quot|#39);/g, 'x').length <= 4096);
});

test('Menu public path uses existing challenge/CORS and returns server quote without sensitive logs', async () => {
  const secret = randomBytes(32).toString('hex'), lines: string[] = [], saved: NfcLead[] = [];
  let now = 10000;
  const handler = createNfcHandler({} as Pool, { secret, databaseUrl: '', publicIntake: true, telegramEnabled: false, testOnly: true }, {
    now: () => now, log: line => lines.push(line), save: async (lead, key) => {
      saved.push(lead); return { ok: true, source: 'NFC_CARD', leadId: key, durableSaved: true, notificationStatus: 'disabled' };
    }
  });
  const token = await handler(new Request('http://local' + ENDPOINT + '/challenge?sourcePage=' + encodeURIComponent(base().sourcePage), { headers: { Origin: ORIGIN } }));
  assert.equal(token?.status, 200); now += 2000;
  const post = (body: unknown, origin = ORIGIN) => handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: {
    Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() }, body: JSON.stringify(body) }));
  const input = { ...base(), website: '', challenge: (await token!.json()).challenge };
  const response = await post(input); assert.equal(response?.status, 202);
  assert.equal((await response!.json()).quote.amount, 1000); assert.equal(saved.length, 1);
  assert.equal((await post({ ...input, price: 1 }))?.status, 422);
  assert.equal((await post(input, 'https://evil.invalid'))?.status, 403);
  for (const sensitive of [secret, input.customerName, input.menu_url]) assert.ok(!lines.join('').includes(sensitive));
});
