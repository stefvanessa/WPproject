import { Router } from 'express';
import { createOutfit, getOutfits, deleteOutfit } from '../controllers/outfitController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/', isAuthenticated, createOutfit);
router.get('/', isAuthenticated, getOutfits);
router.delete('/:id', isAuthenticated, deleteOutfit);

export default router;
