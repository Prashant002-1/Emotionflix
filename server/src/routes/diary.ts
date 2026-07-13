import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { createEntry, deleteEntry, getSummary, listEntries, updateEntry } from '../controllers/diaryController';

const router = express.Router();
router.use(authenticateToken);
router.get('/', listEntries);
router.get('/summary', getSummary);
router.post('/', createEntry);
router.patch('/:entryId', updateEntry);
router.delete('/:entryId', deleteEntry);

export default router;
