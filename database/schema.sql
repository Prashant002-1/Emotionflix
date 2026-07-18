-- Moodie Database Schema
-- A film diary whose emotional record drives personal and social discovery.

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

-- Users table for storing user profiles and preferences
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio VARCHAR(240) DEFAULT '';

-- Legacy emotion-session table retained only as a migration source.
CREATE TABLE IF NOT EXISTS emotions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    session_id UUID DEFAULT gen_random_uuid(),
    neutral DECIMAL(3,2) DEFAULT 0.00,
    happy DECIMAL(3,2) DEFAULT 0.00,
    sad DECIMAL(3,2) DEFAULT 0.00,
    angry DECIMAL(3,2) DEFAULT 0.00,
    fearful DECIMAL(3,2) DEFAULT 0.00,
    disgusted DECIMAL(3,2) DEFAULT 0.00,
    surprised DECIMAL(3,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id, created_at) -- Composite key for unique emotion sessions per movie viewing
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

-- User watchlist and watched movies
CREATE TABLE IF NOT EXISTS user_movies (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'watchlist', -- 'watchlist', 'watched'
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id, status)
);

-- Legacy user-maintained emotion-to-genre mappings retained for migration compatibility.
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

-- Legacy current-state profile retained for migration compatibility.
CREATE TABLE IF NOT EXISTS user_emotion_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    neutral DECIMAL(3,2) DEFAULT 0.00,
    happy DECIMAL(3,2) DEFAULT 0.00,
    sad DECIMAL(3,2) DEFAULT 0.00,
    angry DECIMAL(3,2) DEFAULT 0.00,
    fearful DECIMAL(3,2) DEFAULT 0.00,
    disgusted DECIMAL(3,2) DEFAULT 0.00,
    surprised DECIMAL(3,2) DEFAULT 0.00,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- The diary is the current source of truth. A viewing, the viewer's response,
-- and the context needed to learn from it live in one atomic record.
CREATE TABLE IF NOT EXISTS diary_entries (
    id BIGSERIAL PRIMARY KEY,
    seed_key VARCHAR(160) UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    watched_on DATE NOT NULL DEFAULT CURRENT_DATE,
    rating DECIMAL(2,1) CHECK (rating IS NULL OR (rating >= 0.5 AND rating <= 5.0)),
    note VARCHAR(2000) DEFAULT '',
    visibility VARCHAR(12) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public')),
    neutral DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (neutral BETWEEN 0 AND 1),
    happy DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (happy BETWEEN 0 AND 1),
    sad DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (sad BETWEEN 0 AND 1),
    angry DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (angry BETWEEN 0 AND 1),
    fearful DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (fearful BETWEEN 0 AND 1),
    disgusted DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (disgusted BETWEEN 0 AND 1),
    surprised DECIMAL(4,3) NOT NULL DEFAULT 0.000 CHECK (surprised BETWEEN 0 AND 1),
    capture_method VARCHAR(12) NOT NULL DEFAULT 'manual' CHECK (capture_method = 'manual'), -- retained for data compatibility; active input is direct
    confidence DECIMAL(4,3) NOT NULL DEFAULT 1.000 CHECK (confidence = 1), -- retained for data compatibility
    legacy_user_movie_id INTEGER UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Stable seed ownership is additive and nullable so ordinary user entries are
-- never mistaken for data that the explicit seed command may reconcile.
ALTER TABLE diary_entries ADD COLUMN IF NOT EXISTS seed_key VARCHAR(160);
CREATE UNIQUE INDEX IF NOT EXISTS idx_diary_entries_seed_key
    ON diary_entries(seed_key) WHERE seed_key IS NOT NULL;

-- A shared expression image is optional post media. It is deliberately
-- Optional post media stays separate from the person's saved feelings.
-- was inferred from that face.
CREATE TABLE IF NOT EXISTS entry_media (
    entry_id BIGINT NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
    kind VARCHAR(24) NOT NULL CHECK (kind IN ('expression_photo')),
    asset_path TEXT NOT NULL,
    alt_text VARCHAR(240) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (entry_id, kind)
);

ALTER TABLE entry_media ALTER COLUMN asset_path TYPE TEXT;

CREATE TABLE IF NOT EXISTS saved_films (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, movie_id)
);

CREATE TABLE IF NOT EXISTS follows (
    follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id <> followed_id)
);

CREATE TABLE IF NOT EXISTS entry_reactions (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_id BIGINT NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, entry_id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_emotions_user_id ON emotions(user_id);
CREATE INDEX IF NOT EXISTS idx_emotions_session_id ON emotions(session_id);
CREATE INDEX IF NOT EXISTS idx_emotions_created_at ON emotions(created_at);
CREATE INDEX IF NOT EXISTS idx_emotions_movie_id ON emotions(movie_id);
CREATE INDEX IF NOT EXISTS idx_movies_title ON movies(title);
CREATE INDEX IF NOT EXISTS idx_movies_release_date ON movies(release_date);
CREATE INDEX IF NOT EXISTS idx_movies_vote_average ON movies(vote_average);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_created_at ON recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_user_movies_user_id ON user_movies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_movies_status ON user_movies(status);
CREATE INDEX IF NOT EXISTS idx_user_emotion_mappings_user_id ON user_emotion_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emotion_mappings_emotion ON user_emotion_mappings(emotion);
CREATE INDEX IF NOT EXISTS idx_user_emotion_profiles_user_id ON user_emotion_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_date ON diary_entries(user_id, watched_on DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_public ON diary_entries(visibility, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diary_entries_movie ON diary_entries(movie_id);
CREATE INDEX IF NOT EXISTS idx_entry_media_kind ON entry_media(kind);
CREATE INDEX IF NOT EXISTS idx_saved_films_user ON saved_films(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id);

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

-- Preserve records from the previous list-and-emotion model when this schema is
-- applied to an existing database. The old tables remain readable as a migration
-- source, but no current API writes to them.
INSERT INTO saved_films (user_id, movie_id, created_at)
SELECT user_id, movie_id, created_at
FROM user_movies
WHERE status = 'watchlist'
ON CONFLICT (user_id, movie_id) DO NOTHING;

INSERT INTO diary_entries (
    user_id, movie_id, watched_on, rating, visibility,
    neutral, happy, sad, angry, fearful, disgusted, surprised,
    capture_method, confidence, legacy_user_movie_id, created_at, updated_at
)
SELECT
    um.user_id,
    um.movie_id,
    um.created_at::date,
    CASE WHEN um.rating IS NULL THEN NULL ELSE ROUND((um.rating::numeric / 2.0) * 2) / 2 END,
    'private',
    COALESCE(e.neutral, 0), COALESCE(e.happy, 0), COALESCE(e.sad, 0),
    COALESCE(e.angry, 0), COALESCE(e.fearful, 0), COALESCE(e.disgusted, 0), COALESCE(e.surprised, 0),
    'manual', 1, um.id, um.created_at, um.created_at
FROM user_movies um
LEFT JOIN LATERAL (
    SELECT * FROM emotions source_emotion
    WHERE source_emotion.user_id = um.user_id AND source_emotion.movie_id = um.movie_id
    ORDER BY ABS(EXTRACT(EPOCH FROM (source_emotion.created_at - um.created_at))) ASC
    LIMIT 1
) e ON TRUE
WHERE um.status = 'watched'
ON CONFLICT (legacy_user_movie_id) DO NOTHING;
