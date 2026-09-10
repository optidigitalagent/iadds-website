'use client';
import {useEffect,useRef,useState,type CSSProperties} from 'react';
import type {ExampleMedia} from '@/types/service-media';
import {MediaImage} from '@/components/ui/media-image';
import {playback} from '@/lib/media/playback-coordinator';
import styles from './format-media.module.css';
export function PreviewQualityNote({text,card=false}:{text:string;card?:boolean}) {
 return <p className={styles.qualityNote} data-preview-quality={card?'card':'example'}>{text}</p>;
}
export function FormatMedia({media,card=false,priority=false,labels}:{media:ExampleMedia;card?:boolean;priority?:boolean;labels:{play:string;pause?:string;unavailable:string;previewQuality:string}}) {
 const player=useRef<HTMLVideoElement>(null),shell=useRef<HTMLDivElement>(null);
 const [started,setStarted]=useState(false),[failed,setFailed]=useState(false);
 useEffect(()=>{const video=player.current,wrapper=shell.current;if(!video||!wrapper)return;
  const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting){playback.stop(video);if(Number.isFinite(video.duration))video.currentTime=0;}},{threshold:.05});observer.observe(wrapper);
  const stop=()=>{if(document.hidden)playback.stop(video);};document.addEventListener('visibilitychange',stop);
  return()=>{playback.stop(video);observer.disconnect();document.removeEventListener('visibilitychange',stop);};
 },[started]);
 const position={'--example-desktop':media.focalPoint.desktop,'--example-mobile':media.focalPoint.mobile} as CSSProperties;
 const poster={type:'image' as const,src:media.poster,avifSrc:media.posterAvif,mobileSrc:media.mobilePoster,mobileAvifSrc:media.mobileAvif,width:media.width,height:media.height,alt:media.alt,decorative:false,illustrative:false,focalPoint:'var(--example-position)',loadingStrategy:'lazy' as const,sourceStatus:'original' as const,fit:'cover' as const,sizes:card?'(max-width:767px) 90vw, 30vw':'(max-width:767px) 90vw, 45vw'};
 if(card)return <div className={styles.cardVisual} data-example-id={media.id} style={position}><MediaImage media={media.kind==='video'?{...poster,type:'video',src:media.preview!,poster:media.poster,duration:media.duration}:poster} hero={priority} fallbackLabel={labels.unavailable} previewLabels={labels.pause?{play:labels.play,pause:labels.pause}:undefined} /></div>;
 return <><div ref={shell} className={styles.visual} data-example-id={media.id} data-small-media={media.smallOnly||undefined} style={{...position,'--media-ratio':`${media.width}/${media.height}`,'--media-aspect':media.width/media.height,'--media-max':`${Math.min(media.width,media.smallOnly?500:680)}px`} as CSSProperties}>
  {(!started||failed||media.kind==='image')&&<MediaImage media={poster} hero={priority} fallbackLabel={labels.unavailable} />}
  {media.kind==='video'&&started&&!failed&&<video ref={player} src={media.detail} poster={media.poster} width={media.width} height={media.height} muted playsInline controls preload="none" aria-label={media.alt} onPlay={event=>{void playback.play(event.currentTarget);}} onError={()=>setFailed(true)} />}
  {media.kind==='video'&&!started&&!failed&&<button type="button" className={styles.play} onClick={()=>{setStarted(true);requestAnimationFrame(()=>{if(player.current)void playback.play(player.current);});}} aria-label={`${labels.play}: ${media.alt}`}><span aria-hidden="true">▶</span>{labels.play}</button>}
  {failed&&<p className={styles.error} role="status">{labels.unavailable}</p>}
 </div><PreviewQualityNote text={labels.previewQuality} /></>;
}
