import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {reviewMediaMode} from '../scripts/review-media.mjs';
import {getSiteUrl} from '../src/lib/urls';

test('clone media fallback, complete private set and partial-set failure are explicit',()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'iadds-mode-test-'));
  try{
    fs.mkdirSync(path.join(root,'docs/implementation'),{recursive:true});
    fs.writeFileSync(path.join(root,'docs/implementation/iadds-media-derivatives.json'),JSON.stringify([{derivatives:[{file:'a.avif'},{file:'b.mp4'}]}]));
    assert.equal(reviewMediaMode(root),'production');
    fs.mkdirSync(path.join(root,'.data/iadds-media'),{recursive:true});
    fs.writeFileSync(path.join(root,'.data/iadds-media/a.avif'),'synthetic');
    assert.throws(()=>reviewMediaMode(root),/Incomplete optional private media/);
    fs.writeFileSync(path.join(root,'.data/iadds-media/b.mp4'),'synthetic');
    assert.equal(reviewMediaMode(root),'local');
  }finally{fs.rmSync(root,{recursive:true,force:true});}
});

test('production origin works without a machine-local environment file',()=>{
  const prior={NODE_ENV:process.env.NODE_ENV,SITE_URL:process.env.SITE_URL};
  try{
    Object.assign(process.env,{NODE_ENV:'production'});delete process.env.SITE_URL;
    assert.equal(getSiteUrl(),'https://iadds-by-antonov-digital.funckj.chatgpt.site');
    process.env.SITE_URL='https://example.org/uk';assert.equal(getSiteUrl(),'https://example.org');
    Object.assign(process.env,{NODE_ENV:'test'});delete process.env.SITE_URL;
    assert.equal(getSiteUrl(),'http://127.0.0.1:3100');
  }finally{for(const [key,value] of Object.entries(prior)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
