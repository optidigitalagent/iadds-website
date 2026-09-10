import {test,expect,type Page} from '@playwright/test';
import {serviceMediaMap} from '../../src/content/site/service-media-map';
import {getMediaCopy} from '../../src/content/site/media-copy';

const surface=(page:Page,slug:string)=>page.locator(`[data-card-surface="${slug}"]`);
for(const locale of ['uk','en'] as const){
 test(locale+' public examples use approved IDs, honest labels and the localization fallback',async({page})=>{
  test.setTimeout(150_000);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/'+locale+'/services');
  const copy=getMediaCopy(locale);
  await expect(page.locator('[data-service-card]')).toHaveCount(9);
  for(const slug of Object.keys(serviceMediaMap)){
   const card=surface(page,slug),expected=serviceMediaMap[slug];
   await expect(card.locator('[data-example-id]')).toHaveCount(expected.card.length);
   expect(await card.locator('[data-example-id]').evaluateAll(items=>items.map(el=>Number(el.getAttribute('data-example-id'))))).toEqual(expected.card);
   if(expected.card.length)await expect(card).toContainText(copy.label);
   await card.scrollIntoViewIfNeeded();
   await expect.poll(()=>card.locator('img').evaluateAll((items:HTMLImageElement[])=>items.every(img=>img.complete&&img.naturalWidth>0))).toBe(true);
   expect(await card.locator('a button').count()).toBe(0);
  }
  for(const slug of Object.keys(serviceMediaMap)){
   await page.goto('/'+locale+'/services/'+slug);
   const expected=serviceMediaMap[slug],section=page.locator('[data-service-examples]');
   const ids=await section.locator('[data-example-id]').evaluateAll(items=>items.map(el=>Number(el.getAttribute('data-example-id'))));
   expect(ids).toEqual([...expected.gallery.filter(id=>id!==expected.featured),...(expected.variationSets??[]).flatMap(s=>s.ids)]);
   if(expected.featured)expect(ids).not.toContain(expected.featured);
   if(slug==='video-localization'){expect(ids).toEqual([]);await expect(section).toContainText(copy.localizationTitle);}
   else await expect(section).toContainText(copy.label);
   expect(await page.locator('video[src]').count()).toBe(0);
  }
 });
}

test('desktop previews require hover/focus and share one player',async({page})=>{
 await page.setViewportSize({width:1440,height:900});await page.goto('/uk/services');
 const first=surface(page,'ai-video-ads'),second=surface(page,'virtual-models');
 const video=first.locator('video');
 await expect(video).not.toHaveAttribute('src');
 await first.hover();
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>0)).toBe(true);
 await page.mouse.move(0,0);await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused&&v.currentTime===0)).toBe(true);
 await first.locator('a').focus();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused)).toBe(true);
 await second.locator('a').focus();await expect.poll(()=>second.locator('video').evaluate((v:HTMLVideoElement)=>!v.paused)).toBe(true);
 expect(await page.locator('video').evaluateAll((items:HTMLVideoElement[])=>items.filter(v=>!v.paused).length)).toBe(1);
 await page.locator('footer').scrollIntoViewIfNeeded();
 await expect.poll(()=>page.locator('video').evaluateAll((items:HTMLVideoElement[])=>items.filter(v=>!v.paused).length)).toBe(0);
});

test('touch preview requires an explicit button tap and leaves service links usable',async({browser,baseURL})=>{
 const context=await browser.newContext({baseURL,viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 try{
  const page=await context.newPage();await page.goto('/uk/services');
  const card=surface(page,'ai-video-ads'),video=card.locator('video'),toggle=card.locator('[data-preview-toggle]');
  await card.scrollIntoViewIfNeeded();await expect(toggle).toBeVisible();await expect(video).not.toHaveAttribute('src');
  await toggle.tap();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>0)).toBe(true);
  expect(new URL(page.url()).pathname).toBe('/uk/services');await expect(toggle).toHaveAttribute('aria-pressed','true');
  await toggle.tap();await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused&&v.currentTime===0)).toBe(true);
  await card.locator('a').tap({position:{x:40,y:30}});await expect(page).toHaveURL(/\/uk\/services\/ai-video-ads$/);
 }finally{await context.close();}
});

test('reduced motion, Save-Data and media errors preserve the poster',async({browser,baseURL})=>{
 for(const mode of ['reduced','save-data','failure']){
  const context=await browser.newContext({baseURL,viewport:{width:1440,height:900},...(mode==='reduced'?{reducedMotion:'reduce' as const}:{})});
  try{
   if(mode==='save-data')await context.addInitScript(()=>{Object.defineProperty(navigator,'connection',{value:{saveData:true,addEventListener(){},removeEventListener(){}}});});
   const page=await context.newPage();if(mode==='failure')await page.route('**/example-06-preview.mp4',route=>route.abort());
   await page.goto('/en/services');const card=surface(page,'ai-video-ads');await card.hover();
   await expect(card.locator('[data-preview-blocked="true"]')).toBeVisible();
   await expect(card.locator('img')).toBeVisible();await expect.poll(()=>card.locator('video').evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
   if(mode!=='failure')await expect(card.locator('video')).not.toHaveAttribute('src');
  }finally{await context.close();}
 }
});

test('detail playback is intentional, muted and uses native controls',async({page})=>{
 await page.goto('/en/services/ai-video-ads');
 const featured=page.locator('[data-example-id="34"]').first();
 await expect(featured.locator('video')).toHaveCount(0);
 await expect(featured.locator('img')).toBeVisible();
 await featured.locator('img').evaluate(img=>img.decode());
 await page.evaluate(()=>document.fonts.ready);
 const before=await featured.locator('img').evaluate(img=>({width:img.clientWidth,height:img.clientHeight,position:getComputedStyle(img).objectPosition}));
 await featured.getByRole('button',{name:/Play video/}).click();
 const video=featured.locator('video');await expect(video).toHaveAttribute('controls');await expect(video).toHaveAttribute('preload','none');
 expect(await video.evaluate((v:HTMLVideoElement)=>v.muted&&v.playsInline&&!v.autoplay)).toBe(true);
 await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>0)).toBe(true);
 expect(await video.evaluate(v=>({width:v.clientWidth,height:v.clientHeight,position:getComputedStyle(v).objectPosition}))).toEqual(before);
 const gallery=page.locator('[data-service-examples]');
 await expect(gallery.locator('video[src]')).toHaveCount(0);await expect(gallery.locator('[data-example-id="34"]')).toHaveCount(0);
});
