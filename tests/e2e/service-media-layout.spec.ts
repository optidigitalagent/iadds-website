import {test,expect,type Locator} from '@playwright/test';
import {getMediaCopy} from '../../src/content/site/media-copy';
import {serviceMediaMap} from '../../src/content/site/service-media-map';

const widths=[320,375,390,768,1024,1440];
const geometry=(element:Locator)=>element.evaluate((el:HTMLElement)=>({width:el.offsetWidth,height:el.offsetHeight}));

for(const locale of ['uk','en'] as const)for(const width of widths){
 test(`${locale} service media fills stable frames at ${width}px`,async({page},testInfo)=>{
  test.setTimeout(90_000);
  await page.setViewportSize({width,height:1000});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/'+locale+'/services');
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('[data-card-surface]')).toHaveCount(9);
  for(const [slug,mapping] of Object.entries(serviceMediaMap)){
   const card=page.locator(`[data-card-surface="${slug}"]`);
   await card.scrollIntoViewIfNeeded();
   const note=card.locator('[data-preview-quality]');
   await expect(note).toHaveCount(mapping.card.length?1:0);
   if(mapping.card.length){
    await expect(note).toHaveText(getMediaCopy(locale).previewQuality);
    const caption=await note.boundingBox(),title=await card.locator('h3').boundingBox();
    expect(caption!.y+caption!.height).toBeLessThanOrEqual(title!.y);
   }
   for(const id of mapping.card){
    const frame=card.locator(`[data-example-id="${id}"]`),poster=frame.locator('img');
    await expect.poll(()=>poster.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
    const result=await frame.evaluate(el=>{
     const img=el.querySelector('img')!,video=el.querySelector('video'),style=getComputedStyle(img);
     const box=el.getBoundingClientRect(),imageBox=img.getBoundingClientRect();
     const scale=Math.max(box.width/img.naturalWidth,box.height/img.naturalHeight);
     return {fit:style.objectFit,position:style.objectPosition,videoPosition:video?getComputedStyle(video).objectPosition:null,
      frame:[box.width,box.height],image:[imageBox.width,imageBox.height],filled:[img.naturalWidth*scale,img.naturalHeight*scale],
      ratio:getComputedStyle(el.parentElement!).aspectRatio,bottom:box.bottom};
    });
    expect(result.fit).toBe('cover');
    expect(result.image[0]).toBeCloseTo(result.frame[0],1);expect(result.image[1]).toBeCloseTo(result.frame[1],1);
    expect(result.filled[0]+.1).toBeGreaterThanOrEqual(result.frame[0]);expect(result.filled[1]+.1).toBeGreaterThanOrEqual(result.frame[1]);
    expect(result.ratio).toBe('4 / 3');
    if(result.videoPosition)expect(result.videoPosition).toBe(result.position);
    expect(result.bottom).toBeLessThanOrEqual((await note.boundingBox())!.y+.1);
   }
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.mouse.move(0,0);
  for(const slug of ['ai-video-ads','virtual-models','ai-ugc','ai-spokesperson','explainer-videos','brand-characters','performance-creatives']){
   const card=page.locator(`[data-card-surface="${slug}"]`),video=card.locator('video').last();
   await card.scrollIntoViewIfNeeded();
   const frame=video.locator('xpath=ancestor::*[@data-example-id]'),before=await geometry(frame),cardBefore=await geometry(card);
   await page.evaluate(()=>{
    const state=window as unknown as {mediaShifts:number;mediaObserver?:PerformanceObserver};
    state.mediaObserver?.disconnect();state.mediaShifts=0;
    state.mediaObserver=new PerformanceObserver(list=>{for(const entry of list.getEntries())state.mediaShifts+=(entry as PerformanceEntry & {value:number}).value;});
    state.mediaObserver.observe({type:'layout-shift'});
   });
   await card.locator('[data-service-card]').focus();
   await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>!v.paused&&v.currentTime>.1)).toBe(true);
   expect(await geometry(frame)).toEqual(before);expect(await geometry(card)).toEqual(cardBefore);
   await expect(video).toHaveCSS('object-fit','cover');
   const image=frame.locator('img');
   expect(await geometry(video)).toEqual(await geometry(image));
   expect(await video.evaluate(v=>getComputedStyle(v).objectPosition)).toEqual(await image.evaluate(v=>getComputedStyle(v).objectPosition));
   expect(await page.evaluate(()=>(window as unknown as {mediaShifts:number}).mediaShifts)).toBe(0);
  }
  if(locale==='uk'&&[375,1440].includes(width)){
   await page.emulateMedia({reducedMotion:'reduce'});
   const card=page.locator('[data-card-surface="ai-video-ads"]');
   await card.scrollIntoViewIfNeeded();
   await card.screenshot({path:testInfo.outputPath(`vertical-card-${width}.png`)});
  }
 });
}

test('quality notes accompany each detail example and exclude decorative media',async({page})=>{
 test.setTimeout(120_000);
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const locale of ['uk','en'] as const){
  for(const slug of Object.keys(serviceMediaMap)){
   await page.goto('/'+locale+'/services/'+slug);
   const examples=page.locator('main [data-example-id]:not([data-card-surface] [data-example-id])');
   const notes=page.locator('[data-preview-quality="example"]');
   await expect(notes).toHaveCount(await examples.count());
   for(const example of await examples.all()){
    const note=example.locator('xpath=following-sibling::*[1]');
    await expect(note).toHaveAttribute('data-preview-quality','example');
    await expect(note).toHaveText(getMediaCopy(locale).previewQuality);
   }
  }
  await page.goto('/'+locale+'/about');
  await expect(page.locator('[data-preview-quality]')).toHaveCount(0);
 }
});
