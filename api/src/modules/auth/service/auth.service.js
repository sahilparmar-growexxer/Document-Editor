import crypto from 'node:crypto';
import AppError from '../../../common/errors/AppError.js';
import errorCodes from '../../../common/errors/errorCodes.js';
import { hashPassword, comparePassword } from '../../../common/utils/hash.util.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../common/utils/token.util.js';
import env from '../../../config/env.js';
import {
  findByEmail,
  createUser,
  createRefreshTokenSession,
  findRefreshTokenSession,
  deleteRefreshTokenSession
} from '../repository/auth.repository.js';

function hashRefreshToken(refreshToken) {
  return crypto
    .createHash('sha256')
    .update(`${refreshToken}:${env.refreshTokenHashPepper}`)
    .digest('hex');
}

function toDateFromUnixSeconds(unixSeconds) {
  return new Date(unixSeconds * 1000);
}

async function buildAuthTokens(user) {
  const tokenPayload = { sub: user.id, email: user.email };
  const accessToken = signAccessToken(tokenPayload);
  const refreshToken = signRefreshToken(tokenPayload);
  const decodedRefresh = verifyRefreshToken(refreshToken);

  await createRefreshTokenSession({
    userId: user.id,
    tokenHash: hashRefreshToken(refreshToken),
    expiresAt: toDateFromUnixSeconds(decodedRefresh.exp)
  });

  return { accessToken, refreshToken };
}

async function register(email, password) {
  const existing = await findByEmail(email);
  if (existing) {
    throw new AppError('Email already exists', 409, errorCodes.EMAIL_ALREADY_EXISTS);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);
  const tokens = await buildAuthTokens(user);

  return {
    user,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  };
}

async function login(email, password) {
  const user = await findByEmail(email);
  if (!user) {
    throw new AppError('Invalid credentials', 401, errorCodes.INVALID_CREDENTIALS);
  }

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401, errorCodes.INVALID_CREDENTIALS);
  }

  const authUser = { id: user.id, email: user.email, created_at: user.created_at };
  const tokens = await buildAuthTokens(authUser);

  return {
    user: authUser,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  };
}

async function refresh(refreshToken) {
  if (!refreshToken) {
    throw new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED);
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_err) {
    throw new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED);
  }

  const tokenHash = hashRefreshToken(refreshToken);
  const existingSession = await findRefreshTokenSession(tokenHash);
  if (!existingSession) {
    throw new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED);
  }

  if (existingSession.user_id !== payload.sub) {
    await deleteRefreshTokenSession(tokenHash);
    throw new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED);
  }

  if (new Date(existingSession.expires_at).getTime() <= Date.now()) {
    await deleteRefreshTokenSession(tokenHash);
    throw new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED);
  }

  const user = { id: payload.sub, email: payload.email };
  const rotated = await buildAuthTokens(user);
  await deleteRefreshTokenSession(tokenHash);

  return {
    accessToken: rotated.accessToken,
    refreshToken: rotated.refreshToken
  };
}

async function logout(refreshToken) {
  if (!refreshToken) return;
  const tokenHash = hashRefreshToken(refreshToken);
  await deleteRefreshTokenSession(tokenHash);
}

export {
  register,
  login,
  refresh,
  logout
};
