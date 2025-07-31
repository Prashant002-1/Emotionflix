-- User-specific emotion-to-genre mapping table
-- This table stores personalized mappings learned from user behavior

CREATE TABLE IF NOT EXISTS user_emotion_genre_mappings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    emotion VARCHAR(20) NOT NULL, -- 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised', 'neutral'
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    weight DECIMAL(5,4) DEFAULT 0.0000, -- How strongly this emotion maps to this genre for this user
    interaction_count INTEGER DEFAULT 1, -- Number of times user interacted with this emotion-genre combo
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, emotion, genre_id)
);

-- Emotion-movie interaction tracking for learning
CREATE TABLE IF NOT EXISTS user_emotion_movie_interactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
    emotion_session_id INTEGER REFERENCES emotions(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL, -- 'logged', 'watchlisted', 'rated_positive', 'rated_negative'
    emotion_scores JSONB NOT NULL, -- Store the emotion scores at time of interaction
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_emotion_genre_mappings_user_id ON user_emotion_genre_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emotion_genre_mappings_emotion ON user_emotion_genre_mappings(emotion);
CREATE INDEX IF NOT EXISTS idx_user_emotion_movie_interactions_user_id ON user_emotion_movie_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_emotion_movie_interactions_created_at ON user_emotion_movie_interactions(created_at);

-- Function to update user emotion-genre mappings when they interact with movies
CREATE OR REPLACE FUNCTION update_user_emotion_genre_mapping(
    p_user_id INTEGER,
    p_movie_id INTEGER,
    p_emotion_scores JSONB,
    p_interaction_type VARCHAR(20)
) RETURNS VOID AS $$
DECLARE
    genre_record RECORD;
    emotion_record RECORD;
    emotion_key TEXT;
    emotion_value DECIMAL;
    weight_multiplier DECIMAL;
BEGIN
    -- Determine weight multiplier based on interaction type
    weight_multiplier := CASE p_interaction_type
        WHEN 'logged' THEN 1.0
        WHEN 'watchlisted' THEN 0.5
        WHEN 'rated_positive' THEN 2.0
        WHEN 'rated_negative' THEN -0.5
        ELSE 1.0
    END;
    
    -- Get all genres for this movie
    FOR genre_record IN 
        SELECT g.id, g.name 
        FROM genres g 
        JOIN movie_genres mg ON g.id = mg.genre_id 
        WHERE mg.movie_id = p_movie_id
    LOOP
        -- Process each emotion score
        FOR emotion_key IN SELECT jsonb_object_keys(p_emotion_scores)
        LOOP
            emotion_value := (p_emotion_scores ->> emotion_key)::DECIMAL;
            
            -- Only process emotions above threshold
            IF emotion_value > 0.05 THEN
                -- Insert or update the mapping
                INSERT INTO user_emotion_genre_mappings (
                    user_id, emotion, genre_id, weight, interaction_count, updated_at
                ) VALUES (
                    p_user_id, emotion_key, genre_record.id, 
                    emotion_value * weight_multiplier, 1, CURRENT_TIMESTAMP
                ) ON CONFLICT (user_id, emotion, genre_id) DO UPDATE SET
                    weight = (user_emotion_genre_mappings.weight * user_emotion_genre_mappings.interaction_count + 
                             emotion_value * weight_multiplier) / (user_emotion_genre_mappings.interaction_count + 1),
                    interaction_count = user_emotion_genre_mappings.interaction_count + 1,
                    updated_at = CURRENT_TIMESTAMP;
            END IF;
        END LOOP;
    END LOOP;
    
    -- Record the interaction
    INSERT INTO user_emotion_movie_interactions (
        user_id, movie_id, emotion_scores, interaction_type
    ) VALUES (
        p_user_id, p_movie_id, p_emotion_scores, p_interaction_type
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get personalized emotion-to-genre mappings for a user
CREATE OR REPLACE FUNCTION get_user_emotion_genre_mappings(p_user_id INTEGER)
RETURNS TABLE(emotion VARCHAR(20), genre_id INTEGER, weight DECIMAL(5,4)) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uegm.emotion,
        uegm.genre_id,
        uegm.weight
    FROM user_emotion_genre_mappings uegm
    WHERE uegm.user_id = p_user_id
    ORDER BY uegm.emotion, uegm.weight DESC;
END;
$$ LANGUAGE plpgsql;