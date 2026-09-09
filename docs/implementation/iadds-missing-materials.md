# iADDS — internal media replacement backlog

This document applies `MISSING_MATERIALS_BRIEF.md` and the final mandatory override. It is internal, never shipped under `public/`. No external assets were searched for or downloaded.

| Service | Coverage | Required replacement | Count | Rights / review |
|---|---|---|---|---|
| Video Translation & Localization | Missing | Same original/localized video: UK, EN, lip sync, voice plus captions/graphics, two markets | 3–5 pairs | Unverified / pending |
| AI Presenters & Avatars | Temporary | Business presenter, branded scripted avatar, same presenter in two languages/environments | 3 | Unverified / pending |
| Virtual Fashion Models | Temporary | Models wearing garments in full or three-quarter view | 3 | Unverified / pending |
| Brand Characters & Mascots | Temporary | The same recognizable character consistently used across scenes/campaign materials | 2–3 systems | Unverified / pending |
| Explainer Videos | Temporary | SaaS, service, software feature or business workflow explanation | 2–3 | Unverified / pending |

All other selected service examples also require individual publication permission. “Strong” describes editorial relevance, never ownership or client proof.

Editing workflow:

1. Add the canonical source to private storage, audit its binary and source provenance, and generate the required derivatives.
2. Add its localized visual description and the appropriate source-ID mapping. Do not replace one side of a variation pair with an unrelated product.
3. Record `rightsStatus`, `publicationScope`, `reviewStatus`, `approvedBy`, `approvedAt` and `evidence` in `src/content/internal/media-approvals.json`. Initially use `unverified`, `local`, `pending`, null, null, null.
4. Only after actual permission is supplied, set the individual asset to `approved-for-publication`, `production`, `approved`, with the real reviewer, date and evidence. Run `npm run media:publish-approved`, then the production validation/build. A global local-review setting cannot promote assets to production.
5. Update `coverageStatus`, `replacementRequired` and `requiredExampleType` in `src/content/site/service-media-map.ts` only once relevant, reviewed replacements exist. All current items have `approvedBy: null` and `approvedAt: null`.
6. For localization, add reviewed `LocalizationPair` data with both media IDs, both languages and explicit voice/caption/graphics/lip-sync changes. The existing component renders the pair from that data.

Cases remain a separate verified publishing workflow. Service format examples cannot activate Cases navigation or the Moda Castle draft.
