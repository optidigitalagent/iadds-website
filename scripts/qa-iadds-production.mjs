import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const base=process.env.IADDS_QA_URL||'http://127.0.0.1:3102';
const result={base,status:'pending',routes:[],errors:[]};
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage({viewport:{width:1440,height:1000}});
page.on('pageerror',e=>result.errors.push(e.message));
try{
 for(const locale of ['uk','en'])for(const route of ['',...['ai-video-ads','product-visuals','virtual-models','ai-ugc','ai-spokesperson','video-localization','explainer-videos','brand-characters','performance-creatives'].map(s=>'/services/'+s)]){
  const path='/'+locale+route,r=await page.request.get(base+path);assert.equal(r.status(),200,path);const html=await r.text();assert.ok(!html.includes('/api/format-media/')&&!html.includes('/media/examples/example-'));assert.ok(!/AI Content|AI CONTENT/.test(html));assert.ok(html.includes('iADDS'));result.routes.push({path,status:r.status(),reviewUrls:0});
 }
 for(const p of ['/api/format-media/example-06-preview.mp4','/media/examples/example-06-preview.mp4','/uk/cases/moda-castle'])assert.equal((await page.request.get(base+p)).status(),404,p);
 const sitemap=await (await page.request.get(base+'/sitemap.xml')).text();assert.ok(!sitemap.includes('/cases')&&!sitemap.includes('127.0.0.1'));
 for(const locale of ['uk','en']){const r=await page.request.get(`${base}/${locale}/opengraph-image`);assert.equal(r.status(),200,'OG');assert.ok(r.headers()['content-type'].includes('image/png'));await fs.writeFile(`qa/iadds-v3/og-${locale}.png`,await r.body());}
 await page.goto(base+'/uk');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);assert.equal(await page.locator('[data-format-card]').count(),0);assert.equal(await page.locator('video[src]').count(),0);await page.screenshot({path:'qa/screenshots/iadds-v3/production-home-1440.png'});
 await page.goto(base+'/uk/services/ai-video-ads');await page.locator('[data-service-examples]').scrollIntoViewIfNeeded();await page.waitForTimeout(500);assert.equal(await page.locator('[data-example-id]').count(),0);await page.locator('[data-service-examples]').screenshot({path:'qa/screenshots/iadds-v3/production-empty-examples.png'});
 await page.goto(base+'/uk/consultation');assert.ok(await page.locator('form').count());
 assert.equal(result.errors.length,0);result.status='passed';console.log(`Production QA passed: ${result.routes.length} routes, rights 404s, both OG PNGs, sitemap, interactive client, form.`);
}catch(e){result.status='failed';result.failure=e.stack;process.exitCode=1;console.error(e);}finally{await fs.writeFile('qa/iadds-v3/production-browser.json',JSON.stringify(result,null,2)+'\n');await browser.close();}
