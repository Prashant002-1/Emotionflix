import { Response } from 'express';
import { z } from 'zod';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { ensureMovie } from '../services/movieCacheService';

const emotionSchema = z.object({
  neutral: z.number().min(0).max(1),
  happy: z.number().min(0).max(1),
  sad: z.number().min(0).max(1),
  angry: z.number().min(0).max(1),
  fearful: z.number().min(0).max(1),
  disgusted: z.number().min(0).max(1),
  surprised: z.number().min(0).max(1),
});

const MAX_EXPRESSION_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_EXPRESSION_IMAGE_DATA_URL_LENGTH = 2_800_000;
const EXPRESSION_IMAGE_PATTERN = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

const hasExpectedImageSignature = (mime: string, bytes: Buffer) => {
  if (mime === 'jpeg') return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'png') return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  return bytes.length >= 12
    && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
    && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
};

const expressionImageSchema = z.string().max(MAX_EXPRESSION_IMAGE_DATA_URL_LENGTH).superRefine((value, ctx) => {
  const match = EXPRESSION_IMAGE_PATTERN.exec(value);
  if (!match) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expression image must be a JPEG, PNG, or WebP data URL' });
    return;
  }
  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length || bytes.length > MAX_EXPRESSION_IMAGE_BYTES) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expression image must be no larger than 2 MiB' });
    return;
  }
  if (!hasExpectedImageSignature(match[1], bytes)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Expression image bytes do not match the declared image type' });
  }
});

const entrySchema = z.object({
  movieId: z.number().int().positive(),
  watchedOn: z.string().date(),
  note: z.string().trim().max(2000).default(''),
  visibility: z.enum(['private', 'public']).default('private'),
  emotions: emotionSchema,
  expressionImage: expressionImageSchema.nullable().optional(),
});

const entryUpdateSchema = entrySchema.omit({ movieId: true }).partial();

const selectEntry = `
  SELECT de.id, de.user_id, de.movie_id, de.watched_on, de.note, de.visibility,
         de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
         de.fearful::float, de.disgusted::float, de.surprised::float,
         de.created_at, de.updated_at,
         u.username, m.title, m.overview, m.release_date, m.poster_path, m.backdrop_path,
         COALESCE((SELECT ARRAY_AGG(mg.genre_id ORDER BY mg.genre_id) FROM movie_genres mg WHERE mg.movie_id = m.id), ARRAY[]::integer[]) AS genre_ids,
         (SELECT COUNT(*)::int FROM entry_reactions er WHERE er.entry_id = de.id) AS reaction_count,
         em.asset_path AS expression_image_path,
         em.alt_text AS expression_image_alt
  FROM diary_entries de
  JOIN users u ON u.id = de.user_id
  JOIN movies m ON m.id = de.movie_id
  LEFT JOIN entry_media em ON em.entry_id = de.id AND em.kind = 'expression_photo'
`;

const requireUser = (req: AuthRequest, res: Response): number | null => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return req.user.id;
};

export const listEntries = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const limit = z.coerce.number().int().min(1).max(100).default(50).parse(req.query.limit);
    const result = await pool.query(`${selectEntry} WHERE de.user_id = $1 ORDER BY de.watched_on DESC, de.created_at DESC LIMIT $2`, [userId, limit]);
    res.json({ entries: result.rows });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid diary query' });
    res.status(500).json({ error: 'Diary entries could not be loaded' });
  }
};

export const createEntry = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const data = entrySchema.parse(req.body);
    await ensureMovie(data.movieId);
    const e = data.emotions;
    const entryId = await pool.transaction(async client => {
      const inserted = await client.query(
        `INSERT INTO diary_entries (
          user_id, movie_id, watched_on, rating, note, visibility,
          neutral, happy, sad, angry, fearful, disgusted, surprised
         ) VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         RETURNING id`,
        [userId, data.movieId, data.watchedOn, data.note, data.visibility,
          e.neutral, e.happy, e.sad, e.angry, e.fearful, e.disgusted, e.surprised],
      );
      const insertedEntryId = Number(inserted.rows[0].id);
      if (data.expressionImage) {
        await client.query(
          `INSERT INTO entry_media (entry_id, kind, asset_path, alt_text)
           VALUES ($1, 'expression_photo', $2, $3)`,
          [insertedEntryId, data.expressionImage, 'Expression photo shared with this response'],
        );
      }
      return insertedEntryId;
    });
    const result = await pool.query(`${selectEntry} WHERE de.id = $1`, [entryId]);
    res.status(201).json({ entry: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid diary entry', details: error.errors });
    res.status(500).json({ error: 'Diary entry could not be saved' });
  }
};

export const updateEntry = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;

  try {
    const entryId = z.coerce.number().int().positive().parse(req.params.entryId);
    const data = entryUpdateSchema.parse(req.body);
    const updates: string[] = [];
    const values: unknown[] = [entryId, userId];
    const add = (column: string, value: unknown) => {
      values.push(value);
      updates.push(`${column} = $${values.length}`);
    };

    if (data.watchedOn !== undefined) add('watched_on', data.watchedOn);
    if (data.note !== undefined) add('note', data.note);
    if (data.visibility !== undefined) add('visibility', data.visibility);
    if (data.emotions) Object.entries(data.emotions).forEach(([key, value]) => add(key, value));
    if (!updates.length && data.expressionImage === undefined) return res.status(400).json({ error: 'No diary changes supplied' });

    const updated = await pool.transaction(async client => {
      const result = updates.length
        ? await client.query(
          `UPDATE diary_entries SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 AND user_id = $2 RETURNING id`,
          values,
        )
        : await client.query(
          'UPDATE diary_entries SET updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND user_id = $2 RETURNING id',
          [entryId, userId],
        );
      if (result.rowCount && data.expressionImage !== undefined) {
        if (data.expressionImage === null) {
          await client.query("DELETE FROM entry_media WHERE entry_id = $1 AND kind = 'expression_photo'", [entryId]);
        } else {
          await client.query(
            `INSERT INTO entry_media (entry_id, kind, asset_path, alt_text)
             VALUES ($1, 'expression_photo', $2, $3)
             ON CONFLICT (entry_id, kind) DO UPDATE SET
               asset_path = EXCLUDED.asset_path,
               alt_text = EXCLUDED.alt_text,
               updated_at = CURRENT_TIMESTAMP`,
            [entryId, data.expressionImage, 'Expression photo shared with this response'],
          );
        }
      }
      return result;
    });
    if (!updated.rowCount) return res.status(404).json({ error: 'Diary entry not found' });
    const result = await pool.query(`${selectEntry} WHERE de.id = $1`, [entryId]);
    res.json({ entry: result.rows[0] });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid diary changes', details: error.errors });
    res.status(500).json({ error: 'Diary entry could not be updated' });
  }
};

export const deleteEntry = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const entryId = z.coerce.number().int().positive().parse(req.params.entryId);
    const result = await pool.query('DELETE FROM diary_entries WHERE id = $1 AND user_id = $2 RETURNING id', [entryId, userId]);
    if (!result.rowCount) return res.status(404).json({ error: 'Diary entry not found' });
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid diary entry ID' });
    res.status(500).json({ error: 'Diary entry could not be deleted' });
  }
};

export const getSummary = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const summary = await pool.query(
      `SELECT COUNT(*)::int AS entries,
              COUNT(*) FILTER (WHERE visibility = 'public')::int AS public_entries,
              AVG(neutral)::float AS neutral, AVG(happy)::float AS happy, AVG(sad)::float AS sad,
              AVG(angry)::float AS angry, AVG(fearful)::float AS fearful,
              AVG(disgusted)::float AS disgusted, AVG(surprised)::float AS surprised,
              (SELECT COUNT(*)::int FROM saved_films sf WHERE sf.user_id = $1) AS saved
       FROM diary_entries WHERE user_id = $1`,
      [userId],
    );
    res.json(summary.rows[0]);
  } catch {
    res.status(500).json({ error: 'Diary summary could not be loaded' });
  }
};

export const listSaved = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const result = await pool.query(
      `SELECT sf.id, sf.movie_id, sf.created_at, m.title, m.overview, m.release_date, m.poster_path, m.backdrop_path,
              COALESCE((SELECT ARRAY_AGG(mg.genre_id) FROM movie_genres mg WHERE mg.movie_id = m.id), ARRAY[]::integer[]) AS genre_ids
       FROM saved_films sf JOIN movies m ON m.id = sf.movie_id
       WHERE sf.user_id = $1 ORDER BY sf.created_at DESC`,
      [userId],
    );
    res.json({ films: result.rows });
  } catch {
    res.status(500).json({ error: 'Saved films could not be loaded' });
  }
};

export const saveFilm = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const movieId = z.number().int().positive().parse(req.body.movieId);
    await ensureMovie(movieId);
    await pool.query(
      `INSERT INTO saved_films (user_id, movie_id) VALUES ($1, $2)
       ON CONFLICT (user_id, movie_id) DO NOTHING`,
      [userId, movieId],
    );
    res.status(201).json({ movieId });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid film ID' });
    res.status(500).json({ error: 'Film could not be saved' });
  }
};

export const removeSavedFilm = async (req: AuthRequest, res: Response) => {
  const userId = requireUser(req, res);
  if (!userId) return;
  try {
    const movieId = z.coerce.number().int().positive().parse(req.params.movieId);
    await pool.query('DELETE FROM saved_films WHERE user_id = $1 AND movie_id = $2', [userId, movieId]);
    res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: 'Invalid film ID' });
    res.status(500).json({ error: 'Saved film could not be removed' });
  }
};
