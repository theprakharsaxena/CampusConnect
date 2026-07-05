import { Router } from 'express';
import { compilerController } from '../controllers/compiler.controller';

const router = Router();

router.post('/execute', compilerController.execute);

export default router;
