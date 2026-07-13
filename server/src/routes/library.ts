import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { listSaved, removeSavedFilm, saveFilm } from '../controllers/diaryController';

const router = express.Router();
router.use(authenticateToken);
router.get('/saved', listSaved);
router.post('/saved', saveFilm);
router.delete('/saved/:movieId', removeSavedFilm);

export default router;
