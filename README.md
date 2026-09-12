# iADDS — By Antonov Digital

[Open the live website](https://iadds-by-antonov-digital.funckj.chatgpt.site/uk) · [English version](https://iadds-by-antonov-digital.funckj.chatgpt.site/en)

Existing Next.js + TypeScript site updated from both supplied source packages under the final iADDS v3 override. Ukrainian is the default; English has matching content, routes and form behavior. The original black/graphite visual system is retained.

## Local use

Use Node 24 LTS (`.nvmrc`, `engines`) and npm 11.9.0 (`packageManager`) from this Git root. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:3100/uk. No `.env` file or original source package is required. Development enquiries are really saved to `.data/consultations/<referenceId>.json`; the success screen explicitly states that they are local and do not book a call. Use synthetic test data.

`npm run build` is the fail-fast Sites CI entry point: repository/path/credential-pattern audit, lint, route types, TypeScript, unit/integration tests, locale/content/media validation, production Next build, OpenNext Worker adaptation and publication guards. It emits `.next` and the existing Sites artifact layout in `dist`. `npm run build:next` builds only the validated Next artifact; `npm run build:sites` adapts it for Sites (or pass `-- --skip-next` after a current successful Next build). Production starts with `npm run start` on loopback port 3100. The wrappers use Webpack, one static-generation worker and bounded memory, with all checks enabled.

For browser verification, free ports 3100/3101, run `npx playwright install chromium` once, then `npm run test:e2e`. Linux CI may need `npx playwright install --with-deps chromium`. Individual checks remain available: `npm run audit:repository`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run validate:content`, `npm run validate:media`. Never copy another checkout's `node_modules`, `.next` or `.env` to prove a clean clone.

## Repository and hosting handoff

This folder is an independent Git repository. The public GitHub repository is https://github.com/optidigitalagent/iadds-website, with `main` as its default branch. This checkout uses `github` for GitHub and preserves `origin` for the existing Sites source repository; the unrelated parent Art Studio repository is not a deployment target. Push the same reviewed commit to `github main` and Sites `origin main`. Preserve `.openai/hosting.json` and its existing project ID. Production: https://iadds-by-antonov-digital.funckj.chatgpt.site (public audience).

GitHub Actions runs `.github/workflows/ci.yml` on pushes to `main` or `codex/**`, pull requests into `main`, and manual dispatch. Each run starts from a fresh Linux checkout, installs the lockfile, runs the complete build gate and Chromium E2E tests, and checks that tracked source stayed unchanged. Failed browser evidence is retained for seven days. CI needs no deployment credentials or private source packages. See https://github.com/optidigitalagent/iadds-website/actions/workflows/ci.yml for actual remote results.

The Sites account currently reports **“Push-to-deploy is not enabled for this account.”** GitHub CI does not automatically deploy to Sites. The supported publication flow remains: require successful checks, push `HEAD:main` to the existing Sites source remote with an ordinary Sites write credential, verify both remote SHAs, package that revision's validated `dist` with the Sites hosting helper, save the version with its exact commit SHA/archive, and publish the returned version ID to the authorized public audience. Inspect deployment status, source SHA and the live site before declaring success. The Sites plugin is only required for provider operations, not application install/build/run.

Obtain ephemeral credentials through Sites and pass authentication per Git command, never in a remote URL, file or Git config. If the provider later enables native private publish-on-push, `npm run build` already contains the fail-fast checks; ordinary write credentials still do not enable automatic publishing. A local CI pass alone does not prove GitHub CI ran or Sites deployed.

Generated CI results and artifact hashes are under `.data/handoff/`; final handoff evidence is under `qa/handoff/runs/` (both ignored). Build scripts do not rewrite historical tracked QA reports. See `docs/repository-handoff.md` for the dependency inventory and provider limitations. Node release policy: https://nodejs.org/en/blog/migrations/v22-to-v24.

## Routes and navigation

Both locales include home, services, nine service detail routes, ai-systems, pricing, process, about, consultation, contact and cases infrastructure. AI Systems is separate from the nine-card catalogue. Header: Services, AI Systems, Process, About, FAQ, Contact, UK/EN and consultation. Pricing is linked from previews, services and footer. FAQ points to the localized home anchor.

Home order: compact introduction, grouped catalogue, custom task, free test, approved case when available, models, seven process steps, why now, pricing, unified company/founder chapter, FAQ, consultation, contacts. About adds the complete photo story, timeline, competencies, principles, ecosystem, mission and explicitly future vision.

The root redirects with 307 to the valid explicit locale cookie, otherwise Ukrainian. Language switching preserves equivalent path, query and hash. Unknown services/locales/draft cases return real 404s. Canonicals and uk/en/x-default alternates are localized. Empty Cases is noindex and omitted from the sitemap; Cases navigation appears only after verified publication.

## Content edit locations

| Edit | Single source |
| --- | --- |
| Brand/project name, derived label, founder role, team and portfolio facts | `src/content/site/settings.ts` |
| Email, phone, Telegram, Instagram | Same file, `siteConfig.contacts`; mailto/tel are derived |
| Localized fact tokens | `src/content/site/brand-text.ts` |
| Navigation, UI/form labels, models, consultation, metadata | `src/content/en/site.ts`, `src/content/uk/site.ts` |
| Free test, pricing, AI Systems, why now, founder story/timeline, competencies, principles, ecosystem | `src/content/[locale]/experience.ts`; `getExperience(locale)` |
| Nine services and their card copy | `src/content/[locale]/services.ts` |
| Service-specific tests, prices, results, formats and inputs | `src/content/site/service-commercial.ts` |
| Four service groups | `src/content/site/service-groups.ts` |
| Seven process steps, thirteen FAQs, commitments/revisions/privacy | `src/content/[locale]/process.ts` |
| Internal estimates and publication/test rules | `src/content/internal/policy.ts`; never imported by public UI |
| Moda Castle draft | `src/content/cases/index.ts` |
| Publication and navigation guards | `src/lib/content/index.ts`: `isPublishedCase`, `isVerifiedTestimonial`, `getPublishedCases`, `shouldShowCasesInNavigation` |
| Founder derivative paths and bilingual alt text | `src/content/site/founder-media.ts` |
| Source hashes, roles, crops, dimensions and privacy processing | `docs/founder-media-manifest.json` |
| Shared founder/pricing/test UI | `src/components/sections/experience-sections.tsx`, `experience.module.css` |

The team is Artem Antonov and an undisclosed developer partner. The 30+ projects belong to Antonov Digital's digital/AI portfolio. Approximately 50 additional tests and experiments remain a separate fact. The three-year ambition is a vision, not an achieved result.

## Founder photographs and media

All seven owner photographs appear in defined About story scenes. Home uses one jet-ski photo. Run `node scripts/generate-founder-media.mjs ABSOLUTE_PATH_TO_MEDIA_PACKAGE/05_founder_assets` to regenerate 28 desktop/mobile AVIF/WebP derivatives, typed paths and the implementation manifest. See the generator for canonical filenames.

Source bytes stay unchanged. The ZIP, source documents and full originals are never copied to public. The final v3 override preserves the urban photo in full figure inside a small contained frame without focusing or commenting on the incidental object. Boat crops exclude registration; the jet-ski registration is blurred with feathered edges. EXIF/XMP/IPTC are stripped. Photos have localized semantic alt text, responsive crops, explicit dimensions and lazy loading. Equipment and team marks are incidental personal history, not partnership claims.

The existing architectural service artwork remains original concept media. The `Media` union supports approved image/video replacements. Video remains muted, inline and poster-first, with only one active preview. Reduced motion, Save-Data, touch, hidden/offscreen state and failures retain or restore posters. Replace media in the shared service factory or per-service overrides in both locales, and update the manifest.

The canonical service catalog and individual rights records are under `src/content/internal`; the nine editorial maps are in `src/content/site/service-media-map.ts`. The supplied 2026-09-10 owner approval authorizes all 41 sources: 30 selected IDs are production and 11 reserve IDs remain staging. The evidence is tracked under `docs/approvals/`. Production uses 162 tracked derivatives in `public/media/examples` with checksums in `docs/implementation/iadds-public-media.json`; a clean clone needs no `.data` or source archives. Examples are labeled only `Приклад формату / Format example`; permission does not establish authorship or a client relationship. Video Localization retains its honest fallback. See `docs/public-release.md` for exact IDs and release checks. Local review can still use the complete private derivative set; an incomplete private set fails explicitly. `npm run build` always forces production gating.

Optional archival maintenance requires privately retained originals plus FFmpeg/FFprobe on PATH. Pass paths explicitly: `node scripts/audit-iadds-package.mjs EXTRACTED_SOURCE_ROOT`, `node scripts/generate-iadds-media.mjs EXTRACTED_MEDIA_PACKAGE_ROOT`, and `node --import tsx scripts/report-iadds-package.mjs EXTRACTED_SOURCE_ROOT EXTRACTED_HANDOFF_ROOT`. `EXTRACTED_SOURCE_ROOT` contains `AI_Content_Site_Package` and `iADDS_Media_Package_v1`; the handoff root contains both v3 TXT documents. The tracked historical baseline is `docs/implementation/iadds-v3-baseline.json`. These tools regenerate historical implementation evidence and are not part of install/build/run/CI. Never regenerate or publish originals just to make a clone runnable. Required approved brand, founder, service artwork and fonts are already tracked under `public/`; no recompression is needed.

## Case publication

Moda Castle remains a draft with the supplied title and narrative. Before publishing, provide verified official spelling, client permission/date, two or three approved real output assets, a real external publication URL, a verified attributed review and complete UK/EN content. Media must carry client status, approval, dimensions and alt text. Reviews require actual quote, name, role, company, permission, verification and approval source. A public review source URL is optional for privately approved reviews; avatars require consent and ratings require a real supplied rating.

Set `approvals.clientNameVerified`, `approvals.clientPublication`, `approvals.approvedAt` and `status: 'published'` only after those requirements are satisfied. Changing status alone cannot publish. Unverified metrics fail validation and are filtered again at render time. The typed `contextMedia.interface` video and `contextMedia.input` image slots appear before the output row. Populate both slots in both locales for Moda Castle; their approvals are required by the publication guard. Its CTA carries the system collaboration context. Never fabricate missing proof.

## Consultation and delivery

Schema v2 requires name, phone, contact method, service and consent. Company/project, URL and comment are optional; email is required only for email contact. Role has been removed. The existing language selector defaults to the page locale. A shared phone normalizer accepts international numbers with 7–15 digits. The shared schema validates the client and server payload. The real handler enforces size, origin, honeypot, rate limits and idempotency, then creates a server timestamp. Payload includes selected service, model, locale, preferred language, safe source path and reference ID. Unknown query values are normalized. PII never enters analytics or production console logs.

Production fails with 503 until the delivery receiver is configured. Configure public HTTPS `CONSULTATION_WEBHOOK_URL`, required `CONSULTATION_WEBHOOK_SECRET` and `CONSULTATION_WEBHOOK_SOURCE=iadds` in the server deployment environment. The provider rejects private/local destinations, URL credentials and redirects, and accepts only a matching gateway delivery confirmation. See [the Telegram gateway runbook](docs/lead-gateway.md). No booking, meeting confirmation or live analytics integration is fabricated.

Test usage rights are confirmed in writing for the specific task. Revisions remain within the agreed concept; changed scope is agreed separately. Commitments concern scope, deliverables, timeline, price and quality, without guaranteed sales. Client materials/results are never published, reused or shared without separate permission.

## QA and future inputs

E2E starts production on 3100 and a test-only server on 3101; both ports must be free by default. Set `E2E_REUSE_PREVIEW=1` only when intentionally testing an already-running current production build on 3100. The latter proxies production HTML/assets and executes the actual POST route with the real local provider, saving synthetic records to `.data/e2e`. This avoids a second Next compiler and does not mock success. Production failure behavior is tested directly on 3100.

Screenshots are under `qa/screenshots`, including `package-v1`. Lighthouse uses default simulated mobile throttling and produces `qa/lighthouse-*.report.json/html`; run `npm run audit:performance` with production on 3100. Generated evidence is ignored by Git. Exact outcomes and resource limits are recorded in `qa/PACKAGE-V1-REPORT.md`.

`docs/ai-content-v1-implementation-map.md` maps every Master section to implementation and verification. Remaining external inputs include case media/reviews/permissions, final naming/domain/email, legal terms, production receiver, real booking/CRM/analytics integrations, service videos and final written test usage permissions. None are invented.
# Telegram consultation backend

The existing form can deliver through the signed Railway gateway. See [setup, signing contract,
deployment, delivery verification and operational runbook](docs/lead-gateway.md).
