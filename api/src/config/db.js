import { Pool } from 'pg';
import env from './env.js';

function resolveSslConfig(host, urlObj) {
  const sslMode = (process.env.PGSSLMODE || urlObj?.searchParams?.get('sslmode') || '').toLowerCase();
  const shouldUseSsl = sslMode === 'require' || (typeof host === 'string' && host.includes('render.com'));

  if (!shouldUseSsl) {
    return undefined;
  }

  return { rejectUnauthorized: false };
}

function buildPoolConfig() {
  const hasExplicitPgEnv =
    process.env.PGHOST ||
    process.env.PGPORT ||
    process.env.PGUSER ||
    process.env.PGPASSWORD ||
    process.env.PGDATABASE;

  if (hasExplicitPgEnv) {
    const ssl = resolveSslConfig(env.dbHost);
    return {
      host: env.dbHost,
      port: env.dbPort,
      user: env.dbUser,
      password: env.dbPassword,
      database: env.dbName,
      ...(ssl ? { ssl } : {})
    };
  }

  if (env.databaseUrl) {
    const parsed = new URL(env.databaseUrl);
    const ssl = resolveSslConfig(parsed.hostname, parsed);
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 5432,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
      ...(ssl ? { ssl } : {})
    };
  }

  if (env.nodeEnv === 'production') {
    throw new Error('Database configuration missing. Set DATABASE_URL (or POSTGRES_URL) or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE in production.');
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
