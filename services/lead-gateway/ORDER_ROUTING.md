# New NFC CARD website enquiries via existing Telegram order groups

Owner authority: `policies/ORDER_ROUTING_OWNER_APPROVAL.json`, 2026-11-05.
This narrow exception preserves B05/V37 history, direct-CRM-write prohibition,
all prices, personal iADDS notifications, and existing data/rights restrictions.
An enquiry is a LEAD, never payment or an agreed sale.

Exact `review-card`, `beauty-review-card`, `restaurant-review-card`, and
`nfc-instagram-card` entries route to ORIG `-5531022071`. Exact
`branded-review-card`, `branded-beauty-review-card`,
`branded-restaurant-review-card`, `nfc-menu-card` (all six variants), and
`review-card-3d` route to BRAND `-5441287655`. Unknown or cross-route mixed carts
stay durably `waiting_routing`; no automatic split is approved.

Both existing source transactions/outboxes are retained. Additive migration013
adds route/attempt/Telegram receipt metadata, without historical enqueue/backfill.
One existing dispatcher/timer owns old personal delivery and the approved route.
Routing is opt-in with `NFC_ORDER_ROUTING_ENABLED=true`, an explicit millisecond
UTC `NFC_ORDER_ROUTING_CUTOVER`, and current V38 policy approval. It never enables
the old `NFC_TELEGRAM_ENABLED` flag or changes the personal `TELEGRAM_CHAT_ID`.
Prior source-key replay returns the stored receipt before any route write.

The actual sender is bot8722696590. It must be an ordinary member of both
verified groups with text/document rights. TRACKER bot8712382944 needs official
Bot-to-Bot Communication Mode; privacy OFF is not proof of that mode.
One complete JSON source/quote document and a bounded LEAD caption carry the
application ID, exact entry IDs and actual quantities. No photos are invented:
current form contracts provide links/design notes, not binary image uploads.
The receiver stores the original document and caption without AI/accounting.

One Telegram HTTP attempt per outbox attempt. Explicit429/negative5xx responses
allow at most four total attempts with a persisted delay. Timeout, invalid
receipt or expired sending claim becomes `outcome_unknown`, never blind retry.
`npm run preflight:orders` exposes only route counts and source IDs for uncertain
cases. Correlate those IDs with receiver raw/originals and Telegram receipt
metadata before any manual reconciliation; do not ask the owner for each order
link, resend an uncertain record, or infer delivery from group membership.

Release compatible code with routing OFF first. Verify backup decryption and an
actual isolated restore. Apply013 only through `migrate:orders` with exact SHA,
database, deployed commit and the reviewed backup/owner proof. Existing automatic
001–011 startup/predeploy migrations remain unchanged. Then set V38 and previous
V37 policy/approval paths and the new-only boundary; verify that exact deployment
before publishing dependent Pages. Normal receipt status is queued, not delivered.

Rollback: disable only `NFC_ORDER_ROUTING_ENABLED`, retain all originals, attempts,
receipts and additive columns. Restore prior policy paths if returning to an old
image. Keep `NFC_TELEGRAM_ENABLED=false`, personal target, CRM consumer/offset,
financial OFF, HOLD and backups intact. No destructive down migration or old
database restore is part of rollback. Production QA applications/messages are
prohibited. Live PASS requires a real new source event for every used route.
