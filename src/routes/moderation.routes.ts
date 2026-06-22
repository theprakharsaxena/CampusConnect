import { Router } from 'express';
import { moderationController } from '../controllers/moderation.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { requireActive } from '../middlewares/active.middleware';
import { validate } from '../middlewares/validate.middleware';
import { paginationValidator } from '../validators';

const router = Router();

router.use(authenticate);

// ── Reviewer endpoints (admin, hod, teacher) ────────────────────────────────

// GET /moderation/pending/:type — list pending content for review
router.get(
  '/pending/:type',
  authorize('admin', 'hod', 'teacher'),
  requireActive,
  paginationValidator,
  validate,
  moderationController.getPending
);

// PUT /moderation/:type/:id/approve — approve a piece of content
router.put(
  '/:type/:id/approve',
  authorize('admin', 'hod', 'teacher'),
  requireActive,
  moderationController.approve
);

// PUT /moderation/:type/:id/reject — reject a piece of content
router.put(
  '/:type/:id/reject',
  authorize('admin', 'hod', 'teacher'),
  requireActive,
  moderationController.reject
);

// ── User-facing endpoints (any authenticated user) ──────────────────────────

// GET /moderation/my/:type — view own content with status
router.get(
  '/my/:type',
  paginationValidator,
  validate,
  moderationController.getMyContent
);

export default router;
