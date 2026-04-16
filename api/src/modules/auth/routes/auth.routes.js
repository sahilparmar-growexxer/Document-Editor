import { Router } from 'express';
import validate from '../../../common/middleware/validate.middleware.js';
import { createRateLimiter } from '../../../common/middleware/rate-limit.middleware.js';
import env from '../../../config/env.js';
import * as controller from '../controller/auth.controller.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../validation/auth.validation.js';

const router = Router();
const authRateLimiter = createRateLimiter({
	windowMs: env.authRateLimitWindowMs,
	max: env.authRateLimitMax,
	keyPrefix: 'auth'
});

router.post('/register', authRateLimiter, validate(registerSchema), controller.register);
router.post('/login', authRateLimiter, validate(loginSchema), controller.login);
router.post('/refresh', authRateLimiter, validate(refreshSchema), controller.refresh);
router.post('/logout', validate(logoutSchema), controller.logout);

export default router;
