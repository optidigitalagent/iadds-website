-- Four public Mini offers share one physical product family; old solution rows stay intact.
ALTER TABLE nfc_card.leads
  ADD COLUMN mini_context jsonb,
  DROP CONSTRAINT leads_product_check,
  ADD CONSTRAINT leads_product_check CHECK (product IN
    ('review-card','branded-review-card','review-card-3d','nfc-instagram-card','nfc-menu-card','nfc-review-card-mini')),
  DROP CONSTRAINT leads_quantity_check,
  ADD CONSTRAINT leads_quantity_check CHECK (
    quantity BETWEEN 1 AND 10000 OR ((quantity = 0 AND (
      (product = 'nfc-menu-card' AND intent = 'menu_consultation') OR
      (product = 'branded-review-card' AND solution IS NOT NULL AND selection = '{"variant":"branded","quantity":"advice"}'::jsonb) OR
      (product = 'nfc-review-card-mini' AND mini_context->>'quantity_mode' IN ('advice','free_design_concepts'))
    )) IS TRUE)
  ),
  ADD CONSTRAINT leads_mini_context_check CHECK (
    (mini_context IS NULL AND product <> 'nfc-review-card-mini') OR ((
      product = 'nfc-review-card-mini' AND mini_context IS NOT NULL AND solution IS NULL
      AND octet_length(mini_context::text) <= 8192
      AND mini_context->>'schemaVersion' = '2'
      AND mini_context->>'product_family' = 'nfc-review-card-mini'
      AND (mini_context - 'quantity_mode' - 'design_split_note' - 'brand_inputs') IN (
        '{"schemaVersion":2,"product_family":"nfc-review-card-mini","solution_id":"beauty-review-card","niche":"beauty","design_mode":"ready"}'::jsonb,
        '{"schemaVersion":2,"product_family":"nfc-review-card-mini","solution_id":"branded-beauty-review-card","niche":"beauty","design_mode":"branded"}'::jsonb,
        '{"schemaVersion":2,"product_family":"nfc-review-card-mini","solution_id":"restaurant-review-card","niche":"restaurant","design_mode":"ready"}'::jsonb,
        '{"schemaVersion":2,"product_family":"nfc-review-card-mini","solution_id":"branded-restaurant-review-card","niche":"restaurant","design_mode":"branded"}'::jsonb)
      AND (NOT (mini_context ? 'design_split_note') OR
        (mini_context->>'design_mode' = 'branded' AND jsonb_typeof(mini_context->'design_split_note') = 'string'
          AND length(mini_context->>'design_split_note') BETWEEN 1 AND 300))
      AND (NOT (mini_context ? 'brand_inputs') OR
        (mini_context->>'design_mode' = 'branded' AND jsonb_typeof(mini_context->'brand_inputs') = 'object'
          AND octet_length((mini_context->'brand_inputs')::text) <= 5000))
      AND selection = jsonb_build_object('variant', CASE WHEN mini_context->>'design_mode' = 'ready' THEN 'standard' ELSE 'branded' END,
        'quantity', CASE WHEN mini_context->>'quantity_mode' = 'advice' THEN 'advice'
          WHEN mini_context->>'quantity_mode' = 'free_design_concepts' THEN 'concepts'
          WHEN quantity IN (1,2,4,10) THEN quantity::text ELSE 'other' END)
      AND price_quote->>'contractId' = 'NFC-CARD-BEAUTY-RESTAURANT-MINI-PRICE-v31'
      AND price_quote->>'currency' = CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END
      AND price_quote @> '{"depositDueNow":false}'::jsonb
      AND (
        (mini_context->>'quantity_mode' = 'fixed_bundle' AND language <> 'pl' AND quantity IN (1,2,4,10)
          AND price_quote->>'status' = 'fixed' AND jsonb_typeof(price_quote->'amount') = 'number'
          AND jsonb_typeof(price_quote->'unitPrice') = 'number' AND jsonb_typeof(price_quote->'deposit') = 'number'
          AND price_quote @> '{"depositIncluded":true}'::jsonb)
        OR (mini_context->>'quantity_mode' = 'custom_quote' AND quantity BETWEEN 1 AND 10000
          AND (language = 'pl' OR quantity NOT IN (1,2,4,10))
          AND price_quote @> '{"status":"custom","amount":null,"unitPrice":null,"deposit":null,"depositIncluded":false}'::jsonb)
        OR (mini_context->>'quantity_mode' IN ('advice','free_design_concepts') AND quantity = 0
          AND (mini_context->>'quantity_mode' <> 'free_design_concepts' OR mini_context->>'design_mode' = 'branded')
          AND price_quote @> '{"status":"consultation","amount":null,"unitPrice":null,"deposit":null,"depositIncluded":false}'::jsonb)
      )
    ) IS TRUE)
  );
