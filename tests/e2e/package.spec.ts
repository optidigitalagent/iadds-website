import { test, expect } from '@playwright/test';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { getExperience } from '../../src/lib/content';
const directory=path.join(process.cwd(),'qa/screenshots/package-v1');

for(const locale of ['uk','en'] as const) {
  for(const route of ['/ai-systems','/pricing','/about']) test(locale+route+' responsive layout and founder crops',async({page})=>{
    test.setTimeout(120_000);await mkdir(directory,{recursive:true});await page.emulateMedia({reducedMotion:'reduce'});
    const e=getExperience(locale);
      for(const width of [320,360,375,390,430,768,1440]) {
        await page.setViewportSize({width,height:1000});expect((await page.goto('/'+locale+route))?.status()).toBe(200);
        await expect(page.locator('h1')).toHaveCount(1);
        expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
        if(route==='/about' && [390,1440].includes(width)) {
          await expect(page.locator('[data-founder-photo]')).toHaveCount(7);
          await expect(page.locator('#founder-story')).toContainText(e.founder.responsibility);
          await expect(page.locator('#ecosystem')).toContainText('Mentium');
          for(const image of await page.locator('[data-founder-photo] img').all()) {
            await image.scrollIntoViewIfNeeded();await image.evaluate(async el=>{const img=el as HTMLImageElement;await img.decode();});
            expect(await image.evaluate(el=>(el as HTMLImageElement).currentSrc)).toMatch(new RegExp('-'+(width<768?'mobile':'desktop')+'\\.avif'));
          }
        }
        if([390,1440].includes(width)) {
          await page.evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('img').forEach(i=>i.loading='eager');await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));window.scrollTo(0,0);});
          await page.screenshot({path:path.join(directory,`${route.slice(1)}-${locale}-${width}.png`),fullPage:true,animations:'disabled'});
        }
      }
  });
  test(locale+' AI systems CTA context and draft case protection',async({page,request})=>{
    await page.goto('/'+locale+'/ai-systems');await page.locator('[data-cta="ai-system-hero"]').click();await expect(page.locator('#field-selectedService')).toHaveValue('custom-ai-system');await expect(page).toHaveURL(url=>url.searchParams.get('from')==='/'+locale+'/ai-systems');
    expect((await request.get('/'+locale+'/cases/moda-castle')).status()).toBe(404);
  });
  test(locale+' approved home order and four service CTA positions',async({page})=>{
    await page.goto('/'+locale);const ids=['custom-task','test-stage','collaboration','why-now','pricing','who-behind','faq','consultation-idea','contacts'];
    const positions=await Promise.all(ids.map(id=>page.locator('#'+id).evaluate(el=>el.getBoundingClientRect().top+scrollY)));
    expect(positions).toEqual([...positions].sort((a,b)=>a-b));
    await page.goto('/'+locale+'/services/ai-video-ads');
    const ctas=page.locator('main a[data-service="ai-video-ads"][data-cta]');expect(await ctas.count()).toBeGreaterThanOrEqual(4);
    const final=await page.locator('#consultation-idea').evaluate(el=>el.getBoundingClientRect().top);
    const related=await page.locator('[data-service-card]').first().evaluate(el=>el.getBoundingClientRect().top);expect(final).toBeLessThan(related);
    for(const href of await ctas.evaluateAll(nodes=>nodes.map(n=>(n as HTMLAnchorElement).href))) {
      const url=new URL(href);expect(url.searchParams.get('service')).toBe('ai-video-ads');expect(url.searchParams.get('from')).toBe('/'+locale+'/services/ai-video-ads');
    }
  });
}
