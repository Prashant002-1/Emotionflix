import { EmotionScores } from './emotion';
import { Movie } from './movie';

export type DiaryVisibility = 'private' | 'public';

export interface DiaryEntry extends EmotionScores {
  id: number;
  user_id: number;
  username: string;
  movie_id: number;
  watched_on: string;
  note: string;
  expression_image_path: string | null;
  expression_image_alt: string | null;
  visibility: DiaryVisibility;
  created_at: string;
  reaction_count: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  genre_ids: number[];
}

export interface SavedFilm {
  id: number;
  movie_id: number;
  created_at: string;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  popularity: number;
  genre_ids: number[];
}

export interface DiarySummary extends EmotionScores {
  entries: number;
  public_entries: number;
  saved: number;
}

export interface DiaryEntryInput {
  movieId: number;
  watchedOn: string;
  note: string;
  expressionImage?: string | null;
  visibility: DiaryVisibility;
  emotions: EmotionScores;
}

export const diaryEntryMovie = (entry: DiaryEntry): Movie => ({
  id: entry.movie_id,
  title: entry.title,
  overview: entry.overview,
  release_date: entry.release_date,
  poster_path: entry.poster_path,
  backdrop_path: entry.backdrop_path,
  genre_ids: entry.genre_ids || [],
  popularity: entry.popularity || 0,
  vote_average: entry.vote_average || 0,
  vote_count: 0,
});

export const savedFilmMovie = (film: SavedFilm): Movie => ({
  id: film.movie_id,
  title: film.title,
  overview: film.overview,
  release_date: film.release_date,
  poster_path: film.poster_path,
  backdrop_path: film.backdrop_path,
  genre_ids: film.genre_ids || [],
  popularity: film.popularity || 0,
  vote_average: film.vote_average || 0,
  vote_count: 0,
});
