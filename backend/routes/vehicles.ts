import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { getVehicles } from '../controllers/vehiclesController';

const router = Router();

router.use(requireAuth);

// Admin-only route
router.get('/', requireRole(['admin']), getVehicles);

export default router;
