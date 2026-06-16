import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/multer';
import { requireActive } from '../middlewares/active.middleware';
import {
  createEventValidator,
  rsvpValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireActive,
  upload.single('bannerImage'),
  createEventValidator,
  validate,
  eventController.create
);
router.get('/', paginationValidator, validate, eventController.getAll);
router.get('/:id', mongoIdValidator, validate, eventController.getById);
router.put(
  '/:id',
  requireActive,
  upload.single('bannerImage'),
  mongoIdValidator,
  validate,
  eventController.update
);
router.delete('/:id', requireActive, mongoIdValidator, validate, eventController.delete);
router.post('/:id/rsvp', requireActive, rsvpValidator, validate, eventController.rsvp);

export default router;
