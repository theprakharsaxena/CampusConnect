import { Router } from 'express';
import { connectionController } from '../controllers/connection.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { requireActive } from '../middlewares/active.middleware';
import {
  connectionRequestValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post(
  '/request',
  requireActive,
  connectionRequestValidator,
  validate,
  connectionController.sendRequest
);
router.get('/', paginationValidator, validate, connectionController.getConnections);
router.get('/pending', paginationValidator, validate, connectionController.getPending);
router.put('/:id/accept', requireActive, mongoIdValidator, validate, connectionController.accept);
router.put('/:id/reject', requireActive, mongoIdValidator, validate, connectionController.reject);
router.delete(
  '/:id/cancel',
  requireActive,
  mongoIdValidator,
  validate,
  connectionController.cancel
);
router.delete('/:id', requireActive, mongoIdValidator, validate, connectionController.remove);

export default router;
