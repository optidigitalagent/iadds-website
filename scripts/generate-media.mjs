import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { services } from '../src/content/en/services.ts';
import sharp from 'sharp';
import { services as ukServices } from '../src/content/uk/services.ts';
import { copy as enCopy } from '../src/content/en/site.ts';
import { copy as ukCopy } from '../src/content/uk/site.ts';
const directory = new URL('../public/media/', import.meta.url);
await mkdir(directory, { recursive: true });
function wrap(body, color = '#ff2d62', width = 960, height = 640, background = '#08090c') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 960 640"><defs>
  <radialGradient id="bg"><stop stop-color="${color}" stop-opacity=".12"/><stop offset="1" stop-color="${background}"/></radialGradient>
  <linearGradient id="metal" x1="0" y1="0" x2="1" y2=".8"><stop stop-color="#696b71"/><stop offset=".16" stop-color="#23252c"/><stop offset=".48" stop-color="#0a0b0f"/><stop offset=".75" stop-color="#3c3d46"/><stop offset="1" stop-color="#0b0c10"/></linearGradient>
  <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd2de"/><stop offset=".22" stop-color="${color}"/><stop offset=".56" stop-color="${color}" stop-opacity=".65"/><stop offset="1" stop-color="#20030d"/></linearGradient>
  <linearGradient id="edge"><stop stop-color="${color}" stop-opacity=".08"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>
  <radialGradient id="floor"><stop stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>
  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="14"/></filter>
  <filter id="smallGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="4"/></filter>
  <filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feDropShadow dx="0" dy="24" stdDeviation="20" flood-color="#000" flood-opacity=".8"/></filter>
  </defs><rect width="960" height="640" fill="${background}"/><rect width="960" height="640" fill="url(#bg)"/><path d="M0 540H960" stroke="#fff" stroke-opacity=".035"/><ellipse cx="480" cy="520" rx="330" ry="95" fill="url(#floor)"/>${body}</svg>`;
}
const hero = `<g opacity=".65"><ellipse cx="500" cy="370" rx="410" ry="185" fill="none" stroke="url(#edge)" stroke-width="1" transform="rotate(-27 500 370)"/><ellipse cx="490" cy="370" rx="475" ry="228" fill="none" stroke="#ff2d62" stroke-opacity=".13" transform="rotate(-27 490 370)"/></g>
<ellipse cx="530" cy="516" rx="255" ry="35" fill="#ff174f" opacity=".15" filter="url(#glow)"/>
<g transform="translate(85 -6) rotate(-12 450 340)" filter="url(#shadow)">
<path d="M260 478 325 159 526 111 650 410 572 462 488 230 402 249 359 490Z" fill="#12131a" stroke="#4a3a42" stroke-width="1.2"/>
<path d="M260 478 325 159 383 195 317 511Z" fill="url(#metal)"/>
<path d="M325 159 526 111 587 144 383 195Z" fill="url(#metal)"/>
<path d="M526 111 650 410 704 447 587 144Z" fill="url(#accent)"/>
<path d="M383 195 587 144 704 447 624 496 532 260 452 280 406 541 317 511Z" fill="url(#metal)" stroke="#71727a" stroke-opacity=".3"/>
<path d="M383 195 587 144 704 447" fill="none" stroke="#ff517c" stroke-width="3"/>
<path d="M383 195 587 144 704 447" fill="none" stroke="#ff174f" stroke-width="13" opacity=".7" filter="url(#glow)"/>
<path d="M452 280 532 260 578 379 430 414Z" fill="#050506"/>
<path d="M430 414 578 379 596 422 421 463Z" fill="url(#accent)"/>
<path d="M317 511 383 195" fill="none" stroke="#ffe1e9" stroke-opacity=".5"/>
<path d="M406 541 452 280 532 260" fill="none" stroke="#ff2d62" stroke-opacity=".7"/>
</g><circle cx="791" cy="226" r="4" fill="#b7ff3c"/><path d="M803 226h65M791 213v-36" stroke="#b7ff3c" stroke-opacity=".3"/>`;
const scenes = {
  'hero': hero,
  'ai-video-ads': `<g transform="translate(60 28)"><rect x="95" y="90" width="650" height="400" rx="10" fill="#111015" stroke="#5f343f"/><rect x="112" y="107" width="616" height="366" rx="3" fill="#08090c"/><ellipse cx="434" cy="315" rx="266" ry="143" fill="url(#floor)"/><path d="M272 390C163 267 333 128 465 223S664 397 546 411 349 312 449 223" fill="none" stroke="url(#accent)" stroke-width="72" filter="url(#shadow)"/><path d="M269 371C170 265 337 145 464 238" fill="none" stroke="#ff9ab3" stroke-width="1.5"/><path d="M50 537 789 371M23 561 824 392" stroke="url(#edge)" opacity=".5"/><path d="M116 107h64M112 111v45M724 420v49h-60" stroke="#efbecb" stroke-opacity=".7"/></g>`,
  'product-visuals': `<ellipse cx="487" cy="480" rx="220" ry="70" fill="#07080a" stroke="#54574b"/><path d="M267 470v43c0 92 440 92 440 0v-43" fill="url(#metal)"/><ellipse cx="487" cy="470" rx="220" ry="64" fill="url(#metal)" stroke="#a9bf7e" stroke-opacity=".4"/><g transform="rotate(-14 480 310)" filter="url(#shadow)"><rect x="402" y="158" width="162" height="294" rx="45" fill="url(#metal)" stroke="#b5b9a5" stroke-opacity=".5"/><path d="M440 160v291" stroke="#e6eccf" stroke-opacity=".35"/><rect x="412" y="209" width="142" height="8" rx="4" fill="#b7ff3c"/><rect x="410" y="207" width="146" height="12" fill="#b7ff3c" filter="url(#glow)" opacity=".45"/></g><ellipse cx="493" cy="342" rx="283" ry="165" fill="none" stroke="url(#edge)" stroke-width="1" transform="rotate(-29 493 342)"/>`,
  'virtual-models': `<rect x="240" y="73" width="480" height="485" rx="180" fill="#110b10" stroke="#6b3041"/><ellipse cx="480" cy="256" rx="84" ry="101" fill="url(#metal)" transform="rotate(18 480 256)"/><path d="M441 341 404 390 343 528h286L566 390 520 337" fill="url(#metal)" stroke="#5a4651"/><path d="M441 341 470 428 520 337" fill="#121319"/><path d="M397 397 349 520M554 391 619 520" stroke="url(#accent)" stroke-width="2"/><path d="M560 170c30 54 31 124-7 163" fill="none" stroke="#ff2d62" stroke-width="4"/><path d="M564 170c30 54 31 124-7 163" fill="none" stroke="#ff2d62" stroke-width="25" filter="url(#glow)" opacity=".6"/><path d="M204 181v-52h53M704 496v52h-53" fill="none" stroke="#c08697" stroke-opacity=".5"/>`,
  'ai-ugc': `<g transform="rotate(11 480 320)" filter="url(#shadow)"><rect x="346" y="65" width="267" height="506" rx="38" fill="url(#metal)" stroke="#656c58" stroke-width="2"/><rect x="357" y="77" width="245" height="483" rx="29" fill="#10140e"/><rect x="436" y="90" width="88" height="14" rx="7" fill="#030503"/><ellipse cx="480" cy="304" rx="105" ry="150" fill="url(#floor)"/><rect x="424" y="220" width="112" height="169" rx="28" fill="url(#metal)" stroke="#a7bf81" stroke-opacity=".7"/><path d="M432 258h96" stroke="#b7ff3c" stroke-width="5"/><rect x="383" y="442" width="152" height="8" rx="4" fill="#9aa38d"/><rect x="383" y="462" width="114" height="6" rx="3" fill="#5a654f"/><rect x="383" y="493" width="194" height="29" rx="10" fill="#b7ff3c" fill-opacity=".8"/></g><path d="M244 460C132 350 267 135 382 110M641 508c90-77 83-244 23-320" fill="none" stroke="url(#edge)"/>`,
  'ai-spokesperson': `<rect x="187" y="124" width="585" height="347" rx="18" fill="#120d11" stroke="#69404f"/><ellipse cx="480" cy="255" rx="61" ry="73" fill="url(#metal)"/><path d="M385 416v-44c0-89 190-89 190 0v44" fill="url(#metal)" stroke="#69535b"/><path d="M539 206c14 29 14 61-3 83" fill="none" stroke="#ff2d62" stroke-width="3"/><rect x="311" y="448" width="340" height="69" rx="20" fill="#151017" stroke="#753649"/>${Array.from({length:33},(_,i)=>`<rect x="${335+i*9}" y="${483-(8+Math.sin(i*.85)**2*33)/2}" width="3" height="${8+Math.sin(i*.85)**2*33}" rx="1.5" fill="${i>17?'#825563':'#ff648e'}"/>`).join('')}<path d="M218 146h55M218 146v40M742 408v40h-55" fill="none" stroke="#d7a9b7" stroke-opacity=".5"/>`,
  'video-localization': `<g transform="translate(20 0)"><rect x="194" y="133" width="480" height="287" rx="15" fill="#13170f" stroke="#545e45" transform="rotate(-9 434 276)"/><rect x="261" y="172" width="480" height="287" rx="15" fill="url(#metal)" stroke="#819563"/><path d="M297 360h230m-230 26h323" stroke="#b7ff3c" stroke-width="9" stroke-linecap="round" opacity=".7"/><rect x="474" y="80" width="204" height="59" rx="15" fill="#151a10" stroke="#8bae52"/><path d="M499 111h71m15 0h62" stroke="#b7ff3c" stroke-width="7" stroke-linecap="round"/><rect x="345" y="480" width="350" height="39" rx="12" fill="#10140c" stroke="#475831"/>${Array.from({length:38},(_,i)=>`<path d="M${363+i*8} ${500-Math.sin(i*.6)**2*11}v${Math.sin(i*.6)**2*22+2}" stroke="#b7ff3c" stroke-opacity=".7" stroke-width="2"/>`).join('')}<path d="m303 311 102-97 93 85 79-45 124 91" fill="none" stroke="#919883" stroke-width="1"/></g>`,
  'explainer-videos': `<path d="M266 308h431" stroke="#b7ff3c" stroke-width="1" stroke-opacity=".6" stroke-dasharray="5 9"/>${[0,1,2].map((n)=>`<g transform="translate(${n*222} ${n===1?-30:35})"><rect x="175" y="213" width="172" height="176" rx="26" fill="url(#metal)" stroke="#738458"/><path d="m211 265 49-28 49 28v55l-49 30-49-30Z" fill="${n===1?'url(#accent)':'#262d20'}" stroke="#aec087" stroke-opacity=".6"/><path d="m211 265 49 30 49-30m-49 30v55" fill="none" stroke="#aec087" stroke-opacity=".6"/><rect x="198" y="425" width="127" height="5" rx="2" fill="#6e775f"/><rect x="218" y="442" width="86" height="4" rx="2" fill="#434d35"/></g>`).join('')}<path d="M267 208v-49h441v49" fill="none" stroke="#6c844a" stroke-opacity=".3"/>`,
  'brand-characters': `<ellipse cx="480" cy="490" rx="198" ry="48" fill="url(#metal)" stroke="#65404c"/><g filter="url(#shadow)"><path d="M332 384V244c0-137 296-137 296 0v140c0 49-45 80-79 46l-24-26c-27 32-61 32-88 0l-24 26c-35 33-81 3-81-46Z" fill="url(#metal)" stroke="#8e6572"/><ellipse cx="429" cy="277" rx="29" ry="39" fill="#040507"/><ellipse cx="533" cy="277" rx="29" ry="39" fill="#040507"/><ellipse cx="437" cy="270" rx="8" ry="17" fill="#ff2d62"/><ellipse cx="541" cy="270" rx="8" ry="17" fill="#ff2d62"/><path d="M350 211c35-83 222-100 261 9" fill="none" stroke="#ff7196" stroke-width="2"/><path d="M350 211c35-83 222-100 261 9" fill="none" stroke="#ff2d62" stroke-width="20" opacity=".4" filter="url(#glow)"/></g>`,
  'performance-creatives': `<g transform="translate(15 -6) rotate(-8 480 320)">${[0,1,2,3,4,5].map((n)=>`<g transform="translate(${152+n%3*221} ${130+Math.floor(n/3)*211})"><rect width="201" height="191" rx="15" fill="url(#metal)" stroke="#72414f"/><ellipse cx="100" cy="89" rx="67" ry="60" fill="url(#floor)"/><${n%2?'rect':'ellipse'} ${n%2?'x="60" y="40" width="81" height="89" rx="26"':'cx="100" cy="84" rx="45" ry="46"'} fill="none" stroke="url(#accent)" stroke-width="${n%2?20:25}"/><path d="M31 158h${87+n*10}" stroke="#a6848e" stroke-width="5" stroke-linecap="round"/></g>`).join('')}</g><circle cx="849" cy="132" r="4" fill="#b7ff3c"/>`,
};
const manifest = [];
for (const [name, body] of Object.entries(scenes)) {
  const acid = ['product-visuals','ai-ugc','video-localization','explainer-videos'].includes(name);
  await writeFile(new URL(`${name}.svg`, directory), wrap(body, acid ? '#b7ff3c' : '#ff2d62', 960, 640, name === 'hero' ? '#050506' : '#08090c'));
  await sharp(fileURLToPath(new URL(`${name}.svg`, directory))).resize(name === 'hero' ? 1440 : 960).webp({ quality: 85, effort: 6 }).toFile(fileURLToPath(new URL(`${name}.webp`, directory)));
  manifest.push({ path: `/media/${name}.svg`, purpose: name === 'hero' ? 'Architectural hero and founder section' : `${name} service illustration`, type: 'svg', source: 'Original procedural SVG, scripts/generate-media.mjs', license: 'Original project artwork; no third-party assets', status: 'illustrative', altText: services.find(service => service.slug === name)?.cardMedia.alt || '', replacementRequired: false });
  manifest.push({ path: `/media/${name}.webp`, purpose: 'Pre-rendered hero illustration to reduce browser paint work', type: 'webp', source: `Original /media/${name}.svg, rasterized with sharp`, license: 'Original project artwork', status: 'illustrative', altText: services.find(service => service.slug === name)?.cardMedia.alt || '', replacementRequired: false });
  if (name !== 'hero') {
    await sharp(fileURLToPath(new URL(`${name}.svg`, directory))).resize(600).webp({ quality: 85, effort: 6 }).toFile(fileURLToPath(new URL(`${name}-mobile.webp`, directory)));
    manifest.push({ path: `/media/${name}-mobile.webp`, purpose: 'Mobile service illustration', type: 'webp', source: `Original /media/${name}.svg, rasterized with sharp`, license: 'Original project artwork', status: 'illustrative', altText: services.find(service => service.slug === name)?.cardMedia.alt || '', replacementRequired: false });
  }
}
// Mobile composition has a separate resource so it can evolve independently.
await writeFile(new URL('hero-mobile.svg', directory), wrap(hero, '#ff2d62', 640, 480, '#050506').replace('viewBox="0 0 960 640"', 'viewBox="105 0 800 600"'));
await sharp(fileURLToPath(new URL('hero-mobile.svg', directory))).resize(800).webp({ quality: 85, effort: 6 }).toFile(fileURLToPath(new URL('hero-mobile.webp', directory)));
manifest.push({ path:'/media/hero-mobile.svg', purpose:'Mobile hero composition',type:'svg', source:'Original procedural SVG', license:'Original project artwork',status:'illustrative',altText:'',replacementRequired:false });
manifest.push({ path:'/media/hero-mobile.webp', purpose:'Optimized mobile hero composition',type:'webp', source:'Original hero-mobile.svg rasterized with sharp', license:'Original project artwork',status:'illustrative',altText:'',replacementRequired:false });
manifest.push({ path:'/favicon.svg', purpose:'Original AD monogram favicon',type:'svg', source:'scripts/generate-media.mjs',license:'Original project artwork',status:'illustrative',altText:'',replacementRequired:false });
for (const [locale, copy] of [['uk', ukCopy], ['en', enCopy]]) manifest.push({ path:'/'+locale+'/opengraph-image', purpose:'Localized social sharing preview',type:'generated PNG', source:'src/app/[locale]/opengraph-image.tsx',license:'Original project artwork',status:'approved',altText:copy.intro.title,replacementRequired:false });
const fontDirectory = new URL('../public/fonts/', import.meta.url);
await mkdir(fontDirectory, { recursive: true });
for (const subset of ['latin', 'cyrillic']) {
  await copyFile(new URL(`../node_modules/@fontsource-variable/manrope/files/manrope-${subset}-wght-normal.woff2`, import.meta.url), new URL(`manrope-${subset}.woff2`, fontDirectory));
  manifest.push({ path:`/fonts/manrope-${subset}.woff2`, purpose:'Self-hosted variable font',type:'woff2', source:'@fontsource-variable/manrope',license:'SIL Open Font License 1.1; see /fonts/OFL.txt',status:'approved',altText:'',replacementRequired:false });
}
await copyFile(new URL('../node_modules/@fontsource-variable/manrope/LICENSE', import.meta.url), new URL('OFL.txt', fontDirectory));
for (const subset of ['latin', 'cyrillic']) manifest.push({path:'/fonts/manrope-'+subset+'-og.ttf',purpose:'Portable localized Open Graph font',type:'ttf',source:'scripts/convert-og-fonts.py; @fontsource-variable/manrope',license:'SIL Open Font License 1.1; see /fonts/OFL.txt',status:'approved',altText:'',replacementRequired:false});
for (const entry of manifest) {
  const service=services.find(item=>entry.path.startsWith('/media/'+item.slug));
  if (service) {entry.replacementRequired=true;entry.status='temporary';entry.altText={en:service.cardMedia.alt,uk:ukServices.find(item=>item.slug===service.slug).cardMedia.alt};entry.purpose='Temporary service artwork; replace with approved image or video/poster when available';}
}
await writeFile(new URL('../media-manifest.json', directory), JSON.stringify(manifest, null, 2));
await writeFile(new URL('../favicon.svg', directory), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#050506"/><path d="M9 47 22 17h9l12 30H33l-2-6H20l-2 6Zm14-14h6l-3-9Zm20-16h8c12 0 12 30 0 30h-8v-8h6c4 0 4-14 0-14h-6Z" fill="#f7f7f5"/><circle cx="54" cy="51" r="4" fill="#ff2d62"/></svg>`);
process.stdout.write(`Generated ${manifest.length} media manifest entries and optimized assets.\n`);
