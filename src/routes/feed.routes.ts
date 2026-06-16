import { Router } from 'express';
import {
  notificationController,
  feedController,
} from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { requireActive } from '../middlewares/active.middleware';
import { mongoIdValidator, paginationValidator, feedValidator } from '../validators';

const router = Router();

router.use(authenticate);

router.get('/feed', feedValidator, validate, feedController.getFeed);

export default router;

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get('/', paginationValidator, validate, notificationController.getAll);
notificationRouter.put(
  '/:id/read',
  requireActive,
  mongoIdValidator,
  validate,
  notificationController.markAsRead
);
notificationRouter.put('/read-all', requireActive, notificationController.markAllAsRead);
