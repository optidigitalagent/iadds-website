# NFC CARD backend

NFC CARD uses the existing `antonov-lead-gateway` process and a dedicated PostgreSQL 17 database in the same Railway production environment. Its schema is `nfc_card`. The iADDS signed endpoint, validation, formatter, source secret and Telegram configuration retain their existing behavior. No iADDS frontend files change.

The existing GitHub Pages frontend has a separately configured PUBLIC release. The gateway hosts only its form endpoint; it never replaces the static site. PUBLIC_PREVIEW remains available as a centralized rollback mode. No bucket, Redis, worker or second gateway is required.

## Configuration and release controls

New server-only variables: `LEAD_SOURCE_NFC_CARD_SECRET`, `LEAD_SOURCE_NFC_CARD_LABEL`, `NFC_DATABASE_URL`, `NFC_PUBLIC_INTAKE_ENABLED`, `NFC_TELEGRAM_ENABLED`, `NFC_TELEGRAM_MODE`, `NFC_ENV`, `NFC_PUBLICATION_MODE`, and optional `NFC_TELEGRAM_TEST_LEAD_ID` / `NFC_FINAL_TEST_KEY`.

Generate the independent source secret with a cryptographic random generator; send it directly to Railway Variables without a file, shell argument, log or frontend value. The config rejects reuse of the iADDS secret. Label is `NFC CARD`. Production database URLs must resolve to a `.railway.internal` host. Set `NFC_DATABASE_URL` as a Railway reference to the new database's private `DATABASE_URL`, never a public proxy. Preserve every existing iADDS/bot/chat variable.

Defaults: public intake disabled, Telegram disabled, test-only delivery mode. `NFC_TELEGRAM_ENABLED=true` in test-only mode requires one UUID in `NFC_TELEGRAM_TEST_LEAD_ID`. Only that lead, created through the private operator CLI as synthetic and explicitly eligible, can be attempted. It receives **one HTTP attempt total**, including in the presence of an upstream rejection. All other rows remain untouched. No test mode transition bulk-releases old leads.

The owner authorized PUBLIC activation on 2026-09-12 after confirming the prior single Telegram receipt. Production uses NFC_ENV=production, NFC_PUBLICATION_MODE=PUBLIC, NFC_PUBLIC_INTAKE_ENABLED=true, NFC_TELEGRAM_ENABLED=true, NFC_TELEGRAM_MODE=live. Individually disabled dry-run rows remain held; activation never releases them. NFC_FINAL_TEST_KEY is an operator-generated UUID reserved for the one authorized final public-form test. It is not included in any public bundle. Only a matching browser idempotency key sets the durable is_final_test flag; public JSON cannot set test flags. A final test has one transport attempt even in live mode and uses `🧪 FINAL TEST — NFC CARD`. Ordinary leads keep the existing NFC header and bounded retries.

The static frontend sends camelCase data, obtains a fresh signed challenge, and accepts only a 202 durable receipt. It keeps inputs in the open form on error; browser session storage holds only an opaque attempt UUID, never personal fields or payloads. A conclusively rejected first attempt can be corrected. An ambiguous attempt retains its body/key and cannot silently become another lead.

## Public browser contract

- `GET /v1/public/leads/nfc-card/challenge?sourcePage=/nfc-card-website/order`
- `POST /v1/public/leads/nfc-card`
- Exact allowed Origin: `https://optidigitalagent.github.io`. No cookies or credentials.
- Preflight permits GET/POST and only Content-Type / Idempotency-Key headers.
- JSON body capped at 16 KiB, including streamed requests without Content-Length.
- Required `Idempotency-Key`: lowercase UUID v4, retained for retries of the same logical request.

```json
{
  "language": "uk",
  "product": "review-card",
  "quantity": 1,
  "customerName": "Synthetic QA",
  "contact": { "preferredMethod": "email", "email": "test@example.invalid" },
  "sourcePage": "/nfc-card-website/order",
  "utm": { "source": "synthetic-qa" },
  "website": "",
  "challenge": "server-issued-public-challenge"
}
```

The challenge is an HMAC-authenticated public token, not the signing secret. It binds an allowed NFC path and server timestamp; submit age must be 2 seconds–30 minutes. Fetch a new challenge for an expired retry without changing the lead/idempotency key. `website` is an empty honeypot. Neither field is persisted. Origin/path checks and timing are abuse controls, not proof that a visitor is human: non-browser clients can forge Origin. Global caps (120 public requests/minute, 60 signed NFC requests/minute) remain effective even with forged proxy headers; a bounded secondary per-peer cap limits public requests to 20/minute. State is process-local; do not scale replicas without a shared rate-limit design. No separate paid rate-limit service is provisioned.

For existing Review callers: language uk/en; product `review-card` or `branded-review-card`; integer quantity 1–10,000; trimmed name 1–100 characters. Phone normalizes to 7–15 digits with an optional leading plus. Email validates and lowercases; Telegram validates username only. Preferred phone/SMS/WhatsApp/Viber requires phone, email requires email, Telegram requires username or phone. Unknown fields, caller-supplied source/lead ID/timestamp/price and control characters are rejected. UTM permits source/medium/campaign/term/content, each at most 100 characters. Allowed source paths cover NFC home/order/contact/About/product pages in both locales; query/fragment is stripped and encoded/traversal paths rejected. Instagram-specific requirements follow below.

After PostgreSQL COMMIT: HTTP 202 `{ok:true,source:"NFC_CARD",leadId,durableSaved:true,notificationStatus:"queued"|"disabled"}`. This means accepted into durable storage; it never claims Telegram delivery. Retrying the same key/canonical body returns the same lead ID; changed content returns 409. Validation returns 422, abuse limits 429, unavailable storage 503. A 503 can include an uncertain commit outcome: retain the same key/body and retry, never show success. The frontend preserves fields in memory on failure and distinguishes definitive validation rejection from ambiguous transport/storage errors. No payload belongs in analytics or logs.

`POST /v1/leads` also accepts trusted server-to-server `x-lead-source: NFC_CARD`, `x-lead-timestamp`, `x-lead-signature` and `x-idempotency-key`. The new NFC signature is lowercase hex HMAC-SHA256 over `timestamp + ".NFC_CARD." + idempotencyKey + "." + rawBody`, binding the key against replay substitution. It uses the same durable NFC parser and store; omit public challenge/honeypot. The NFC secret is never accepted as a legacy lowercase source alias. The existing iADDS signature protocol and signed lane remain unchanged.

Optional `selection` contains only `variant` (standard/branded/bulk/consultation) and `quantity` (1/2/more as strings). The browser sends `quantity:3` with `selection.quantity:more` to mean **3 or more**, not an exact order of three; the formatter retains `3+`. Bulk/consultation use the review-card product family plus their explicit enquiry intent and always get a custom quote. Selection/product/quantity combinations are cross-validated. Older callers without selection retain their contract. Canonical prices are computed server-side: standard 1/2 = 1500/2600 UAH, branded 1/2 = 2000/3600 UAH; 3+ or general enquiries = custom. The 200 UAH deposit is included. Client price fields are rejected. The server snapshot is persisted in the lead transaction and returned as `quote` in the receipt.

### NFC Instagram Card (additive product schema 1)

The Instagram product uses the same NFC browser endpoint, challenge, CORS policy, idempotency key and durable receipt. Its Pages payload is:

```json
{
  "language": "uk",
  "product": "nfc-instagram-card",
  "productSchemaVersion": 1,
  "product_id": "nfc-instagram-card",
  "sku": "NFC-IG-READY",
  "offer": "ready",
  "quantity": 2,
  "selection": { "variant": "instagram", "quantity": "2" },
  "customerName": "Synthetic Instagram QA",
  "contact": { "preferredMethod": "telegram", "phone": "+12025550123" },
  "instagramUrl": "https://www.instagram.com/synthetic_business/",
  "comment": "Optional order details",
  "consent": true,
  "sourcePage": "/nfc-card-website/solutions/instagram-card",
  "website": "",
  "challenge": "server-issued-public-challenge"
}
```

Only the ready offer and quantities 1/2 are accepted, with server totals 1500/2600 UAH and the existing included 200 UAH deposit. Product identifiers, schema version, explicit selection and consent must agree exactly. Instagram requires a phone and Telegram/WhatsApp/Viber preference. Client prices, branded/QR fields, missing consent and cross-product selections are rejected. Review callers retain their prior optional-selection/contact/quantity contract; Instagram-only fields are not accepted on Review requests.

Profile URLs follow the Pages grammar: HTTPS Instagram host (with optional `www`), one 1–30-character username using letters/digits/underscores/dots, no leading/trailing/consecutive dots, no reserved content/account paths, credentials, port, query, fragment or encoding. Stored URLs use `https://www.instagram.com/lowercase_username/`. No network lookup or account verification occurs. Comments are optional, at most 2000 UTF-16 code units; empty comments are omitted, Unicode is NFC-normalized and line endings become LF. Other control/direction-override characters are rejected. Comments and profile URLs are included in the canonical idempotency digest and escaped in the NFC Telegram formatter.

Additional allowed source paths are `/nfc-card-website/solutions/instagram-card`, `/nfc-card-website/instagram-card` and their `/en/` equivalents. Existing generic order/contact routes remain valid. The trusted signed NFC lane uses the same Instagram validation without the browser-only challenge/honeypot.

Migration `003_instagram_card.sql` replaces only the NFC product check and adds nullable `product_schema_version`, `product_id`, `sku`, `offer`, `instagram_url`, `comment` and `consent` columns. Its conditional constraint requires complete Instagram metadata/selection and 1/2 quantities while leaving old Review rows valid with null additions. The migration runner retains the immutable 001/002 checksums. Apply 003 before running the updated gateway; runtime does not migrate implicitly. The lead and outbox still commit together before receipt or delivery. A restarted worker loads the profile/comment/identity/consent and saved price from PostgreSQL; no browser memory is needed for Telegram.

### NFC Menu Card (additive product schema 1)

Menu uses the same public endpoint, challenge, origin, body cap, idempotency key, durable lead and outbox transaction. The product is `nfc-menu-card`. All Menu-specific fields are snake case: `product_id`, `intent`, `menu_status`, `menu_url`, and `items`. `productSchemaVersion` remains camel case as in Instagram. `comment` and `consent:true` remain shared product detail fields. Menu requests cannot carry Instagram SKU/offer/profile or Review `selection`.

For a card order, send `intent:"card_order"`, a top-level integer `quantity`, and one or more `items:[{"variant_id":"square_100_black","quantity":2},...]`. The six allowed IDs are `square_100_black`, `square_100_white`, `square_60_black`, `square_60_white`, `round_70_black`, and `round_70_white`. Duplicate variant rows normalize to one row in canonical variant order. The top-level quantity must equal the sum after normalization. The reached unit tier applies to every Menu card: 1–4 at 1000 UAH, 5–9 at 750, 10–24 at 600, 25+ at 500. The saved and returned quote includes `quantity`, `unitPrice`, `amount`, one included 200 UAH `deposit`, and `balance`, with matching integer `unitPriceKopecks`, `amountKopecks`, `depositKopecks`, and `balanceKopecks` fields in the durable snapshot. Client price fields are rejected.

For consultation without cards, send `intent:"menu_consultation"`, `menu_status:"needs_development"`, omit top-level `quantity` and `items`, and omit `menu_url`. The canonical lead stores quantity zero and empty items with a consultation quote whose amount, unit price, deposit, and balance are all null. This is a lead, not a card purchase. A card order may also use `needs_development`; its card quote excludes menu development.

`menu_status:"existing"` requires a guest-facing public HTTP(S) `menu_url`. The gateway validates syntax and rejects credentials, local/private literal hosts, control characters and unsafe schemes. It does not fetch or resolve the URL. `needs_development` accepts no active URL. URL and comment are each capped at 1000 characters so even maximum valid Menu details fit one HTML-formatted Telegram message; the full accepted values are persisted. Menu source pages include `/solutions/menu-card` and `/menu-card` in both locales, besides the existing shared order/contact paths.

Migration `004_menu_card.sql` preserves the immutable 001–003 checksums, adds nullable Menu detail columns and widens the NFC product/quantity checks only for Menu consultation. It retains all Review/Instagram rows and the existing outbox. Apply 004 before running a gateway that accepts Menu; no runtime migration occurs. Local tests upgrade a populated 003 database and use only fake Telegram transport.

Local verification adds Instagram parser/pricing/format/CORS tests and PostgreSQL upgrade, concurrent idempotency, rollback, durable retry and legacy-row delivery tests. The integration suite creates and drops its own randomly named upgrade database on the isolated local PostgreSQL fixture, so the test role needs `CREATEDB`. No live transport is used. Deployment still uses the existing Railway service, operational flags and secrets; this change creates no additional resource.

## Database and outbox

`migrations/nfc-card/001_nfc_card.sql` creates only additive NFC objects: leads, notification_outbox, due/claimed/created indexes. UUID IDs, unique idempotency and lead/transport keys, foreign key, source markers, timestamps and status checks are enforced in PostgreSQL. The migration runner uses a transaction, advisory lock and SHA-256 ledger `nfc_card.schema_migrations`. A mismatched checksum aborts. Migration preflight performs the same DDL transaction then rolls it back. Migration 002_public_commerce only adds optional selection/price_quote snapshots and is_final_test; it preserves the deployed 001 bytes and every existing record. Runtime never applies schema changes implicitly.

One client executes BEGIN → lead INSERT → outbox INSERT → COMMIT. Concurrent identical keys converge through the unique constraint. No notification transport runs in the request transaction.

The existing gateway process polls every 3 seconds, up to 5 rows per batch. `FOR UPDATE SKIP LOCKED` claims a due row, persists `sending` and increments the attempt counter before any Telegram call. Explicit negative Telegram responses retry with exponential backoff, respecting retry-after, up to 6 attempts. Restart resumes committed pending/retry rows; sent rows never qualify. Failed/unknown outcomes retain the lead.

Telegram does not expose an idempotent sendMessage API. Exactly-once delivery cannot be guaranteed across an ambiguous network/crash boundary. A timeout, invalid receipt or expired in-flight claim is therefore marked `failed / outcome_unknown` and is **not** automatically resent. Operators must reconcile the lead ID with Telegram before an explicitly authorized retry. This avoids silently duplicating a notification at the cost of requiring manual reconciliation of that narrow failure case. Graceful shutdown stops polling, waits for active work/requests, then closes the pool; a forced shutdown leaves a recoverable or reviewable outbox state.

The separate NFC formatter HTML-escapes user values, omits empty contacts and includes source, lead ID, locale, product, quantity, contact preference, timestamp and path. Application logs serialize only allowlisted IDs/status/category/retry/latency/timestamp. Configure PostgreSQL logging to omit statements, bind parameters and row DETAIL on errors. No test process receives real bot configuration.

## Verification and operations

From `services/lead-gateway`: `npm ci`, `npm run typecheck`, `npm test`, `npm run build`. Set `NFC_TEST_DATABASE_URL` only to an isolated local PostgreSQL 17 database whose name ends `_test`; integration tests reject production/private hosts. The CI job provisions a disposable PostgreSQL container without real secrets. Root iADDS CI still runs its complete audit/lint/typecheck/unit/browser/Worker build.

Private Railway shell only:

```sh
npm run preflight:nfc
npm run migrate:nfc
npm run inspect:nfc
node --experimental-strip-types scripts/nfc-ops.ts verify-rollback
node --experimental-strip-types scripts/nfc-ops.ts seed-dry-run KEY_UUID LEAD_UUID
node --experimental-strip-types scripts/nfc-ops.ts receipt LEAD_UUID
```

These commands return counts, checksums, opaque receipts and deployed SHA, never credentials or payloads. Set pre-deploy command `npm run preflight:nfc && npm run migrate:nfc`; a failure must stop promotion. `/healthz` remains the legacy process health endpoint, so NFC database health must also pass `inspect:nfc` independently.

After source/CI/clean-clone and live verification, submit exactly one synthetic FINAL TEST through the public form using the privately reserved key; verify lead, outbox and terminal sent receipt. A duplicate with that same key/body must return the existing ID without another delivery. Stop and request owner receipt confirmation. Never run seed-test or seed-dry-run during this final launch.

## Infrastructure, backup and rollback

Existing project/environment only; one private `nfc-card-postgres`, one data volume 1024 MB mounted at `/var/lib/postgresql/data`, PostgreSQL 17, one sfo replica. Initial ceiling 0.5 GB RAM / 1 vCPU, 128 MB shared buffers, 30 connections; gateway pool maximum 4. These are ceilings, not continuously reserved usage. No public domain, TCP proxy, bucket, worker, extra volume or backup add-on. Recheck measured usage/cost after 7 days; no scheduled automation or hard account spending limit is installed by this change.

Before migration, take a private `pg_dump` through a Railway private shell, stream it to access-restricted owner storage, validate with `pg_restore --list`, and restore-test in an isolated local database. Credentials remain environment references. Keep dumps out of Git and CI artifacts. A 1 GB data volume is not a backup; no recurring/off-host backup service is created. A private, access-restricted off-host checkpoint is taken before this release and restore-tested locally. This does not create recurring backup automation; operators must maintain subsequent backups and retention in their existing private storage. No backup add-on is provisioned.

Rollback order: disable NFC public intake and Telegram, redeploy the last known-good gateway commit with its old pre-deploy configuration. Preserve the NFC schema/volume/data; **never** DROP/TRUNCATE/reverse-migrate or overwrite production from a dump. Existing iADDS source and formatter are unaffected. Prefer a forward additive fix after reviewing the exact failure. Restore into a separate local disposable database first; any production data restore requires an explicit incident decision. Do not delete this volume or unrelated Railway resources.
