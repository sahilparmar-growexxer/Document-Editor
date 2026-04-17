import { sendSuccess } from '../../../common/utils/response.util.js';
import env from '../../../config/env.js';
import {
  register as registerUser,
  login as loginUser,
  refresh as refreshTokenService,
  logout as logoutService
} from '../service/auth.service.js';

function getRefreshCookieOptions() {
  const isProduction = env.nodeEnv === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/auth'
  };
}

function parseCookieHeader(cookieHeader = '') {
  return cookieHeader
    .split(';')
    .map((segment) => segment.trim())
    .filter(Boolean)
    .reduce((acc, segment) => {
      const idx = segment.indexOf('=');
      if (idx < 0) return acc;
      const key = segment.slice(0, idx).trim();
      let value = segment.slice(idx + 1).trim();
      try {
        value = decodeURIComponent(value);
      } catch (_err) {
        // keep raw value when cookie cannot be decoded
      }
      acc[key] = value;
      return acc;
    }, {});
}

function getRefreshTokenFromRequest(req) {
  const cookies = parseCookieHeader(req.headers.cookie || '');
  return cookies[env.refreshTokenCookieName] || '';
}

async function register(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const result = await registerUser(email, password);
    res.cookie(env.refreshTokenCookieName, result.tokens.refreshToken, getRefreshCookieOptions());
    return sendSuccess(res, 201, {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const result = await loginUser(email, password);
    res.cookie(env.refreshTokenCookieName, result.tokens.refreshToken, getRefreshCookieOptions());
    return sendSuccess(res, 200, {
      user: result.user,
      tokens: {
        accessToken: result.tokens.accessToken
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    const result = await refreshTokenService(refreshToken);
    res.cookie(env.refreshTokenCookieName, result.refreshToken, getRefreshCookieOptions());
    return sendSuccess(res, 200, { accessToken: result.accessToken });
  } catch (error) {
    return next(error);
  }
}

async function logout(req, res, next) {
  try {
    const refreshToken = getRefreshTokenFromRequest(req);
    await logoutService(refreshToken);
    res.clearCookie(env.refreshTokenCookieName, getRefreshCookieOptions());
    return sendSuccess(res, 200, { loggedOut: true });
  } catch (error) {
    return next(error);
  }
}

export { register, login, refresh, logout };
