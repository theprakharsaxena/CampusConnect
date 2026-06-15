import { Router } from 'express';
import { commentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCommentValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/:postId', createCommentValidator, validate, commentController.add);
router.get('/:postId', paginationValidator, validate, commentController.getByPost);
router.delete('/:id', mongoIdValidator, validate, commentController.delete);

export default router;
