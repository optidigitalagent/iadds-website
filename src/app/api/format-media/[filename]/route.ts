import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {mediaCatalog} from '@/content/internal/media-catalog';
import {mediaEnvironment} from '@/lib/media/policy';
export const runtime='nodejs';
export const dynamic='force-dynamic';
/** Local review only. No source or unverified derivative is placed in public/ or a deployment archive. */
export async function GET(request:Request,{params}:{params:Promise<{filename:string}>}) {
 const headers={'Cache-Control':'private, max-age=3600','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow'};
 if(mediaEnvironment()!=='local'||!['127.0.0.1','localhost','[::1]'].includes(new URL(request.url).hostname))return new Response(null,{status:404});
 const {filename}=await params;
 if(!/^example-\d{2}-(?:desktop|mobile|preview|detail)\.(?:avif|webp|mp4)$/.test(filename)||!mediaCatalog.some(a=>a.derivatives.some(d=>d.file===filename)))return new Response(null,{status:404});
 try{
  const bytes=await readFile(path.join(process.cwd(),'.data','iadds-media',filename));
  const type=filename.endsWith('.mp4')?'video/mp4':filename.endsWith('.avif')?'image/avif':'image/webp';
  const range=request.headers.get('range');
  if(range){const m=/^bytes=(\d+)-(\d*)$/.exec(range);if(!m)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});const start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),bytes.length-1):bytes.length-1;if(start>end||start>=bytes.length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${bytes.length}`}});return new Response(bytes.subarray(start,end+1),{status:206,headers:{...headers,'Content-Type':type,'Accept-Ranges':'bytes','Content-Length':String(end-start+1),'Content-Range':`bytes ${start}-${end}/${bytes.length}`}});}
  return new Response(bytes,{headers:{...headers,'Content-Type':type,'Content-Length':String(bytes.length),'Accept-Ranges':'bytes'}});
 }catch{return new Response(null,{status:404});}
}
