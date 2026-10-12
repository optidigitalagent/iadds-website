/** Loopback-only staging harness for the real public form and signed read feed. */
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readNfcConfig } from '../src/nfc-card/config.ts';
import { createNfcHandler } from '../src/nfc-card/handler.ts';
import { database, migrate } from '../src/nfc-card/store.ts';

const url = process.env.NFC_TEST_DATABASE_URL || '';
const parsed = new URL(url);
if (!['localhost', '127.0.0.1'].includes(parsed.hostname) || !parsed.pathname.endsWith('_test')) throw Error('isolated_staging_database_required');
const config = readNfcConfig({ LEAD_SOURCE_NFC_CARD_SECRET: process.env.NFC_STAGE_INTAKE_SECRET,
  LEAD_SOURCE_NFC_CARD_LABEL: 'NFC CARD', NFC_DATABASE_URL: url, NFC_PUBLIC_INTAKE_ENABLED: 'true',
  NFC_TELEGRAM_ENABLED: 'false', NFC_INBOUND_READ_SECRET: process.env.NFC_INBOUND_READ_SECRET });
if (!config?.inboundReadSecret) throw Error('staging_read_secret_required');
const pool = database(url);
await migrate(pool);
const handle = createNfcHandler(pool, config);
const port = Number(process.env.NFC_STAGE_PORT || '55439');
const server = createServer(async (incoming, outgoing) => {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(incoming.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
    const body = incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : Readable.toWeb(incoming);
    const request = new Request('http://127.0.0.1:' + port + (incoming.url || '/'), {
      method: incoming.method, headers, body, ...(body ? { duplex: 'half' } : {}) } as RequestInit);
    const response = await handle(request) ?? Response.json({ code: 'not_found' }, { status: 404 });
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  } catch { outgoing.writeHead(500); outgoing.end(); }
});
server.listen(port, '127.0.0.1', () => console.log('STAGING_READY'));
const stop = async () => { server.close(); await pool.end(); };
process.once('SIGINT', () => { void stop(); });
process.once('SIGTERM', () => { void stop(); });
