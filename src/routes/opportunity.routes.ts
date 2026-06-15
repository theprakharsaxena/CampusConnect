import { Router } from 'express';
import { opportunityController } from '../controllers/opportunity.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createOpportunityValidator,
  opportunitySearchValidator,
  mongoIdValidator,
} from '../validators';

const router = Router();

router.use(authenticate);

router.post('/', createOpportunityValidator, validate, opportunityController.create);
router.get('/search', opportunitySearchValidator, validate, opportunityController.search);
router.get('/:id', mongoIdValidator, validate, opportunityController.getById);
router.put('/:id', mongoIdValidator, validate, opportunityController.update);
router.delete('/:id', mongoIdValidator, validate, opportunityController.delete);

export default router;
