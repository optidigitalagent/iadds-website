import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { readConfig } from './config.ts';
import { createGateway } from './gateway.ts';
import { safeLog } from './logger.ts';

try {
  const config = readConfig(); const handle = createGateway(config);
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
  server.listen(port, '0.0.0.0');
  const stop = () => { server.close(() => process.exit(0)); setTimeout(() => { server.closeAllConnections(); process.exit(1); }, 12_000).unref(); };
  process.once('SIGTERM', stop); process.once('SIGINT', stop);
} catch { safeLog({ status: 503, category: 'configuration' }); process.exitCode = 1; }
