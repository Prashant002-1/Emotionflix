import 'dotenv/config';
import { Pool, PoolClient } from 'pg';
import bcrypt from 'bcryptjs';
import axios from 'axios';

// Ensure required environment variables are available
const DATABASE_URL = process.env.DATABASE_URL;
const TMDB_API_KEY = process.env.TMDB_API_KEY;

if (!DATABASE_URL || !TMDB_API_KEY) {
  console.error('ERROR: DATABASE_URL and TMDB_API_KEY environment variables are required.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper to get movie details from TMDB
const getMovieDetails = async (movieId: number): Promise<any> => {
  const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
    params: { api_key: TMDB_API_KEY },
  });
  const movie = response.data as any;
  if (!movie.genre_ids?.length && movie.genres) {
    movie.genre_ids = movie.genres.map((g: any) => g.id);
  }
  return movie;
};

// Transactional movie search and cache helper
const resolveMovieByTitleAndYear = async (client: PoolClient, title: string, year: number): Promise<any> => {
  // Check if already in local db cache
  const existing = await client.query(
    "SELECT id, tmdb_data FROM movies WHERE title = $1 AND EXTRACT(YEAR FROM release_date) = $2",
    [title, year]
  );
  if (existing.rowCount && existing.rows[0].tmdb_data) {
    return existing.rows[0].tmdb_data;
  }

  // Otherwise search TMDB
  const response = await axios.get(`${TMDB_BASE_URL}/search/movie`, {
    params: {
      api_key: TMDB_API_KEY,
      query: title,
      primary_release_year: year
    }
  }) as any;

  const results = response.data.results || [];
  const filtered = results.filter((m: any) => {
    const releaseYear = m.release_date ? new Date(m.release_date).getFullYear() : null;
    return m.title.toLowerCase() === title.toLowerCase() && releaseYear === year;
  });

  let tmdbMovieId: number;
  if (filtered.length === 1) {
    tmdbMovieId = filtered[0].id;
  } else if (results.length > 0) {
    const firstResult = results[0];
    const releaseYear = firstResult.release_date ? new Date(firstResult.release_date).getFullYear() : null;
    if (releaseYear === year) {
      tmdbMovieId = firstResult.id;
    } else {
      throw new Error(`Ambiguous or unresolved search results for: "${title}" (${year})`);
    }
  } else {
    throw new Error(`No search results for: "${title}" (${year})`);
  }

  // Get full movie details and cache
  const movieDetails = await getMovieDetails(tmdbMovieId);
  const genreIds = movieDetails.genre_ids?.length ? movieDetails.genre_ids : movieDetails.genres?.map((g: any) => g.id) || [];

  await client.query(
    `INSERT INTO movies (id, title, overview, release_date, poster_path, backdrop_path, vote_average, vote_count, popularity, runtime, tmdb_data)
     VALUES ($1, $2, $3, NULLIF($4, '')::date, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       title = EXCLUDED.title,
       overview = EXCLUDED.overview,
       release_date = EXCLUDED.release_date,
       poster_path = EXCLUDED.poster_path,
       backdrop_path = EXCLUDED.backdrop_path,
       vote_average = EXCLUDED.vote_average,
       vote_count = EXCLUDED.vote_count,
       popularity = EXCLUDED.popularity,
       runtime = COALESCE(EXCLUDED.runtime, movies.runtime),
       tmdb_data = EXCLUDED.tmdb_data,
       last_updated = CURRENT_TIMESTAMP`,
    [
      movieDetails.id,
      movieDetails.title,
      movieDetails.overview || '',
      movieDetails.release_date || '',
      movieDetails.poster_path,
      movieDetails.backdrop_path,
      movieDetails.vote_average || 0,
      movieDetails.vote_count || 0,
      movieDetails.popularity || 0,
      movieDetails.runtime || null,
      JSON.stringify({ ...movieDetails, genre_ids: genreIds }),
    ],
  );

  for (const genreId of genreIds) {
    await client.query(
      `INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2)
       ON CONFLICT (movie_id, genre_id) DO NOTHING`,
      [movieDetails.id, genreId],
    );
  }

  return movieDetails;
};

// Handcrafted users manifest
const HANDCRAFTED_USERS = [
  {
    email: 'demo@demo.com',
    username: 'demo',
    password: 'demo123!',
    bio: 'Private cinephile trying to make sense of life\'s emotional waves through film history.',
    isDemo: true,
  },
  {
    email: 'clara@seed.emotionflix.com',
    username: 'clara_valdez',
    password: 'seed123!',
    bio: 'A lifelong habit of sitting in the dark to feel less alone. Drawn to films that leave you slightly bruised and quiet.',
    isDemo: false,
  },
  {
    email: 'marcus@seed.emotionflix.com',
    username: 'marcus_k',
    password: 'seed123!',
    bio: 'Looking for formal experimentation, complex puzzles, and bold sci-fi that makes the throat dry. The stranger the better.',
    isDemo: false,
  },
  {
    email: 'elena@seed.emotionflix.com',
    username: 'elena_r',
    password: 'seed123!',
    bio: 'Nostalgia is a dangerous thing. I seek out movies that capture the ache of passing time, first loves, and beautiful regrets.',
    isDemo: false,
  },
  {
    email: 'hiro@seed.emotionflix.com',
    username: 'hiro_s',
    password: 'seed123!',
    bio: 'Tension is the truest human emotion. I watch thrillers, mysteries, and film noirs to feel that slow, delicious sense of unease.',
    isDemo: false,
  },
  {
    email: 'chloe@seed.emotionflix.com',
    username: 'chloe_d',
    password: 'seed123!',
    bio: 'Vibrant animations and feel-good comedies. Life is heavy enough; I want films that spark light, laughter, and human warmth.',
    isDemo: false,
  },
  {
    email: 'devon@seed.emotionflix.com',
    username: 'devon_m',
    password: 'seed123!',
    bio: 'Obsessed with horror, slashers, and the macabre. The visceral thrill of confronting what we dread in the safety of a cinema.',
    isDemo: false,
  },
  {
    email: 'ananya@seed.emotionflix.com',
    username: 'ananya_sen',
    password: 'seed123!',
    bio: 'Documentaries, war, and historical epics. I value raw realism and films that make me angry about the state of our world.',
    isDemo: false,
  },
  {
    email: 'lucas@seed.emotionflix.com',
    username: 'lucas_v',
    password: 'seed123!',
    bio: 'Independent oddities, genre-bending scripts, and dark humor. If it\'s a bit broken and experimental, I\'m interested.',
    isDemo: false,
  },
  {
    email: 'sarah@seed.emotionflix.com',
    username: 'sarah_m',
    password: 'seed123!',
    bio: 'Classic Hollywood, black-and-white double features, and standard musicals. Seeking elegant pacing and theatricality.',
    isDemo: false,
  },
  {
    email: 'tariq@seed.emotionflix.com',
    username: 'tariq_a',
    password: 'seed123!',
    bio: 'Slow cinema, long takes, and environmental storytelling. Let me watch water pool, or wind move through leaves.',
    isDemo: false,
  },
  {
    email: 'rachel@seed.emotionflix.com',
    username: 'rachel_g',
    password: 'seed123!',
    bio: 'Psychological dramas that interrogate family dysfunction, secrets, and moral ambiguity. I like films that make you argue.',
    isDemo: false,
  },
];

// Helper to compile emotional mix
const emos = (neutral = 0.05, happy = 0.05, sad = 0.05, angry = 0.05, fearful = 0.05, disgusted = 0.05, surprised = 0.05) => {
  return { neutral, happy, sad, angry, fearful, disgusted, surprised };
};

// Handcrafted viewing history per user
const DIARY_SEED_ENTRIES: Record<string, { title: string; year: number; rating: number | null; note: string; visibility: 'private' | 'public'; emotions: ReturnType<typeof emos> }[]> = {
  'demo': [
    {
      title: 'Eternal Sunshine of the Spotless Mind', year: 2004, rating: 4.5,
      note: 'That final scene on the beach always gets me. The quiet acceptance of their own tragic loop is beautiful.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.75, 0.02, 0.01, 0.02, 0.05)
    },
    {
      title: 'Inception', year: 2010, rating: 4.0,
      note: 'The rotating hotel corridor scene is a technical marvel. It is the physical weight of the dream architecture that keeps the stakes feeling real.',
      visibility: 'public', emotions: emos(0.12, 0.03, 0.02, 0.01, 0.05, 0.02, 0.75)
    },
    {
      title: 'Spirited Away', year: 2001, rating: 5.0,
      note: 'The train ride across the water is one of my favorite sequences. It feels like a dream you have had but cannot quite remember.',
      visibility: 'public', emotions: emos(0.15, 0.05, 0.02, 0.01, 0.01, 0.01, 0.75)
    },
    {
      title: '2001: A Space Odyssey', year: 1968, rating: 4.5,
      note: 'The silence of the space walks. No music, just the breathing in the suit. It captures the vast indifference of the universe.',
      visibility: 'public', emotions: emos(0.8, 0.02, 0.05, 0.01, 0.05, 0.02, 0.05)
    },
    {
      title: 'Schindler\'s List', year: 1993, rating: 5.0,
      note: 'The scene with the red coat is the only color, and it hurts. The absolute bleakness is overwhelming.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.85, 0.05, 0.02, 0.01, 0.01)
    },
    {
      title: 'Before Sunrise', year: 1995, rating: null,
      note: 'The listening booth scene is so awkward and honest. The way they keep avoiding eye contact feels so true to that age.',
      visibility: 'private', emotions: emos(0.1, 0.75, 0.05, 0.01, 0.02, 0.02, 0.05)
    },
    {
      title: 'Before Sunset', year: 2004, rating: 4.5,
      note: 'The final moments in her apartment. The singer on the stereo and the ticking clock. The bittersweet reality of time passed.',
      visibility: 'private', emotions: emos(0.15, 0.1, 0.65, 0.02, 0.01, 0.02, 0.05)
    },
    {
      title: 'The Dark Knight', year: 2008, rating: null,
      note: 'The pencil trick scene is so sudden and jarring. Ledger\'s physical movements are erratic and terrifying.',
      visibility: 'private', emotions: emos(0.08, 0.02, 0.02, 0.78, 0.05, 0.02, 0.03)
    },
    {
      title: 'Pulp Fiction', year: 1994, rating: null,
      note: 'The adrenaline shot scene is pure kinetic tension. The dialogue is sharp but it is the pacing of that sequence that kills.',
      visibility: 'private', emotions: emos(0.05, 0.02, 0.02, 0.02, 0.1, 0.02, 0.77)
    },
    {
      title: 'The Godfather', year: 1972, rating: 5.0,
      note: 'The baptism sequence cross-cut with the murders. The contrast of the sacred and the violent is stunning.',
      visibility: 'private', emotions: emos(0.8, 0.02, 0.02, 0.05, 0.05, 0.02, 0.04)
    },
    {
      title: 'The Shining', year: 1980, rating: 4.0,
      note: 'The blood pouring from the elevator. The slow motion makes it look like paint. It is the stillness of the hotel that is scary.',
      visibility: 'private', emotions: emos(0.1, 0.01, 0.02, 0.02, 0.8, 0.03, 0.02)
    },
    {
      title: 'Parasite', year: 2019, rating: 4.5,
      note: 'The flood scene in the semi-basement apartment. The water mixed with sewage rising up. The physical reality of class.',
      visibility: 'private', emotions: emos(0.12, 0.02, 0.05, 0.05, 0.02, 0.04, 0.7)
    },
    {
      title: 'La La Land', year: 2016, rating: 4.0,
      note: 'The planetarium sequence where they dance in the air. A lovely homage, but the ending\'s compromise is what lingers.',
      visibility: 'private', emotions: emos(0.15, 0.15, 0.6, 0.02, 0.01, 0.02, 0.05)
    },
    {
      title: 'WALL-E', year: 2008, rating: 4.5,
      note: 'The dance in space with the fire extinguisher. The silence of the vacuum contrasted with the sparks.',
      visibility: 'private', emotions: emos(0.12, 0.7, 0.05, 0.01, 0.02, 0.02, 0.08)
    },
    {
      title: 'Alien', year: 1979, rating: 2.0,
      note: 'The chestburster is a great effect, but the middle section drags on this rewatch. The corridors feel too repetitive.',
      visibility: 'private', emotions: emos(0.1, 0.02, 0.05, 0.05, 0.7, 0.05, 0.03)
    },
    {
      title: 'The Silence of the Lambs', year: 1991, rating: 4.5,
      note: 'The night vision sequence in the basement. The green tint and the reaching hand in the dark. Pure claustrophobia.',
      visibility: 'private', emotions: emos(0.08, 0.01, 0.02, 0.01, 0.85, 0.02, 0.01)
    },
  ],
  'clara_valdez': [
    {
      title: 'Eternal Sunshine of the Spotless Mind', year: 2004, rating: 4.5,
      note: 'The beach scene with the crumbling house. It is that feeling of forgetting someone while desperately wanting to hold on.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.78, 0.01, 0.01, 0.02, 0.03)
    },
    {
      title: 'Schindler\'s List', year: 1993, rating: 5.0,
      note: 'The silence at the end of the film. The weight of history is too heavy to speak.',
      visibility: 'public', emotions: emos(0.15, 0.01, 0.8, 0.01, 0.01, 0.01, 0.01)
    },
    {
      title: 'Before Sunset', year: 2004, rating: 4.5,
      note: 'They have so little time, and they both know it. The urgency makes every conversation ache.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.75, 0.02, 0.01, 0.02, 0.05)
    },
    {
      title: 'The Godfather', year: 1972, rating: 4.5,
      note: 'The slow closing of the office door on Kay. The shadows swallow him up completely.',
      visibility: 'public', emotions: emos(0.78, 0.01, 0.1, 0.05, 0.02, 0.01, 0.03)
    },
    {
      title: 'WALL-E', year: 2008, rating: 4.0,
      note: 'The little robot holding his own hands. A sweet, simple moment of companionship that made me smile.',
      visibility: 'public', emotions: emos(0.12, 0.72, 0.05, 0.01, 0.01, 0.02, 0.07)
    },
    {
      title: 'Whiplash', year: 2014, rating: 4.0,
      note: 'The physical pain of his bleeding hands. The cost of ambition is shown as literal self-harm.',
      visibility: 'public', emotions: emos(0.08, 0.02, 0.7, 0.1, 0.05, 0.02, 0.03)
    },
    {
      title: 'Dunkirk', year: 2017, rating: 3.5,
      note: 'The soldiers standing on the beach waiting. The wide, grey emptiness of the sea is so cold.',
      visibility: 'private', emotions: emos(0.8, 0.01, 0.08, 0.02, 0.05, 0.02, 0.02)
    },
    {
      title: 'Before Sunrise', year: 1995, rating: null,
      note: 'The quiet look they share on the train before they part. It feels so temporary.',
      visibility: 'private', emotions: emos(0.1, 0.1, 0.65, 0.01, 0.02, 0.02, 0.1)
    },
    {
      title: 'Inception', year: 2010, rating: 2.0,
      note: 'The dreams feel too mechanical, like levels in a video game. I wanted more emotional resonance.',
      visibility: 'private', emotions: emos(0.2, 0.02, 0.65, 0.05, 0.03, 0.02, 0.03)
    },
  ],
  'marcus_k': [
    {
      title: 'Inception', year: 2010, rating: 5.0,
      note: 'The gravity shift in the hotel corridor. A brilliant piece of practical stunt work.',
      visibility: 'public', emotions: emos(0.1, 0.02, 0.01, 0.01, 0.05, 0.01, 0.8)
    },
    {
      title: 'Interstellar', year: 2014, rating: 4.5,
      note: 'The water planet giant wave. The scale of the horizon is terrifying and majestic.',
      visibility: 'public', emotions: emos(0.08, 0.02, 0.05, 0.01, 0.05, 0.01, 0.78)
    },
    {
      title: 'The Matrix', year: 1999, rating: 4.5,
      note: 'The green code rain on the screens. It defined an entire visual language for the digital age.',
      visibility: 'public', emotions: emos(0.12, 0.05, 0.01, 0.02, 0.02, 0.01, 0.77)
    },
    {
      title: 'Blade Runner 2049', year: 2017, rating: 4.0,
      note: 'The massive, decaying statues in the orange desert. The empty scale is mesmerizing.',
      visibility: 'public', emotions: emos(0.75, 0.01, 0.05, 0.01, 0.05, 0.05, 0.08)
    },
    {
      title: 'Star Wars', year: 1977, rating: 4.5,
      note: 'The binary sunset scene. The simple visual of two suns captures a universe of possibility.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.01, 0.01, 0.01, 0.01, 0.81)
    },
    {
      title: 'Titanic', year: 1997, rating: 4.0,
      note: 'The band playing on the deck while the ship tilts. An absolute tragedy that got to me.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.8, 0.02, 0.05, 0.01, 0.06)
    },
    {
      title: 'The Grand Budapest Hotel', year: 2014, rating: 4.0,
      note: 'The symmetry of the hotel lobby. Every frame feels like a curated postcard.',
      visibility: 'private', emotions: emos(0.1, 0.05, 0.02, 0.01, 0.02, 0.01, 0.79)
    },
    {
      title: 'Eternal Sunshine of the Spotless Mind', year: 2004, rating: null,
      note: 'The memory deletion machine sequence. The low-budget visual effects feel like stage magic.',
      visibility: 'private', emotions: emos(0.72, 0.02, 0.05, 0.01, 0.05, 0.05, 0.1)
    },
    {
      title: 'Toy Story', year: 1995, rating: null,
      note: 'The plastic textures of the toys look primitive now, but the staging of the escape is tight.',
      visibility: 'private', emotions: emos(0.75, 0.05, 0.01, 0.01, 0.02, 0.02, 0.14)
    },
  ],
  'elena_r': [
    {
      title: 'Before Sunrise', year: 1995, rating: 5.0,
      note: 'The record store listening booth. The stolen glances and the silence between them is magic.',
      visibility: 'public', emotions: emos(0.1, 0.75, 0.05, 0.01, 0.02, 0.01, 0.06)
    },
    {
      title: 'Before Sunset', year: 2004, rating: 4.5,
      note: 'Nine years later and the spark is still there. The ending in her apartment is perfect.',
      visibility: 'public', emotions: emos(0.15, 0.72, 0.05, 0.01, 0.01, 0.01, 0.05)
    },
    {
      title: 'La La Land', year: 2016, rating: 4.5,
      note: 'The final dream ballet. What could have been if they stayed together. It makes me cry.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.78, 0.01, 0.01, 0.01, 0.04)
    },
    {
      title: 'Amélie', year: 2001, rating: 4.5,
      note: 'Putting her hand in the sack of grain. The tactile pleasure of the small things in life.',
      visibility: 'public', emotions: emos(0.08, 0.78, 0.02, 0.01, 0.01, 0.01, 0.09)
    },
    {
      title: 'Get Out', year: 2017, rating: 4.0,
      note: 'The tea cup scraping and the sinking feeling. It was so tense it made me physically shudder.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.85, 0.03, 0.02)
    },
    {
      title: 'Eternal Sunshine of the Spotless Mind', year: 2004, rating: 4.0,
      note: 'The memories fading into white. The pain of loving someone and wishing you could forget them.',
      visibility: 'public', emotions: emos(0.12, 0.05, 0.75, 0.02, 0.01, 0.02, 0.03)
    },
    {
      title: 'Titanic', year: 1997, rating: 4.5,
      note: 'Rose letting go of Jack\'s hand in the freezing water. The silence of the cold night.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.82, 0.01, 0.05, 0.01, 0.05)
    },
    {
      title: 'Before Sunrise', year: 1995, rating: 5.0,
      note: 'Rewatched this. The chemistry is unmatched. Walking around Vienna in the night.',
      visibility: 'private', emotions: emos(0.1, 0.79, 0.02, 0.01, 0.01, 0.01, 0.06)
    },
    {
      title: 'Finding Nemo', year: 2003, rating: null,
      note: 'The colorful reef is lovely, but Dory\'s short-term memory loss is treated with sweet kindness.',
      visibility: 'private', emotions: emos(0.15, 0.65, 0.05, 0.01, 0.02, 0.02, 0.1)
    },
  ],
  'hiro_s': [
    {
      title: 'The Silence of the Lambs', year: 1991, rating: 5.0,
      note: 'The close-ups of Starling\'s face. You can feel the male gaze of the room pressing in on her.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.02, 0.01, 0.85, 0.03, 0.03)
    },
    {
      title: 'Psycho', year: 1960, rating: 4.5,
      note: 'The shower scene. The fast cuts and the screeching violins. It still feels modern and violent.',
      visibility: 'public', emotions: emos(0.04, 0.01, 0.02, 0.02, 0.88, 0.01, 0.02)
    },
    {
      title: 'Get Out', year: 2017, rating: 4.5,
      note: 'The scraping of the spoon on the tea cup. The sound design makes the hypnosis feel physical.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.84, 0.03, 0.03)
    },
    {
      title: 'Shutter Island', year: 2010, rating: 4.0,
      note: 'The ash falling in the dream scene. The visual decay of the room matches the mental collapse.',
      visibility: 'public', emotions: emos(0.1, 0.01, 0.05, 0.01, 0.78, 0.02, 0.03)
    },
    {
      title: 'The Shining', year: 1980, rating: 4.5,
      note: 'The low camera angles following the tricycle on the carpet. The sound shifts are jarring.',
      visibility: 'public', emotions: emos(0.08, 0.01, 0.02, 0.02, 0.82, 0.03, 0.02)
    },
    {
      title: 'Toy Story', year: 1995, rating: 4.0,
      note: 'The claw machine scene with the green aliens. Surprisingly charming and funny.',
      visibility: 'public', emotions: emos(0.12, 0.7, 0.02, 0.01, 0.05, 0.02, 0.08)
    },
    {
      title: 'Memento', year: 2000, rating: 4.0,
      note: 'The polaroid photo fading backward. The reverse chronology makes you feel his paranoia.',
      visibility: 'private', emotions: emos(0.78, 0.02, 0.05, 0.02, 0.05, 0.02, 0.06)
    },
    {
      title: 'Alien', year: 1979, rating: 4.5,
      note: 'The xenomorph hiding in the machinery. The pipes and the creature look identical. Dreadful.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.85, 0.03, 0.02)
    },
    {
      title: 'Parasite', year: 2019, rating: null,
      note: 'The reveal of the housekeeper\'s husband in the bunker. The sudden shift to horror.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.1, 0.78, 0.02)
    },
  ],
  'chloe_d': [
    {
      title: 'Toy Story', year: 1995, rating: 5.0,
      note: 'Woody and Buzz flying at the end. They are falling with style. Pure joy.',
      visibility: 'public', emotions: emos(0.05, 0.85, 0.02, 0.01, 0.01, 0.01, 0.05)
    },
    {
      title: 'Finding Nemo', year: 2003, rating: 4.5,
      note: 'The sea turtles riding the East Australian Current. The colors and speed are fantastic.',
      visibility: 'public', emotions: emos(0.08, 0.78, 0.02, 0.01, 0.01, 0.01, 0.09)
    },
    {
      title: 'WALL-E', year: 2008, rating: 4.5,
      note: 'WALL-E showing Eve his collection of human trinkets. The curiosity of the little robot is sweet.',
      visibility: 'public', emotions: emos(0.1, 0.75, 0.05, 0.01, 0.01, 0.01, 0.07)
    },
    {
      title: 'Coco', year: 2017, rating: 5.0,
      note: 'The bridge of marigold petals. The orange glow is so warm and beautiful.',
      visibility: 'public', emotions: emos(0.05, 0.1, 0.02, 0.01, 0.01, 0.01, 0.8)
    },
    {
      title: 'Schindler\'s List', year: 1993, rating: 5.0,
      note: 'The absolute horror of the camp liquidation. I felt completely devastated and angry.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.78, 0.1, 0.02, 0.02, 0.02)
    },
    {
      title: 'Amélie', year: 2001, rating: 4.5,
      note: 'The skipping stones on the Canal Saint-Martin. A lovely depiction of simple pleasures.',
      visibility: 'public', emotions: emos(0.08, 0.8, 0.02, 0.01, 0.01, 0.01, 0.07)
    },
    {
      title: 'Ratatouille', year: 2007, rating: 4.5,
      note: 'The critic Ego tasting the ratatouille and remembering his childhood. A beautiful moment.',
      visibility: 'private', emotions: emos(0.12, 0.75, 0.05, 0.01, 0.01, 0.01, 0.05)
    },
    {
      title: 'Spirited Away', year: 2001, rating: 4.0,
      note: 'The giant radish spirit in the elevator. The creature designs are so strange and delightful.',
      visibility: 'private', emotions: emos(0.1, 0.1, 0.02, 0.01, 0.02, 0.01, 0.74)
    },
    {
      title: 'Inception', year: 2010, rating: null,
      note: 'The folding city of Paris. Visually cool, but the rules are a bit too complicated to follow.',
      visibility: 'private', emotions: emos(0.12, 0.05, 0.02, 0.01, 0.02, 0.01, 0.77)
    },
  ],
  'devon_m': [
    {
      title: 'The Shining', year: 1980, rating: 5.0,
      note: 'The twin girls at the end of the hallway. The symmetry of the shot makes it twice as creepy.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.85, 0.03, 0.02)
    },
    {
      title: 'Hereditary', year: 2018, rating: 5.0,
      note: 'The telephone pole scene and the silence that follows. The dread is thick and suffocating.',
      visibility: 'public', emotions: emos(0.04, 0.01, 0.05, 0.02, 0.83, 0.03, 0.02)
    },
    {
      title: 'Psycho', year: 1960, rating: 4.5,
      note: 'The taxidermy birds in the motel office. The shadows they cast on the wall are ominous.',
      visibility: 'public', emotions: emos(0.08, 0.01, 0.02, 0.02, 0.81, 0.04, 0.02)
    },
    {
      title: 'Alien', year: 1979, rating: 4.5,
      note: 'The chestburster scene. The raw shock on the actors\' faces is real because they were not warned.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.05, 0.8, 0.05)
    },
    {
      title: 'Amélie', year: 2001, rating: 2.0,
      note: 'Too sweet for me normally, but the dark bedroom scenes with the photos had a weird charm.',
      visibility: 'public', emotions: emos(0.1, 0.65, 0.05, 0.05, 0.05, 0.05, 0.05)
    },
    {
      title: 'Get Out', year: 2017, rating: 4.0,
      note: 'The taxidermy deer head on the wall. A warning sign that Norman Bates would appreciate.',
      visibility: 'public', emotions: emos(0.08, 0.01, 0.02, 0.02, 0.81, 0.03, 0.03)
    },
    {
      title: 'The Silence of the Lambs', year: 1991, rating: 4.0,
      note: 'The night vision climax. The green hue makes it feel like we are trapped inside the killer\'s head.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.02, 0.01, 0.86, 0.03, 0.02)
    },
    {
      title: 'The Matrix', year: 1999, rating: 3.5,
      note: 'The scene where Neo\'s mouth is fused shut. The body horror element is the best part.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.05, 0.81, 0.04)
    },
    {
      title: 'Toy Story', year: 1995, rating: null,
      note: 'Sid\'s room of mutated toys. The baby head on spider legs is actually great horror design.',
      visibility: 'private', emotions: emos(0.05, 0.05, 0.02, 0.02, 0.05, 0.77, 0.04)
    },
  ],
  'ananya_sen': [
    {
      title: 'Schindler\'s List', year: 1993, rating: 5.0,
      note: 'The black-and-white filming makes it feel like raw historical footage. The brutality is sickening.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.82, 0.05, 0.02, 0.02, 0.03)
    },
    {
      title: 'Saving Private Ryan', year: 1998, rating: 4.5,
      note: 'The opening landing at Omaha Beach. The chaotic hand-held camera captures the raw terror of combat.',
      visibility: 'public', emotions: emos(0.04, 0.01, 0.05, 0.82, 0.05, 0.01, 0.02)
    },
    {
      title: 'Dunkirk', year: 2017, rating: 4.0,
      note: 'The timeline structure is cold and mechanical, but it effectively conveys the pressure of time.',
      visibility: 'public', emotions: emos(0.81, 0.01, 0.05, 0.02, 0.05, 0.01, 0.05)
    },
    {
      title: '1917', year: 2019, rating: 4.0,
      note: 'The illusion of the single take. It feels a bit like a technical gimmick but keeps you in the mud.',
      visibility: 'public', emotions: emos(0.79, 0.01, 0.05, 0.02, 0.05, 0.01, 0.07)
    },
    {
      title: 'Spirited Away', year: 2001, rating: 4.5,
      note: 'The bathhouse scenes. The level of detail in the spirits and the architecture is incredible.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.02, 0.01, 0.02, 0.01, 0.79)
    },
    {
      title: 'The Godfather', year: 1972, rating: 3.5,
      note: 'A well-acted family tragedy, but it romanticizes organized crime too much for my liking.',
      visibility: 'public', emotions: emos(0.78, 0.02, 0.05, 0.05, 0.02, 0.02, 0.06)
    },
    {
      title: 'Before Sunrise', year: 1995, rating: 2.5,
      note: 'Two privileged students walking around Vienna talking about themselves. Felt tedious.',
      visibility: 'private', emotions: emos(0.1, 0.05, 0.05, 0.72, 0.02, 0.02, 0.04)
    },
    {
      title: 'Inception', year: 2010, rating: null,
      note: 'The dream levels feel like rules in a board game. A cool puzzle, but very sterile.',
      visibility: 'private', emotions: emos(0.82, 0.02, 0.02, 0.02, 0.03, 0.01, 0.08)
    },
    {
      title: 'Dunkirk', year: 2017, rating: 4.0,
      note: 'Second time watching. The sound design is what carries it. The sirens of the planes are screeching.',
      visibility: 'private', emotions: emos(0.77, 0.01, 0.05, 0.02, 0.08, 0.02, 0.05)
    },
  ],
  'lucas_v': [
    {
      title: 'Eternal Sunshine of the Spotless Mind', year: 2004, rating: 5.0,
      note: 'The fading memories and the melting library. The surrealism captures the messy reality of love.',
      visibility: 'public', emotions: emos(0.08, 0.05, 0.02, 0.01, 0.02, 0.02, 0.8)
    },
    {
      title: 'The Grand Budapest Hotel', year: 2014, rating: 4.5,
      note: 'The snow chase sequence. The stylized model movements look like stop-motion animation. So quirky.',
      visibility: 'public', emotions: emos(0.12, 0.72, 0.02, 0.01, 0.02, 0.01, 0.1)
    },
    {
      title: 'Parasite', year: 2019, rating: 4.5,
      note: 'The peach fuzz allergy scene. The execution of the plan is like a silent comedy routine.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.02, 0.01, 0.02, 0.01, 0.79)
    },
    {
      title: 'Memento', year: 2000, rating: 4.0,
      note: 'The backward narrative. It forces you to share the protagonist\'s disorientation and paranoia.',
      visibility: 'public', emotions: emos(0.77, 0.02, 0.05, 0.02, 0.05, 0.03, 0.06)
    },
    {
      title: 'Saving Private Ryan', year: 1998, rating: 4.0,
      note: 'The final bridge defence. The death of the translator felt like a real, senseless tragedy.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.81, 0.05, 0.02, 0.01, 0.05)
    },
    {
      title: 'Knives Out', year: 2019, rating: 4.0,
      note: 'The inheritance reading scene. Craig\'s performance is hilarious, but the plotting is the star.',
      visibility: 'public', emotions: emos(0.1, 0.75, 0.02, 0.01, 0.02, 0.01, 0.09)
    },
    {
      title: 'WALL-E', year: 2008, rating: 4.0,
      note: 'The cockroach friend. A weird, funny companion that highlights the lonely setting.',
      visibility: 'private', emotions: emos(0.15, 0.7, 0.02, 0.01, 0.02, 0.02, 0.08)
    },
    {
      title: 'Get Out', year: 2017, rating: 4.0,
      note: 'The police officer scene at the end. The sudden shift in expectation is sharp and cynical.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.05, 0.81, 0.04)
    },
    {
      title: 'Titanic', year: 1997, rating: 2.0,
      note: 'The dialogue is so clunky. The visual effects are massive but the characters feel like cardboard.',
      visibility: 'private', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.02, 0.83, 0.05)
    },
  ],
  'sarah_m': [
    {
      title: 'La La Land', year: 2016, rating: 4.5,
      note: 'The opening dance on the highway ramp. The long take and the color palettes are so bright.',
      visibility: 'public', emotions: emos(0.08, 0.78, 0.02, 0.01, 0.01, 0.01, 0.09)
    },
    {
      title: 'Before Sunrise', year: 1995, rating: 4.0,
      note: 'The record store scene. The simple framing of their faces in that small space is lovely.',
      visibility: 'public', emotions: emos(0.1, 0.72, 0.05, 0.01, 0.02, 0.01, 0.09)
    },
    {
      title: 'The Godfather', year: 1972, rating: 4.5,
      note: 'The wedding scene at the start. The contrast of the sunny outdoors with the dark office.',
      visibility: 'public', emotions: emos(0.78, 0.02, 0.05, 0.05, 0.02, 0.02, 0.06)
    },
    {
      title: 'Amélie', year: 2001, rating: 4.0,
      note: 'The photobooth album mystery. A charming puzzle that captures the whimsical mood.',
      visibility: 'public', emotions: emos(0.1, 0.75, 0.02, 0.01, 0.02, 0.01, 0.09)
    },
    {
      title: 'Hereditary', year: 2018, rating: 4.0,
      note: 'The mother screaming on the ceiling in the corner. I had to sleep with the lights on.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.02, 0.02, 0.85, 0.03, 0.02)
    },
    {
      title: 'The Grand Budapest Hotel', year: 2014, rating: 4.0,
      note: 'Gustave reciting poetry on the train. The theatricality of the dialogue is wonderful.',
      visibility: 'public', emotions: emos(0.1, 0.73, 0.02, 0.01, 0.02, 0.01, 0.11)
    },
    {
      title: 'Titanic', year: 1997, rating: 4.0,
      note: 'The dinner in the third-class cabin. The dancing and the fiddle music feel so alive.',
      visibility: 'private', emotions: emos(0.08, 0.78, 0.02, 0.01, 0.02, 0.01, 0.08)
    },
    {
      title: 'Before Sunset', year: 2004, rating: null,
      note: 'Walking through the Parisian gardens. The tracking shots feel like we are walking with them.',
      visibility: 'private', emotions: emos(0.8, 0.05, 0.05, 0.01, 0.02, 0.02, 0.05)
    },
    {
      title: 'WALL-E', year: 2008, rating: null,
      note: 'The silent ballet in space. A beautiful, quiet moment that did not need any words.',
      visibility: 'private', emotions: emos(0.15, 0.7, 0.05, 0.01, 0.02, 0.02, 0.05)
    },
  ],
  'tariq_a': [
    {
      title: '2001: A Space Odyssey', year: 1968, rating: 5.0,
      note: 'The slow docking of the spacecraft to the Blue Danube. The silence of space is majestic.',
      visibility: 'public', emotions: emos(0.85, 0.01, 0.02, 0.01, 0.02, 0.01, 0.08)
    },
    {
      title: 'The Shining', year: 1980, rating: 4.0,
      note: 'The long tracking shots of the hallways. The hotel itself feels like it is breathing.',
      visibility: 'public', emotions: emos(0.79, 0.01, 0.05, 0.02, 0.05, 0.02, 0.06)
    },
    {
      title: 'Before Sunrise', year: 1995, rating: 4.0,
      note: 'The cemetery scene in Vienna. The quiet conversations about mortality feel very natural.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.77, 0.01, 0.02, 0.01, 0.04)
    },
    {
      title: 'The Godfather', year: 1972, rating: 4.5,
      note: 'The orange grove death scene. The quiet garden and the suddenness of his collapse.',
      visibility: 'public', emotions: emos(0.8, 0.02, 0.05, 0.02, 0.05, 0.02, 0.04)
    },
    {
      title: 'The Matrix', year: 1999, rating: 4.0,
      note: 'The lobby shootout scene. The slow motion and the falling concrete dust are gorgeous.',
      visibility: 'public', emotions: emos(0.1, 0.05, 0.02, 0.02, 0.05, 0.01, 0.75)
    },
    {
      title: 'Schindler\'s List', year: 1993, rating: 4.5,
      note: 'The scene where the Jews are forced to run naked in front of the doctors. Horrifying.',
      visibility: 'public', emotions: emos(0.08, 0.01, 0.8, 0.05, 0.02, 0.02, 0.02)
    },
    {
      title: 'Dunkirk', year: 2017, rating: 3.5,
      note: 'The aerial dogfights. The hum of the spitfire engines is the only soundtrack we need.',
      visibility: 'private', emotions: emos(0.78, 0.02, 0.05, 0.02, 0.05, 0.02, 0.06)
    },
    {
      title: '1917', year: 2019, rating: null,
      note: 'The night scene in the ruins of the French town. The flares lighting up the shadows.',
      visibility: 'private', emotions: emos(0.82, 0.01, 0.05, 0.02, 0.05, 0.01, 0.04)
    },
    {
      title: 'Before Sunset', year: 2004, rating: null,
      note: 'The boat ride on the Seine. The long takes make the conversation feel completely unedited.',
      visibility: 'private', emotions: emos(0.12, 0.05, 0.72, 0.02, 0.02, 0.01, 0.06)
    },
  ],
  'rachel_g': [
    {
      title: 'Whiplash', year: 2014, rating: 4.5,
      note: 'Fletcher throwing the chair at Andrew\'s head. The abuse is framed as dedication, which makes me angry.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.05, 0.82, 0.05, 0.01, 0.01)
    },
    {
      title: 'Schindler\'s List', year: 1993, rating: 5.0,
      note: 'Amon Goeth shooting prisoners from his balcony. The casual sadism is sickening.',
      visibility: 'public', emotions: emos(0.04, 0.01, 0.05, 0.85, 0.03, 0.01, 0.01)
    },
    {
      title: 'Parasite', year: 2019, rating: 4.5,
      note: 'The scene where the rich father holds his nose at the smell. The quiet insult is devastating.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.05, 0.81, 0.03, 0.04, 0.01)
    },
    {
      title: 'Saving Private Ryan', year: 1998, rating: 4.0,
      note: 'The scene where Mellish is slowly stabbed by the German soldier. The struggle is painful.',
      visibility: 'public', emotions: emos(0.05, 0.01, 0.8, 0.05, 0.05, 0.02, 0.02)
    },
    {
      title: 'Finding Nemo', year: 2003, rating: 4.0,
      note: 'The scene where Marlin finally lets Nemo go. A sweet moment of parental trust.',
      visibility: 'public', emotions: emos(0.1, 0.75, 0.05, 0.01, 0.02, 0.02, 0.05)
    },
    {
      title: 'The Godfather', year: 1972, rating: 4.5,
      note: 'Michael lying to Kay at the end about Carlo\'s death. The betrayal is absolute.',
      visibility: 'public', emotions: emos(0.08, 0.02, 0.78, 0.05, 0.02, 0.02, 0.03)
    },
    {
      title: 'Before Sunset', year: 2004, rating: 4.0,
      note: 'The car scene where she reaches out to touch his hair but pulls away. The frustration of years.',
      visibility: 'private', emotions: emos(0.08, 0.02, 0.8, 0.05, 0.01, 0.02, 0.02)
    },
    {
      title: 'The Dark Knight', year: 2008, rating: null,
      note: 'The hospital blowing up scene. The anarchy is fun but the societal decay is depressing.',
      visibility: 'private', emotions: emos(0.05, 0.02, 0.02, 0.81, 0.05, 0.02, 0.03)
    },
    {
      title: 'Eternal Sunshine of the Spotless Mind', year: 2004, rating: null,
      note: 'The fight in the apartment before she leaves. The bitter words that they both regret.',
      visibility: 'private', emotions: emos(0.1, 0.02, 0.78, 0.05, 0.01, 0.02, 0.02)
    },
  ],
};

// Curated list of saved films (Demo gets 9, Community gets 4 each)
const USER_SAVED_PLAN: Record<string, { title: string; year: number }[]> = {
  'demo': [
    { title: 'Inception', year: 2010 },
    { title: 'Interstellar', year: 2014 },
    { title: '2001: A Space Odyssey', year: 1968 },
    { title: 'Spirited Away', year: 2001 },
    { title: 'Eternal Sunshine of the Spotless Mind', year: 2004 },
    { title: 'The Godfather', year: 1972 },
    { title: 'Schindler\'s List', year: 1993 },
    { title: 'Before Sunrise', year: 1995 },
    { title: 'Alien', year: 1979 },
  ],
  'clara_valdez': [
    { title: 'The Godfather', year: 1972 },
    { title: 'Schindler\'s List', year: 1993 },
    { title: 'Eternal Sunshine of the Spotless Mind', year: 2004 },
    { title: 'Whiplash', year: 2014 }
  ],
  'marcus_k': [
    { title: 'Inception', year: 2010 },
    { title: 'Interstellar', year: 2014 },
    { title: 'The Matrix', year: 1999 },
    { title: 'Star Wars', year: 1977 }
  ],
  'elena_r': [
    { title: 'Before Sunrise', year: 1995 },
    { title: 'Before Sunset', year: 2004 },
    { title: 'La La Land', year: 2016 },
    { title: 'Amélie', year: 2001 }
  ],
  'hiro_s': [
    { title: 'The Silence of the Lambs', year: 1991 },
    { title: 'Psycho', year: 1960 },
    { title: 'Get Out', year: 2017 },
    { title: 'The Shining', year: 1980 }
  ],
  'chloe_d': [
    { title: 'Toy Story', year: 1995 },
    { title: 'Finding Nemo', year: 2003 },
    { title: 'WALL-E', year: 2008 },
    { title: 'Coco', year: 2017 }
  ],
  'devon_m': [
    { title: 'The Shining', year: 1980 },
    { title: 'Hereditary', year: 2018 },
    { title: 'Psycho', year: 1960 },
    { title: 'Alien', year: 1979 }
  ],
  'ananya_sen': [
    { title: 'Schindler\'s List', year: 1993 },
    { title: 'Saving Private Ryan', year: 1998 },
    { title: 'Dunkirk', year: 2017 },
    { title: '1917', year: 2019 }
  ],
  'lucas_v': [
    { title: 'Eternal Sunshine of the Spotless Mind', year: 2004 },
    { title: 'The Grand Budapest Hotel', year: 2014 },
    { title: 'Parasite', year: 2019 },
    { title: 'Memento', year: 2000 }
  ],
  'sarah_m': [
    { title: 'La La Land', year: 2016 },
    { title: 'Before Sunrise', year: 1995 },
    { title: 'The Godfather', year: 1972 },
    { title: 'Amélie', year: 2001 }
  ],
  'tariq_a': [
    { title: '2001: A Space Odyssey', year: 1968 },
    { title: 'The Shining', year: 1980 },
    { title: 'Before Sunrise', year: 1995 },
    { title: 'The Godfather', year: 1972 }
  ],
  'rachel_g': [
    { title: 'Whiplash', year: 2014 },
    { title: 'Schindler\'s List', year: 1993 },
    { title: 'Parasite', year: 2019 },
    { title: 'Saving Private Ryan', year: 1998 }
  ],
};

// Directed follows plan (Demo follows 3. Community follows 1-4. No self-follows)
const FOLLOW_PLAN = [
  // Demo (follows 3)
  { follower: 'demo', followed: 'clara_valdez' },
  { follower: 'demo', followed: 'marcus_k' },
  { follower: 'demo', followed: 'elena_r' },
  // Clara Valdez (follows 2)
  { follower: 'clara_valdez', followed: 'elena_r' },
  { follower: 'clara_valdez', followed: 'ananya_sen' },
  // Marcus Kim (follows 3)
  { follower: 'marcus_k', followed: 'hiro_s' },
  { follower: 'marcus_k', followed: 'chloe_d' },
  { follower: 'marcus_k', followed: 'lucas_v' },
  // Elena Rostova (follows 2)
  { follower: 'elena_r', followed: 'clara_valdez' },
  { follower: 'elena_r', followed: 'chloe_d' },
  // Hiroshi Sato (follows 1)
  { follower: 'hiro_s', followed: 'devon_m' },
  // Chloe Delaney (follows 2)
  { follower: 'chloe_d', followed: 'marcus_k' },
  { follower: 'chloe_d', followed: 'lucas_v' },
  // Devon Miller (follows 2)
  { follower: 'devon_m', followed: 'hiro_s' },
  { follower: 'devon_m', followed: 'lucas_v' },
  // Ananya Sen (follows 4)
  { follower: 'ananya_sen', followed: 'clara_valdez' },
  { follower: 'ananya_sen', followed: 'elena_r' },
  { follower: 'ananya_sen', followed: 'marcus_k' },
  { follower: 'ananya_sen', followed: 'lucas_v' },
  // Lucas Vance (follows 2)
  { follower: 'lucas_v', followed: 'chloe_d' },
  { follower: 'lucas_v', followed: 'devon_m' },
  // Sarah Jenkins (follows 2)
  { follower: 'sarah_m', followed: 'elena_r' },
  { follower: 'sarah_m', followed: 'chloe_d' },
  // Tariq Al-Fayed (follows 2)
  { follower: 'tariq_a', followed: 'clara_valdez' },
  { follower: 'tariq_a', followed: 'ananya_sen' },
  // Rachel Greenwald (follows 2)
  { follower: 'rachel_g', followed: 'ananya_sen' },
  { follower: 'rachel_g', followed: 'tariq_a' },
];

// Seed generator execution
const seed = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting seed transaction...');
    await client.query('BEGIN');

    // 1. Purge all legacy and current seed-owned users to ensure no community_user_* profiles remain
    const oldSeedUsersRes = await client.query(
      "SELECT id FROM users WHERE email LIKE '%@seed.emotionflix.com' OR email = 'demo@demo.com'"
    );
    const oldSeedUserIds = oldSeedUsersRes.rows.map(r => r.id);

    if (oldSeedUserIds.length > 0) {
      await client.query(
        `DELETE FROM entry_reactions 
         WHERE user_id = ANY($1) 
         OR entry_id IN (SELECT id FROM diary_entries WHERE user_id = ANY($1))`,
        [oldSeedUserIds]
      );
      await client.query(
        'DELETE FROM follows WHERE follower_id = ANY($1) OR followed_id = ANY($1)',
        [oldSeedUserIds]
      );
      await client.query('DELETE FROM saved_films WHERE user_id = ANY($1)', [oldSeedUserIds]);
      await client.query('DELETE FROM diary_entries WHERE user_id = ANY($1)', [oldSeedUserIds]);
      await client.query('DELETE FROM users WHERE id = ANY($1)', [oldSeedUserIds]);
      console.log(`Purged ${oldSeedUserIds.length} legacy/existing seed-owned users and their child records.`);
    }

    // 2. Setup seed-owned users (insert new curated personas)
    const emailToId: Record<string, number> = {};
    const usernameToId: Record<string, number> = {};

    for (const u of HANDCRAFTED_USERS) {
      const hashedPassword = await bcrypt.hash(u.password, 12);
      const res = await client.query(
        'INSERT INTO users (email, username, password_hash, bio) VALUES ($1, $2, $3, $4) RETURNING id',
        [u.email, u.username, hashedPassword, u.bio]
      );
      const userId = res.rows[0].id;
      console.log(`Created user: ${u.email} (ID: ${userId})`);
      emailToId[u.email] = userId;
      usernameToId[u.username] = userId;
    }

    // 3. Resolve and cache all movies needed through TMDB dynamically based on our manifest
    console.log('Resolving and caching movies from TMDB by Title and Year...');
    const movieCache: Record<string, any> = {};

    const allMoviesToResolve = new Set<string>();
    Object.values(DIARY_SEED_ENTRIES).flat().forEach(e => allMoviesToResolve.add(`${e.title}|||${e.year}`));
    Object.values(USER_SAVED_PLAN).flat().forEach(e => allMoviesToResolve.add(`${e.title}|||${e.year}`));

    for (const key of allMoviesToResolve) {
      const [title, yearStr] = key.split('|||');
      const year = parseInt(yearStr);
      try {
        const movie = await resolveMovieByTitleAndYear(client, title, year);
        movieCache[key] = movie;
      } catch (err: any) {
        console.error(`Failed to resolve movie unambiguously: "${title}" (${year})`, err.message);
        throw err;
      }
    }
    console.log(`Successfully resolved and cached ${allMoviesToResolve.size} movies.`);

    // 4. Generate & Insert Diary Entries
    // Mix capture methods: manual >= 85%, upload <= 10%, webcam <= 5%
    // In our loop, we use: index % 20 < 18: manual (90%), === 18: upload (5%), else webcam (5%)
    let diaryCount = 0;
    const allPlanEntries: { username: string; title: string; year: number; rating: number | null; note: string; visibility: 'private' | 'public'; emotions: ReturnType<typeof emos> }[] = [];
    for (const [username, entries] of Object.entries(DIARY_SEED_ENTRIES)) {
      for (const entry of entries) {
        allPlanEntries.push({ username, ...entry });
      }
    }

    // Shuffle entries slightly to interleave users and movies for feed diversity, 
    // but keep it deterministic using a simple pseudo-random sequence
    const seededShuffle = (arr: any[]) => {
      let seedVal = 88;
      const random = () => {
        const x = Math.sin(seedVal++) * 10000;
        return x - Math.floor(x);
      };
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };
    seededShuffle(allPlanEntries);

    const publicEntryIds: number[] = [];

    console.log(`Seeding ${allPlanEntries.length} diary entries...`);
    for (let i = 0; i < allPlanEntries.length; i++) {
      const plan = allPlanEntries[i];
      const userId = usernameToId[plan.username];
      const movieKey = `${plan.title}|||${plan.year}`;
      const movie = movieCache[movieKey];

      if (!movie) {
        throw new Error(`Movie not found in cache: "${plan.title}" (${plan.year})`);
      }

      // Determine date spread (over last 18 months, ~540 days)
      const date = new Date();
      const daysAgo = Math.floor((i / allPlanEntries.length) * 520) + 5;
      date.setDate(date.getDate() - daysAgo);
      const watchedOn = date.toISOString().split('T')[0];

      // Format created_at to align with watchedOn day but at a random time
      let timeSeed = i * 29 + 17;
      const timeRand = () => {
        const x = Math.sin(timeSeed++) * 10000;
        return x - Math.floor(x);
      };
      const hour = Math.floor(timeRand() * 12) + 8; // 8 AM to 8 PM
      const minute = Math.floor(timeRand() * 60);
      const createdAt = `${watchedOn} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

      // Determine capture method (to satisfy 85/10/5 ratio: 90% manual, 5% upload, 5% webcam)
      const methodIndex = i % 20;
      const captureMethod = methodIndex < 18 ? 'manual' : methodIndex === 18 ? 'upload' : 'webcam';
      // Manual entries are direct human reviewed and have confidence 1.0. Webcam/upload have standard numeric confidence.
      const confidence = captureMethod === 'manual' ? 1.0 : parseFloat((0.75 + timeRand() * 0.2).toFixed(3));

      const res = await client.query(
        `INSERT INTO diary_entries (
          user_id, movie_id, watched_on, rating, note, visibility,
          neutral, happy, sad, angry, fearful, disgusted, surprised, 
          capture_method, confidence, created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $16)
         RETURNING id`,
        [
          userId,
          movie.id,
          watchedOn,
          plan.rating,
          plan.note,
          plan.visibility,
          plan.emotions.neutral,
          plan.emotions.happy,
          plan.emotions.sad,
          plan.emotions.angry,
          plan.emotions.fearful,
          plan.emotions.disgusted,
          plan.emotions.surprised,
          captureMethod,
          confidence,
          createdAt,
        ]
      );
      const insertedId = parseInt(res.rows[0].id);
      if (plan.visibility === 'public') {
        publicEntryIds.push(insertedId);
      }
    }

    // 5. Generate & Insert Saved Films
    console.log('Seeding saved films...');
    for (const [username, savedFilms] of Object.entries(USER_SAVED_PLAN)) {
      const userId = usernameToId[username];
      for (const item of savedFilms) {
        const key = `${item.title}|||${item.year}`;
        const movie = movieCache[key];
        if (movie) {
          await client.query(
            `INSERT INTO saved_films (user_id, movie_id, created_at)
             VALUES ($1, $2, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id, movie_id) DO NOTHING`,
            [userId, movie.id]
          );
        }
      }
    }

    // 6. Generate & Insert Follows
    console.log('Seeding follows graph...');
    for (const link of FOLLOW_PLAN) {
      const followerId = usernameToId[link.follower];
      const followedId = usernameToId[link.followed];
      if (followerId && followedId && followerId !== followedId) {
        await client.query(
          `INSERT INTO follows (follower_id, followed_id, created_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (follower_id, followed_id) DO NOTHING`,
          [followerId, followedId]
        );
      }
    }

    // 7. Generate & Insert Reactions
    // React only to public entries. At least 25% must have none.
    // Each public entry gets 0 to 5 reactions.
    console.log('Seeding reactions...');
    let reactionCount = 0;
    const userIds = Object.values(emailToId);
    for (let idx = 0; idx < publicEntryIds.length; idx++) {
      const entryId = publicEntryIds[idx];

      // Get the author of this entry to prevent self-reaction
      const authorRes = await client.query('SELECT user_id FROM diary_entries WHERE id = $1', [entryId]);
      const authorId = authorRes.rows[0]?.user_id;

      // 30% chance of no reactions (meets >= 25% none check)
      if (idx % 10 >= 7) {
        continue;
      }

      // Pick a deterministic number of reactions between 1 and 5
      let rxSeed = idx * 47 + 101;
      const rxRand = () => {
        const x = Math.sin(rxSeed++) * 10000;
        return x - Math.floor(x);
      };
      const numReactions = Math.floor(rxRand() * 5) + 1;
      // Shuffle users (excluding author)
      const potentialReactors = userIds.filter(id => id !== authorId);
      for (let k = potentialReactors.length - 1; k > 0; k--) {
        const j = Math.floor(rxRand() * (k + 1));
        [potentialReactors[k], potentialReactors[j]] = [potentialReactors[j], potentialReactors[k]];
      }

      const reactors = potentialReactors.slice(0, numReactions);
      for (const reactorId of reactors) {
        await client.query(
          `INSERT INTO entry_reactions (user_id, entry_id, created_at)
           VALUES ($1, $2, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, entry_id) DO NOTHING`,
          [reactorId, entryId]
        );
        reactionCount++;
      }
    }

    await client.query('COMMIT');
    console.log('Seeding transaction committed successfully.');

    // 8. Report the resulting record counts
    const accountsCount = await pool.query('SELECT COUNT(*)::int FROM users');
    const moviesCount = await pool.query('SELECT COUNT(*)::int FROM movies');
    const diaryEntriesCount = await pool.query('SELECT COUNT(*)::int FROM diary_entries');
    const publicEntriesCount = await pool.query("SELECT COUNT(*)::int FROM diary_entries WHERE visibility = 'public'");
    const savedFilmsCount = await pool.query('SELECT COUNT(*)::int FROM saved_films');
    const followsCount = await pool.query('SELECT COUNT(*)::int FROM follows');
    const reactionsCount = await pool.query('SELECT COUNT(*)::int FROM entry_reactions');

    console.log('\n--- SEED DATA RECORD COUNTS ---');
    console.log(`Accounts:       ${accountsCount.rows[0].count}`);
    console.log(`Movies:         ${moviesCount.rows[0].count}`);
    console.log(`Diary Entries:  ${diaryEntriesCount.rows[0].count}`);
    console.log(`Public Entries: ${publicEntriesCount.rows[0].count}`);
    console.log(`Saved Films:    ${savedFilmsCount.rows[0].count}`);
    console.log(`Follows:        ${followsCount.rows[0].count}`);
    console.log(`Reactions:      ${reactionsCount.rows[0].count}`);
    console.log('-------------------------------\n');

    // 9. Report a review sample of 12 public entries with usernames, films, ratings, dominant traces, and notes
    const sampleRes = await client.query(`
      SELECT de.note, de.rating, de.neutral, de.happy, de.sad, de.angry, de.fearful, de.disgusted, de.surprised,
             u.username, m.title
      FROM diary_entries de
      JOIN users u ON u.id = de.user_id
      JOIN movies m ON m.id = de.movie_id
      WHERE de.visibility = 'public' AND de.note <> ''
      ORDER BY de.created_at DESC
      LIMIT 12
    `);
    
    console.log('\n--- SAMPLE PUBLIC ENTRIES REVIEW ---');
    sampleRes.rows.forEach((row, i) => {
      const emArr = [
        { name: 'stillness (neutral)', score: Number(row.neutral) },
        { name: 'joy (happy)', score: Number(row.happy) },
        { name: 'melancholy (sad)', score: Number(row.sad) },
        { name: 'friction (angry)', score: Number(row.angry) },
        { name: 'tension (fearful)', score: Number(row.fearful) },
        { name: 'unease (disgusted)', score: Number(row.disgusted) },
        { name: 'wonder (surprised)', score: Number(row.surprised) },
      ];
      const dominant = emArr.reduce((prev, current) => (prev.score > current.score) ? prev : current);
      console.log(`[${i + 1}] User: @${row.username} | Film: ${row.title} | Rating: ${row.rating !== null ? row.rating + ' stars' : 'Unrated'}`);
      console.log(`    Dominant Emotional Trace: ${dominant.name} (${dominant.score})`);
      console.log(`    Note: "${row.note}"\n`);
    });
    console.log('-------------------------------------\n');

  } catch (error) {
    console.log('Seeding encountered an error. Rolling back transaction...');
    await client.query('ROLLBACK');
    console.error('Seeding failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

void seed();
