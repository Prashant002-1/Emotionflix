import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/emotionflix',
});

async function verifyTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Verifying test data...\n');
    
    // Check user
    const userResult = await client.query(
      'SELECT id, email, username, created_at FROM users WHERE email = $1',
      ['test@test.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found!');
      return;
    }
    
    const user = userResult.rows[0];
    console.log(`✅ Test user found:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Created: ${user.created_at}\n`);
    
    // Count movies
    const moviesResult = await client.query('SELECT COUNT(*) as count FROM movies');
    console.log(`🎬 Movies in database: ${moviesResult.rows[0].count}`);
    
    // Count user's watched movies
    const watchedResult = await client.query(
      'SELECT COUNT(*) as count FROM user_movies WHERE user_id = $1 AND status = $2',
      [user.id, 'watched']
    );
    console.log(`📺 Movies watched by test user: ${watchedResult.rows[0].count}`);
    
    // Count user's watchlist
    const watchlistResult = await client.query(
      'SELECT COUNT(*) as count FROM user_movies WHERE user_id = $1 AND status = $2',
      [user.id, 'watchlist']
    );
    console.log(`📋 Movies in watchlist: ${watchlistResult.rows[0].count}`);
    
    // Count emotion logs
    const emotionsResult = await client.query(
      'SELECT COUNT(*) as count FROM emotions WHERE user_id = $1',
      [user.id]
    );
    console.log(`😊 Emotion logs: ${emotionsResult.rows[0].count}`);
    
    // Count emotion logs with movies
    const emotionsWithMoviesResult = await client.query(
      'SELECT COUNT(*) as count FROM emotions WHERE user_id = $1 AND movie_id IS NOT NULL',
      [user.id]
    );
    console.log(`🎭 Emotion logs with movies: ${emotionsWithMoviesResult.rows[0].count}`);
    
    // Count recommendations
    const recommendationsResult = await client.query(
      'SELECT COUNT(*) as count FROM recommendations WHERE user_id = $1',
      [user.id]
    );
    console.log(`⭐ Recommendations: ${recommendationsResult.rows[0].count}`);
    
    // Count emotion mappings
    const mappingsResult = await client.query(
      'SELECT COUNT(*) as count FROM user_emotion_mappings WHERE user_id = $1',
      [user.id]
    );
    console.log(`🗺️ Emotion mappings: ${mappingsResult.rows[0].count}`);
    
    // Show some sample emotion data
    console.log('\n📊 Sample emotion data:');
    const sampleEmotionsResult = await client.query(
      `SELECT e.neutral, e.happy, e.sad, e.angry, e.fearful, e.disgusted, e.surprised, 
              e.detection_method, e.confidence, m.title
       FROM emotions e
       JOIN movies m ON e.movie_id = m.id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC
       LIMIT 5`,
      [user.id]
    );
    
    sampleEmotionsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.title}:`);
      console.log(`      Happy: ${(row.happy * 100).toFixed(1)}%, Sad: ${(row.sad * 100).toFixed(1)}%, Angry: ${(row.angry * 100).toFixed(1)}%`);
      console.log(`      Fearful: ${(row.fearful * 100).toFixed(1)}%, Surprised: ${(row.surprised * 100).toFixed(1)}%, Neutral: ${(row.neutral * 100).toFixed(1)}%`);
      console.log(`      Method: ${row.detection_method}, Confidence: ${(row.confidence * 100).toFixed(1)}%\n`);
    });
    
    // Show some sample movie ratings
    console.log('⭐ Sample movie ratings:');
    const sampleRatingsResult = await client.query(
      `SELECT m.title, um.rating, um.created_at
       FROM user_movies um
       JOIN movies m ON um.movie_id = m.id
       WHERE um.user_id = $1 AND um.status = 'watched'
       ORDER BY um.created_at DESC
       LIMIT 5`,
      [user.id]
    );
    
    sampleRatingsResult.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.title}: ${row.rating}/10 (${row.created_at})`);
    });
    
    console.log('\n✅ Test data verification completed!');
    
  } catch (error) {
    console.error('❌ Error verifying test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run the verification function
if (require.main === module) {
  verifyTestData()
    .then(() => {
      console.log('🎉 Verification completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification failed:', error);
      process.exit(1);
    });
}

export { verifyTestData };
