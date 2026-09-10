import fs from 'node:fs/promises';
import path from 'node:path';
import {createInterface} from 'node:readline';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {chromium,request} from '@playwright/test';

const siteOrigin='https://iadds-by-antonov-digital.funckj.chatgpt.site';
const base=new URL(process.argv[2]||'http://127.0.0.1:3100').origin;
const out=process.argv[3]||'.data/handoff/smoke.json';
let headers={};
if(process.argv.includes('--sites-auth-stdin')){
  assert.equal(base,siteOrigin,'Authentication is restricted to the existing Site origin');
  let input='';for await(const line of createInterface({input:process.stdin})){input=line;break;}
  const token=JSON.parse(input).token;assert.ok(typeof token==='string'&&token.length>20);
  headers={'OAI-Sites-Authorization':`Bearer ${token}`};
}
const result={base,status:'pending',routes:[],assets:[],errors:[],browser:[]};
async function batch(items,check){
  let cursor=0;
  await Promise.all(Array.from({length:Math.min(4,items.length)},async()=>{
    while(cursor<items.length){const item=items[cursor++];await check(item);}
  }));
}
const client=await request.newContext({extraHTTPHeaders:headers});
const browser=await chromium.launch({channel:'chromium'});
try{
  const services=['ai-video-ads','product-visuals','virtual-models','ai-ugc','ai-spokesperson','video-localization','explainer-videos','brand-characters','performance-creatives'];
  const pages=['','/services','/ai-systems','/pricing','/process','/about','/consultation','/contact','/cases',...services.map(slug=>'/services/'+slug)];
  const root=await client.get(base+'/',{maxRedirects:0});assert.equal(root.status(),307);assert.ok(root.headers().location.endsWith('/uk'));
  await batch(['uk','en'].flatMap(locale=>pages.map(route=>({locale,route}))),async({locale,route})=>{
    const url='/'+locale+route,response=await client.get(base+url,{maxRedirects:0});
    assert.equal(response.status(),200,url);const html=await response.text();
    assert.ok(html.includes('iADDS'),url);assert.ok(!html.includes('/api/format-media/'),url);
    assert.ok(!html.includes('/media/examples/example-'),url);
    assert.ok(html.includes(`lang="${locale}"`),url);
    if(route==='/cases')assert.match(html,/noindex/);
    result.routes.push({path:url,status:response.status()});
  });
  for(const route of ['/uk/services/missing','/en/services/missing','/uk/cases/moda-castle','/api/format-media/example-06-preview.mp4','/media/examples/example-06-preview.mp4']){
    const response=await client.get(base+route,{maxRedirects:0});assert.equal(response.status(),404,route);result.routes.push({path:route,status:404});
  }
  const sitemap=await client.get(base+'/sitemap.xml',{maxRedirects:0});assert.equal(sitemap.status(),200);
  const xml=await sitemap.text();assert.ok(!xml.includes('/cases')&&!xml.includes('127.0.0.1'));
  assert.ok(xml.includes(siteOrigin));
  const robots=await client.get(base+'/robots.txt',{maxRedirects:0});assert.equal(robots.status(),200);assert.ok((await robots.text()).includes(siteOrigin));
  for(const locale of ['uk','en']){
    const response=await client.get(`${base}/${locale}/opengraph-image`,{maxRedirects:0});assert.equal(response.status(),200);assert.match(response.headers()['content-type'],/image\/png/);
  }
  const assetFiles=[];
  async function assets(dir='public'){
    for(const entry of await fs.readdir(dir,{withFileTypes:true})){
      const file=dir+'/'+entry.name;if(entry.isDirectory()){await assets(file);continue;}
      assetFiles.push(file);
    }
  }
  await assets();
  await batch(assetFiles,async file=>{
      const route=file.slice('public'.length),response=await client.get(base+route,{maxRedirects:0});
      assert.equal(response.status(),200,route);
      const expected=createHash('sha256').update(await fs.readFile(file)).digest('hex');
      assert.equal(createHash('sha256').update(await response.body()).digest('hex'),expected,route);
      result.assets.push({path:route,status:200,sha256:expected});
  });
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:900}});
    // Never send the Sites bearer to any other origin (including redirects).
    await context.route('**/*',route=>{
      if(new URL(route.request().url()).origin!==base)return route.abort();
      return route.continue({headers:{...route.request().headers(),...headers}});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>result.errors.push(error.message));
    page.on('response',response=>{if(response.status()>=400)result.errors.push(`${response.status()} ${new URL(response.url()).pathname}`);});
    for(const route of ['/uk','/en/services','/uk/about','/en/consultation']){
      await page.goto(base+route,{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      assert.ok(await page.locator('h1').count());
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
      assert.equal(await page.locator('video[src]').count(),0);
      if(route.endsWith('consultation'))assert.equal(await page.locator('form').count(),1);
      result.browser.push({path:route,width,status:'passed'});
    }
    await context.close();
  }
  assert.deepEqual(result.errors,[]);result.status='passed';
  console.log(`Smoke passed: ${result.routes.length} routes, ${result.assets.length} asset hashes, 8 browser views, no real submissions.`);
}catch(error){result.status='failed';result.failure=String(error);process.exitCode=1;console.error(String(error));}
finally{result.routes.sort((a,b)=>a.path.localeCompare(b.path));result.assets.sort((a,b)=>a.path.localeCompare(b.path));await fs.mkdir(path.dirname(out),{recursive:true});await fs.writeFile(out,JSON.stringify(result,null,2)+'\n');await browser.close();await client.dispose();}
