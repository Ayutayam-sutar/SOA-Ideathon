import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getShipments,
  getShipmentById,
  createShipment,
  updateShipment,
  appendTemperatureLog,
  getShipmentRisk
} from '../controllers/shipmentsController';

const router = Router();

// Apply requireAuth to all routes in this file
router.use(requireAuth);

router.get('/', getShipments);
router.post('/', createShipment);
router.get('/:id', getShipmentById);
router.patch('/:id', updateShipment);
router.post('/:id/temperature-log', appendTemperatureLog);
router.get('/:id/risk', getShipmentRisk);

export default router;
