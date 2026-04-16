import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes.js';
import documentRoutes from '../modules/documents/routes/document.routes.js';
import { blockRoutes, blockPublicRoutes } from '../modules/blocks/routes/block.routes.js';
import { query } from '../config/db.js';

const router = Router();

router.get('/health', (_req, res) => res.status(200).json({ success: true }));
router.get('/ready', async (_req, res, next) => {
	try {
		await query('SELECT 1');
		return res.status(200).json({ success: true, ready: true });
	} catch (error) {
		return next(error);
	}
});
router.use('/', blockPublicRoutes);
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/', blockRoutes);

export default router;
