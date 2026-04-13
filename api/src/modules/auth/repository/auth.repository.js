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

export {
  findByEmail,
  createUser
};
