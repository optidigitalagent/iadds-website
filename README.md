# iADDS — By Antonov Digital

Existing Next.js + TypeScript site updated from both supplied source packages under the final iADDS v3 override. Ukrainian is the default; English has matching content, routes and form behavior. The original black/graphite visual system is retained.

## Local use

Use Node 24 LTS (`.nvmrc`, `engines`) and npm 11.9.0 (`packageManager`) from this Git root. Run `npm ci`, then `npm run dev`. Open http://127.0.0.1:3100/uk. No `.env` file or original source package is required. Development enquiries are really saved to `.data/consultations/<referenceId>.json`; the success screen explicitly states that they are local and do not book a call. Use synthetic test data.

`npm run build` is the fail-fast Sites CI entry point: repository/path/credential-pattern audit, lint, route types, TypeScript, unit/integration tests, locale/content/media validation, production Next build, OpenNext Worker adaptation and publication guards. It emits `.next` and the existing Sites artifact layout in `dist`. `npm run build:next` builds only the validated Next artifact; `npm run build:sites` adapts it for Sites (or pass `-- --skip-next` after a current successful Next build). Production starts with `npm run start` on loopback port 3100. The wrappers use Webpack, one static-generation worker and bounded memory, with all checks enabled.

For browser verification, free ports 3100/3101, run `npx playwright install chromium` once, then `npm run test:e2e`. Linux CI may need `npx playwright install --with-deps chromium`. Individual checks remain available: `npm run audit:repository`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run validate:content`, `npm run validate:media`. Never copy another checkout's `node_modules`, `.next` or `.env` to prove a clean clone.

## Repository and hosting handoff

This folder is an independent Git repository. Its `origin` is the existing Sites source repository; the unrelated parent Art Studio repository is not a deployment target. The local branch can track `origin/main`. Preserve `.openai/hosting.json` and its existing project ID. Production: https://iadds-by-antonov-digital.funckj.chatgpt.site (existing owner-only audience).

Sites accepts the pushed `main` revision and the standard `npm run build` command. An owner-scoped, time-limited **private publish-on-push** credential can enable its native build/publication flow; ordinary write credentials do not enable automatic publishing. Obtain ephemeral credentials through Sites and pass authentication per Git command, never in a remote URL, file or Git config. Inspect the saved version's source SHA and deployment result before calling a push deployed. There is no GitHub Actions workflow for this non-GitHub source repository. A local CI pass alone does not prove remote CI ran.

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

The iADDS v3 source catalog and individual rights records are internal under `src/content/internal`; the nine editorial maps are in `src/content/site/service-media-map.ts`. All 41 service sources remain unverified. Thirty selected examples have 162 optional private derivatives in ignored `.data/iadds-media`; eleven stay in reserve. Production excludes them physically and through the renderer until individual rights approval. A clean clone renders the same approved production artwork without these examples. With the complete private set present, local review preserves the existing examples. A partial set fails explicitly. Run `npm run build:review`, then `npm run preview:review` for an optimized loopback review at 3100; `npm run build` always forces production gating. See `docs/implementation/iadds-media-architecture.md` and `qa/IADDS-V3-IMPLEMENTATION-REPORT.md`.

Optional archival maintenance requires privately retained originals plus FFmpeg/FFprobe on PATH. Pass paths explicitly: `node scripts/audit-iadds-package.mjs EXTRACTED_SOURCE_ROOT`, `node scripts/generate-iadds-media.mjs EXTRACTED_MEDIA_PACKAGE_ROOT`, and `node --import tsx scripts/report-iadds-package.mjs EXTRACTED_SOURCE_ROOT EXTRACTED_HANDOFF_ROOT`. `EXTRACTED_SOURCE_ROOT` contains `AI_Content_Site_Package` and `iADDS_Media_Package_v1`; the handoff root contains both v3 TXT documents. The tracked historical baseline is `docs/implementation/iadds-v3-baseline.json`. These tools regenerate historical implementation evidence and are not part of install/build/run/CI. Never regenerate or publish originals just to make a clone runnable. Required approved brand, founder, service artwork and fonts are already tracked under `public/`; no recompression is needed.

## Case publication

Moda Castle remains a draft with the supplied title and narrative. Before publishing, provide verified official spelling, client permission/date, two or three approved real output assets, a real external publication URL, a verified attributed review and complete UK/EN content. Media must carry client status, approval, dimensions and alt text. Reviews require actual quote, name, role, company, permission, verification and approval source. A public review source URL is optional for privately approved reviews; avatars require consent and ratings require a real supplied rating.

Set `approvals.clientNameVerified`, `approvals.clientPublication`, `approvals.approvedAt` and `status: 'published'` only after those requirements are satisfied. Changing status alone cannot publish. Unverified metrics fail validation and are filtered again at render time. The typed `contextMedia.interface` video and `contextMedia.input` image slots appear before the output row. Populate both slots in both locales for Moda Castle; their approvals are required by the publication guard. Its CTA carries the system collaboration context. Never fabricate missing proof.

## Consultation and delivery

The shared schema validates the client and server payload. The real handler enforces size, origin, honeypot, rate limits and idempotency, then creates a server timestamp. Payload includes selected service, model, locale, preferred language, safe source path and reference ID. Unknown query values are normalized. PII never enters analytics or production console logs.

Production fails with 503 until a persistent receiver is configured. Configure public HTTPS `CONSULTATION_WEBHOOK_URL` and optional `CONSULTATION_WEBHOOK_SECRET` in the deployment environment. The provider rejects private/local destinations, URL credentials and redirects. No booking, meeting confirmation or live analytics integration is fabricated.

Test usage rights are confirmed in writing for the specific task. Revisions remain within the agreed concept; changed scope is agreed separately. Commitments concern scope, deliverables, timeline, price and quality, without guaranteed sales. Client materials/results are never published, reused or shared without separate permission.

## QA and future inputs

E2E starts production on 3100 and a test-only server on 3101; both ports must be free by default. Set `E2E_REUSE_PREVIEW=1` only when intentionally testing an already-running current production build on 3100. The latter proxies production HTML/assets and executes the actual POST route with the real local provider, saving synthetic records to `.data/e2e`. This avoids a second Next compiler and does not mock success. Production failure behavior is tested directly on 3100.

Screenshots are under `qa/screenshots`, including `package-v1`. Lighthouse uses default simulated mobile throttling and produces `qa/lighthouse-*.report.json/html`; run `npm run audit:performance` with production on 3100. Generated evidence is ignored by Git. Exact outcomes and resource limits are recorded in `qa/PACKAGE-V1-REPORT.md`.

`docs/ai-content-v1-implementation-map.md` maps every Master section to implementation and verification. Remaining external inputs include case media/reviews/permissions, final naming/domain/email, legal terms, production receiver, real booking/CRM/analytics integrations, service videos and final written test usage permissions. None are invented.
