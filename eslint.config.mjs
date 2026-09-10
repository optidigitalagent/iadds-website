import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([...nextVitals, ...nextTs,
  // ImageResponse embeds PNGs directly. A config override works on Windows and Linux.
  {files:['src/app/**/opengraph-image.tsx'],rules:{'@next/next/no-img-element':'off'}},
  globalIgnores(['.next/**', '.next-review/**', '.open-next/**', '.wrangler/**', '.data/**', 'dist/**', 'next-env.d.ts', 'test-results/**', 'playwright-report/**'])]);
