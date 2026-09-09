import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chromium'}),page=await browser.newPage();
const base=process.env.IADDS_QA_URL||'http://127.0.0.1:3103',out='qa/screenshots/iadds-v3';
const locale=process.env.IADDS_CAPTURE_LOCALE||"uk";
const pages=[['home',''],['about','/about'],['ai-video-ads','/services/ai-video-ads'],['product-visuals','/services/product-visuals'],['virtual-models','/services/virtual-models'],['video-localization','/services/video-localization'],['performance-creatives','/services/performance-creatives']];
const results=[];
try{for(const [name,route] of pages.filter(([name])=>locale==="uk"||["home","about"].includes(name)))for(const width of [390,1440]){
 await page.setViewportSize({width,height:width<768?844:1000});await page.goto(base+'/'+locale+route);await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=550){window.scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,120));}window.scrollTo({top:0,behavior:'instant'});});
 await page.waitForFunction(()=>[...document.querySelectorAll('img')].filter(i=>i.getBoundingClientRect().width>0&&i.getBoundingClientRect().height>0).every(i=>i.complete&&i.naturalWidth>0));await page.waitForTimeout(800);
 const pending=await page.locator('[data-motion-pending="true"]').count();assert.equal(pending,0,`${name} ${width}: every reveal visited`);
 const images=await page.locator('img').count();await page.screenshot({path:`${out}/${name}-${locale}-${width}.png`,fullPage:true});
 if(name==='home')await page.screenshot({path:`${out}/home-${locale}-${width}-viewport.png`});
 if(name==='performance-creatives')await page.locator('[data-service-examples]').screenshot({path:`${out}/paired-sets-${width}.png`});
 if(name==='about'){await page.locator('[data-founder-photo="urban"]').screenshot({path:`${out}/city-contained-${width}.png`});await page.locator('[data-founder-photo="hockey-team"]').screenshot({path:`${out}/hockey-${width}.png`});}
 results.push({locale,name,width,loadedImages:images,pendingReveals:pending});console.log(`Visually complete capture ${name} ${width}`);
}await fs.writeFile(`qa/iadds-v3/capture-validation-${locale}.json`,JSON.stringify({status:'passed',method:'Instant scroll through every section; each image decoded; every reveal visible before screenshot.',results},null,2)+'\n');}finally{await browser.close();}
