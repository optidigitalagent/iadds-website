import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {mediaCatalog} from '../src/content/internal/media-catalog';
import approvals from '../src/content/internal/media-approvals.json';
import {publicationApproved} from '../src/lib/media/policy';
import type {MediaApproval} from '../src/types/service-media';
/** Validate every private input before replacing the managed public derivative set. */
const destination=path.resolve('public/media/examples');
if(destination!==path.join(process.cwd(),'public','media','examples'))throw Error('Unsafe publication directory');
const managed=/^example-\d{2}-(?:(?:desktop|mobile)\.(?:avif|webp)|(?:preview|detail)\.mp4)$/;
const files=[];
for(const asset of mediaCatalog){
 const approval=approvals[String(asset.id) as keyof typeof approvals] as MediaApproval;
 if(!publicationApproved(approval))continue;
 if(!asset.derivatives.length)throw Error(`Source ${asset.id} needs selected derivatives first.`);
 const evidence=path.resolve(approval.evidence!);
 if(!evidence.startsWith(path.resolve('docs/approvals')+path.sep))throw Error('Evidence must be repository-local');
 await fs.access(evidence);
 for(const derivative of asset.derivatives){
  if(!managed.test(derivative.file))throw Error('Unexpected derivative filename');
  const data=await fs.readFile(path.join('.data/iadds-media',derivative.file));
  if(data.length!==derivative.bytes)throw Error(`Derivative size mismatch: ${derivative.file}`);
  files.push({id:asset.id,...derivative,sha256:createHash('sha256').update(data).digest('hex')});
 }
}
const expected=new Set(files.map(file=>file.file));
await fs.mkdir(destination,{recursive:true});
const removed=[];
for(const entry of await fs.readdir(destination,{withFileTypes:true})){
 if(!managed.test(entry.name)||!entry.isFile())throw Error(`Unmanaged public entry needs review: ${entry.name}`);
 if(!expected.has(entry.name)){
  const target=path.resolve(destination,entry.name);
  if(path.dirname(target)!==destination)throw Error('Unsafe stale derivative path');
  await fs.unlink(target);removed.push(entry.name);
 }
}
for(const file of files)await fs.copyFile(path.join('.data/iadds-media',file.file),path.join(destination,file.file));
const manifest={productionIds:[...new Set(files.map(file=>file.id))],files};
await fs.writeFile('docs/implementation/iadds-public-media.json',JSON.stringify(manifest,null,2)+'\n');
await fs.mkdir('.data/handoff',{recursive:true});
await fs.writeFile('.data/handoff/media-publication.json',JSON.stringify({status:'passed',...manifest,removed},null,2)+'\n');
console.log(`${manifest.productionIds.length} production source IDs, ${files.length} derivatives promoted; ${removed.length} stale managed files removed.`);
