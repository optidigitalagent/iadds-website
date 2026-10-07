import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { parseNfcLead, challenge, ENDPOINT, ORIGIN } from '../src/nfc-card/contract.ts';
import { quote } from '../src/nfc-card/commerce.ts';
import { formatNfc } from '../src/nfc-card/format.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { database, migrate, persist } from '../src/nfc-card/store.ts';
import { drain } from '../src/nfc-card/outbox.ts';
import type { Pool } from 'pg';
import type { NfcConfig } from '../src/nfc-card/config.ts';

const pairs = { 'beauty-review-card': 'beauty_salon', 'restaurant-review-card': 'restaurant' } as const;
type SolutionId = keyof typeof pairs;
const approved = {
  uk: { scenario: 'Сценарій', beauty: 'Салон краси: робочі місця / reception', restaurant: 'Ресторан: столи / разом із рахунком',
    request: 'Тип звернення: Безкоштовний перший макет і рекомендації щодо розміщення',
    advice: 'Орієнтовна кількість: Потрібна порада; кількість і сума не погоджені' },
  en: { scenario: 'Use case', beauty: 'Beauty salon: treatment stations / reception', restaurant: 'Restaurant: tables / with the bill',
    request: 'Enquiry type: Free first mockup and placement recommendations',
    advice: 'Estimated quantity: Advice needed; quantity and total have not been agreed' },
  pl: { scenario: 'Zastosowanie', beauty: 'Salon urody: stanowiska / recepcja', restaurant: 'Restauracja: stoliki / z rachunkiem',
    request: 'Rodzaj zapytania: Pierwsza bezpłatna wizualizacja i propozycja rozmieszczenia',
    advice: 'Orientacyjna liczba kart: Potrzebna porada; liczba kart i kwota nie zostały uzgodnione' },
} as const;
const payload = (id: SolutionId, language: 'uk' | 'en' | 'pl', mode: '1' | '2' | 'more' | 'advice') => ({
  language, product: 'branded-review-card', ...(mode === 'advice' ? {} : { quantity: mode === 'more' ? 3 : Number(mode) }),
  customerName: 'Synthetic <Niche> QA', contact: { preferredMethod: 'email', email: 'niche-qa@example.invalid' },
  sourcePage: '/nfc-card-website' + (language === 'uk' ? '' : '/' + language) + '/solutions/' + id,
  selection: { variant: 'branded', quantity: mode },
  solution: { schemaVersion: 1, solution_id: id, niche: pairs[id], request_type: 'free_first_mockup' },
});

test('niche solution context is strictly allowlisted and locale/route bound', () => {
  for (const id of Object.keys(pairs) as SolutionId[]) for (const language of ['uk', 'en', 'pl'] as const) {
    for (const mode of ['1', '2', 'more', 'advice'] as const) {
      const lead = parseNfcLead(payload(id, language, mode));
      assert.equal(lead.solution?.solution_id, id);
      assert.equal(lead.solution?.niche, pairs[id]);
      const price = quote(lead);
      const message = formatNfc(lead, randomUUID(), new Date().toISOString());
      assert.ok(message.includes(approved[language].scenario + ': ' + approved[language][id === 'beauty-review-card' ? 'beauty' : 'restaurant']));
      assert.ok(message.includes(approved[language].request));
      assert.ok(message.includes('public_solution: ' + id));
      assert.equal(price.currency, language === 'pl' ? 'PLN' : 'UAH');
      assert.equal(price.amount, mode === '1' ? language === 'pl' ? 169 : 2000 : mode === '2' ? language === 'pl' ? 299 : 3600 : null);
      if (mode === 'advice') {
        assert.equal(price.status, 'consultation'); assert.equal(price.deposit, null); assert.equal(price.depositIncluded, false);
        assert.ok(message.includes('quantity_mode: need quantity advice'));
        assert.ok(message.includes(approved[language].advice));
        assert.ok(!message.includes('\nquantity: 0'));
        assert.ok(!message.includes('\nprice: 2000'));
      }
    }
  }
  const valid = payload('beauty-review-card', 'pl', 'advice');
  for (const patch of [
    { solution: { ...valid.solution, niche: 'restaurant' } },
    { solution: { ...valid.solution, solution_id: 'other' } },
    { solution: { ...valid.solution, request_type: 'purchase' } },
    { solution: { ...valid.solution, schemaVersion: 2 } },
    { solution: { ...valid.solution, extra: 'x' } },
    { product: 'review-card' }, { sourcePage: '/nfc-card-website/en/solutions/beauty-review-card' },
    { sourcePage: '/nfc-card-website/pl/solutions/restaurant-review-card' },
    { selection: { variant: 'standard', quantity: 'advice' } }, { quantity: 1 },
    { price: 169 }, { currency: 'PLN' }, { deposit: 20 },
  ]) assert.throws(() => parseNfcLead({ ...valid, ...patch }));
  assert.throws(() => parseNfcLead({ ...valid, solution: undefined }));
  assert.throws(() => parseNfcLead({ ...valid, selection: { variant: 'branded', quantity: 'more' } }));
});

test('public intake accepts niche context without a number or payment', async () => {
  const secret = randomBytes(32).toString('hex'), now = Date.now(), id = randomUUID();
  const config: NfcConfig = { secret, databaseUrl: '', publicIntake: true, telegramEnabled: false, testOnly: true };
  const handler = createNfcHandler({} as Pool, config, { now: () => now, log: () => {}, save: async lead => {
    assert.equal(lead.solution?.solution_id, 'restaurant-review-card');
    return { ok: true, source: 'NFC_CARD', leadId: id, durableSaved: true, notificationStatus: 'disabled', quote: quote(lead) };
  } });
  const source = payload('restaurant-review-card', 'en', 'advice');
  const body = { ...source, website: '', challenge: challenge(secret, source.sourcePage, now - 3000) };
  const response = await handler(new Request('http://local' + ENDPOINT, { method: 'POST', headers: {
    Origin: ORIGIN, 'Content-Type': 'application/json', 'Idempotency-Key': id }, body: JSON.stringify(body) }));
  assert.equal(response?.status, 202);
  const receipt = await response!.json();
  assert.equal(receipt.quote.amount, null); assert.equal(receipt.quote.deposit, null);
});

test('PostgreSQL niche persistence, idempotency and outbox replay', { skip: !process.env.NFC_TEST_DATABASE_URL }, async () => {
  const url = process.env.NFC_TEST_DATABASE_URL!;
  const parsed = new URL(url);
  if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw new Error('isolated_local_test_database_required');
  const pool = database(url), ids: string[] = [];
  try {
    assert.equal((await migrate(pool)).version, '009_mini_products');
    for (const id of Object.keys(pairs) as SolutionId[]) for (const language of ['uk', 'pl'] as const) {
      const mode = id === 'beauty-review-card' ? '1' : 'advice';
      const lead = parseNfcLead(payload(id, language, mode)), key = randomUUID();
      const first = await persist(pool, lead, key, { deliveryEnabled: true, isTest: true }); ids.push(first.leadId);
      const stored = (await pool.query('SELECT solution,selection,quantity,price_quote FROM nfc_card.leads WHERE lead_id=$1', [first.leadId])).rows[0];
      assert.deepEqual(stored.solution, lead.solution); assert.deepEqual(stored.selection, lead.selection);
      assert.equal(stored.quantity, mode === 'advice' ? 0 : 1);
      assert.deepEqual(stored.price_quote, first.quote);
      if (mode === '1') {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query("UPDATE nfc_card.leads SET price_quote=jsonb_set(jsonb_set(price_quote,'{amount}','2101'::jsonb),'{deposit}','21'::jsonb) WHERE lead_id=$1", [first.leadId]);
          const changed = (await client.query('SELECT price_quote FROM nfc_card.leads WHERE lead_id=$1', [first.leadId])).rows[0].price_quote;
          assert.equal(changed.amount, 2101); assert.equal(changed.deposit, 21);
        } finally { await client.query('ROLLBACK'); client.release(); }
      }
      await assert.rejects(pool.query("UPDATE nfc_card.leads SET solution=jsonb_set(solution,'{niche}','\"unknown\"'::jsonb) WHERE lead_id=$1", [first.leadId]));
      await assert.rejects(pool.query("UPDATE nfc_card.leads SET price_quote=jsonb_set(price_quote,'{amount}','1'::jsonb) WHERE lead_id=$1", [first.leadId]));
      if (mode === 'advice') await assert.rejects(pool.query('UPDATE nfc_card.leads SET quantity=1 WHERE lead_id=$1', [first.leadId]));
      assert.equal((await persist(pool, lead, key)).leadId, first.leadId);
      const changed = parseNfcLead(payload(id === 'beauty-review-card' ? 'restaurant-review-card' : 'beauty-review-card', language, mode));
      await assert.rejects(persist(pool, changed, key), { status: 409, message: 'idempotency_conflict' });
    }
    const config: NfcConfig = { secret: randomBytes(32).toString('hex'), databaseUrl: url, publicIntake: false, telegramEnabled: true, testOnly: true };
    const sent: string[] = [];
    for (const id of ids) await drain(pool, { ...config, testLeadId: id }, async text => { sent.push(text); return { status: 'sent' }; }, () => {});
    assert.equal(sent.length, 4);
    for (const text of sent) {
      assert.ok(text.includes('base_physical_product: branded-review-card'));
      assert.ok(text.includes('request_type: free_first_mockup'));
      assert.ok(text.includes('public_solution: ')); assert.ok(text.includes('scenario: '));
      if (text.includes('quantity_mode: need quantity advice')) assert.ok(!text.includes('\nquantity: 0'));
    }
  } finally {
    if (ids.length) await pool.query('DELETE FROM nfc_card.notification_outbox WHERE lead_id = ANY($1::uuid[])', [ids]);
    if (ids.length) await pool.query('DELETE FROM nfc_card.leads WHERE lead_id = ANY($1::uuid[])', [ids]);
    await pool.end();
  }
});
