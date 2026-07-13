import 'dotenv/config';
import request from 'supertest';
import { Pool } from 'pg';
import { execSync } from 'child_process';
import path from 'path';
import app from '../app';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is required for verification.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runVerification() {
  console.log('Starting seed data acceptance checks...\n');
  let passedChecks = 0;
  const totalChecks = 14;

  try {
    // -------------------------------------------------------------
    // Check 1: POST /api/auth/login with demo credentials
    // -------------------------------------------------------------
    console.log('Checking Rule 1: Login with demo credentials...');
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@demo.com', password: 'demo123!' });

    if (loginRes.status !== 200 || !loginRes.body.token) {
      throw new Error(`Failed to login with demo credentials: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
    }
    const token = loginRes.body.token;
    console.log('✅ Rule 1 Passed: Login successful, token returned.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 2: GET /api/discovery/feed returns >= 24 public entries and feed diversity
    // -------------------------------------------------------------
    console.log('Checking Rule 2 & Social Feed Diversity: Discovery feed returns >= 24 public entries and diverse content...');
    const feedRes = await request(app)
      .get('/api/discovery/feed?limit=24')
      .set('Authorization', `Bearer ${token}`);

    if (feedRes.status !== 200 || !feedRes.body.entries) {
      throw new Error(`Failed to fetch discovery feed: ${feedRes.status} ${JSON.stringify(feedRes.body)}`);
    }

    const entries = feedRes.body.entries;
    console.log(`Feed returned ${entries.length} entries.`);
    if (entries.length < 24) {
      throw new Error(`Expected at least 24 public entries in the feed, but got ${entries.length}`);
    }

    // Check feed diversity (First 24 public entries must include >= 6 people and >= 12 films)
    const distinctUsers = new Set(entries.map((e: any) => e.user_id));
    const distinctMovies = new Set(entries.map((e: any) => e.movie_id));
    console.log(`Feed diversity in first 24 public entries: ${distinctUsers.size} distinct users, ${distinctMovies.size} distinct movies.`);

    if (distinctUsers.size < 6) {
      throw new Error(`Feed diversity check failed: Expected at least 6 distinct users in the feed, but got ${distinctUsers.size}`);
    }
    if (distinctMovies.size < 12) {
      throw new Error(`Feed diversity check failed: Expected at least 12 distinct movies in the feed, but got ${distinctMovies.size}`);
    }

    console.log('✅ Rule 2 Passed: Feed contains at least 24 public entries with robust diversity (>= 6 people, >= 12 films).');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 3: GET /api/discovery/people returns at least 8 community accounts
    // -------------------------------------------------------------
    console.log('Checking Rule 3: Discovery people returns at least 8 community accounts...');
    const peopleRes = await request(app)
      .get('/api/discovery/people')
      .set('Authorization', `Bearer ${token}`);

    if (peopleRes.status !== 200 || !peopleRes.body.people) {
      throw new Error(`Failed to fetch people: ${peopleRes.status} ${JSON.stringify(peopleRes.body)}`);
    }

    const people = peopleRes.body.people;
    console.log(`People list returned ${people.length} accounts.`);
    if (people.length < 8) {
      throw new Error(`Expected at least 8 community accounts, but got ${people.length}`);
    }
    console.log('✅ Rule 3 Passed: People list contains at least 8 community accounts.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 4: GET /api/diary and GET /api/diary/summary agree on entry count
    // -------------------------------------------------------------
    console.log('Checking Rule 4: GET /api/diary and GET /api/diary/summary counts agree...');
    const diaryRes = await request(app)
      .get('/api/diary')
      .set('Authorization', `Bearer ${token}`);

    const summaryRes = await request(app)
      .get('/api/diary/summary')
      .set('Authorization', `Bearer ${token}`);

    if (diaryRes.status !== 200 || !diaryRes.body.entries) {
      throw new Error(`Failed to fetch diary entries: ${diaryRes.status}`);
    }
    if (summaryRes.status !== 200 || summaryRes.body.entries === undefined) {
      throw new Error(`Failed to fetch diary summary: ${summaryRes.status}`);
    }

    const diaryCount = diaryRes.body.entries.length;
    const summaryCount = summaryRes.body.entries;

    console.log(`Diary entry list count: ${diaryCount}, Summary entry count: ${summaryCount}`);
    if (diaryCount !== summaryCount) {
      throw new Error(`Count mismatch: List has ${diaryCount} while Summary has ${summaryCount}`);
    }
    console.log('✅ Rule 4 Passed: Diary list and summary counts agree.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 5: POST /api/recommendations returns non-empty arrays
    // -------------------------------------------------------------
    console.log('Checking Rule 5: Recommendations returns non-empty arrays for forYou, adjacent, and community...');
    const recsRes = await request(app)
      .post('/api/recommendations')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    if (recsRes.status !== 200 || !recsRes.body.forYou || !recsRes.body.adjacent || !recsRes.body.community) {
      throw new Error(`Failed to fetch recommendations: ${recsRes.status} ${JSON.stringify(recsRes.body)}`);
    }

    const { forYou, adjacent, community } = recsRes.body;
    console.log(`Recommendations count - forYou: ${forYou.length}, adjacent: ${adjacent.length}, community: ${community.length}`);

    if (forYou.length === 0 || adjacent.length === 0 || community.length === 0) {
      throw new Error('One of the recommendations arrays (forYou, adjacent, community) is empty.');
    }
    console.log('✅ Rule 5 Passed: Recommendations are populated with appropriate films.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 6: Recommendation profile source is diary without feeling signal
    // -------------------------------------------------------------
    console.log('Checking Rule 6: Profile source is "diary" without a present-feeling signal...');
    if (!recsRes.body.profile || recsRes.body.profile.source !== 'diary') {
      throw new Error(`Expected profile source to be 'diary', but got '${recsRes.body.profile?.source}'`);
    }
    console.log(`Profile source: ${recsRes.body.profile.source}`);
    console.log('✅ Rule 6 Passed: Recommendation profile correctly resolved to "diary" based on user history.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 7: No seeded note contains an em-dash or current-state capture prompts
    // -------------------------------------------------------------
    console.log('Checking Rule 7: Seeded notes do not contain em-dashes or template/prompt text...');
    const notesRes = await pool.query('SELECT note FROM diary_entries WHERE note IS NOT NULL AND note <> \'\'');
    const invalidNotes = notesRes.rows.filter(row => {
      const n = row.note.toLowerCase();
      return n.includes('—') || n.includes('--') || n.includes('how are you') || n.includes('current state');
    });

    if (invalidNotes.length > 0) {
      throw new Error(`Found ${invalidNotes.length} invalid notes containing em-dashes or prompts: ${JSON.stringify(invalidNotes)}`);
    }
    console.log(`Validated ${notesRes.rows.length} non-empty diary notes.`);
    console.log('✅ Rule 7 Passed: No em-dashes or current-state prompts in seeded reviews.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 10: Usernames do not use the community_user_* pattern
    // -------------------------------------------------------------
    console.log('Checking Rule 10: Usernames do not use community_user_* pattern...');
    const usernameRes = await pool.query('SELECT username FROM users');
    const invalidUsernames = usernameRes.rows.filter(row => /^community_user_/i.test(row.username));
    if (invalidUsernames.length > 0) {
      throw new Error(`Found usernames violating community_user_* pattern: ${JSON.stringify(invalidUsernames.map(u => u.username))}`);
    }
    console.log('✅ Rule 10 Passed: No usernames match the community_user_* pattern.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 11: Biographies or notes are duplicated after normalization
    // -------------------------------------------------------------
    console.log('Checking Rule 11: Biographies and notes are unique after normalization...');
    const normalizeText = (text: string): string => {
      return text
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // remove punctuation
        .replace(/\s+/g, ' ') // collapse whitespaces
        .trim();
    };

    const biosRes = await pool.query('SELECT bio FROM users WHERE bio IS NOT NULL AND bio <> \'\'');
    const normalizedBios = biosRes.rows.map(row => normalizeText(row.bio));
    const bioSet = new Set<string>();
    for (const b of normalizedBios) {
      if (bioSet.has(b)) {
        throw new Error(`Found duplicate biography after normalization: "${b}"`);
      }
      bioSet.add(b);
    }
    console.log(`Validated ${biosRes.rows.length} unique biographies.`);

    const notesCheckRes = await pool.query('SELECT note FROM diary_entries WHERE note IS NOT NULL AND note <> \'\'');
    const normalizedNotes = notesCheckRes.rows.map(row => normalizeText(row.note));
    const noteSet = new Set<string>();
    for (const n of normalizedNotes) {
      if (noteSet.has(n)) {
        throw new Error(`Found duplicate diary note after normalization: "${n}"`);
      }
      noteSet.add(n);
    }
    console.log(`Validated ${notesCheckRes.rows.length} unique notes.`);
    console.log('✅ Rule 11 Passed: No duplicate biographies or notes after normalization.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 12: Unresolved placeholders remain
    // -------------------------------------------------------------
    console.log('Checking Rule 12: No unresolved placeholders (e.g. {title} or curly braces) remain...');
    const allTextRes = await pool.query(`
      SELECT note AS text FROM diary_entries WHERE note IS NOT NULL AND note <> ''
      UNION
      SELECT bio AS text FROM users WHERE bio IS NOT NULL AND bio <> ''
    `);
    const placeholderRows = allTextRes.rows.filter(row => row.text.includes('{') || row.text.includes('}'));
    if (placeholderRows.length > 0) {
      throw new Error(`Found unresolved placeholders in text: ${JSON.stringify(placeholderRows.map(r => r.text))}`);
    }
    console.log('✅ Rule 12 Passed: No unresolved placeholders found.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 13: Source-method percentages violate 85/10/5
    // -------------------------------------------------------------
    console.log('Checking Rule 13: Source-method percentages satisfy 85% manual, 10% upload, 5% webcam...');
    const captureRes = await pool.query(`
      SELECT capture_method, COUNT(*)::int AS count
      FROM diary_entries
      GROUP BY capture_method
    `);
    let total = 0;
    const counts: Record<string, number> = { manual: 0, upload: 0, webcam: 0 };
    captureRes.rows.forEach(r => {
      counts[r.capture_method] = r.count;
      total += r.count;
    });

    if (total === 0) {
      throw new Error('No diary entries found to check capture methods.');
    }
    const manualPct = counts.manual / total;
    const uploadPct = counts.upload / total;
    const webcamPct = counts.webcam / total;

    console.log(`Source methods: manual=${(manualPct * 100).toFixed(1)}%, upload=${(uploadPct * 100).toFixed(1)}%, webcam=${(webcamPct * 100).toFixed(1)}%`);
    if (manualPct < 0.85) {
      throw new Error(`Manual capture method percentage is ${(manualPct * 100).toFixed(1)}%, expected at least 85%.`);
    }
    if (uploadPct > 0.10) {
      throw new Error(`Upload capture method percentage is ${(uploadPct * 100).toFixed(1)}%, expected at most 10%.`);
    }
    if (webcamPct > 0.05) {
      throw new Error(`Webcam capture method percentage is ${(webcamPct * 100).toFixed(1)}%, expected at most 5%.`);
    }
    console.log('✅ Rule 13 Passed: Capture method distributions satisfy the 85/10/5 ratio.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 15: The same film receives contrasting emotional responses
    // -------------------------------------------------------------
    console.log('Checking Rule 15: The same film receives contrasting emotional responses from different people...');
    const contrastRes = await pool.query(`
      SELECT movie_id, neutral, happy, sad, angry, fearful, disgusted, surprised, user_id
      FROM diary_entries
      WHERE movie_id IN (
        SELECT movie_id FROM diary_entries GROUP BY movie_id HAVING COUNT(DISTINCT user_id) > 1
      )
    `);

    const movieEntries: Record<number, any[]> = {};
    contrastRes.rows.forEach(r => {
      if (!movieEntries[r.movie_id]) movieEntries[r.movie_id] = [];
      movieEntries[r.movie_id].push(r);
    });

    let foundContrast = false;
    for (const [movieId, entries] of Object.entries(movieEntries)) {
      const dominantEmotions = entries.map(e => {
        const emMap = {
          neutral: Number(e.neutral),
          happy: Number(e.happy),
          sad: Number(e.sad),
          angry: Number(e.angry),
          fearful: Number(e.fearful),
          disgusted: Number(e.disgusted),
          surprised: Number(e.surprised)
        };
        return Object.entries(emMap).reduce((a, b) => a[1] > b[1] ? a : b)[0];
      });

      const uniqueDominants = new Set(dominantEmotions);
      if (uniqueDominants.size > 1) {
        foundContrast = true;
        console.log(`Found contrasting dominant emotions on movie ID ${movieId}: ${Array.from(uniqueDominants).join(', ')}`);
        break;
      }
    }

    if (!foundContrast) {
      throw new Error('Contrast check failed: No film in the database received contrasting dominant emotional responses from different people.');
    }
    console.log('✅ Rule 15 Passed: At least one film received contrasting dominant emotional responses.');
    passedChecks++;

    // -------------------------------------------------------------
    // Check 8 & 9: Run seeding second time, check counts and non-seed safety
    // -------------------------------------------------------------
    console.log('Checking Rules 8 & 9: Running seed rerun checks and verifying safety of non-seed data...');
    
    // Create a dummy non-seed user and child records to prove they are untouched
    const testEmail = 'nonseed@nonseed.com';
    const testUsername = 'nonseed_reviewer';
    const testPasswordHash = '$2a$12$K1r6K/fR.h4c.sLp7L7eUeZ.OQdI7u73DqJ6uF.rF.R6.R.R.R.R.'; // pre-hashed dummy

    // Clean up any stale test user first
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);

    // Insert non-seed user
    const insertUserRes = await pool.query(
      `INSERT INTO users (email, username, password_hash, bio)
       VALUES ($1, $2, $3, 'A normal user who is not part of the seed manifest.')
       RETURNING id`,
      [testEmail, testUsername, testPasswordHash]
    );
    const nonSeedUserId = insertUserRes.rows[0].id;

    // Get a movie ID to use for the diary entry (use 38 / Eternal Sunshine or another ID from movies table)
    const movieRes = await pool.query('SELECT id FROM movies LIMIT 1');
    if (movieRes.rowCount === 0) {
      throw new Error('No movies found in the database to link dummy non-seed entry.');
    }
    const testMovieId = movieRes.rows[0].id;

    await pool.query(
      `INSERT INTO diary_entries (user_id, movie_id, watched_on, rating, note, visibility)
       VALUES ($1, $2, '2026-07-01', 5.0, 'Amazing movie. Unrelated to seed runs.', 'private')`,
      [nonSeedUserId, testMovieId]
    );

    // Get current record counts of seed-owned users (for Rule 8 verification)
    const seedUserEmails = [
      'demo@demo.com',
      'clara@seed.emotionflix.com',
      'marcus@seed.emotionflix.com',
      'elena@seed.emotionflix.com',
      'hiro@seed.emotionflix.com',
      'chloe@seed.emotionflix.com',
      'devon@seed.emotionflix.com',
      'ananya@seed.emotionflix.com',
      'lucas@seed.emotionflix.com',
      'sarah@seed.emotionflix.com',
      'tariq@seed.emotionflix.com',
      'rachel@seed.emotionflix.com',
    ];

    const countSeedOwned = async () => {
      const users = await pool.query('SELECT COUNT(*)::int FROM users WHERE email = ANY($1)', [seedUserEmails]);
      const diary = await pool.query('SELECT COUNT(*)::int FROM diary_entries WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))', [seedUserEmails]);
      const saved = await pool.query('SELECT COUNT(*)::int FROM saved_films WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))', [seedUserEmails]);
      const follows = await pool.query('SELECT COUNT(*)::int FROM follows WHERE follower_id IN (SELECT id FROM users WHERE email = ANY($1))', [seedUserEmails]);
      const reactions = await pool.query('SELECT COUNT(*)::int FROM entry_reactions WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1))', [seedUserEmails]);
      
      return {
        users: users.rows[0].count,
        diary: diary.rows[0].count,
        saved: saved.rows[0].count,
        follows: follows.rows[0].count,
        reactions: reactions.rows[0].count
      };
    };

    const countsBefore = await countSeedOwned();

    try {
      // Rerun seed command via CLI
      console.log('Running the seed command a second time...');
      const seedScriptPath = path.join(__dirname, 'seedData.ts');
      execSync(`npx ts-node "${seedScriptPath}"`, { stdio: 'inherit' });

      // Measure counts after rerun
      const countsAfter = await countSeedOwned();

      console.log('\nSeed-Owned Records Comparison:');
      console.log(`Users:     Before = ${countsBefore.users}, After = ${countsAfter.users}`);
      console.log(`Diary:     Before = ${countsBefore.diary}, After = ${countsAfter.diary}`);
      console.log(`Saved:     Before = ${countsBefore.saved}, After = ${countsAfter.saved}`);
      console.log(`Follows:   Before = ${countsBefore.follows}, After = ${countsAfter.follows}`);
      console.log(`Reactions: Before = ${countsBefore.reactions}, After = ${countsAfter.reactions}`);

      if (
        countsBefore.users !== countsAfter.users ||
        countsBefore.diary !== countsAfter.diary ||
        countsBefore.saved !== countsAfter.saved ||
        countsBefore.follows !== countsAfter.follows ||
        countsBefore.reactions !== countsAfter.reactions
      ) {
        throw new Error('Idempotency failure: Seed-owned table counts changed after running the seed command a second time.');
      }
      console.log('✅ Rule 8 Passed: Running seed second time leaves seed-owned record counts unchanged.');
      passedChecks++;

      // Verify non-seed user and records are untouched
      const checkNonSeedUser = await pool.query('SELECT * FROM users WHERE id = $1', [nonSeedUserId]);
      const checkNonSeedDiary = await pool.query('SELECT * FROM diary_entries WHERE user_id = $1', [nonSeedUserId]);

      if (checkNonSeedUser.rowCount === 0 || checkNonSeedDiary.rowCount === 0) {
        throw new Error('Safety failure: Non-seed user or diary entry was deleted or modified during rerun.');
      }

      if (checkNonSeedDiary.rows[0].note !== 'Amazing movie. Unrelated to seed runs.') {
        throw new Error('Safety failure: Non-seed diary entry content was modified.');
      }

      console.log('✅ Rule 9 Passed: Non-seed users and data are completely untouched during rerun.');
      passedChecks++;

      console.log(`\n🎉 Verification Completed Successfully: ${passedChecks}/${totalChecks} checks passed!`);
    } finally {
      // Cleanup non-seed test user
      await pool.query('DELETE FROM users WHERE id = $1', [nonSeedUserId]);
    }
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void runVerification();
