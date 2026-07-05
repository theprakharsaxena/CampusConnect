import { Router, Request, Response } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import postRoutes from './post.routes';
import commentRoutes from './comment.routes';
import connectionRoutes from './connection.routes';
import opportunityRoutes from './opportunity.routes';
import eventRoutes from './event.routes';
import messageRoutes from './message.routes';
import feedRoutes, { notificationRouter } from './feed.routes';
import developerRoutes from './developer.routes';
import moderationRoutes from './moderation.routes';
import challengeRoutes from './challenge.routes';
import compilerRoutes from './compiler.routes';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/comments', commentRoutes);
router.use('/connections', connectionRoutes);
router.use('/opportunities', opportunityRoutes);
router.use('/events', eventRoutes);
router.use('/messages', messageRoutes);
router.use('/feed', feedRoutes);
router.use('/notifications', notificationRouter);
router.use('/developer', developerRoutes);
router.use('/moderation', moderationRoutes);
router.use('/challenges', challengeRoutes);
router.use('/compiler', compilerRoutes);

export default router;
