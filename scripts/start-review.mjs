import {spawn} from 'node:child_process';
import {reviewMediaMode} from './review-media.mjs';
const port=process.argv[2]??'3100';if(!/^\d{4,5}$/.test(port)||Number(port)>65535)throw Error('Invalid local review port');
const mode=reviewMediaMode();console.log(`Review media mode: ${mode}`);
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',port],{stdio:'inherit',windowsHide:true,env:{...process.env,NODE_ENV:'development',NODE_OPTIONS:'--max-old-space-size=768',IADDS_MEDIA_MODE:mode,IADDS_REVIEW_BUILD:'true',SITE_URL:`http://127.0.0.1:${port}`,NEXT_TELEMETRY_DISABLED:'1'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exitCode=code??1);
