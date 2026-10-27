import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { ENDPOINT, ORIGIN, parseNfcLead, sourcePath, type NfcLead } from '../src/nfc-card/contract.ts';
import { quote } from '../src/nfc-card/commerce.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { formatNfc } from '../src/nfc-card/format.ts';

const payload = () => ({ language: 'uk', product: 'nfc-instagram-card', quantity: 1, customerName: 'Synthetic Instagram QA',
  contact: { phone: '+12025550123', preferredMethod: 'telegram' }, sourcePage: '/nfc-card-website/solutions/instagram-card',
  productSchemaVersion: 1, product_id: 'nfc-instagram-card', sku: 'NFC-IG-READY', offer: 'ready',
  instagramUrl: 'https://www.instagram.com/synthetic_business/', comment: 'Synthetic <comment> & details', consent: true,
  selection: { variant: 'instagram', quantity: '1' } });

test('Instagram accepts the Pages identity, two prices, messengers and four localized source routes', () => {
  for (const language of ['uk', 'en']) for (const route of ['/solutions/instagram-card', '/instagram-card']) {
    for (const quantity of [1, 2]) for (const preferredMethod of ['telegram', 'whatsapp', 'viber']) {
      const sourcePage = '/nfc-card-website' + (language === 'en' ? '/en' : '') + route;
      const lead = parseNfcLead({ ...payload(), language, sourcePage, quantity, contact: { ...payload().contact, preferredMethod }, selection: { variant: 'instagram', quantity: String(quantity) } });
      assert.equal(lead.sourcePage, sourcePage);
      assert.deepEqual(quote(lead), { currency: 'UAH', status: 'fixed', amount: quantity === 1 ? 1500 : 2600, deposit: 200, depositIncluded: true });
      assert.deepEqual(lead.instagram, { productSchemaVersion: 1, product_id: 'nfc-instagram-card', sku: 'NFC-IG-READY', offer: 'ready',
        instagramUrl: payload().instagramUrl, comment: payload().comment, consent: true });
    }
  }
});

for (const [name, patch] of Object.entries({
  schema: { productSchemaVersion: 2 }, missingSchema: { productSchemaVersion: undefined }, productId: { product_id: 'nfc-review-card' },
  sku: { sku: 'NFC-IG-BRANDED' }, offer: { offer: 'branded' }, missingConsent: { consent: undefined }, noConsent: { consent: false }, stringConsent: { consent: 'true' },
  quantity3: { quantity: 3, selection: { variant: 'instagram', quantity: 'more' } }, quantityString: { quantity: '1' },
  missingSelection: { selection: undefined }, mismatch: { selection: { variant: 'instagram', quantity: '2' } },
  brandedSelection: { selection: { variant: 'branded', quantity: '1' } }, standardSelection: { selection: { variant: 'standard', quantity: '1' } },
  consultation: { selection: { variant: 'consultation', quantity: '1' } }, missingProfile: { instagramUrl: undefined },
  price: { price: 1 }, priceUah: { price_uah: 1 }, displayedPrice: { displayed_price: 1 }, forgedQuote: { quote: { amount: 1 } },
  qr: { qr: true }, design: { customDesign: true }, forgedTest: { isTest: true },
  commentLength: { comment: 'a'.repeat(2001) }, commentNormalizationLength: { comment: '\u0344'.repeat(1001) },
  commentType: { comment: null }, commentControl: { comment: 'a\u0000b' }, commentBidi: { comment: 'a\u202eb' },
  missingPhone: { contact: { preferredMethod: 'telegram', telegram: '@synthetic' } }, wrongChannel: { contact: { preferredMethod: 'email', email: 'test@example.invalid' } },
})) test('Instagram rejects ' + name, () => assert.throws(() => parseNfcLead({ ...payload(), ...patch })));

test('Instagram URL parser permits profiles only and canonicalizes without account lookup', () => {
  assert.equal(parseNfcLead({ ...payload(), instagramUrl: 'HTTPS://INSTAGRAM.COM/Synthetic.Business' }).instagram?.instagramUrl, 'https://www.instagram.com/synthetic.business/');
  for (const path of ['p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv']) {
    assert.throws(() => parseNfcLead({ ...payload(), instagramUrl: 'https://www.instagram.com/' + path + '/' }));
  }
  for (const instagramUrl of ['@synthetic', 'http://instagram.com/synthetic/', 'https://instagram.com.evil.invalid/synthetic/',
    'https://user:pass@instagram.com/synthetic/', 'https://instagram.com:443/synthetic/', 'https://instagram.com/synthetic/?x=1',
    'https://instagram.com/synthetic/#profile', 'https://instagram.com/p/123/', 'https://instagram.com/%73ynthetic/',
    'https://instagram.com/.synthetic/', 'https://instagram.com/synthetic./', 'https://instagram.com/syn..thetic/',
    'https://instagram.com/' + 'a'.repeat(31) + '/', 'https://instagram.com/synthetic/\n', 'https://instagram.com/../synthetic/']) {
    assert.throws(() => parseNfcLead({ ...payload(), instagramUrl }), instagramUrl);
  }
  for (const source of ['/nfc-card-website/ua/instagram-card', '/nfc-card-website/en/instagram-card/extra', '/nfc-card-website/solutions/%69nstagram-card', '/nfc-card-website/../instagram-card']) assert.throws(() => sourcePath(source));
});

test('Instagram optional comment has stable omission, bounded multiline Unicode and escaped Telegram values', () => {
  const empty = parseNfcLead({ ...payload(), comment: undefined });
  assert.deepEqual(parseNfcLead({ ...payload(), comment: '  ' }), empty);
  const lead = parseNfcLead({ ...payload(), comment: '  <b>Деталі</b> &\r\nNext line  ' });
  assert.equal(lead.instagram?.comment, '<b>Деталі</b> &\nNext line');
  assert.equal(parseNfcLead({ ...payload(), comment: 'я'.repeat(2000) }).instagram?.comment?.length, 2000);
  const message = formatNfc(lead, randomUUID(), '2026-09-22T12:00:00.000Z');
  for (const value of ['product: nfc-instagram-card', 'sku: NFC-IG-READY', 'offer: ready', 'price: 1500 UAH', 'consent: true',
    'instagram_url: ' + payload().instagramUrl, 'comment: &lt;b&gt;Деталі&lt;/b&gt; &amp;\nNext line']) assert.ok(message.includes(value), value);
  assert.ok(!message.includes('<b>'));
  assert.ok(!formatNfc(empty, randomUUID(), 'now').includes('comment:'));
});

test('Instagram public challenge/intake uses existing CORS, canonical storage and server receipt pricing', async () => {
  const secret = randomBytes(32).toString('hex'), lines: string[] = [], saved: NfcLead[] = [];
  let now = 10000;
  const handler = createNfcHandler({} as Pool, { secret, databaseUrl: '', publicIntake: true, telegramEnabled: false, testOnly: true }, {
    now: () => now, log: line => lines.push(line), save: async (lead, key, enabled) => {
      assert.equal(enabled, false); saved.push(lead);
      return { ok: true, source: 'NFC_CARD', leadId: key, durableSaved: true, notificationStatus: 'disabled' };
    }
  });
  for (const language of ['uk', 'en']) for (const route of ['/solutions/instagram-card', '/instagram-card']) {
    const sourcePage = '/nfc-card-website' + (language === 'en' ? '/en' : '') + route;
    const token = await handler(new Request('http://local' + ENDPOINT + '/challenge?sourcePage=' + encodeURIComponent(sourcePage), { headers: { Origin: ORIGIN } }));
    assert.equal(token?.status, 200); now += 2000;
    const input = { ...payload(), language, quantity: 2, selection: { variant: 'instagram', quantity: '2' }, sourcePage, website: '', challenge: (await token!.json()).challenge };
    const post = (body: unknown, origin = ORIGIN) => handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: {
      Origin: origin, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() }, body: JSON.stringify(body) }));
    const res = await post(input); assert.equal(res?.status, 202); assert.equal((await res!.json()).quote.amount, 2600);
    assert.equal(res!.headers.get('Access-Control-Allow-Origin'), ORIGIN);
    assert.equal(res!.headers.get('Access-Control-Allow-Credentials'), null);
    const rejected = await post({ ...input, price: 1 }); assert.equal(rejected?.status, 422);
    const blocked = await post(input, 'https://evil.invalid'); assert.equal(blocked?.status, 403);
  }
  assert.equal(saved.length, 4);
  for (const sensitive of [secret, payload().customerName, payload().instagramUrl, payload().comment]) assert.ok(!lines.join('').includes(sensitive));
});

test('Instagram maximum accepted fields fit one Telegram message after HTML entity parsing', () => {
  const lead = parseNfcLead({ ...payload(), customerName: '&'.repeat(100), comment: '&'.repeat(2000),
    contact: { preferredMethod: 'telegram', phone: '+123456789012345', email: 'a'.repeat(238) + '@example.invalid', telegram: '@' + 'a'.repeat(32) },
    sourcePage: '/nfc-card-website/en/solutions/instagram-card', instagramUrl: 'https://www.instagram.com/' + 'a'.repeat(30) + '/',
    utm: Object.fromEntries(['source','medium','campaign','term','content'].map(key => [key, '"'.repeat(100)])) });
  const message = formatNfc(lead, randomUUID(), '2026-09-22T12:00:00.000Z', true, true);
  assert.ok(message.replace(/&(amp|lt|gt|quot|#39);/g, 'x').length <= 4096);
  assert.ok(message.includes('comment: ' + '&amp;'.repeat(2000)));
});

test('Review callers retain optional selection and exact legacy NFC formatting without Instagram fields', () => {
  const input = { language: 'en', product: 'review-card', quantity: 2, customerName: 'Synthetic <QA>',
    contact: { preferredMethod: 'email', email: 'QA@EXAMPLE.INVALID' }, sourcePage: '/nfc-card-website/en/order' };
  const lead = parseNfcLead(input);
  assert.equal(lead.selection, undefined); assert.equal(lead.instagram, undefined);
  assert.equal(formatNfc(lead, 'fixture-id', 'fixture-time'), '🆕 Нова заявка — NFC CARD\n\nsource: NFC_CARD\nlead_id: fixture-id\nlanguage: en\nproduct: review-card\nquantity: 2\nprice: 2600 UAH\ncustomer_name: Synthetic &lt;QA&gt;\npreferred_contact: email\nemail: qa@example.invalid\ntimestamp: fixture-time\nsource_page: /nfc-card-website/en/order');
  for (const key of ['productSchemaVersion', 'product_id', 'sku', 'offer', 'instagramUrl', 'comment', 'consent']) {
    assert.throws(() => parseNfcLead({ ...input, [key]: payload()[key as keyof ReturnType<typeof payload>] }));
  }
  assert.throws(() => parseNfcLead({ ...input, selection: { variant: 'instagram', quantity: '2' } }));
  for (const [product, amount] of [['review-card', 2600], ['branded-review-card', 3600]] as const) assert.equal(quote(parseNfcLead({ ...input, product })).amount, amount);
  for (const variant of ['bulk', 'consultation']) assert.equal(quote(parseNfcLead({ ...input, quantity: 3, selection: { variant, quantity: 'more' } })).status, 'custom');
});
