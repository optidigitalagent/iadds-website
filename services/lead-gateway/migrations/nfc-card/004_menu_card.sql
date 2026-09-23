-- Additive Menu product support. Preserve 001-003 checksums and all existing rows.
ALTER TABLE nfc_card.leads
  DROP CONSTRAINT leads_product_check,
  ADD CONSTRAINT leads_product_check CHECK (product IN ('review-card','branded-review-card','nfc-instagram-card','nfc-menu-card')),
  DROP CONSTRAINT leads_quantity_check,
  ADD CONSTRAINT leads_quantity_check CHECK (quantity BETWEEN 1 AND 10000 OR (product = 'nfc-menu-card' AND quantity = 0)),
  DROP CONSTRAINT leads_instagram_details_check,
  ADD COLUMN intent text,
  ADD COLUMN menu_status text,
  ADD COLUMN menu_url varchar(2048),
  ADD COLUMN items jsonb,
  ADD CONSTRAINT leads_product_details_check CHECK (
    CASE WHEN product = 'nfc-instagram-card' THEN (
      product_schema_version = 1 AND product_id = 'nfc-instagram-card' AND sku = 'NFC-IG-READY' AND offer = 'ready'
      AND consent = true AND quantity IN (1,2)
      AND instagram_url ~ '^https://www[.]instagram[.]com/[a-z0-9_]+([.][a-z0-9_]+)*/$'
      AND length(split_part(instagram_url, '/', 4)) BETWEEN 1 AND 30
      AND split_part(instagram_url, '/', 4) NOT IN ('p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv')
      AND selection = jsonb_build_object('variant', 'instagram', 'quantity', quantity::text)
      AND intent IS NULL AND menu_status IS NULL AND menu_url IS NULL AND items IS NULL
    ) IS TRUE
    WHEN product = 'nfc-menu-card' THEN (
      product_schema_version = 1 AND product_id = 'nfc-menu-card' AND sku IS NULL AND offer IS NULL AND instagram_url IS NULL
      AND selection IS NULL AND consent = true AND intent IN ('card_order','menu_consultation')
      AND menu_status IN ('existing','needs_development')
      AND (menu_status <> 'existing' OR (menu_url IS NOT NULL AND menu_url ~ '^https?://'))
      AND (menu_status <> 'needs_development' OR menu_url IS NULL)
      AND items IS NOT NULL AND jsonb_typeof(items) = 'array' AND octet_length(items::text) <= 4000
      AND price_quote IS NOT NULL
      AND ((intent = 'card_order' AND quantity BETWEEN 1 AND 10000 AND jsonb_array_length(items) > 0)
        OR (intent = 'menu_consultation' AND menu_status = 'needs_development' AND quantity = 0 AND items = '[]'::jsonb))
    ) IS TRUE
    ELSE (
      product_schema_version IS NULL AND product_id IS NULL AND sku IS NULL AND offer IS NULL
      AND instagram_url IS NULL AND comment IS NULL AND consent IS NULL
      AND intent IS NULL AND menu_status IS NULL AND menu_url IS NULL AND items IS NULL
    )
    END
  );
