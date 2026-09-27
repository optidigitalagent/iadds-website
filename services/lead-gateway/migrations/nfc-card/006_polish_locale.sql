-- Additive Polish locale support. Preserve existing leads, outbox and 001-005 checksums.
ALTER TABLE nfc_card.leads
  DROP CONSTRAINT leads_language_check,
  ADD CONSTRAINT leads_language_check CHECK (language IN ('uk','en','pl'));
