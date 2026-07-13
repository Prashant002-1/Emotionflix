import express from 'express';
import { getRecommendations } from '../controllers/recommendationController';
import { optionalAuthentication } from '../middleware/auth';

const router = express.Router();
router.post('/', optionalAuthentication, getRecommendations);

export default router;
