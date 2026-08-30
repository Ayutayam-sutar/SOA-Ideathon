import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  explainIncident
} from '../controllers/incidentsController';

const router = Router();

router.use(requireAuth);

router.get('/', getIncidents);
router.post('/', createIncident);
router.get('/:id', getIncidentById);
router.patch('/:id', updateIncident);
router.post('/:id/explain', explainIncident);

export default router;
