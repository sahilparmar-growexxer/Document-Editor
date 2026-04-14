import { Router } from 'express';
import authMiddleware from '../../../common/middleware/auth.middleware.js';
import validate from '../../../common/middleware/validate.middleware.js';
import * as controller from '../controller/block.controller.js';
import {
  listBlocksSchema,
  createBlockSchema,
  updateBlockSchema,
  deleteBlockSchema,
  reorderBlockSchema,
  splitBlockSchema,
  shareTokenParamSchema
} from '../validation/block.validation.js';

const router = Router();
const publicRouter = Router();

publicRouter.get('/share/:token', validate(shareTokenParamSchema), controller.shared);

router.use(authMiddleware);
router.get('/documents/:id/blocks', validate(listBlocksSchema), controller.list);
router.post('/blocks/reorder', validate(reorderBlockSchema), controller.reorder);
router.post('/blocks/split', validate(splitBlockSchema), controller.split);
router.post('/blocks', validate(createBlockSchema), controller.create);
router.patch('/blocks/:id', validate(updateBlockSchema), controller.update);
router.delete('/blocks/:id', validate(deleteBlockSchema), controller.remove);

export { router as blockRoutes, publicRouter as blockPublicRoutes };
