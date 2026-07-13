import React from 'react';
import { Movie } from '../../../types/movie';
import FilmRail from './FilmRail';

interface RecommendationRowProps {
  title: string;
  movies: Movie[];
  icon?: string;
}

const RecommendationRow: React.FC<RecommendationRowProps> = ({ title, movies }) => <FilmRail movies={movies} title={title} />;

export default RecommendationRow;
