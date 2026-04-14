import { Router } from 'express';
import authMiddleware from '../../../common/middleware/auth.middleware.js';
import validate from '../../../common/middleware/validate.middleware.js';
import * as controller from '../controller/document.controller.js';
import {
  createDocumentSchema,
  updateDocumentSchema,
  idParamSchema
} from '../validation/document.validation.js';

const router = Router();

router.use(authMiddleware);
router.get('/', controller.list);
router.post('/', validate(createDocumentSchema), controller.create);
router.post('/:id/share', validate(idParamSchema), controller.enableSharing);
router.delete('/:id/share', validate(idParamSchema), controller.disableSharing);
router.patch('/:id', validate(updateDocumentSchema), controller.rename);
router.delete('/:id', validate(idParamSchema), controller.remove);

export default router;
