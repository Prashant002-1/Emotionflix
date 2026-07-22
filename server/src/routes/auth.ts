import express from 'express';
import { openDemo } from '../controllers/demoController';

const router = express.Router();
router.post('/demo', openDemo);

export default router;
