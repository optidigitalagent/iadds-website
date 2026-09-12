// Run only in a private Railway shell. No request payloads, variables or errors are printed.
import { randomUUID } from 'node:crypto';
import { readNfcConfig } from '../src/nfc-card/config.ts';
import { database, inspect, migrate, persist } from '../src/nfc-card/store.ts';
import { parseNfcLead, UUID } from '../src/nfc-card/contract.ts';
const operation = process.argv[2];
let pool: ReturnType<typeof database> | undefined;
try {
  const config = readNfcConfig();
  if (!config) {
    if (operation !== 'migrate') throw new Error('not_configured');
    console.log(JSON.stringify({ nfc: 'not_configured', migrations: 'skipped' }));
  } else {
    pool = database(config.databaseUrl);
    if (operation === 'migrate' || operation === 'preflight') console.log(JSON.stringify(await migrate(pool, operation === 'preflight')));
    else if (operation === 'inspect') {
      const migrations = await pool.query('SELECT version,checksum FROM nfc_card.schema_migrations ORDER BY version');
      const indexes = await pool.query("SELECT indexname FROM pg_indexes WHERE schemaname='nfc_card' ORDER BY indexname");
      const statuses = await pool.query('SELECT status,delivery_enabled, count(*)::int AS count FROM nfc_card.notification_outbox GROUP BY status,delivery_enabled');
      console.log(JSON.stringify({ database: 'ok', ...(await inspect(pool)), migrations: migrations.rows, indexes: indexes.rows, statuses: statuses.rows,
        publicIntake: config.publicIntake, telegramEnabled: config.telegramEnabled, testOnly: config.testOnly, commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? null }));
    } else if (operation === 'seed-test' || operation === 'seed-dry-run') {
      // Fixed reserved test address; callers cannot inject real customer data into this operation.
      if (config.telegramEnabled) throw new Error('disable_delivery_before_seed');
      const key = process.argv[3], leadId = process.argv[4];
      if (!UUID.test(key || '') || !UUID.test(leadId || '')) throw new Error('uuid_required');
      const lead = parseNfcLead({ language: 'uk', product: 'review-card', quantity: 1, customerName: 'NFC QA Synthetic',
        contact: { preferredMethod: 'email', email: 'nfc-test@example.invalid' }, sourcePage: '/nfc-card-website/order', utm: { source: 'synthetic-qa' } });
      console.log(JSON.stringify(await persist(pool, lead, key, { leadId, isTest: true, deliveryEnabled: operation === 'seed-test' })));
    } else if (operation === 'receipt') {
      if (!UUID.test(process.argv[3] || '')) throw new Error('uuid_required');
      const result = await pool.query(`SELECT l.lead_id,l.is_test,o.status,o.delivery_enabled,o.attempt_count,o.safe_error_category,o.sent_at
        FROM nfc_card.leads l JOIN nfc_card.notification_outbox o USING(lead_id) WHERE l.lead_id=$1`, [process.argv[3]]);
      console.log(JSON.stringify(result.rows));
    } else if (operation === 'verify-rollback') {
      if (config.telegramEnabled) throw new Error('disable_delivery_for_verification');
      const key = randomUUID();
      const lead = parseNfcLead({ language: 'en', product: 'review-card', quantity: 1, customerName: 'Rollback Synthetic',
        contact: { preferredMethod: 'email', email: 'rollback@example.invalid' }, sourcePage: '/nfc-card-website/en/order' });
      let rejected = false;
      try { await persist(pool, lead, key, { isTest: true, beforeOutbox: async client => { await client.query('SELECT 1/0'); } }); } catch { rejected = true; }
      const rows = await pool.query('SELECT count(*)::int AS n FROM nfc_card.leads WHERE idempotency_key=$1', [key]);
      if (!rejected || rows.rows[0].n !== 0) throw new Error('rollback_failed');
      console.log(JSON.stringify({ rollback: 'passed', persistedRows: 0, telegramCalls: 0 }));
    } else throw new Error('unknown_operation');
  }
} catch { console.error(JSON.stringify({ ok: false, code: 'nfc_operation_failed' })); process.exitCode = 1; }
finally { await pool?.end(); }
