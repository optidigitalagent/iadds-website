import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const input=process.argv[2];if(!input)throw Error('Pass iADDS logo presentation source');
const source=await fs.readFile(input),meta=await sharp(source).metadata();
const region={left:Math.round(meta.width*350/1280),top:Math.round(meta.height*220/1280),width:Math.round(meta.width*550/1280),height:Math.round(meta.height*480/1280)};
const {data,info}=await sharp(source).extract(region).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const mono=Buffer.from(data);
for(let i=0;i<data.length;i+=4){const peak=Math.max(data[i],data[i+1],data[i+2]),alpha=Math.max(0,Math.min(1,(peak-12)/105));for(let c=0;c<3;c++)data[i+c]=alpha?Math.min(255,Math.round(data[i+c]/alpha)):0;data[i+3]=Math.round(alpha*255);mono[i]=mono[i+1]=mono[i+2]=255;mono[i+3]=Math.round(Math.max(0,Math.min(1,(peak-95)/100))*255);}
const out='public/media/brand';await fs.mkdir(out,{recursive:true});const outputs=[];
for(const size of [32,48,128,256]){const name=size<=48?`iadds-favicon-${size}.png`:`iadds-symbol-${size}.png`;await sharp(data,{raw:info}).resize(size,size,{fit:'contain',background:'#00000000'}).png().toFile(path.join(out,name));outputs.push(name);}
await sharp(mono,{raw:info}).resize(128,128,{fit:'contain',background:'#00000000'}).png().toFile(path.join(out,'iadds-symbol-white-128.png'));outputs.push('iadds-symbol-white-128.png');
await sharp(data,{raw:info}).resize(148,148,{fit:'contain',background:'#050506'}).extend({top:16,bottom:16,left:16,right:16,background:'#050506'}).png().toFile(path.join(out,'iadds-app-180.png'));outputs.push('iadds-app-180.png');
// Hybrid SVG preserves the supplied symbol and uses sharp text; it is NOT a vector master.
const symbol=(await fs.readFile(path.join(out,'iadds-symbol-256.png'))).toString('base64');
for(const endorsed of [false,true]){const name=endorsed?'iadds-endorsed.svg':'iadds-horizontal.svg';const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="160" viewBox="0 0 640 160" role="img" aria-label="iADDS — By Antonov Digital"><image href="data:image/png;base64,${symbol}" x="0" y="0" width="150" height="150"/><text x="166" y="${endorsed?88:109}" fill="#f7f7f5" font-family="Arial,sans-serif" font-size="${endorsed?79:92}" font-weight="800" letter-spacing="-3">iADDS</text>${endorsed?'<text x="170" y="127" fill="#f7f7f5" font-family="Arial,sans-serif" font-size="23">By Antonov Digital</text>':''}</svg>`;await fs.writeFile(path.join(out,name),svg);outputs.push(name);}
await fs.writeFile('docs/implementation/iadds-brand-manifest.json',JSON.stringify({sourceFilename:path.basename(input),sourceSha256:crypto.createHash('sha256').update(source).digest('hex'),symbolCrop:region,background:'Black removed into alpha; monochrome threshold removes glow',needsVectorMaster:true,outputs:outputs.map(file=>'/media/brand/'+file),header:'Transparent symbol + live HTML wordmark',mobile:'Same compact HTML lockup',og:'Localized Next ImageResponse using supplied symbol and live typography'},null,2)+'\n');
console.log(outputs.join('\n'));
// Embed small, approved OG inputs so the same ImageResponse works on Node and Workers.
const og={symbol:(await fs.readFile(path.join(out,'iadds-symbol-128.png'))).toString('base64'),latin:(await fs.readFile('public/fonts/manrope-latin-og.ttf')).toString('base64'),cyrillic:(await fs.readFile('public/fonts/manrope-cyrillic-og.ttf')).toString('base64')};
await fs.writeFile('src/content/internal/og-assets.json',JSON.stringify(og)+'\n');
