# AI Content package v1 — implementation coverage

Created before application changes. Canonical input: extracted `AI_Content_Site_Package`; separate v2 includes the exact supplied addendum. All three package documents, v2 and addendum were read in full. User originals stay outside public and are unchanged.

| Master section | Action | Route | Content/config | Component / implementation | Verification | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 0 Source roles | KEEP | all | typed locale content | server rendering; internal rules isolated | source coverage, bundle scan | verified |
| 1.1 Visual identity | KEEP | all | globals.css | existing primitives, architectural artwork | screenshots, axe | verified |
| 1.2 Legacy sections | REMOVE | home/about | site dictionaries | remove dead hero and duplicate founder/team sections | rg, DOM order | verified |
| 2 Sales purpose | CHANGE | services/consultation | CTA/context config | contextual links, real submission | E2E payload | verified |
| 3.1 Company positioning | CHANGE | about | experience.ts | About editorial | exact copy | verified |
| 3.2 Ecosystem | ADD | about only | experience.ts | ecosystem grid | 9 entries, locale parity | verified |
| 3.3–3.4 Product/formula | CHANGE | home/about | experience.ts, settings.ts | why-now and company chapter | copy coverage | verified |
| 4 Sitemap/header | ADD | ai-systems/pricing | nav, urls, sitemap | localized pages; FAQ anchor; Pricing footer | HTTP, SEO, locale switch | verified |
| 5 Home order | CHANGE | home | page.tsx | catalog/custom/test/case/models/process/why/pricing/about/FAQ/consult/contact | DOM order | verified |
| 6 Compact intro | KEEP | home | site.ts | CatalogIntro | first card at mobile widths | verified |
| 7.1–7.2 Nine services | CHANGE | services/details | services.ts, service-groups.ts | shared catalog | 9 slugs, names, copy | verified |
| 7.3 Custom objective | ADD | home/services | experience.ts | CustomTaskCTA | consultation link | verified |
| 8 Public free test | CHANGE | home/services/pricing | experience.ts | TestStage with five facts | copy and CTA tests | verified |
| 8 Internal test policy | HIDE-DRAFT | none | internal policy | scope/usage confirmation checklist | no public payload | verified |
| 9 Models | CHANGE | home/ai-systems | site.ts | CollaborationModels | context/preselection | verified |
| 10 Seven steps | CHANGE | home/process/services | process.ts | ProcessTimeline | 7 steps both locales | verified |
| 11 Why now/mission/vision | ADD | home/about | experience.ts | WhyNow; ambition marked future | copy/guardrails | verified |
| 12.1 Public pricing | ADD | home/pricing/services | experience.ts | PricingPreview/PriceGuidance | units and contextual amounts | verified |
| 12.2 Internal estimates | HIDE-DRAFT | none | internal policy | no public import | leak scan | verified |
| 12.3 Payment | ADD | pricing/FAQ | experience.ts/process.ts | secondary payment copy | absent home headline | verified |
| 13.1 AI systems | ADD | ai-systems | experience.ts | dedicated page | benefits, system CTA, SEO | verified |
| 13.2 Moda Castle | HIDE-DRAFT | cases/moda-castle | cases/index.ts | publication guard | 404/noindex/no sitemap/schema | verified |
| 14 Service template | CHANGE | 9 details | services.ts | ordered template and 4 CTA positions | each route, mobile dock | verified |
| 15.1–15.3 Case template | CHANGE | cases/[slug] | CaseStudy types/guards | task-led story/media/link/review/CTA | synthetic approved fixture | verified |
| 15.4 Empty cases | KEEP | cases | site.ts | truthful state | no nav/no sitemap, HTTP | verified |
| 16 Unified company/founder | CHANGE | home/about | experience.ts/settings.ts | WhoBehind chapter | team 2, distinct 30+/~50 | verified |
| 17 Timeline | ADD | about | experience.ts | 8-entry timeline | dates, translated facts | verified |
| 18.1–18.3 Founder identity/story | CHANGE | about | settings.ts/experience.ts | portrait/story | exact role and biography | verified |
| 18.4 Competencies | ADD | about | experience.ts | 6 concise competencies | parity | verified |
| 18.5–18.6 Philosophy/responsibility | ADD | home/about | experience.ts | founder narrative/CTA | copy coverage | verified |
| 19.1 All 7 photographs | ADD | about, home preview | founder-media.ts/manifest | responsive semantic picture | decode, crops, metadata, network | verified |
| 19.2–19.3 Hockey | ADD | about | experience.ts | staggered pair | localized alts/story | verified |
| 19.4–19.5 Water | ADD | about | experience.ts | GoPro, wide boat, jetski | identifier inspection | verified |
| 19.6 Motion/privacy | CHANGE | about | media manifest/styles | neutral urban crop; reveal | reduced motion, safe derivatives | verified |
| 20 Principles | ADD | about | experience.ts | 6 principles | full EN translation | verified |
| 21 Commitments/revisions/privacy | CHANGE | process/pricing/services | process.ts | shared commercial notes | exact copy, no sales guarantee | verified |
| 22 Consultation | CHANGE | consultation/CTAs | site.ts/validation/provider | existing real form | validation, save, failure, source | verified |
| 23 FAQ | CHANGE | home/services/pricing | process.ts | 13 localized answers | keyboard, links, parity | verified |
| 24 Contacts | KEEP | all | settings.ts | links/footer/form | href validation | verified |
| 25 Motion | CHANGE | all | tokens/CSS/SiteEffects | reveal, stagger, parallax, process line | reduced motion, no JS | verified |
| 26 Mobile | CHANGE | all | component CSS | column story, compact cards/dock | 320/360/375/390/430/768 screenshots | verified |
| 27 Public/internal fact coverage | CHANGE | appropriate routes | all content + internal policy | guardrails | source audit + stale scan | verified |
| 28 Acceptance | CHANGE | all | tests/QA | lint/types/build/unit/browser/axe/Lighthouse | exact artifacts and findings | verified; final measurements in QA report |
| 29 Future additions | HIDE-DRAFT | none until approved | typed slots/README | publication/provider/media edit guide | documented real dependencies | prepared; owner/provider inputs pending |

Source-specific constraints: all seven supplied photos must map to an actual scene. The urban original must never be public. Sensitive registration details must be removed from derivatives. Full-quality test files do not imply unconditional usage rights; confirm them for each test. No invented clients, results, roles, legal entity, address or booking integration.

## Verification evidence

- All sections 0–29 were classified before the main migration. Status `verified` means implemented and checked by the evidence below; it does not mean an unpublished client case or an unconnected production provider is live.
- `qa/package-v1-source-audit.json`: 100 exact public source paragraphs and 10 draft-only paragraphs found; no unmatched standalone source paragraph longer than 65 characters. Only whitespace, apostrophes and dash typography are normalized. This automated subset supplements the section-by-section review; it does not replace it.
- `qa/package-v1-source-hashes.json` and `docs/founder-media-manifest.json`: seven unchanged originals, 28 desktop/mobile AVIF/WebP files, explicit crop/dimension/alt/privacy records. Browser checks decoded the matching AVIF crop at 390/1440 px in both locales.
- `qa/package-v1-browser.json`: 36 passing Chromium tests, including all 18 service routes, new routes at 320/360/375/390/430/768/1440 px, main page types through 1920 px, locale context, real local submission, provider failure, keyboard, no-JavaScript fallback, reduced motion and empty cases. Axe found no violations across 10 page types in both locales.
- `qa/package-v1-unit.log`: 32 passing unit/integration tests. Typecheck, ESLint and production Webpack build passed. Current Lighthouse numbers and exact artifact paths are recorded in `qa/PACKAGE-V1-REPORT.md`.
- Internal estimates and draft narrative were searched in `.next/static` and were absent. Source package documents, original images and archive are not in `public`.
- Publication remains gated on actual client inputs. `contextMedia.interface` and `contextMedia.input` precede the two/three-output row; approvals, localized content, external publication and verified review are checked before publication. No synthetic fixture is included in application content.