import { Router } from 'express';
import { getHubs } from '../controllers/hubsController';

const router = Router();

router.get('/', getHubs);

export default router;
