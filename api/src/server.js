import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import app from './app.js';
import env from './config/env.js';
import { getClient, query } from './config/db.js';
import logger from './config/logger.js';

async function migrate() {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const migrationDir = path.join(__dirname, 'database', 'migrations');
    const files = fs.readdirSync(migrationDir).sort();

    for (const file of files) {
      const applied = await client.query(
        'SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1',
        [file]
      );

      if (applied.rowCount > 0) {
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationDir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function start() {
  await migrate();
  await query('SELECT 1');
  app.listen(env.port, () => {
    logger.info(`API listening on http://localhost:${env.port}`);
  });
}

start().catch((error) => {
  logger.error('Failed to start server', error);
  process.exit(1);
});
