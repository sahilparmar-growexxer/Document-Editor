import { Router } from 'express';
import validate from '../../../common/middleware/validate.middleware.js';
import * as controller from '../controller/auth.controller.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema } from '../validation/auth.validation.js';

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', validate(loginSchema), controller.login);
router.post('/refresh', validate(refreshSchema), controller.refresh);
router.post('/logout', validate(logoutSchema), controller.logout);

export default router;
