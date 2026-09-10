# Repository handoff contract

The approved iADDS product is preserved. This handoff changes reproducibility, configuration, validation and documentation only. It does not change layouts, styles, route structure, bilingual content, brand, rights, draft case status or consultation behavior.

## Dependencies retained in Git

| Input | Repository location | Handoff action |
| --- | --- | --- |
| Approved application, copy, service maps, form/server logic | `src/` | Already tracked; preserved |
| 28 founder derivatives, 8 brand derivatives, service artwork and fonts | `public/` | Already tracked; preserve exact bytes and stripped metadata |
| Embedded approved OG image/font data | `src/content/internal/og-assets.json` | Already tracked; no external file lookup |
| Content/media/source manifests, rights records, implementation maps | `docs/`, `src/content/internal/`, `qa/` | Already tracked; historical machine paths sanitized |
| Historical implementation baseline | `docs/implementation/iadds-v3-baseline.json` | Copied from ignored `.data/iadds-v3-baseline.json`; hashes only |
| Runtime packages | `package.json`, `package-lock.json` | npm registry dependencies, no local `file:`/`link:` packages; frozen install |
| Hosting identity/adapter | `.openai/hosting.json`, `wrangler.jsonc`, `open-next.config.ts`, `scripts/` | Existing Next/OpenNext/Sites architecture retained |
| Reproducible review selection and checks | `scripts/review-media.mjs`, `scripts/ci.mjs`, `scripts/audit-repository.mjs` | Private inputs optional; standard build fails on failed checks |

## Intentionally excluded

The provider confirms an owner-only Site audience but does not expose a reliable public/private classification for the source Git repository. Accordingly, no new raw/private/unverified media, source ZIPs, internal prompt documents or contact sheets are added. The already-public derivatives are preserved without recompression. All 41 service source rights remain unverified; their optional 162 review files stay private in `.data/iadds-media`. The original packages and sole raw founder originals remain in their existing private local locations. Do not delete them merely because production builds without them.

No `.env`, credentials, receiver secrets, browser cookies, actual consultation submissions, logs, `node_modules`, build artifacts, screenshots, coverage or caches belong in Git. `.env.example` documents server-only variables. Production intentionally returns 503 for consultation submissions until a real persistent HTTPS receiver is configured. No real enquiries are sent by handoff tests.

## Audit boundaries

`npm run audit:repository` checks tracked and non-ignored candidate files, case collisions, exact casing of relative/alias imports, missing and escaping imports, symlinks, local lockfile references, large files, forbidden machine paths in runtime/scripts, private/generated paths and common credential patterns. The two framework-managed imports in `next-env.d.ts` are explicitly classified as generated; `next typegen` creates them and `tsc` checks them in CI. An untouched clone must pass the audit before any dev server/build exists. Content/media validators verify assets and rights separately. These checks cannot prove that arbitrary text contains no unknown secret; review the staged diff too. Historical QA report paths are provenance only and have been normalized to `<checkout>` or explicit input labels.

Original-package audits require explicit CLI arguments, with no hidden TEMP pointer or absolute source-root dependency. Default development and production install/build/run require only this repository, Node/npm and registry access. Browser tests additionally need the ordinary Playwright Chromium installation. FFmpeg is only needed to regenerate optional source media.

## Remote validation and cleanup

Keep the existing Sites source remote and owner-only audience. Push the validated commit, verify `HEAD` equals `refs/heads/main`, save/publish the validated archive and inspect the deployed source SHA, then run authenticated smoke checks against the live origin. The provider currently rejects private publish-on-push because that feature is not enabled for this account. The standard build contains the CI checks for manual publication and a future eligible native builder; a local pass is not remote CI evidence. Do not add an unrelated GitHub workflow or change providers to conceal this limitation. Provider run IDs and unavailable capabilities must be reported honestly.

Only after clean-clone verification, confirmed push/SHA/assets and deployment verification may an explicit cleanup allowlist remove generated/temp files inside the authorized workspace. Never remove the current repository, `.git`, tracked sources/assets, other projects or sole originals. Save exact deleted paths and reasons with final run evidence; final Git status must be clean and the local branch must track the existing remote branch.
