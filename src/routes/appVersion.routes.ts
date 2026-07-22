import { Router } from 'express';
import { AppVersionController } from '../controllers/appVersion.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware';

const router = Router();
const controller = new AppVersionController();

const publishValidator = [
  body('version').trim().notEmpty().withMessage('Version is required'),
  body('apkUrl').trim().isURL().withMessage('Valid APK URL is required'),
  body('releaseNotes').optional().isArray().withMessage('Release notes must be an array of strings'),
  body('isMandatory').optional().isBoolean().withMessage('isMandatory must be a boolean'),
];

router.get('/latest', controller.getLatest);
router.get('/history', controller.getHistory);
router.post(
  '/',
  authenticate,
  authorize('developer'),
  publishValidator,
  validate,
  controller.publish
);

export default router;
