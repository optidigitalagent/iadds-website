# iADDS media architecture

There are two distinct artifacts, even though both can use Next's optimized build machinery:

| Artifact | Output | Audience | Service media |
|---|---|---|---|
| Local review | `.next-review` | Loopback `127.0.0.1:3100` | 30 selected assets served from private `.data/iadds-media` |
| Production / Sites | `.next`, then `dist` | Public | 30 approved source IDs, 162 tracked derivatives; 11 staging IDs excluded |

`NODE_ENV=production` alone describes optimization, not rights. Local review additionally requires `IADDS_REVIEW_BUILD=true`, `IADDS_MEDIA_MODE=local` and a loopback `SITE_URL`. The ordinary build wrapper always sets review=false and media=production. The Sites adapter accepts only `.next`, never `.next-review`, and packaging validation scans client assets for review URLs. The `/api/format-media` endpoint is disabled in the ordinary production artifact; it also checks request hostname and an exact derivative filename allowlist. Original source files never enter either public asset tree. Local byte-range responses support native video controls.

Per-asset permission lives in `src/content/internal/media-approvals.json`. The supplied owner evidence dated 2026-09-10 approves all 41 records for website use. Thirty selected IDs have production scope; eleven approved reserve IDs remain staging. Approval validity and production selection are separate checks. A production selector requires a production scope, approved review, nonempty reviewer, valid date and evidence. The helper that copies files into `public/media/examples` applies the same individual rule. Build validation fails if an unverified source or derivative appears in public storage.

`media-catalog.ts` is the private canonical catalog. `service-media.ts` builds minimal localized `ExampleMedia` objects for server-rendered sections and client playback. Original filenames, paths, hashes, tags and approval evidence are not serialized to browser props. Static-client scanning verifies that provenance remains server-side.

`exampleUrl` is the storage adapter: local review endpoint versus individually approved production storage. A CDN can replace that function without changing gallery components. Source IDs are shared between UK and EN.

Card videos have no eager `src` or native `poster` request. Their accessible responsive picture is the visible poster; the native player receives its source and poster only after a permitted interaction in the viewport. Cards are muted, inline, looping, reset outside the viewport and coordinated globally. Reduced motion and Save-Data retain posters. Touch defaults to posters and requires a separate explicit play/pause button; the full-card service link remains usable without nested interactive controls. Detail videos require a play action, expose native controls, start muted, preserve native ratio, and retain a poster on failure.

The three paired creative sets are rendered through `VariationSet`. Featured sources are removed from the lower gallery on the same page. Source 40 is featured only inside a contained frame no wider than its native 500px. The 500×376 sources never become full-width hero videos. Sources 28/35 are labeled as motion design; 18/27/37 are labeled as supporting visual brand-world examples.

Posters were reviewed from actual decoded frames. Sources 06 and 40 use a frame at 3s so the first rendered still immediately shows a product transformation / commercial model; the earlier frames primarily showed rotating packaging or a brand title. Source 30 uses 2s to show the product rather than an abstract gold liquid. These selected card previews start from the same useful offset. Every source remains unchanged.
