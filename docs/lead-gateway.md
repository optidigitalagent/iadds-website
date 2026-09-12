# Consultation delivery via Railway

```text
Existing UK/EN browser form
  -> same-origin POST /api/consultation (validation, honeypot, rate limit, stable UUID)
  -> WebhookSubmissionProvider (HTTPS, public-address guard, HMAC, 13s timeout)
  -> Railway POST /v1/leads (raw-body verification, validation, source rate limit, deduplication)
  -> Telegram sendMessage (HTML escaping, bounded retries, confirmed message ID + target chat)
  -> gateway HTTP 200 { ok: true, referenceId }
  -> existing localized form success
```

Source: `services/lead-gateway/`. The only product change is the existing server-side provider;
form fields, labels, CSS, routes, media and success/error components remain unchanged.
The gateway has no runtime npm dependencies. Node 24, TypeScript, native HTTP; `0.0.0.0:$PORT`.
`npm ci && npm run build`, then `npm start`. SIGTERM drains requests for up to 12 seconds.

## Hosting configuration

- Repository: `optidigitalagent/iadds-website`, branch `main`.
- Railway project: `antonov-lead-gateway` (`4aef4158-0d65-42a8-8507-b42e25a4533b`).
- Service: `lead-gateway` (`ff7ee862-10c9-4fe6-9400-007bd4d9afd8`).
- Production environment: `c4fae3b0-ab5a-47a7-b06d-7498c2413522`.
- Root directory: `/services/lead-gateway`; watch pattern `/services/lead-gateway/**`.
- Gateway: `https://lead-gateway-production-6c25.up.railway.app/v1/leads`.
- Health: `GET /healthz` returns only `{ "ok": true, "service": "antonov-lead-gateway" }`.
- One replica, ON_FAILURE restart (3 retries), health timeout 60s, app sleeping off.
- No databases, volumes, buckets, preview environments or local tunnels.
- Configuration is in the Railway service settings. Do not add deprecated railway.json config.

| Variable | Location | Purpose |
|---|---|---|
| TELEGRAM_BOT_TOKEN | Railway only, secret | Owner's existing bot token |
| TELEGRAM_CHAT_ID | Railway only, private | Owner-confirmed personal chat; positive integer |
| TELEGRAM_MESSAGE_THREAD_ID | Railway only, optional | Existing topic, if applicable |
| LEAD_SOURCE_IADDS_SECRET | Railway, secret | At least 32 cryptographically random bytes |
| LEAD_SOURCE_IADDS_LABEL | Railway | iADDS |
| NODE_ENV | Railway | production |
| PORT | Railway | 8080, generated domain targets this port |
| TELEGRAM_API_TIMEOUT_MS | Railway | 3000 default, bounded 100–8000 |
| IDEMPOTENCY_TTL_SECONDS | Railway | 86400 default, bounded 60–604800 |
| MAX_REQUESTS_PER_MINUTE | Railway | 30 per source by default |
| LOG_LEVEL | Railway | info; logger always emits allowlisted delivery metadata only |
| CONSULTATION_WEBHOOK_URL | Sites server environment | HTTPS gateway /v1/leads |
| CONSULTATION_WEBHOOK_SECRET | Sites server secret | Matches iADDS source secret |
| CONSULTATION_WEBHOOK_SOURCE | Sites server environment | iadds |

No token on the website. No `NEXT_PUBLIC_` secret variables. No live values in local files,
Git, CI, logs, traces, screenshots, reports or chat. Unit tests generate synthetic secrets and mock Telegram.

## One signing contract

`x-lead-source: iadds`, `x-lead-timestamp: <Unix seconds>`,
`x-idempotency-key: <UUID v4 referenceId>`, `x-lead-signature: <lowercase hex>`.

`HMAC-SHA256(sourceSecret, timestamp + "." + exactRawJsonBody)`.
The signing helper is shared by the website and gateway. The old Bearer contract is replaced,
not retained in parallel. Verify HMAC using constant-time comparison before JSON parsing.
Requests older or newer than 300 seconds are rejected. Sources are canonical lowercase slugs,
with hyphens mapped to underscores in environment variable names. Unknown sources are denied.
Payload fields cannot override the trusted source or configured label.

The gateway revalidates the actual ConsultationInput fields plus `referenceId`, `submittedAt`,
and existing optional `projectName`/`projectLabel`. It rejects unknown keys, non-JSON, >32 KiB,
invalid email/URL, credentials in URLs, invalid enums, non-relative source paths, missing consent,
and out-of-range lengths. Optional empty role/contact/model fields are accepted. iADDS services
are allowlisted; other sources can use `LEAD_SOURCE_<SUFFIX>_SERVICES` (comma-separated slugs).
No company URL is fetched. Link previews are disabled.

## Deduplication, retries and delivery semantics

One in-memory cache per replica, at most 10,000 entries with 24h TTL; source + referenceId key.
Concurrent identical requests join the same delivery promise. Delivered duplicates return the same
200 without resending; changed content returns 409. The digest ignores the regenerated submittedAt.
After TTL expiration a key can be processed again. Capacity exhaustion fails closed with 503;
unexpired delivered keys are not evicted to admit new requests. Rate limit is per source, default
30 new/retry deliveries per minute; duplicates already delivered do not consume a new delivery.
429 includes Retry-After. No caller IP is stored or logged.

This is bounded best-effort idempotency, not durable exactly-once delivery: restart/redeploy loses
the cache. Keep one replica. Overlapping rolling deployments or ambiguous Telegram/network timeouts
can rarely duplicate a lead. The same visible reference ID identifies duplicates. Adding shared
storage or more replicas requires a separate capacity decision; none is provisioned here.

Each Telegram part gets at most 3 attempts, only for network errors, 429 and 5xx. Backoff starts
at 150ms and doubles with <100ms jitter; retry_after is honored only inside the remaining budget.
Total request delivery budget is 10.5s, provider timeout 13s, existing browser timeout 15s.
400/401/403/404 do not retry. A message counts as delivered only with HTTP 200, ok=true,
positive message_id and matching chat ID. All parts must be confirmed before website success.
Confirmed parts are retained as a count so an explicit retry can resume after partial delivery.
Unknown outcomes may duplicate the unconfirmed part. No background queue creates false success.

## Telegram setup and confirmation

Use the owner's existing BotFather bot. Enter TELEGRAM_BOT_TOKEN directly in Railway Variables;
open its personal chat and send /start. Never paste the token into Codex or a command argument.
If the personal chat ID is already known and confirmed, set TELEGRAM_CHAT_ID there directly.

Otherwise run `npm run setup:telegram` from the gateway directory in a protected environment
that already has the token. This one-time script checks getMe and getWebhookInfo, then reads
updates without advancing the offset. It prints only candidate private chat IDs, chat type and
a short display name. It neither stores updates nor modifies/deletes an existing webhook.
If a webhook exists, obtain the ID from the existing integration instead. The owner must
confirm the intended personal chat before setting TELEGRAM_CHAT_ID. No public setup/debug route.

Run `node --experimental-strip-types scripts/test-send.ts` in a protected gateway environment
with `CONSULTATION_WEBHOOK_URL` and the source secret. It sends synthetic Test Lead / iADDS QA /
test@example.com data with objective “Backend delivery test — no response required”. Telegram
starts these messages with “🧪 TEST — iADDS lead delivery”. Normal submissions start with a source
label, reference, UTC timestamp, locale, communication language, page and contact fields; optional
empty fields are omitted. All values are HTML-escaped. Long objectives split safely into linked
messages, keeping contact details first. No IP, user agent, honeypot or anti-spam metadata is sent.

Then submit both live UK/EN forms, check preselection, existing localized success/error states,
and ask the owner to confirm the matching references arrived. Telegram API confirmation alone
does not satisfy the owner's acceptance gate. Do not begin the account cost audit before this.

## Errors, monitoring and incident handling

| HTTP | Meaning / action |
|---|---|
| 200 | All Telegram parts confirmed |
| 400 | Invalid payload/reference; check typed contract |
| 401 | Missing/wrong HMAC or unknown source; compare configured names privately |
| 408 | Timestamp outside five-minute window; check server clock |
| 409 | Same key, different payload; do not change a submitted payload under its old key |
| 413 / 415 | Body too large / wrong content type |
| 429 | Source rate limit; respect Retry-After |
| 502 | Telegram delivery not confirmed; form preserves input and permits retry |
| 503 | Missing/invalid downstream config or cache capacity; inspect protected Variables |
| 500 | Internal error; generic response only |

Railway logs allow only referenceId, trusted source, status, latency, category, retry count and
timestamp. Logger serialization drops all other fields. Fetch exceptions, request bodies,
signatures, secrets, chat IDs, Telegram payload/response and client PII are never logged. No
error tracker or request-body tracing is configured. Metrics: Railway service → Metrics for
CPU/memory/network; Deployments for restart/build status. Compare git commit metadata with
GitHub main. Health does not send a Telegram message and does not prove end-to-end delivery.

Rotate a compromised source by replacing its Railway secret, updating the corresponding Sites
server secret and redeploying the two existing services. Temporary mismatch fails closed.
Disable only that source by removing/blanking its secret through an owner-authorized configuration
change; no shared secret across sites. Rotate a bot token through BotFather and Railway only.
Never disable/delete existing integrations to discover a chat ID.

To onboard a second website: generate an independent 32-byte secret; add
LEAD_SOURCE_SECOND_SITE_SECRET, LEAD_SOURCE_SECOND_SITE_LABEL and optionally
LEAD_SOURCE_SECOND_SITE_SERVICES on Railway. Configure its server URL, secret and source
`second-site`; send the same typed contract and HMAC headers; redeploy and test the trusted label.
No gateway code copying or new bot is needed.

Redeploy using the existing Railway service after CI passes; preserve source/root/domain and one
replica. Redeploy the same existing public Sites project after updating its server variables.
For rollback, restore a known commit in both services and matching signing configuration;
the old unsigned provider must never be paired with the signed receiver.

## Verification and audit gate

`npm run build` at repository root includes repository/secret audit, lint, typecheck, gateway
build, unit/integration tests, content checks and production Worker build. `npm run test:e2e`
retains all existing UI tests. `npm test` within the gateway runs its isolated mock suite.
No UI snapshots should be updated for this backend task.

After owner-confirmed live delivery, inspect all Railway projects read-only: IDs, environments,
services, deployments, last traffic, 7/30-day costs, repos, domains/DNS, crons, databases, volumes,
buckets, private-network dependencies and variable references (names only). Missing traffic/cost
data is unknown, not zero. Produce KEEP / REVIEW / CANDIDATE FOR REMOVAL inventory. A candidate
requires all inactivity/dependency/data checks plus owner recognition. Stop for exact per-target
approval. Do not delete, stop, scale down, remove variables/domains or alter older Railway resources.
