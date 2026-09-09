/** Server/build adapter. Only minimal ExampleMedia values cross the client boundary. */
import {mediaCatalog} from '@/content/internal/media-catalog';
import approvals from '@/content/internal/media-approvals.json';
import {serviceMediaMap,localizationPairs} from '@/content/site/service-media-map';
import {exampleAlt} from '@/content/site/media-copy';
import {canShowExample,mediaEnvironment} from './policy';
import type {Locale} from '@/types/content';
import type {ExampleMedia,MediaApproval,MediaEnvironment} from '@/types/service-media';
export function exampleUrl(file:string,environment:MediaEnvironment){return environment==='local'?`/api/format-media/${file}`:`/media/examples/${file}`;}
export function selectExample(id:number,locale:Locale,environment=mediaEnvironment()):ExampleMedia|null {
 const a=mediaCatalog.find(a=>a.id===id),approval=approvals[String(id) as keyof typeof approvals] as MediaApproval;
 if(!a||!approval||!canShowExample(approval,environment)||!a.derivatives.length)return null;
 const file=(role:string,format:string)=>{const d=a.derivatives.find(d=>d.role===role&&d.format===format);if(!d)throw Error(`Missing ${role}/${format} for source ${id}`);return exampleUrl(d.file,environment);};
 return {id,kind:a.kind,width:a.width,height:a.height,poster:file('desktop','webp'),posterAvif:file('desktop','avif'),mobilePoster:file('mobile','webp'),mobileAvif:file('mobile','avif'),...(a.kind==='video'?{preview:file('preview','mp4'),detail:file('detail','mp4'),duration:a.duration??undefined}:{}),alt:exampleAlt(id,locale),focalPoint:a.focalPoint,smallOnly:a.smallOnly,formatExample:true};
}
export function getServiceMedia(slug:string,locale:Locale,environment=mediaEnvironment()) {
 const map=serviceMediaMap[slug];if(!map)throw Error(`Missing media mapping: ${slug}`);
 const pick=(ids:number[])=>ids.flatMap(id=>{const item=selectExample(id,locale,environment);return item?[item]:[];});
 const featured=map.featured?selectExample(map.featured,locale,environment):null;
 const variations=(map.variationSets??[]).flatMap(set=>{const items=pick(set.ids);return items.length===2?[{id:set.id,label:set.label[locale],items}]:[];});
 return {card:pick(map.card),featured,gallery:pick(map.gallery.filter(id=>id!==featured?.id)).slice(0,5),variations,coverageStatus:map.coverageStatus,note:map.note?.[locale],pairs:localizationPairs.filter(p=>p.reviewStatus==='approved').flatMap(p=>{const original=selectExample(p.original.assetId,locale,environment),localized=selectExample(p.localized.assetId,locale,environment);return original&&localized?[{...p,originalMedia:original,localizedMedia:localized}]:[];})};
}
