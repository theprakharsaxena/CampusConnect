import { Router } from 'express';
import { AppVersionController } from '../controllers/appVersion.controller';

const router = Router();
const controller = new AppVersionController();

// Public — app reads this on startup to decide Quick Login visibility
router.get('/config', controller.getConfig);

export default router;
