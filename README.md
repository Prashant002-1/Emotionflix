# Moodie

Moodie is emotion-based social film discovery.

> Moodie uses the TMDB API for non-commercial purposes and is not endorsed or certified by TMDB.

## OpenAI Build Week disclosure

Moodie did not start during Build Week. The original repository was a class project built around facial-expression analysis and rating-led recommendations. Before the submission window opened, I had already started turning it into a product about personal film responses and discovery through other people.

The January 21 baseline commit [`1f4a3fd`](https://github.com/Prashant002-1/Emotionflix/commit/1f4a3fd8965f9b9d3af963dafad0d11e5caa5520) documents the earlier public application. A timestamped July 10 Codex session documents the pre-window relaunch work. To avoid claiming that work as eligible, the first three branch commits are treated as pre-existing checkpoints even though they were committed after the window opened.

The Build Week contribution begins after [`af9cd5d`](https://github.com/Prashant002-1/Emotionflix/commit/af9cd5d) and is preserved as 15 dated commits through [`ce4630c`](https://github.com/Prashant002-1/Emotionflix/commit/ce4630c). It covers 88 files, with 12,701 additions and 3,409 deletions.

[`BUILD_WEEK.md`](./BUILD_WEEK.md) distinguishes the pre-existing foundation from the eligible Build Week work and links the commit evidence.

A person shares what a film meant to them and the feelings that stayed with them. The product finds people who responded similarly to the same films, then reveals what stayed with those people next. The signed-in home combines personal usage, active films, community activity, the diary, and saved films.

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
