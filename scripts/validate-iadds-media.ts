import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mediaCatalog} from '../src/content/internal/media-catalog';
import approvals from '../src/content/internal/media-approvals.json';
import {serviceMediaMap} from '../src/content/site/service-media-map';
import {publicationApproved} from '../src/lib/media/policy';
import type {MediaApproval} from '../src/types/service-media';
import {getServiceMedia} from '../src/lib/media/service-media';
import {siteConfig} from '../src/content/site/settings';
import {getAllServices,getDictionary,getExperience,getPublishedCases} from '../src/lib/content';
export async function validateMedia(){
 const fail=(s:string):never=>{throw Error(`iADDS media validation: ${s}`);};
 if(mediaCatalog.length!==41||new Set(mediaCatalog.map(a=>a.id)).size!==41||mediaCatalog.filter(a=>a.kind==='video').length!==27)fail('Expected 41 canonical assets: 27 videos, 14 images.');
 for(const a of mediaCatalog){
  if(a.width<=0||a.height<=0||!a.sourceFilename.endsWith(a.kind==='video'?'.mp4':'.avif'))fail(`Invalid source ${a.id}`);
  const approval=approvals[String(a.id) as keyof typeof approvals] as MediaApproval;if(!approval)fail(`Missing rights record ${a.id}`);
  if(approval.rightsStatus==='unverified'&&approval.publicationScope==='production')fail(`Unverified ${a.id} cannot use production scope.`);
  if(approval.reviewStatus==='approved'&&!publicationApproved(approval))fail(`Approval ${a.id} requires scope, reviewer, date and evidence.`);
  if(a.disposition==='staging-only'&&(a.derivatives.length!==(a.kind==='video'?6:4)||a.kind==='video'&&!a.duration))fail(`Missing derivatives/poster/duration ${a.id}`);
  if(a.derivatives.some(d=>d.role==='preview'&&d.hasAudio))fail(`Preview audio ${a.id}`);
  if(publicationApproved(approval))for(const d of a.derivatives)await fs.access('public/media/examples/'+d.file).catch(()=>fail(`Approved file missing: ${d.file}. Run media:publish-approved.`));
 }
 for(const locale of ['uk','en'] as const){
  for(const service of getAllServices(locale)){const map=serviceMediaMap[service.slug];if(!map)fail(`No mapping ${service.slug}`);if(map.gallery.length>5)fail(`Gallery exceeds five: ${service.slug}`);getServiceMedia(service.slug,locale,'local');getServiceMedia(service.slug,locale,'production');}
  if(/AI Content|AI CONTENT/.test(JSON.stringify([getDictionary(locale),getExperience(locale)])))fail('Old project label remains in active dictionaries.');
 }
 if(serviceMediaMap['video-localization'].gallery.length||serviceMediaMap['video-localization'].card.length)fail('Unrelated localization media.');
 if(siteConfig.brand.productName!=='iADDS'||siteConfig.brand.endorsement!=='By Antonov Digital')fail('Brand capitalization/endorsement mismatch.');
 if(getPublishedCases().length)fail('Package release expects no published cases; re-review trust gates before enabling.');
 const sourceHashes=new Set(mediaCatalog.map(a=>a.sourceSha256));
 async function scan(dir:string){for(const d of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,d.name);if(d.isDirectory())await scan(p);else{
  if(/(?:source[_-]index|material_manifest|sheet_\d|\.zip$)/i.test(d.name))fail(`Internal package file leaked: ${p}`);
  if(sourceHashes.has(createHash('sha256').update(await fs.readFile(p)).digest('hex')))fail(`Source service binary leaked: ${p}`);
  if(/example-\d{2}-/.test(d.name)){const id=Number(/example-(\d{2})-/.exec(d.name)![1]);const a=approvals[String(id) as keyof typeof approvals] as MediaApproval;if(!a||!publicationApproved(a))fail(`Unverified derivative leaked: ${p}`);}
 }}}
 await scan('public');
 const founder=JSON.parse(await fs.readFile('docs/founder-media-manifest.json','utf8'));if(founder.length!==7)fail('Expected seven founder images.');for(const a of founder)for(const d of a.outputs)await fs.access('public'+d.file).catch(()=>fail(`Founder derivative missing: ${d.file}`));
 for(const p of [siteConfig.brand.logo.symbol,siteConfig.brand.logo.favicon,siteConfig.brand.logo.apple,siteConfig.brand.logo.monochrome])await fs.access('public'+p).catch(()=>fail(`Brand derivative missing: ${p}`));
 console.log('iADDS: 41 canonical assets, nine mappings, founder/logo derivatives and production rights checks passed.');
}
await validateMedia();
