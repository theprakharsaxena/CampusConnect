import { Router, Request, Response, NextFunction } from 'express';
import { postController } from '../controllers/post.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireActive } from '../middlewares/active.middleware';
import { validate } from '../middlewares/validate.middleware';
import { upload } from '../utils/multer';
import { sendError } from '../utils/response';
import {
  createPostValidator,
  updatePostValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

// ── Per-request timeout for post creation ──────────────────────────────────
// Cloudinary uploads can be slow. If the entire create request hasn't finished
// within 2 minutes we abort it cleanly rather than leaving the client hanging.
const POST_CREATE_TIMEOUT_MS = 2 * 60 * 1000; // 2 min

function withTimeout(ms: number) {
  return (_req: Request, res: Response, next: NextFunction): void => {
    const timer = setTimeout(() => {
      if (!res.headersSent) {
        sendError(res, 'Request timed out. Please try again.', 504);
      }
    }, ms);
    res.on('finish', () => clearTimeout(timer));
    res.on('close', () => clearTimeout(timer));
    next();
  };
}

// ── Early image-count guard ────────────────────────────────────────────────
// Rejects before multer even buffers anything if the client somehow sends
// more files than the allowed maximum.
const MAX_IMAGES = 5;

router.post(
  '/',
  requireActive,
  withTimeout(POST_CREATE_TIMEOUT_MS),
  upload.fields([
    { name: 'images', maxCount: MAX_IMAGES },
    { name: 'pdf', maxCount: 1 },
  ]),
  (req: Request, res: Response, next: NextFunction): void => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const images = files?.images;
    if (images && images.length > MAX_IMAGES) {
      sendError(res, `Too many images. Maximum is ${MAX_IMAGES}.`, 400);
      return;
    }
    next();
  },
  createPostValidator,
  validate,
  postController.create
);

router.get('/feed', paginationValidator, validate, postController.getFeed);
router.get('/trending', postController.getTrending);
router.get('/:id', mongoIdValidator, validate, postController.getById);
router.put(
  '/:id',
  requireActive,
  upload.fields([
    { name: 'images', maxCount: MAX_IMAGES },
    { name: 'pdf', maxCount: 1 },
  ]),
  (req: Request, res: Response, next: NextFunction): void => {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    const images = files?.images;
    if (images && images.length > MAX_IMAGES) {
      sendError(res, `Too many images. Maximum is ${MAX_IMAGES}.`, 400);
      return;
    }
    next();
  },
  updatePostValidator,
  validate,
  postController.update
);
router.delete('/:id', requireActive, mongoIdValidator, validate, postController.delete);
router.post('/:id/like', requireActive, mongoIdValidator, validate, postController.like);
router.delete('/:id/like', requireActive, mongoIdValidator, validate, postController.unlike);

export default router;
