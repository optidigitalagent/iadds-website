import fs from 'node:fs';
import {spawnSync} from 'node:child_process';

// Sites runs the standard package build. Any failed check stops publication.
const steps = [
  ['repository audit', ['scripts/audit-repository.mjs']],
  ['lint', ['node_modules/eslint/bin/eslint.js', '.', '--max-warnings=0']],
  ['route types', ['node_modules/next/dist/bin/next', 'typegen']],
  ['typecheck', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['gateway build', ['node_modules/typescript/bin/tsc', '-p', 'services/lead-gateway/tsconfig.json']],
  ['unit and integration tests', ['--import', 'tsx', '--import', './tests/register-css.mjs', '--test', ...fs.readdirSync('tests').filter(f=>f.endsWith('.test.ts')).map(f=>'tests/'+f)]],
  ['content, media and production Next build', ['scripts/build-production.mjs']],
  ['Sites Worker build and publication guard', ['scripts/build-sites.mjs', '--skip-next']],
];
fs.mkdirSync('.data/handoff', {recursive:true});
const results=[];
for (const [name,args] of steps) {
  console.log(`\n[repository CI] ${name}`);
  const started=Date.now();
  const result=spawnSync(process.execPath,args,{stdio:'inherit',windowsHide:true,env:{...process.env,NODE_OPTIONS:'--max-old-space-size=768',NEXT_TELEMETRY_DISABLED:'1'}});
  results.push({name,exitCode:result.status??1,durationMs:Date.now()-started});
  fs.writeFileSync('.data/handoff/ci.json',JSON.stringify({node:process.version,platform:process.platform,results},null,2)+'\n');
  if(result.status!==0)process.exit(result.status??1);
}
console.log('Repository CI passed. Sites Worker is ready in dist/.');
