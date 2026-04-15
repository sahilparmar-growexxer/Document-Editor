import { query } from '../../../config/db.js';

async function listByUserId(userId) {
  const result = await query(
    `SELECT id, user_id, title, share_token, is_public, order_index, updated_at
     FROM documents
     WHERE user_id = $1
     ORDER BY order_index DESC, updated_at DESC`,
    [userId]
  );
  return result.rows;
}

async function create(userId, title) {
  const orderResult = await query(
    `SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order_index
     FROM documents
     WHERE user_id = $1`,
    [userId]
  );

  const orderIndex = orderResult.rows[0]?.next_order_index || 1;

  const result = await query(
    `INSERT INTO documents (user_id, title, order_index, updated_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, user_id, title, share_token, is_public, order_index, updated_at`,
    [userId, title, orderIndex]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query(
    `SELECT id, user_id, title, share_token, is_public, order_index, updated_at
     FROM documents
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

async function rename(id, title) {
  const result = await query(
    `UPDATE documents
     SET title = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, title, share_token, is_public, order_index, updated_at`,
    [id, title]
  );
  return result.rows[0] || null;
}

async function remove(id) {
  await query('DELETE FROM documents WHERE id = $1', [id]);
}

async function enableSharing(id, token) {
  const result = await query(
    `UPDATE documents
     SET share_token = $2, is_public = TRUE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, title, share_token, is_public, order_index, updated_at`,
    [id, token]
  );

  return result.rows[0] || null;
}

async function disableSharing(id) {
  const result = await query(
    `UPDATE documents
     SET share_token = NULL, is_public = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, title, share_token, is_public, order_index, updated_at`,
    [id]
  );

  return result.rows[0] || null;
}

async function updateOrder(id, orderIndex) {
  const result = await query(
    `UPDATE documents
     SET order_index = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, title, share_token, is_public, order_index, updated_at`,
    [id, orderIndex]
  );

  return result.rows[0] || null;
}

export {
  listByUserId,
  create,
  findById,
  rename,
  remove,
  enableSharing,
  disableSharing,
  updateOrder
};
