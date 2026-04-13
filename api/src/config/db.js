import { Pool } from 'pg';
import env from './env.js';

function buildPoolConfig() {
  const hasExplicitPgEnv =
    process.env.PGHOST ||
    process.env.PGPORT ||
    process.env.PGUSER ||
    process.env.PGPASSWORD ||
    process.env.PGDATABASE;

  if (hasExplicitPgEnv) {
    return {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName
    };
  }

  if (env.databaseUrl) {
    const parsed = new URL(env.databaseUrl);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, '')
    };
  }

  return {
    host: env.dbHost,
    port: env.dbPort,
    user: env.dbUser,
    password: env.dbPassword,
    database: env.dbName
  };
}

const pool = new Pool(buildPoolConfig());

function query(text, params) {
  return pool.query(text, params);
}

function getClient() {
  return pool.connect();
}

export { pool, query, getClient };
