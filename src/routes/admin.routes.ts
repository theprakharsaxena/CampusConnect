import { Router } from 'express';
import { adminController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { mongoIdValidator, paginationValidator } from '../validators';

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/users', paginationValidator, validate, adminController.getAllUsers);
router.get('/analytics', adminController.getAnalytics);
router.put('/users/:id/block', mongoIdValidator, validate, adminController.blockUser);
router.put('/users/:id/unblock', mongoIdValidator, validate, adminController.unblockUser);
router.delete('/users/:id', mongoIdValidator, validate, adminController.deleteUser);
router.delete('/posts/:id', mongoIdValidator, validate, adminController.deletePost);
router.delete('/opportunities/:id', mongoIdValidator, validate, adminController.deleteOpportunity);

export default router;
