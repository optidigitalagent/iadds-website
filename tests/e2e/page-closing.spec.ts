import { test, expect, type Page, type TestInfo } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { getContactDetails, getDictionary } from '../../src/lib/content';

const sizes = [[320,568],[360,800],[375,812],[390,844],[430,932],[768,1024],[1024,768],[1440,900]];
const routes = ['/services','/services/ai-video-ads','/ai-systems','/pricing','/about','/consultation','/contact','/process','/cases'];
const screenshots = process.env.CLOSING_QA_DIR || path.join(process.cwd(),'qa/screenshots/page-closing');

async function ready(page: Page, url: string) {
  expect((await page.goto(url))?.status()).toBe(200);
  await expect(page.locator('[data-page-closing]')).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>('[data-site-footer] img')).map(image => image.decode()));
  });
}

async function closingGeometry(page: Page) {
  await page.evaluate(() => window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));
  return page.evaluate(async () => {
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const closing = document.querySelector('[data-page-closing]')!;
    const footer = document.querySelector('[data-site-footer]')!;
    const c = closing.getBoundingClientRect(), f = footer.getBoundingClientRect();
    const button = closing.querySelector('a')!.getBoundingClientRect();
    const lastContent = closing.previousElementSibling!;
    const visibleMainChildren = Array.from(document.querySelector('main')!.children).filter(el => el.getBoundingClientRect().height > 0);
    return {
      closingHeight:f.bottom-c.top, footerHeight:f.height,
      buttonHeight:button.height, buttonWidth:button.width, buttonCenter:(button.top+button.height/2)/innerHeight,
      overflow:document.documentElement.scrollWidth-innerWidth,
      bottomGap:document.documentElement.scrollHeight-(f.bottom+scrollY),
      lastContentGap:c.top-lastContent.getBoundingClientRect().bottom,
      lastContentPadding:parseFloat(getComputedStyle(lastContent).paddingBottom),
      closingLast:visibleMainChildren.at(-1)===closing,
      footerNext:document.querySelector('main')!.nextElementSibling===footer,
      normalFlow:!['absolute','fixed','sticky'].includes(getComputedStyle(closing).position),
      links:Array.from(footer.querySelectorAll('a')).map(a => {
        const r=a.getBoundingClientRect();
        return {href:a.getAttribute('href'),width:r.width,height:r.height,left:r.left,right:r.right,clipped:a.scrollWidth>a.clientWidth+1};
      }),
    };
  });
}

async function verifyClosing(page: Page, locale: 'uk'|'en', route: string, width: number, height: number, info: TestInfo) {
  const c=getDictionary(locale), footer=page.locator('[data-site-footer]'), closing=page.locator('[data-page-closing]');
  await expect(closing).toHaveCount(1);
  await expect(closing.getByRole('heading')).toHaveText(locale==='uk'?'Готові обговорити вашу задачу?':'Ready to discuss your project?');
  await expect(closing.getByRole('link')).toHaveCount(1);
  await expect(closing.getByRole('link')).toHaveText(c.ui.book);
  const href=new URL((await closing.getByRole('link').getAttribute('href'))!,page.url());
  expect(href.pathname).toBe('/'+locale+'/consultation');
  expect(href.searchParams.get('from')).toBe('/'+locale+route);
  if(route.startsWith('/services/'))expect(href.searchParams.get('service')).toBe(route.split('/')[2]);
  if(route==='/ai-systems')expect(href.searchParams.get('model')).toBe('system');
  await expect(footer.locator('[data-cta]')).toHaveCount(0);
  await expect(footer.getByRole('navigation',{name:c.ui.footerNav,exact:true}).getByRole('link')).toHaveCount(5);
  expect(await footer.locator('[data-navigation]').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')))).toEqual(['services','ai-systems','process','about','contact'].map(p=>'/'+locale+'/'+p));
  const contact=getContactDetails();
  expect(await footer.locator('[data-contact]').evaluateAll(nodes=>nodes.map(a=>a.getAttribute('href')))).toEqual([contact.emailHref,contact.phoneHref,...contact.socialLinks.map(item=>item.url)]);
  await expect(footer.getByRole('navigation',{name:c.footer.legal,exact:true})).toHaveCount(contact.legalLinks.length ? 1 : 0);
  await expect(footer.locator('a[hreflang][aria-current="true"]')).toHaveAttribute('hreflang',locale);
  const activeRoute=route.startsWith('/services/')?'/services':route;
  if(['/services','/ai-systems','/process','/about','/contact'].includes(activeRoute))
    await expect(footer.locator(`[data-navigation][href="/${locale}${activeRoute}"]`)).toHaveAttribute('aria-current',route===activeRoute?'page':'location');
  const geometry=await closingGeometry(page);
  expect(geometry.closingLast).toBe(true); expect(geometry.footerNext).toBe(true); expect(geometry.normalFlow).toBe(true);
  expect(Math.abs(geometry.lastContentGap)).toBeLessThan(2); expect(geometry.lastContentPadding).toBeLessThanOrEqual(32);
  expect(geometry.overflow).toBeLessThanOrEqual(0); expect(Math.abs(geometry.bottomGap)).toBeLessThan(2);
  for(const link of geometry.links) {
    expect(link.width,link.href??'').toBeGreaterThanOrEqual(44); expect(link.height,link.href??'').toBeGreaterThanOrEqual(44);
    expect(link.left).toBeGreaterThanOrEqual(0); expect(link.right).toBeLessThanOrEqual(width+1); expect(link.clipped).toBe(false);
  }
  if(width<768) {
    expect(geometry.buttonHeight).toBeGreaterThanOrEqual(52); expect(geometry.buttonHeight).toBeLessThanOrEqual(56);
    expect(geometry.buttonWidth).toBeLessThanOrEqual(360); expect(geometry.buttonWidth).toBeGreaterThanOrEqual(width-90);
    expect(geometry.closingHeight).toBeLessThanOrEqual(height*(width===320?1.2:1));
    if(width===390) {expect(geometry.buttonCenter).toBeGreaterThanOrEqual(.55); expect(geometry.buttonCenter).toBeLessThanOrEqual(.65);}
    await expect(page.locator('[data-cta="mobile-dock"]')).not.toBeVisible();
  }
  await info.attach(`${locale}${route||'/home'}-${width} geometry`,{body:JSON.stringify(geometry,null,2),contentType:'application/json'});
}

for(const locale of ['uk','en'] as const) {
  test(locale+' compact home closing at all requested viewports',async({page},info)=>{
    test.setTimeout(120_000); const errors:string[]=[];
    page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.emulateMedia({reducedMotion:'reduce'}); await ready(page,'/'+locale); await mkdir(screenshots,{recursive:true});
    for(const [width,height] of sizes) {
      await page.setViewportSize({width,height});
      await verifyClosing(page,locale,'',width,height,info);
      await page.screenshot({path:path.join(screenshots,`home-${locale}-${width}x${height}.png`),animations:'disabled'});
      if(width===390) {
        await page.evaluate(()=>window.scrollTo({top:document.querySelector('[data-page-closing]')!.getBoundingClientRect().top+scrollY-innerHeight*.65,behavior:'instant'}));
        await page.screenshot({path:path.join(screenshots,`home-${locale}-390-start-cta.png`),animations:'disabled'});
      }
    }
    expect(errors).toEqual([]);
  });

  for(const route of routes) test(locale+route+' single closing with real contacts and consultation context',async({page},info)=>{
    const errors:string[]=[]; page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
    await ready(page,'/'+locale+route);await verifyClosing(page,locale,route,390,844,info);
    await mkdir(screenshots,{recursive:true});
    await page.screenshot({path:path.join(screenshots,`${route.slice(1).replaceAll('/','-')}-${locale}-390.png`),animations:'disabled'});
    expect(errors).toEqual([]);
  });

  test(locale+' service dock hides at closing entrance and restores on exit',async({page})=>{
    await page.setViewportSize({width:390,height:844});await ready(page,'/'+locale+'/services/ai-video-ads');
    const dock=page.locator('[data-cta="mobile-dock"]');
    await page.evaluate(()=>window.scrollTo({top:document.querySelector('[data-page-closing]')!.getBoundingClientRect().top+scrollY-innerHeight-100,behavior:'instant'}));
    await expect(dock).toBeVisible();
    await page.evaluate(()=>window.scrollTo({top:document.querySelector('[data-page-closing]')!.getBoundingClientRect().top+scrollY-innerHeight+10,behavior:'instant'}));
    await expect(dock).not.toBeVisible();
    await closingGeometry(page);await expect(dock).not.toBeVisible();
    await page.evaluate(()=>window.scrollTo({top:document.querySelector('[data-page-closing]')!.getBoundingClientRect().top+scrollY-innerHeight-100,behavior:'instant'}));
    await expect(dock).toBeVisible();
    await page.locator('[data-page-closing] a').click();
    await expect(page).toHaveURL(url=>url.pathname===`/${locale}/consultation`&&url.searchParams.get('service')==='ai-video-ads'&&url.searchParams.get('from')===`/${locale}/services/ai-video-ads`);
  });

  test(locale+' closing accessibility, keyboard focus and stable geometry',async({page},info)=>{
    await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
    await page.addInitScript(()=>{
      const shifts: number[]=[];
      const observer=new PerformanceObserver(list=>{
        for(const entry of list.getEntries()) {
          const shift=entry as PerformanceEntry & {value:number;hadRecentInput:boolean;sources?:{node?:Node}[]};
          if(!shift.hadRecentInput&&shift.sources?.some(s=>s.node instanceof Element&&s.node.closest('[data-page-closing],[data-site-footer]')))shifts.push(shift.value);
        }
      });
      observer.observe({type:'layout-shift'});
      Object.assign(window,{closingShifts:shifts});
    });
    await ready(page,'/'+locale);const before=await closingGeometry(page);
    const a11y=await new AxeBuilder({page}).include('[data-page-closing]').include('[data-site-footer]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
    expect(a11y.violations).toEqual([]);
    await page.locator('[data-page-closing] a').focus();
    await expect(page.locator('[data-page-closing] a')).toBeFocused();
    expect(await page.locator('[data-page-closing] a').evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
    await page.keyboard.press('Tab');await expect(page.locator('[data-site-footer] a').first()).toBeFocused();
    const after=await closingGeometry(page);expect(after.closingHeight).toBeCloseTo(before.closingHeight,0);
    const cls=await page.evaluate(()=>(window as Window & {closingShifts?:number[]}).closingShifts?.reduce((a,b)=>a+b,0)??0);
    expect(cls).toBe(0);await info.attach('closing accessibility and CLS',{body:JSON.stringify({violations:a11y.violations,cls}),contentType:'application/json'});
  });
}
