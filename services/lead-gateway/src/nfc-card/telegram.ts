import type { GatewayConfig } from '../config.ts';
import type {RoutingSender} from './order-routing.ts';
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
/** The existing outbox owns retries. One complete source document = one Telegram original. */
export function orderTelegram(config:GatewayConfig,transport:typeof fetch=fetch):RoutingSender {
 return async message=>{
  if(!config.token.startsWith('8722696590:')||!['-5441287655','-5531022071'].includes(message.chatId))return {status:'failed',category:'configuration'};
  const form=new FormData();form.set('chat_id',message.chatId);form.set('caption',message.caption);
  const command='/nfc_lead@skdfjeriobot',offset=message.caption.indexOf(command);
  if(offset>=0)form.set('caption_entities',JSON.stringify([{type:'bot_command',offset,length:command.length}]));
  form.set('document',new Blob([Buffer.from(message.bytes)],{type:'application/json'}),message.fileName);
  try{
   const r=await transport('https://api.telegram.org/bot'+config.token+'/sendDocument',{method:'POST',redirect:'error',signal:AbortSignal.timeout(config.apiTimeoutMs),body:form});
   const b=await r.json().catch(()=>null);
   if(r.status===200&&b?.ok===true&&Number.isSafeInteger(b.result?.message_id)&&b.result.message_id>0&&String(b.result?.chat?.id)===message.chatId&&typeof b.result?.document?.file_unique_id==='string')
    return {status:'sent',messageId:b.result.message_id,chatId:message.chatId,documentUniqueId:b.result.document.file_unique_id};
   if(b?.ok===false&&b.error_code===429)return {status:'retry',category:'rate_limit',retryAfter:Math.min(86400,Math.max(1,Number(b.parameters?.retry_after)||60))};
   if(b?.ok===false&&[400,401,403,404].includes(b.error_code))return {status:'failed',category:'configuration'};
   if(b?.ok===false&&b.error_code>=500&&b.error_code<=599)return {status:'retry',category:'upstream'};
  }catch{ /* Network errors may have delivered; never blindly repeat. */ }
  return {status:'failed',category:'outcome_unknown'};
 };
}
