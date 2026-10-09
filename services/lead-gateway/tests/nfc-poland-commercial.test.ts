import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { parseNfcLead } from '../src/nfc-card/contract.ts';
import { POLAND_CONTRACT_ID, quote } from '../src/nfc-card/commerce.ts';
import { formatNfc } from '../src/nfc-card/format.ts';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { drain } from '../src/nfc-card/outbox.ts';

const contractPath = new URL('../src/nfc-card/poland-commerce.json', import.meta.url);
const sourcePage = '/nfc-card-website/pl/order';
const base = () => ({ language: 'pl', product: 'review-card', quantity: 1, customerName: 'Synthetic Poland buyer',
  contact: { preferredMethod: 'email', email: 'poland-buyer@example.invalid' }, sourcePage });
const threeD = (quantity: number) => ({ ...base(), product: 'review-card-3d', quantity, productSchemaVersion: 1,
  product_id: 'nfc-review-card-3d', design: 'fixed_shown_design', consent: true });
const instagram = (quantity: 1 | 2) => ({ ...base(), product: 'nfc-instagram-card', quantity,
  productSchemaVersion: 1, product_id: 'nfc-instagram-card', sku: 'NFC-IG-READY', offer: 'ready',
  instagramUrl: 'https://www.instagram.com/synthetic_pl/', consent: true,
  selection: { variant: 'instagram', quantity: String(quantity) },
  contact: { preferredMethod: 'whatsapp', phone: '+48123456789' } });
const menu = (quantities: number[]) => ({ ...base(), product: 'nfc-menu-card', quantity: quantities.reduce((sum, n) => sum + n, 0),
  productSchemaVersion: 1, product_id: 'nfc-menu-card', intent: 'card_order', menu_status: 'existing',
  menu_url: 'https://menu.example.invalid/guest', consent: true,
  items: quantities.map((quantity, i) => ({ variant_id: ['square_100_black', 'square_60_white', 'round_70_black'][i], quantity })) });

test('owner PL contract is an exact-byte source with stable cross-repository identity', async () => {
  const bytes = await readFile(contractPath);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'd890caba44556375a63fc2711888041898c880327c66c803758c4befa9f76a23');
  assert.equal(POLAND_CONTRACT_ID, 'NFC-CARD-PL-2026-09-v28');
});

test('PL pair offers, 3D and Menu use server PLN totals, minor units and one deposit', () => {
  for (const [product, prices] of [
    ['review-card', [129, 219]], ['branded-review-card', [169, 299]],
  ] as const) for (const quantity of [1, 2] as const) {
    const result = quote(parseNfcLead({ ...base(), product, quantity }));
    assert.equal(result.currency, 'PLN'); assert.equal(result.status, 'fixed');
    assert.equal(result.amount, prices[quantity - 1]); assert.equal(result.deposit, 20);
    assert.equal('balance' in result && result.balance, prices[quantity - 1] - 20);
    assert.equal('amountMinor' in result && result.amountMinor, prices[quantity - 1] * 100);
    assert.equal('depositMinor' in result && result.depositMinor, 2000);
    assert.equal('balanceMinor' in result && result.balanceMinor, (prices[quantity - 1] - 20) * 100);
  }
  for (const [quantity, amount] of [[1, 129], [2, 219]] as const) {
    const result = quote(parseNfcLead(instagram(quantity)));
    assert.equal(result.currency, 'PLN'); assert.equal(result.amount, amount); assert.equal(result.deposit, 20);
  }
  for (const quantity of [1, 2, 3, 10000]) {
    const result = quote(parseNfcLead(threeD(quantity)));
    assert.equal(result.currency, 'PLN'); assert.equal(result.amount, quantity * 349);
    assert.equal(result.deposit, 20); assert.equal('balance' in result && result.balance, quantity * 349 - 20);
    assert.equal('unitPriceMinor' in result && result.unitPriceMinor, 34900);
    assert.ok(!('unitPriceKopecks' in result));
  }
  for (const [quantity, unitPrice, amount] of [
    [1,89,89], [4,89,356], [5,69,345], [6,69,414], [9,69,621],
    [10,55,550], [24,55,1320], [25,45,1125], [26,45,1170],
  ]) {
    const result = quote(parseNfcLead(menu([quantity])));
    assert.equal(result.currency, 'PLN'); assert.equal(result.amount, amount); assert.equal(result.deposit, 20);
    assert.equal('unitPrice' in result && result.unitPrice, unitPrice);
    assert.equal('balance' in result && result.balance, amount - 20);
    assert.equal('amountMinor' in result && result.amountMinor, amount * 100);
  }
  assert.equal(quote(parseNfcLead(menu([2, 2, 2]))).amount, 414);
  const consultation = quote(parseNfcLead({ ...menu([]), intent: 'menu_consultation', menu_status: 'needs_development',
    menu_url: undefined, items: undefined, quantity: undefined }));
  assert.equal(consultation.currency, 'PLN'); assert.equal(consultation.status, 'consultation');
  assert.equal(consultation.amount, null); assert.equal(consultation.deposit, null);
  assert.equal('amountMinor' in consultation && consultation.amountMinor, null);
  for (const product of ['review-card', 'branded-review-card'] as const) {
    const custom = quote(parseNfcLead({ ...base(), product, quantity: 3 }));
    assert.equal(custom.currency, 'PLN'); assert.equal(custom.status, 'custom'); assert.equal(custom.amount, null);
  }
});

test('UA/EN contract stays UAH; client currency/price tampering is rejected; PL Telegram uses PLN', () => {
  for (const language of ['uk', 'en'] as const) {
    const result = quote(parseNfcLead({ ...base(), language }));
    assert.deepEqual(result, { currency: 'UAH', status: 'fixed', amount: 1500, deposit: 200, depositIncluded: true });
    assert.equal(quote(parseNfcLead({ ...threeD(2), language })).amount, 8000);
    assert.equal(quote(parseNfcLead({ ...menu([5]), language })).amount, 3750);
  }
  for (const extra of [{ currency: 'UAH' }, { price: 1 }, { amount: 1 }, { deposit: 0 },
    { quote: { currency: 'UAH', amount: 1 } }, { amountMinor: 1 }])
    assert.throws(() => parseNfcLead({ ...base(), ...extra }), JSON.stringify(extra));
  for (const lead of [parseNfcLead(base()), parseNfcLead(instagram(2)), parseNfcLead(threeD(2)), parseNfcLead(menu([6]))]) {
    const result = quote(lead), message = formatNfc(lead, randomUUID(), '2026-09-28T10:00:00.000Z', true, false, result);
    assert.match(message, new RegExp('price: ' + result.amount + ' PLN'));
    assert.doesNotMatch(message, /UAH|kopecks/i);
    if (lead.review3d || lead.menu) { assert.match(message, /deposit: 20 PLN/); assert.match(message, /balance: \d+ PLN/); }
  }
});

test('007 migration preserves a historical PL UAH 3D lead and durable PLN replay',
  { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
    const url = process.env.NFC_TEST_DATABASE_URL!, parsed = new URL(url);
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test'))
      throw new Error('isolated_local_test_database_required');
    const admin = database(url), name = 'nfc_poland_v28_' + randomUUID().replaceAll('-', '') + '_test';
    await admin.query('CREATE DATABASE "' + name + '"');
    const isolated = new URL(url); isolated.pathname = '/' + name;
    const pool = database(isolated.href), previous = [
      '001_nfc_card', '002_public_commerce', '003_instagram_card', '004_menu_card', '005_review_card_3d', '006_polish_locale'];
    try {
      for (const version of previous) await pool.query(await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8'));
      await pool.query('CREATE TABLE nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
      for (const version of previous) {
        const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
        await pool.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)',
          [version, createHash('sha256').update(sql).digest('hex')]);
      }
      const historicalId = randomUUID();
      await pool.query(`INSERT INTO nfc_card.leads(id,lead_id,language,product,quantity,customer_name,email,preferred_contact,
        source_page,utm,idempotency_key,request_digest,price_quote,product_schema_version,product_id,design,consent)
        VALUES($1,$2,'pl','review-card-3d',1,'Historical synthetic PL lead','old@example.invalid','email',
        '/nfc-card-website/pl/order','{}',$3,$4,$5,1,'nfc-review-card-3d','fixed_shown_design',true)`,
      [randomUUID(), historicalId, randomUUID(), 'a'.repeat(64), { currency: 'UAH', status: 'fixed', quantity: 1,
        unitPrice: 4000, amount: 4000, deposit: 200, balance: 3800, depositIncluded: true }]);
      await pool.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES($1,$2,false)', [randomUUID(), historicalId]);
      const before = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [historicalId])).rows[0];
      const oldOutbox = (await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [historicalId])).rows[0];
      assert.equal((await migrate(pool, true)).applied, false);
      assert.equal((await migrate(pool)).version, '010_v33_price_truth');
      const after = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [historicalId])).rows[0];
      assert.deepEqual(Object.fromEntries(Object.keys(before).map(key => [key, after[key]])), before);
      assert.equal(after.solution, null);
      assert.deepEqual((await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [historicalId])).rows[0], oldOutbox);
      for (const raw of [base(), { ...base(), product: 'branded-review-card' }, instagram(2), threeD(2), menu([2, 2, 2])]) {
        const lead = parseNfcLead(raw), key = randomUUID();
        const first = await persist(pool, lead, key, { isTest: true, deliveryEnabled: true });
        const replay = await persist(pool, lead, key, { isTest: true, deliveryEnabled: true });
        assert.deepEqual(replay, first); assert.equal(first.quote?.currency, 'PLN');
        const saved = (await pool.query('SELECT price_quote FROM nfc_card.leads WHERE lead_id=$1', [first.leadId])).rows[0];
        assert.deepEqual(saved.price_quote, first.quote);
        await assert.rejects(persist(pool, { ...lead, customerName: 'Changed synthetic buyer' }, key), /idempotency_conflict/);
        let sends = 0;
        await drain(pool, { telegramEnabled: true, testOnly: false } as never, async message => {
          sends++; assert.match(message, /language: pl/); assert.match(message, /price: \d+ PLN/);
          assert.doesNotMatch(message, /UAH/); return { status: 'sent' };
        }, () => {});
        assert.equal(sends, 1);
      }
      await assert.rejects(pool.query("UPDATE nfc_card.leads SET price_quote=jsonb_set(price_quote,'{amount}','1'::jsonb) WHERE product='review-card-3d' AND language='pl' AND price_quote->>'currency'='PLN'"));
    } finally {
      await pool.end(); await admin.query('DROP DATABASE "' + name + '"'); await admin.end();
    }
  });
