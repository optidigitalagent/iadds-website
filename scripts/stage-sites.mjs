import fs from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {publicationApproved} from '../src/lib/media/policy.ts';
const root=process.cwd();
const nextConfig=JSON.parse(await fs.readFile('.next/required-server-files.json','utf8'));
if(nextConfig.config.distDir!=='.next')throw Error('Sites accepts the production .next artifact only.');
const catalog=JSON.parse(await fs.readFile('docs/implementation/iadds-source-inventory.json','utf8'));
const hashes=new Set(catalog.assets.map(a=>a.sha256));
const approvals=JSON.parse(await fs.readFile('src/content/internal/media-approvals.json','utf8'));
const unapprovedIds=new Set(Object.entries(approvals).filter(([,a])=>!publicationApproved(a)).map(([id])=>Number(id)));
const manifest=JSON.parse(await fs.readFile('.openai/hosting.json','utf8'));
if(manifest.project_id!=='appgprj_6aa1bf1d22388191952c4f2570644211')throw Error('Unexpected Sites project.');
const bundled=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','deploy','--dry-run','--outdir','.data/sites-worker-bundle'],{stdio:'inherit',windowsHide:true,env:{...process.env,WRANGLER_SEND_METRICS:'false'}});
if(bundled.status!==0)process.exit(bundled.status??1);
const destination=path.resolve('dist');
if(destination!==path.join(root,'dist')||path.dirname(destination)!==root)throw Error('Unsafe staging directory.');
await fs.rm(destination,{recursive:true,force:true});
await fs.mkdir('dist/server',{recursive:true});await fs.mkdir('dist/.openai',{recursive:true});
for(const f of await fs.readdir('.data/sites-worker-bundle'))if(!f.endsWith('.map')&&f!=='README.md'){
 const input=await fs.readFile('.data/sites-worker-bundle/'+f);
 await fs.writeFile('dist/server/'+(f==='worker.js'?'index.js':f),f==='worker.js'?input.toString('utf8').replace(/\/\/# sourceMappingURL=.*$/gm,''):input);
}
await fs.cp('.open-next/assets','dist/client',{recursive:true});
await fs.writeFile('dist/.openai/hosting.json',JSON.stringify(manifest)+'\n');
const files=[];
async function scan(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await scan(p);else if(!e.isFile())throw Error('No symlinks or special files in deployment.');else{
 const data=await fs.readFile(p),sha256=createHash('sha256').update(data).digest('hex');
 const exampleId=/example-(\d{2})-/.exec(e.name);
 if(hashes.has(sha256)||(exampleId&&unapprovedIds.has(Number(exampleId[1])))||/material_manifest|source_index|contact.sheet|\.zip$/i.test(e.name))throw Error('Private/unverified source leaked: '+p);
 if(p.startsWith(path.join('dist','client'))&&/\.(html|js|rsc|txt|json)$/.test(p)){
  const value=data.toString('utf8');if(value.includes('/api/format-media/')||[...unapprovedIds].some(id=>value.includes(`/media/examples/example-${String(id).padStart(2,'0')}-`))||/AI Content|AI CONTENT/.test(value))throw Error('Review URL or stale project name in production client: '+p);
  for(const a of catalog.assets)if(value.includes(a.original_filename)||value.includes(a.renamed_filename)||value.includes(a.sha256))throw Error('Source provenance leaked into client: '+p);
 }
 files.push({file:p.replaceAll('\\','/'),bytes:data.length,sha256});
}}}
await scan('dist');
await fs.writeFile('qa/iadds-v3/production-artifact.json',JSON.stringify({status:'passed',unverifiedBinaries:0,reviewUrlsInClient:0,sourceProvenanceInClient:0,files},null,2)+'\n');
console.log(`Sites Worker staged: ${files.length} regular files; no unverified media or review URLs in client assets.`);
