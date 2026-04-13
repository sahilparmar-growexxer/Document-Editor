import { Router } from 'express';
import authRoutes from '../modules/auth/routes/auth.routes.js';
import documentRoutes from '../modules/documents/routes/document.routes.js';

const router = Router();

router.get('/health', (_req, res) => res.status(200).json({ success: true }));
router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);

export default router;
