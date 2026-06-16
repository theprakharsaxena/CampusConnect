import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { requireActive } from '../middlewares/active.middleware';
import {
  createCommentValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/:postId', requireActive, createCommentValidator, validate, commentController.add);
router.get('/:postId', paginationValidator, validate, commentController.getByPost);
router.delete('/:id', requireActive, mongoIdValidator, validate, commentController.delete);

export default router;
