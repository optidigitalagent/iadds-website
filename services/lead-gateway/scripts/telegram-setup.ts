// Run once in a protected environment containing TELEGRAM_BOT_TOKEN. No token argument or files.
export {};
const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) { console.error('TELEGRAM_BOT_TOKEN is not configured in this environment.'); process.exitCode = 1; }
else {
  async function call(method: string) {
    const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, { method: 'POST', redirect: 'error',
      headers: { 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(8000) });
    const result = await response.json();
    if (!response.ok || result.ok !== true) throw new Error('telegram_setup_failed');
    return result.result;
  }
  try {
    await call('getMe');
    const webhook = await call('getWebhookInfo');
    if (webhook.url) console.log('An incoming webhook is active. It was preserved. Obtain the personal chat ID from the existing owner-approved configuration.');
    else {
      const updates = await call('getUpdates');
      const candidates = new Map<string, { chatId: string; type: 'private'; displayName: string }>();
      for (const update of updates) {
        const chat = update.message?.chat;
        if (chat?.type === 'private' && update.message?.text === '/start') candidates.set(String(chat.id), {
          chatId: String(chat.id), type: 'private', displayName: String(chat.first_name || 'Personal chat').replace(/[\x00-\x1f\x7f]/g, '').slice(0, 40) });
      }
      console.log(JSON.stringify({ candidates: [...candidates.values()] }));
      console.log('Ask the owner to confirm the intended personal chat before setting TELEGRAM_CHAT_ID.');
    }
  } catch { console.error('Telegram setup failed. Check the secret and /start privately; no response or token was logged.'); process.exitCode = 1; }
}
