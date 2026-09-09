import http from 'node:http';
import { POST } from '../../src/app/api/consultation/route';

// E2E only: reuse production HTML/assets and execute the real route with its local
// provider. This avoids running a second compiler on memory-constrained machines.
if (process.env.NODE_ENV !== 'test') throw new Error('This server is exclusively for local tests.');
http.createServer(async (incoming, outgoing) => {
  try {
    const pathname = incoming.url ?? '/';
    let response: Response;
    if (pathname === '/api/consultation' && incoming.method === 'POST') {
      const chunks: Buffer[] = []; let length = 0;
      for await (const chunk of incoming) { const bytes=Buffer.from(chunk); length+=bytes.length; if(length>16_384){outgoing.writeHead(413);outgoing.end();return;} chunks.push(bytes); }
      const headers = new Headers();
      for(const [key,value] of Object.entries(incoming.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value);
      response=await POST(new Request('http://127.0.0.1:3101/api/consultation',{method:'POST',headers,body:new Uint8Array(Buffer.concat(chunks))}));
    } else if(incoming.method==='GET'||incoming.method==='HEAD') {
      response=await fetch('http://127.0.0.1:3100'+pathname,{redirect:'manual'});
    } else {outgoing.writeHead(405);outgoing.end();return;}
    const headers:Record<string,string>={};
    response.headers.forEach((value,key)=>{if(!['content-encoding','content-length','transfer-encoding','connection'].includes(key))headers[key]=value;});
    const body=Buffer.from(await response.arrayBuffer());
    outgoing.writeHead(response.status,{...headers,'Content-Length':body.length});outgoing.end(incoming.method==='HEAD'?undefined:body);
  } catch {outgoing.writeHead(503,{'Content-Type':'text/plain'});outgoing.end('Test preview unavailable');}
}).listen(3101,'127.0.0.1',()=>process.stdout.write('Local E2E submission server ready on 3101.\n'));
