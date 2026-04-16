import AppError from '../errors/AppError.js';
import errorCodes from '../errors/errorCodes.js';

function createRateLimiter({ windowMs, max, keyPrefix = 'global' }) {
  const store = new Map();

  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (value.resetAt <= now) {
        store.delete(key);
      }
    }
  }, Math.max(windowMs, 60 * 1000)).unref();

  return function rateLimitMiddleware(req, _res, next) {
    const now = Date.now();
    const forwardedFor = req.headers['x-forwarded-for'];
    const ip = req.ip || (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : 'unknown');
    const key = `${keyPrefix}:${ip}`;
    const existing = store.get(key);

    if (!existing || existing.resetAt <= now) {
      store.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    if (existing.count >= max) {
      return next(new AppError('Too many requests. Please try again later.', 429, errorCodes.TOO_MANY_REQUESTS || 'TOO_MANY_REQUESTS'));
    }

    existing.count += 1;
    return next();
  };
}

export { createRateLimiter };
