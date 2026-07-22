import { randomUUID } from 'crypto';
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
  { username: 'ananya_sen', title: 'Scream', path: '/social/ananya-after-scream-natural.webp' },
  { username: 'ananya_sen', title: 'Whiplash', path: '/social/ananya-after-whiplash-natural.webp' },
  { username: 'chloe_d', title: "Kiki's Delivery Service", path: '/social/chloe-after-kikis-delivery-service-natural.webp' },
  { username: 'clara_valdez', title: 'The Worst Person in the World', path: '/social/clara-after-worst-person-world-natural.webp' },
  { username: 'devon_m', title: 'The Babadook', path: '/social/devon-after-babadook-natural.webp' },
  { username: 'devon_m', title: 'Past Lives', path: '/social/devon-after-past-lives-natural.webp' },
  { username: 'elena_r', title: 'Perfect Days', path: '/social/elena-after-perfect-days-natural.webp' },
  { username: 'hiro_s', title: 'Cure', path: '/social/hiro-after-cure-natural.webp' },
  { username: 'hiro_s', title: 'The Others', path: '/social/hiro-after-others-natural.webp' },
  { username: 'lucas_v', title: 'The Truman Show', path: '/social/lucas-after-truman-show-natural.webp' },
  { username: 'marcus_k', title: 'After Yang', path: '/social/marcus-after-after-yang-natural.webp' },
  { username: 'rachel_g', title: 'The Farewell', path: '/social/rachel-after-farewell-natural.webp' },
  { username: 'sarah_m', title: 'Columbus', path: '/social/sarah-after-columbus-natural.webp' },
  { username: 'tariq_a', title: 'The Lives of Others', path: '/social/tariq-after-lives-of-others-natural.webp' },
];

const normalizeRows = (rows: Record<string, unknown>[]) => JSON.stringify(
  rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [
    key,
    value instanceof Date ? value.toISOString() : value,
  ]))),
);

const seedFingerprint = async () => {
  const [users, entries, media, saved, follows, likes, comments] = await Promise.all([
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
    pool.query(
      `SELECT ec.id, ec.seed_key, ec.user_id, ec.entry_id, ec.body, ec.created_at, ec.updated_at
       FROM entry_comments ec
       WHERE ec.seed_key LIKE $1
       ORDER BY ec.entry_id, ec.created_at, ec.id`,
      [`${SEED_PREFIX.replace('%', '')}comment:%`],
    ),
  ]);
  return normalizeRows([
    ...users.rows.map(row => ({ table: 'users', ...row })),
    ...entries.rows.map(row => ({ table: 'entries', ...row })),
    ...media.rows.map(row => ({ table: 'media', ...row })),
    ...saved.rows.map(row => ({ table: 'saved', ...row })),
    ...follows.rows.map(row => ({ table: 'follows', ...row })),
    ...likes.rows.map(row => ({ table: 'likes', ...row })),
    ...comments.rows.map(row => ({ table: 'comments', ...row })),
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

    const demo = await request(app).post('/api/auth/demo');
    assert(demo.status === 200 && demo.body.token, `Demo entry failed with ${demo.status}`);
    const token = demo.body.token as string;
    console.log('1. Demo access works.');

    const responseRows = await pool.query(
      `SELECT de.*, u.username
       FROM diary_entries de JOIN users u ON u.id = de.user_id
       WHERE u.email = ANY($1::text[]) AND de.seed_key LIKE $2
       ORDER BY de.seed_key`,
      [SEED_EMAILS, SEED_PREFIX],
    );
    assert(responseRows.rows.length === 163, `Expected 163 active seed responses, found ${responseRows.rows.length}`);
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
        assert(cohort.responses === 20 && cohort.public_posts === 7 && cohort.private_responses === 13, 'Demo cohort must retain a substantial mixed-visibility history');
      } else {
        assert(cohort.responses >= 12 && cohort.responses <= 14
          && cohort.public_posts >= 8 && cohort.public_posts <= 10
          && cohort.private_responses >= 4 && cohort.private_responses <= 5, `${cohort.email} has an invalid public/private mix`);
      }
    }
    const communityCohorts = cohorts.rows.filter(row => row.email !== 'demo@demo.com');
    assert(new Set(communityCohorts.map(row => Number(row.responses))).size >= 3, 'Community response histories should vary in depth');
    assert(new Set(communityCohorts.map(row => Number(row.public_posts))).size >= 3, 'Community public/private balances should vary');
    console.log('2. All 163 responses are unrated direct input with varied diary depth and visibility.');

    const publicNotes = responseRows.rows.filter(row => row.visibility === 'public');
    const firstPerson = /\b(i|me|my|mine)\b/i;
    const criticism = /\b(acting|editing|cinematography|pacing|plotting|technical|performance|performances|stars?|rating|out of (five|5))\b/i;
    const invalidNotes = publicNotes.filter(row => {
      const note = String(row.note || '');
      return note.length < 20 || note.length > 420 || !firstPerson.test(note)
        || criticism.test(note) || note.includes('—') || note.includes('--');
    });
    assert(invalidNotes.length === 0, `Found ${invalidNotes.length} public notes that fail the first-person emotional-response gate`);
    const noteLengths = publicNotes.map(row => String(row.note || '').trim().length);
    assert(noteLengths.filter(length => length <= 130).length >= 8, 'Public notes need a real concise-response tail');
    assert(noteLengths.filter(length => length >= 260).length >= 20, 'Public notes need enough fuller reflections to balance concise responses');
    const feelingColumns = ['neutral', 'happy', 'sad', 'angry', 'fearful', 'disgusted', 'surprised'] as const;
    assert(feelingColumns.every(feeling => responseRows.rows.filter(row => Number(row[feeling]) >= 0.4).length >= 2), 'Every direct feeling signal should be materially present in multiple varied responses');
    const likeDistribution = await pool.query(
      `SELECT de.id,
              COUNT(er.user_id) FILTER (WHERE reactor.email = ANY($1::text[]))::int AS seed_likes
       FROM diary_entries de
       JOIN users author ON author.id = de.user_id
       LEFT JOIN entry_reactions er ON er.entry_id = de.id
       LEFT JOIN users reactor ON reactor.id = er.user_id
       WHERE author.email = ANY($1::text[]) AND de.seed_key LIKE $2 AND de.visibility = 'public'
       GROUP BY de.id ORDER BY de.id`,
      [SEED_EMAILS, SEED_PREFIX],
    );
    assert(likeDistribution.rows.every(row => row.seed_likes >= 0 && row.seed_likes <= 5), 'A seed post has more than five seed likes');
    assert(likeDistribution.rows.filter(row => row.seed_likes === 0).length / likeDistribution.rows.length >= 0.25, 'At least 25 percent of public seed posts need no seed likes');
    const comments = await pool.query(
      `SELECT ec.id, ec.seed_key, ec.entry_id, ec.user_id, ec.body, ec.created_at,
              de.visibility, author.username AS author_username, target.username AS target_username
       FROM entry_comments ec
       JOIN diary_entries de ON de.id = ec.entry_id
       JOIN users author ON author.id = ec.user_id
       JOIN users target ON target.id = de.user_id
       WHERE ec.seed_key LIKE $1 AND de.seed_key LIKE $2
       ORDER BY ec.created_at, ec.id`,
      [`${SEED_PREFIX.replace('%', '')}comment:%`, SEED_PREFIX],
    );
    assert(comments.rows.length === 24, `Expected 24 seed comments, found ${comments.rows.length}`);
    assert(comments.rows.every(row => row.visibility === 'public'), 'Seed comments may only belong to public responses');
    const commentsByEntry = new Map<number, typeof comments.rows>();
    comments.rows.forEach(row => {
      const entryId = Number(row.entry_id);
      commentsByEntry.set(entryId, [...(commentsByEntry.get(entryId) || []), row]);
    });
    assert(commentsByEntry.size === 16, 'Seed comments should remain deliberately sparse');
    assert([...commentsByEntry.values()].filter(thread => thread.length === 2).length === 8
      && [...commentsByEntry.values()].filter(thread => thread.length === 1).length === 8, 'Comments need eight conversational exchanges and eight single responses');
    assert([...commentsByEntry.values()].filter(thread => thread.length === 2)
      .every(thread => thread.some(comment => comment.author_username === comment.target_username)), 'Each seed conversation needs a response from the person whose words started it');
    const commentLengths = comments.rows.map(row => String(row.body || '').trim().length);
    assert(commentLengths.filter(length => length <= 90).length >= 8
      && commentLengths.filter(length => length >= 130).length >= 8, 'Seed comments need both quick replies and fuller thoughts');
    assert(comments.rows.every(row => {
      const body = String(row.body || '').trim();
      return body.length >= 20 && body.length <= 360
        && !/\b(great post|love this|so good|amazing|nice review)\b/i.test(body)
        && /\b(i|me|my|you|your|this|that|it|we|our|they|them|she|her|he|his)\b/i.test(body);
    }), 'Seed comments must be specific responses, not generic praise');
    const firstComment = comments.rows[0];
    const commentPayload = await request(app)
      .get(`/api/discovery/entries/${firstComment.entry_id}/comments`)
      .set('Authorization', `Bearer ${token}`);
    assert(commentPayload.status === 200 && commentPayload.body.comments?.some((comment: { id: number; body: string }) => Number(comment.id) === Number(firstComment.id) && comment.body === firstComment.body), 'Seed comments must be visible through the response comments endpoint');
    console.log(`3. ${publicNotes.length} public responses and ${comments.rows.length} specific comments pass the social-writing gate.`);

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
      .get('/api/discovery/feed?limit=50')
      .set('Authorization', `Bearer ${token}`);
    assert(feed.status === 200 && Array.isArray(feed.body.entries), `Feed request failed with ${feed.status}`);
    assert(feed.body.entries.length === 50, `Expected 50 feed posts, found ${feed.body.entries.length}`);
    const firstTwelve = feed.body.entries.slice(0, 12);
    const firstTwentyFour = feed.body.entries.slice(0, 24);
    assert(new Set(firstTwelve.filter((entry: { username: string }) => entry.username !== 'demo').map((entry: { user_id: number }) => entry.user_id)).size === 11, 'The first twelve feed responses should include every community person');
    assert(new Set(firstTwentyFour.map((entry: { movie_id: number }) => entry.movie_id)).size >= 12, 'The first 24 feed posts need at least twelve films');
    assert(new Set(feed.body.entries.filter((entry: { username: string }) => entry.username !== 'demo').map((entry: { user_id: number }) => entry.user_id)).size === 11, 'The full feed needs every community person');
    assert(new Set(feed.body.entries.map((entry: { movie_id: number }) => entry.movie_id)).size >= 24, 'The full feed needs at least twenty-four films');
    const followingPosts = feed.body.entries.filter((entry: { following: boolean }) => entry.following);
    assert(followingPosts.length >= 9, `Expected a substantial recent sample from followed people, found ${followingPosts.length}`);
    assert(new Set(followingPosts.map((entry: { user_id: number }) => entry.user_id)).size === 3, 'The recent feed must contain all three followed people');
    const followedPublic = await pool.query(
      `SELECT COUNT(*)::int AS responses, COUNT(DISTINCT de.user_id)::int AS people
       FROM follows f
       JOIN users viewer ON viewer.id = f.follower_id
       JOIN diary_entries de ON de.user_id = f.followed_id
       WHERE viewer.email = 'demo@demo.com'
         AND de.visibility = 'public' AND de.seed_key LIKE $1`,
      [SEED_PREFIX],
    );
    assert(followedPublic.rows[0]?.responses === 26, `Expected 26 public seed responses from followed people, found ${followedPublic.rows[0]?.responses}`);
    assert(followedPublic.rows[0]?.people === 3, 'The followed response pool must cover all three followed people');
    assert(feed.body.entries.every((entry: Record<string, unknown>) => !('rating' in entry) && !('vote_average' in entry)), 'Feed must omit rating and vote_average');
    assert(feed.body.entries.every((entry: Record<string, unknown>) => 'expression_image_path' in entry && 'expression_image_alt' in entry), 'Feed must expose nullable flat expression image fields');
    const firstTwelvePhotos = firstTwelve.filter((entry: { expression_image_path: string | null }) => entry.expression_image_path);
    assert(firstTwelvePhotos.length === 11, `Expected eleven photos in the first twelve feed responses, found ${firstTwelvePhotos.length}`);
    const socialShape = await pool.query(
      `SELECT u.email,
              COUNT(DISTINCT sf.movie_id)::int AS saved_films,
              COUNT(DISTINCT f.followed_id)::int AS follows
       FROM users u
       LEFT JOIN saved_films sf ON sf.user_id = u.id
       LEFT JOIN follows f ON f.follower_id = u.id
       WHERE u.email = ANY($1::text[])
       GROUP BY u.id, u.email
       ORDER BY u.email`,
      [SEED_EMAILS],
    );
    const demoSocial = socialShape.rows.find(row => row.email === 'demo@demo.com');
    assert(demoSocial?.saved_films >= 10 && demoSocial?.follows === 3, 'Demo social state should be deliberate rather than empty');
    const communitySocial = socialShape.rows.filter(row => row.email !== 'demo@demo.com');
    assert(communitySocial.every(row => row.saved_films >= 5 && row.follows >= 2 && row.follows <= 3), 'Community saved films and follows need believable, bounded variety');
    assert(new Set(communitySocial.map(row => Number(row.saved_films))).size >= 2, 'Saved film histories should not all have the same depth');
    console.log('5. Following and Everyone have dense, diverse, rating-free streams with varied saved-film and follow history.');

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
    assert(media.rows.length === EXPECTED_MEDIA.length, `Expected ${EXPECTED_MEDIA.length} expression-photo posts, found ${media.rows.length}`);
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
    assert(people.body.people.length === 11, `Expected eleven community people, found ${people.body.people.length}`);
    assert(people.body.people.every((person: { latest_movie_id: number; latest_title: string; latest_poster_path: string; latest_note: string }) => (
      Number(person.latest_movie_id) > 0
      && Boolean(person.latest_title)
      && Boolean(person.latest_poster_path)
      && Boolean(person.latest_note)
    )), 'Every people card needs a current film, poster, title, and response note');
    console.log('7. People are connected by emotional overlap and have complete current cards.');

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

    const joyfulRecommendations = await request(app)
      .post('/api/recommendations')
      .set('Authorization', `Bearer ${token}`)
      .send({ signal: { neutral: 0.03, happy: 0.9, sad: 0.02, angry: 0.01, fearful: 0.02, disgusted: 0.01, surprised: 0.35 } });
    assert(joyfulRecommendations.status === 200, `Joyful recommendation request failed with ${joyfulRecommendations.status}`);
    const joyfulPaths = [...(joyfulRecommendations.body.forYou || []), ...(joyfulRecommendations.body.adjacent || [])];
    const screamRank = joyfulPaths.findIndex((movie: { title: string }) => movie.title === 'Scream');
    const screamPath = joyfulPaths[screamRank];
    assert(screamRank >= 0 && screamRank < 5, `Ananya's joyful Scream path should land in the first five results, found rank ${screamRank + 1}`);
    assert(screamPath.recommended_by?.[0]?.username === 'ananya_sen'
      && screamPath.recommended_by[0].response_feelings?.includes('happy'), 'Scream must be sourced from Ananya\'s joyful public response');
    console.log('8. Recommendations come from connected people and exclude watched films.');

    const privateIds = new Set(responseRows.rows.filter(row => row.visibility === 'private').map(row => Number(row.id)));
    assert(feed.body.entries.every((entry: { id: number }) => !privateIds.has(Number(entry.id))), 'A private response leaked into the feed');
    const member = await request(app).get('/api/discovery/people/clara_valdez').set('Authorization', `Bearer ${token}`);
    assert(member.status === 200 && member.body.entries.every((entry: { id: number }) => !privateIds.has(Number(entry.id))), 'A private response leaked into a member profile');
    console.log('9. Private responses inform their owner without appearing publicly.');

    const verifierSuffix = randomUUID();
    const verifierEmail = `seed-verifier-${verifierSuffix}@invalid.example`;
    const verifierUsername = `seed_verifier_${verifierSuffix.replace(/-/g, '').slice(0, 18)}`;
    const passwordHash = `verifier-only-${randomUUID()}`;
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
    await pool.query(
      `INSERT INTO entry_comments (user_id, entry_id, body)
       VALUES ($1,$2,'Verifier comment must remain byte-for-byte unchanged.')`,
      [verifierUserId, seedPost.rows[0].id],
    );
    await pool.query('INSERT INTO saved_films (user_id, movie_id) VALUES ($1,$2)', [verifierUserId, seedPost.rows[0].movie_id]);

    const before = await seedFingerprint();
    await seed();
    const after = await seedFingerprint();
    assert(after === before, 'Seed-owned IDs, timestamps, relationships, or logical content changed on rerun');

    const preserved = await pool.query(
      `SELECT u.email, de.id AS entry_id, de.note,
              EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = u.id AND f.followed_id = $2) AS follow_preserved,
              EXISTS(SELECT 1 FROM entry_reactions er WHERE er.user_id = u.id AND er.entry_id = $3) AS like_preserved,
              EXISTS(SELECT 1 FROM entry_comments ec WHERE ec.user_id = u.id AND ec.entry_id = $3 AND ec.body = 'Verifier comment must remain byte-for-byte unchanged.') AS comment_preserved,
              EXISTS(SELECT 1 FROM saved_films sf WHERE sf.user_id = u.id AND sf.movie_id = $4) AS saved_preserved
       FROM users u JOIN diary_entries de ON de.user_id = u.id
       WHERE u.id = $1`,
      [verifierUserId, seedPerson.rows[0].id, seedPost.rows[0].id, seedPost.rows[0].movie_id],
    );
    assert(preserved.rowCount, 'The non-seed verifier account or entry was deleted');
    assert(Number(preserved.rows[0].entry_id) === Number(nonSeedEntry.rows[0].id), 'The non-seed entry ID changed');
    assert(preserved.rows[0].note === 'Verifier content must remain byte-for-byte unchanged.', 'The non-seed entry content changed');
    assert(preserved.rows[0].follow_preserved && preserved.rows[0].like_preserved && preserved.rows[0].comment_preserved && preserved.rows[0].saved_preserved, 'A non-seed relationship to seed data was lost');
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
