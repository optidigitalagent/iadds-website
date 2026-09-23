import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { parseNfcLead } from '../src/nfc-card/contract.ts';
import { drain } from '../src/nfc-card/outbox.ts';

test('Menu 004 upgrades populated Instagram schema and preserves durable outbox behavior', { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
  const url = process.env.NFC_TEST_DATABASE_URL!;
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw new Error('isolated_local_test_database_required');
  const admin = database(url), name = 'nfc_menu_upgrade_' + randomUUID().replaceAll('-', '') + '_test';
  await admin.query('CREATE DATABASE "' + name + '"');
  const upgradeUrl = new URL(url); upgradeUrl.pathname = '/' + name;
  const pool = database(upgradeUrl.href);
  const menu = (items: { variant_id: string; quantity: number }[], quantity: number) => parseNfcLead({ language: 'uk', product: 'nfc-menu-card',
    productSchemaVersion: 1, product_id: 'nfc-menu-card', intent: 'card_order', menu_status: 'existing',
    menu_url: 'https://menu.example.com/guest', items, quantity, customerName: 'Synthetic DB Menu',
    contact: { preferredMethod: 'email', email: 'menu@example.invalid' }, sourcePage: '/nfc-card-website/solutions/menu-card', consent: true });
  try {
    const prior = ['001_nfc_card', '002_public_commerce', '003_instagram_card'];
    for (const version of prior) {
      const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
      await pool.query(sql);
    }
    await pool.query('CREATE TABLE nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    for (const version of prior) {
      const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
      await pool.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)', [version, createHash('sha256').update(sql).digest('hex')]);
    }
    const legacy = parseNfcLead({ language: 'en', product: 'nfc-instagram-card', quantity: 1, customerName: 'Synthetic Existing Instagram',
      contact: { preferredMethod: 'telegram', phone: '+12025550123' }, sourcePage: '/nfc-card-website/en/instagram-card',
      productSchemaVersion: 1, product_id: 'nfc-instagram-card', sku: 'NFC-IG-READY', offer: 'ready',
      instagramUrl: 'https://www.instagram.com/legacy_menu_test/', consent: true, selection: { variant: 'instagram', quantity: '1' } });
    const legacyId = randomUUID();
    await pool.query(`INSERT INTO nfc_card.leads(id,lead_id,language,product,quantity,customer_name,phone,preferred_contact,source_page,utm,
      idempotency_key,request_digest,is_test,selection,price_quote,product_schema_version,product_id,sku,offer,instagram_url,consent)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true,$13,$14,$15,$16,$17,$18,$19,true)`,
    [randomUUID(), legacyId, legacy.language, legacy.product, legacy.quantity, legacy.customerName, legacy.contact.phone,
      legacy.contact.preferredMethod, legacy.sourcePage, legacy.utm, randomUUID(), createHash('sha256').update(JSON.stringify(legacy)).digest('hex'),
      legacy.selection, { currency: 'UAH', status: 'fixed', amount: 1500, deposit: 200, depositIncluded: true },
      legacy.instagram?.productSchemaVersion, legacy.instagram?.product_id, legacy.instagram?.sku, legacy.instagram?.offer, legacy.instagram?.instagramUrl]);
    await pool.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES($1,$2,false)', [randomUUID(), legacyId]);
    const oldRow = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [legacyId])).rows[0];
    assert.equal((await migrate(pool, true)).applied, false);
    assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='nfc_card' AND table_name='leads' AND column_name='menu_status'")).rows[0].n, 0);
    const result = await migrate(pool); assert.equal(result.version, '004_menu_card'); assert.equal(result.applied, true);
    assert.equal((await migrate(pool)).applied, false);
    const after = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [legacyId])).rows[0];
    assert.deepEqual(Object.fromEntries(Object.keys(oldRow).map(key => [key, after[key]])), oldRow);
    assert.equal(after.menu_status, null); assert.equal(after.items, null);
    for (const version of prior) assert.equal((await pool.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1', [version])).rows[0].checksum,
      createHash('sha256').update(await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8')).digest('hex'));

    const order = menu([{ variant_id: 'square_100_black', quantity: 2 }, { variant_id: 'round_70_white', quantity: 2 },
      { variant_id: 'square_60_black', quantity: 2 }], 6);
    const key = randomUUID();
    const receipts = await Promise.all(Array.from({ length: 5 }, () => persist(pool, order, key, { isTest: true, deliveryEnabled: true })));
    assert.equal(new Set(receipts.map(item => item.leadId)).size, 1);
    assert.equal(receipts[0].quote?.amount, 4500);
    const id = receipts[0].leadId;
    const stored = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [id])).rows[0];
    assert.equal(stored.quantity, 6); assert.equal(stored.price_quote.unitPrice, 750); assert.equal(stored.price_quote.deposit, 200);
    assert.equal(stored.price_quote.balance, 4300); assert.equal(stored.items.length, 3);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0].n, 1);
    await assert.rejects(persist(pool, menu([{ variant_id: 'square_100_black', quantity: 7 }], 7), key), /idempotency_conflict/);
    let sends = 0;
    await drain(pool, { telegramEnabled: true, testOnly: false } as never, async text => {
      sends++; assert.ok(text.includes('intent: card_order')); assert.ok(text.includes('price: 4500 UAH'));
      assert.ok(text.includes('deposit: 200 UAH')); assert.ok(text.includes('balance: 4300 UAH'));
      return { status: 'sent' };
    }, () => {});
    assert.equal(sends, 1);
    assert.equal((await pool.query('SELECT status FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0].status, 'sent');
    assert.equal(await drain(pool, { telegramEnabled: true, testOnly: false } as never, async () => { throw new Error('duplicate'); }, () => {}), 0);

    const consultation = parseNfcLead({ language: 'uk', product: 'nfc-menu-card', productSchemaVersion: 1, product_id: 'nfc-menu-card',
      intent: 'menu_consultation', menu_status: 'needs_development', customerName: 'Synthetic Consultation',
      contact: { preferredMethod: 'email', email: 'consult@example.invalid' }, sourcePage: '/nfc-card-website/contact', consent: true });
    const consultReceipt = await persist(pool, consultation, randomUUID(), { isTest: true, deliveryEnabled: false });
    const consultRow = (await pool.query('SELECT quantity,items,price_quote,menu_url FROM nfc_card.leads WHERE lead_id=$1', [consultReceipt.leadId])).rows[0];
    assert.equal(consultRow.quantity, 0); assert.deepEqual(consultRow.items, []);
    assert.equal(consultRow.price_quote.amount, null); assert.equal(consultRow.price_quote.deposit, null);
    assert.equal(consultRow.menu_url, null);
    const rollbackKey = randomUUID();
    await assert.rejects(persist(pool, order, rollbackKey, { beforeOutbox: async () => { throw new Error('synthetic failure'); } }), /storage_unavailable/);
    assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1', [rollbackKey])).rows[0].n, 0);
    await assert.rejects(pool.query("UPDATE nfc_card.leads SET quantity=0 WHERE lead_id=$1", [id]));
    await assert.rejects(pool.query("UPDATE nfc_card.leads SET menu_status='needs_development' WHERE lead_id=$1", [id]));
  } finally {
    await pool.end();
    await admin.query('DROP DATABASE "' + name + '"');
    await admin.end();
  }
});
