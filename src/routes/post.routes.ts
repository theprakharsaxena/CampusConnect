import { Router } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireActive } from '../middlewares/active.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/multer';
import {
  createPostValidator,
  updatePostValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/', requireActive, upload.array('images', 5), createPostValidator, validate, postController.create);
router.get('/feed', paginationValidator, validate, postController.getFeed);
router.get('/trending', postController.getTrending);
router.put('/:id', requireActive, updatePostValidator, validate, postController.update);
router.delete('/:id', requireActive, mongoIdValidator, validate, postController.delete);
router.post('/:id/like', requireActive, mongoIdValidator, validate, postController.like);
router.delete('/:id/like', requireActive, mongoIdValidator, validate, postController.unlike);

export default router;
