import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { requireActive } from '../middlewares/active.middleware';
import {
  createConversationValidator,
  sendMessageValidator,
  paginationValidator,
  conversationIdParamValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post(
  '/conversations',
  requireActive,
  createConversationValidator,
  validate,
  messageController.createConversation
);
router.get('/conversations', paginationValidator, validate, messageController.getConversations);
router.post(
  '/:conversationId',
  requireActive,
  sendMessageValidator,
  validate,
  messageController.sendMessage
);
router.get(
  '/:conversationId',
  conversationIdParamValidator,
  paginationValidator,
  validate,
  messageController.getMessages
);
router.put(
  '/:conversationId/read',
  requireActive,
  conversationIdParamValidator,
  validate,
  messageController.markAsRead
);
router.delete(
  '/conversations/:conversationId',
  conversationIdParamValidator,
  validate,
  messageController.deleteConversation
);

export default router;
