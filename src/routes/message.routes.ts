import { Router } from 'express';
import { messageController } from '../controllers/message.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createConversationValidator,
  sendMessageValidator,
  mongoIdValidator,
  paginationValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/conversations', createConversationValidator, validate, messageController.createConversation);
router.get('/conversations', paginationValidator, validate, messageController.getConversations);
router.post('/:conversationId', sendMessageValidator, validate, messageController.sendMessage);
router.get('/:conversationId', paginationValidator, validate, messageController.getMessages);
router.put('/:conversationId/read', mongoIdValidator, validate, messageController.markAsRead);

export default router;
