import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emotionflix',
});

// TMDB API configuration
const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
  runtime?: number;
}

interface EmotionScores {
  neutral: number;
  happy: number;
  sad: number;
  angry: number;
  fearful: number;
  disgusted: number;
  surprised: number;
}

// Test user credentials
const TEST_USER = {
  email: 'test@test.com',
  username: 'testuser',
  password: 'testtest123!'
};

// Emotion patterns for different movie genres
const EMOTION_PATTERNS: { [key: string]: Partial<EmotionScores> } = {
  action: { happy: 0.3, surprised: 0.4, fearful: 0.2, neutral: 0.1, sad: 0, angry: 0, disgusted: 0 },
  comedy: { happy: 0.7, surprised: 0.2, neutral: 0.1, sad: 0, angry: 0, fearful: 0, disgusted: 0 },
  drama: { sad: 0.4, neutral: 0.4, happy: 0.2, angry: 0, fearful: 0, disgusted: 0, surprised: 0 },
  horror: { fearful: 0.6, surprised: 0.3, disgusted: 0.1, happy: 0, sad: 0, angry: 0, neutral: 0 },
  romance: { happy: 0.5, sad: 0.3, neutral: 0.2, angry: 0, fearful: 0, disgusted: 0, surprised: 0 },
  thriller: { fearful: 0.4, surprised: 0.3, angry: 0.2, neutral: 0.1, happy: 0, sad: 0, disgusted: 0 },
  sciFi: { surprised: 0.5, fearful: 0.3, neutral: 0.2, happy: 0, sad: 0, angry: 0, disgusted: 0 },
  animation: { happy: 0.6, surprised: 0.3, neutral: 0.1, sad: 0, angry: 0, fearful: 0, disgusted: 0 },
  documentary: { neutral: 0.6, surprised: 0.3, sad: 0.1, happy: 0, angry: 0, fearful: 0, disgusted: 0 },
  war: { angry: 0.4, sad: 0.4, fearful: 0.2, happy: 0, neutral: 0, disgusted: 0, surprised: 0 }
};

// Genre mapping for emotion patterns
const GENRE_TO_EMOTION_PATTERN: { [key: number]: keyof typeof EMOTION_PATTERNS } = {
  28: 'action',    // Action
  12: 'action',    // Adventure
  16: 'animation', // Animation
  35: 'comedy',    // Comedy
  80: 'thriller',  // Crime
  99: 'documentary', // Documentary
  18: 'drama',     // Drama
  10751: 'animation', // Family
  14: 'sciFi',     // Fantasy
  36: 'drama',     // History
  27: 'horror',    // Horror
  10402: 'comedy', // Music
  9648: 'thriller', // Mystery
  10749: 'romance', // Romance
  878: 'sciFi',    // Science Fiction
  10770: 'drama',  // TV Movie
  53: 'thriller',  // Thriller
  10752: 'war',    // War
  37: 'action'     // Western
};

// Helper function to generate realistic emotion scores
function generateEmotionScores(genreIds: number[]): EmotionScores {
  // Find the primary genre and get its emotion pattern
  const primaryGenre = genreIds[0];
  const patternKey = GENRE_TO_EMOTION_PATTERN[primaryGenre] || 'drama';
  const basePattern = EMOTION_PATTERNS[patternKey];
  
  // Add some randomness to make it more realistic
  const scores: EmotionScores = {
    neutral: Math.max(0, Math.min(1, (basePattern.neutral || 0) + (Math.random() - 0.5) * 0.3)),
    happy: Math.max(0, Math.min(1, (basePattern.happy || 0) + (Math.random() - 0.5) * 0.3)),
    sad: Math.max(0, Math.min(1, (basePattern.sad || 0) + (Math.random() - 0.5) * 0.3)),
    angry: Math.max(0, Math.min(1, (basePattern.angry || 0) + (Math.random() - 0.5) * 0.3)),
    fearful: Math.max(0, Math.min(1, (basePattern.fearful || 0) + (Math.random() - 0.5) * 0.3)),
    disgusted: Math.max(0, Math.min(1, (basePattern.disgusted || 0) + (Math.random() - 0.5) * 0.3)),
    surprised: Math.max(0, Math.min(1, (basePattern.surprised || 0) + (Math.random() - 0.5) * 0.3))
  };
  
  // Normalize scores to sum to 1
  const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
  Object.keys(scores).forEach(key => {
    scores[key as keyof EmotionScores] = scores[key as keyof EmotionScores] / total;
  });
  
  return scores;
}

// Helper function to fetch movies from TMDB
async function fetchMoviesFromTMDB(count: number): Promise<TMDBMovie[]> {
  const movies: TMDBMovie[] = [];
  const pages = Math.ceil(count / 20); // TMDB returns 20 movies per page
  
  for (let page = 1; page <= pages && movies.length < count; page++) {
    try {
      const response = await axios.get(`${TMDB_BASE_URL}/movie/popular`, {
        params: {
          api_key: TMDB_API_KEY,
          page: page,
          language: 'en-US'
        }
      });
      
      const data = response.data as { results: TMDBMovie[] };
      const pageMovies = data.results.slice(0, count - movies.length);
      movies.push(...pageMovies);
      
      // Add a small delay to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error fetching movies from page ${page}:`, error);
      break;
    }
  }
  
  return movies;
}

// Helper function to get movie details including genres
async function getMovieDetails(movieId: number): Promise<TMDBMovie | null> {
  try {
    const response = await axios.get(`${TMDB_BASE_URL}/movie/${movieId}`, {
      params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
      }
    });
    
    return response.data as TMDBMovie;
  } catch (error) {
    console.error(`Error fetching movie details for ID ${movieId}:`, error);
    return null;
  }
}

// Main seeding function
async function seedTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting test data seeding...');
    
    // 1. Create or get test user
    console.log('📝 Checking for existing test user...');
    let userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [TEST_USER.email]
    );
    
    let userId: number;
    
    if (userResult.rows.length > 0) {
      userId = userResult.rows[0].id;
      console.log(`✅ Found existing test user with ID: ${userId}`);
      console.log(`📧 Email: ${TEST_USER.email}`);
      console.log(`🔑 Password: ${TEST_USER.password}`);
    } else {
      console.log('📝 Creating new test user...');
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      
      userResult = await client.query(
        'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [TEST_USER.email, TEST_USER.username, hashedPassword]
      );
      
      userId = userResult.rows[0].id;
      console.log(`✅ Test user created with ID: ${userId}`);
      console.log(`📧 Email: ${TEST_USER.email}`);
      console.log(`🔑 Password: ${TEST_USER.password}`);
    }
    
    // 2. Fetch movies from TMDB
    console.log('🎬 Fetching movies from TMDB...');
    const movies = await fetchMoviesFromTMDB(100);
    console.log(`✅ Fetched ${movies.length} movies from TMDB`);
    
    // 3. Insert movies into database
    console.log('💾 Inserting movies into database...');
    for (const movie of movies) {
      // Get detailed movie info including genres
      const movieDetails = await getMovieDetails(movie.id);
      if (!movieDetails) continue;
      
      // Insert movie
      await client.query(
        `INSERT INTO movies (id, title, overview, release_date, poster_path, backdrop_path, vote_average, vote_count, popularity, runtime, tmdb_data)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         overview = EXCLUDED.overview,
         release_date = EXCLUDED.release_date,
         poster_path = EXCLUDED.poster_path,
         backdrop_path = EXCLUDED.backdrop_path,
         vote_average = EXCLUDED.vote_average,
         vote_count = EXCLUDED.vote_count,
         popularity = EXCLUDED.popularity,
         runtime = EXCLUDED.runtime,
         tmdb_data = EXCLUDED.tmdb_data,
         last_updated = CURRENT_TIMESTAMP`,
        [
          movie.id,
          movie.title,
          movie.overview,
          movie.release_date,
          movie.poster_path,
          movie.backdrop_path,
          movie.vote_average,
          movie.vote_count,
          movie.popularity,
          movie.runtime || null,
          JSON.stringify(movie)
        ]
      );
      
      // Insert movie-genre relationships
      for (const genreId of movie.genre_ids) {
        await client.query(
          'INSERT INTO movie_genres (movie_id, genre_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [movie.id, genreId]
        );
      }
    }
    console.log('✅ Movies inserted successfully');
    
    // 4. Create user emotion profile
    console.log('😊 Creating user emotion profile...');
    await client.query(
      `INSERT INTO user_emotion_profiles (user_id, neutral, happy, sad, angry, fearful, disgusted, surprised)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (user_id) DO UPDATE SET
       neutral = EXCLUDED.neutral,
       happy = EXCLUDED.happy,
       sad = EXCLUDED.sad,
       angry = EXCLUDED.angry,
       fearful = EXCLUDED.fearful,
       disgusted = EXCLUDED.disgusted,
       surprised = EXCLUDED.surprised,
       last_updated = CURRENT_TIMESTAMP`,
      [userId, 0.2, 0.3, 0.1, 0.1, 0.1, 0.05, 0.15]
    );
    
    // 5. Create user emotion mappings
    console.log('🗺️ Creating user emotion mappings...');
    const emotions = ['happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'];
    const genres = [28, 12, 16, 35, 80, 99, 18, 10751, 14, 36, 27, 10402, 9648, 10749, 878, 10770, 53, 10752, 37];
    
    for (const emotion of emotions) {
      for (const genreId of genres) {
        const weight = Math.random() * 0.5 + 0.1; // Random weight between 0.1 and 0.6
        await client.query(
          `INSERT INTO user_emotion_mappings (user_id, emotion, genre_id, weight)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (user_id, emotion, genre_id) DO UPDATE SET
           weight = EXCLUDED.weight,
           updated_at = CURRENT_TIMESTAMP`,
          [userId, emotion, genreId, weight]
        );
      }
    }
    
    // 6. Create user movie interactions with emotions
    console.log('🎭 Creating user movie interactions with emotions...');
    const watchedMovies = movies.slice(0, 100); // Take first 100 movies as watched
    
    for (let i = 0; i < watchedMovies.length; i++) {
      const movie = watchedMovies[i];
      const watchDate = new Date();
      watchDate.setDate(watchDate.getDate() - Math.floor(Math.random() * 365)); // Random date within last year
      
      // Generate emotion scores based on movie genres
      const emotionScores = generateEmotionScores(movie.genre_ids);
      
      // Insert emotion log
      const emotionResult = await client.query(
        `INSERT INTO emotions (user_id, movie_id, neutral, happy, sad, angry, fearful, disgusted, surprised, detection_method, confidence)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [
          userId,
          movie.id,
          emotionScores.neutral,
          emotionScores.happy,
          emotionScores.sad,
          emotionScores.angry,
          emotionScores.fearful,
          emotionScores.disgusted,
          emotionScores.surprised,
          Math.random() > 0.5 ? 'webcam' : 'manual',
          Math.random() * 0.3 + 0.7 // Confidence between 0.7 and 1.0
        ]
      );
      
      const emotionId = emotionResult.rows[0].id;
      
      // Insert user movie interaction
      await client.query(
        `INSERT INTO user_movies (user_id, movie_id, status, rating)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, movie_id, status) DO UPDATE SET
         rating = EXCLUDED.rating,
         created_at = $5`,
        [
          userId,
          movie.id,
          'watched',
          Math.floor(Math.random() * 5) + 6, // Rating between 6-10
          watchDate
        ]
      );
      
      // Create recommendation entry
      await client.query(
        `INSERT INTO recommendations (user_id, emotion_id, movie_id, recommendation_score)
         VALUES ($1, $2, $3, $4)`,
        [
          userId,
          emotionId,
          movie.id,
          Math.random() * 0.5 + 0.5 // Score between 0.5 and 1.0
        ]
      );
      
      // Add some additional emotion logs for the same movie (simulating multiple viewings)
      if (i % 5 === 0) { // Every 5th movie, add an additional emotion log for the same movie
        const additionalEmotionScores = generateEmotionScores(movie.genre_ids);
        await client.query(
          `INSERT INTO emotions (user_id, movie_id, neutral, happy, sad, angry, fearful, disgusted, surprised, detection_method, confidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            userId,
            movie.id,
            additionalEmotionScores.neutral,
            additionalEmotionScores.happy,
            additionalEmotionScores.sad,
            additionalEmotionScores.angry,
            additionalEmotionScores.fearful,
            additionalEmotionScores.disgusted,
            additionalEmotionScores.surprised,
            Math.random() > 0.5 ? 'webcam' : 'manual',
            Math.random() * 0.3 + 0.7
          ]
        );
      }
    }
    
    // 7. Add some movies to watchlist
    console.log('📋 Adding movies to watchlist...');
    const watchlistMovies = movies.slice(100, 120); // Next 20 movies for watchlist
    
    for (const movie of watchlistMovies) {
      await client.query(
        `INSERT INTO user_movies (user_id, movie_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, movie_id, status) DO NOTHING`,
        [userId, movie.id, 'watchlist']
      );
    }
    
    console.log('✅ Test data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`👤 Test user created: ${TEST_USER.email}`);
    console.log(`🎬 Movies in database: ${movies.length}`);
    console.log(`📺 Movies watched: ${watchedMovies.length}`);
    console.log(`📋 Movies in watchlist: ${watchlistMovies.length}`);
    console.log(`😊 Emotion logs created: ~${Math.floor(watchedMovies.length * 1.33)}`);
    console.log(`🗺️ Emotion mappings created: ${emotions.length * genres.length}`);
    console.log(`⭐ Recommendations created: ${watchedMovies.length}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the seeding function
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedTestData };
