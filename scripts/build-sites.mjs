import {spawnSync} from 'node:child_process';
const env={...process.env,NODE_ENV:'production',NODE_OPTIONS:'--max-old-space-size=768',IADDS_MEDIA_MODE:'production',IADDS_REVIEW_BUILD:'false',SITE_URL:'https://iadds-by-antonov-digital.funckj.chatgpt.site',WRANGLER_SEND_METRICS:'false'};
const tasks=[...(process.argv.includes('--skip-next')?[]:[['scripts/build-production.mjs']]),['node_modules/@opennextjs/cloudflare/dist/cli/index.js','build','--skipNextBuild'],['--import','tsx','scripts/stage-sites.mjs']];
for(const args of tasks){const r=spawnSync(process.execPath,args,{stdio:'inherit',env,windowsHide:true});if(r.status!==0)process.exit(r.status??1);}
