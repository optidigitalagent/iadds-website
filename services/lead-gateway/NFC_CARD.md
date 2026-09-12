# NFC CARD backend

NFC CARD uses the existing `antonov-lead-gateway` process and a dedicated PostgreSQL 17 database in the same Railway production environment. Its schema is `nfc_card`. The iADDS signed endpoint, validation, formatter, source secret and Telegram configuration retain their existing behavior. No iADDS frontend files change.

The accepted GitHub Pages frontend remains PUBLIC_PREVIEW with disabled forms and `noindex,nofollow`. Deploying this backend does not activate that frontend. No bucket, Redis, worker or second gateway is required.

## Configuration and release controls

New server-only variables: `LEAD_SOURCE_NFC_CARD_SECRET`, `LEAD_SOURCE_NFC_CARD_LABEL`, `NFC_DATABASE_URL`, `NFC_PUBLIC_INTAKE_ENABLED`, `NFC_TELEGRAM_ENABLED`, `NFC_TELEGRAM_MODE`, and optionally `NFC_TELEGRAM_TEST_LEAD_ID`.

Generate the independent source secret with a cryptographic random generator; send it directly to Railway Variables without a file, shell argument, log or frontend value. The config rejects reuse of the iADDS secret. Label is `NFC CARD`. Production database URLs must resolve to a `.railway.internal` host. Set `NFC_DATABASE_URL` as a Railway reference to the new database's private `DATABASE_URL`, never a public proxy. Preserve every existing iADDS/bot/chat variable.

Defaults: public intake disabled, Telegram disabled, test-only delivery mode. `NFC_TELEGRAM_ENABLED=true` in test-only mode requires one UUID in `NFC_TELEGRAM_TEST_LEAD_ID`. Only that lead, created through the private operator CLI as synthetic and explicitly eligible, can be attempted. It receives **one HTTP attempt total**, including in the presence of an upstream rejection. All other rows remain untouched. No test mode transition bulk-releases old leads.

For future commercial activation, owner approval is required before setting mode `live`, enabling public intake or changing the Pages frontend. Rows persisted with delivery disabled remain individually ineligible after enabling; their release requires an explicit operational decision. Browser form integration must adopt the camelCase contract and signed challenge below; the accepted preview is intentionally unchanged and its old draft client is not an activated integration.

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

Language uk/en; product `review-card` or `branded-review-card`; integer quantity 1–10,000; trimmed name 1–100 characters. Phone normalizes to 7–15 digits with an optional leading plus. Email validates and lowercases; Telegram validates username only. Preferred phone/SMS/WhatsApp/Viber requires phone, email requires email, Telegram requires username or phone. Unknown fields, caller-supplied source/lead ID/timestamp/price and control characters are rejected. UTM permits source/medium/campaign/term/content, each at most 100 characters. Allowed source paths cover NFC home/order/contact/About/product pages in both locales; query/fragment is stripped and encoded/traversal paths rejected.

After PostgreSQL COMMIT: HTTP 202 `{ok:true,source:"NFC_CARD",leadId,durableSaved:true,notificationStatus:"queued"|"disabled"}`. This means accepted into durable storage; it never claims Telegram delivery. Retrying the same key/canonical body returns the same lead ID; changed content returns 409. Validation returns 422, abuse limits 429, unavailable storage 503. A 503 can include an uncertain commit outcome: retain the same key/body and retry, never show success. A future frontend must preserve fields in memory on failure and distinguish definitive validation rejection from ambiguous transport/storage errors. No payload belongs in analytics or logs.

`POST /v1/leads` also accepts trusted server-to-server `x-lead-source: NFC_CARD`, `x-lead-timestamp`, `x-lead-signature` and `x-idempotency-key`. The new NFC signature is lowercase hex HMAC-SHA256 over `timestamp + ".NFC_CARD." + idempotencyKey + "." + rawBody`, binding the key against replay substitution. It uses the same durable NFC parser and store; omit public challenge/honeypot. The NFC secret is never accepted as a legacy lowercase source alias. The existing iADDS signature protocol and signed lane remain unchanged.

## Database and outbox

`migrations/nfc-card/001_nfc_card.sql` creates only additive NFC objects: leads, notification_outbox, due/claimed/created indexes. UUID IDs, unique idempotency and lead/transport keys, foreign key, source markers, timestamps and status checks are enforced in PostgreSQL. The migration runner uses a transaction, advisory lock and SHA-256 ledger `nfc_card.schema_migrations`. A mismatched checksum aborts. Migration preflight performs the same DDL transaction then rolls it back. Runtime never applies schema changes implicitly.

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

These commands return counts, checksums, opaque receipts and deployed SHA, never credentials or payloads. Set pre-deploy command `npm run migrate:nfc`; a failure must stop promotion. `/healthz` remains the legacy process health endpoint, so NFC database health must also pass `inspect:nfc` independently.

Only after CI, clean clone, live private database, persistence/restart and acceptance checks: while Telegram is false, run `seed-test KEY_UUID LEAD_UUID`, set the exact test UUID and enable backend Telegram in test-only mode, redeploy. Verify one terminal receipt and ask the owner to confirm receiving `🧪 TEST — NFC CARD`. Stop. Do not enable the public form or send another test.

## Infrastructure, backup and rollback

Existing project/environment only; one private `nfc-card-postgres`, one data volume 1024 MB mounted at `/var/lib/postgresql/data`, PostgreSQL 17, one sfo replica. Initial ceiling 0.5 GB RAM / 1 vCPU, 128 MB shared buffers, 30 connections; gateway pool maximum 4. These are ceilings, not continuously reserved usage. No public domain, TCP proxy, bucket, worker, extra volume or backup add-on. Recheck measured usage/cost after 7 days; no scheduled automation or hard account spending limit is installed by this change.

Before migration, take a private `pg_dump` through a Railway private shell, stream it to access-restricted owner storage, validate with `pg_restore --list`, and restore-test in an isolated local database. Credentials remain environment references. Keep dumps out of Git and CI artifacts. A 1 GB data volume is not a backup; no recurring/off-host backup service is created. Before public lead activation, owner must choose a private destination and retention policy for recurring encrypted backups.

Rollback order: disable NFC public intake and Telegram, redeploy the last known-good gateway commit with its old pre-deploy configuration. Preserve the NFC schema/volume/data; **never** DROP/TRUNCATE/reverse-migrate or overwrite production from a dump. Existing iADDS source and formatter are unaffected. Prefer a forward additive fix after reviewing the exact failure. Restore into a separate local disposable database first; any production data restore requires an explicit incident decision. Do not delete this volume or unrelated Railway resources.
