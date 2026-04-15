import dotenv from 'dotenv';
import crypto from 'node:crypto';

dotenv.config();

function createFallbackSecret(label) {
  const seed = process.env.DATABASE_URL || `${process.env.PGHOST || ''}:${process.env.PGPORT || ''}:${process.env.PGDATABASE || ''}`;
  return crypto.createHash('sha256').update(`${label}:${seed}:${process.env.NODE_ENV || ''}`).digest('hex');
}

function resolveSecret(primaryKey, sharedKey, label) {
  return process.env[primaryKey] || process.env[sharedKey] || createFallbackSecret(label);
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl:
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRESQL_URL ||
    process.env.RENDER_POSTGRES_URL,
  dbHost: process.env.PGHOST || (process.env.NODE_ENV === 'production' ? undefined : 'localhost'),
  dbPort: Number(process.env.PGPORT || 5432),
  dbUser: process.env.PGUSER || (process.env.NODE_ENV === 'production' ? undefined : 'postgres'),
  dbPassword: process.env.PGPASSWORD || (process.env.NODE_ENV === 'production' ? undefined : 'postgres'),
  dbName: process.env.PGDATABASE || (process.env.NODE_ENV === 'production' ? undefined : 'blocknote'),
  accessSecret: resolveSecret('JWT_ACCESS_SECRET', 'JWT_SECRET', 'access'),
  refreshSecret: resolveSecret('JWT_REFRESH_SECRET', 'JWT_SECRET', 'refresh'),
  accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  refreshTokenCookieName: process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken',
  refreshTokenHashPepper: process.env.REFRESH_TOKEN_HASH_PEPPER || resolveSecret('JWT_REFRESH_SECRET', 'JWT_SECRET', 'refresh-hash'),
  corsOrigin:
    process.env.CORS_ORIGIN ||
    (process.env.NODE_ENV === 'production'
      ? 'https://yourdomain.com'
      : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'])
};

if (!process.env.JWT_ACCESS_SECRET && !process.env.JWT_REFRESH_SECRET && !process.env.JWT_SECRET) {
  const secretSource = process.env.JWT_SECRET ? 'JWT_SECRET' : 'derived fallback';
  console.warn(`JWT secrets are not fully configured. Using ${secretSource} values for token signing.`);
}

export default env;
