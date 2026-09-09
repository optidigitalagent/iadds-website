import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';

// Explicit source argument keeps user originals and private source documents outside public.
const input = process.argv[2];
if (!input) throw new Error('Pass the canonical iADDS package 05_founder_assets directory.');
const out = path.resolve('public/media/founder');
await fs.mkdir(out, { recursive: true });
const specs = [
  ['portrait','founder_close_portrait.png',[.06,.23,.94,.77],[.04,.22,.96,.78],'About introduction only','Артем Антонов у кепці біля моря','Artem Antonov wearing a cap by the sea'],
  ['hockey-team','founder_hockey_team_action.png',[.06,.07,.84,.84],[.22,.05,.65,.93],'About hockey — teamwork','Артем під час хокейного матчу поруч з іншим гравцем','Artem in a hockey match alongside another player'],
  ['hockey-puck','founder_hockey_puck_action.png',[.15,.04,.7,.89],[.27,.04,.61,.91],'About hockey — concentration','Артем веде шайбу під час хокейного матчу','Artem guiding the puck during a hockey match'],
  ['urban','founder_fullbody_city.png',[0,0,1,1],[0,0,1,1],'About philosophy transition — contained full figure, maximum 300px wide','Артем на міській прогулянці, кадр на повний зріст','Full-length photograph of Artem at an urban event'],
  ['gopro','founder_gopro.png',[.06,.22,.94,.705],[.17,.25,.83,.7],'About technology and filming','Артем показує GoPro біля води','Artem holding a GoPro by the water'],
  ['boat','founder_boat.png',[0,.2,1,.5],[.37,.18,.57,.56],'About cinematic water chapter','Артем на човні під відкритим небом','Artem on a boat under the open sky'],
  ['jetski','founder_main_jetski.jpg',[0,0,1,.78],[.08,0,.84,.82],'Homepage main founder visual; About water context','Артем на водному мотоциклі біля берега','Artem on a jet ski near the shore'],
];
const manifest = [];
const media = {};
for (const [id, filename, desktop, mobile, use, uk, en] of specs) {
  const source = await fs.readFile(path.join(input, filename));
  const meta = await sharp(source).metadata();
  if (!meta.width || !meta.height) throw new Error(`Cannot decode ${filename}`);
  let processed = source;
  if (id === 'jetski') {
    const region = { left: 152, top: 448, width: 140, height: 58 };
    const mask=Buffer.from(`<svg width="140" height="58"><defs><filter id="soft"><feGaussianBlur stdDeviation="5"/></filter></defs><rect x="8" y="8" width="124" height="42" rx="8" fill="white" filter="url(#soft)"/></svg>`);
    const blurred = await sharp(source).extract(region).blur(18).composite([{input:mask,blend:'dest-in'}]).png().toBuffer();
    processed = await sharp(source).composite([{ input: blurred, left: region.left, top: region.top }]).png().toBuffer();
  }
  const outputs = [];
  for (const [role, crop] of [['desktop',desktop],['mobile',mobile]]) {
    const rect = {left:Math.round(crop[0]*meta.width),top:Math.round(crop[1]*meta.height),width:Math.round(crop[2]*meta.width),height:Math.round(crop[3]*meta.height)};
    rect.width=Math.min(rect.width,meta.width-rect.left); rect.height=Math.min(rect.height,meta.height-rect.top);
    const width=Math.min(rect.width,id==='urban'?(role==='mobile'?480:600):(role==='mobile'?640:1120));
    const height=Math.round(rect.height*width/rect.width);
    for (const format of ['avif','webp']) {
      const file=`${id}-${role}.${format}`;
      const pipeline=sharp(processed).extract(rect).resize(width,height);
      const buffer=await (format==='avif'?pipeline.avif({quality:48,effort:4}):pipeline.webp({quality:80,effort:5})).toBuffer();
      const verified=await sharp(buffer).metadata();
      if (verified.exif || verified.xmp || verified.iptc) throw new Error(`Metadata leaked: ${file}`);
      await fs.writeFile(path.join(out,file),buffer);
      outputs.push({file:'/media/founder/'+file,format,role,width,height,bytes:buffer.length,crop:rect});
    }
  }
  const privacy=id==='urban'?'Final override: contained full image in a small 300px editorial frame preserves full figure. No weapon-related copy, emphasis or aggressive cover crop. Public derivative is resized and metadata-stripped.':id==='boat'?'Lower hull and registration completely excluded from both crops.':id==='jetski'?'Readable hull registration blurred before both crops.':'Reviewed clothing, equipment and background; no readable sensitive personal identifiers. Equipment/team marks are incidental personal-history context.';
  manifest.push({id,sourceFilename:filename,sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),sourceStatus:'owner-supplied-approved',use,altKeys:{uk:`founder.${id}.uk`,en:`founder.${id}.en`},privacy,metadata:'EXIF/XMP/IPTC stripped',outputs});
  media[id]={alt:{uk,en},variants:outputs.map(({file,format,role,width,height})=>({file,format,role,width,height}))};
}
await fs.mkdir('docs',{recursive:true});
await fs.writeFile('docs/founder-media-manifest.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('src/content/site/founder-media.ts',`import type { Locale } from '@/types/content';\nconst founderMedia = ${JSON.stringify(media,null,2)};\nexport type FounderAssetId = keyof typeof founderMedia;\nexport function getFounderMedia(id: FounderAssetId, locale: Locale) { const item=founderMedia[id]; return { ...item, alt:item.alt[locale] }; }\n`);
console.log(JSON.stringify(manifest.map(({id,outputs})=>({id,derivatives:outputs.length,bytes:outputs.reduce((n,o)=>n+o.bytes,0)}))));
