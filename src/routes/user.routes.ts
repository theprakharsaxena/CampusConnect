import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/multer';
import {
  updateProfileValidator,
  userSearchValidator,
  mongoIdValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.get('/search', userSearchValidator, validate, userController.searchUsers);
router.get('/:id', mongoIdValidator, validate, userController.getUser);
router.put(
  '/profile',
  upload.single('profileImage'),
  updateProfileValidator,
  validate,
  userController.updateProfile
);

export default router;
