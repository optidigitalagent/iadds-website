-- Additive CF-01 namespace, isolated from legacy data shape. Apply transactionally
-- after v1 001..011, only with a backup/fence/drain plan. Never auto-run at startup.
-- SHARE ROW EXCLUSIVE waits for prior legacy writers and fences new ones during backfill.
LOCK TABLE nfc_card.leads, nfc_card.notification_outbox IN SHARE ROW EXCLUSIVE MODE;
CREATE TABLE nfc_card.v2_requests (
 request_id uuid PRIMARY KEY, idempotency_key uuid UNIQUE NOT NULL,
 request_digest char(64) NOT NULL CHECK(request_digest ~ '^[0-9a-f]{64}$'),
 normalization_profile text NOT NULL, identity_registry_revision text NOT NULL,
 normalized jsonb, receipt jsonb, state text NOT NULL DEFAULT 'accepted' CHECK(state IN ('accepted','tombstone')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK ((state='accepted' AND normalized IS NOT NULL AND receipt IS NOT NULL) OR
        (state='tombstone' AND normalized IS NULL AND receipt IS NULL))
);
CREATE TABLE nfc_card.v2_identity_keys (
 idempotency_key uuid PRIMARY KEY, entity_kind text NOT NULL CHECK(entity_kind IN ('legacy_lead','cart_request')),
 digest_profile text NOT NULL, request_digest char(64) NOT NULL CHECK(request_digest ~ '^[0-9a-f]{64}$'),
 legacy_lead_id uuid UNIQUE REFERENCES nfc_card.leads(lead_id) DEFERRABLE INITIALLY DEFERRED,
 cart_request_id uuid UNIQUE REFERENCES nfc_card.v2_requests(request_id) DEFERRABLE INITIALLY DEFERRED,
 tombstoned boolean NOT NULL DEFAULT false,
 CONSTRAINT v2_identity_exactly_one_target CHECK(
  (entity_kind='legacy_lead' AND legacy_lead_id IS NOT NULL AND cart_request_id IS NULL) OR
  (entity_kind='cart_request' AND cart_request_id IS NOT NULL AND legacy_lead_id IS NULL))
);
CREATE TABLE nfc_card.v2_notification_outbox (
 request_id uuid PRIMARY KEY REFERENCES nfc_card.v2_requests(request_id),
 payload jsonb NOT NULL, delivery_enabled boolean NOT NULL DEFAULT false CHECK(delivery_enabled=false),
 state text NOT NULL DEFAULT 'disabled' CHECK(state='disabled')
);
CREATE TABLE nfc_card.v2_publication_counter (
 singleton boolean PRIMARY KEY DEFAULT true CHECK(singleton), last_seq bigint NOT NULL DEFAULT 0 CHECK(last_seq>=0)
);
INSERT INTO nfc_card.v2_publication_counter(singleton,last_seq) VALUES(true,0);
CREATE TABLE nfc_card.v2_publications (
 seq bigint PRIMARY KEY CHECK(seq>0), generation text NOT NULL DEFAULT 'nfc-v35-preview-1',
 entity_kind text NOT NULL CHECK(entity_kind IN ('legacy_lead','cart_request')),
 legacy_lead_id uuid UNIQUE REFERENCES nfc_card.leads(lead_id),
 cart_request_id uuid UNIQUE REFERENCES nfc_card.v2_requests(request_id),
 CHECK((entity_kind='legacy_lead' AND legacy_lead_id IS NOT NULL AND cart_request_id IS NULL) OR (entity_kind='cart_request' AND cart_request_id IS NOT NULL AND legacy_lead_id IS NULL))
);
-- BEFORE INSERT also executes on legacy ON CONFLICT replay. It fences shared
-- identity and honors a future approved tombstone without changing v1 digest/receipt.
CREATE FUNCTION nfc_card.v35_guard_legacy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE existing_key record;
BEGIN
 SELECT entity_kind,tombstoned INTO existing_key FROM nfc_card.v2_identity_keys WHERE idempotency_key=NEW.idempotency_key FOR UPDATE;
 IF FOUND THEN
  IF existing_key.tombstoned THEN
   RAISE EXCEPTION USING ERRCODE='23514', CONSTRAINT='v2_identity_tombstone', MESSAGE='idempotency_tombstoned';
  END IF;
  IF existing_key.entity_kind<>'legacy_lead' THEN
   RAISE EXCEPTION USING ERRCODE='23505', CONSTRAINT='v2_identity_global_key', MESSAGE='idempotency_conflict';
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER v35_guard_legacy BEFORE INSERT ON nfc_card.leads FOR EACH ROW EXECUTE FUNCTION nfc_card.v35_guard_legacy();
CREATE FUNCTION nfc_card.v35_claim_legacy() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 INSERT INTO nfc_card.v2_identity_keys(idempotency_key,entity_kind,digest_profile,request_digest,legacy_lead_id)
 VALUES(NEW.idempotency_key,'legacy_lead','NFC-V1-JSON-1',NEW.request_digest,NEW.lead_id)
 ON CONFLICT(idempotency_key) DO NOTHING;
 IF NOT EXISTS(SELECT 1 FROM nfc_card.v2_identity_keys WHERE idempotency_key=NEW.idempotency_key
    AND entity_kind='legacy_lead' AND legacy_lead_id=NEW.lead_id AND request_digest=NEW.request_digest) THEN
  RAISE EXCEPTION USING ERRCODE='23505', CONSTRAINT='v2_identity_global_key', MESSAGE='idempotency_conflict';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER v35_claim_legacy AFTER INSERT ON nfc_card.leads FOR EACH ROW EXECUTE FUNCTION nfc_card.v35_claim_legacy();
CREATE FUNCTION nfc_card.v35_publish_legacy() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE publication_seq bigint;
BEGIN
 -- This is the legacy transaction's last write, after the outbox. Lock lasts to COMMIT.
 UPDATE nfc_card.v2_publication_counter SET last_seq=last_seq+1 WHERE singleton RETURNING last_seq INTO publication_seq;
 INSERT INTO nfc_card.v2_publications(seq,entity_kind,legacy_lead_id) VALUES(publication_seq,'legacy_lead',NEW.lead_id);
 RETURN NEW;
END $$;
CREATE TRIGGER v35_publish_legacy AFTER INSERT ON nfc_card.notification_outbox FOR EACH ROW EXECUTE FUNCTION nfc_card.v35_publish_legacy();
CREATE FUNCTION nfc_card.v35_check_cart_identity() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NOT EXISTS(SELECT 1 FROM nfc_card.v2_identity_keys WHERE idempotency_key=NEW.idempotency_key
   AND cart_request_id=NEW.request_id AND entity_kind='cart_request' AND request_digest=NEW.request_digest) THEN
  RAISE EXCEPTION 'missing_cart_identity' USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $$;
CREATE CONSTRAINT TRIGGER v35_cart_identity_complete AFTER INSERT ON nfc_card.v2_requests
 DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION nfc_card.v35_check_cart_identity();
-- Snapshot under the same writer fence. Historical missing quotes remain NULL; no reprice or new outbox.
INSERT INTO nfc_card.v2_identity_keys(idempotency_key,entity_kind,digest_profile,request_digest,legacy_lead_id)
 SELECT idempotency_key,'legacy_lead','NFC-V1-JSON-1',request_digest,lead_id FROM nfc_card.leads;
DO $$
DECLARE legacy record; publication_seq bigint;
BEGIN
 FOR legacy IN SELECT l.lead_id FROM nfc_card.leads l JOIN nfc_card.notification_outbox o USING(lead_id)
               ORDER BY l.created_at,l.lead_id LOOP
  UPDATE nfc_card.v2_publication_counter SET last_seq=last_seq+1 WHERE singleton RETURNING last_seq INTO publication_seq;
  INSERT INTO nfc_card.v2_publications(seq,entity_kind,legacy_lead_id) VALUES(publication_seq,'legacy_lead',legacy.lead_id);
 END LOOP;
 IF EXISTS((SELECT lead_id FROM nfc_card.leads EXCEPT SELECT legacy_lead_id FROM nfc_card.v2_identity_keys WHERE entity_kind='legacy_lead')
       UNION ALL(SELECT legacy_lead_id FROM nfc_card.v2_identity_keys WHERE entity_kind='legacy_lead' EXCEPT SELECT lead_id FROM nfc_card.leads))
 OR EXISTS((SELECT lead_id FROM nfc_card.leads EXCEPT SELECT legacy_lead_id FROM nfc_card.v2_publications WHERE entity_kind='legacy_lead')
       UNION ALL(SELECT legacy_lead_id FROM nfc_card.v2_publications WHERE entity_kind='legacy_lead' EXCEPT SELECT lead_id FROM nfc_card.leads)) THEN
  RAISE EXCEPTION 'legacy_identity_set_reconciliation_failed';
 END IF;
END $$;
