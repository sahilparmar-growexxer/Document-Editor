import AppError from '../../../common/errors/AppError.js';
import errorCodes from '../../../common/errors/errorCodes.js';
import { hashPassword, comparePassword } from '../../../common/utils/hash.util.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../common/utils/token.util.js';
import { findByEmail, createUser } from '../repository/auth.repository.js';

async function register(email, password) {
  const existing = await findByEmail(email);
  if (existing) {
    throw new AppError('Email already exists', 409, errorCodes.EMAIL_ALREADY_EXISTS);
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser(email, passwordHash);

  return {
    user,
    tokens: {
      accessToken: signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: signRefreshToken({ sub: user.id, email: user.email })
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

  return {
    user: { id: user.id, email: user.email, created_at: user.created_at },
    tokens: {
      accessToken: signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: signRefreshToken({ sub: user.id, email: user.email })
    }
  };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_err) {
    throw new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED);
  }

  return {
    accessToken: signAccessToken({ sub: payload.sub, email: payload.email })
  };
}

export {
  register,
  login,
  refresh
};
