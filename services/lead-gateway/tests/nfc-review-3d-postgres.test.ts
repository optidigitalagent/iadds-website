import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { parseNfcLead } from '../src/nfc-card/contract.ts';
import { drain } from '../src/nfc-card/outbox.ts';

test('Review 3D 005 upgrades populated schema; save, outbox and fake Telegram preserve exact details',
  { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
    const url = process.env.NFC_TEST_DATABASE_URL!, parsed = new URL(url);
    if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw new Error('isolated_local_test_database_required');
    const admin = database(url), name = 'nfc_review3d_upgrade_' + randomUUID().replaceAll('-', '') + '_test';
    await admin.query('CREATE DATABASE "' + name + '"');
    const upgradeUrl = new URL(url); upgradeUrl.pathname = '/' + name;
    const pool = database(upgradeUrl.href), prior = ['001_nfc_card', '002_public_commerce', '003_instagram_card', '004_menu_card'];
    const threeD = (quantity: number, comment = '<Ready> & confirm location') => parseNfcLead({
      language: 'en', product: 'review-card-3d', productSchemaVersion: 1, product_id: 'nfc-review-card-3d',
      design: 'fixed_shown_design', google_location_url: 'https://maps.app.goo.gl/ExamplePlace', comment, consent: true,
      quantity, customerName: 'Synthetic DB 3D', contact: { preferredMethod: 'email', email: 'review3d-db@example.invalid' },
      sourcePage: '/nfc-card-website/en/solutions/review-card-3d' });
    try {
      for (const version of prior) await pool.query(await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8'));
      await pool.query('CREATE TABLE nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
      for (const version of prior) {
        const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
        await pool.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)',
          [version, createHash('sha256').update(sql).digest('hex')]);
      }
      const oldId = randomUUID();
      await pool.query(`INSERT INTO nfc_card.leads(id,lead_id,language,product,quantity,customer_name,email,preferred_contact,
        source_page,utm,idempotency_key,request_digest,price_quote) VALUES($1,$2,'uk','review-card',1,'Synthetic existing Review',
        'legacy@example.invalid','email','/nfc-card-website/solutions/review-card','{}',$3,$4,$5)`,
      [randomUUID(), oldId, randomUUID(), 'a'.repeat(64), { currency: 'UAH', status: 'fixed', amount: 1500, deposit: 200, depositIncluded: true }]);
      await pool.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES($1,$2,false)', [randomUUID(), oldId]);
      const before = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [oldId])).rows[0];
      const outboxBefore = (await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [oldId])).rows[0];
      assert.equal((await migrate(pool, true)).applied, false);
      assert.equal((await pool.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='nfc_card' AND table_name='leads' AND column_name='design'")).rows[0].n, 0);
      const upgrade = await migrate(pool); assert.equal(upgrade.version, '005_review_card_3d'); assert.equal(upgrade.applied, true);
      assert.equal((await migrate(pool)).applied, false);
      const after = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [oldId])).rows[0];
      assert.deepEqual(Object.fromEntries(Object.keys(before).map(key => [key, after[key]])), before);
      assert.equal(after.design, null); assert.equal(after.google_location_url, null);
      assert.deepEqual((await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [oldId])).rows[0], outboxBefore);
      for (const version of prior) assert.equal((await pool.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1', [version])).rows[0].checksum,
        createHash('sha256').update(await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8')).digest('hex'));

      const config = { telegramEnabled: true, testOnly: false } as never;
      for (const [quantity, amount, balance] of [[1,4000,3800],[2,8000,7800],[3,12000,11800]]) {
        const lead = threeD(quantity), key = randomUUID();
        const receipts = await Promise.all(Array.from({ length: 3 }, () => persist(pool, lead, key, { isTest: true, deliveryEnabled: true })));
        const id = receipts[0].leadId;
        assert.equal(new Set(receipts.map(receipt => receipt.leadId)).size, 1);
        assert.equal(receipts[0].quote?.amount, amount); assert.equal(receipts[0].quote?.deposit, 200);
        assert.equal('balance' in receipts[0].quote! && receipts[0].quote.balance, balance);
        const stored = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [id])).rows[0];
        assert.equal(stored.product, 'review-card-3d'); assert.equal(stored.product_id, 'nfc-review-card-3d');
        assert.equal(stored.design, 'fixed_shown_design'); assert.equal(stored.google_location_url, lead.review3d?.google_location_url);
        assert.equal(stored.comment, lead.review3d?.comment); assert.equal(stored.price_quote.amount, amount);
        assert.equal(stored.price_quote.balance, balance);
        assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0].n, 1);
        await assert.rejects(persist(pool, threeD(quantity, 'changed'), key), /idempotency_conflict/);
        let sends = 0;
        await drain(pool, config, async message => { sends++;
          assert.ok(message.includes('product_id: nfc-review-card-3d'));
          assert.ok(message.includes('google_location_url: https://maps.app.goo.gl/ExamplePlace'));
          assert.ok(message.includes('comment: &lt;Ready&gt; &amp; confirm location'));
          assert.ok(message.includes('price: ' + amount + ' UAH'));
          assert.ok(message.includes('deposit: 200 UAH'));
          assert.ok(message.includes('balance: ' + balance + ' UAH'));
          return { status: 'sent' }; }, () => {});
        assert.equal(sends, 1);
        assert.equal((await pool.query('SELECT status FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0].status, 'sent');
        for (const sql of ["design='custom'", 'consent=false', 'quantity=0', "product_id='nfc-review-card'",
          "price_quote=jsonb_set(price_quote,'{amount}','1'::jsonb)", "google_location_url='http://google.com/maps'"]) {
          await assert.rejects(pool.query('UPDATE nfc_card.leads SET ' + sql + ' WHERE lead_id=$1', [id]), sql);
        }
      }
      const rollbackKey = randomUUID();
      await assert.rejects(persist(pool, threeD(1), rollbackKey, { beforeOutbox: async () => { throw new Error('synthetic rollback'); } }), /storage_unavailable/);
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1', [rollbackKey])).rows[0].n, 0);
    } finally {
      await pool.end();
      await admin.query('DROP DATABASE "' + name + '"');
      await admin.end();
    }
  });
