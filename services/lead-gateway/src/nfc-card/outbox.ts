import type { Pool } from 'pg';
import type { NfcConfig } from './config.ts';
import { UUID, type NfcLead } from './contract.ts';
import { formatNfc } from './format.ts';
import { nfcLog } from './logger.ts';
import type { Delivery, NfcSender } from './telegram.ts';

export async function drain(pool: Pool, config: NfcConfig, send: NfcSender, log?: (line: string) => void): Promise<number> {
  if (!config.telegramEnabled) return 0;
  if (config.testOnly && !UUID.test(config.testLeadId || '')) throw new Error('test_allowlist_required');
  // A process may have died after Telegram accepted but before its receipt committed.
  // Never blindly resend an expired in-flight claim. Operators reconcile it by lead ID.
  await pool.query(`UPDATE nfc_card.notification_outbox SET status='failed',safe_error_category='outcome_unknown',updated_at=now()
    WHERE status='sending' AND claimed_at < now() - interval '2 minutes'`);
  let processed = 0;
  for (let i = 0; i < 5; i++) {
    const client = await pool.connect();
    let row;
    try {
      await client.query('BEGIN');
      const result = await client.query(`SELECT o.id,o.lead_id,o.attempt_count,l.language,l.product,l.quantity,l.customer_name,
        l.phone,l.email,l.telegram,l.preferred_contact,l.source_page,l.utm,l.created_at,l.is_test,l.is_final_test,l.selection,l.price_quote
        FROM nfc_card.notification_outbox o JOIN nfc_card.leads l USING(lead_id)
        WHERE o.delivery_enabled AND o.status IN ('pending','retry') AND o.next_attempt_at <= now()
        AND o.attempt_count < $1 AND (NOT l.is_final_test OR o.attempt_count < 1) AND ($2::uuid IS NULL OR (o.lead_id=$2 AND l.is_test))
        ORDER BY o.next_attempt_at,o.id LIMIT 1 FOR UPDATE OF o SKIP LOCKED`, [config.testOnly ? 1 : 6, config.testOnly ? config.testLeadId : null]);
      row = result.rows[0];
      if (row) await client.query("UPDATE nfc_card.notification_outbox SET status='sending',attempt_count=attempt_count+1,claimed_at=now(),updated_at=now() WHERE id=$1", [row.id]);
      await client.query('COMMIT');
    } catch { await client.query('ROLLBACK').catch(() => {}); throw new Error('outbox_database'); }
    finally { client.release(); }
    if (!row) break;
    const lead: NfcLead = { language: row.language, product: row.product, quantity: row.quantity, customerName: row.customer_name,
      contact: { preferredMethod: row.preferred_contact, ...(row.phone ? { phone: row.phone } : {}), ...(row.email ? { email: row.email } : {}), ...(row.telegram ? { telegram: row.telegram } : {}) }, sourcePage: row.source_page, utm: row.utm, ...(row.selection ? { selection: row.selection } : {}) };
    let outcome: Delivery;
    try { outcome = await send(formatNfc(lead, row.lead_id, row.created_at.toISOString(), row.is_test, row.is_final_test, row.price_quote || undefined)); }
    catch { outcome = { status: 'failed', category: 'outcome_unknown' }; }
    const attempt = row.attempt_count + 1;
    const status = outcome.status === 'retry' && (config.testOnly || row.is_final_test || attempt >= 6) ? 'failed' : outcome.status;
    const category = outcome.status === 'sent' ? null : status === 'failed' && outcome.status === 'retry' ? 'exhausted' : outcome.category;
    const delay = outcome.status === 'sent' ? 0 : Math.max(5 * 2 ** (attempt - 1), outcome.retryAfter ?? 0);
    await pool.query(`UPDATE nfc_card.notification_outbox SET status=$2,safe_error_category=$3,
      sent_at=CASE WHEN $2='sent' THEN now() ELSE NULL END,next_attempt_at=now()+($4 * interval '1 second'),updated_at=now()
      WHERE id=$1 AND status='sending'`, [row.id, status, category, delay]);
    processed++;
    nfcLog({ leadId: row.lead_id, category: status, retryCount: attempt - 1 }, log);
  }
  return processed;
}
export function dispatcher(pool: Pool, config: NfcConfig, send: NfcSender) {
  let active: Promise<unknown> | undefined, stopping = false;
  const tick = () => { if (!stopping && !active) active = drain(pool, config, send).catch(() => nfcLog({ category: 'database', status: 503 })).finally(() => { active = undefined; }); };
  const timer = setInterval(tick, 3000); timer.unref(); tick();
  return async () => { stopping = true; clearInterval(timer); await active; };
}
