import {spawn} from 'node:child_process';
const port=process.env.IADDS_REVIEW_PORT||'3100';if(!/^\d{4,5}$/.test(port)||Number(port)>65535)throw Error('Invalid loopback review port');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port',port],{stdio:'inherit',env:{...process.env,NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=512',IADDS_MEDIA_MODE:'local',IADDS_REVIEW_BUILD:'true',SITE_URL:`http://127.0.0.1:${port}`}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exitCode=code??1);
