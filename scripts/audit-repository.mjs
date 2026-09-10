import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import ts from 'typescript';

const root=process.cwd();
const failures=[];
// Some provider builders unpack a source archive without Git metadata.
const skip=new Set(['.git','node_modules','.next','.next-review','.open-next','.wrangler','.data','dist','test-results','playwright-report','coverage','.nyc_output']);
function sourceFiles(dir=''){
  return fs.readdirSync(dir||'.',{withFileTypes:true}).flatMap(entry=>{
    const file=path.posix.join(dir,entry.name);
    if(skip.has(entry.name)||['qa/screenshots','qa/handoff/runs'].includes(file)||/\.(?:log|tsbuildinfo)$/.test(file))return [];
    return entry.isDirectory()?sourceFiles(file):[file];
  });
}
const sourceMode=fs.existsSync('.git')?'git-index':'provider-source-archive';
const files=sourceMode==='git-index'?execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'}).split('\0').filter(Boolean):sourceFiles();
const unique=[...new Set(files)];
const lower=new Map();
let imports=0, publicAssets=0, largest={file:'',bytes:0};
const generatedNextTypes=[];
const forbiddenPath=/(?:[A-Za-z]:[\\/]Users[\\/]|\/mnt\/data\b|\/Users\/[^/\s]+|\/home\/[^/\s]+|file:\/\/)/;
const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{50,}\b/,/\bAKIA[0-9A-Z]{16}\b/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/];
function exactCase(file) {
  const relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)){failures.push(`Import escapes repository: ${relative}`);return;}
  let current=root;
  for(const part of relative.split(path.sep)){
    if(!fs.readdirSync(current).includes(part)){failures.push(`Import casing mismatch: ${relative}`);return;}
    current=path.join(current,part);
  }
}
for(const file of unique){
  const folded=file.toLowerCase();
  if(lower.has(folded)&&lower.get(folded)!==file)failures.push(`Case collision: ${file}`);
  lower.set(folded,file);
  const stat=fs.lstatSync(file);
  if(stat.isSymbolicLink()){failures.push(`Tracked symlink requires explicit review: ${file}`);continue;}
  if(!stat.isFile())continue;
  if(stat.size>largest.bytes)largest={file,bytes:stat.size};
  if(stat.size>20*1024*1024)failures.push(`Oversized Git binary: ${file}`);
  if(file.startsWith('public/'))publicAssets++;
  if(/(?:^|\/)(?:\.env(?:\..+)?|\.dev\.vars.*|.*\.(?:pem|key|p12|pfx)|consultations|node_modules|\.data)(?:\/|$)/i.test(file)&&file!=='.env.example')failures.push(`Private/generated path in source: ${file}`);
  if(!/\.(?:[cm]?[jt]sx?|jsonc?|md|txt|ya?ml|toml|css)$/.test(file)&&!['.env.example','.gitignore'].includes(file))continue;
  const source=fs.readFileSync(file,'utf8');
  if(secretPatterns.some(pattern=>pattern.test(source)))failures.push(`Possible credential in ${file} (value withheld)`);
  if((file.startsWith('src/')||file.startsWith('scripts/'))&&file!=='scripts/audit-repository.mjs'&&forbiddenPath.test(source))failures.push(`Machine-local source reference: ${file}`);
  if(!/\.[cm]?[jt]sx?$/.test(file))continue;
  const ast=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true);
  function visit(node){
    let spec;
    if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))spec=node.moduleSpecifier.text;
    if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))spec=node.arguments[0].text;
    if(spec&&(spec.startsWith('.')||spec.startsWith('@/'))){
      imports++;
      // Next owns these declarations; next typegen creates them before TypeScript.
      // They are not source dependencies and are absent in an untouched clone.
      if(file==='next-env.d.ts'&&/^\.\/\.next(?:-review)?\/(?:dev\/)?types\/(?:routes|root-params)\.d\.ts$/.test(spec)){
        generatedNextTypes.push(spec);
        return;
      }
      const base=spec.startsWith('@/')?path.resolve('src',spec.slice(2)):path.resolve(path.dirname(file),spec);
      const resolved=[base,...['.ts','.tsx','.js','.mjs','.json'].map(ext=>base+ext),...['index.ts','index.tsx','index.js'].map(f=>path.join(base,f))].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
      if(!resolved)failures.push(`Unresolved local import: ${file} -> ${spec}`);else exactCase(resolved);
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);
}
const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8'));
for(const [name,entry] of Object.entries(lock.packages??{}))if(entry.link||/^(?:file:|link:|[A-Za-z]:[\\/])/.test(entry.resolved??''))failures.push(`Local lockfile dependency: ${name}`);
const report={status:failures.length?'failed':'passed',sourceMode,files:unique.length,publicAssets,relativeImportsChecked:imports,generatedNextTypes,symlinks:0,largest,failures,limitations:'High-confidence credential patterns and path/import checks; not a guarantee against every possible secret. Optional archival source packages are not build dependencies. Listed Next declarations are generated by next typegen, then checked by tsc.'};
fs.mkdirSync('.data/handoff',{recursive:true});fs.writeFileSync('.data/handoff/repository-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
if(failures.length)process.exitCode=1;
