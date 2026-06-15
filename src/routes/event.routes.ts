import { Router } from 'express';
import { eventController } from '../controllers/event.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/multer';
import {
  createEventValidator,
  rsvpValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/', upload.single('bannerImage'), createEventValidator, validate, eventController.create);
router.get('/', paginationValidator, validate, eventController.getAll);
router.get('/:id', mongoIdValidator, validate, eventController.getById);
router.put('/:id', upload.single('bannerImage'), mongoIdValidator, validate, eventController.update);
router.delete('/:id', mongoIdValidator, validate, eventController.delete);
router.post('/:id/rsvp', rsvpValidator, validate, eventController.rsvp);

export default router;
