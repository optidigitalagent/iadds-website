import type { Lead } from './schema.ts';

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
  const isTest = lead.fullName === 'Test Lead' && lead.company === 'iADDS QA' && lead.email === 'test@example.com'
    && lead.message.startsWith('Backend delivery test — no response required');
  const heading = isTest ? `🧪 TEST — ${label} lead delivery` : `🆕 Нова заявка — ${label}`;
  const lines = [escapeHtml(heading), '', `ID: ${lead.referenceId}`, `Дата: ${escapeHtml(lead.submittedAt)} (UTC)`,
    `Сайт: ${escapeHtml(label)}`, `Мова сайту: ${lead.currentLocale}`,
    `Мова спілкування: ${lead.communicationLanguage === 'uk' ? 'Українська' : 'English'}`,
    `Сторінка: ${escapeHtml(lead.sourcePage)}`, '', `Ім’я: ${escapeHtml(lead.fullName)}`, `Компанія / проєкт: ${escapeHtml(lead.company)}`];
  if (lead.role) lines.push(`Роль: ${escapeHtml(lead.role)}`);
  lines.push(`Email: ${escapeHtml(lead.email)}`);
  if (lead.contactMethod) lines.push(`Telegram / телефон: ${escapeHtml(lead.contactMethod)}`);
  lines.push(`Сайт / соціальні мережі: ${escapeHtml(lead.companyUrl)}`, '', `Послуга: ${escapeHtml(lead.selectedService)}`);
  if (lead.collaborationModel) lines.push(`Модель співпраці: ${escapeHtml(lead.collaborationModel)}`);
  // Contact fields stay first. Split escaped text only at character boundaries, never inside an entity.
  const contacts = lines.join('\n');
  const objective = escapeHtml(lead.message);
  const status = isTest ? 'Статус: тест — відповідь не потрібна' : 'Статус: потребує відповіді';
  const combined = `${contacts}\n\nЗадача:\n${objective}\n\n${status}`;
  if (combined.length <= 3900) return [combined];
  const contactParts: string[] = []; let contactPart = '';
  for (const line of lines) {
    if (contactPart.length + line.length + 1 > 3500) { contactParts.push(contactPart); contactPart = `ID: ${lead.referenceId}\n`; }
    contactPart += line + '\n';
  }
  if (contactPart) contactParts.push(contactPart.trimEnd());
  return [...contactParts, ...chunks(lead.message).map((part, index) => `${escapeHtml(heading)}\nID: ${lead.referenceId}\nЗадача (${index + 1}):\n${part}\n\n${status}`)];
}
