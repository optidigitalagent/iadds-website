import type { Lead } from './schema.ts';
import { normalizePhone } from './contact.ts';

export function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}
function chunks(value: string, max = 3200): string[] {
  const result: string[] = []; let part = '';
  for (const character of value) {
    const escaped = escapeHtml(character);
    if (part.length + escaped.length > max) { result.push(part); part = ''; }
    part += escaped;
  }
  if (part) result.push(part);
  return result;
}
export function formatLead(lead: Lead, label: string): string[] {
  const v2 = lead.formSchemaVersion === 2;
  const phone = v2 ? lead.phoneNormalized : normalizePhone(lead.contactMethod);
  const preferred = v2 ? lead.preferredContact : phone ? 'phone' : lead.contactMethod ? 'telegram' : 'email';
  const contactLabels = { phone: 'Телефонний дзвінок', telegram: 'Telegram', email: 'Email' };
  const isTest = lead.fullName === 'Test Lead' && (v2 ? phone === '+12025550123' : lead.company === 'iADDS QA' && lead.email === 'test@example.com' && lead.message.startsWith('Backend delivery test — no response required'));
  const heading = isTest ? `🧪 TEST — ${label} lead delivery` : `🆕 Нова заявка — ${label}`;
  const lines = [escapeHtml(heading), '', `ID: ${escapeHtml(lead.referenceId)}`, `Ім’я: ${escapeHtml(lead.fullName)}`,
    `Телефон: ${escapeHtml(phone || 'не вказано у старій формі')}`, `Зв’язатися через: ${contactLabels[preferred]}`,
    `Напрям: ${escapeHtml(lead.selectedService)}`, `Мова: ${lead.communicationLanguage === 'uk' ? 'Українська' : 'English'}`,
    `Мова сайту: ${lead.currentLocale}`, `Сторінка: ${escapeHtml(lead.sourcePage)}`, `Дата: ${escapeHtml(lead.submittedAt)} (UTC)`];
  if (!v2 && lead.contactMethod && !phone) lines.push(`Контакт (стара форма): ${escapeHtml(lead.contactMethod)}`);
  if (lead.email) lines.push(`Email: ${escapeHtml(lead.email)}`);
  if (lead.company) lines.push(`Компанія / проєкт: ${escapeHtml(lead.company)}`);
  if (lead.companyUrl) lines.push(`Сайт: ${escapeHtml(lead.companyUrl)}`);
  if (lead.collaborationModel) lines.push(`Модель співпраці: ${escapeHtml(lead.collaborationModel)}`);
  // Contact fields stay first. Split escaped text only at character boundaries, never inside an entity.
  const contacts = lines.join('\n');
  const objective = escapeHtml(lead.message || '');
  const status = isTest ? 'Статус: тест — відповідь не потрібна' : 'Статус: потребує відповіді';
  const combined = `${contacts}${objective ? `\n\nКоментар:\n${objective}` : ''}\n\n${status}`;
  if (combined.length <= 3900) return [combined];
  const contactParts: string[] = []; let contactPart = '';
  for (const line of lines) {
    if (contactPart.length + line.length + 1 > 3500) { contactParts.push(contactPart); contactPart = `ID: ${escapeHtml(lead.referenceId)}\n`; }
    contactPart += line + '\n';
  }
  if (contactPart) contactParts.push(contactPart.trimEnd());
  return [...contactParts, ...chunks(lead.message || '').map((part, index) => `${escapeHtml(heading)}\nID: ${escapeHtml(lead.referenceId)}\nКоментар (${index + 1}):\n${part}\n\n${status}`)];
}
