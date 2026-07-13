import express from 'express';
import { genres, movieDetails, popular, relatedMovies, search, trending } from '../controllers/catalogController';

const router = express.Router();

router.get('/trending', trending);
router.get('/popular', popular);
router.get('/genres', genres);
router.get('/search', search);
router.get('/movies/:movieId', movieDetails);
router.get('/movies/:movieId/related', relatedMovies);

export default router;
