import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import env from '../../config/env.js';

function signAccessToken(payload) {
  return jwt.sign({ ...payload, tokenType: 'access' }, env.accessSecret, { expiresIn: env.accessExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, env.refreshSecret, {
    expiresIn: env.refreshExpiresIn,
    jwtid: crypto.randomUUID()
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret);
}

function verifyRefreshToken(token) {
  const payload = jwt.verify(token, env.refreshSecret);
  if (payload?.tokenType !== 'refresh') {
    throw new Error('Invalid refresh token type');
  }
  return payload;
}

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
