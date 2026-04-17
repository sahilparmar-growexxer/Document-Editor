import dotenv from 'dotenv';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, '../../.env');

dotenv.config({ path: envFilePath });

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
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-flash-latest',
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX || 100),
  corsOrigin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? undefined : [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:4173'
  ])
};

const hasExplicitJwtSecrets = Boolean(
  process.env.JWT_ACCESS_SECRET || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
);

if (env.nodeEnv === 'production' && !hasExplicitJwtSecrets) {
  throw new Error('JWT secrets are not configured. Set JWT_ACCESS_SECRET/JWT_REFRESH_SECRET (or JWT_SECRET) in production.');
}

if (env.nodeEnv === 'production' && !env.corsOrigin) {
  throw new Error('CORS_ORIGIN is not configured. Set CORS_ORIGIN in production.');
}

if (env.nodeEnv !== 'production' && !hasExplicitJwtSecrets) {
  console.warn('JWT secrets are not fully configured. Using derived fallback values for local development only.');
}

if (!env.geminiApiKey) {
  console.warn('GEMINI_API_KEY is not configured. Rewrite assistant will need it to call Gemini.');
}

export default env;
