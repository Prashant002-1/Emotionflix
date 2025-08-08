-- EmotionFlix Database Schema
-- Database for emotion-based movie recommendations

-- Users table for storing user profiles and preferences
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Emotions table for storing emotion detection sessions
CREATE TABLE IF NOT EXISTS emotions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    neutral DECIMAL(3,2) DEFAULT 0.00,
    happy DECIMAL(3,2) DEFAULT 0.00,
    sad DECIMAL(3,2) DEFAULT 0.00,
    angry DECIMAL(3,2) DEFAULT 0.00,
    fearful DECIMAL(3,2) DEFAULT 0.00,
    disgusted DECIMAL(3,2) DEFAULT 0.00,
    surprised DECIMAL(3,2) DEFAULT 0.00,
    detection_method VARCHAR(20) DEFAULT 'manual', -- 'manual', 'webcam'
    confidence DECIMAL(3,2) DEFAULT 0.00, -- confidence level 0-1
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Movies table for caching TMDB movie data
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY, -- TMDB movie ID
    title VARCHAR(500) NOT NULL,
    overview TEXT,
    release_date DATE,
    poster_path VARCHAR(255),
    backdrop_path VARCHAR(255),
    vote_average DECIMAL(3,1) DEFAULT 0.0,
    vote_count INTEGER DEFAULT 0,
    popularity DECIMAL(8,3) DEFAULT 0.0,
    runtime INTEGER,
    tmdb_data JSONB, -- Store full TMDB response
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Genres table for movie genres
CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY, -- TMDB genre ID
    name VARCHAR(100) NOT NULL
);

-- Movie-Genre junction table
CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- Recommendations table for storing user recommendations
CREATE TABLE IF NOT EXISTS recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emotion_id INTEGER REFERENCES emotions(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    recommendation_score DECIMAL(5,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User favorites/watchlist
CREATE TABLE IF NOT EXISTS user_movies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'watchlist', -- 'watchlist', 'watched', 'favorite'
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id, status)
);

-- User personalized emotion-to-genre mappings
CREATE TABLE IF NOT EXISTS user_emotion_mappings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emotion VARCHAR(20) NOT NULL,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    weight DECIMAL(5,4) DEFAULT 0.0000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, emotion, genre_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emotions_user_id ON emotions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotions_session_id ON emotions(session_id);
CREATE INDEX IF NOT EXISTS idx_emotions_created_at ON emotions(created_at);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_status ON user_movies(status);
CREATE INDEX IF NOT EXISTS idx_user_emotion_mappings_user_id ON user_emotion_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emotion_mappings_emotion ON user_emotion_mappings(emotion);

-- Insert initial genre data (TMDB standard genres)
INSERT INTO genres (id, name) VALUES 
(28, 'Action'),
(12, 'Adventure'),
(16, 'Animation'),
(35, 'Comedy'),
(80, 'Crime'),
(99, 'Documentary'),
(18, 'Drama'),
(10751, 'Family'),
(14, 'Fantasy'),
(36, 'History'),
(27, 'Horror'),
(10402, 'Music'),
(9648, 'Mystery'),
(10749, 'Romance'),
(878, 'Science Fiction'),
(10770, 'TV Movie'),
(53, 'Thriller'),
(10752, 'War'),
(37, 'Western')
ON CONFLICT (id) DO NOTHING;