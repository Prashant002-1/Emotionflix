# EmotionFlix

EmotionFlix is emotion-based social film discovery.

A person shares what a film meant to them and the feelings that stayed with them. The product finds people who responded similarly to the same films, then reveals what stayed with those people next. The signed-in home combines personal usage, active films, community activity, the diary, and saved films.

Direct feeling controls and writing are the primary inputs. A public response may include an optional expression photo as attached media. Facial-expression analysis is a separate optional adapter whose output remains an editable suggestion. It is not the product identity.

There are no user ratings. Genres, TMDB vote values, and universal emotion-to-genre rules do not power personal recommendations.

[`PRODUCT.md`](./PRODUCT.md) defines the product philosophy and journeys. [`docs/EMOTIONAL_SIGNAL_MODEL.md`](./docs/EMOTIONAL_SIGNAL_MODEL.md) defines emotional evidence, people-led matching, media separation, and consent. [`DESIGN.md`](./DESIGN.md) defines the Matinee Archive interface system.

## Stack

- React 19, TypeScript, Vite, React Router, Lenis, and Oxygen
- Express, embedded PostgreSQL via PGlite, JWT authentication, and Zod validation
- face-api.js for the current optional in-browser expression adapter
- TMDB for server-side film metadata and artwork
- Vitest, React Testing Library, Jest, and Supertest

## Product routes

- `/`: public product overview
- `/feed`: signed-in home and activity
- `/recommendations`: people-led discovery with catalog browse below
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
- `POST|DELETE /api/discovery/people/:personId/follow`
- `POST|DELETE /api/discovery/entries/:entryId/reaction`
- `GET|PATCH /api/auth/profile`

## Current implementation boundary

The current application supports direct sliders and optional camera or photo expression estimates. The database still uses seven face-api-derived feeling keys and a `manual|webcam|upload` source enum. Text-derived suggestions and the extensible source model are documented requirements, not completed features.

## Run locally

Requirement: Node.js 20 or newer. Docker and a system database are not needed.

```bash
npm install
cp .env.example .env
npm run dev
```

Add a TMDB API key to `.env` to enable live film metadata:

```dotenv
TMDB_API_KEY=your-tmdb-api-key
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
