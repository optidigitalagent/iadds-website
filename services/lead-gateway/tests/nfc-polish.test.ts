import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import type { Pool } from 'pg';
import { ENDPOINT, ORIGIN, challenge, parseNfcLead, sourcePath } from '../src/nfc-card/contract.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { formatNfc } from '../src/nfc-card/format.ts';
import { quote } from '../src/nfc-card/commerce.ts';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { drain } from '../src/nfc-card/outbox.ts';

const base = () => ({ language: 'pl', product: 'review-card', quantity: 1, customerName: 'Syntetyczny klient',
  contact: { preferredMethod: 'email', email: 'pl-test@example.invalid' }, sourcePage: '/nfc-card-website/pl/order' });

test('PL source paths, strict language allowlist and canonical prices for all five products', () => {
  const routes = ['', 'order', 'contact', 'about', 'instagram-card', 'menu-card',
    'solutions/review-card', 'solutions/branded-review-card', 'solutions/review-card-3d',
    'solutions/instagram-card', 'solutions/menu-card'];
  for (const route of routes) {
    const path = '/nfc-card-website/pl/' + route;
    assert.equal(sourcePath(path + '?product=review-card#form'), path.replace(/\/$/, ''));
  }
  for (const language of ['ru', 'PL', '']) assert.throws(() => parseNfcLead({ ...base(), language }));
  for (const path of ['/nfc-card-website/pl/unknown', '/nfc-card-website/%70l/order', '/nfc-card-website/pl/../order'])
    assert.throws(() => sourcePath(path));
  const cases = [
    [{ ...base(), sourcePage: '/nfc-card-website/pl/solutions/review-card' }, 129],
    [{ ...base(), product: 'branded-review-card', sourcePage: '/nfc-card-website/pl/solutions/branded-review-card' }, 169],
    [{ ...base(), product: 'review-card-3d', productSchemaVersion: 1, product_id: 'nfc-review-card-3d',
      design: 'fixed_shown_design', consent: true, sourcePage: '/nfc-card-website/pl/solutions/review-card-3d' }, 349],
    [{ ...base(), product: 'nfc-instagram-card', productSchemaVersion: 1, product_id: 'nfc-instagram-card',
      sku: 'NFC-IG-READY', offer: 'ready', instagramUrl: 'https://www.instagram.com/synthetic_pl/', consent: true,
      selection: { variant: 'instagram', quantity: '1' }, contact: { preferredMethod: 'telegram', phone: '+12025550123' },
      sourcePage: '/nfc-card-website/pl/instagram-card' }, 129],
    [{ ...base(), product: 'nfc-menu-card', productSchemaVersion: 1, product_id: 'nfc-menu-card', intent: 'card_order',
      menu_status: 'existing', menu_url: 'https://example.invalid/menu', items: [{ variant_id: 'square_100_black', quantity: 1 }],
      consent: true, sourcePage: '/nfc-card-website/pl/menu-card' }, 89]
  ] as const;
  for (const [raw, amount] of cases) {
    const lead = parseNfcLead(raw);
    assert.equal(lead.language, 'pl'); assert.equal(quote(lead).amount, amount);
    assert.equal(quote(lead).currency, 'PLN'); assert.equal(quote(lead).deposit, 20);
    assert.match(formatNfc(lead, randomUUID(), new Date().toISOString()), /price: \d+ PLN/);
  }
});

test('PL browser challenge and durable-save receipt use the existing contract without a real transport', async () => {
  const secret = randomBytes(32).toString('hex'), key = randomUUID(), now = Date.now();
  let saved = 0;
  const handler = createNfcHandler({} as Pool,
    { secret, databaseUrl: '', publicIntake: true, telegramEnabled: false, testOnly: true },
    { now: () => now, log: () => {}, save: async (lead, idempotencyKey, enabled) => {
      assert.equal(lead.language, 'pl'); assert.equal(lead.sourcePage, base().sourcePage);
      assert.equal(idempotencyKey, key); assert.equal(enabled, false); saved++;
      return { ok: true, source: 'NFC_CARD', leadId: key, durableSaved: true, notificationStatus: 'disabled' };
    } });
  const get = await handler(new Request('http://local' + ENDPOINT + '/challenge?sourcePage=' + encodeURIComponent(base().sourcePage),
    { headers: { Origin: ORIGIN } }));
  assert.equal(get?.status, 200); assert.ok((await get!.json()).challenge);
  const post = await handler(new Request('http://local' + ENDPOINT, { method: 'POST',
    headers: { Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify({ ...base(), website: '', challenge: challenge(secret, base().sourcePage, now - 3000) }) }));
  assert.equal(post?.status, 202); assert.equal((await post!.json()).durableSaved, true); assert.equal(saved, 1);
});

test('PostgreSQL 17 migrations 006–007 preserve populated 005 data and PLN survives outbox/fake Telegram',
  { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
    const url = process.env.NFC_TEST_DATABASE_URL!, parsed = new URL(url);
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test'))
      throw new Error('isolated_local_test_database_required');
    const admin = database(url), name = 'nfc_pl_upgrade_' + randomUUID().replaceAll('-', '') + '_test';
    await admin.query('CREATE DATABASE "' + name + '"');
    const upgradeUrl = new URL(url); upgradeUrl.pathname = '/' + name;
    const pool = database(upgradeUrl.href);
    const versions = ['001_nfc_card', '002_public_commerce', '003_instagram_card', '004_menu_card', '005_review_card_3d'];
    try {
      const checksums = new Map<string, string>();
      for (const version of versions) {
        const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
        await pool.query(sql); checksums.set(version, createHash('sha256').update(sql).digest('hex'));
      }
      await pool.query('CREATE TABLE nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
      for (const version of versions) await pool.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)', [version, checksums.get(version)]);
      const oldId = randomUUID(), oldOutboxId = randomUUID();
      await pool.query(`INSERT INTO nfc_card.leads(id,lead_id,language,product,quantity,customer_name,email,preferred_contact,
        source_page,utm,idempotency_key,request_digest) VALUES($1,$2,'uk','review-card',1,'Existing synthetic lead',
        'old@example.invalid','email','/nfc-card-website/order','{}',$3,$4)`, [randomUUID(), oldId, randomUUID(), 'a'.repeat(64)]);
      await pool.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES($1,$2,false)', [oldOutboxId, oldId]);
      const oldLead = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [oldId])).rows[0];
      const oldOutbox = (await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE id=$1', [oldOutboxId])).rows[0];
      assert.equal((await migrate(pool, true)).applied, false);
      await assert.rejects(persist(pool, parseNfcLead(base()), randomUUID()), /storage_unavailable/);
      const upgrade = await migrate(pool);
      assert.equal(upgrade.version, '009_mini_products'); assert.equal(upgrade.applied, true);
      assert.equal((await migrate(pool)).applied, false);
      const after = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [oldId])).rows[0];
      assert.deepEqual(Object.fromEntries(Object.keys(oldLead).map(key => [key, after[key]])), oldLead);
      assert.equal(after.solution, null);
      assert.deepEqual((await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE id=$1', [oldOutboxId])).rows[0], oldOutbox);
      for (const version of versions) assert.equal((await pool.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1', [version])).rows[0].checksum,
        checksums.get(version));
      const lead = parseNfcLead(base()), key = randomUUID();
      const receipts = await Promise.all([1, 2].map(() => persist(pool, lead, key, { isTest: true, deliveryEnabled: true })));
      assert.equal(receipts[0].leadId, receipts[1].leadId);
      assert.equal(receipts[0].durableSaved, true); assert.equal(receipts[0].quote?.amount, 129);
      assert.equal(receipts[0].quote?.currency, 'PLN'); assert.equal(receipts[0].quote?.deposit, 20);
      const saved = (await pool.query('SELECT language,source_page FROM nfc_card.leads WHERE lead_id=$1', [receipts[0].leadId])).rows[0];
      assert.deepEqual(saved, { language: 'pl', source_page: '/nfc-card-website/pl/order' });
      await assert.rejects(pool.query("UPDATE nfc_card.leads SET language='ru' WHERE lead_id=$1", [receipts[0].leadId]));
      await assert.rejects(persist(pool, { ...lead, language: 'en' }, key), /idempotency_conflict/);
      let messages = 0;
      await drain(pool, { telegramEnabled: true, testOnly: false } as never, async message => {
        messages++; assert.match(message, /language: pl/); assert.match(message, /price: 129 PLN/);
        assert.match(message, /source_page: \/nfc-card-website\/pl\/order/);
        return { status: 'sent' };
      }, () => {});
      assert.equal(messages, 1);
      assert.equal((await pool.query('SELECT status FROM nfc_card.notification_outbox WHERE lead_id=$1', [receipts[0].leadId])).rows[0].status, 'sent');
    } finally {
      await pool.end(); await admin.query('DROP DATABASE "' + name + '"'); await admin.end();
    }
  });
