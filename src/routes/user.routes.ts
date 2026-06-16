import { Router } from 'express';
import { userController, userManagementController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/multer';
import {
  updateProfileValidator,
  userSearchValidator,
  manageUserValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

// User management (admin, HOD, teacher — scoped by role)
router.get(
  '/manage/list',
  authorize('admin', 'hod', 'teacher'),
  paginationValidator,
  validate,
  userManagementController.getManageableUsers
);
router.get(
  '/manage/pending',
  authorize('admin', 'hod', 'teacher'),
  paginationValidator,
  validate,
  userManagementController.getPendingUsers
);
router.put(
  '/manage/:id',
  authorize('admin', 'hod', 'teacher'),
  mongoIdValidator,
  manageUserValidator,
  validate,
  userManagementController.updateUser
);
router.delete(
  '/manage/:id',
  authorize('admin', 'hod', 'teacher'),
  mongoIdValidator,
  validate,
  userManagementController.deleteUser
);
router.put(
  '/manage/:id/activate',
  authorize('admin', 'hod', 'teacher'),
  mongoIdValidator,
  validate,
  userManagementController.activateUser
);
router.put(
  '/manage/:id/deactivate',
  authorize('admin', 'hod', 'teacher'),
  mongoIdValidator,
  validate,
  userManagementController.deactivateUser
);

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
