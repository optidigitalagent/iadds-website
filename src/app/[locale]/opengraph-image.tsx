/* eslint-disable @next/next/no-img-element -- Next ImageResponse embeds a pre-sized PNG; next/image cannot render inside an OG composition. */
import { ImageResponse } from 'next/og';
import ogAssets from '@/content/internal/og-assets.json';
import { siteConfig } from '@/content/site/settings';
import { getDictionary } from '@/lib/content';
import { routeLocale,type LocaleParams } from '@/lib/route-locale';
export const size={width:1200,height:630};
export const contentType='image/png';
export default async function OpenGraphImage({params}:{params:LocaleParams}) {
 const locale=await routeLocale(params),c=getDictionary(locale);
 const symbol=Buffer.from(ogAssets.symbol,'base64');
 const [latin,cyrillic]=[ogAssets.latin,ogAssets.cyrillic].map(value=>Buffer.from(value,'base64'));
 return new ImageResponse(<div style={{width:'100%',height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',padding:'74px',background:'#050506',color:'#f7f7f5',fontFamily:'Manrope Cyrillic, Manrope Latin'}}><div style={{position:'absolute',width:550,height:550,border:'2px solid #ff2d62',borderRadius:'50%',right:-180,top:30,display:'flex',opacity:.5}} /><div style={{display:'flex',alignItems:'center',gap:24,marginBottom:40}}><img src={'data:image/png;base64,'+symbol.toString('base64')} width={110} height={110} alt="" /><div style={{display:'flex',flexDirection:'column'}}><div style={{display:'flex',fontSize:64,fontWeight:800,letterSpacing:-2}}>{siteConfig.brand.productName}</div><div style={{display:'flex',fontSize:22,color:'#f7f7f5'}}>{siteConfig.brand.endorsement}</div></div></div><div style={{fontSize:65,lineHeight:1.12,letterSpacing:-2,maxWidth:1030,display:'flex'}}>{c.intro.title}</div><div style={{display:'flex',fontSize:21,color:'#b3b3bc',marginTop:38}}>{c.brand.descriptor}</div></div>,{...size,fonts:[{name:'Manrope Latin',data:latin,style:'normal',weight:600},{name:'Manrope Cyrillic',data:cyrillic,style:'normal',weight:600}]});
}
