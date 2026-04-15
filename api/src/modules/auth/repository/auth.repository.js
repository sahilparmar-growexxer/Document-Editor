import { query } from '../../../config/db.js';

async function findByEmail(email) {
  const result = await query(
    'SELECT id, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0] || null;
}

async function createUser(email, passwordHash) {
  const result = await query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [email, passwordHash]
  );
  return result.rows[0];
}

async function createRefreshTokenSession({ userId, tokenHash, expiresAt }) {
  const result = await query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, token, expires_at, created_at`,
    [userId, tokenHash, expiresAt]
  );

  return result.rows[0];
}

async function findRefreshTokenSession(tokenHash) {
  const result = await query(
    `SELECT id, user_id, token, expires_at, created_at
     FROM refresh_tokens
     WHERE token = $1
     LIMIT 1`,
    [tokenHash]
  );

  return result.rows[0] || null;
}

async function deleteRefreshTokenSession(tokenHash) {
  await query('DELETE FROM refresh_tokens WHERE token = $1', [tokenHash]);
}

export {
  findByEmail,
  createUser,
  createRefreshTokenSession,
  findRefreshTokenSession,
  deleteRefreshTokenSession
};
