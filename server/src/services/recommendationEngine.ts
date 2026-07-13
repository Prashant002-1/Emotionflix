import pool from '../config/database';
import { discoverMovies, getPopularMovies, TMDBMovie } from './tmdbService';

export const EMOTION_KEYS = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'] as const;
export type EmotionKey = typeof EMOTION_KEYS[number];
export type EmotionScores = Record<EmotionKey, number>;

// Temporary cold-start priors inherited from the prototype. They are not product
// truth and must give way to learned personal relationships. See
// docs/EMOTIONAL_SIGNAL_MODEL.md before extending this map.
const EMOTION_GENRES: Record<EmotionKey, Record<number, number>> = {
  neutral: { 18: 0.7, 99: 0.8, 36: 0.55, 9648: 0.4 },
  happy: { 35: 0.95, 10402: 0.72, 16: 0.62, 10749: 0.58, 12: 0.42 },
  sad: { 18: 0.92, 10749: 0.72, 36: 0.52, 99: 0.46 },
  angry: { 80: 0.84, 53: 0.8, 28: 0.64, 37: 0.42 },
  fearful: { 27: 0.9, 53: 0.82, 9648: 0.78, 878: 0.46 },
  disgusted: { 80: 0.76, 27: 0.7, 99: 0.54, 53: 0.5 },
  surprised: { 878: 0.88, 14: 0.82, 9648: 0.68, 12: 0.6 },
};

const EMOTION_NAMES: Record<EmotionKey, string> = {
  neutral: 'stillness',
  happy: 'joy',
  sad: 'melancholy',
  angry: 'friction',
  fearful: 'tension',
  disgusted: 'unease',
  surprised: 'wonder',
};

interface DiarySignalRow extends EmotionScores {
  rating: number | null;
  watched_on: string;
  genre_ids: number[];
  movie_id: number;
}

interface WeightedGenre {
  id: number;
  name: string;
  weight: number;
}

export interface RecommendationProfile {
  source: 'popular' | 'signal' | 'diary' | 'diary_and_signal';
  historySize: number;
  dominantEmotions: { key: EmotionKey; weight: number }[];
  topGenres: WeightedGenre[];
}

export interface RankedMovie extends TMDBMovie {
  recommendation_reason?: string;
}

const addGenreWeight = (weights: Map<number, number>, genreId: number, weight: number) => {
  weights.set(genreId, (weights.get(genreId) || 0) + weight);
};

const normalizeScores = (scores: Partial<EmotionScores>): EmotionScores => {
  const total = EMOTION_KEYS.reduce((sum, key) => sum + Math.max(0, scores[key] || 0), 0);
  if (!total) return { neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0 };
  return Object.fromEntries(EMOTION_KEYS.map(key => [key, Math.max(0, scores[key] || 0) / total])) as EmotionScores;
};

const loadDiarySignals = async (userId?: number): Promise<DiarySignalRow[]> => {
  if (!userId) return [];
  const result = await pool.query(
    `SELECT de.movie_id, de.rating, de.watched_on,
            de.neutral::float, de.happy::float, de.sad::float, de.angry::float,
            de.fearful::float, de.disgusted::float, de.surprised::float,
            COALESCE(ARRAY_AGG(mg.genre_id) FILTER (WHERE mg.genre_id IS NOT NULL), ARRAY[]::integer[]) AS genre_ids
     FROM diary_entries de
     LEFT JOIN movie_genres mg ON mg.movie_id = de.movie_id
     WHERE de.user_id = $1
     GROUP BY de.id
     ORDER BY de.watched_on DESC, de.created_at DESC
     LIMIT 120`,
    [userId],
  );
  return result.rows;
};

const loadGenreNames = async (genreWeights: Map<number, number>): Promise<WeightedGenre[]> => {
  const ranked = [...genreWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (!ranked.length) return [];
  const names = await pool.query('SELECT id, name FROM genres WHERE id = ANY($1::int[])', [ranked.map(([id]) => id)]);
  const byId = new Map(names.rows.map(row => [row.id, row.name]));
  const max = ranked[0][1] || 1;
  return ranked.map(([id, weight]) => ({ id, name: byId.get(id) || `Genre ${id}`, weight: Number((weight / max).toFixed(3)) }));
};

export const buildRecommendationProfile = async (userId?: number, requestedSignal?: Partial<EmotionScores>) => {
  const entries = await loadDiarySignals(userId);
  const genreWeights = new Map<number, number>();
  const personalEmotionGenres = Object.fromEntries(
    EMOTION_KEYS.map(key => [key, new Map<number, number>()]),
  ) as Record<EmotionKey, Map<number, number>>;
  const emotionWeights: EmotionScores = { neutral: 0, happy: 0, sad: 0, angry: 0, fearful: 0, disgusted: 0, surprised: 0 };

  entries.forEach((entry, index) => {
    const recency = Math.max(0.35, 1 - index * 0.012);
    const rating = entry.rating ? 0.45 + (Number(entry.rating) / 5) * 0.75 : 0.7;
    const normalized = normalizeScores(entry);
    EMOTION_KEYS.forEach(key => { emotionWeights[key] += normalized[key] * recency * rating; });
    entry.genre_ids.forEach(genreId => {
      const emotionalSpecificity = 0.5 + Math.max(...EMOTION_KEYS.map(key => normalized[key]));
      addGenreWeight(genreWeights, genreId, recency * rating * emotionalSpecificity);
      EMOTION_KEYS.forEach(key => {
        addGenreWeight(personalEmotionGenres[key], genreId, normalized[key] * recency * rating);
      });
    });
  });

  const signal = requestedSignal ? normalizeScores(requestedSignal) : null;
  if (signal) {
    EMOTION_KEYS.forEach(key => {
      emotionWeights[key] += signal[key] * 2.2;
      personalEmotionGenres[key].forEach((affinity, genreId) => {
        addGenreWeight(genreWeights, genreId, signal[key] * affinity * 2.8);
      });
      Object.entries(EMOTION_GENRES[key]).forEach(([genreId, affinity]) => {
        addGenreWeight(genreWeights, Number(genreId), signal[key] * affinity * (entries.length ? 0.8 : 2.4));
      });
    });
  }

  if (!genreWeights.size && entries.length) {
    Object.entries(EMOTION_GENRES.neutral).forEach(([genreId, weight]) => addGenreWeight(genreWeights, Number(genreId), weight));
  }

  const totalEmotion = EMOTION_KEYS.reduce((sum, key) => sum + emotionWeights[key], 0) || 1;
  const dominantEmotions = EMOTION_KEYS
    .map(key => ({ key, weight: Number((emotionWeights[key] / totalEmotion).toFixed(3)) }))
    .filter(item => item.weight > 0.04)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);
  const topGenres = await loadGenreNames(genreWeights);
  const source: RecommendationProfile['source'] = entries.length && signal
    ? 'diary_and_signal'
    : entries.length
      ? 'diary'
      : signal
        ? 'signal'
        : 'popular';

  return {
    entries,
    genreWeights,
    profile: { source, historySize: entries.length, dominantEmotions, topGenres } satisfies RecommendationProfile,
  };
};

const scoreMovie = (movie: TMDBMovie, genreWeights: Map<number, number>): number => {
  const maxGenreWeight = Math.max(...genreWeights.values(), 1);
  const genreScore = (movie.genre_ids || []).reduce((sum, genreId) => sum + (genreWeights.get(genreId) || 0) / maxGenreWeight, 0);
  const quality = Math.min(1, (movie.vote_average || 0) / 10) * Math.min(1, Math.log10((movie.vote_count || 0) + 10) / 4);
  const discovery = Math.min(1, Math.log10((movie.popularity || 0) + 1) / 3.2);
  return genreScore * 0.62 + quality * 0.28 + discovery * 0.1;
};

const withReason = (movie: TMDBMovie, profile: RecommendationProfile): RankedMovie => {
  const matchingGenre = profile.topGenres.find(genre => movie.genre_ids?.includes(genre.id));
  const emotion = profile.dominantEmotions[0]?.key;
  const reason = matchingGenre && emotion
    ? `${matchingGenre.name} has carried the strongest ${EMOTION_NAMES[emotion]} entries in your diary.`
    : matchingGenre
      ? `Your diary returns to ${matchingGenre.name}.`
      : 'A well-rated step outside your usual pattern.';
  return { ...movie, recommendation_reason: reason };
};

const loadCommunityFilms = async (userId?: number): Promise<RankedMovie[]> => {
  const params: unknown[] = [];
  const exclusion = userId
    ? 'AND de.movie_id NOT IN (SELECT movie_id FROM diary_entries WHERE user_id = $1)'
    : '';
  if (userId) params.push(userId);
  const result = await pool.query(
    `SELECT m.tmdb_data, AVG(de.rating)::float AS community_rating, COUNT(*)::int AS entry_count
     FROM diary_entries de JOIN movies m ON m.id = de.movie_id
     WHERE de.visibility = 'public' ${exclusion}
     GROUP BY m.id, m.tmdb_data
     ORDER BY community_rating DESC NULLS LAST, entry_count DESC LIMIT 14`,
    params,
  );
  return result.rows
    .map(row => ({ ...(row.tmdb_data as TMDBMovie), recommendation_reason: `Shared publicly by ${row.entry_count} diar${row.entry_count === 1 ? 'ist' : 'ists'}.` }))
    .filter(movie => movie.poster_path);
};

export const recommend = async (userId?: number, signal?: Partial<EmotionScores>) => {
  const { entries, genreWeights, profile } = await buildRecommendationProfile(userId, signal);
  if (!genreWeights.size) {
    const popular = await getPopularMovies();
    return { profile, forYou: popular.results.slice(0, 18), adjacent: popular.results.slice(6, 18), community: await loadCommunityFilms(userId) };
  }

  const genreIds = [...genreWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => id);
  const pages = await Promise.all([1, 2, 3].map(page => discoverMovies(genreIds, page).catch(() => null)));
  const watched = new Set(entries.map(entry => entry.movie_id));
  const unique = new Map<number, TMDBMovie>();
  pages.flatMap(page => page?.results || []).forEach(movie => {
    if (!watched.has(movie.id) && movie.poster_path) unique.set(movie.id, movie);
  });

  const ranked = [...unique.values()].sort((a, b) => scoreMovie(b, genreWeights) - scoreMovie(a, genreWeights));
  const topGenreIds = new Set(genreIds.slice(0, 2));
  const adjacent = ranked
    .filter(movie => movie.genre_ids?.some(id => !topGenreIds.has(id)))
    .slice(12, 26)
    .map(movie => withReason(movie, profile));

  return {
    profile,
    forYou: ranked.slice(0, 18).map(movie => withReason(movie, profile)),
    adjacent,
    community: await loadCommunityFilms(userId),
  };
};
