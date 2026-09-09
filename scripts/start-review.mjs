import {spawn} from 'node:child_process';
import fs from 'node:fs';
if(!fs.existsSync('.data/iadds-media/example-06-preview.mp4'))throw Error('Local review media are missing. Run the source audit and media generation documented in README.md.');
const port=process.argv[2]??'3100';if(!/^\d{4,5}$/.test(port))throw Error('Invalid local review port');
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',port],{stdio:'inherit',env:{...process.env,NODE_ENV:'development',NODE_OPTIONS:'--max-old-space-size=768',IADDS_MEDIA_MODE:'local',IADDS_REVIEW_BUILD:'true',SITE_URL:`http://127.0.0.1:${port}`,NEXT_TELEMETRY_DISABLED:'1'}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));child.on('exit',code=>process.exitCode=code??1);
