import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import sharp from 'sharp';
import { getAllServices, getDictionary, getExperience, getFaq, getProcessSteps, getPublishedCases, getNavigation, getSiteConfig, isPublishedCase } from '../src/lib/content';
import { validateLocaleParity } from '../src/lib/content/validate';
import { getServiceCommercial } from '../src/content/site/service-commercial';
import { cases } from '../src/content/cases';
import { safeSourcePage, consultationHref } from '../src/lib/urls';

test('package public content has full locale parity and the approved structural counts', () => {
  validateLocaleParity({en:getExperience('en'),uk:getExperience('uk')},{en:getAllServices('en'),uk:getAllServices('uk')});
  for(const locale of ['uk','en'] as const) {
    const e=getExperience(locale);
    assert.equal(getProcessSteps(locale).length,7); assert.equal(getFaq(locale).length,13);
    assert.equal(e.founder.timeline.length,8);assert.equal(e.founder.competencies.length,6);assert.equal(e.founder.principles.length,6);assert.equal(e.company.items.length,9);
    assert.equal(e.test.facts.length,5);assert.equal(e.pricing.items.length,3);assert.equal(e.systems.benefits.length,5);
    assert.equal(getAllServices(locale).some(s=>s.slug==='ai-systems'),false);
    for(const service of getAllServices(locale))for(const value of Object.values(getServiceCommercial(service.slug,locale)))assert.ok(value.trim());
    assert.match(JSON.stringify(e.test),/watermark/);assert.match(JSON.stringify(e.test),/1–2/);
    assert.match(e.pricing.items[0],/\$5/);assert.match(e.pricing.items[1],/\$15/);assert.doesNotMatch(JSON.stringify(e.systems),/\$50|1,500|\$300/);
  }
  assert.equal(getSiteConfig().brand.founderIdentity,'Artem Antonov — Founder & CEO of Antonov Digital');
});

test('draft case remains hidden even when only status and permission are switched on', () => {
  assert.equal(cases.length,1);assert.equal(cases[0].slug,'moda-castle');assert.equal(cases[0].status,'draft');
  assert.equal(getPublishedCases().length,0);
  assert.equal(isPublishedCase({...cases[0],status:'published',approvals:{clientPublication:true,clientNameVerified:true,approvedAt:'2026-09-09'}}),false);
  for(const locale of ['uk','en'] as const) {
    assert.ok(getNavigation(locale).some(n=>n.href===`/${locale}/ai-systems`));
    assert.ok(getNavigation(locale).some(n=>n.href===`/${locale}/#faq`));
    assert.equal(getNavigation(locale).some(n=>/pricing|cases/.test(n.href)),false);
    assert.equal(safeSourcePage(`/${locale}/ai-systems`,locale),`/${locale}/ai-systems`);
    assert.equal(safeSourcePage(`/${locale}/pricing`,locale),`/${locale}/pricing`);
    const link=new URL(consultationHref(locale,{model:'system',sourcePage:`/${locale}/ai-systems`}),'https://example.test');
    assert.equal(link.searchParams.get('model'),'system');assert.equal(link.searchParams.get('from'),`/${locale}/ai-systems`);
  }
});

test('all seven founder assets have valid responsive derivatives with metadata removed', async () => {
  const manifest=JSON.parse(readFileSync('docs/founder-media-manifest.json','utf8')) as {id:string;privacy:string;sourceFilename:string;outputs:{file:string;width:number;height:number;role:string;format:string}[]}[];
  assert.equal(manifest.length,7);assert.equal(new Set(manifest.map(m=>m.sourceFilename)).size,7);
  for(const item of manifest) {
    assert.equal(item.outputs.length,4);assert.ok(item.privacy);
    for(const output of item.outputs) {
      const metadata=await sharp('public'+output.file).metadata();
      assert.equal(metadata.width,output.width);assert.equal(metadata.height,output.height);
      assert.equal(metadata.exif,undefined);assert.equal(metadata.xmp,undefined);assert.equal(metadata.iptc,undefined);
      assert.ok(output.file.endsWith('.'+output.format));
    }
  }
  assert.match(manifest.find(m=>m.id==='urban')!.privacy,/contained full image/);
  assert.match(manifest.find(m=>m.id==='boat')!.privacy,/registration completely excluded/);
  assert.match(manifest.find(m=>m.id==='jetski')!.privacy,/registration blurred/);
});

test('public dictionaries do not contain internal pricing, draft narrative or unresolved tokens', () => {
  for(const locale of ['uk','en'] as const) {
    const json=JSON.stringify({dictionary:getDictionary(locale),experience:getExperience(locale),faq:getFaq(locale)});
    assert.doesNotMatch(json,/Moda Castle|TODO_COMMERCIAL_TERMS|\{\{|aiSystemDevelopment|ongoingInfrastructure/);
  }
});

