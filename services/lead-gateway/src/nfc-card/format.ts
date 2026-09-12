import type { NfcLead } from './contract.ts';
export function escapeHtml(value: string): string { return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'); }
export function formatNfc(lead: NfcLead, leadId: string, timestamp: string, isTest = false): string {
  const fields: [string, string | number | undefined][] = [['source', 'NFC_CARD'], ['lead_id', leadId], ['language', lead.language],
    ['product', lead.product], ['quantity', lead.quantity], ['customer_name', lead.customerName], ['preferred_contact', lead.contact.preferredMethod],
    ['phone', lead.contact.phone], ['email', lead.contact.email], ['telegram', lead.contact.telegram], ['timestamp', timestamp],
    ['source_page', lead.sourcePage], ['utm', Object.keys(lead.utm).length ? JSON.stringify(lead.utm) : undefined]];
  return (isTest ? '🧪 TEST — NFC CARD' : '🆕 Нова заявка — NFC CARD') + '\n\n' +
    fields.filter(([, value]) => value !== undefined && value !== '').map(([key, value]) => key + ': ' + escapeHtml(String(value))).join('\n');
}
