# Moodie

Moodie is emotion-based social film discovery.

> Moodie uses the TMDB API for non-commercial purposes and is not endorsed or certified by TMDB.

No two people feel the same. Moodie starts there. A person records what a film meant to them and the feelings that stayed. The product finds people who responded similarly to the same films, then opens a path to what moved those people next.

It does not treat a person as a rating, genre profile, or point in a recommendation system. The person, the shared film, and the response behind each recommendation remain visible.

## OpenAI Build Week

The idea existed before Build Week. I first organized it as a student project called EmotionFlix, built around facial-expression analysis and rating-led recommendations. It never became the product I had in mind. After the January 21 baseline commit [`1f4a3fd`](https://github.com/Prashant002-1/Emotionflix/commit/1f4a3fd8965f9b9d3af963dafad0d11e5caa5520), the repository sat untouched for nearly six months.

OpenAI Build Week gave me a reason to reopen it. The frontend and product capabilities I saw in Codex with GPT-5.6 Sol made a complete relaunch feel possible. The core belief stayed the same, but the product philosophy, recommendation model, data, design system, social experience, runtime, and execution became Moodie during this work.

The dated Build Week implementation is preserved as 15 commits after [`af9cd5d`](https://github.com/Prashant002-1/Emotionflix/commit/af9cd5d), from [`7ffe1f4`](https://github.com/Prashant002-1/Emotionflix/commit/7ffe1f4) through [`ce4630c`](https://github.com/Prashant002-1/Emotionflix/commit/ce4630c). That range changes 88 files, with 12,701 additions and 3,409 deletions. The complete relaunch from the dormant student baseline changes 159 files, with 30,628 additions and 22,080 deletions.

[`BUILD_WEEK.md`](./BUILD_WEEK.md) carries the story, commit evidence, Codex and GPT-5.6 Sol contributions, and the decisions I kept ownership of.

## Codex and GPT-5.6 Sol

I used Codex as a working partner across the repository, not as autocomplete. The workflow stayed simple: I described what felt wrong, Codex read the product and code, implemented a direction, ran it, and I steered the next correction. It untangled an immature architecture, rebuilt the frontend and backend, exercised the product in the browser when needed, generated visual assets inside coding sessions, created and verified the social seed world, and turned repeated feedback into a repository-specific agent skill.

GPT-5.6 Sol made the largest product correction. It recognized that facial recognition was not the real idea and pushed the product toward direct emotional responses and people-led discovery. It could recover the intention from old code without preserving its assumptions. It also helped keep the recommendation engine lean: shared films and reviewed feelings connect people, and real public responses create the path to another film.

Direct feeling controls and writing are the inputs. A public response may include an optional expression photo as attached media. The photo is never analyzed and never changes the person's feelings.

There are no user ratings. Genres, TMDB vote values, and universal emotion-to-genre rules do not power personal recommendations.

[`PRODUCT.md`](./PRODUCT.md) defines the product philosophy and journeys. [`docs/EMOTIONAL_SIGNAL_MODEL.md`](./docs/EMOTIONAL_SIGNAL_MODEL.md) defines emotional evidence, people-led matching, media separation, and consent. [`DESIGN.md`](./DESIGN.md) defines the Matinee Archive interface system.

## Stack

- React 19, TypeScript, Vite, React Router, Lenis, and Oxygen
- Express, embedded PostgreSQL via PGlite, JWT authentication, and Zod validation
- TMDB for server-side film metadata and artwork
- Vitest, React Testing Library, Jest, and Supertest

## Product routes

- `/`: public product overview
- `/feed`: signed-in response stream with personal film paths woven into it
- `/search`: film and people search with community and shared-film context
- `/people`: followed and discoverable people with shared-film context
- `/activity`: reactions, follows, and recent responses from people followed
- `/recommendations`: a contextual continuation reached from a personal film path, not primary navigation
- `/diary`: personal response history
- `/log`: add a film response
- `/movie/:id`: film details and public responses
- `/member/:username`: public member responses

## Current APIs

- `GET /api/catalog/trending`
- `GET /api/catalog/popular`
- `GET /api/catalog/search?q=`
- `GET /api/catalog/movies/:movieId`
- `GET /api/catalog/movies/:movieId/related`
- `GET|POST /api/diary`
- `GET /api/diary/summary`
- `PATCH|DELETE /api/diary/:entryId`
- `GET|POST|DELETE /api/library/saved`
- `POST /api/recommendations`
- `GET /api/discovery/feed`
- `GET /api/discovery/people`
- `GET /api/discovery/people/:username`
- `GET /api/discovery/films/:movieId`
- `GET /api/discovery/activity`
- `GET /api/discovery/pulse`
- `POST|DELETE /api/discovery/people/:personId/follow`
- `POST|DELETE /api/discovery/entries/:entryId/reaction`
- `GET|PATCH /api/auth/profile`

## Current implementation boundary

The current application supports direct feeling controls and an optional attached photo. The seven-key feeling vocabulary is still a prototype constraint and will need a deliberate migration before it expands.

## Run locally

Requirement: Node.js 20 through 25. Node.js 22 is the recommended local runtime. Docker and a system database are not needed.

```bash
npm install
cp .env.example .env
```

Add a TMDB API key to `.env` to enable live film metadata:

```dotenv
TMDB_API_KEY=your-tmdb-api-key
```

Populate the local social demo, then start the application:

```bash
npm run seed
npm run dev
```

Open `http://localhost:5173`. The root command runs the web app and API together. Vite proxies `/api` internally, so there is no frontend API URL to configure.

Enter through the one-step demo on the landing page, or sign in directly with:

```text
Email: demo@demo.com
Password: demo123!
```

The embedded database is created at `.data/emotionflix` and `database/schema.sql` is applied automatically. Delete `.data/emotionflix` only when you intentionally want a clean local database.

## Production-style run

```bash
npm run build
npm start
```

The Express process serves both the built frontend and `/api` from `http://localhost:3001`.

## Runtime model

- One root dependency install and lockfile
- One root `.env` file
- One embedded, persistent PostgreSQL-compatible database
- One development command
- One production process and origin
- Automatic schema initialization on startup

## Seed data

The application does not create demo or community content at startup. [`database/seed-contract.json`](./database/seed-contract.json) defines the seed contract. The seed script and verifier are explicit tasks.

```bash
npm run seed
npm run seed:verify
```

## Verification

```bash
npm run lint
npm run build
npm test
npm --workspace server test -- --runInBand
```

The product documents are source-of-truth constraints. When implementation and documentation differ, preserve user data and move the implementation toward the documented model deliberately.

## License and attribution

Moodie's source code is available under the [MIT License](./LICENSE).

Film metadata and artwork are supplied through the TMDB API. The API key remains on the Express server and is never sent to the browser. TMDB content is governed by TMDB's own terms and is not covered by the MIT License. See [`THIRD_PARTY_NOTICES.md`](./THIRD_PARTY_NOTICES.md).
