import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { ORIGIN, ENDPOINT, challenge, parseNfcLead } from '../src/nfc-card/contract.ts';
import { drain } from '../src/nfc-card/outbox.ts';
import type { NfcConfig } from '../src/nfc-card/config.ts';

test('PostgreSQL 17 NFC integration — no external transports', { skip: !process.env.NFC_TEST_DATABASE_URL }, async t => {
  const url = process.env.NFC_TEST_DATABASE_URL!;
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw new Error('isolated_local_test_database_required');
  const pool = database(url), ids: string[] = [];
  const config: NfcConfig = { secret: randomBytes(32).toString('hex'), databaseUrl: url, publicIntake: false, telegramEnabled: true, testOnly: false };
  const lead = () => parseNfcLead({ language: 'en', product: 'review-card', quantity: 2, customerName: 'Synthetic DB QA',
    contact: { preferredMethod: 'email', email: 'db-qa@example.invalid' }, sourcePage: '/nfc-card-website/en/order' });
  const save = async (enabled = true) => { const result = await persist(pool, lead(), randomUUID(), { isTest: true, deliveryEnabled: enabled }); ids.push(result.leadId); return result; };
  const row = async (id: string) => (await pool.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0];
  const quiet = () => {};
  try {
    await t.test('003 upgrades a populated 001/002 database without changing legacy leads or delivery', async () => {
      const name = 'nfc_ig_upgrade_' + randomUUID().replaceAll('-', '') + '_test';
      await pool.query('CREATE DATABASE "' + name + '"');
      const upgradeUrl = new URL(url); upgradeUrl.pathname = '/' + name;
      const upgrade = database(upgradeUrl.href);
      try {
        const prior = ['001_nfc_card', '002_public_commerce'];
        const checksums: Record<string, string> = {};
        for (const version of prior) {
          const sql = await readFile(new URL('../migrations/nfc-card/' + version + '.sql', import.meta.url), 'utf8');
          await upgrade.query(sql); checksums[version] = createHash('sha256').update(sql).digest('hex');
        }
        await upgrade.query('CREATE TABLE nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
        for (const version of prior) await upgrade.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES($1,$2)', [version, checksums[version]]);
        const previous = lead(), key = randomUUID(), id = randomUUID();
        await upgrade.query(`INSERT INTO nfc_card.leads(id,lead_id,language,product,quantity,customer_name,email,preferred_contact,source_page,utm,idempotency_key,request_digest,is_test)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,true)`, [randomUUID(), id, previous.language, previous.product, previous.quantity,
          previous.customerName, previous.contact.email, previous.contact.preferredMethod, previous.sourcePage, previous.utm, key,
          createHash('sha256').update(JSON.stringify(previous)).digest('hex')]);
        await upgrade.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES($1,$2,true)', [randomUUID(), id]);
        const before = (await upgrade.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [id])).rows[0];
        const outboxBefore = (await upgrade.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0];
        assert.equal((await migrate(upgrade, true)).applied, false);
        assert.equal((await upgrade.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema='nfc_card' AND table_name='leads' AND column_name='instagram_url'")).rows[0].n, 0);
        const applied = await migrate(upgrade); assert.equal(applied.version, '005_review_card_3d'); assert.equal(applied.applied, true);
        assert.equal((await migrate(upgrade)).applied, false);
        const after = (await upgrade.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [id])).rows[0];
        assert.deepEqual(Object.fromEntries(Object.keys(before).map(k => [k, after[k]])), before);
        assert.equal(after.instagram_url, null); assert.equal(after.consent, null);
        assert.deepEqual((await upgrade.query('SELECT * FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0], outboxBefore);
        for (const row of (await upgrade.query('SELECT version,checksum FROM nfc_card.schema_migrations')).rows) {
          if (prior.includes(row.version)) assert.equal(row.checksum, checksums[row.version]);
        }
        const retried = await persist(upgrade, previous, key); assert.equal(retried.leadId, id); assert.equal(retried.quote?.amount, 2600);
        let sends = 0;
        await drain(upgrade, config, async message => {
          sends++; assert.ok(message.includes('product: review-card')); assert.ok(message.includes('price: 2600 UAH'));
          assert.ok(!message.includes('instagram_url:')); assert.ok(!message.includes('consent:')); return { status: 'sent' };
        }, quiet);
        assert.equal(sends, 1);
        await assert.rejects(upgrade.query("UPDATE nfc_card.leads SET product='nfc-instagram-card' WHERE lead_id=$1", [id]));
        await assert.rejects(upgrade.query("UPDATE nfc_card.leads SET sku='NFC-IG-READY' WHERE lead_id=$1", [id]));
      } finally {
        await upgrade.end();
        await pool.query('DROP DATABASE "' + name + '"');
      }
    });
    await t.test('migration preflight rolls back, apply is checksummed and repeatable', async () => {
      const preflight = await migrate(pool, true); assert.equal(preflight.applied, false);
      const first = await migrate(pool); const second = await migrate(pool);
      assert.equal(first.checksum, second.checksum); assert.equal(second.applied, false);
      const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='nfc_card'");
      assert.deepEqual(tables.rows.map(x => x.tablename).sort(), ['leads', 'notification_outbox', 'schema_migrations']);
      const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname='nfc_card'");
      assert.ok(indexes.rows.some(x => x.indexname === 'nfc_card_outbox_due'));
    });
    await t.test('Instagram Pages intake commits complete data once; a fresh worker formats durable fields and retries safely', async () => {
      for (const quantity of [1, 2]) {
        const key = randomUUID(), now = Date.now(), sourcePage = '/nfc-card-website' + (quantity === 2 ? '/en' : '') + '/solutions/instagram-card';
        const input = { language: quantity === 2 ? 'en' : 'uk', product: 'nfc-instagram-card', quantity, customerName: 'Synthetic Instagram DB QA',
          contact: { preferredMethod: 'telegram', phone: '+12025550123' }, sourcePage, productSchemaVersion: 1,
          product_id: 'nfc-instagram-card', sku: 'NFC-IG-READY', offer: 'ready', instagramUrl: 'https://www.instagram.com/synthetic_db/',
          ...(quantity === 1 ? { comment: '<b>Durable details</b> &\nSecond line' } : {}), consent: true,
          selection: { variant: 'instagram', quantity: String(quantity) }, website: '', challenge: challenge(config.secret, sourcePage, now - 2000) };
        // Synthetic IDs use the existing final-test marking solely for test cleanup; send is always injected.
        const handler = createNfcHandler(pool, { ...config, publicIntake: true, finalTestKey: key }, { now: () => now, log: quiet });
        const post = (body: unknown = input) => handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: {
          Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': key }, body: JSON.stringify(body) }));
        const responses = await Promise.all(Array.from({ length: 4 }, () => post()));
        for (const response of responses) assert.equal(response?.status, 202);
        const receipts = await Promise.all(responses.map(r => r!.json()));
        const id = receipts[0].leadId; ids.push(id);
        assert.equal(new Set(receipts.map(r => r.leadId)).size, 1);
        assert.equal(receipts[0].durableSaved, true); assert.equal(receipts[0].notificationStatus, 'queued');
        assert.equal(receipts[0].quote.amount, quantity === 1 ? 1500 : 2600);
        const stored = (await pool.query('SELECT * FROM nfc_card.leads WHERE lead_id=$1', [id])).rows[0];
        assert.equal(stored.product_schema_version, 1); assert.equal(stored.product_id, 'nfc-instagram-card');
        assert.equal(stored.sku, 'NFC-IG-READY'); assert.equal(stored.offer, 'ready'); assert.equal(stored.consent, true);
        assert.equal(stored.instagram_url, input.instagramUrl); assert.equal(stored.comment, input.comment ?? null);
        assert.equal(stored.price_quote.amount, receipts[0].quote.amount);
        assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.notification_outbox WHERE lead_id=$1', [id])).rows[0].n, 1);
        assert.equal((await row(id)).status, 'pending');
        for (const patch of [{ comment: 'Changed after receipt' }, { instagramUrl: 'https://www.instagram.com/another_business/' }]) {
          const conflict = await post({ ...input, ...patch }); assert.equal(conflict?.status, 409);
          assert.equal((await conflict!.json()).existingLeadId, id);
        }
        assert.equal((await post({ ...input, price: 1 }))?.status, 422);
        for (const sql of ["consent=false", "product_schema_version=NULL", "product_id='nfc-review-card'", "offer='branded'", "quantity=3",
          "instagram_url='https://www.instagram.com/reels/'", "selection=NULL", "comment=repeat('a',2001)"]) {
          await assert.rejects(pool.query('UPDATE nfc_card.leads SET ' + sql + ' WHERE lead_id=$1', [id]));
        }
        // Exercise normal retry policy for these synthetic rows after marking them for cleanup.
        await pool.query('UPDATE nfc_card.leads SET is_final_test=false WHERE lead_id=$1', [id]);
        const messages: string[] = [];
        for (const attempt of [1, 2]) {
          const worker = database(url);
          try {
            await drain(worker, config, async message => {
              messages.push(message); assert.equal((await row(id)).status, 'sending');
              assert.ok(message.includes('instagram_url: ' + input.instagramUrl)); assert.ok(message.includes('sku: NFC-IG-READY'));
              assert.ok(message.includes('offer: ready')); assert.ok(message.includes('consent: true'));
              assert.ok(message.includes('price: ' + stored.price_quote.amount + ' UAH'));
              if (input.comment) assert.ok(message.includes('comment: &lt;b&gt;Durable details&lt;/b&gt; &amp;\nSecond line'));
              else assert.ok(!message.includes('comment:'));
              return attempt === 1 ? { status: 'retry', category: 'upstream' } : { status: 'sent' };
            }, quiet);
          } finally { await worker.end(); }
          if (attempt === 1) {
            assert.equal((await row(id)).status, 'retry');
            await pool.query("UPDATE nfc_card.notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE lead_id=$1", [id]);
          }
        }
        assert.equal(messages.length, 2); assert.equal(messages[0], messages[1]); assert.equal((await row(id)).status, 'sent');
        assert.equal((await (await post())!.json()).leadId, id);
        assert.equal(await drain(pool, config, async () => { throw new Error('sent Instagram lead must not resend'); }, quiet), 0);
        const rollbackKey = randomUUID();
        await assert.rejects(persist(pool, parseNfcLead(input, true), rollbackKey, { beforeOutbox: async () => { throw new Error('synthetic rollback'); } }), /storage_unavailable/);
        assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1', [rollbackKey])).rows[0].n, 0);
      }
    });
    await t.test('transaction lead+outbox commit precedes transport, concurrency does not duplicate', async () => {
      const key = randomUUID();
      const receipts = await Promise.all(Array.from({ length: 8 }, () => persist(pool, lead(), key, { isTest: true, deliveryEnabled: true })));
      assert.equal(new Set(receipts.map(r => r.leadId)).size, 1); const id = receipts[0].leadId; ids.push(id);
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1', [key])).rows[0].n, 1);
      let sends = 0;
      await Promise.all([1, 2].map(() => drain(pool, config, async () => { sends++; assert.equal((await row(id)).status, 'sending'); return { status: 'sent' }; }, quiet)));
      assert.equal(sends, 1); assert.equal((await row(id)).status, 'sent');
      assert.equal((await persist(pool, lead(), key)).leadId, id);
      await assert.rejects(persist(pool, { ...lead(), quantity: 3 }, key), /idempotency_conflict/);
    });
    await t.test('failure between lead and outbox rolls back every row with no transport', async () => {
      const key = randomUUID();
      await assert.rejects(persist(pool, lead(), key, { beforeOutbox: async c => { await c.query('SELECT 1/0'); } }), /storage_unavailable/);
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1', [key])).rows[0].n, 0);
    });
    await t.test('asynchronous checked-out client failure cannot terminate the shared gateway', async () => {
      const code = `import assert from 'node:assert/strict';import {database,persist} from './src/nfc-card/store.ts';import {createGateway} from './src/gateway.ts';import {readConfig} from './src/config.ts';import {randomUUID} from 'node:crypto';
        const p=database(process.env.NFC_TEST_DATABASE_URL),key=randomUUID();
        await assert.rejects(persist(p,${JSON.stringify(lead())},key,{beforeOutbox:async c=>{await c.query("SET LOCAL idle_in_transaction_session_timeout='250ms'");await new Promise(r=>setTimeout(r,600));}}));
        assert.equal((await p.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1',[key])).rows[0].n,0);
        const gateway=createGateway(readConfig({}));assert.equal((await gateway(new Request('http://local/healthz'))).status,200);await p.end();`;
      const child = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', code], { cwd: new URL('..', import.meta.url), env: { NODE_ENV: 'test', PATH: process.env.PATH, NFC_TEST_DATABASE_URL: url }, encoding: 'utf8', timeout: 10000 });
      assert.equal(child.status, 0, 'checked-out disconnect must not crash gateway: ' + child.stderr);
      assert.ok(!child.stdout.includes('Synthetic'));
    });
    await t.test('maximum Unicode UTM accepted by validation persists without permanent 503', async () => {
      const input = lead(); input.utm = Object.fromEntries(['source','medium','campaign','term','content'].map(key => [key, 'я'.repeat(100)]));
      const receipt = await persist(pool, input, randomUUID(), { isTest: true }); ids.push(receipt.leadId);
      assert.equal(receipt.durableSaved, true);
    });
    await t.test('disabled dry-run persists but never sends even after enabling', async () => {
      const receipt = await save(false); let sends = 0;
      await drain(pool, { ...config, telegramEnabled: false }, async () => { sends++; return { status: 'sent' }; }, quiet);
      await drain(pool, config, async () => { sends++; return { status: 'sent' }; }, quiet);
      assert.equal(sends, 0); assert.equal((await row(receipt.leadId)).status, 'pending');
    });
    await t.test('Telegram rejection preserves lead and schedules bounded retry', async () => {
      const receipt = await save(); let sends = 0;
      await drain(pool, config, async () => { sends++; return { status: 'retry', category: 'rate_limit', retryAfter: 10 }; }, quiet);
      const saved = await row(receipt.leadId); assert.equal(saved.status, 'retry'); assert.equal(saved.attempt_count, 1);
      await drain(pool, config, async () => { sends++; return { status: 'sent' }; }, quiet); assert.equal(sends, 1);
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE lead_id=$1', [receipt.leadId])).rows[0].n, 1);
      await pool.query("UPDATE nfc_card.notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE lead_id=$1", [receipt.leadId]);
      // New OS process and fresh pool; fake sender only, no gateway credentials inherited.
      const code = `import {database} from './src/nfc-card/store.ts';import {drain} from './src/nfc-card/outbox.ts';const p=database(process.env.NFC_TEST_DATABASE_URL);await drain(p,{telegramEnabled:true,testOnly:false},async()=>({status:'sent'}),()=>{});await p.end();`;
      const child = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', code], { cwd: new URL('..', import.meta.url), env: { NODE_ENV: 'test', PATH: process.env.PATH, NFC_TEST_DATABASE_URL: url }, encoding: 'utf8' });
      assert.equal(child.status, 0, 'fresh-process dispatcher failed: ' + child.stderr); assert.equal((await row(receipt.leadId)).status, 'sent');
    });
    await t.test('expired in-flight delivery is reconciled without duplicate resend', async () => {
      const receipt = await save(); await pool.query("UPDATE nfc_card.notification_outbox SET status='sending',attempt_count=1,claimed_at=now()-interval '3 minutes' WHERE lead_id=$1", [receipt.leadId]);
      let sends = 0; await drain(pool, config, async () => { sends++; return { status: 'sent' }; }, quiet);
      assert.equal(sends, 0); assert.equal((await row(receipt.leadId)).safe_error_category, 'outcome_unknown');
    });
    await t.test('single-test allowlist sends exact test lead once, suppresses backlog and retries', async () => {
      const selected = await save(), other = await save(); let sends = 0;
      const only = { ...config, testOnly: true, testLeadId: selected.leadId };
      await drain(pool, only, async text => { sends++; assert.ok(text.includes(selected.leadId)); return { status: 'retry', category: 'upstream' }; }, quiet);
      await drain(pool, only, async () => { sends++; return { status: 'sent' }; }, quiet);
      assert.equal(sends, 1); assert.equal((await row(selected.leadId)).status, 'failed'); assert.equal((await row(other.leadId)).attempt_count, 0);
      await pool.query('UPDATE nfc_card.notification_outbox SET delivery_enabled=false WHERE lead_id=$1', [other.leadId]);
    });
    await t.test('public final test commits canonical quote and single outbox before one-shot delivery', async () => {
      const key=randomUUID(), now=Date.now(), input={...lead(),selection:{variant:'standard',quantity:'2'}};
      const handler=createNfcHandler(pool,{...config,publicIntake:true,finalTestKey:key},{now:()=>now,log:quiet});
      const send=()=>handler(new Request('http://local'+ENDPOINT,{method:'POST',headers:{Origin:ORIGIN,'Content-Type':'application/json','Idempotency-Key':key},
        body:JSON.stringify({...input,website:'',challenge:challenge(config.secret,input.sourcePage,now-3000)})}));
      const result=await send();assert.equal(result!.status,202);const receipt=await result!.json();ids.push(receipt.leadId);
      assert.equal(receipt.quote.amount,2600);assert.equal(receipt.durableSaved,true);
      const stored=(await pool.query('SELECT is_test,is_final_test,selection,price_quote FROM nfc_card.leads WHERE lead_id=$1',[receipt.leadId])).rows[0];
      assert.equal(stored.is_test,true);assert.equal(stored.is_final_test,true);assert.deepEqual(stored.selection,input.selection);assert.equal(stored.price_quote.amount,2600);
      let attempts=0;
      await drain(pool,config,async text=>{attempts++;assert.ok(text.startsWith('🧪 FINAL TEST — NFC CARD'));assert.equal((await row(receipt.leadId)).status,'sending');return {status:'sent'};},quiet);
      assert.equal((await (await send())!.json()).leadId,receipt.leadId);
      await drain(pool,config,async()=>{attempts++;return {status:'sent'};},quiet);
      assert.equal(attempts,1);assert.equal((await row(receipt.leadId)).status,'sent');
      assert.equal((await pool.query('SELECT count(*)::int AS n FROM nfc_card.notification_outbox WHERE lead_id=$1',[receipt.leadId])).rows[0].n,1);
    });
    await t.test('final test confirmed rejection is terminal even in live mode', async () => {
      const receipt=await persist(pool,lead(),randomUUID(),{isTest:true,isFinalTest:true,deliveryEnabled:true});ids.push(receipt.leadId);let sends=0;
      await drain(pool,config,async()=>{sends++;return {status:'retry',category:'upstream'};},quiet);
      await pool.query("UPDATE nfc_card.notification_outbox SET next_attempt_at=now()-interval '1 second' WHERE lead_id=$1",[receipt.leadId]);
      await drain(pool,config,async()=>{sends++;return {status:'sent'};},quiet);
      assert.equal(sends,1);assert.equal((await row(receipt.leadId)).status,'failed');
    });
    await t.test('sixth explicit failure is terminal and FK/status constraints hold', async () => {
      const receipt = await save(); await pool.query('UPDATE nfc_card.notification_outbox SET attempt_count=5 WHERE lead_id=$1', [receipt.leadId]);
      await drain(pool, config, async () => ({ status: 'retry', category: 'upstream' }), quiet);
      assert.equal((await row(receipt.leadId)).status, 'failed'); assert.equal((await row(receipt.leadId)).attempt_count, 6);
      await assert.rejects(pool.query("UPDATE nfc_card.notification_outbox SET status='garbage' WHERE lead_id=$1", [receipt.leadId]));
      await assert.rejects(pool.query('INSERT INTO nfc_card.notification_outbox(id,lead_id) VALUES($1,$2)', [randomUUID(), randomUUID()]));
    });
  } finally {
    // Only test-created IDs; no destructive schema operations or shared customer records.
    await pool.query('DELETE FROM nfc_card.notification_outbox WHERE lead_id=ANY($1::uuid[])', [ids]);
    await pool.query('DELETE FROM nfc_card.leads WHERE lead_id=ANY($1::uuid[]) AND is_test', [ids]);
    await pool.end();
  }
});
