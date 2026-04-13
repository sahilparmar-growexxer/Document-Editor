import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

function signAccessToken(payload) {
  return jwt.sign(payload, env.accessSecret, { expiresIn: env.accessExpiresIn });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, env.refreshSecret, { expiresIn: env.refreshExpiresIn });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.refreshSecret);
}

export {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
