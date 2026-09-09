import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const base=process.env.IADDS_QA_URL??'http://127.0.0.1:3100',out='qa/screenshots/iadds-v3';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({channel:'chromium',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(120000);
const result={mode:'local',base,createdAt:new Date().toISOString(),widths:[],routes:[],network:{},playback:{},axe:[],errors:[]};
page.on('pageerror',e=>result.errors.push(e.message));
const mediaFailures=[];page.on('response',r=>{if(r.url().includes('/api/format-media/')&&r.status()>=400)mediaFailures.push([r.url(),r.status()]);});
async function ready(){await page.locator('h1').waitFor();await page.evaluate(()=>document.fonts.ready);}
async function overflow(){return page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));}
async function reveal(){await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,100));}window.scrollTo({top:0,behavior:'instant'});});await page.waitForTimeout(700);}
async function shot(name,full=true){if(full)await reveal();await page.screenshot({path:`${out}/${name}.png`,fullPage:full});}
try{
 await page.goto(base+'/uk');await ready();await page.waitForTimeout(1200);
 const initial=await page.evaluate(()=>performance.getEntriesByType('resource').map(e=>({url:e.name,bytes:e.transferSize,kind:e.initiatorType})));
 assert.equal(initial.filter(e=>/\.mp4/.test(e.url)).length,0,'Homepage must not eagerly load video');
 result.network.initialRequests=initial;result.network.initialBytes=initial.reduce((n,e)=>n+e.bytes,0);result.network.initialMediaBytes=initial.filter(e=>/\/media\/|\/api\/format-media\//.test(e.url)).reduce((n,e)=>n+e.bytes,0);
 assert.equal(await page.locator('[data-service-card]').count(),9);assert.equal(await page.locator('[data-format-card]').count(),8);assert.equal(await page.locator('header').innerText().then(t=>t.includes('iADDS')),true);
 assert.equal(await page.locator('#who-behind [data-founder-photo]').count(),1);assert.equal(await page.locator('#who-behind [data-founder-photo="jetski"]').count(),1);
 const first=page.locator('[data-service-card="ai-video-ads"]'),second=page.locator('[data-service-card="ai-ugc"]');
 await first.hover();await page.waitForFunction(()=>Array.from(document.querySelectorAll('video')).some(v=>!v.paused));
 assert.equal(await page.locator('video[src]').count(),1);result.playback.firstPreviewLoaded=true;
 await second.hover();await page.waitForFunction(()=>{const v=document.querySelector('[data-service-card="ai-ugc"] video');return v&&!v.paused;});
 assert.equal(await page.evaluate(()=>Array.from(document.querySelectorAll('video')).filter(v=>!v.paused).length),1);result.playback.oneAtATime=true;
 await page.locator('footer').scrollIntoViewIfNeeded();await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>Array.from(document.querySelectorAll('video')).filter(v=>!v.paused).length),0);result.playback.pauseOutOfView=true;
 for(const width of [320,360,375,390,430,768,1024,1440,1920]){
  await page.setViewportSize({width,height:width<768?844:1000});await page.goto(base+'/uk');await ready();const metrics=await overflow();assert.ok(metrics.scroll<=width+1,`Homepage overflow at ${width}`);
  const footer=page.locator('footer');await footer.scrollIntoViewIfNeeded();const box=await footer.boundingBox();assert.equal(await footer.locator('[data-cta="footer"]').count(),1);
  const links=await footer.locator('a').evaluateAll(links=>links.map(a=>({text:a.textContent?.trim(),width:a.getBoundingClientRect().width,height:a.getBoundingClientRect().height,wordBreak:getComputedStyle(a).wordBreak})));
  assert.ok(links.every(a=>a.height>=43.5),`Footer tap targets ${width}`);assert.ok(links.every(a=>a.wordBreak!=='break-all'));assert.equal(await footer.locator('a[href*="privacy"],a[href*="terms"]').count(),0);
  result.widths.push({width,overflow:metrics.scroll-width,footerHeight:box.height,links});
  if([320,360,375,390,430,768].includes(width))await footer.screenshot({path:`${out}/footer-uk-${width}.png`});
  if([390,1440].includes(width))await shot(`home-uk-${width}`);
  console.log(`Home/footer ${width}px passed`);
 }
 for(const locale of ['uk','en'])for(const slug of ['ai-video-ads','product-visuals','virtual-models','ai-ugc','ai-spokesperson','video-localization','explainer-videos','brand-characters','performance-creatives']){
  await page.setViewportSize({width:1440,height:1000});await page.goto(`${base}/${locale}/services/${slug}`);await ready();const section=page.locator('[data-service-examples]');assert.ok(await section.count());
  const ids=await section.locator('[data-example-id]').evaluateAll(nodes=>nodes.map(e=>Number(e.getAttribute('data-example-id'))));assert.equal(new Set(ids).size,ids.length);
  if(slug==='video-localization'){assert.equal(ids.length,0);assert.ok(await section.innerText().then(t=>/незабаром|coming soon/.test(t)));}
  else if(slug==='performance-creatives'){assert.deepEqual(await section.locator('[data-variation-set]').evaluateAll(n=>n.map(e=>e.getAttribute('data-variation-set'))),['plip','lume','studio-hands']);assert.deepEqual(ids,[30,33,17,23,22,36]);}
  else assert.ok(ids.length<=5);
  assert.ok(await page.locator('[data-cta="consultation-section"]').count()||await page.locator('a[data-cta][href*="consultation"]').count());
  await reveal();const axe=await new AxeBuilder({page}).options({rules:{'label-content-name-mismatch':{enabled:true}}}).analyze();result.axe.push({locale,slug,violations:axe.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.html)}))});assert.equal(axe.violations.length,0,`${locale}/${slug} accessibility`);
  result.routes.push({locale,slug,gallery:ids,coverage:await section.getAttribute('data-coverage')});
  if(locale==='uk'&&['ai-video-ads','product-visuals','virtual-models','video-localization','performance-creatives'].includes(slug)){await shot(`${slug}-uk-1440`);await page.setViewportSize({width:375,height:844});await page.reload();await ready();assert.ok((await overflow()).scroll<=376);await shot(`${slug}-uk-375`);}
  console.log(`${locale}/${slug} passed`);
 }
 for(const locale of ['uk','en'])for(const width of [390,1440]){
  await page.setViewportSize({width,height:width<768?844:1000});await page.goto(`${base}/${locale}/about`);await ready();assert.equal(await page.locator('[data-founder-photo]').count(),7);await reveal();
  const city=page.locator('[data-founder-photo="urban"]');const box=await city.boundingBox();assert.ok(box.width<=301&&Math.abs(box.width/box.height-.75)<.01);await shot(`about-${locale}-${width}`);result.routes.push({locale,route:'about',width,cityFrame:box});
  if(locale==='en'){await page.goto(base+'/en');await ready();await shot(`home-en-${width}`);}
 }
 await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/uk/services/ai-video-ads');await ready();
 await page.locator('[data-example-id="34"] button').click();await page.waitForFunction(()=>{const v=document.querySelector('[data-example-id="34"] video');return v?.currentTime>0;});assert.ok(await page.locator('[data-example-id="34"] video').getAttribute('controls')!==null);result.playback.detailControls=true;
 await page.goto(base+'/uk/services/video-localization');assert.equal(await page.evaluate(()=>Array.from(document.querySelectorAll('video')).filter(v=>!v.paused).length),0);result.playback.routeStopsPlayback=true;
 await page.goto(base+'/uk');await ready();await page.evaluate(()=>document.documentElement.style.zoom='2');assert.ok((await overflow()).scroll<=1441);await shot('home-uk-200-percent',false);result.zoom200=true;await page.evaluate(()=>document.documentElement.style.zoom='');
 for(const mode of ['reduced-motion','save-data','touch']){
  const c=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:mode==='reduced-motion'?'reduce':'no-preference',hasTouch:mode==='touch',isMobile:mode==='touch'});
  if(mode==='save-data')await c.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,addEventListener(){},removeEventListener(){}}}));
  const p=await c.newPage();await p.goto(base+'/uk');await p.locator('[data-service-card="ai-video-ads"]').hover();await p.waitForTimeout(800);assert.equal(await p.locator('video[src]').count(),0,mode);result.playback[mode]='poster only';await c.close();
 }
 const errors=await browser.newContext({viewport:{width:1440,height:1000}});await errors.route('**/example-06-preview.mp4',r=>r.abort());const ep=await errors.newPage();await ep.goto(base+'/uk');await ep.locator('[data-service-card="ai-video-ads"]').hover();await ep.waitForTimeout(1000);assert.equal(await ep.locator('[data-service-card="ai-video-ads"] video').evaluate(v=>!v.paused),false);assert.ok(await ep.locator('[data-service-card="ai-video-ads"] img').evaluate(i=>i.naturalWidth>0));result.playback.videoError='poster retained';await errors.close();
 result.network.mediaFailures=mediaFailures;assert.equal(mediaFailures.length,0);assert.equal(result.errors.length,0);
 result.status='passed';
}catch(e){result.status='failed';result.failure=e.stack;process.exitCode=1;console.error(e);}
finally{await fs.writeFile('qa/iadds-v3/browser-review.json',JSON.stringify(result,null,2)+'\n');await browser.close();}
