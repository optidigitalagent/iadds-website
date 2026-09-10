# Repository handoff contract

The approved iADDS product, route structure, bilingual copy, brand, draft case status and consultation behavior are preserved. The final public-release override supplies publication approval and promotes the existing selected service media. The limited UI changes provide the required format-example labels and intentional, accessible preview playback; there is no redesign or architecture migration.

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

The public release uses the supplied owner approval dated 2026-09-10: 30 selected service IDs have 162 tracked web derivatives; 11 approved reserve IDs remain staging. Raw source ZIPs, originals, private review files, prompt packages and contact sheets remain excluded. Previously approved founder/brand assets are preserved without recompression. See `docs/public-release.md` and `docs/approvals/` for the current scope. Keep sole originals privately so future derivatives remain reproducible.

No `.env`, credentials, receiver secrets, browser cookies, actual consultation submissions, logs, `node_modules`, build artifacts, screenshots, coverage or caches belong in Git. `.env.example` documents server-only variables. Production intentionally returns 503 for consultation submissions until a real persistent HTTPS receiver is configured. No real enquiries are sent by handoff tests.

## Audit boundaries

`npm run audit:repository` checks tracked and non-ignored candidate files, case collisions, exact casing of relative/alias imports, missing and escaping imports, symlinks, local lockfile references, large files, forbidden machine paths in runtime/scripts, private/generated paths and common credential patterns. The two framework-managed imports in `next-env.d.ts` are explicitly classified as generated; `next typegen` creates them and `tsc` checks them in CI. An untouched clone must pass the audit before any dev server/build exists. Content/media validators verify assets and rights separately. These checks cannot prove that arbitrary text contains no unknown secret; review the staged diff too. Historical QA report paths are provenance only and have been normalized to `<checkout>` or explicit input labels.

Original-package audits require explicit CLI arguments, with no hidden TEMP pointer or absolute source-root dependency. Default development and production install/build/run require only this repository, Node/npm and registry access. Browser tests additionally need the ordinary Playwright Chromium installation. FFmpeg is only needed to regenerate optional source media.

## Remote validation and cleanup

The owner subsequently requested a dedicated GitHub repository. Use public `optidigitalagent/iadds-website` (`github` remote in the original checkout, default branch `main`) for source handoff and GitHub Actions CI. The workflow installs the lockfile in a fresh Linux checkout, runs the complete production build gate and Chromium browser tests, and verifies that checks did not modify tracked source. It does not need deployment secrets or private source packages. Check the actual run conclusion for the pushed SHA before declaring remote CI passed.

Keep the existing Sites source remote (`origin` in the original checkout) and the explicitly authorized public audience. Push the same validated commit to both remotes, verify `HEAD` equals both `refs/heads/main`, save/publish the validated archive and inspect the deployed source SHA, then run anonymous smoke checks against the live origin. Sites currently rejects private publish-on-push because that feature is not enabled for this account. GitHub CI is real remote verification; Sites publication still uses the existing explicit artifact flow. Provider run IDs and unavailable capabilities must be reported honestly.

Only after clean-clone verification, confirmed push/SHA/assets and deployment verification may an explicit cleanup allowlist remove generated/temp files inside the authorized workspace. Never remove the current repository, `.git`, tracked sources/assets, other projects or sole originals. Save exact deleted paths and reasons with final run evidence; final Git status must be clean and the local branch must track the existing remote branch.
