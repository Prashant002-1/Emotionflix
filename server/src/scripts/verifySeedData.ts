import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../app';
import pool, { initializeDatabase } from '../config/database';
import { seed } from './seedData';

const SEED_PREFIX = 'emotionflix:v2:%';
const SEED_EMAILS = [
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

const EXPECTED_MEDIA = [
  { username: 'ananya_sen', title: 'Whiplash', path: '/social/ananya-after-whiplash-natural.webp' },
  { username: 'devon_m', title: 'Past Lives', path: '/social/devon-after-past-lives.webp' },
  { username: 'hiro_s', title: 'Cure', path: '/social/hiro-after-cure-natural.webp' },
];

const normalizeRows = (rows: Record<string, unknown>[]) => JSON.stringify(
  rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString() : value,
  ]))),
);

const seedFingerprint = async () => {
  const [users, entries, media, saved, follows, reactions] = await Promise.all([
    pool.query(
      `SELECT id, email, username, bio, created_at, updated_at FROM users
       WHERE email = ANY($1::text[]) ORDER BY email`,
      [SEED_EMAILS],
    ),
    pool.query(
      `SELECT de.id, de.seed_key, de.user_id, de.movie_id, de.watched_on::text,
              de.rating, de.note, de.visibility, de.neutral, de.happy, de.sad,
              de.angry, de.fearful, de.disgusted, de.surprised,
              de.capture_method, de.confidence, de.created_at, de.updated_at
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       WHERE u.email = ANY($1::text[]) AND de.seed_key LIKE $2
       ORDER BY de.seed_key`,
      [SEED_EMAILS, SEED_PREFIX],
    ),
    pool.query(
      `SELECT em.entry_id, em.kind, em.asset_path, em.alt_text, em.created_at, em.updated_at
       FROM entry_media em
       JOIN diary_entries de ON de.id = em.entry_id
       JOIN users u ON u.id = de.user_id
       WHERE u.email = ANY($1::text[]) AND de.seed_key LIKE $2
       ORDER BY em.entry_id, em.kind`,
      [SEED_EMAILS, SEED_PREFIX],
    ),
    pool.query(
      `SELECT sf.user_id, sf.movie_id, sf.created_at
       FROM saved_films sf JOIN users u ON u.id = sf.user_id
       WHERE u.email = ANY($1::text[]) ORDER BY sf.user_id, sf.movie_id`,
      [SEED_EMAILS],
    ),
    pool.query(
      `SELECT f.follower_id, f.followed_id, f.created_at
       FROM follows f JOIN users u ON u.id = f.follower_id
       WHERE u.email = ANY($1::text[]) ORDER BY f.follower_id, f.followed_id`,
      [SEED_EMAILS],
    ),
    pool.query(
      `SELECT er.user_id, er.entry_id, er.created_at
       FROM entry_reactions er JOIN users u ON u.id = er.user_id
       WHERE u.email = ANY($1::text[]) ORDER BY er.user_id, er.entry_id`,
      [SEED_EMAILS],
    ),
  ]);
  return normalizeRows([
    ...users.rows.map(row => ({ table: 'users', ...row })),
    ...entries.rows.map(row => ({ table: 'entries', ...row })),
    ...media.rows.map(row => ({ table: 'media', ...row })),
    ...saved.rows.map(row => ({ table: 'saved', ...row })),
    ...follows.rows.map(row => ({ table: 'follows', ...row })),
    ...reactions.rows.map(row => ({ table: 'reactions', ...row })),
  ]);
};

const assert: (condition: unknown, message: string) => asserts condition = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runVerification = async () => {
  let verifierUserId: number | null = null;
  try {
    await initializeDatabase();
    console.log('Verifying Moodie social seed contract...\n');

    const login = await request(app).post('/api/auth/login').send({ email: 'demo@demo.com', password: 'demo123!' });
    assert(login.status === 200 && login.body.token, `Demo login failed with ${login.status}`);
    const token = login.body.token as string;
    console.log('1. Demo access works.');

    const responseRows = await pool.query(
      `SELECT de.*, u.username
       FROM diary_entries de JOIN users u ON u.id = de.user_id
       WHERE u.email = ANY($1::text[]) AND de.seed_key LIKE $2
       ORDER BY de.seed_key`,
      [SEED_EMAILS, SEED_PREFIX],
    );
    assert(responseRows.rows.length === 115, `Expected 115 active seed responses, found ${responseRows.rows.length}`);
    assert(responseRows.rows.every(row => row.rating === null), 'Every active seeded rating must be null');
    assert(responseRows.rows.every(row => row.capture_method === 'manual'), 'Every active seeded response must use manual input');
    assert(responseRows.rows.every(row => Number(row.confidence) === 1), 'Every active seeded response must have confidence 1');
    const cohorts = await pool.query(
      `SELECT u.email, COUNT(*)::int AS responses,
              COUNT(*) FILTER (WHERE de.visibility = 'public')::int AS public_posts,
              COUNT(*) FILTER (WHERE de.visibility = 'private')::int AS private_responses
       FROM diary_entries de JOIN users u ON u.id = de.user_id
       WHERE u.email = ANY($1::text[]) AND de.seed_key LIKE $2
       GROUP BY u.email ORDER BY u.email`,
      [SEED_EMAILS, SEED_PREFIX],
    );
    assert(cohorts.rows.length === 12, 'Expected all twelve seed cohorts');
    for (const cohort of cohorts.rows) {
      if (cohort.email === 'demo@demo.com') {
        assert(cohort.responses === 16 && cohort.public_posts === 5, 'Demo cohort must have sixteen responses and five public posts');
      } else {
        assert(cohort.responses === 9 && cohort.public_posts === 6 && cohort.private_responses === 3, `${cohort.email} has an invalid public/private mix`);
      }
    }
    console.log('2. All 115 responses are unrated direct input.');

    const publicNotes = responseRows.rows.filter(row => row.visibility === 'public');
    const firstPerson = /\b(i|me|my|mine)\b/i;
    const criticism = /\b(acting|editing|cinematography|pacing|plotting|technical|performance|performances|stars?|rating|out of (five|5))\b/i;
    const invalidNotes = publicNotes.filter(row => {
      const note = String(row.note || '');
      return note.length < 20 || note.length > 420 || !firstPerson.test(note)
        || criticism.test(note) || note.includes('—') || note.includes('--');
    });
    assert(invalidNotes.length === 0, `Found ${invalidNotes.length} public notes that fail the first-person emotional-response gate`);
    const reactionDistribution = await pool.query(
      `SELECT de.id,
              COUNT(er.user_id) FILTER (WHERE reactor.email = ANY($1::text[]))::int AS seed_reactions
       FROM diary_entries de
       JOIN users author ON author.id = de.user_id
       LEFT JOIN entry_reactions er ON er.entry_id = de.id
       LEFT JOIN users reactor ON reactor.id = er.user_id
       WHERE author.email = ANY($1::text[]) AND de.seed_key LIKE $2 AND de.visibility = 'public'
       GROUP BY de.id ORDER BY de.id`,
      [SEED_EMAILS, SEED_PREFIX],
    );
    assert(reactionDistribution.rows.every(row => row.seed_reactions >= 0 && row.seed_reactions <= 5), 'A seed post has more than five seed reactions');
    assert(reactionDistribution.rows.filter(row => row.seed_reactions === 0).length / reactionDistribution.rows.length >= 0.25, 'At least 25 percent of public seed posts need no seed reactions');
    console.log(`3. ${publicNotes.length} public posts use first-person emotional responses.`);

    const overlap = await pool.query(
      `WITH demo_films AS (
         SELECT DISTINCT de.movie_id
         FROM diary_entries de JOIN users u ON u.id = de.user_id
         WHERE u.email = 'demo@demo.com' AND de.seed_key LIKE $1
       )
       SELECT u.username, COUNT(DISTINCT de.movie_id)::int AS shared_films
       FROM diary_entries de
       JOIN users u ON u.id = de.user_id
       JOIN demo_films viewer ON viewer.movie_id = de.movie_id
       WHERE u.email = ANY($2::text[]) AND u.email <> 'demo@demo.com'
         AND de.visibility = 'public' AND de.seed_key LIKE $1
       GROUP BY u.id, u.username
       HAVING COUNT(DISTINCT de.movie_id) >= 3
       ORDER BY shared_films DESC, u.username`,
      [SEED_PREFIX, SEED_EMAILS],
    );
    assert(overlap.rows.length >= 6, `Expected at least six people with three shared films, found ${overlap.rows.length}`);
    console.log(`4. ${overlap.rows.length} people share at least three films with the demo.`);

    const feed = await request(app)
      .get('/api/discovery/feed?limit=24')
      .set('Authorization', `Bearer ${token}`);
    assert(feed.status === 200 && Array.isArray(feed.body.entries), `Feed request failed with ${feed.status}`);
    assert(feed.body.entries.length === 24, `Expected 24 feed posts, found ${feed.body.entries.length}`);
    assert(new Set(feed.body.entries.map((entry: { user_id: number }) => entry.user_id)).size >= 6, 'Feed needs at least six people');
    assert(new Set(feed.body.entries.map((entry: { movie_id: number }) => entry.movie_id)).size >= 12, 'Feed needs at least twelve films');
    assert(feed.body.entries.every((entry: Record<string, unknown>) => !('rating' in entry) && !('vote_average' in entry)), 'Feed must omit rating and vote_average');
    assert(feed.body.entries.every((entry: Record<string, unknown>) => 'expression_image_path' in entry && 'expression_image_alt' in entry), 'Feed must expose nullable flat expression image fields');
    console.log('5. The first 24 feed posts are diverse and rating-free.');

    const media = await pool.query(
      `SELECT u.username, m.title, de.visibility, de.capture_method, em.asset_path, em.alt_text
       FROM entry_media em
       JOIN diary_entries de ON de.id = em.entry_id
       JOIN users u ON u.id = de.user_id
       JOIN movies m ON m.id = de.movie_id
       WHERE u.email = ANY($1::text[]) AND de.seed_key LIKE $2
       ORDER BY em.asset_path`,
      [SEED_EMAILS, SEED_PREFIX],
    );
    assert(media.rows.length === 3, `Expected three expression-photo posts, found ${media.rows.length}`);
    for (const expected of EXPECTED_MEDIA) {
      const found = media.rows.find(row => row.username === expected.username && row.title === expected.title && row.asset_path === expected.path);
      assert(found, `Missing expression photo ${expected.path}`);
      assert(found.visibility === 'public', `${expected.path} must belong to a public post`);
      assert(found.capture_method === 'manual', `${expected.path} must not change emotion provenance`);
      assert(String(found.alt_text).trim().length > 0, `${expected.path} needs alt text`);
    }
    const cureMovie = await pool.query("SELECT id FROM movies WHERE title = 'Cure' AND EXTRACT(YEAR FROM release_date) = 1997 LIMIT 1");
    assert(cureMovie.rowCount, 'Cure is missing from the movie cache');
    const cureEntries = await request(app).get(`/api/discovery/films/${cureMovie.rows[0].id}`);
    const hiroCure = cureEntries.body.entries?.find((entry: { username: string }) => entry.username === 'hiro_s');
    assert(hiroCure?.expression_image_path === '/social/hiro-after-cure-natural.webp', 'Film entries must expose the flat expression image path');
    assert(hiroCure?.expression_image_alt, 'Film entries must expose expression image alt text');
    console.log('6. Optional expression photos are public attachments, not emotion evidence.');

    const people = await request(app).get('/api/discovery/people').set('Authorization', `Bearer ${token}`);
    assert(people.status === 200 && Array.isArray(people.body.people), `People request failed with ${people.status}`);
    const connected = people.body.people.filter((person: { shared_films: number }) => Number(person.shared_films) >= 3);
    assert(connected.length >= 6, `Expected at least six same-film connections, found ${connected.length}`);
    assert(connected.every((person: { pattern_overlap: number }) => Number.isFinite(Number(person.pattern_overlap))), 'Connected people need a same-film overlap score');
    console.log('7. People are connected by emotional overlap on shared films.');

    const recommendations = await request(app)
      .post('/api/recommendations')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    assert(recommendations.status === 200, `Recommendations failed with ${recommendations.status}`);
    assert(recommendations.body.profile?.source === 'people', `Expected people profile source, found ${recommendations.body.profile?.source}`);
    assert(Number(recommendations.body.profile?.connectedPeople) >= 6, 'Recommendation profile needs connected people');
    assert(Array.isArray(recommendations.body.forYou) && recommendations.body.forYou.length > 0, 'People-led recommendations are empty');
    const demoMovieIds = new Set(responseRows.rows.filter(row => row.username === 'demo').map(row => Number(row.movie_id)));
    for (const movie of recommendations.body.forYou as Array<Record<string, any>>) {
      assert(!demoMovieIds.has(Number(movie.id)), `Recommended watched film ${movie.title}`);
      assert(Array.isArray(movie.recommended_by) && movie.recommended_by.length > 0, `${movie.title} does not identify a connected person`);
      assert(movie.recommended_by.every((person: Record<string, unknown>) => person.id && person.username && person.shared_film_title && person.response_id && person.response_note), `${movie.title} has an incomplete person or response connection`);
      assert(movie.recommended_by.every((person: Record<string, unknown>) => Array.isArray(person.shared_feelings) && person.shared_feelings.length > 0), `${movie.title} does not explain the shared-film feeling overlap`);
      assert(movie.recommended_by.every((person: Record<string, unknown>) => Array.isArray(person.response_feelings) && person.response_feelings.length > 0), `${movie.title} does not expose the source response feelings`);
      assert(movie.recommended_by.every((person: Record<string, unknown>) => person.viewer_shared_note && person.person_shared_note), `${movie.title} cannot compare the two shared-film responses`);
      assert(movie.recommended_by.every((person: Record<string, unknown>) => !('similarity' in person)), `${movie.title} exposes an internal similarity score`);
      assert(!('vote_average' in movie) && !('vote_count' in movie) && !('popularity' in movie), `${movie.title} exposes rating-led metadata`);
      assert(!/genre|well-rated|rating|stars?/i.test(String(movie.recommendation_reason)), `${movie.title} uses a genre/rating reason`);
    }
    assert(!('topGenres' in recommendations.body.profile), 'Recommendation profile must not expose top genres');
    console.log('8. Recommendations come from connected people and exclude watched films.');

    const privateIds = new Set(responseRows.rows.filter(row => row.visibility === 'private').map(row => Number(row.id)));
    assert(feed.body.entries.every((entry: { id: number }) => !privateIds.has(Number(entry.id))), 'A private response leaked into the feed');
    const member = await request(app).get('/api/discovery/people/clara_valdez').set('Authorization', `Bearer ${token}`);
    assert(member.status === 200 && member.body.entries.every((entry: { id: number }) => !privateIds.has(Number(entry.id))), 'A private response leaked into a member profile');
    console.log('9. Private responses inform their owner without appearing publicly.');

    const verifierSuffix = randomUUID();
    const verifierEmail = `seed-verifier-${verifierSuffix}@invalid.example`;
    const verifierUsername = `seed_verifier_${verifierSuffix.replace(/-/g, '').slice(0, 18)}`;
    const passwordHash = await bcrypt.hash(randomUUID(), 10);
    const insertedUser = await pool.query(
      `INSERT INTO users (email, username, password_hash, bio)
       VALUES ($1,$2,$3,'Verifier-owned account used only for a rollback-safe preservation check.')
       RETURNING id`,
      [verifierEmail, verifierUsername, passwordHash],
    );
    verifierUserId = Number(insertedUser.rows[0].id);
    const seedPerson = await pool.query("SELECT id FROM users WHERE email = 'clara@seed.emotionflix.com'");
    const seedPost = await pool.query(
      `SELECT de.id, de.movie_id FROM diary_entries de JOIN users u ON u.id = de.user_id
       WHERE u.email = 'clara@seed.emotionflix.com' AND de.visibility = 'public' AND de.seed_key LIKE $1
       ORDER BY de.id LIMIT 1`,
      [SEED_PREFIX],
    );
    assert(seedPerson.rowCount && seedPost.rowCount, 'Seed relationship fixtures are unavailable');
    const nonSeedEntry = await pool.query(
      `INSERT INTO diary_entries (user_id, movie_id, watched_on, rating, note, visibility)
       VALUES ($1,$2,'2026-07-12',4.5,'Verifier content must remain byte-for-byte unchanged.','private')
       RETURNING id`,
      [verifierUserId, seedPost.rows[0].movie_id],
    );
    await pool.query('INSERT INTO follows (follower_id, followed_id) VALUES ($1,$2)', [verifierUserId, seedPerson.rows[0].id]);
    await pool.query('INSERT INTO entry_reactions (user_id, entry_id) VALUES ($1,$2)', [verifierUserId, seedPost.rows[0].id]);
    await pool.query('INSERT INTO saved_films (user_id, movie_id) VALUES ($1,$2)', [verifierUserId, seedPost.rows[0].movie_id]);

    const before = await seedFingerprint();
    await seed();
    const after = await seedFingerprint();
    assert(after === before, 'Seed-owned IDs, timestamps, relationships, or logical content changed on rerun');

    const preserved = await pool.query(
      `SELECT u.email, de.id AS entry_id, de.note,
              EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = u.id AND f.followed_id = $2) AS follow_preserved,
              EXISTS(SELECT 1 FROM entry_reactions er WHERE er.user_id = u.id AND er.entry_id = $3) AS reaction_preserved,
              EXISTS(SELECT 1 FROM saved_films sf WHERE sf.user_id = u.id AND sf.movie_id = $4) AS saved_preserved
       FROM users u JOIN diary_entries de ON de.user_id = u.id
       WHERE u.id = $1`,
      [verifierUserId, seedPerson.rows[0].id, seedPost.rows[0].id, seedPost.rows[0].movie_id],
    );
    assert(preserved.rowCount, 'The non-seed verifier account or entry was deleted');
    assert(Number(preserved.rows[0].entry_id) === Number(nonSeedEntry.rows[0].id), 'The non-seed entry ID changed');
    assert(preserved.rows[0].note === 'Verifier content must remain byte-for-byte unchanged.', 'The non-seed entry content changed');
    assert(preserved.rows[0].follow_preserved && preserved.rows[0].reaction_preserved && preserved.rows[0].saved_preserved, 'A non-seed relationship to seed data was lost');
    console.log('10. A second run is stable and preserves non-seed relationships.');

    console.log('\nSocial seed verification passed: 10/10 checks.');
  } catch (error) {
    console.error('\nSocial seed verification failed:', error);
    process.exitCode = 1;
  } finally {
    if (verifierUserId) await pool.query('DELETE FROM users WHERE id = $1', [verifierUserId]);
    await pool.end();
  }
};

void runVerification();
