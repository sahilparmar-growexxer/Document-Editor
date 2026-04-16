import logger from '../../config/logger.js';

function errorMiddleware(err, _req, res, _next) {
  logger.error({ requestId: _req?.requestId, error: err });

  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  return res.status(statusCode).json({
    success: false,
    requestId: _req?.requestId,
    error: {
      code,
      message
    }
  });
}

export default errorMiddleware;
