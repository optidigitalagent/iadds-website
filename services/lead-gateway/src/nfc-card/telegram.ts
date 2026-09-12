import type { GatewayConfig } from '../config.ts';
export type Delivery = { status: 'sent' } | { status: 'retry' | 'failed'; category: 'rate_limit' | 'upstream' | 'configuration' | 'outcome_unknown'; retryAfter?: number };
export type NfcSender = (text: string) => Promise<Delivery>;
export function nfcTelegram(config: GatewayConfig, transport: typeof fetch = fetch): NfcSender {
  return async text => {
    if (!config.token || !config.chatId) return { status: 'failed', category: 'configuration' };
    try {
      // Exactly one HTTP attempt. Durable outbox owns retry timing, never this transport.
      const response = await transport(`https://api.telegram.org/bot${config.token}/sendMessage`, { method: 'POST', redirect: 'error',
        signal: AbortSignal.timeout(config.apiTimeoutMs), headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true },
          ...(config.threadId ? { message_thread_id: config.threadId } : {}) }) });
      const body = await response.json().catch(() => null);
      if (response.status === 200 && body?.ok === true && Number.isSafeInteger(body.result?.message_id) && body.result.message_id > 0 && String(body.result?.chat?.id) === config.chatId) return { status: 'sent' };
      // Retry only explicit negative Telegram responses. Timeout/invalid receipt may have delivered.
      if (body?.ok === false && body.error_code === 429) return { status: 'retry', category: 'rate_limit', retryAfter: Math.min(86400, Math.max(1, Number(body.parameters?.retry_after) || 60)) };
      if (body?.ok === false && [400, 401, 403, 404].includes(body.error_code)) return { status: 'failed', category: 'configuration' };
      if (body?.ok === false && body.error_code >= 500 && body.error_code <= 599) return { status: 'retry', category: 'upstream' };
    } catch { /* Never log token-bearing network exceptions or retry an ambiguous send. */ }
    return { status: 'failed', category: 'outcome_unknown' };
  };
}
