import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { parseNfcLead } from '../src/nfc-card/contract.ts';
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
    await t.test('migration preflight rolls back, apply is checksummed and repeatable', async () => {
      const preflight = await migrate(pool, true); assert.equal(preflight.applied, false);
      const first = await migrate(pool); const second = await migrate(pool);
      assert.equal(first.checksum, second.checksum); assert.equal(second.applied, false);
      const tables = await pool.query("SELECT tablename FROM pg_tables WHERE schemaname='nfc_card'");
      assert.deepEqual(tables.rows.map(x => x.tablename).sort(), ['leads', 'notification_outbox', 'schema_migrations']);
      const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname='nfc_card'");
      assert.ok(indexes.rows.some(x => x.indexname === 'nfc_card_outbox_due'));
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
      assert.equal(child.status, 0, 'checked-out disconnect must not crash gateway');
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
      assert.equal(child.status, 0, 'fresh-process dispatcher failed'); assert.equal((await row(receipt.leadId)).status, 'sent');
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
