import { Router } from 'express';
import { AppVersionController } from '../controllers/appVersion.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware';

const router = Router();
const controller = new AppVersionController();

const updateConfigValidator = [
  body('versions')
    .isArray()
    .withMessage('versions must be an array'),
  body('versions.*.version')
    .trim()
    .notEmpty()
    .withMessage('Each entry must have a version string'),
  body('versions.*.quickLogin')
    .isBoolean()
    .withMessage('Each entry must have a quickLogin boolean'),
];

// Public — app reads this on startup to decide Quick Login visibility
router.get('/config', controller.getConfig);

// Developer-only — update the version config
router.put(
  '/config',
  authenticate,
  authorize('developer'),
  updateConfigValidator,
  validate,
  controller.updateConfig
);

export default router;
