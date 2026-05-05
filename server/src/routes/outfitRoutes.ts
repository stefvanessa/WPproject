import { Router } from 'express';
import { createOutfit, getOutfits, deleteOutfit, suggestOutfits } from '../controllers/outfitController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/', isAuthenticated, createOutfit);
router.get('/', isAuthenticated, getOutfits);
router.post('/suggestions', isAuthenticated, suggestOutfits);
router.delete('/:id', isAuthenticated, deleteOutfit);

export default router;
