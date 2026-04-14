import { Router } from 'express';
import authMiddleware from '../../../common/middleware/auth.middleware.js';
import validate from '../../../common/middleware/validate.middleware.js';
import * as controller from '../controller/comment.controller.js';
import {
  listCommentsSchema,
  createCommentSchema,
  idParamSchema,
  updateResolvedSchema
} from '../validation/comment.validation.js';

const router = Router();

router.use(authMiddleware);
router.get('/documents/:id/comments', validate(listCommentsSchema), controller.list);
router.post('/documents/:id/comments', validate(createCommentSchema), controller.create);
router.delete('/comments/:id', validate(idParamSchema), controller.removeComment);
router.patch('/comments/:id', validate(updateResolvedSchema), controller.patchResolved);

export default router;
