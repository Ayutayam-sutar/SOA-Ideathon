import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getClusters,
  getClusterById,
  createCluster,
  updateCluster
} from '../controllers/clustersController';

const router = Router();

router.use(requireAuth);

router.get('/', getClusters);
router.post('/', createCluster);
router.get('/:id', getClusterById);
router.patch('/:id', updateCluster);

export default router;
