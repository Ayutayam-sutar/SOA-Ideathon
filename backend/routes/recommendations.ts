import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { recommendGrouping, recommendRoute, recommendDepartureTime, recommendPlan } from '../controllers/recommendationsController';

const router = Router();

router.use(requireAuth);
router.use(requireRole(['admin', 'business', 'agent'])); // Role expansion as per Phase 6 requirements

router.get('/grouping', recommendGrouping);
router.post('/grouping', recommendGrouping);
router.post('/route', recommendRoute);
router.post('/departure-time', recommendDepartureTime);
router.post('/plan', recommendPlan); // New Unified Master Endpoint

export default router;
