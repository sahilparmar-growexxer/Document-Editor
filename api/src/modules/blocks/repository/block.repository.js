import { query } from '../../../config/db.js';

async function listByDocumentId(documentId) {
  const result = await query(
    `SELECT id, document_id, type, content, order_index, parent_id, created_at
     FROM blocks
     WHERE document_id = $1
     ORDER BY order_index ASC, created_at ASC`,
    [documentId]
  );

  return result.rows;
}

async function findById(id) {
  const result = await query(
    `SELECT id, document_id, type, content, order_index, parent_id, created_at
     FROM blocks
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function findByIdForDocument(documentId, id) {
  const result = await query(
    `SELECT id, document_id, type, content, order_index, parent_id, created_at
     FROM blocks
     WHERE document_id = $1 AND id = $2
     LIMIT 1`,
    [documentId, id]
  );

  return result.rows[0] || null;
}

async function findByIdOrNull(id) {
  if (!id) return null;
  return findById(id);
}

async function create({ documentId, type, content, orderIndex, parentId }) {
  const result = await query(
    `INSERT INTO blocks (document_id, type, content, order_index, parent_id)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     RETURNING id, document_id, type, content, order_index, parent_id, created_at`,
    [documentId, type, JSON.stringify(content || {}), orderIndex, parentId || null]
  );

  return result.rows[0];
}

async function updateById(id, updates) {
  const fields = [];
  const values = [];
  let idx = 1;

  if (Object.prototype.hasOwnProperty.call(updates, 'content')) {
    fields.push(`content = $${idx}::jsonb`);
    values.push(JSON.stringify(updates.content || {}));
    idx += 1;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'type')) {
    fields.push(`type = $${idx}`);
    values.push(updates.type);
    idx += 1;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'orderIndex')) {
    fields.push(`order_index = $${idx}`);
    values.push(updates.orderIndex);
    idx += 1;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'parentId')) {
    fields.push(`parent_id = $${idx}`);
    values.push(updates.parentId || null);
    idx += 1;
  }

  if (!fields.length) {
    return findById(id);
  }

  values.push(id);
  const result = await query(
    `UPDATE blocks
     SET ${fields.join(', ')}
     WHERE id = $${idx}
     RETURNING id, document_id, type, content, order_index, parent_id, created_at`,
    values
  );

  return result.rows[0] || null;
}

async function removeById(id) {
  await query('DELETE FROM blocks WHERE id = $1', [id]);
}

async function findNextBlock(documentId, orderIndex) {
  const result = await query(
    `SELECT id, document_id, type, content, order_index, parent_id, created_at
     FROM blocks
     WHERE document_id = $1 AND order_index > $2
     ORDER BY order_index ASC
     LIMIT 1`,
    [documentId, orderIndex]
  );

  return result.rows[0] || null;
}

async function listPublicByShareToken(token) {
  const result = await query(
    `SELECT d.id, d.title, d.share_token, d.is_public,
            b.id AS block_id, b.type AS block_type, b.content AS block_content,
            b.order_index AS block_order_index, b.parent_id AS block_parent_id, b.created_at AS block_created_at
     FROM documents d
     LEFT JOIN blocks b ON b.document_id = d.id
     WHERE d.share_token = $1 AND d.is_public = TRUE
     ORDER BY b.order_index ASC, b.created_at ASC`,
    [token]
  );

  return result.rows;
}

export {
  listByDocumentId,
  findById,
  findByIdForDocument,
  findByIdOrNull,
  create,
  updateById,
  removeById,
  findNextBlock,
  listPublicByShareToken
};
