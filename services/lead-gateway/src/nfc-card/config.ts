import { UUID } from './contract.ts';
export interface NfcConfig { secret: string; databaseUrl: string; publicIntake: boolean; telegramEnabled: boolean; testOnly: boolean; testLeadId?: string }
export function readNfcConfig(env: Record<string, string | undefined> = process.env): NfcConfig | undefined {
  const secret = env.LEAD_SOURCE_NFC_CARD_SECRET;
  if (!secret && !env.NFC_DATABASE_URL) return;
  if (!secret || Buffer.byteLength(secret) < 32 || secret === env.LEAD_SOURCE_IADDS_SECRET || !env.NFC_DATABASE_URL || env.LEAD_SOURCE_NFC_CARD_LABEL !== 'NFC CARD') throw new Error('invalid_nfc_configuration');
  for (const key of ['NFC_PUBLIC_INTAKE_ENABLED', 'NFC_TELEGRAM_ENABLED']) if (env[key] && !['true', 'false'].includes(env[key]!)) throw new Error('invalid_nfc_configuration');
  if (env.NFC_TELEGRAM_MODE && !['test-only', 'live'].includes(env.NFC_TELEGRAM_MODE)) throw new Error('invalid_nfc_configuration');
  const testOnly = env.NFC_TELEGRAM_MODE !== 'live', telegramEnabled = env.NFC_TELEGRAM_ENABLED === 'true';
  if (telegramEnabled && testOnly && !UUID.test(env.NFC_TELEGRAM_TEST_LEAD_ID || '')) throw new Error('invalid_nfc_configuration');
  const url = new URL(env.NFC_DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol) || (env.NODE_ENV === 'production' && !url.hostname.endsWith('.railway.internal'))) throw new Error('invalid_nfc_configuration');
  return { secret, databaseUrl: env.NFC_DATABASE_URL, publicIntake: env.NFC_PUBLIC_INTAKE_ENABLED === 'true', telegramEnabled, testOnly, testLeadId: env.NFC_TELEGRAM_TEST_LEAD_ID };
}
