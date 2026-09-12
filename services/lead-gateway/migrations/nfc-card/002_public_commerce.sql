-- Additive: preserve every existing lead and the immutable 001 checksum.
ALTER TABLE nfc_card.leads
  ADD COLUMN selection jsonb CHECK (selection IS NULL OR (jsonb_typeof(selection) = 'object' AND octet_length(selection::text) <= 200)),
  ADD COLUMN price_quote jsonb CHECK (price_quote IS NULL OR (jsonb_typeof(price_quote) = 'object' AND octet_length(price_quote::text) <= 400)),
  ADD COLUMN is_final_test boolean NOT NULL DEFAULT false CHECK (NOT is_final_test OR is_test);
