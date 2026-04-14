CREATE INDEX IF NOT EXISTS idx_blocks_document_order_index
  ON blocks(document_id, order_index);
