import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
const root=process.argv[2];
if(!root) throw Error('Pass extracted source root');
const mediaRoot=path.join(root,'iADDS_Media_Package_v1');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function walk(dir) { const items=[]; for(const d of await fs.readdir(dir,{withFileTypes:true})) { if(['node_modules','.next','.next-review','.open-next','.wrangler','.git','.data','dist','test-results','playwright-report'].includes(d.name)) continue; const p=path.join(dir,d.name); if(d.isDirectory()) items.push(...await walk(p)); else if(d.isFile()) items.push(p); else throw Error('Source audit does not follow symlinks: '+p); } return items; }
const baseline={}; for(const file of await walk('.')) baseline[file.replaceAll('\\','/')]=hash(await fs.readFile(file));
await fs.mkdir('.data',{recursive:true});
try { await fs.writeFile('.data/iadds-v3-baseline.json',JSON.stringify(baseline,null,2),{flag:'wx'}); } catch(e) { if(e.code!=='EEXIST')throw e; }
function csv(text) {const rows=[];let row=[],cell='',quoted=false; for(let i=0;i<text.length;i++){const c=text[i]; if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}if(cell){row.push(cell);rows.push(row);}const keys=rows.shift();return rows.map(r=>Object.fromEntries(keys.map((k,i)=>[k,r[i]])));}
const json=JSON.parse(await fs.readFile(path.join(mediaRoot,'material_manifest.json'),'utf8'));
const rows=csv((await fs.readFile(path.join(mediaRoot,'material_manifest.csv'),'utf8')).replace(/^\uFEFF/,''));
if(json.length!==41||rows.length!==41||new Set(json.map(x=>x.id)).size!==41)throw Error('Expected 41 unique source IDs');
const index=(await fs.readFile(path.join(mediaRoot,'03_visual_index/source_index.tsv'),'utf8')).trim().split(/\r?\n/).map(l=>l.split('\t'));
const files=await walk(root), primary=files.filter(f=>f.includes('01_primary_library'));
const selected=new Set([6,8,13,34,40,1,4,11,12,24,17,21,25,15,19,26,41,20,29,35,28,32,27,18,37,30,33,23,22,36]);
const assets=[];
for(const item of json){
 const matching=primary.filter(f=>path.basename(f)===item.renamed_filename);
 if(matching.length!==1)throw Error(`Missing/duplicate canonical ID ${item.id}`);
 if(index.find(([id])=>Number(id)===item.id)?.[1]!==item.original_filename)throw Error(`TSV mismatch ${item.id}`);
 for(const [key,value] of Object.entries(item))if(String(value)!==rows[item.id-1][key])throw Error(`CSV/JSON mismatch ${item.id}/${key}`);
 const file=matching[0],buffer=await fs.readFile(file), kind=file.endsWith('.mp4')?'video':'image';
 let width,height,duration,audio=false;
 if(kind==='video'){
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',file],{encoding:'utf8',maxBuffer:1e6}));
  const stream=probe.streams.find(s=>s.codec_type==='video');width=stream.width;height=stream.height;duration=Number(probe.format.duration);audio=probe.streams.some(s=>s.codec_type==='audio');
  execFileSync('ffmpeg',['-v','error','-threads','1','-i',file,'-f','null','-'],{stdio:['ignore','pipe','pipe']});
  if(Math.abs(duration-parseFloat(item.duration))>.11)throw Error(`Duration mismatch ${item.id}: ${duration}`);
 }else{ const meta=await sharp(buffer).metadata();width=meta.width;height=meta.height;await sharp(buffer).raw().toBuffer(); }
 if(`${width}x${height}`!==item.resolution)throw Error(`Resolution mismatch ${item.id}`);
 const sha256=hash(buffer),copies=files.filter(f=>f.includes('02_website_curated') && (path.basename(f)===item.renamed_filename||path.basename(f).includes(`source-${String(item.id).padStart(2,'0')}_`)));
 for(const copy of copies)if(hash(await fs.readFile(copy))!==sha256)throw Error(`Curated binary mismatch ${copy}`);
 assets.push({...item,sourcePath:path.relative(mediaRoot,file).replaceAll('\\','/'),kind,width,height,durationSeconds:duration??null,hasAudio:audio,bytes:buffer.length,sha256,curatedCopies:copies.map(f=>path.relative(mediaRoot,f).replaceAll('\\','/')),rightsStatus:'unverified',status:selected.has(item.id)?'staging-only':'reserve',reason:selected.has(item.id)?'Selected by final editorial mapping; production blocked until per-asset approval.':'Not in final editorial selection; retained privately to avoid repetitive galleries.'});
}
if(assets.filter(x=>x.kind==='video').length!==27)throw Error('Expected 27 videos');
const fileAudit=[];for(const f of files){const rel=path.relative(root,f).replaceAll('\\','/');fileAudit.push({file:rel,bytes:(await fs.stat(f)).size,sha256:hash(await fs.readFile(f)),role:rel.includes('01_primary_library')?'Canonical service media — internal catalog':rel.includes('02_website_curated')?'Editorial mapping only; duplicate hash verified, never independently copied':rel.includes('03_visual_index')?'Internal visual review/index, never served':rel.includes('04_brand')?'First-party symbol source; derive transparent brand assets':rel.includes('founder')?'First-party editorial source; privacy crop and responsive derivatives':'Source document read and applied using final override precedence'});}
const founders=fileAudit.filter(x=>x.file.includes('05_founder_assets/'));
if(founders.length!==7)throw Error('Expected seven founder files');
for(const f of founders){const matching=fileAudit.find(x=>x.file.startsWith('AI_Content_Site_Package/assets/founder/')&&x.sha256===f.sha256);if(!matching)throw Error(`Founder identity mismatch ${f.file}`);f.previousSource=matching.file;await sharp(path.join(root,f.file)).raw().toBuffer();}
const report={createdAt:new Date().toISOString(),sourceRoot:'EXTRACTED_SOURCE_ROOT (explicit CLI input; optional private archive)',counts:{unique:41,videos:27,images:14,selected:selected.size,reserve:41-selected.size,founders:7,contactSheets:7,curatedCopies:assets.reduce((n,a)=>n+a.curatedCopies.length,0)},missingOrCorrupt:[],assets,files:fileAudit};
await fs.mkdir('docs/implementation',{recursive:true});
await fs.writeFile('docs/implementation/iadds-source-inventory.json',JSON.stringify(report,null,2)+'\n');
const md=`# iADDS v3 source audit — pre-implementation\n\nCreated ${report.createdAt}. Source root: ${report.sourceRoot}. All 41 canonical files fully decoded; CSV, JSON and TSV agree. All curated copies match canonical SHA-256. Seven founder photos match prior sources byte-for-byte. No missing/corrupt files. Full per-file inventory: [JSON](./iadds-source-inventory.json).\n\n## Change matrix (recorded before UI edits)\n\n| Action | Scope | Decision |\n|---|---|---|\n| ADD | Typed media catalog, per-asset rights registry, storage adapter | Production default; local examples served only by a loopback development endpoint from private storage |\n| ADD | Posters, compact silent MP4 previews, full detail versions | One optimized canonical derivative set per selected source ID |\n| ADD | VariationSet and localization pair schema | Three paired sets; localization has honest empty state |\n| CHANGE | Central brand, metadata, logo, favicon, OG, forms | iADDS — By Antonov Digital, locked capitalization |\n| CHANGE | Founder main image and editorial flow | Jet-ski home, full-body city near philosophy, seven meaningful placements across home/About |\n| CHANGE | Mobile footer | Brand, one CTA, essential navigation, contacts, locale, real legal links, copyright |\n| REMOVE | Old lettermark and mini GoPro below home story link | Remove related wrappers/styles; keep GoPro in About story |\n| KEEP | Nine service routes, existing design, UK/EN copy, form, cases gate | Preserve prior master implementation except explicit override |\n| HIDE | All unverified service binaries from production | No copying into public; media API denied in production |\n| KEEP | Reserve sources, package docs, contact sheets | Private archival/editorial use only |\n\n## Source roles\n\n- AI Content Master: prior full semantic copy, pricing, process, founder timeline, current factual claims. Same archive SHA-256 as prior implementation; brand and founder placements overridden.\n- Old prompt and FOUNDER_ASSET_MAP: implementation checks and privacy context, superseded placement/case/brand rules explicitly recorded.\n- New README: folder roles and rights model. NEXT_FIX_BRIEF: migration/layout acceptance. CLASSIFICATION: exact service mapping and temporary coverage. MISSING_MATERIALS: internal replacement backlog, no web downloads. JSON/CSV: canonical metadata and cross-check. TSV and all seven sheets: visual ID review only.\n- Final consolidated prompt read through line 1697; separate 1222-line addendum is included verbatim. Its final override is authoritative.\n\n## Canonical source disposition\n\n| ID | File | Kind | Dimensions | Duration | Category | Status | Rights |\n|---|---|---|---|---|---|---|---|\n${assets.map(a=>`| ${String(a.id).padStart(2,'0')} | ${a.renamed_filename} | ${a.kind} | ${a.resolution} | ${a.duration||'—'} | ${a.primary_category} | ${a.status} | unverified |`).join('\n')}\n\nSelected = ${selected.size}; reserve = ${41-selected.size}. Every selected asset remains blocked from public production. 40 is allowed as the virtual-model featured example only in a contained frame no wider than 500px, resolving the featured recommendation against the mandatory native-resolution limit.\n`;
await fs.writeFile('docs/implementation/iadds-media-v1-source-audit.md',md);
console.log(JSON.stringify(report.counts));

