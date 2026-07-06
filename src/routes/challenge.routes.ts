import { Router } from 'express';
import { challengeController } from '../controllers/challenge.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { requireActive } from '../middlewares/active.middleware';

const router = Router();

router.use(authenticate, requireActive);

// GET  /challenges/today        — today's challenge
router.get('/today', challengeController.getToday);

// POST /challenges/submit       — submit answer
router.post('/submit', challengeController.submit);

// GET  /challenges/hint/:challengeId/:level  — get hint (level 1, 2, 3)
router.get('/hint/:challengeId/:level', challengeController.getHint);

// GET  /challenges/history      — past attempts
router.get('/history', challengeController.getHistory);

// GET  /challenges/learning-path — DSA topic roadmap with progress
router.get('/learning-path', challengeController.getLearningPath);

// GET  /challenges/all — get all challenges for study/practice
router.get('/all', challengeController.getAll);

export default router;
