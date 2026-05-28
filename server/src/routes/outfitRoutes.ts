import { Router } from 'express';
import { createOutfit, getOutfits, updateOutfit, deleteOutfit, suggestOutfits } from '../controllers/outfitController';
import { isAuthenticated } from '../middleware/auth';

const router = Router();

router.post('/', isAuthenticated, createOutfit);
router.get('/', isAuthenticated, getOutfits);
router.post('/suggestions', isAuthenticated, suggestOutfits);
router.put('/:id', isAuthenticated, updateOutfit);
router.delete('/:id', isAuthenticated, deleteOutfit);

export default router;
