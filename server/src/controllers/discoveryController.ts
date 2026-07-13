import { Response } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const limit = z.coerce.number().int().min(1).max(60).default(24).parse(req.query.limit);
    const viewerId = req.user?.id || null;
    const result = await pool.query(
      `SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.rating, de.note, de.created_at,
              de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
              de.fearful::float, de.disgusted::float, de.surprised::float,
              u.username, u.bio, m.title, m.poster_path, m.backdrop_path, m.release_date,
              CAST(m.vote_average AS FLOAT) AS vote_average,
              (SELECT COUNT(*)::int FROM entry_reactions er WHERE er.entry_id = de.id) AS reaction_count,
              CASE WHEN $1::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM entry_reactions er WHERE er.entry_id = de.id AND er.user_id = $1
              ) END AS reacted,
              CASE WHEN $1::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followed_id = de.user_id
              ) END AS following
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       JOIN movies m ON m.id = de.movie_id
       WHERE de.visibility = 'public'
       ORDER BY following DESC, de.created_at DESC
       LIMIT $2`,
      [viewerId, limit],
    );
    res.json({ entries: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid feed query' });
    res.status(500).json({ error: 'Community entries could not be loaded' });
  }
};

export const getFilmEntries = async (req: AuthRequest, res: Response) => {
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    const viewerId = req.user?.id || null;
    const result = await pool.query(
      `SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.rating, de.note, de.created_at,
              de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
              de.fearful::float, de.disgusted::float, de.surprised::float,
              u.username, u.bio, m.title, m.poster_path, m.backdrop_path, m.release_date,
              CAST(m.vote_average AS FLOAT) AS vote_average,
              (SELECT COUNT(*)::int FROM entry_reactions er WHERE er.entry_id = de.id) AS reaction_count,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM entry_reactions er WHERE er.entry_id = de.id AND er.user_id = $2
              ) END AS reacted,
              FALSE AS following
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       JOIN movies m ON m.id = de.movie_id
       WHERE de.visibility = 'public' AND de.movie_id = $1
       ORDER BY reaction_count DESC, de.created_at DESC LIMIT 24`,
      [movieId, viewerId],
    );
    res.json({ entries: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid film ID' });
    res.status(500).json({ error: 'Public film entries could not be loaded' });
  }
};

export const getPeople = async (req: AuthRequest, res: Response) => {
  try {
    const viewerId = req.user?.id || null;
    const result = await pool.query(
      `WITH viewer AS (
         SELECT AVG(neutral)::float AS neutral, AVG(happy)::float AS happy, AVG(sad)::float AS sad,
                AVG(angry)::float AS angry, AVG(fearful)::float AS fearful,
                AVG(disgusted)::float AS disgusted, AVG(surprised)::float AS surprised
         FROM diary_entries WHERE user_id = $1
       )
       SELECT u.id, u.username, u.bio,
              COUNT(de.id)::int AS entries,
              (SELECT COUNT(*)::int FROM follows followers WHERE followers.followed_id = u.id) AS followers,
              (SELECT COUNT(*)::int FROM follows following WHERE following.follower_id = u.id) AS following_count,
              AVG(de.neutral)::float AS neutral, AVG(de.happy)::float AS happy,
              AVG(de.sad)::float AS sad, AVG(de.angry)::float AS angry,
              AVG(de.fearful)::float AS fearful, AVG(de.disgusted)::float AS disgusted,
              AVG(de.surprised)::float AS surprised,
              CASE WHEN v.neutral IS NULL THEN NULL ELSE GREATEST(0, 1 - (
                ABS(AVG(de.neutral)::float - v.neutral) + ABS(AVG(de.happy)::float - v.happy) +
                ABS(AVG(de.sad)::float - v.sad) + ABS(AVG(de.angry)::float - v.angry) +
                ABS(AVG(de.fearful)::float - v.fearful) + ABS(AVG(de.disgusted)::float - v.disgusted) +
                ABS(AVG(de.surprised)::float - v.surprised)
              ) / 7) END AS pattern_overlap,
              CASE WHEN $1::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followed_id = u.id
              ) END AS following
       FROM users u JOIN diary_entries de ON de.user_id = u.id AND de.visibility = 'public'
       CROSS JOIN viewer v
       WHERE ($1::int IS NULL OR u.id <> $1)
       GROUP BY u.id, v.neutral, v.happy, v.sad, v.angry, v.fearful, v.disgusted, v.surprised
       ORDER BY following DESC, pattern_overlap DESC NULLS LAST, entries DESC, u.username ASC LIMIT 18`,
      [viewerId],
    );
    res.json({ people: result.rows });
  } catch {
    res.status(500).json({ error: 'People could not be loaded' });
  }
};

export const getPersonProfile = async (req: AuthRequest, res: Response) => {
  try {
    const username = z.string().trim().min(1).max(100).parse(req.params.username);
    const viewerId = req.user?.id || null;
    const person = await pool.query(
      `SELECT u.id, u.username, u.bio,
              COUNT(de.id)::int AS entries,
              (SELECT COUNT(*)::int FROM follows followers WHERE followers.followed_id = u.id) AS followers,
              (SELECT COUNT(*)::int FROM follows following WHERE following.follower_id = u.id) AS following_count,
              AVG(de.neutral)::float AS neutral, AVG(de.happy)::float AS happy,
              AVG(de.sad)::float AS sad, AVG(de.angry)::float AS angry,
              AVG(de.fearful)::float AS fearful, AVG(de.disgusted)::float AS disgusted,
              AVG(de.surprised)::float AS surprised,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followed_id = u.id
              ) END AS following
       FROM users u
       LEFT JOIN diary_entries de ON de.user_id = u.id AND de.visibility = 'public'
       WHERE LOWER(u.username) = LOWER($1)
       GROUP BY u.id`,
      [username, viewerId],
    );
    if (!person.rowCount) return res.status(404).json({ error: 'Member not found' });

    const entries = await pool.query(
      `SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.rating, de.note, de.created_at,
              de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
              de.fearful::float, de.disgusted::float, de.surprised::float,
              u.username, u.bio, m.title, m.poster_path, m.backdrop_path, m.release_date,
              CAST(m.vote_average AS FLOAT) AS vote_average,
              (SELECT COUNT(*)::int FROM entry_reactions er WHERE er.entry_id = de.id) AS reaction_count,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM entry_reactions er WHERE er.entry_id = de.id AND er.user_id = $2
              ) END AS reacted,
              FALSE AS following
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       JOIN movies m ON m.id = de.movie_id
       WHERE de.visibility = 'public' AND u.id = $1
       ORDER BY de.watched_on DESC, de.created_at DESC LIMIT 80`,
      [person.rows[0].id, viewerId],
    );

    res.json({ person: person.rows[0], entries: entries.rows });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid member name' });
    res.status(500).json({ error: 'Member profile could not be loaded' });
  }
};

export const followPerson = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const personId = z.coerce.number().int().positive().parse(req.params.personId);
    if (personId === req.user.id) return res.status(400).json({ error: 'You cannot follow yourself' });
    const exists = await pool.query('SELECT 1 FROM users WHERE id = $1', [personId]);
    if (!exists.rowCount) return res.status(404).json({ error: 'Person not found' });
    await pool.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, personId]);
    res.status(201).json({ following: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid person ID' });
    res.status(500).json({ error: 'Follow could not be saved' });
  }
};

export const unfollowPerson = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const personId = z.coerce.number().int().positive().parse(req.params.personId);
    await pool.query('DELETE FROM follows WHERE follower_id = $1 AND followed_id = $2', [req.user.id, personId]);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid person ID' });
    res.status(500).json({ error: 'Follow could not be removed' });
  }
};

export const reactToEntry = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const entryId = z.coerce.number().int().positive().parse(req.params.entryId);
    const entry = await pool.query("SELECT 1 FROM diary_entries WHERE id = $1 AND visibility = 'public'", [entryId]);
    if (!entry.rowCount) return res.status(404).json({ error: 'Entry not found' });
    await pool.query('INSERT INTO entry_reactions (user_id, entry_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [req.user.id, entryId]);
    res.status(201).json({ reacted: true });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid entry ID' });
    res.status(500).json({ error: 'Reaction could not be saved' });
  }
};

export const removeReaction = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const entryId = z.coerce.number().int().positive().parse(req.params.entryId);
    await pool.query('DELETE FROM entry_reactions WHERE user_id = $1 AND entry_id = $2', [req.user.id, entryId]);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid entry ID' });
    res.status(500).json({ error: 'Reaction could not be removed' });
  }
};
