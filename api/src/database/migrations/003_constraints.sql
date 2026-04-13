ALTER TABLE blocks
  ADD CONSTRAINT fk_blocks_parent
  FOREIGN KEY (parent_id)
  REFERENCES blocks(id)
  ON DELETE SET NULL;
