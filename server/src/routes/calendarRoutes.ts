import { Router } from 'express';
import { isAuthenticated } from '../middleware/auth';
import { getMonthEntries, upsertEntry, deleteEntry } from '../controllers/calendarController';

const router = Router();

router.get('/', isAuthenticated, getMonthEntries);
router.post('/', isAuthenticated, upsertEntry);
router.delete('/:id', isAuthenticated, deleteEntry);

export default router;
