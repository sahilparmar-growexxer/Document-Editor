import { sendSuccess } from '../../../common/utils/response.util.js';
import { register as registerUser, login as loginUser, refresh as refreshTokenService } from '../service/auth.service.js';

async function register(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const result = await registerUser(email, password);
    return sendSuccess(res, 201, result);
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.validated.body;
    const result = await loginUser(email, password);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.validated.body;
    const result = await refreshTokenService(refreshToken);
    return sendSuccess(res, 200, result);
  } catch (error) {
    return next(error);
  }
}

export { register, login, refresh };
