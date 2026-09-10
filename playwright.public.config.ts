import {defineConfig} from '@playwright/test';
import base from './playwright.config';

// Anonymous media checks only: never submit production consultation data.
export default defineConfig({...base,webServer:undefined,testMatch:'media-release.spec.ts',
 use:{...base.use,baseURL:process.env.PUBLIC_QA_URL||'https://iadds-by-antonov-digital.funckj.chatgpt.site'},
 reporter:[['list']],outputDir:'.data/public-qa',
});
