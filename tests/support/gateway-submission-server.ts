import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { handleConsultation } from '../../src/lib/consultation/handler';
import { WebhookSubmissionProvider } from '../../src/lib/consultation/provider';
import { readConfig } from '../../services/lead-gateway/src/config';
import { createGateway } from '../../services/lead-gateway/src/gateway';
import { telegramSender } from '../../services/lead-gateway/src/telegram';

// Local-only integration fixture: actual route + provider + gateway + mocked Telegram transport.
// It cannot use a production token, and it never persists payloads.
if (process.env.NODE_ENV !== 'test') throw new Error('Local test fixture only');
const secret = randomBytes(32).toString('hex');
http.createServer(async (incoming, outgoing) => {
  try {
    const pathname = incoming.url ?? '/'; let response: Response;
    if (pathname === '/api/consultation' && incoming.method === 'POST') {
      const buffers: Buffer[] = []; let bytes = 0;
      for await (const chunk of incoming) { const data = Buffer.from(chunk); bytes += data.length; if (bytes > 16384) { outgoing.writeHead(413); outgoing.end(); return; } buffers.push(data); }
      const failure = incoming.headers['x-qa-gateway-failure'];
      const config = { ...readConfig({ LEAD_SOURCE_IADDS_SECRET: secret }), token: 'synthetic-adapter-token', chatId: '1234' };
      const send = telegramSender(config, { transport: async () => failure ? Response.json({ ok: false, error_code: Number(failure) }, { status: Number(failure) })
        : Response.json({ ok: true, result: { message_id: 1, chat: { id: 1234 } } }), sleep: async () => {} });
      const gateway = createGateway(config, { send, log: () => {} });
      const provider = new WebhookSubmissionProvider('https://gateway.example/v1/leads', secret,
        async (url, init) => gateway(new Request(String(url), init)), async () => [{ address: '8.8.8.8' }]);
      const headers = new Headers();
      for (const [key, value] of Object.entries(incoming.headers)) if (value) headers.set(key, Array.isArray(value) ? value.join(',') : value);
      response = await handleConsultation(new Request('http://127.0.0.1:3102/api/consultation', { method: 'POST', headers, body: new Uint8Array(Buffer.concat(buffers)) }), () => provider);
    } else if (incoming.method === 'GET' || incoming.method === 'HEAD') response = await fetch('http://127.0.0.1:3100' + pathname, { redirect: 'manual' });
    else { outgoing.writeHead(405); outgoing.end(); return; }
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => { if (!['content-encoding', 'content-length', 'transfer-encoding', 'connection'].includes(key)) headers[key] = value; });
    const body = Buffer.from(await response.arrayBuffer()); outgoing.writeHead(response.status, { ...headers, 'Content-Length': body.length }); outgoing.end(body);
  } catch { outgoing.writeHead(503); outgoing.end('Test fixture unavailable'); }
}).listen(3102, '127.0.0.1');
