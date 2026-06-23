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

// User management (admin, HOD — scoped by role)
router.get(
  '/manage/list',
  authorize('developer', 'hod'),
  paginationValidator,
  validate,
  userManagementController.getManageableUsers
);
router.get(
  '/manage/pending',
  authorize('developer', 'hod'),
  paginationValidator,
  validate,
  userManagementController.getPendingUsers
);
router.put(
  '/manage/:id',
  authorize('developer', 'hod'),
  mongoIdValidator,
  manageUserValidator,
  validate,
  userManagementController.updateUser
);
router.delete(
  '/manage/:id',
  authorize('developer', 'hod'),
  mongoIdValidator,
  validate,
  userManagementController.deleteUser
);
router.put(
  '/manage/:id/activate',
  authorize('developer', 'hod'),
  mongoIdValidator,
  validate,
  userManagementController.activateUser
);
router.put(
  '/manage/:id/deactivate',
  authorize('developer', 'hod'),
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
