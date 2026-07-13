import React from 'react';
import { Movie } from '../../../types/movie';
import { WatchedMovie } from '../../../types/emotion';
import FilmRail from './FilmRail';

interface MovieRowProps {
  title: string;
  movies: WatchedMovie[];
  showEmotions?: boolean;
  onLogEmotion?: (movieId: number) => void;
  detailsPath?: string;
}

const toMovie = (movie: WatchedMovie): Movie => ({
  id: movie.movieId,
  title: movie.title,
  overview: '',
  release_date: movie.release_date,
  poster_path: movie.poster_path,
  backdrop_path: null,
  genre_ids: movie.genre_ids,
  popularity: 0,
  vote_average: movie.vote_average,
  vote_count: 0,
  adult: false,
  original_language: 'en',
  original_title: movie.title,
  video: false,
});

const MovieRow: React.FC<MovieRowProps> = ({ title, movies, detailsPath }) => (
  <FilmRail linkLabel={detailsPath ? 'View all' : undefined} linkTo={detailsPath} movies={movies.map(toMovie)} title={title} />
);

export default MovieRow;
