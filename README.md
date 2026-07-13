# EmotionFlix

EmotionFlix is emotion-based social film discovery, built on a personal film diary.

Each diary entry keeps the film, viewing date, rating, note, visibility, and reviewed emotional record together. The emotional record is source-agnostic. A person can set it directly, ask for suggestions from a note or review, or choose another consented input. Derived values remain editable suggestions until the person accepts them.

Public entries form the community layer. Members can find people with familiar response patterns, follow their diaries, and discover films through what resonated with those people. Facial-expression analysis is an optional input experiment, not the product identity or primary entry path.

`PRODUCT.md` defines the product philosophy and journeys. [`docs/EMOTIONAL_SIGNAL_MODEL.md`](./docs/EMOTIONAL_SIGNAL_MODEL.md) defines the source-agnostic emotion model, recommendation rules, consent boundaries, and the gap between the current prototype and target architecture. `DESIGN.md` defines how those decisions appear in the interface.

## Stack

- React 19, TypeScript, Vite, React Router, and Oxygen
- Express, PostgreSQL, JWT authentication, and Zod validation
- face-api.js for the current optional in-browser expression adapter
- TMDB for film metadata and artwork, accessed only through the server
- Vitest, React Testing Library, Jest, and Supertest

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

The old `/api/user-movies` and `/api/emotion-mappings` routes have been removed. Legacy tables remain only so `database/schema.sql` can migrate existing records into `diary_entries` and `saved_films`.

## Current implementation boundary

The current application supports direct sliders and optional camera or photo expression estimates. The database still uses seven face-api-derived emotion keys and a `manual|webcam|upload` source enum. Text-derived suggestions and the extensible source model are documented product requirements, not completed features. See [`docs/EMOTIONAL_SIGNAL_MODEL.md`](./docs/EMOTIONAL_SIGNAL_MODEL.md) before changing the diary schema, input flow, or recommendation engine.

## Run locally

Requirements: Node.js 20 or newer, PostgreSQL 15, and a TMDB API key.

```bash
npm install
npm --prefix server install
```

Create `server/.env`:

```dotenv
DATABASE_URL=postgresql://postgres:password@localhost:5432/emotionflix_dev
JWT_SECRET=replace-with-a-long-random-value
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
TMDB_API_KEY=your-tmdb-api-key
PORT=3001
```

Create `.env.local` at the repository root:

```dotenv
VITE_API_URL=http://localhost:3001/api
```

Apply `database/schema.sql`, then run the API and frontend in separate terminals:

```bash
npm --prefix server run dev
npm run dev
```

The frontend runs at `http://localhost:5173`. The API runs at `http://localhost:3001`.

## Seed data

The application does not create demo or community content at startup. [`database/seed-contract.json`](./database/seed-contract.json) defines the complete contract for a separate seed-data task.

## Verification

```bash
npm run lint
npm run build
npm test
npm --prefix server run build
npm --prefix server test -- --runInBand
```

The product documents are source-of-truth constraints, not launch copy. When implementation and documentation differ, preserve user data and update the implementation toward the documented model deliberately.
