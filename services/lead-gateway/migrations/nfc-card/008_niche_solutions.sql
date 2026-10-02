-- Add public Beauty/Restaurant context without changing the physical Branded SKU.
ALTER TABLE nfc_card.leads
  ADD COLUMN solution jsonb,
  DROP CONSTRAINT leads_quantity_check,
  ADD CONSTRAINT leads_quantity_check CHECK (
    quantity BETWEEN 1 AND 10000 OR
    ((quantity = 0 AND ((product = 'nfc-menu-card' AND intent = 'menu_consultation') OR
      (product = 'branded-review-card' AND solution IS NOT NULL AND selection = '{"variant":"branded","quantity":"advice"}'::jsonb))) IS TRUE)
  ),
  ADD CONSTRAINT leads_solution_check CHECK (
    solution IS NULL OR ((
      product = 'branded-review-card'
      AND solution IN (
        '{"schemaVersion":1,"solution_id":"beauty-review-card","niche":"beauty_salon","request_type":"free_first_mockup"}'::jsonb,
        '{"schemaVersion":1,"solution_id":"restaurant-review-card","niche":"restaurant","request_type":"free_first_mockup"}'::jsonb)
      AND selection IS NOT NULL AND price_quote IS NOT NULL
      AND selection->>'variant' = 'branded'
      AND price_quote->>'currency' = CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END
      AND (((selection->>'quantity' = '1' AND quantity = 1 OR selection->>'quantity' = '2' AND quantity = 2)
          AND price_quote->>'status' = 'fixed' AND jsonb_typeof(price_quote->'amount') = 'number'
          AND jsonb_typeof(price_quote->'deposit') = 'number'
          AND (price_quote->>'amount')::numeric > 0 AND (price_quote->>'deposit')::numeric > 0
          AND (price_quote->>'deposit')::numeric <= (price_quote->>'amount')::numeric
          AND price_quote @> '{"depositIncluded":true}'::jsonb)
        OR (selection->>'quantity' = 'more' AND quantity = 3 AND price_quote->>'status' = 'custom'
          AND price_quote @> '{"amount":null,"depositIncluded":true}'::jsonb
          AND jsonb_typeof(price_quote->'deposit') = 'number' AND (price_quote->>'deposit')::numeric > 0)
        OR (selection->>'quantity' = 'advice' AND quantity = 0 AND price_quote @> jsonb_build_object(
          'currency', CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END, 'status','consultation',
          'amount',NULL, 'deposit',NULL, 'depositIncluded',false)))
    ) IS TRUE)
  );
