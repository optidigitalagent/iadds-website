-- Additive Review Card 3D support. Preserve 001-004 checksums and existing rows.
ALTER TABLE nfc_card.leads
  DROP CONSTRAINT leads_product_check,
  ADD CONSTRAINT leads_product_check CHECK (product IN ('review-card','branded-review-card','review-card-3d','nfc-instagram-card','nfc-menu-card')),
  DROP CONSTRAINT leads_product_details_check,
  ADD COLUMN design text,
  ADD COLUMN google_location_url varchar(1000),
  ADD CONSTRAINT leads_product_details_check CHECK (
    CASE WHEN product = 'nfc-instagram-card' THEN (
      product_schema_version = 1 AND product_id = 'nfc-instagram-card' AND sku = 'NFC-IG-READY' AND offer = 'ready'
      AND consent = true AND quantity IN (1,2)
      AND instagram_url ~ '^https://www[.]instagram[.]com/[a-z0-9_]+([.][a-z0-9_]+)*/$'
      AND length(split_part(instagram_url, '/', 4)) BETWEEN 1 AND 30
      AND split_part(instagram_url, '/', 4) NOT IN ('p','reel','reels','stories','explore','accounts','direct','about','legal','developer','developers','web','api','challenge','oauth','tv')
      AND selection = jsonb_build_object('variant', 'instagram', 'quantity', quantity::text)
      AND intent IS NULL AND menu_status IS NULL AND menu_url IS NULL AND items IS NULL
      AND design IS NULL AND google_location_url IS NULL
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
      AND design IS NULL AND google_location_url IS NULL
    ) IS TRUE
    WHEN product = 'review-card-3d' THEN (
      product_schema_version = 1 AND product_id = 'nfc-review-card-3d' AND design = 'fixed_shown_design'
      AND sku IS NULL AND offer IS NULL AND instagram_url IS NULL AND selection IS NULL
      AND intent IS NULL AND menu_status IS NULL AND menu_url IS NULL AND items IS NULL
      AND consent = true AND quantity BETWEEN 1 AND 10000
      AND (comment IS NULL OR length(comment) <= 1000)
      AND (google_location_url IS NULL OR google_location_url ~ '^https://')
      AND price_quote @> jsonb_build_object('currency','UAH','status','fixed','quantity',quantity,
        'unitPrice',4000,'amount',quantity * 4000,'deposit',200,'balance',quantity * 4000 - 200,'depositIncluded',true)
    ) IS TRUE
    ELSE (
      product_schema_version IS NULL AND product_id IS NULL AND sku IS NULL AND offer IS NULL
      AND instagram_url IS NULL AND comment IS NULL AND consent IS NULL
      AND intent IS NULL AND menu_status IS NULL AND menu_url IS NULL AND items IS NULL
      AND design IS NULL AND google_location_url IS NULL
    )
    END
  );
