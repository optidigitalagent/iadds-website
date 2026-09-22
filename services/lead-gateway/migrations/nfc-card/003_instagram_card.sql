-- Additive upgrade: preserve 001/002 checksums and existing Review leads/outbox.
ALTER TABLE nfc_card.leads
  DROP CONSTRAINT leads_product_check,
  ADD CONSTRAINT leads_product_check CHECK (product IN ('review-card','branded-review-card','nfc-instagram-card')),
  ADD COLUMN product_schema_version integer,
  ADD COLUMN product_id text,
  ADD COLUMN sku text,
  ADD COLUMN offer text,
  ADD COLUMN instagram_url varchar(250),
  ADD COLUMN comment varchar(2000),
  ADD COLUMN consent boolean,
  ADD CONSTRAINT leads_instagram_details_check CHECK (
    CASE WHEN product = 'nfc-instagram-card' THEN (
      product_schema_version = 1 AND product_id = 'nfc-instagram-card' AND sku = 'NFC-IG-READY' AND offer = 'ready'
      AND consent = true AND quantity IN (1,2)
      AND instagram_url ~ '^https://www[.]instagram[.]com/[a-z0-9_]+([.][a-z0-9_]+)*/$'
      AND length(split_part(instagram_url, '/', 4)) BETWEEN 1 AND 30
      AND split_part(instagram_url, '/', 4) NOT IN ('p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv')
      AND selection = jsonb_build_object('variant', 'instagram', 'quantity', quantity::text)
    ) IS TRUE ELSE
      product_schema_version IS NULL AND product_id IS NULL AND sku IS NULL AND offer IS NULL
      AND instagram_url IS NULL AND comment IS NULL AND consent IS NULL
    END
  );
