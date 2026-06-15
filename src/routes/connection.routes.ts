import { Router } from 'express';
import { connectionController } from '../controllers/connection.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  connectionRequestValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/request', connectionRequestValidator, validate, connectionController.sendRequest);
router.get('/', paginationValidator, validate, connectionController.getConnections);
router.get('/pending', paginationValidator, validate, connectionController.getPending);
router.put('/:id/accept', mongoIdValidator, validate, connectionController.accept);
router.put('/:id/reject', mongoIdValidator, validate, connectionController.reject);
router.delete('/:id/cancel', mongoIdValidator, validate, connectionController.cancel);
router.delete('/:id', mongoIdValidator, validate, connectionController.remove);

export default router;
