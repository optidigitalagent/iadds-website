import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readConfig } from './config.ts';
import { createGateway } from './gateway.ts';
import { safeLog } from './logger.ts';
import { readNfcConfig } from './nfc-card/config.ts';
import { database } from './nfc-card/store.ts';
import { createNfcHandler } from './nfc-card/handler.ts';
import { dispatcher } from './nfc-card/outbox.ts';
import { nfcTelegram } from './nfc-card/telegram.ts';

try {
  const config = readConfig(), nfc = readNfcConfig();
  const pool = nfc ? database(nfc.databaseUrl) : undefined;
  // Existing iADDS health/delivery remain independent of an NFC runtime database outage.
  const handle = createGateway(config, { nfc: pool && nfc ? createNfcHandler(pool, nfc) : undefined });
  const stopDispatcher = pool && nfc ? dispatcher(pool, nfc, nfcTelegram(config)) : async () => {};
  const port = Number(process.env.PORT || 8080);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('invalid_gateway_configuration');
  const server = createServer({ maxHeaderSize: 8192, requestTimeout: 15_000, headersTimeout: 10_000 }, async (incoming, outgoing) => {
    try {
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(',') : value);
      const body = incoming.method === 'GET' || incoming.method === 'HEAD' ? undefined : Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
      const request = new Request('http://gateway.internal' + (incoming.url || '/'), { method: incoming.method, headers, body, ...(body ? { duplex: 'half' } : {}) } as RequestInit);
      const response = await handle(request);
      outgoing.writeHead(response.status, Object.fromEntries(response.headers)); outgoing.end(await response.text());
    } catch { if (!outgoing.headersSent) outgoing.writeHead(500, { 'Content-Type': 'application/json' }); outgoing.end('{"code":"unavailable"}'); }
  });
  server.maxConnections = 100;
  server.on('error', () => { safeLog({ status: 503, category: 'configuration' }); process.exitCode = 1; });
  server.listen(port, '::');
  const stop = () => {
    const closed = new Promise<void>(resolve => server.close(() => resolve()));
    void Promise.all([closed, stopDispatcher()]).then(async () => { await pool?.end(); process.exit(0); });
    setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 25000).unref();
  };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
} catch { safeLog({ status: 503, category: 'configuration' }); process.exitCode = 1; }
