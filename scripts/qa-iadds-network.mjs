import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chromium'});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Network.enable');
 await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:400,downloadThroughput:500*1024/8,uploadThroughput:250*1024/8,connectionType:'cellular3g'});
 const started=Date.now();await page.goto('http://127.0.0.1:3100/uk',{waitUntil:'load',timeout:120000});
 await page.locator('[data-service-card]').first().waitFor();
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>({url:r.name,bytes:r.transferSize})));
 assert.equal(resources.filter(r=>r.url.includes('.mp4')).length,0);
 assert.equal(await page.locator('video[src]').count(),0);
 assert.ok(await page.locator('[data-service-card]').first().locator('img').evaluate(i=>i.naturalWidth>0));
 await page.screenshot({path:'qa/screenshots/iadds-v3/slow-3g-home-390.png'});
 const result={status:'passed',mode:'local review',throttle:{latencyMs:400,downloadKbps:500,uploadKbps:250},loadMs:Date.now()-started,mp4Requests:0,resources};
 const response=await page.request.get('http://127.0.0.1:3100/api/format-media/example-06-detail.mp4',{headers:{Range:'bytes=0-99'}});assert.equal(response.status(),206);assert.equal((await response.body()).length,100);result.range206=true;
 const invalid=await page.request.get('http://127.0.0.1:3100/api/format-media/example-06-detail.mp4',{headers:{Range:'bytes=999999999-'}});assert.equal(invalid.status(),416);result.range416=true;
 await fs.writeFile('qa/iadds-v3/network-review.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({status:result.status,loadMs:result.loadMs,mp4Requests:0,range206:true,range416:true}));
}finally{await browser.close();}
