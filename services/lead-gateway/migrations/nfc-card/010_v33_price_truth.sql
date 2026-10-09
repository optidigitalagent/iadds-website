-- Replace the Mini quote check for v33 without rewriting historical v31 leads.
ALTER TABLE nfc_card.leads
  DROP CONSTRAINT leads_mini_context_check,
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
      AND price_quote->>'contractId' IN ('NFC-CARD-BEAUTY-RESTAURANT-MINI-PRICE-v31','NFC-CARD-CONTENT-TRUTH-PRICE-v33')
      AND price_quote->>'currency' = CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END
      AND price_quote @> '{"depositDueNow":false}'::jsonb
      AND (
        (price_quote->>'contractId' = 'NFC-CARD-BEAUTY-RESTAURANT-MINI-PRICE-v31' AND (
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
        ))
        OR (price_quote->>'contractId' = 'NFC-CARD-CONTENT-TRUTH-PRICE-v33' AND (
          (mini_context->>'quantity_mode' = 'fixed_bundle' AND language <> 'pl'
            AND mini_context->>'niche' = 'beauty' AND quantity IN (1,2)
            AND price_quote->>'status' = 'fixed' AND price_quote->>'deposit' = '200'
            AND price_quote->>'amount' = CASE WHEN quantity = 1 THEN '800'
              WHEN mini_context->>'design_mode' = 'ready' THEN '1400' ELSE '1600' END
            AND price_quote->>'unitPrice' = CASE WHEN quantity = 2 AND mini_context->>'design_mode' = 'ready'
              THEN '700' ELSE '800' END
            AND price_quote->>'balance' = CASE WHEN quantity = 1 THEN '600'
              WHEN mini_context->>'design_mode' = 'ready' THEN '1200' ELSE '1400' END
            AND price_quote @> '{"depositIncluded":true}'::jsonb)
          OR (mini_context->>'quantity_mode' IN ('fixed_bundle','custom_quote') AND quantity BETWEEN 1 AND 10000
            AND (mini_context->>'quantity_mode' <> 'fixed_bundle' OR (language <> 'pl' AND quantity IN (1,2,4,10)))
            AND (language = 'pl' OR mini_context->>'niche' = 'restaurant' OR quantity NOT IN (1,2))
            AND price_quote @> '{"status":"custom","amount":null,"unitPrice":null,"deposit":null,"balance":null,"depositIncluded":false}'::jsonb)
          OR (mini_context->>'quantity_mode' IN ('advice','free_design_concepts') AND quantity = 0
            AND (mini_context->>'quantity_mode' <> 'free_design_concepts' OR mini_context->>'design_mode' = 'branded')
            AND price_quote @> '{"status":"consultation","amount":null,"unitPrice":null,"deposit":null,"balance":null,"depositIncluded":false}'::jsonb)
        ))
      )
    ) IS TRUE)
  );
