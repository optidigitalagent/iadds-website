import {test,expect,type Page} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {getExperience,getAllServices,getDictionary,getContactDetails} from '../../src/lib/content';
import {getMediaCopy} from '../../src/content/site/media-copy';
import type {Locale} from '../../src/types/content';
const screenshotDir=path.join(process.cwd(),'qa','screenshots');
async function screenshot(page:Page,name:string) {
 await mkdir(screenshotDir,{recursive:true});await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(async()=>{document.documentElement.style.scrollBehavior='auto';for(const img of document.images)img.loading='eager';await Promise.all(Array.from(document.images).map(img=>img.decode().catch(()=>undefined)));window.scrollTo(0,0);});
 await page.screenshot({path:path.join(screenshotDir,name+'.png'),fullPage:!(await page.locator('dialog[open]').count()),animations:'disabled'});
 await page.emulateMedia({reducedMotion:'no-preference'});
}
async function fillForm(page:Page,locale:Locale) {
 await page.locator('#field-fullName').fill('QA Local Test');await page.locator('#field-phone').fill('+1 (202) 555-0123');await page.locator('#field-preferredContact').selectOption('phone');await page.locator('#field-company').fill('Local Test Company');await page.locator('#field-email').fill('qa@example.com');await page.locator('#field-companyUrl').fill('https://example.com');await page.locator('#field-selectedService').selectOption('ai-video-ads');await page.locator('#field-message').fill('New ad idea');await page.locator('#field-communicationLanguage').selectOption(locale==='uk'?'en':'uk');await page.locator('#field-consent').check();
}
async function noOverflow(page:Page) {expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
function languageLink(page:Page,locale:Locale) {return page.locator('header nav a[hreflang="'+locale+'"]').first();}

test('root uses a temporary cookie-based locale redirect and defaults to Ukrainian',async({request,context})=>{
 let response=await request.get('/',{maxRedirects:0,headers:{'accept-language':'en-US'}});expect(response.status()).toBe(307);expect(response.headers().location).toMatch(/\/uk$/);
 await context.addCookies([{name:'site_locale',value:'en',url:'http://127.0.0.1:3100'}]);response=await context.request.get('/',{maxRedirects:0});expect(response.status()).toBe(307);expect(response.headers().location).toMatch(/\/en$/);
 await context.addCookies([{name:'site_locale',value:'ua',url:'http://127.0.0.1:3100'}]);response=await context.request.get('/',{maxRedirects:0});expect(response.headers().location).toMatch(/\/uk$/);
});

for(const locale of ['uk','en'] as const) {
 const c=getDictionary(locale),services=getAllServices(locale);
 test(locale+' homepage starts with the grouped catalog and approved sections',async({page})=>{
  await page.setViewportSize({width:1440,height:900});await page.goto('/'+locale);await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('h1')).toHaveText(c.intro.title);
  const cards=page.locator('[data-service-card]');await expect(cards).toHaveCount(9);expect((await cards.first().boundingBox())!.y).toBeLessThan(900);
  await expect(page.locator('[data-catalog-intro] img')).toHaveCount(0);await expect(page.locator('[data-service-catalog] section')).toHaveCount(4);
  await expect(page.locator('[data-model]')).toHaveCount(2);await expect(page.locator('#test-stage')).toContainText(getExperience(locale).test.facts[2]);await expect(page.locator('#who-behind')).toContainText(getExperience(locale).behind.paragraphs[2]);await expect(page.locator('#who-behind [data-founder-photo]')).toHaveCount(1);await expect(page.locator('#faq details')).toHaveCount(13);
  await expect(page.locator('header a[href="/'+locale+'/cases"]')).toHaveCount(0);await expect(page.locator('footer a[href="/'+locale+'/cases"]')).toHaveCount(0);
  expect(await page.locator('body').innerText()).not.toMatch(new RegExp('Anton'+'off','i'));expect(await page.locator('body').innerText()).not.toContain('TODO_COMMERCIAL_TERMS');
  await screenshot(page,'home-'+locale+'-1440');await page.setViewportSize({width:390,height:844});await page.goto('/'+locale);expect((await cards.first().boundingBox())!.y).toBeLessThan(844);await screenshot(page,'home-'+locale+'-390');
 });
 test(locale+' has nine localized service routes, SEO, related links and preselection',async({page})=>{
  test.setTimeout(90_000);
  for(const service of services){expect((await page.goto('/'+locale+'/services/'+service.slug))?.status()).toBe(200);await expect(page.locator('h1')).toHaveText(service.title);await expect(page.locator('main')).toContainText(service.professionalLabel);await expect(page.locator('[data-service-card]')).toHaveCount(3);await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href',new RegExp('/'+locale+'/services/'+service.slug+'$'));await expect(page.locator('link[hreflang="uk"]')).toHaveCount(1);await expect(page.locator('link[hreflang="en"]')).toHaveCount(1);await expect(page.locator('link[hreflang="x-default"]')).toHaveCount(1);
   const href=await page.locator('main a[data-cta="service-hero"]').getAttribute('href');const url=new URL(href!,'https://example.test');expect(url.pathname).toBe('/'+locale+'/consultation');expect(url.searchParams.get('service')).toBe(service.slug);expect(url.searchParams.get('from')).toBe('/'+locale+'/services/'+service.slug);
   for(const link of await page.locator('[data-service-card]').evaluateAll(items=>items.map(a=>a.getAttribute('href'))))expect(link).toMatch(new RegExp('^/'+locale+'/services/'));
  }
 });
 test(locale+' language switch preserves route, all query parameters and hash',async({page,context})=>{
  const other=locale==='uk'?'en':'uk';await page.goto('/'+locale+'/services/video-localization?campaign=qa#formats');await languageLink(page,other).click();await expect(page).toHaveURL(url=>url.pathname==='/'+other+'/services/video-localization'&&url.search==='?campaign=qa'&&url.hash==='#formats');expect((await context.cookies()).find(cookie=>cookie.name==='site_locale')?.value).toBe(other);
  await page.goto('/'+locale+'/consultation?service=ai-video-ads&model=production&from=%2F'+locale+'%2Fservices%2Fai-video-ads');await languageLink(page,other).click();await expect(page.locator('#field-selectedService')).toHaveValue('ai-video-ads');expect(new URL(page.url()).searchParams.get('model')).toBe('production');expect(new URL(page.url()).searchParams.get('from')).toBe('/'+locale+'/services/ai-video-ads');
 });
 test(locale+' form validation, optional fields and honest provider error preserve input',async({page})=>{
  await page.goto('/'+locale+'/consultation?service=missing&from=https%3A%2F%2Fevil.example');await expect(page.locator('#field-selectedService')).toHaveValue('');await page.getByRole('button',{name:c.consultation.submit,exact:true}).click();await expect(page.locator('#field-fullName')).toBeFocused();await expect(page.getByText(c.consultation.validation.phone,{exact:true})).toBeVisible();await expect(page.locator('#field-role')).toHaveCount(0);await expect(page.locator('#field-message')).not.toHaveAttribute('required');
  await screenshot(page,'form-validation-'+locale+'-1440');await page.setViewportSize({width:375,height:844});await screenshot(page,'form-validation-'+locale+'-375');await fillForm(page,locale);
  let count=0;page.on('request',request=>{if(request.url().endsWith('/api/consultation'))count++;});const responsePromise=page.waitForResponse(response=>response.url().endsWith('/api/consultation'));
  await page.getByRole('button',{name:c.consultation.submit,exact:true}).evaluate((button:HTMLButtonElement)=>{button.click();button.click();});const response=await responsePromise;expect(response.status()).toBe(503);await expect(page.getByText(c.consultation.unavailable,{exact:true})).toBeVisible();expect(count).toBe(1);await expect(page.locator('#field-fullName')).toHaveValue('QA Local Test');await expect(page.locator('#field-message')).toHaveValue('New ad idea');await expect(page.getByText(c.consultation.successTitle,{exact:true})).toHaveCount(0);
  await screenshot(page,'form-error-'+locale+'-375');
 });
 test(locale+' local submission persists the complete context and localized success',async({page,request})=>{
  await request.post('http://127.0.0.1:3101/api/consultation',{data:{},headers:{'Idempotency-Key':crypto.randomUUID()}});
  await page.goto('http://127.0.0.1:3101/'+locale+'/consultation?service=ai-video-ads&model=production&from=%2F'+locale+'%2Fservices%2Fai-video-ads');await fillForm(page,locale);
  const responsePromise=page.waitForResponse(response=>response.url().endsWith('/api/consultation'));await page.getByRole('button',{name:c.consultation.submit,exact:true}).click();const response=await responsePromise;expect(response.status()).toBe(201);const result=await response.json();
  const saved=JSON.parse(await readFile(path.join(process.cwd(),'.data','e2e',result.referenceId+'.json'),'utf8'));expect(saved.currentLocale).toBe(locale);expect(saved.communicationLanguage).toBe(locale==='uk'?'en':'uk');expect(saved.selectedService).toBe('ai-video-ads');expect(saved.collaborationModel).toBe('production');expect(saved.sourcePage).toBe('/'+locale+'/services/ai-video-ads');expect(saved).not.toHaveProperty('role');expect(saved).not.toHaveProperty('contactMethod');expect(saved.formSchemaVersion).toBe(2);expect(saved.phoneNormalized).toBe('+12025550123');expect(saved.message).toBe('New ad idea');expect(saved.referenceId).toBe(result.referenceId);expect(saved.submittedAt).toBeTruthy();
  await expect(page.getByRole('heading',{name:c.consultation.localTitle})).toBeFocused();await expect(page.getByText(c.consultation.localBody,{exact:true})).toBeVisible();await expect(page.locator('[data-booking]')).toHaveCount(0);await screenshot(page,'form-success-'+locale+'-1440');await page.setViewportSize({width:375,height:844});await screenshot(page,'form-success-'+locale+'-375');
 });
 test(locale+' collaboration models provide validated context without adding services',async({page})=>{
  await page.goto('/'+locale);await page.locator('a[data-model="system"]').click();await expect(page.locator('#field-selectedService')).toHaveValue('custom-ai-system');await expect(page.locator('[data-model-context]')).toContainText(c.consultation.systemModel);
  await page.goto('/'+locale+'/consultation?model=production');await expect(page.locator('[data-model-context]')).toContainText(c.consultation.productionModel);await page.goto('/'+locale+'/consultation?service=bad&service=ai-video-ads&model=bad');await expect(page.locator('#field-selectedService')).toHaveValue('');await expect(page.locator('[data-model-context]')).toHaveCount(0);await page.goto('/'+locale+'/process');await page.locator('header [data-cta="header"]').click();await expect(page).toHaveURL(url=>url.pathname==='/'+locale+'/consultation'&&url.searchParams.get('from')==='/'+locale+'/process');
 });
 test(locale+' mobile menu supports keyboard, Escape, focus restoration and locale navigation',async({page})=>{
  await page.setViewportSize({width:375,height:844});await page.goto('/'+locale);const trigger=page.getByRole('button',{name:c.ui.menu});await trigger.focus();await page.keyboard.press('Enter');const dialog=page.getByRole('dialog',{name:c.ui.navigation});await expect(dialog).toBeVisible();for(let i=0;i<12;i++){await page.keyboard.press('Tab');expect(await page.evaluate(()=>Boolean(document.activeElement?.closest('dialog[open]')))).toBe(true);}await screenshot(page,'navigation-'+locale+'-375');await page.keyboard.press('Escape');await expect(dialog).not.toBeVisible();await expect(trigger).toBeFocused();await trigger.click();await dialog.getByRole('link',{name:new RegExp(c.nav.find(item=>item.href==='/process')!.label)}).click();await expect(page).toHaveURL(new RegExp('/'+locale+'/process$'));await expect(dialog).not.toBeVisible();
 });
 test(locale+' accessibility, contact links, empty cases and rendered routes',async({page,request})=>{
  test.setTimeout(120_000);await page.emulateMedia({reducedMotion:'reduce'});const consoleErrors:string[]=[];page.on('pageerror',e=>consoleErrors.push(e.message));page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text());});const internal=new Set<string>();
  for(const route of ['','/services','/services/ai-video-ads','/process','/about','/ai-systems','/pricing','/contact','/consultation','/cases']){
   expect((await page.goto('/'+locale+route))?.status()).toBe(200);await expect(page.locator('html')).toHaveAttribute('lang',locale);await expect(page.locator('h1')).toHaveCount(1);
   // Analyze the rendered heading after streamed content and web fonts are ready.
   await expect(page.getByRole('heading',{level:1})).toBeVisible();await page.evaluate(()=>document.fonts.ready);
   expect((await new AxeBuilder({page}).options({rules:{'label-content-name-mismatch':{enabled:true}}}).analyze()).violations,route).toEqual([]);await noOverflow(page);
   if(route===''){for(const item of await page.locator('#faq details').all()){await item.locator('summary').click();await expect(item.locator('p')).toBeVisible();await noOverflow(page);}}
   (await page.locator('a[href]').evaluateAll(items=>items.map(a=>a.getAttribute('href')!))).filter(href=>href.startsWith('/')&&!href.startsWith('//')).forEach(href=>internal.add(href));
  }
  await expect(page.getByText(c.cases.emptyBody,{exact:true})).toBeVisible();await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content',/noindex/);await screenshot(page,'cases-empty-'+locale+'-1440');
  const contact=getContactDetails();await page.goto('/'+locale+'/contact');await expect(page.locator('main a[href="'+contact.emailHref+'"]').first()).toBeVisible();await expect(page.locator('main a[href="'+contact.phoneHref+'"]').first()).toBeVisible();await expect(page.locator('main a[href="'+contact.telegram+'"]').first()).toHaveAttribute('rel','noopener noreferrer');await expect(page.locator('main a[href="'+contact.instagram+'"]').first()).toBeVisible();
  for(const href of internal)expect((await request.get(href)).status(),href).toBe(200);expect(consoleErrors).toEqual([]);
 });
 test(locale+' responsive pages fit 320–1920px and first cards remain near the intro',async({page})=>{
  test.setTimeout(120_000);
  for(const width of [320,360,375,390,430,768,1024,1440,1920])for(const route of ['','/services/ai-video-ads','/consultation']){await page.setViewportSize({width,height:900});await page.goto('/'+locale+route);await noOverflow(page);if([375,1440].includes(width))await screenshot(page,(route?route.includes('services')?'service':'consultation':'home')+'-'+locale+'-'+width);}
  for(const route of ['/services','/process','/about','/ai-systems','/pricing','/contact','/cases']){await page.setViewportSize({width:375,height:844});await page.goto('/'+locale+route);await noOverflow(page);await screenshot(page,route.slice(1)+'-'+locale+'-375');}
  await page.setViewportSize({width:1440,height:1000});await page.goto('/'+locale);const zoom=await page.context().newCDPSession(page);await zoom.send('Emulation.setDeviceMetricsOverride',{width:720,height:500,deviceScaleFactor:2,mobile:false});await noOverflow(page);await screenshot(page,'home-'+locale+'-zoom-200');await zoom.detach();
 });
 test(locale+' 404s, reduced motion and missing images remain localized',async({page,request})=>{
  expect((await request.get('/'+locale+'/services/unknown-service')).status()).toBe(404);expect((await request.get('/'+locale+'/cases/moda-castle')).status()).toBe(404);expect((await page.goto('/'+locale+'/unknown'))?.status()).toBe(404);await expect(page.getByRole('heading',{name:c.ui.notFoundTitle})).toBeVisible();await expect(page.locator('html')).toHaveAttribute('lang',locale);await languageLink(page,locale==='uk'?'en':'uk').click();await expect(page).toHaveURL(new RegExp('/'+(locale==='uk'?'en':'uk')+'/unknown$'));
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/'+locale);await expect(page.locator('[data-motion-pending="true"]')).toHaveCount(0);expect(await page.locator('video[src]').count()).toBe(0);
  await page.route('**/media/examples/example-11-*',route=>route.abort());await page.goto('/'+locale+'/services/product-visuals');await expect(page.getByRole('img',{name:getMediaCopy(locale).unavailable}).first()).toBeVisible();
 });
 test(locale+' no-JavaScript form is visible and cannot send personal data through GET',async({browser})=>{
  const context=await browser.newContext({javaScriptEnabled:false});try{const page=await context.newPage();await page.goto('http://127.0.0.1:3100/'+locale+'/consultation');await expect(page.locator('form')).toBeVisible();await expect(page.locator('form')).toHaveAttribute('method','post');await expect(page.getByRole('button',{name:c.consultation.submit,exact:true})).toBeDisabled();await expect(page.locator('noscript p')).toHaveText(c.consultation.javascript);}finally{await context.close();}
 });
}

test('invalid locale is a real localized 404 and sitemap excludes empty cases',async({page,request})=>{
 expect((await page.goto('/ua/services'))?.status()).toBe(404);await expect(page.locator('html')).toHaveAttribute('lang','uk');expect((await request.get('/fr/about')).status()).toBe(404);const xml=await (await request.get('/sitemap.xml')).text();expect(xml).toContain('/uk/services/ai-video-ads');expect(xml).toContain('/en/services/ai-video-ads');expect(xml).toContain('hreflang="uk"');expect(xml).not.toContain('/cases');
});
test('localized Open Graph images are real PNG resources',async({request})=>{
 test.setTimeout(90_000);await mkdir(screenshotDir,{recursive:true});for(const locale of ['uk','en']){const response=await request.get('/'+locale+'/opengraph-image');expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('image/png');const bytes=await response.body();expect(bytes.length).toBeGreaterThan(10000);await writeFile(path.join(screenshotDir,'opengraph-'+locale+'.png'),bytes);}
});
test('mobile dock avoids menu, footer and consultation controls',async({page})=>{
 const c=getDictionary('uk');await page.setViewportSize({width:375,height:844});await page.goto('/uk');const dock=page.locator('[data-cta="mobile-dock"]');await expect(dock).not.toBeVisible();await page.locator('#collaboration').scrollIntoViewIfNeeded();await expect(dock).toBeVisible();await page.getByRole('button',{name:c.ui.menu}).click();await expect(dock).not.toBeVisible();await page.keyboard.press('Escape');await page.locator('footer').scrollIntoViewIfNeeded();await expect(dock).not.toBeVisible();await page.goto('/uk/consultation');await expect(dock).toHaveCount(0);
});

