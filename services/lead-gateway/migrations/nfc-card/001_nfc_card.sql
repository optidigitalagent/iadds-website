CREATE SCHEMA IF NOT EXISTS nfc_card;
CREATE TABLE nfc_card.leads (
  id uuid PRIMARY KEY,
  lead_id uuid NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'NFC_CARD' CHECK (source = 'NFC_CARD'),
  language text NOT NULL CHECK (language IN ('uk','en')),
  product text NOT NULL CHECK (product IN ('review-card','branded-review-card')),
  quantity integer NOT NULL CHECK (quantity BETWEEN 1 AND 10000),
  customer_name varchar(100) NOT NULL CHECK (length(customer_name) > 0),
  phone varchar(16), email varchar(254), telegram varchar(33),
  preferred_contact text NOT NULL CHECK (preferred_contact IN ('phone','sms','email','telegram','whatsapp','viber')),
  source_page varchar(300) NOT NULL CHECK (source_page LIKE '/nfc-card-website/%'),
  utm jsonb NOT NULL DEFAULT '{}' CHECK (jsonb_typeof(utm) = 'object' AND octet_length(utm::text) <= 2000),
  idempotency_key uuid NOT NULL UNIQUE,
  request_digest char(64) NOT NULL,
  is_test boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (phone IS NOT NULL OR email IS NOT NULL OR telegram IS NOT NULL),
  CHECK (preferred_contact <> 'email' OR email IS NOT NULL),
  CHECK (preferred_contact NOT IN ('phone','sms','whatsapp','viber') OR phone IS NOT NULL)
);
CREATE TABLE nfc_card.notification_outbox (
  id uuid PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES nfc_card.leads(lead_id),
  source text NOT NULL DEFAULT 'NFC_CARD' CHECK (source = 'NFC_CARD'),
  transport text NOT NULL DEFAULT 'telegram' CHECK (transport = 'telegram'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','retry','sent','failed')),
  delivery_enabled boolean NOT NULL DEFAULT false,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 6),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_at timestamptz, sent_at timestamptz,
  safe_error_category text CHECK (safe_error_category IN ('rate_limit','upstream','configuration','outcome_unknown','exhausted')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, transport),
  CHECK ((status = 'sent') = (sent_at IS NOT NULL))
);
CREATE INDEX nfc_card_outbox_due ON nfc_card.notification_outbox(next_attempt_at, id) WHERE status IN ('pending','retry') AND delivery_enabled;
CREATE INDEX nfc_card_outbox_claimed ON nfc_card.notification_outbox(claimed_at) WHERE status = 'sending';
CREATE INDEX nfc_card_leads_created ON nfc_card.leads(created_at);
