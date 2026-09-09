import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';

const root=process.argv[2];
if(!root)throw Error('Pass the extracted iADDS_Media_Package_v1 directory. Originals remain private.');
const audit=JSON.parse(await fs.readFile('docs/implementation/iadds-source-inventory.json','utf8'));
const out=path.resolve('.data/iadds-media');
await fs.mkdir(out,{recursive:true});
await fs.mkdir('qa/iadds-v3',{recursive:true});
const generated=[];
const refresh=process.argv[3]?.split(',').map(Number);
const previous=refresh?JSON.parse(await fs.readFile('docs/implementation/iadds-media-derivatives.json','utf8')):[];
const posterTimes={6:3,8:1.2,11:1,13:1.2,15:1.2,18:1.2,19:1,20:1,23:1.5,26:1,27:1.2,28:1.8,29:1.2,30:2,32:1.2,33:1,34:1.2,35:1.5,37:1,40:3,41:1.2};
function ff(args){execFileSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-threads','1',...args],{stdio:['ignore','pipe','pipe']});}
for(const a of audit.assets){
 if(refresh&&!refresh.includes(a.id)){generated.push(previous.find(p=>p.id===a.id));continue;}
 const id=String(a.id).padStart(2,'0'),source=path.join(root,a.sourcePath),derivatives=[];
 if(a.status==='staging-only'){
  let input=source;
  if(a.kind==='video'){
   input=path.join(out,`example-${id}-frame.png`);
   ff(['-ss',String(posterTimes[a.id]??1.2),'-i',source,'-frames:v','1',input]);
   for(const role of ['preview','detail']){
    const file=`example-${id}-${role}.mp4`;
    const args=[...(role==='preview'?['-ss',String(posterTimes[a.id]??1.2)]:[]),'-i',source,'-map','0:v:0'];
    if(role==='preview')args.push('-t','4.5','-vf',`scale=${Math.floor(Math.min(400,a.width)/2)*2}:-2,fps=24`,'-an');
    else args.push('-map','0:a?','-c:a','aac','-b:a','96k');
    args.push('-c:v','libx264','-threads','1','-preset','fast','-crf',role==='preview'?'28':'24','-pix_fmt','yuv420p','-map_metadata','-1','-movflags','+faststart',path.join(out,file));
    ff(args);
    const p=JSON.parse(execFileSync('ffprobe',['-v','error','-show_streams','-show_format','-of','json',path.join(out,file)],{encoding:'utf8'}));
    const s=p.streams.find(s=>s.codec_type==='video');
    if(role==='preview'&&p.streams.some(s=>s.codec_type==='audio'))throw Error('Card audio leaked');
    derivatives.push({file,role,format:'mp4',width:s.width,height:s.height,bytes:(await fs.stat(path.join(out,file))).size,duration:Number(p.format.duration),hasAudio:p.streams.some(s=>s.codec_type==='audio')});
   }
  }
  for(const role of ['desktop','mobile'])for(const format of ['avif','webp']){
   const file=`example-${id}-${role}.${format}`,w=Math.min(a.width,role==='desktop'?960:480);
   const {data,info}=await sharp(input).resize({width:w,withoutEnlargement:true}).toFormat(format,{quality:format==='avif'?48:78,effort:4}).toBuffer({resolveWithObject:true});
   await fs.writeFile(path.join(out,file),data);
   const m=await sharp(data).metadata();if(m.exif||m.xmp||m.iptc)throw Error(`Metadata in ${file}`);
   derivatives.push({file,role,format,width:info.width,height:info.height,bytes:data.length});
  }
  if(a.kind==='video')await fs.unlink(input);
 }
 generated.push({...a,posterTime:a.kind==='video'?posterTimes[a.id]??1.2:null,derivatives});
 console.log(`${id}: ${derivatives.length} derivatives (${a.status})`);
}
await fs.writeFile('docs/implementation/iadds-media-derivatives.json',JSON.stringify(generated,null,2)+'\n');
// Server catalog includes provenance; never import it into a client component.
const entries=generated.map(a=>({id:a.id,kind:a.kind,sourceFilename:a.renamed_filename,sourcePath:a.sourcePath,sourceSha256:a.sha256,width:a.width,height:a.height,duration:a.durationSeconds,category:a.primary_category,description:a.description,tags:a.tags.split(', '),smallOnly:a.width===500&&a.height===376,disposition:a.status,focalPoint:{desktop:'50% 50%',mobile:'50% 50%'},derivatives:a.derivatives}));
await fs.mkdir('src/content/internal',{recursive:true});
await fs.writeFile('src/content/internal/media-catalog.ts',`import type { CatalogAsset } from '@/types/service-media';\n/** Private server/build catalog. Generated from audited source IDs, never shipped to clients. */\nexport const mediaCatalog: CatalogAsset[] = ${JSON.stringify(entries,null,2)};\n`);
// Visual review sheet made only from actual posters, not used by the website.
const tiles=[];let i=0;
for(const a of generated.filter(a=>a.derivatives.length)){
 const f=a.derivatives.find(d=>d.role==='mobile'&&d.format==='webp');
 const pic=await sharp(path.join(out,f.file)).resize(180,220,{fit:'contain',background:'#101014'}).extend({top:0,bottom:25,left:0,right:0,background:'#101014'}).composite([{input:Buffer.from(`<svg width="180" height="25"><text x="8" y="18" font-family="Arial" font-size="15" fill="white">${String(a.id).padStart(2,'0')} · ${a.kind}</text></svg>`),left:0,top:220}]).png().toBuffer();
 tiles.push({input:pic,left:(i%6)*180,top:Math.floor(i/6)*245});i++;
}
await sharp({create:{width:1080,height:Math.ceil(i/6)*245,channels:3,background:'#101014'}}).composite(tiles).jpeg({quality:85}).toFile('qa/iadds-v3/posters-review.jpg');
