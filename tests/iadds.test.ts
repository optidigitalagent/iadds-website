import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {mediaCatalog} from '../src/content/internal/media-catalog';
import approvals from '../src/content/internal/media-approvals.json';
import {approvalEvidenceComplete,publicationApproved,mediaEnvironment} from '../src/lib/media/policy';
import {selectExample,getServiceMedia} from '../src/lib/media/service-media';
import {serviceMediaMap} from '../src/content/site/service-media-map';
import {getMediaCopy} from '../src/content/site/media-copy';
import {siteConfig} from '../src/content/site/settings';
import {BrandWordmark} from '../src/components/ui/primitives';
import {WhoBehind} from '../src/components/sections/experience-sections';
import {FormatMedia} from '../src/components/services/format-media';
import type {MediaApproval} from '../src/types/service-media';

test('owner approval preserves 30 production IDs and 11 approved staging IDs',()=>{
 assert.equal(mediaCatalog.length,41);assert.equal(new Set(mediaCatalog.map(a=>a.id)).size,41);assert.equal(mediaCatalog.filter(a=>a.kind==='video').length,27);assert.equal(Object.keys(approvals).length,41);
 const production=[1,4,6,8,11,12,13,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,32,33,34,35,36,37,40,41];
 for(const a of mediaCatalog){const p=approvals[String(a.id) as keyof typeof approvals];assert.equal(p.rightsStatus,'approved-for-publication');assert.equal(p.reviewStatus,'approved');assert.equal(p.approvedAt,'2026-09-10');assert.ok(approvalEvidenceComplete(p as MediaApproval));assert.ok(readFileSync(p.evidence,'utf8').includes('Artem Antonov'));assert.equal(p.publicationScope,production.includes(a.id)?'production':'staging');assert.equal(Boolean(selectExample(a.id,'en','production')),production.includes(a.id));assert.match(a.sourceSha256,/^[a-f0-9]{64}$/);}
 const audit=JSON.parse(readFileSync('docs/implementation/iadds-source-inventory.json','utf8'));assert.equal(audit.counts.curatedCopies,52);assert.equal(audit.missingOrCorrupt.length,0);
});
test('production cannot be enabled by a local flag or partial rights approval',()=>{
 assert.equal(mediaEnvironment({NODE_ENV:'production',IADDS_MEDIA_MODE:'local',SITE_URL:'http://127.0.0.1:3100'}),'production');
 assert.equal(mediaEnvironment({NODE_ENV:'development',IADDS_MEDIA_MODE:'local',SITE_URL:'https://iadds.example'}),'production');
 assert.equal(mediaEnvironment({NODE_ENV:'development',IADDS_MEDIA_MODE:'local',SITE_URL:'http://127.0.0.1:3100'}),'local');
 const approved:MediaApproval={rightsStatus:'approved-for-publication',publicationScope:'production',reviewStatus:'approved',approvedBy:'Rights reviewer fixture',approvedAt:'2026-09-09',evidence:'Permission fixture'};assert.ok(publicationApproved(approved));
 for(const change of [{rightsStatus:'unverified'},{approvedAt:null},{approvedBy:null},{evidence:null},{reviewStatus:'pending'},{publicationScope:'local'},{publicationScope:'staging'}])assert.equal(publicationApproved({...approved,...change} as MediaApproval),false);
});
test('editorial mapping preserves pairs, underfilled galleries and native sizes',()=>{
 assert.equal(Object.keys(serviceMediaMap).length,9);assert.deepEqual(serviceMediaMap['performance-creatives'].variationSets?.map(s=>s.ids),[[30,33],[17,23],[22,36]]);
 for(const locale of ['uk','en'] as const){
  for(const slug of Object.keys(serviceMediaMap)){const m=getServiceMedia(slug,locale,'local');assert.ok(m.gallery.length<=5);assert.equal(m.gallery.some(a=>a.id===m.featured?.id),false);for(const a of [...m.card,...m.gallery,...(m.featured?[m.featured]:[])]){assert.ok(a.alt);assert.ok(a.posterAvif);assert.equal('sourcePath' in a,false);if(a.kind==='video')assert.ok(a.preview&&a.detail&&a.duration);}}
  const l=getServiceMedia('video-localization',locale,'local');assert.equal(l.gallery.length,0);assert.equal(l.card.length,0);assert.equal(l.pairs.length,0);
  assert.equal(getServiceMedia('ai-spokesperson',locale,'local').gallery.length,1);assert.equal(getServiceMedia('virtual-models',locale,'local').featured?.smallOnly,true);
 }
});
test('branding is exact and founder preview contains only the jet-ski visual',()=>{
 const logo=renderToStaticMarkup(createElement(BrandWordmark));assert.match(logo,/iADDS/);assert.match(logo,/By Antonov Digital/);assert.doesNotMatch(logo,/IADDS|source_black_square/);
 assert.equal(siteConfig.brand.name,'Antonov Digital');
 for(const locale of ['uk','en'] as const){const html=renderToStaticMarkup(createElement(WhoBehind,{locale}));assert.match(html,/data-founder-photo="jetski"/);assert.equal((html.match(/data-founder-photo=/g)||[]).length,1);assert.doesNotMatch(html,/previewInset|AI Content|AI CONTENT/);}
});
test('actual package previews ship posters without eager video sources',()=>{
 const media=selectExample(6,'uk','local')!;const html=renderToStaticMarkup(createElement(FormatMedia,{media,card:true,labels:getMediaCopy('uk')}));
 const tag=html.match(/<video[^>]*>/)![0];assert.match(tag,/muted/);assert.match(tag,/playsInline/i);assert.match(tag,/preload="none"/);assert.doesNotMatch(tag,/\ssrc=/);assert.match(html,/image\/avif/);
});
