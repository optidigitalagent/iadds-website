import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Pool } from 'pg';
import { challenge, ENDPOINT, ORIGIN, parseNfcLead, type MiniSolution } from '../src/nfc-card/contract.ts';
import { MINI_CONTRACT_ID, quote } from '../src/nfc-card/commerce.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { formatNfc } from '../src/nfc-card/format.ts';
import { drain } from '../src/nfc-card/outbox.ts';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import type { NfcConfig } from '../src/nfc-card/config.ts';
import priceContract from '../src/nfc-card/mini-price-contract.json' with { type: 'json' };

const solutions = {
  'beauty-review-card': ['beauty', 'ready', 'standard'],
  'branded-beauty-review-card': ['beauty', 'branded', 'branded'],
  'restaurant-review-card': ['restaurant', 'ready', 'standard'],
  'branded-restaurant-review-card': ['restaurant', 'branded', 'branded'],
} as const;
type Id = keyof typeof solutions;
type Mode = MiniSolution['quantity_mode'];
const input = (id: Id, language: 'uk' | 'en' | 'pl', mode: Mode, count?: number) => {
  const [niche, design_mode, variant] = solutions[id];
  return { language, product: 'nfc-review-card-mini', ...(count === undefined ? {} : { quantity: count }),
    customerName: 'Synthetic Mini <QA>', contact: { preferredMethod: 'email', email: 'mini-qa@example.invalid' },
    sourcePage: '/nfc-card-website' + (language === 'uk' ? '' : '/' + language) + '/solutions/' + id,
    selection: { variant, quantity: mode === 'advice' ? 'advice' : mode === 'free_design_concepts' ? 'concepts' :
      [1, 2, 4, 10].includes(count ?? 0) ? String(count) : 'other' },
    solution: { schemaVersion: 2, product_family: 'nfc-review-card-mini', solution_id: id,
      niche, design_mode, quantity_mode: mode },
  };
};

test('Mini v31 exact UA/EN packs use contract values and one deferred order deposit', () => {
  assert.equal(MINI_CONTRACT_ID, 'NFC-CARD-BEAUTY-RESTAURANT-MINI-PRICE-v31');
  assert.deepEqual(priceContract.UA.readyMini.bundles, {
    '1': { unitPrice: 900, total: 900 }, '2': { unitPrice: 720, total: 1440 },
    '4': { unitPrice: 650, total: 2600 }, '10': { unitPrice: 440, total: 4400 },
  });
  assert.deepEqual(priceContract.UA.brandedMini.bundles, {
    '1': { unitPrice: 900, total: 900 }, '2': { unitPrice: 900, total: 1800 },
    '4': { unitPrice: 750, total: 3000 }, '10': { unitPrice: 500, total: 5000 },
  });
  for (const id of Object.keys(solutions) as Id[]) for (const language of ['uk', 'en'] as const) {
    const bundles = solutions[id][1] === 'ready' ? priceContract.UA.readyMini.bundles : priceContract.UA.brandedMini.bundles;
    for (const count of [1, 2, 4, 10] as const) {
      const lead = parseNfcLead(input(id, language, 'fixed_bundle', count));
      const quoted = quote(lead), expected = bundles[String(count) as keyof typeof bundles];
      assert.equal(quoted.currency, 'UAH'); assert.equal(quoted.status, 'fixed');
      assert.equal(quoted.unitPrice, expected.unitPrice); assert.equal(quoted.amount, expected.total);
      assert.equal(quoted.deposit, 200); assert.equal(quoted.depositIncluded, true);
      assert.equal(quoted.depositDueNow, false);
      assert.equal(quoted.balance, expected.total - 200);
      const message = formatNfc(lead, randomUUID(), new Date().toISOString());
      assert.ok(message.includes('public_solution: ' + id));
      assert.ok(message.includes('design_mode: ' + solutions[id][1]));
      assert.ok(message.includes('deposit_after_confirmation: 200 UAH'));
      assert.ok(message.includes('deposit_due_now: false'));
    }
    for (const count of [3, 5, 9, 11]) {
      const quoted = quote(parseNfcLead(input(id, language, 'custom_quote', count)));
      assert.equal(quoted.status, 'custom'); assert.equal(quoted.amount, null); assert.equal(quoted.deposit, null);
      assert.equal(quoted.depositDueNow, false);
    }
  }
});

test('Mini PL is quote-only; free concepts and advice never create purchase or deposit', () => {
  for (const id of Object.keys(solutions) as Id[]) {
    for (const count of [1, 2, 3, 4, 5, 9, 10, 11]) {
      const quoted = quote(parseNfcLead(input(id, 'pl', 'custom_quote', count)));
      assert.equal(quoted.currency, 'PLN'); assert.equal(quoted.status, 'custom');
      assert.equal(quoted.unitPrice, null); assert.equal(quoted.amount, null); assert.equal(quoted.deposit, null);
      assert.equal(quoted.depositDueNow, false);
    }
    const advice = parseNfcLead(input(id, 'pl', 'advice'));
    assert.equal(advice.quantity, 0); assert.equal(quote(advice).amount, null); assert.equal(quote(advice).deposit, null);
    assert.ok(!formatNfc(advice, randomUUID(), new Date().toISOString()).includes('\nquantity: 0'));
    if (solutions[id][1] === 'branded') {
      const concepts = parseNfcLead(input(id, 'uk', 'free_design_concepts'));
      assert.equal(concepts.quantity, 0); assert.equal(quote(concepts).amount, null); assert.equal(quote(concepts).deposit, null);
      assert.ok(!formatNfc(concepts, randomUUID(), new Date().toISOString()).includes('\nquantity: 0'));
    } else assert.throws(() => parseNfcLead(input(id, 'uk', 'free_design_concepts')));
  }
});

test('Mini context, quantity mode, route and optional brand inputs are allowlisted', () => {
  const base = input('branded-beauty-review-card', 'uk', 'fixed_bundle', 10);
  const withDesigns = { ...base, solution: { ...base.solution, design_split_note: '5 design A + 5 design B',
    brand_inputs: { logo_note: 'Logo in messenger', website_or_instagram: 'https://example.invalid', style_note: '<warm palette>' } } };
  const parsed = parseNfcLead(withDesigns);
  assert.equal(quote(parsed).amount, 5000);
  const text = formatNfc(parsed, randomUUID(), new Date().toISOString());
  assert.ok(text.includes('design_split_note: 5 design A + 5 design B'));
  assert.ok(text.includes('style_note: &lt;warm palette&gt;'));
  for (const patch of [
    { product: 'branded-review-card' }, { sourcePage: '/nfc-card-website/en/solutions/branded-beauty-review-card' },
    { sourcePage: '/nfc-card-website/solutions/branded-restaurant-review-card' },
    { solution: { ...base.solution, niche: 'restaurant' } },
    { solution: { ...base.solution, design_mode: 'ready' } },
    { solution: { ...base.solution, solution_id: 'unknown' } },
    { solution: { ...base.solution, product_family: 'branded-review-card' } },
    { solution: { ...base.solution, extra: 'x' } },
    { selection: { variant: 'standard', quantity: '10' } },
    { selection: { variant: 'branded', quantity: 'other' } },
    { quantity: 9 }, { price: 5000 }, { currency: 'UAH' }, { deposit: 200 },
    { solution: { ...base.solution, quantity_mode: 'custom_quote' } },
    { solution: { ...base.solution, brand_inputs: { extra: 'x' } } },
  ]) assert.throws(() => parseNfcLead({ ...base, ...patch }));
  const ready = input('beauty-review-card', 'uk', 'fixed_bundle', 10);
  assert.throws(() => parseNfcLead({ ...ready, solution: { ...ready.solution, brand_inputs: { logo_note: 'not allowed' } } }));
  assert.throws(() => parseNfcLead({ ...ready, solution: { ...ready.solution, design_split_note: 'not allowed' } }));
  assert.throws(() => parseNfcLead(input('beauty-review-card', 'uk', 'fixed_bundle', 3)));
  assert.throws(() => parseNfcLead(input('beauty-review-card', 'uk', 'custom_quote', 2)));
  assert.throws(() => parseNfcLead(input('beauty-review-card', 'pl', 'fixed_bundle', 2)));
});

test('Mini public intake returns only server quote', async () => {
  const secret = randomBytes(32).toString('hex'), now = Date.now(), key = randomUUID();
  const config: NfcConfig = { secret, databaseUrl: '', publicIntake: true, telegramEnabled: false, testOnly: true };
  const handler = createNfcHandler({} as Pool, config, { now: () => now, log: () => {}, save: async lead => ({
    ok: true, source: 'NFC_CARD', leadId: key, durableSaved: true, notificationStatus: 'disabled', quote: quote(lead),
  }) });
  const data = input('restaurant-review-card', 'en', 'fixed_bundle', 4);
  const response = await handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: {
    Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ ...data, website: '', challenge: challenge(secret, data.sourcePage, now - 3000) }) }));
  assert.equal(response?.status, 202);
  const receipt = await response!.json();
  assert.equal(receipt.quote.amount, 2600); assert.equal(receipt.quote.depositDueNow, false);
});

test('Mini PostgreSQL migration, persistence, idempotency and fake outbox', { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
  const url = process.env.NFC_TEST_DATABASE_URL!, parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw new Error('isolated_local_test_database_required');
  const pool = database(url), ids: string[] = [];
  try {
    assert.equal((await migrate(pool)).version, '009_mini_products');
    for (const id of Object.keys(solutions) as Id[]) {
      const language = id.startsWith('branded') ? 'pl' : 'uk';
      const mode = language === 'pl' ? 'custom_quote' : 'fixed_bundle';
      const lead = parseNfcLead(input(id, language, mode, 10)), key = randomUUID();
      const first = await persist(pool, lead, key, { deliveryEnabled: true, isTest: true }); ids.push(first.leadId);
      const stored = (await pool.query('SELECT product,selection,solution,mini_context,price_quote FROM nfc_card.leads WHERE lead_id=$1', [first.leadId])).rows[0];
      assert.equal(stored.product, 'nfc-review-card-mini'); assert.equal(stored.solution, null);
      assert.deepEqual(stored.mini_context, lead.solution); assert.deepEqual(stored.selection, lead.selection);
      assert.deepEqual(stored.price_quote, first.quote);
      assert.equal((await persist(pool, lead, key)).leadId, first.leadId);
      const altered = parseNfcLead(input(id === 'beauty-review-card' ? 'restaurant-review-card' : 'beauty-review-card', language, mode, 10));
      await assert.rejects(persist(pool, altered, key), { status: 409, message: 'idempotency_conflict' });
      await assert.rejects(persist(pool, parseNfcLead(input(id, language, mode, 4)), key),
        { status: 409, message: 'idempotency_conflict' });
      await assert.rejects(pool.query("UPDATE nfc_card.leads SET mini_context=jsonb_set(mini_context,'{niche}','\"invalid\"'::jsonb) WHERE lead_id=$1", [first.leadId]));
    }
    const branded = input('branded-restaurant-review-card', 'uk', 'fixed_bundle', 2);
    for (const lead of [
      parseNfcLead(input('branded-beauty-review-card', 'uk', 'free_design_concepts')),
      parseNfcLead(input('restaurant-review-card', 'en', 'advice')),
      parseNfcLead(input('beauty-review-card', 'uk', 'custom_quote', 3)),
      parseNfcLead({ ...branded, solution: { ...branded.solution, design_split_note: '界'.repeat(300),
        brand_inputs: { logo_note: '界'.repeat(300), website_or_instagram: '界'.repeat(300), style_note: '界'.repeat(300) } } }),
    ]) {
      const receipt = await persist(pool, lead, randomUUID(), { deliveryEnabled: true, isTest: true }); ids.push(receipt.leadId);
      if (lead.solution?.schemaVersion === 2 && lead.solution.quantity_mode === 'fixed_bundle') {
        assert.equal(receipt.quote?.amount, 1800); assert.equal(receipt.quote?.deposit, 200);
      } else { assert.equal(receipt.quote?.amount, null); assert.equal(receipt.quote?.deposit, null); }
      const stored = (await pool.query('SELECT quantity,mini_context,price_quote FROM nfc_card.leads WHERE lead_id=$1', [receipt.leadId])).rows[0];
      assert.equal(stored.quantity, lead.quantity); assert.deepEqual(stored.mini_context, lead.solution);
      if (lead.solution?.schemaVersion === 2 && lead.solution.quantity_mode === 'fixed_bundle') {
        assert.equal(stored.price_quote.deposit, 200);
      } else {
        assert.equal(stored.price_quote.deposit, null);
        await assert.rejects(pool.query("UPDATE nfc_card.leads SET price_quote=jsonb_set(price_quote,'{amount}','1'::jsonb) WHERE lead_id=$1", [receipt.leadId]));
      }
    }
    const config: NfcConfig = { secret: randomBytes(32).toString('hex'), databaseUrl: url, publicIntake: false, telegramEnabled: true, testOnly: true };
    const sent: string[] = [];
    for (const id of ids) await drain(pool, { ...config, testLeadId: id }, async message => { sent.push(message); return { status: 'sent' }; }, () => {});
    assert.equal(sent.length, 8);
    for (const message of sent) {
      assert.ok(message.length < 4096);
      assert.ok(message.includes('product_family: nfc-review-card-mini'));
      assert.ok(message.includes('public_solution: ')); assert.ok(message.includes('design_mode: '));
      assert.ok(message.includes('deposit_due_now: false'));
    }
  } finally {
    if (ids.length) await pool.query('DELETE FROM nfc_card.notification_outbox WHERE lead_id = ANY($1::uuid[])', [ids]);
    if (ids.length) await pool.query('DELETE FROM nfc_card.leads WHERE lead_id = ANY($1::uuid[])', [ids]);
    await pool.end();
  }
});

test('009 upgrades populated v29 schema without rewriting old leads or outbox', { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
  const url = process.env.NFC_TEST_DATABASE_URL!, parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw new Error('isolated_local_test_database_required');
  const admin = database(url), name = 'nfc_mini_upgrade_' + randomUUID().replaceAll('-', '') + '_test';
  await admin.query('CREATE DATABASE "' + name + '"');
  const upgradeUrl = new URL(url); upgradeUrl.pathname = '/' + name;
  const pool = database(upgradeUrl.href);
  try {
    const versions = ['001_nfc_card', '002_public_commerce', '003_instagram_card', '004_menu_card',
      '005_review_card_3d', '006_polish_locale', '007_poland_commercial', '008_niche_solutions'];
    const checksums = new Map<string, string>();
    for (const version of versions) {
      const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
      await pool.query(sql); checksums.set(version, createHash('sha256').update(sql).digest('hex'));
    }
    await pool.query('CREATE TABLE nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const version of versions) await pool.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES ($1,$2)', [version, checksums.get(version)]);
    const old = parseNfcLead({ language: 'uk', product: 'branded-review-card', quantity: 1,
      customerName: 'Existing v29 synthetic lead', contact: { preferredMethod: 'email', email: 'old-mini-test@example.invalid' },
      sourcePage: '/nfc-card-website/solutions/beauty-review-card', selection: { variant: 'branded', quantity: '1' },
      solution: { schemaVersion: 1, solution_id: 'beauty-review-card', niche: 'beauty_salon', request_type: 'free_first_mockup' } });
    const leadId = randomUUID(), key = randomUUID();
    await pool.query(`INSERT INTO nfc_card.leads(id,lead_id,language,product,quantity,customer_name,email,preferred_contact,
      source_page,utm,idempotency_key,request_digest,selection,price_quote,solution)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [randomUUID(), leadId, old.language, old.product, old.quantity, old.customerName, old.contact.email,
      old.contact.preferredMethod, old.sourcePage, {}, key, createHash('sha256').update(JSON.stringify(old)).digest('hex'),
      old.selection, quote(old), old.solution]);
    await pool.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES ($1,$2,false)', [randomUUID(), leadId]);
    const before = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [leadId])).rows[0];
    const outboxBefore = (await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [leadId])).rows[0];
    assert.equal((await migrate(pool, true)).applied, false);
    assert.equal((await migrate(pool)).version, '009_mini_products');
    const after = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [leadId])).rows[0];
    assert.deepEqual(Object.fromEntries(Object.keys(before).map(field => [field, after[field]])), before);
    assert.equal(after.mini_context, null);
    assert.deepEqual((await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [leadId])).rows[0], outboxBefore);
    assert.equal((await persist(pool, old, key)).leadId, leadId);
  } finally {
    await pool.end();
    await admin.query('DROP DATABASE "' + name + '"');
    await admin.end();
  }
});
