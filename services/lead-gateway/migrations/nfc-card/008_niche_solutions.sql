-- Add public Beauty/Restaurant context without changing the physical Branded SKU.
ALTER TABLE nfc_card.leads
  ADD COLUMN solution jsonb,
  DROP CONSTRAINT leads_quantity_check,
  ADD CONSTRAINT leads_quantity_check CHECK (
    quantity BETWEEN 1 AND 10000 OR
    (quantity = 0 AND ((product = 'nfc-menu-card' AND intent = 'menu_consultation') OR
      (product = 'branded-review-card' AND solution IS NOT NULL AND selection = '{"variant":"branded","quantity":"advice"}'::jsonb)))
  ),
  ADD CONSTRAINT leads_solution_check CHECK (
    solution IS NULL OR (
      product = 'branded-review-card'
      AND solution IN (
        '{"schemaVersion":1,"solution_id":"beauty-review-card","niche":"beauty_salon","request_type":"free_first_mockup"}'::jsonb,
        '{"schemaVersion":1,"solution_id":"restaurant-review-card","niche":"restaurant","request_type":"free_first_mockup"}'::jsonb)
      AND selection IS NOT NULL AND price_quote IS NOT NULL
      AND selection->>'variant' = 'branded'
      AND ((selection->>'quantity' = '1' AND quantity = 1 AND price_quote @> jsonb_build_object(
          'currency', CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END, 'status','fixed',
          'amount', CASE WHEN language = 'pl' THEN 169 ELSE 2000 END,
          'deposit', CASE WHEN language = 'pl' THEN 20 ELSE 200 END, 'depositIncluded',true))
        OR (selection->>'quantity' = '2' AND quantity = 2 AND price_quote @> jsonb_build_object(
          'currency', CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END, 'status','fixed',
          'amount', CASE WHEN language = 'pl' THEN 299 ELSE 3600 END,
          'deposit', CASE WHEN language = 'pl' THEN 20 ELSE 200 END, 'depositIncluded',true))
        OR (selection->>'quantity' = 'more' AND quantity = 3 AND price_quote @> jsonb_build_object(
          'currency', CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END, 'status','custom',
          'amount',NULL, 'deposit', CASE WHEN language = 'pl' THEN 20 ELSE 200 END, 'depositIncluded',true))
        OR (selection->>'quantity' = 'advice' AND quantity = 0 AND price_quote @> jsonb_build_object(
          'currency', CASE WHEN language = 'pl' THEN 'PLN' ELSE 'UAH' END, 'status','consultation',
          'amount',NULL, 'deposit',NULL, 'depositIncluded',false)))
    )
  );
