import { quote, type Quote } from './commerce.ts';
import type { NfcLead } from './contract.ts';
export function escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
export function formatNfc(lead: NfcLead, leadId: string, timestamp: string, isTest = false, finalTest = false, priceQuote: Quote = quote(lead)): string {
  const money = (amount: number | null) => amount === null ? undefined : amount + ' ' + priceQuote.currency;
  const customQuote = priceQuote.currency === 'PLN' ? 'custom quote (PLN)' : 'custom quote';
  const fields: [string, string | number | undefined][] = [['source', 'NFC_CARD'], ['lead_id', leadId], ['language', lead.language],
    ['product', lead.selection && ['bulk', 'consultation'].includes(lead.selection.variant) ? lead.selection.variant : lead.product],
    ['quantity', lead.menu?.intent === 'menu_consultation' || lead.selection?.quantity === 'advice' ? undefined : lead.selection?.quantity === 'more' ? '3+' : lead.quantity],
    ['quantity_mode', lead.selection?.quantity === 'advice' ? 'need quantity advice' : undefined],
    ['price', priceQuote.status === 'custom' ? customQuote : priceQuote.status === 'consultation' ? 'consultation only' : money(priceQuote.amount)], ['customer_name', lead.customerName], ['preferred_contact', lead.contact.preferredMethod],
    ['phone', lead.contact.phone], ['email', lead.contact.email], ['telegram', lead.contact.telegram], ['timestamp', timestamp],
    ['source_page', lead.sourcePage], ['utm', Object.keys(lead.utm).length ? JSON.stringify(lead.utm) : undefined]];
  if (lead.solution) fields.push(['public_solution', lead.solution.solution_id], ['base_physical_product', 'branded-review-card'],
    ['scenario', lead.solution.niche], ['request_type', lead.solution.request_type]);
  if (lead.instagram) fields.push(['product_schema_version', lead.instagram.productSchemaVersion], ['product_id', lead.instagram.product_id],
    ['sku', lead.instagram.sku], ['offer', lead.instagram.offer], ['instagram_url', lead.instagram.instagramUrl],
    ['consent', String(lead.instagram.consent)], ['comment', lead.instagram.comment]);
  if (lead.review3d) {
    fields.push(['product_schema_version', lead.review3d.productSchemaVersion], ['product_id', lead.review3d.product_id],
      ['design', lead.review3d.design], ['google_location_url', lead.review3d.google_location_url],
      ['consent', String(lead.review3d.consent)], ['comment', lead.review3d.comment]);
    if ('unitPrice' in priceQuote) fields.push(['unit_price', money(priceQuote.unitPrice)],
      ['deposit', money(priceQuote.deposit)], ['balance', money(priceQuote.balance)]);
  }
  if (lead.menu) {
    fields.push(['product_schema_version', lead.menu.productSchemaVersion], ['product_id', lead.menu.product_id],
      ['intent', lead.menu.intent], ['menu_status', lead.menu.menu_status], ['menu_url', lead.menu.menu_url],
      ['items', lead.menu.items.length ? JSON.stringify(lead.menu.items) : undefined], ['consent', String(lead.menu.consent)],
      ['comment', lead.menu.comment]);
    if (lead.menu.intent === 'card_order' && 'unitPrice' in priceQuote) fields.push(['unit_price', money(priceQuote.unitPrice)],
      ['deposit', money(priceQuote.deposit)], ['balance', money(priceQuote.balance)]);
  }
  return (isTest && finalTest ? '🧪 FINAL TEST — NFC CARD' : isTest ? '🧪 TEST — NFC CARD' : '🆕 Нова заявка — NFC CARD') + '\n\n' +
    fields.filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => key + ': ' + escapeHtml(String(value))).join('\n');
}
