import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ENDPOINT, ORIGIN, challenge, googleLocationURL, parseNfcLead, sourcePath } from '../src/nfc-card/contract.ts';
import { quote } from '../src/nfc-card/commerce.ts';
import { formatNfc } from '../src/nfc-card/format.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';

const input = () => ({ language: 'uk', product: 'review-card-3d', quantity: 1,
  productSchemaVersion: 1, product_id: 'nfc-review-card-3d', design: 'fixed_shown_design',
  google_location_url: 'https://maps.app.goo.gl/ExamplePlace', comment: '<Ready> & confirm location', consent: true,
  customerName: 'Synthetic 3D QA', contact: { preferredMethod: 'email', email: 'review3d@example.invalid' },
  sourcePage: '/nfc-card-website/solutions/review-card-3d', utm: { source: 'qa' } });

test('Review 3D has its own trusted identity, route and fixed server quote for every quantity', () => {
  for (const [quantity, amount, balance] of [[1, 4000, 3800], [2, 8000, 7800], [3, 12000, 11800], [10000, 40000000, 39999800]]) {
    for (const language of ['uk', 'en']) {
      const sourcePage = '/nfc-card-website' + (language === 'en' ? '/en' : '') + '/solutions/review-card-3d';
      const lead = parseNfcLead({ ...input(), language, quantity, sourcePage });
      assert.equal(lead.product, 'review-card-3d'); assert.equal(lead.selection, undefined);
      assert.equal(lead.review3d?.product_id, 'nfc-review-card-3d'); assert.equal(lead.review3d?.design, 'fixed_shown_design');
      assert.equal(sourcePath(sourcePage + '/'), sourcePage);
      assert.deepEqual(quote(lead), { currency: 'UAH', status: 'fixed', quantity, unitPrice: 4000, amount, deposit: 200,
        balance, unitPriceKopecks: 400000, amountKopecks: amount * 100, depositKopecks: 20000,
        balanceKopecks: balance * 100, depositIncluded: true });
      const telegram = formatNfc(lead, randomUUID(), '2026-09-25T10:00:00.000Z');
      for (const part of ['product: review-card-3d', 'product_id: nfc-review-card-3d', 'price: ' + amount + ' UAH',
        'unit_price: 4000 UAH', 'deposit: 200 UAH', 'balance: ' + balance + ' UAH',
        'google_location_url: https://maps.app.goo.gl/ExamplePlace', 'comment: &lt;Ready&gt; &amp; confirm location']) assert.ok(telegram.includes(part), part);
    }
  }
});

test('Review 3D optional Google point validates only syntax and is never fetched', () => {
  const without = parseNfcLead({ ...input(), google_location_url: undefined, comment: undefined });
  assert.equal(without.review3d?.google_location_url, undefined); assert.equal(without.review3d?.comment, undefined);
  for (const url of ['https://www.google.com/maps/place/Test', 'https://g.page/example', 'https://goo.gl/maps/example',
    'https://maps.app.goo.gl/ExamplePlace']) assert.equal(googleLocationURL(url), url);
  for (const url of ['http://maps.app.goo.gl/ExamplePlace', 'https://evil.example/point', 'https://google.com.evil.example/',
    'https://user:pass@google.com/maps', 'https://google.com:444/maps', 'https://google.com:443/maps', 'https://127.0.0.1/',
    'https://google.com/\n', 'javascript:alert(1)', 'https://google.com/' + 'x'.repeat(1000)]) assert.throws(() => googleLocationURL(url), url);
});

test('Review 3D rejects tampered price, cross-product fields and nonpositive or fractional quantity', () => {
  for (const patch of [{ quantity: 0 }, { quantity: -1 }, { quantity: 1.5 }, { quantity: '2' }, { quantity: true },
    { quantity: 10001 }, { price: 1 }, { unitPrice: 1 }, { amount: 1 }, { subtotal: 1 }, { deposit: 0 },
    { balance: 0 }, { quote: { amount: 1 } }, { productSchemaVersion: 2 }, { product_id: 'nfc-review-card' },
    { design: 'custom' }, { consent: false }, { selection: { variant: 'standard', quantity: '1' } },
    { sku: 'NFC-IG-READY' }, { offer: 'ready' }, { instagramUrl: 'https://www.instagram.com/example/' },
    { menu_url: 'https://menu.example.com' }, { intent: 'card_order' }, { items: [] },
    { google_location_url: 'https://evil.example/' }, { comment: 'x'.repeat(1001) }]) {
    assert.throws(() => parseNfcLead({ ...input(), ...patch }), JSON.stringify(patch));
  }
  assert.throws(() => sourcePath('/nfc-card-website/solutions/review-card-3d/extra'));
  assert.throws(() => sourcePath('/nfc-card-website/solutions/%72eview-card-3d'));
  // New fields remain illegal on every pre-existing product.
  for (const product of ['review-card', 'branded-review-card', 'nfc-instagram-card', 'nfc-menu-card']) {
    assert.throws(() => parseNfcLead({ ...input(), product }), product);
  }
});

test('Review 3D public challenge accepts only canonical payload and returns server quote', async () => {
  const secret = randomBytes(32).toString('hex'), key = randomUUID(), now = Date.now(), saved: unknown[] = [], lines: string[] = [];
  const handler = createNfcHandler({} as Pool, { secret, databaseUrl: '', publicIntake: true, telegramEnabled: false, testOnly: true }, {
    now: () => now, log: line => lines.push(line), save: async (lead, savedKey) => { saved.push(lead); assert.equal(savedKey, key);
      return { ok: true, source: 'NFC_CARD', leadId: key, durableSaved: true, notificationStatus: 'disabled' }; }
  });
  const body = { ...input(), quantity: 2, website: '', challenge: challenge(secret, input().sourcePage, now - 3000) };
  const post = (value: unknown) => handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: {
    Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(value) }));
  const response = await post(body); assert.equal(response?.status, 202);
  const receipt = await response!.json(); assert.equal(receipt.quote.amount, 8000); assert.equal(receipt.quote.balance, 7800);
  assert.equal(saved.length, 1); assert.equal((saved[0] as { review3d: { comment: string } }).review3d.comment, body.comment);
  assert.equal((await post({ ...body, price: 1 }))?.status, 422);
  for (const sensitive of [secret, body.customerName, body.comment]) assert.ok(!lines.join('').includes(sensitive));
});
