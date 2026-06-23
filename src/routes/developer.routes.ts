import { Router } from 'express';
import { developerController } from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { mongoIdValidator, paginationValidator } from '../validators';

const router = Router();

router.use(authenticate, authorize('developer', 'hod'));

router.get('/users', paginationValidator, validate, developerController.getAllUsers);
router.get('/analytics', developerController.getAnalytics);
router.put('/users/:id/block', mongoIdValidator, validate, developerController.blockUser);
router.put('/users/:id/unblock', mongoIdValidator, validate, developerController.unblockUser);
router.delete('/users/:id', mongoIdValidator, validate, developerController.deleteUser);
router.delete('/posts/:id', mongoIdValidator, validate, developerController.deletePost);
router.delete('/opportunities/:id', mongoIdValidator, validate, developerController.deleteOpportunity);

export default router;
