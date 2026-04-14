import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes.js';
import documentRoutes from '../modules/documents/routes/document.routes.js';
import { blockRoutes, blockPublicRoutes } from '../modules/blocks/routes/block.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.status(200).json({ success: true }));
router.use('/', blockPublicRoutes);
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/', blockRoutes);

export default router;
