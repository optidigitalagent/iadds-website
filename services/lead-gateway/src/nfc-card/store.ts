import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { Pool, type PoolClient } from 'pg';
import { NfcError, type NfcLead } from './contract.ts';
import { nfcLog } from './logger.ts';

export function database(url: string): Pool {
  const pool = new Pool({ connectionString: url, max: 4, connectionTimeoutMillis: 3000, idleTimeoutMillis: 10000,
    statement_timeout: 8000, idle_in_transaction_session_timeout: 10000, application_name: 'nfc-card-gateway' });
  pool.on('error', () => nfcLog({ category: 'database', status: 503 }));
  // pg-pool removes its own idle listener on checkout. Keep a safe listener on
  // each client so asynchronous disconnects inside a transaction cannot crash iADDS.
  pool.on('connect', client => client.on('error', () => nfcLog({ category: 'database', status: 503 })));
  return pool;
}
export async function migrate(pool: Pool, preflight = false): Promise<{ version: string; checksum: string; applied: boolean }> {
  const sql = await readFile(new URL('../../migrations/nfc-card/001_nfc_card.sql', import.meta.url), 'utf8');
  const checksum = createHash('sha256').update(sql).digest('hex'), version = '001_nfc_card';
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SELECT pg_advisory_xact_lock(174813, 1)");
    const server = await client.query('SHOW server_version_num');
    if (Number(server.rows[0].server_version_num) < 170000 || Number(server.rows[0].server_version_num) >= 180000) throw new Error('postgres_17_required');
    await client.query('CREATE SCHEMA IF NOT EXISTS nfc_card');
    await client.query('CREATE TABLE IF NOT EXISTS nfc_card.schema_migrations (version text PRIMARY KEY, checksum char(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())');
    const existing = await client.query('SELECT checksum FROM nfc_card.schema_migrations WHERE version=$1', [version]);
    if (existing.rowCount && existing.rows[0].checksum !== checksum) throw new Error('migration_checksum_mismatch');
    if (!existing.rowCount) {
      await client.query(sql);
      await client.query('INSERT INTO nfc_card.schema_migrations(version,checksum) VALUES ($1,$2)', [version, checksum]);
    }
    await client.query(preflight ? 'ROLLBACK' : 'COMMIT');
    return { version, checksum, applied: !preflight && !existing.rowCount };
  } catch { await client.query('ROLLBACK').catch(() => {}); throw new Error('migration_failed'); }
  finally { client.release(); }
}
export type Receipt = { ok: true; source: 'NFC_CARD'; leadId: string; durableSaved: true; notificationStatus: 'queued' | 'disabled' };
export type PersistOptions = { deliveryEnabled?: boolean; isTest?: boolean; leadId?: string; beforeOutbox?: (client: PoolClient) => Promise<void> };
export async function persist(pool: Pool, lead: NfcLead, key: string, options: PersistOptions = {}): Promise<Receipt> {
  // Canonical parser constructs stable field/key order. Challenge/timestamp never enter this digest.
  const digest = createHash('sha256').update(JSON.stringify(lead)).digest('hex');
  const leadId = options.leadId ?? randomUUID(), client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(`INSERT INTO nfc_card.leads
      (id,lead_id,language,product,quantity,customer_name,phone,email,telegram,preferred_contact,source_page,utm,idempotency_key,request_digest,is_test)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) ON CONFLICT (idempotency_key) DO NOTHING RETURNING lead_id`,
    [randomUUID(), leadId, lead.language, lead.product, lead.quantity, lead.customerName, lead.contact.phone, lead.contact.email,
      lead.contact.telegram, lead.contact.preferredMethod, lead.sourcePage, lead.utm, key, digest, options.isTest === true]);
    if (!inserted.rowCount) {
      const saved = await client.query(`SELECT l.lead_id, l.request_digest, o.delivery_enabled FROM nfc_card.leads l
        JOIN nfc_card.notification_outbox o USING(lead_id) WHERE l.idempotency_key=$1`, [key]);
      if (saved.rowCount !== 1) throw new Error('database');
      if (saved.rows[0].request_digest !== digest) throw new NfcError(409, 'idempotency_conflict');
      await client.query('COMMIT');
      return receipt(saved.rows[0].lead_id, saved.rows[0].delivery_enabled);
    }
    await options.beforeOutbox?.(client);
    await client.query('INSERT INTO nfc_card.notification_outbox(id,lead_id,delivery_enabled) VALUES ($1,$2,$3)', [randomUUID(), leadId, options.deliveryEnabled === true]);
    await client.query('COMMIT');
    return receipt(leadId, options.deliveryEnabled === true);
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); if (error instanceof NfcError) throw error; throw new NfcError(503, 'storage_unavailable'); }
  finally { client.release(); }
}
function receipt(leadId: string, enabled: boolean): Receipt { return { ok: true, source: 'NFC_CARD', leadId, durableSaved: true, notificationStatus: enabled ? 'queued' : 'disabled' }; }
export async function inspect(pool: Pool) {
  const result = await pool.query(`SELECT (SELECT count(*)::int FROM nfc_card.leads) AS leads,
    (SELECT count(*)::int FROM nfc_card.notification_outbox) AS outbox,
    (SELECT count(*)::int FROM nfc_card.notification_outbox WHERE status='sent') AS sent`);
  return result.rows[0];
}
