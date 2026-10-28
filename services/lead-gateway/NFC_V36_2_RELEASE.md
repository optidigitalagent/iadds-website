# NFC CARD v36.2 gateway release operations

This is the additive gateway integration of the reviewed CF-01 cart contract. Existing v1, V36 email proposals, iADDS transport, historical receipts and senders keep their established contracts. The new v2 notification outbox is never delivered by a new sender. All commands below run from `services/lead-gateway` with Node24. Do not put a database URL or signing key into source, shell history, reports or the browser.

## Runtime configuration and readiness

`NFC_V2_MODE` defaults to `disabled`. Production intake requires `approved-intake`, the existing private `NFC_DATABASE_URL`, exact `NFC_V2_ORIGIN=https://optidigitalagent.github.io`, independent private signing keys `NFC_V2_SECRET` and `NFC_V2_INBOUND_READ_SECRET` (at least32characters each), and an absolute `NFC_V2_POLICY_FILE` pointing to the approved public artifact in this service's `policies/nfc-card-v37-approved.json`. Its companion `B05_OWNER_APPROVAL.json` is checked by raw-byte SHA-256; alternatively set the absolute `NFC_V2_APPROVAL_FILE`. Both must be regular files and cannot be symlinks. The two v2 keys must differ from each other and existing v1/iADDS/browser-reader keys. `RAILWAY_GIT_COMMIT_SHA` supplies a nonsecret40hex readiness identifier.

Approved policy body SHA-256 is `d76bda8aff9b69e79731a2a536254e8c6e6b9d8b62faa986407f06e3e05806b4`. Public DP03 text SHA-256 is `9a247e3320c0b1594374efd103b2e139d344b6b4eff26318c18f0dbe6ca2cb8f`. These artifacts record the owner's specific D1–D3 decision. File hashes bind reviewed deployment artifacts; they are not a replacement for that recorded human decision.

Safe `GET /v2/public/requests/nfc-card/status` returns503 unless approved configuration and the exact012 schema are ready. A200 body has only `ok`, `service`, `apiVersion`, `mode`, `contractId`, `policySha256`, `formVersion`, `privacyNoticeVersion`, `pricingRevision` and `gatewayCommit`. Form/notice are V37 for v2. Contract ID remains `NFC-CARD-V35-P4-02-CF-01`; pricing revisions are `NFC-V35-V2-OWNER-20261027-UA` and `NFC-V35-V2-CANDIDATE-01-PL`. No form submission is needed to check deployment readiness. The existing health response is unchanged. POST to status is405; a query string is rejected.

V2 browser challenges retain the reviewed minimum2seconds/maximum30minutes window. A clock jump outside that window rejects the challenge before a write; the UI must obtain a new challenge rather than bypass validation. Debug quote/fault transport is unavailable in approved intake.

## Current V36 disclosure and historical compatibility

The wire field for the newly displayed approved disclosure is `currentPolicySha256`. Its exact approved hash plus `privacyNoticeVersion=NFC-CARD-PRIVACY-V37` is accepted only with the configured approved policy, original `branded-review-card` product and locale-compatible original `/solutions/branded-review-card` source. Existing V36 explicit email proposals retain `formVersion=NFC-CARD-FORM-V36`; the original messenger fallback retains `NFC-CARD-FORM-V34`. It must not acquire invented email-proposal authority. The resulting private processing evidence records the exact policy binding and actual original form version.

Historical V36/V35 requests without the new field retain byte-identical normalization/digest behavior, receipt replay and email-processing evidence. Only the new named global identity-conflict/tombstone database constraints are mapped to409/410; unrelated v1 errors keep their established behavior.

## Explicit additive migration012

Existing `migrate:nfc`, predeployment and server startup still apply only001–011. Merely deploying these sources cannot apply012. No runtime request applies DDL. Migration012 has immutable SHA-256 `03665a013882e511c2456583f0cebb19dcd94c4246fd24430bcf4dbf864cadb6`.

First run `npm run preflight:nfc:v2` with the existing private `NFC_DATABASE_URL`. This uses SELECT only and requires PG17, complete matching001–011 checksums, no unknown schema versions and no legacy lead without its original outbox. It reports `writes:0` and whether012 is already ready.

An operator may run `npm run migrate:nfc:v2` only after the production backup/isolated QA gates and a reviewed private rollout receipt exist. Required environment variables are:

- `NFC_DATABASE_URL`: the existing private database connection.
- `RAILWAY_GIT_COMMIT_SHA`: the exact reviewed deployed gateway40hex commit.
- `NFC_V2_APPLY_MIGRATION=012_v35_enquiries`.
- `NFC_V2_ROLLOUT_APPROVAL_FILE`: an absolute regular, nonsymlink JSON path, at most32768bytes.

Required receipt shape (replace every explanatory value with verified evidence):

```json
{
  "operation": "012_v35_enquiries",
  "database": "exact-current-database-name",
  "migrationSha256": "03665a013882e511c2456583f0cebb19dcd94c4246fd24430bcf4dbf864cadb6",
  "operatorApproved": true,
  "approvalReference": "specific-reviewed-release-reference",
  "gatewayCommit": "exact-reviewed-40-lowercase-hex-commit",
  "backup": {
    "encrypted": true,
    "restoreVerified": true,
    "artifactSha256": "actual-encrypted-backup-64-lowercase-hex-sha256",
    "createdAt": "actual-backup-UTC-ISO-timestamp"
  }
}
```

The backup must be at most24hours old and no more than5minutes in the future. This is an operational backup-freshness gate, not a customer data-retention period. The database and commit must exactly match the active connection/environment. A valid schema application takes a transaction advisory lock,5second lock timeout and60second statement timeout. The same immutable migration can be replayed as a no-op. It does not reprice receipts. Failure exits1 with no automatic retry. A synthetically generated receipt is not evidence of an actual production backup.

Deploy compatible code with v2 disabled; apply reviewed012 explicitly; configure approved policy and private reader; verify private OwnerDesk readiness before intake/Pages activation. The public status must match the exact gateway commit and policy pinned by the frontend release. Do not send a production test lead.

## Signed private OwnerDesk feed

`GET /v2/internal/nfc-card/requests?afterSeq=0&generation=nfc-v35-preview-1` requires no browser Origin and a dedicated reader secret. Header `x-nfc-timestamp` is13digit Unix milliseconds. Header `x-nfc-hmac` is HMAC-SHA256 over `timestamp + '.' + exactPathAndQuery`. The five-minute timestamp skew bound is checked. Preserve the exact query order when signing. The frozen generation string is intentionally unchanged.

The CF-01 feed item remains `{schemaVersion:2,entityKind:'cart_request',sourceIdentity,publication,receipt}`. The outer object is `{schemaVersion:2,generation,items,next:{generation,afterSeq}}`. A completely scrubbed, internally consistent tombstone is omitted and the cursor advances, including on an empty page. A partial/corrupt tombstone fails503. Receivers must durably accept the trusted advancing cursor and must not infer erasure from a missing item. Explicit paired restriction/erasure is a separate manual case operation.

## Manual rights cases; no public erasure API

`planV2Rights(pool, requestId)` is read-only. It returns a bounded copy inventory and a plan fingerprint without the request body. It requires identity, purpose/order-retention and outside-store review. It does not choose a legal deadline.

`applyV2RightsCase(pool, caseJSON, rawOwnerApprovalRecordBytes)` is private, manually invoked code. No HTTP route, scheduler or startup invokes it. The general D3 approval does not authorize an individual customer erasure. A specific identity-verified case needs all14 exact keys:

```text
schemaVersion = 1
operation = ERASE_REQUEST_PERSONAL_DATA
caseId = UUIDv4
requestId = UUIDv4
planSha256 = gateway read-only plan SHA-256
ownerApproved = true
ownerActor = Artem Antonov
approvalReference = CASE:<caseId>:REQUEST:<requestId>:<specific-evidence>
ownerApprovalEvidenceSha256 = SHA-256 of exact separate approval-record bytes
identityVerified = true
purposeAndOrderRetentionReviewed = true
approvedAt = exact millisecond UTC ISO timestamp
pairedOwnerDeskRestrictionReference = <caseId>:PLAN:<OwnerDesk-plan-SHA256>:<specific-evidence>
backupRestoreRestrictionReference = <caseId>:<specific-restore-restriction-evidence>
```

The separate UTF-8 approval record must repeat all13 case fields other than its own self-referential evidence hash. Protected extra metadata is allowed. Duplicate JSON keys are rejected. The gateway locks the request, identity and outbox; a stale fingerprint, different target/case or inconsistent state cannot apply. Exact replay of the applied case is a safe no-op. Case digest is SHA-256 of the flat case JSON with keys sorted lexically, UTF-8, no whitespace (Python: `json.dumps(case,sort_keys=True,separators=(',',':'),ensure_ascii=False)`).

The operation scrubs normalized request, receipt and outbox bodies, retains the noncreating410 identity and a minimal pseudonymous case audit. IDs/digests/case references remain pseudonymous records: this is not a claim of complete anonymization. The paired OwnerDesk helper must use its own reviewed local plan and the same case/proof; logs and backups require the recorded separate restrictions. Neither feed gaps nor backup restoration may recreate a restricted request. Use synthetic data for rehearsal. A real operation needs a separately reviewed case; do not execute one as release QA.

## Rollback

Disable new intake and roll back application/configuration/Pages first. Retain accepted v2 records, historical receipts and identity keys. Do not drop012, reprice data or automatically restore a backup. A real backup restore needs a separate assessed recovery plan accounting for requests since the backup and reapplying rights restrictions before exposure. Do not enable senders or a separate CRM bridge as part of rollback.
