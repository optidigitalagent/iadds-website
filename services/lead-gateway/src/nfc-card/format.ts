import { quote, type Quote } from './commerce.ts';
import type { NfcLead } from './contract.ts';
export function escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
export function formatNfc(lead: NfcLead, leadId: string, timestamp: string, isTest = false, finalTest = false, priceQuote: Quote = quote(lead)): string {
  const fields: [string, string | number | undefined][] = [['source', 'NFC_CARD'], ['lead_id', leadId], ['language', lead.language],
    ['product', lead.selection && ['bulk', 'consultation'].includes(lead.selection.variant) ? lead.selection.variant : lead.product],
    ['quantity', lead.menu?.intent === 'menu_consultation' ? undefined : lead.selection?.quantity === 'more' ? '3+' : lead.quantity],
    ['price', priceQuote.status === 'custom' ? 'custom quote' : priceQuote.status === 'consultation' ? 'consultation only' : priceQuote.amount + ' UAH'], ['customer_name', lead.customerName], ['preferred_contact', lead.contact.preferredMethod],
    ['phone', lead.contact.phone], ['email', lead.contact.email], ['telegram', lead.contact.telegram], ['timestamp', timestamp],
    ['source_page', lead.sourcePage], ['utm', Object.keys(lead.utm).length ? JSON.stringify(lead.utm) : undefined]];
  if (lead.instagram) fields.push(['product_schema_version', lead.instagram.productSchemaVersion], ['product_id', lead.instagram.product_id],
    ['sku', lead.instagram.sku], ['offer', lead.instagram.offer], ['instagram_url', lead.instagram.instagramUrl],
    ['consent', String(lead.instagram.consent)], ['comment', lead.instagram.comment]);
  if (lead.menu) {
    fields.push(['product_schema_version', lead.menu.productSchemaVersion], ['product_id', lead.menu.product_id],
      ['intent', lead.menu.intent], ['menu_status', lead.menu.menu_status], ['menu_url', lead.menu.menu_url],
      ['items', lead.menu.items.length ? JSON.stringify(lead.menu.items) : undefined], ['consent', String(lead.menu.consent)],
      ['comment', lead.menu.comment]);
    if (lead.menu.intent === 'card_order' && 'unitPrice' in priceQuote) fields.push(['unit_price', priceQuote.unitPrice + ' UAH'],
      ['deposit', priceQuote.deposit + ' UAH'], ['balance', priceQuote.balance + ' UAH']);
  }
  return (isTest && finalTest ? '🧪 FINAL TEST — NFC CARD' : isTest ? '🧪 TEST — NFC CARD' : '🆕 Нова заявка — NFC CARD') + '\n\n' +
    fields.filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => key + ': ' + escapeHtml(String(value))).join('\n');
}
