# Test Data Seeding Scripts

This directory contains scripts for seeding the EmotionFlix database with realistic test data for end-to-end testing.

## Scripts

### `seedTestData.ts`
Creates comprehensive test data including:
- Test user account
- 100+ movies from TMDB API
- 100 watched movies with ratings
- 128 emotion logs (with realistic emotion patterns based on movie genres)
- User emotion mappings
- Recommendations
- User emotion profile

### `verifyTestData.ts`
Verifies that the test data was created correctly and displays statistics.

## Usage

### Prerequisites
1. Ensure your database is running
2. Set up your environment variables (`.env` file):
   ```
   DATABASE_URL=postgresql://postgres:password@localhost:5432/emotionflix
   VITE_TMDB_API_KEY=your_tmdb_api_key_here
   ```

### Running the Scripts

```bash
# Seed test data
npm run seed:test

# Verify test data
npm run verify:test
```

## Test User Credentials

After running the seeding script, you can log in with:
- **Email**: `test@test.com`
- **Password**: `testtest123!`

## Data Generated

The seeding script creates:

### User Data
- Test user account with authentication
- User emotion profile
- Personalized emotion-to-genre mappings

### Movie Data
- 100+ popular movies from TMDB API
- Complete movie metadata (title, overview, ratings, etc.)
- Movie-genre relationships

### Interaction Data
- 100 watched movies with ratings (6-10/10)
- 128 emotion logs with realistic patterns
- Emotion logs tied to specific movies
- Recommendation scores

### Emotion Patterns
The script generates realistic emotion scores based on movie genres:
- **Action/Adventure**: High surprise, moderate fear, some happiness
- **Comedy**: High happiness, moderate surprise
- **Drama**: High sadness and neutral, some happiness
- **Horror**: High fear, moderate surprise, some disgust
- **Romance**: High happiness, moderate sadness
- **Thriller**: High fear and surprise, some anger
- **Sci-Fi**: High surprise, moderate fear
- **Animation**: High happiness, moderate surprise
- **Documentary**: High neutral, moderate surprise
- **War**: High anger and sadness, moderate fear

## Features

- **Realistic Data**: Uses actual TMDB movie data
- **Genre-Based Emotions**: Emotion scores correlate with movie genres
- **Multiple Viewings**: Some movies have multiple emotion logs
- **Varied Detection Methods**: Mix of webcam and manual emotion detection
- **Confidence Scores**: Realistic confidence levels (70-100%)
- **Historical Data**: Movies watched over the past year

## Notes

- The script is idempotent - it can be run multiple times safely
- Existing users will be reused, new data will be added
- TMDB API calls are rate-limited to be respectful
- All emotion logs are tied to movies (no standalone emotions due to database constraints)
