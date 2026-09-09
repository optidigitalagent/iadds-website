import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import path from 'node:path';

if (!process.env.npm_execpath) throw new Error('Run with npm run audit:performance.');
const reservation = createServer();
await new Promise(resolve => reservation.listen(0, '127.0.0.1', resolve));
const port = reservation.address().port;
await new Promise(resolve => reservation.close(resolve));
// Own the headless browser lifecycle to avoid chrome-launcher cleanup races on Windows.
const browser = await chromium.launch({ channel: 'chromium', args: [`--remote-debugging-port=${port}`] });
await mkdir('qa', { recursive: true });
try {
  for (const [name, route] of [['uk-home', '/uk'], ['uk-service', '/uk/services/ai-video-ads'], ['uk-consultation', '/uk/consultation'], ['en-home', '/en']]) {
    const output = path.resolve(`${process.env.IADDS_LIGHTHOUSE_DIR || 'qa'}/lighthouse-${name}`);
    const args = [path.join(path.dirname(process.env.npm_execpath), 'npx-cli.js'), '--yes', 'lighthouse', `http://127.0.0.1:3100${route}`, `--port=${port}`, '--quiet', '--output=json', '--output=html', `--output-path=${output}`, '--only-categories=performance,accessibility,best-practices,seo'];
    await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, args, { stdio: 'inherit', windowsHide: true });
      child.once('error', reject);
      child.once('exit', code => code === 0 ? resolve() : reject(new Error(`Lighthouse exited with ${code}`)));
    });
    const report = JSON.parse(await readFile(`${output}.report.json`, 'utf8'));
    process.stdout.write(`${JSON.stringify({ page: name, performance: report.categories.performance.score, accessibility: report.categories.accessibility.score, seo: report.categories.seo.score, bestPractices: report.categories['best-practices'].score, lcp: report.audits['largest-contentful-paint'].displayValue, cls: report.audits['cumulative-layout-shift'].displayValue, tbt: report.audits['total-blocking-time'].displayValue })}\n`);
  }
} finally { await browser.close(); }
