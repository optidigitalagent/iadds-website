-- Owner-approved one-batch context; no backfill, changes to ordinary receipts or new tables.
ALTER TABLE nfc_card.v2_requests ADD COLUMN control_context jsonb;
ALTER TABLE nfc_card.v2_requests ADD CONSTRAINT v2_control_context_shape CHECK(
 control_context IS NULL OR (jsonb_typeof(control_context)='object' AND control_context->>'version'='1'
 AND control_context->>'runId'='NFC-E2E-20261106T113357Z-69d56f61'
 AND control_context->>'origin'='WEB' AND control_context->>'blockEffects'='true'
 AND control_context->>'state' IN ('VALID','QUARANTINED')));
CREATE UNIQUE INDEX v2_control_context_case ON nfc_card.v2_requests
 ((control_context->>'runId'),(control_context->>'caseId'))
 WHERE control_context->>'trusted'='true';
