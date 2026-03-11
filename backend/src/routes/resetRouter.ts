import { Router } from 'express';
import * as ResetController from '../controllers/resetController';

const router = Router();

router.delete('/', ResetController.resetSwipesAndMatches);

router.delete('/all', ResetController.resetAll);
export default router;