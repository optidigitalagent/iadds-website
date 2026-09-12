import { test, expect } from '@playwright/test';
import { getDictionary } from '../../src/lib/content';

for (const locale of ['uk','en'] as const) {
 const copy=getDictionary(locale).consultation;
 for (const width of [390,1440]) test(`${locale} minimal v2 ${width}px delivers with no optional fields`,async({page})=>{
  await page.setViewportSize({width,height:900});
  await page.goto(`http://127.0.0.1:3102/${locale}/consultation?service=ai-video-ads&from=%2F${locale}%2Fservices%2Fai-video-ads`);
  await expect(page.locator('#field-selectedService')).toHaveValue('ai-video-ads');
  await expect(page.locator('input[name="role"],#field-role,#field-contactMethod')).toHaveCount(0);
  await expect(page.locator('#field-phone')).toHaveAttribute('type','tel');
  await expect(page.locator('#field-phone')).toHaveValue('');
  for(const field of ['email','company','companyUrl','message']) await expect(page.locator(`#field-${field}`)).not.toHaveAttribute('required');
  await expect(page.locator('#field-message')).not.toHaveAttribute('minlength');
  await expect(page.locator('label[for="field-company"]')).toHaveText(copy.fields.company);
  await page.locator('#field-fullName').fill('Test Lead');
  await page.locator('#field-phone').fill('+1 (202) 555-0123');
  await page.locator('#field-preferredContact').selectOption(width===390?'telegram':'phone');
  await page.locator('#field-consent').check();
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/consultation'));
  await page.getByRole('button',{name:copy.submit,exact:true}).click();
  const response=await responsePromise;expect(response.status()).toBe(201);
  const sent=response.request().postDataJSON();
  expect(sent.formSchemaVersion).toBe(2);expect(sent.source).toBe('iadds');expect(sent.phoneNormalized).toBe('+12025550123');
  expect(sent.referenceId).toBe(response.request().headers()['idempotency-key']);
  expect(sent.currentLocale).toBe(locale);expect(sent.communicationLanguage).toBe(locale);expect(sent.sourcePage).toBe(`/${locale}/services/ai-video-ads`);
  for(const key of ['role','contactMethod','email','company','companyUrl','message']) expect(sent).not.toHaveProperty(key);
  const result=await response.json();expect(result.mode).toBe('webhook');
  await expect(page.getByRole('heading',{name:copy.successTitle,exact:true})).toBeFocused();
  await expect(page.locator('[data-reference]')).toHaveText(result.referenceId);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });
 test(`${locale} phone and conditional email block invalid submits without losing input`,async({page})=>{
  await page.goto(`http://127.0.0.1:3102/${locale}/consultation`);
  let submissions=0;page.on('request',r=>{if(r.url().endsWith('/api/consultation')) submissions++;});
  await page.locator('#field-fullName').fill('Test Lead');
  await page.locator('#field-selectedService').selectOption('not-sure');
  await page.locator('#field-preferredContact').selectOption('phone');
  await page.locator('#field-consent').check();
  for(const phone of ['', 'bad phone', '+123']) {
   await page.locator('#field-phone').fill(phone);
   await page.getByRole('button',{name:copy.submit,exact:true}).click();
   await expect(page.locator('#error-phone')).toHaveText(copy.validation.phone);await expect(page.locator('#field-phone')).toHaveValue(phone);
  }
  await page.locator('#field-phone').fill('+44 (20) 7946-0958');
  await page.locator('#field-preferredContact').selectOption('email');
  await expect(page.locator('#field-email')).toHaveAttribute('required','');
  await page.getByRole('button',{name:copy.submit,exact:true}).click();
  await expect(page.locator('#error-email')).toHaveText(copy.validation.email);
  await page.locator('#field-email').fill('invalid');
  await page.locator('#field-preferredContact').selectOption('telegram');
  await page.getByRole('button',{name:copy.submit,exact:true}).click();
  await expect(page.locator('#error-email')).toHaveText(copy.validation.email);
  expect(submissions).toBe(0);
  await page.locator('#field-email').fill('');
  const responsePromise=page.waitForResponse(r=>r.url().endsWith('/api/consultation'));
  await page.getByRole('button',{name:copy.submit,exact:true}).click();
  expect((await responsePromise).status()).toBe(201);
  await expect(page.getByRole('heading',{name:copy.successTitle,exact:true})).toBeVisible();
 });
}
