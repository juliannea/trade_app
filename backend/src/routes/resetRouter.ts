import { Router } from 'express';
import * as ResetController from '../controllers/resetController';

const router = Router();

router.delete('/', ResetController.resetSwipesAndMatches);

export default router;