# iADDS public release

The public source repository is https://github.com/optidigitalagent/iadds-website. The existing Sites project publishes https://iadds-by-antonov-digital.funckj.chatgpt.site, with `/uk` and `/en` available anonymously. Preserve `package.json`'s `private: true`: it prevents npm package publication and does not control GitHub visibility.

## Supplied permission and scope

The exact supplied approval file is `src/content/internal/media-approvals.json`; its evidence is `docs/approvals/iadds-service-media-owner-approval-2026-09-10.md`. These replace the historical unverified state. All 41 sources have owner publication approval dated 2026-09-10. The existing service assignment remains unchanged.

- Production (30): 1, 4, 6, 8, 11, 12, 13, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 36, 37, 40, 41.
- Approved staging/reserve (11): 2, 3, 5, 7, 9, 10, 14, 16, 31, 38, 39.

Publication permission does not establish authorship, client work, testimonials, partnerships or results. All examples use the localized label **Приклад формату / Format example**. Cases remain guarded; Video Localization retains its approved fallback until real original/localized pairs are supplied.

## Production derivatives

The 162 previously generated, sanitized files were preserved without recompression and promoted with `npm run media:publish-approved`. There are 120 responsive AVIF/WebP posters/images and 42 MP4 preview/detail files. They are tracked under `public/media/examples`, with per-file source IDs, sizes, dimensions and SHA-256 in `docs/implementation/iadds-public-media.json`.

To regenerate missing private derivatives, use the retained original media package outside the public tree and run `node scripts/generate-iadds-media.mjs EXTRACTED_MEDIA_PACKAGE_ROOT` with FFmpeg/FFprobe installed. The generator writes ignored `.data/iadds-media`; it is not an install/build dependency. Do not rerun it just to reproduce a clean clone. `npm run media:publish-approved` validates inputs/evidence before copying production-approved files, removes only stale managed example filenames, and updates the public checksum manifest. Never copy raw originals, ZIPs, source indexes or reserve assets into `public`.

## Verification and publication

Use Node 24 and the committed lockfile. In a tracked-only clean clone run `npm ci`, `npm run audit:repository`, `npm run validate:content`, `npm run validate:media`, `npm run build`, install Chromium with `npx playwright install chromium`, and run `npm run test:e2e`. The build already runs lint, route types, TypeScript, unit/integration tests and Worker publication guards. Do not copy `.data`, `.env`, `node_modules` or build outputs from another checkout.

Require a successful GitHub Actions run for the exact release SHA. Push that same SHA to the preserved Sites source remote. Package its validated `dist` with the installed Sites helper, save the exact SHA/archive and publish its returned version to the explicitly authorized public audience. Set non-secret `SITE_URL` to the actual origin above; verify source SHA, deployment success and anonymous access. Sites native push-to-deploy is unavailable for this account; a green GitHub run alone is not a deployment.

With the public site live, `node scripts/smoke-deployment.mjs https://iadds-by-antonov-digital.funckj.chatgpt.site .data/handoff/public-smoke.json` verifies routes, all asset hashes, restricted paths and desktop/mobile views without credentials. `npx playwright test --config playwright.public.config.ts` runs media behavior checks in fresh anonymous browser contexts and sends no consultation data. Local E2E covers synthetic persistence, validation, anti-spam/idempotency, error handling and accessibility.

## Consultation and cleanup

Production consultation delivery still requires a real persistent HTTPS `CONSULTATION_WEBHOOK_URL` and optional server-only `CONSULTATION_WEBHOOK_SECRET` in hosting secrets. Until configured, the handler intentionally returns 503; public availability does not imply a working submission funnel. Never fabricate success or use real customer data in tests.

Keep originals privately for future regeneration. Only after public repository access, exact SHA/CI/deployment verification and anonymous QA may an explicit allowlist remove local generated caches, temporary extraction copies or validation clones. Preserve the working repository, tracked derivatives, approval evidence, sole originals and unrelated projects. Exact per-run evidence and deleted-file inventories remain in ignored `qa/handoff/runs/`.
