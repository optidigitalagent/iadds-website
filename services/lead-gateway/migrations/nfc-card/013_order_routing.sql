-- Extend the two existing outboxes. No backfill, new sender service or source edits.
ALTER TABLE nfc_card.notification_outbox
 ADD COLUMN routing_route text,
 ADD COLUMN routing_chat_id bigint,
 ADD COLUMN routing_approval_reference text,
 ADD COLUMN routing_source_accepted_at timestamptz,
 ADD COLUMN routing_enabled_after timestamptz,
 ADD COLUMN telegram_message_id bigint,
 ADD COLUMN telegram_document_unique_id text,
 ADD COLUMN delivery_payload_sha256 char(64);
ALTER TABLE nfc_card.notification_outbox DROP CONSTRAINT notification_outbox_status_check;
ALTER TABLE nfc_card.notification_outbox ADD CONSTRAINT notification_outbox_status_check
 CHECK(status IN ('pending','sending','sent','retry','failed','waiting_routing','outcome_unknown'));
ALTER TABLE nfc_card.notification_outbox DROP CONSTRAINT notification_outbox_safe_error_category_check;
ALTER TABLE nfc_card.notification_outbox ADD CONSTRAINT notification_outbox_safe_error_category_check
 CHECK(safe_error_category IN ('rate_limit','upstream','configuration','outcome_unknown','exhausted',
 'SOURCE_NOT_SENDABLE','UNMAPPED_EXACT_ENTRY','NO_APPROVED_MIXED_SPLIT_RULE'));
ALTER TABLE nfc_card.notification_outbox ADD CONSTRAINT notification_outbox_order_route_check CHECK(
 routing_route IS NULL OR (
 routing_route IN ('ORIG','BRAND','MIXED','UNKNOWN') AND routing_approval_reference IS NOT NULL
 AND routing_source_accepted_at IS NOT NULL AND routing_enabled_after IS NOT NULL AND routing_source_accepted_at>=routing_enabled_after
 AND ((routing_route='ORIG' AND routing_chat_id=-5531022071)
   OR (routing_route='BRAND' AND routing_chat_id=-5441287655)
   OR (routing_route IN ('MIXED','UNKNOWN') AND routing_chat_id IS NULL AND NOT delivery_enabled))));

ALTER TABLE nfc_card.v2_notification_outbox
 ADD COLUMN routing_route text,
 ADD COLUMN routing_chat_id bigint,
 ADD COLUMN routing_approval_reference text,
 ADD COLUMN routing_source_accepted_at timestamptz,
 ADD COLUMN routing_enabled_after timestamptz,
 ADD COLUMN telegram_message_id bigint,
 ADD COLUMN telegram_document_unique_id text,
 ADD COLUMN delivery_payload_sha256 char(64),
 ADD COLUMN attempt_count integer NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 4),
 ADD COLUMN claimed_at timestamptz,
 ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN sent_at timestamptz,
 ADD COLUMN safe_error_category text,
 ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE nfc_card.v2_notification_outbox DROP CONSTRAINT v2_notification_outbox_delivery_enabled_check;
ALTER TABLE nfc_card.v2_notification_outbox DROP CONSTRAINT v2_notification_outbox_state_check;
ALTER TABLE nfc_card.v2_notification_outbox ADD CONSTRAINT v2_notification_outbox_state_check
 CHECK(state IN ('disabled','pending','sending','sent','retry','failed','waiting_routing','outcome_unknown'));
ALTER TABLE nfc_card.v2_notification_outbox ADD CONSTRAINT v2_notification_outbox_order_route_check CHECK(
 (routing_route IS NULL AND NOT delivery_enabled AND state='disabled') OR (
 routing_route IN ('ORIG','BRAND','MIXED','UNKNOWN') AND routing_approval_reference IS NOT NULL
 AND routing_source_accepted_at IS NOT NULL AND routing_enabled_after IS NOT NULL AND routing_source_accepted_at>=routing_enabled_after
 AND ((routing_route='ORIG' AND routing_chat_id=-5531022071)
   OR (routing_route='BRAND' AND routing_chat_id=-5441287655)
   OR (routing_route IN ('MIXED','UNKNOWN') AND routing_chat_id IS NULL AND NOT delivery_enabled))));
