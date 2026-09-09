'use client';
/* eslint-disable @next/next/no-img-element -- Responsive images are pre-sized and compressed at generation time. */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Media } from '@/types/content';
import styles from './ui.module.css';
import { allowPreview, playback } from '@/lib/media/playback-coordinator';
function VideoPreview({ media, hero, fallbackLabel }: { media: Extract<Media, {type:'video'}>; hero: boolean; fallbackLabel: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const player=video.current, wrapper=shell.current; if(!player || !wrapper) return;
    const target=wrapper.closest('a[data-service-card]') || wrapper;
    const reduce=matchMedia('(prefers-reduced-motion: reduce)'), pointer=matchMedia('(hover: hover) and (pointer: fine)');
    const connection=(navigator as Navigator & {connection?: EventTarget & {saveData?:boolean}}).connection;
    let visible=false, intent=false, failed=false;
    const stop=()=>{ playback.stop(player); if(Number.isFinite(player.duration))player.currentTime=0; wrapper.dataset.playing='false'; };
    const update=()=>{
      if(failed || !intent || document.hidden || !allowPreview({reducedMotion:reduce.matches,saveData:Boolean(connection?.saveData),finePointer:pointer.matches,inViewport:visible})) { stop(); return; }
      if(!player.getAttribute('src')) { player.poster=media.poster; player.src=media.src; player.load(); }
      void playback.play(player);
    };
    const enter=()=>{ intent=true; update(); };
    const leave=(event: Event)=>{ if(event instanceof FocusEvent && event.relatedTarget instanceof Node && target.contains(event.relatedTarget)) return; intent=false; stop(); };
    const error=()=>{ failed=true; stop(); };
    const playing=()=>{ wrapper.dataset.playing='true'; };
    const paused=()=>{ wrapper.dataset.playing='false'; };
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();},{threshold:.15}); observer.observe(wrapper);
    target.addEventListener('mouseenter',enter); target.addEventListener('mouseleave',leave); target.addEventListener('focusin',enter); target.addEventListener('focusout',leave);
    player.addEventListener('error',error); player.addEventListener('playing',playing); player.addEventListener('pause',paused);
    reduce.addEventListener('change',update); pointer.addEventListener('change',update); connection?.addEventListener('change',update); document.addEventListener('visibilitychange',update);
    return ()=>{stop();observer.disconnect();target.removeEventListener('mouseenter',enter);target.removeEventListener('mouseleave',leave);target.removeEventListener('focusin',enter);target.removeEventListener('focusout',leave);player.removeEventListener('error',error);player.removeEventListener('playing',playing);player.removeEventListener('pause',paused);reduce.removeEventListener('change',update);pointer.removeEventListener('change',update);connection?.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);};
  },[media.src,media.poster]);
  const poster: Media={...media,type:'image',src:media.poster,poster:undefined};
  return <div ref={shell} className={styles.videoPreview} data-playing="false"><MediaImage media={poster} hero={hero} fallbackLabel={fallbackLabel} /><video ref={video} muted playsInline loop preload="none" data-poster={media.poster} width={media.width} height={media.height} aria-hidden="true" tabIndex={-1} /></div>;
}
export function MediaImage({ media, hero, fallbackLabel }: { media: Media; hero: boolean; fallbackLabel: string }) {
  const [failed, setFailed] = useState(false);
  // A native image can fail before hydration attaches its error handler.
  const checkInitialImage = useCallback((node: HTMLImageElement | null) => {
    if (node?.complete && node.naturalWidth === 0) setFailed(true);
  }, []);
  if (media.type === 'video') return <VideoPreview media={media} hero={hero} fallbackLabel={fallbackLabel} />;
  if (failed) return <div className={styles.mediaFallback} role={media.decorative ? undefined : 'img'} aria-label={media.decorative ? undefined : fallbackLabel} aria-hidden={media.decorative || undefined} style={{ aspectRatio: `${media.width} / ${media.height}` }}><span aria-hidden="true" /></div>;
  const image = <img ref={checkInitialImage} src={media.src} alt={media.decorative ? '' : media.alt} aria-hidden={media.decorative || undefined} width={media.width} height={media.height} fetchPriority={hero ? 'high' : undefined} decoding="async" loading={hero ? 'eager' : media.loadingStrategy} sizes={media.sizes} style={{ objectPosition: media.focalPoint,objectFit:media.fit }} onError={() => setFailed(true)} />;
  return media.mobileSrc||media.avifSrc ? <picture>{media.mobileAvifSrc&&<source type="image/avif" media="(max-width: 767px)" srcSet={media.mobileAvifSrc} sizes={media.sizes} />}{media.mobileSrc&&<source type="image/webp" media="(max-width: 767px)" srcSet={media.mobileSrc} sizes={media.sizes} />}{media.avifSrc&&<source type="image/avif" srcSet={media.avifSrc} sizes={media.sizes} />}{image}</picture> : image;
}
