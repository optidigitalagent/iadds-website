import {spawnSync} from 'node:child_process';
// Optimized local review artifact; never the Sites build input (.next / dist).
const env={...process.env,NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=768',IADDS_MEDIA_MODE:'local',IADDS_REVIEW_BUILD:'true',SITE_URL:'http://127.0.0.1:3100',NEXT_TELEMETRY_DISABLED:'1'};
const result=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build','--webpack'],{stdio:'inherit',env,windowsHide:true});process.exitCode=result.status??1;
