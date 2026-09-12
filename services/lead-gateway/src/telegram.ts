import type { GatewayConfig } from './config.ts';

export class DeliveryError extends Error {
  readonly status: number; readonly category: string; readonly retries: number;
  constructor(status: number, category: string, retries = 0) {
    super(category); this.status = status; this.category = category; this.retries = retries;
  }
}
export type TelegramOptions = { transport?: typeof fetch; sleep?: (ms: number) => Promise<void>; now?: () => number; random?: () => number };
export function telegramSender(config: GatewayConfig, options: TelegramOptions = {}) {
  const transport = options.transport ?? fetch, now = options.now ?? Date.now;
  const sleep = options.sleep ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
  return async (text: string, deadline: number): Promise<number> => {
    if (!config.token || !config.chatId) throw new DeliveryError(503, 'configuration');
    for (let attempt = 0; attempt < 3; attempt++) {
      let category = 'network', retryAfter = 0;
      const remaining = deadline - now();
      if (remaining <= 0) throw new DeliveryError(502, 'network', attempt);
      try {
        const response = await transport(`https://api.telegram.org/bot${config.token}/sendMessage`, {
          method: 'POST', redirect: 'error', signal: AbortSignal.timeout(Math.min(config.apiTimeoutMs, remaining)),
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'HTML', link_preview_options: { is_disabled: true },
            ...(config.threadId ? { message_thread_id: config.threadId } : {}) }),
        });
        const body = await response.json().catch(() => null);
        if (response.status === 200 && body?.ok === true && Number.isSafeInteger(body.result?.message_id) && body.result.message_id > 0
          && String(body.result?.chat?.id) === config.chatId) return attempt;
        const code = Number(body?.error_code) || response.status;
        if ([400, 401, 403, 404].includes(code)) throw new DeliveryError(503, 'configuration', attempt);
        if (code === 429) {
          category = 'rate_limit';
          const seconds = Number(body?.parameters?.retry_after);
          retryAfter = Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds * 1000) : 1000;
        } else if (code >= 500 && code <= 599) category = 'upstream';
        else throw new DeliveryError(502, 'invalid_response', attempt);
      } catch (error) {
        if (error instanceof DeliveryError) throw error;
        // Deliberately discard fetch errors: they may contain the token in the request URL.
      }
      if (attempt === 2) throw new DeliveryError(502, category, attempt);
      const delay = Math.max(retryAfter, 150 * 2 ** attempt + Math.floor((options.random ?? Math.random)() * 100));
      if (delay + 100 >= deadline - now()) throw new DeliveryError(502, category, attempt);
      await sleep(delay);
    }
    throw new DeliveryError(502, 'upstream', 2);
  };
}
