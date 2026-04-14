import { query } from '../../../config/db.js';

async function listByUserId(userId) {
  const result = await query(
    `SELECT id, user_id, title, share_token, is_public, updated_at
     FROM documents
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [userId]
  );
  return result.rows;
}

async function create(userId, title) {
  const result = await query(
    `INSERT INTO documents (user_id, title, updated_at)
     VALUES ($1, $2, NOW())
     RETURNING id, user_id, title, share_token, is_public, updated_at`,
    [userId, title]
  );
  return result.rows[0];
}

async function findById(id) {
  const result = await query(
    `SELECT id, user_id, title, share_token, is_public, updated_at
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
     RETURNING id, user_id, title, share_token, is_public, updated_at`,
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
     RETURNING id, user_id, title, share_token, is_public, updated_at`,
    [id, token]
  );

  return result.rows[0] || null;
}

async function disableSharing(id) {
  const result = await query(
    `UPDATE documents
     SET share_token = NULL, is_public = FALSE, updated_at = NOW()
     WHERE id = $1
     RETURNING id, user_id, title, share_token, is_public, updated_at`,
    [id]
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
  disableSharing
};
