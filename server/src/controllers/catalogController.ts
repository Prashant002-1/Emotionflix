import { Request, Response } from 'express';
import { z } from 'zod';
import {
  getGenres,
  getMovieDetails,
  getPopularMovies,
  getRelatedMovies,
  getTrendingMovies,
  searchMovies,
} from '../services/tmdbService';
import { cacheMovie } from '../services/movieCacheService';

const pageSchema = z.coerce.number().int().min(1).max(100).default(1);

export const trending = async (req: Request, res: Response) => {
  try {
    res.json(await getTrendingMovies(pageSchema.parse(req.query.page)));
  } catch {
    res.status(502).json({ error: 'Trending films could not be loaded' });
  }
};

export const popular = async (req: Request, res: Response) => {
  try {
    res.json(await getPopularMovies(pageSchema.parse(req.query.page)));
  } catch {
    res.status(502).json({ error: 'Popular films could not be loaded' });
  }
};

export const genres = async (_req: Request, res: Response) => {
  try {
    res.json(await getGenres());
  } catch {
    res.status(502).json({ error: 'Genres could not be loaded' });
  }
};

export const search = async (req: Request, res: Response) => {
  try {
    const query = z.string().trim().min(1).max(120).parse(req.query.q);
    res.json(await searchMovies(query, pageSchema.parse(req.query.page)));
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Enter a film title' });
    res.status(502).json({ error: 'Film search could not be loaded' });
  }
};

export const movieDetails = async (req: Request, res: Response) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    const movie = await getMovieDetails(movieId);
    await cacheMovie(movie).catch(() => undefined);
    res.json(movie);
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid film ID' });
    res.status(404).json({ error: 'Film could not be found' });
  }
};

export const relatedMovies = async (req: Request, res: Response) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    res.json(await getRelatedMovies(movieId));
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid film ID' });
    res.status(502).json({ error: 'Related films could not be loaded' });
  }
};
