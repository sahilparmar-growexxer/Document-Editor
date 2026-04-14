import { query } from '../../../config/db.js';

async function listByDocumentId(documentId) {
  const result = await query(
    `SELECT c.id, c.document_id, c.user_id, c.body, c.resolved, c.created_at, u.email AS author_email
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.document_id = $1
     ORDER BY c.created_at DESC`,
    [documentId]
  );

  return result.rows;
}

async function create({ documentId, userId, body }) {
  const result = await query(
    `INSERT INTO comments (document_id, user_id, body)
     VALUES ($1, $2, $3)
     RETURNING id, document_id, user_id, body, resolved, created_at`,
    [documentId, userId, body]
  );

  return result.rows[0];
}

async function findById(id) {
  const result = await query(
    `SELECT id, document_id, user_id, body, resolved, created_at
     FROM comments
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0] || null;
}

async function removeById(id) {
  await query('DELETE FROM comments WHERE id = $1', [id]);
}

async function setResolved(id, resolved) {
  const result = await query(
    `UPDATE comments
     SET resolved = $2
     WHERE id = $1
     RETURNING id, document_id, user_id, body, resolved, created_at`,
    [id, resolved]
  );

  return result.rows[0] || null;
}

export { listByDocumentId, create, findById, removeById, setResolved };
