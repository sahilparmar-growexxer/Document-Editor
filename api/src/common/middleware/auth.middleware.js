import AppError from '../errors/AppError.js';
import errorCodes from '../errors/errorCodes.js';
import { verifyAccessToken } from '../utils/token.util.js';

function authMiddleware(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    if (payload?.tokenType !== 'access') {
      return next(new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED));
    }
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (_err) {
    return next(new AppError('Unauthorized', 401, errorCodes.UNAUTHORIZED));
  }
}

export default authMiddleware;
