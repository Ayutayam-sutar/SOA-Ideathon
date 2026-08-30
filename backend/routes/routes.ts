import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  getRouteRisk,
  explainRoute,
  reoptimizeRoute
} from '../controllers/routesController';

const router = Router();

router.use(requireAuth);

router.get('/', getRoutes);
router.post('/', createRoute);
router.get('/:id', getRouteById);
router.patch('/:id', updateRoute);
router.get('/:id/risk', getRouteRisk);
router.post('/:id/explain', explainRoute);
router.post('/:id/reoptimize', reoptimizeRoute);

export default router;
