ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS order_index FLOAT;

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (ORDER BY updated_at ASC, id ASC) AS new_order_index
  FROM documents
  WHERE order_index IS NULL
)
UPDATE documents d
SET order_index = ranked.new_order_index
FROM ranked
WHERE d.id = ranked.id;
