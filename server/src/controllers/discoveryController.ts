import { Response } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const limit = z.coerce.number().int().min(1).max(60).default(24).parse(req.query.limit);
    const viewerId = req.user?.id || null;
    const result = await pool.query(
      `SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.note, de.created_at,
              de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
              de.fearful::float, de.disgusted::float, de.surprised::float,
              u.username, u.bio, m.title, m.poster_path, m.backdrop_path, m.release_date,
              em.asset_path AS expression_image_path,
              em.alt_text AS expression_image_alt,
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
       LEFT JOIN entry_media em ON em.entry_id = de.id AND em.kind = 'expression_photo'
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
      `SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.note, de.created_at,
              de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
              de.fearful::float, de.disgusted::float, de.surprised::float,
              u.username, u.bio, m.title, m.poster_path, m.backdrop_path, m.release_date,
              em.asset_path AS expression_image_path,
              em.alt_text AS expression_image_alt,
              (SELECT COUNT(*)::int FROM entry_reactions er WHERE er.entry_id = de.id) AS reaction_count,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM entry_reactions er WHERE er.entry_id = de.id AND er.user_id = $2
              ) END AS reacted,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followed_id = de.user_id
              ) END AS following
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       JOIN movies m ON m.id = de.movie_id
       LEFT JOIN entry_media em ON em.entry_id = de.id AND em.kind = 'expression_photo'
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
      `WITH viewer_entries AS (
         SELECT DISTINCT ON (movie_id) movie_id, neutral, happy, sad, angry, fearful, disgusted, surprised
         FROM diary_entries WHERE user_id = $1
         ORDER BY movie_id, watched_on DESC, created_at DESC
       ), public_latest AS (
         SELECT DISTINCT ON (user_id, movie_id)
                user_id, movie_id, neutral, happy, sad, angry, fearful, disgusted, surprised
         FROM diary_entries
         WHERE visibility = 'public'
         ORDER BY user_id, movie_id, watched_on DESC, created_at DESC
       ), latest_response AS (
         SELECT DISTINCT ON (de.user_id)
                de.user_id, de.movie_id AS latest_movie_id, de.note AS latest_note,
                m.title AS latest_title, m.poster_path AS latest_poster_path
         FROM diary_entries de
         JOIN movies m ON m.id = de.movie_id
         WHERE de.visibility = 'public'
         ORDER BY de.user_id, de.watched_on DESC, de.created_at DESC
       ), person_overlap AS (
         SELECT candidate.user_id, COUNT(*)::int AS shared_films,
                AVG(GREATEST(0, 1 - (
                  ABS(candidate.neutral - viewer.neutral) + ABS(candidate.happy - viewer.happy) +
                  ABS(candidate.sad - viewer.sad) + ABS(candidate.angry - viewer.angry) +
                  ABS(candidate.fearful - viewer.fearful) + ABS(candidate.disgusted - viewer.disgusted) +
                  ABS(candidate.surprised - viewer.surprised)
                ) / 7))::float AS pattern_overlap
         FROM public_latest candidate
         JOIN viewer_entries viewer ON viewer.movie_id = candidate.movie_id
         WHERE candidate.user_id <> $1
         GROUP BY candidate.user_id
       ), person_shared AS (
         SELECT DISTINCT ON (candidate.user_id)
                candidate.user_id, m.title AS shared_film_title
         FROM public_latest candidate
         JOIN viewer_entries viewer ON viewer.movie_id = candidate.movie_id
         JOIN movies m ON m.id = candidate.movie_id
         WHERE candidate.user_id <> $1
         ORDER BY candidate.user_id, (
           ABS(candidate.neutral - viewer.neutral) + ABS(candidate.happy - viewer.happy) +
           ABS(candidate.sad - viewer.sad) + ABS(candidate.angry - viewer.angry) +
           ABS(candidate.fearful - viewer.fearful) + ABS(candidate.disgusted - viewer.disgusted) +
           ABS(candidate.surprised - viewer.surprised)
         ) ASC
       )
       SELECT u.id, u.username, u.bio,
              COUNT(de.id)::int AS entries,
              (SELECT COUNT(*)::int FROM follows followers WHERE followers.followed_id = u.id) AS followers,
              (SELECT COUNT(*)::int FROM follows following WHERE following.follower_id = u.id) AS following_count,
              AVG(de.neutral)::float AS neutral, AVG(de.happy)::float AS happy,
              AVG(de.sad)::float AS sad, AVG(de.angry)::float AS angry,
              AVG(de.fearful)::float AS fearful, AVG(de.disgusted)::float AS disgusted,
              AVG(de.surprised)::float AS surprised,
              o.shared_films, o.pattern_overlap, shared.shared_film_title,
              latest.latest_movie_id, latest.latest_title, latest.latest_poster_path, latest.latest_note,
              CASE WHEN $1::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = $1 AND f.followed_id = u.id
              ) END AS following,
              CASE WHEN $1::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = u.id AND f.followed_id = $1
              ) END AS follows_you
       FROM users u JOIN diary_entries de ON de.user_id = u.id AND de.visibility = 'public'
       LEFT JOIN person_overlap o ON o.user_id = u.id
       LEFT JOIN person_shared shared ON shared.user_id = u.id
       LEFT JOIN latest_response latest ON latest.user_id = u.id
       WHERE ($1::int IS NULL OR u.id <> $1)
       GROUP BY u.id, o.shared_films, o.pattern_overlap, shared.shared_film_title,
                latest.latest_movie_id, latest.latest_title, latest.latest_poster_path, latest.latest_note
       ORDER BY following DESC, o.shared_films DESC NULLS LAST, pattern_overlap DESC NULLS LAST, entries DESC, u.username ASC LIMIT 18`,
      [viewerId],
    );
    res.json({ people: result.rows });
  } catch (error) {
    console.error('People discovery error:', error);
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
              (SELECT m.title
               FROM diary_entries candidate
               JOIN diary_entries viewer ON viewer.movie_id = candidate.movie_id AND viewer.user_id = $2
               JOIN movies m ON m.id = candidate.movie_id
               WHERE candidate.user_id = u.id AND candidate.visibility = 'public'
               ORDER BY (
                 ABS(candidate.neutral - viewer.neutral) + ABS(candidate.happy - viewer.happy) +
                 ABS(candidate.sad - viewer.sad) + ABS(candidate.angry - viewer.angry) +
                 ABS(candidate.fearful - viewer.fearful) + ABS(candidate.disgusted - viewer.disgusted) +
                 ABS(candidate.surprised - viewer.surprised)
               ) ASC LIMIT 1) AS shared_film_title,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = $2 AND f.followed_id = u.id
              ) END AS following,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM follows f WHERE f.follower_id = u.id AND f.followed_id = $2
              ) END AS follows_you
       FROM users u
       LEFT JOIN diary_entries de ON de.user_id = u.id AND de.visibility = 'public'
       WHERE LOWER(u.username) = LOWER($1)
       GROUP BY u.id`,
      [username, viewerId],
    );
    if (!person.rowCount) return res.status(404).json({ error: 'Member not found' });

    const entries = await pool.query(
      `SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.note, de.created_at,
              de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
              de.fearful::float, de.disgusted::float, de.surprised::float,
              u.username, u.bio, m.title, m.poster_path, m.backdrop_path, m.release_date,
              em.asset_path AS expression_image_path,
              em.alt_text AS expression_image_alt,
              (SELECT COUNT(*)::int FROM entry_reactions er WHERE er.entry_id = de.id) AS reaction_count,
              CASE WHEN $2::int IS NULL THEN FALSE ELSE EXISTS(
                SELECT 1 FROM entry_reactions er WHERE er.entry_id = de.id AND er.user_id = $2
              ) END AS reacted,
              FALSE AS following
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       JOIN movies m ON m.id = de.movie_id
       LEFT JOIN entry_media em ON em.entry_id = de.id AND em.kind = 'expression_photo'
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

export const getActivity = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    const limit = z.coerce.number().int().min(1).max(80).default(40).parse(req.query.limit);
    const result = await pool.query(
      `SELECT * FROM (
         SELECT 'reaction'::text AS kind, er.created_at,
                actor.id AS actor_id, actor.username,
                de.id AS entry_id, m.id AS movie_id, m.title, m.poster_path,
                de.note
         FROM entry_reactions er
         JOIN users actor ON actor.id = er.user_id
         JOIN diary_entries de ON de.id = er.entry_id
         JOIN movies m ON m.id = de.movie_id
         WHERE de.user_id = $1 AND actor.id <> $1

         UNION ALL

         SELECT 'follow'::text AS kind, f.created_at,
                actor.id AS actor_id, actor.username,
                NULL::bigint AS entry_id, NULL::integer AS movie_id,
                NULL::varchar AS title, NULL::varchar AS poster_path,
                NULL::varchar AS note
         FROM follows f
         JOIN users actor ON actor.id = f.follower_id
         WHERE f.followed_id = $1
       ) activity
       ORDER BY created_at DESC
       LIMIT $2`,
      [req.user.id, limit],
    );
    res.json({ activity: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid activity query' });
    console.error('Activity error:', error);
    res.status(500).json({ error: 'Activity could not be loaded' });
  }
};

export const getCommunityPulse = async (_req: AuthRequest, res: Response) => {
  try {
    const result = await pool.query(
      `WITH recent AS (
         SELECT de.id, de.user_id, de.movie_id, de.note, de.created_at,
                u.username, m.title, m.overview, m.release_date,
                m.poster_path, m.backdrop_path,
                ROW_NUMBER() OVER (PARTITION BY de.movie_id ORDER BY de.created_at DESC) AS recency
         FROM diary_entries de
         JOIN users u ON u.id = de.user_id
         JOIN movies m ON m.id = de.movie_id
         WHERE de.visibility = 'public'
       )
       SELECT movie_id, title, overview, release_date, poster_path, backdrop_path,
              COUNT(*)::int AS response_count,
              COUNT(DISTINCT user_id)::int AS people_count,
              MAX(created_at) AS latest_at,
              (ARRAY_AGG(username ORDER BY created_at DESC))[1] AS latest_username,
              (ARRAY_AGG(note ORDER BY created_at DESC) FILTER (WHERE note <> ''))[1] AS latest_note
       FROM recent
       GROUP BY movie_id, title, overview, release_date, poster_path, backdrop_path
       ORDER BY MAX(created_at) DESC, COUNT(DISTINCT user_id) DESC
       LIMIT 14`,
    );
    res.json({ films: result.rows });
  } catch (error) {
    console.error('Community pulse error:', error);
    res.status(500).json({ error: 'Community films could not be loaded' });
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
