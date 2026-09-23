# NFC CARD lead gateway release workflow

For each completed owner-requested NFC CARD gateway fix set, run the relevant
full tests, isolated database and fake-delivery checks, and independent
acceptance. Commit only task-owned changes, fast-forward push to the existing
`optidigitalagent/iadds-website` `main`, wait for deployment of that exact SHA
in the existing `antonov-lead-gateway` Railway project and `lead-gateway`
service, then verify deployment success, migration and `/healthz`. Deploy this
gateway only when the completed fix changes its code, contract or migration.
Release gateway compatibility before a dependent NFC CARD Pages change.

One fix set is a coherent tested task, not every intermediate save. Do not
leave a completed accepted gateway fix only in a local checkout. Skip release
when the owner explicitly says `local only`, `do not deploy`, `не публиковать`
or equivalent for that task, or when a concrete safety gate blocks it; report
the exact blocker. Never force-push, create new infrastructure, change billing,
domain or secrets, run destructive migrations, submit production test leads,
send real Telegram/email messages during QA, or edit `nfc_outbound` under an
ordinary gateway release authorization.
