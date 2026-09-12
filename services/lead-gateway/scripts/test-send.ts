// Synthetic data only. Run in a protected environment with this source's secret.
import { randomUUID } from 'node:crypto';
import { leadHeaders } from '../src/contract.ts';
const secret = process.env.LEAD_SOURCE_IADDS_SECRET || process.env.CONSULTATION_WEBHOOK_SECRET;
const target = process.env.CONSULTATION_WEBHOOK_URL;
if (!secret || !target || !target.startsWith('https://')) { console.error('Configure the HTTPS gateway URL and source secret in the environment.'); process.exitCode = 1; }
else {
  const referenceId = randomUUID();
  const body = JSON.stringify({ formSchemaVersion: 2, source: 'iadds', referenceId, submittedAt: new Date().toISOString(), fullName: 'Test Lead',
    phone: '+1 (202) 555-0123', phoneNormalized: '+12025550123', preferredContact: 'phone', selectedService: 'ai-video-ads',
    communicationLanguage: 'uk', currentLocale: 'uk', sourcePage: '/uk/consultation', collaborationModel: 'production', consent: true });
  try {
    const response = await fetch(target, { method: 'POST', headers: leadHeaders(secret, 'iadds', referenceId, body), body, redirect: 'error', signal: AbortSignal.timeout(13000) });
    const result = await response.json();
    const confirmed = response.status === 200 && result.ok === true && result.referenceId === referenceId;
    console.log(JSON.stringify({ referenceId, status: response.status, confirmed }));
    if (!confirmed) process.exitCode = 1;
  } catch { console.error('Test delivery failed; no secrets or request details were logged.'); process.exitCode = 1; }
}
