# Moodie Devpost submission packet

Status: Submitted to OpenAI Build Week on July 21, 2026. Submission ID: `1111680`.

## Required form values

- Project name: `Moodie`
- Tagline: `Social film discovery through personal responses.`
- Category: `Apps for Your Life`
- Submitter type: `Individual`
- Country of residence: `United States`
- Repository: `https://github.com/Prashant002-1/Moodie`
- Live project: `https://moodie-server-mauve.vercel.app/`
- License: `MIT`
- Demo video URL: `https://youtu.be/OOV0_9EMOUk`
- `/feedback` session ID: `019f5988-6dab-7d61-8a00-322092de9a3b`
- Built with: React, TypeScript, Vite, Express, PGlite, Codex, GPT-5.6 Sol, TMDB API

## Project description draft

Moodie is social film discovery through personal responses. A person records what a film meant to them and the feelings that stayed. Moodie finds people who responded similarly to the same films, then opens a path to what moved those people next.

Moodie uses the TMDB API for non-commercial purposes and is not endorsed or certified by TMDB.

### Why I built it

No two people feel the same. That is the primitive behind Moodie and how I think recommendation systems should work. A person should not become a rating history, genre profile, or point in a system. If a film stays with someone, the interesting part is what it meant to them. If another person felt something familiar, that human connection can become a reason to watch what moved them next.

The idea first existed as a student project called EmotionFlix. It used facial-expression analysis, mapped emotions to genres, and mixed ratings and popularity into recommendations. I organized the idea like an app, but it never became the product I wanted. The code and interface reflected how immature my development work was at the time. I left it untouched for nearly six months.

OpenAI Build Week gave me a reason to reopen it. Seeing the frontend and product capabilities of Codex with GPT-5.6 Sol made a full relaunch feel possible. The core belief remained. The execution, product philosophy, recommendation model, design system, data, social experience, and new Moodie identity came from this work.

### What Moodie does

A response contains a film, the person's own words, a direct feeling mix, visibility, and an optional photo. Writing and feeling controls are complete on their own. A photo adds personality when someone wants it, but it is never analyzed and never changes the emotional record.

The diary keeps each viewing, including rewatches, as its own response. Following and Everyone are chronological streams of complete responses rather than isolated activity. Member pages, film pages, likes, comments, saved films, and activity all lead back to a person, a film, and what stayed with them.

Recommendations come through people. Moodie compares reviewed feelings on films two people have both recorded. Repeated overlap strengthens the connection. Conflicting overlap weakens it. An unseen film can then be recommended only when that connected person has a real public response behind it. The explanation keeps the person, shared film, overlapping feelings, and source response visible. There are no user ratings, genre stereotypes, compatibility percentages, popularity shortcuts, or TMDB vote values in the personal recommendation path.

### What changed during Build Week

The full relaunch from the dormant student baseline changes 159 files, with 30,628 additions and 22,080 deletions. The dated 15-commit Build Week implementation range changes 88 files, with 12,701 additions and 3,409 deletions.

The old face-first application became a social film-discovery product. I removed the browser facial-analysis engine, static emotion-to-genre rules, rating-led recommendation paths, Docker requirement, separate system database, duplicate package lock, and old frontend scaffolding. Moodie now runs from one dependency install, one embedded PGlite database, one development command, and one production process.

The product gained a real diary, direct response composer, people-led recommendation engine, people and member pages, film response pages, following, likes, comments, saved films, activity, privacy boundaries, a deterministic social demo, and a complete public-to-demo journey.

### How I used Codex

My workflow with Codex stayed simple. It was one-to-one work with the agent across the repository. I explained what felt wrong. Codex inspected the product and code, implemented a direction, ran it, and returned something concrete. I reacted to that result and steered the next pass. I could keep the same loop moving from my computer or while I was away.

Codex untangled a codebase that was too immature to explain itself cleanly. It recovered the intention from old components and files without preserving all of their assumptions. It worked across frontend, backend, database, browser, tests, and Git history. It could test a recommendation engine separately before integrating it, trace private and public data behavior, run the product in the browser when evidence was needed, and keep the system runnable while the product direction changed.

Its image workflow also became part of the build. I generated palette studies inside the coding session before committing to the visual direction. Later, Codex generated candid response photos, attached them to specific seeded people and films, and verified where they appeared. The final demo has 14 natural response photos, with 11 in the first 12 timeline entries.

After enough sessions, Codex could recognize the patterns in how I worked. It reviewed the project history and created a local Moodie skill under `.agents/skills`. That skill records the product thesis, the design directions I rejected, the elements I approved, and the difference between an authored film product and generic media UI. I no longer have to restate that context every time I return to the project.

### How GPT-5.6 Sol changed the product

GPT-5.6 Sol was most valuable when the project needed judgment. It read a facial-recognition project and challenged the idea that facial recognition belonged at the center. It pushed the emotional record back to the person. Writing and direct feeling controls became the truth. Optional media became separate from emotional evidence.

That was not a small feature change. It changed the architecture of the product and the recommendation engine. I had used other models on this project before, but none pushed back on the premise with the same autonomy or creativity.

GPT-5.6 Sol also helped shape the visual product through iteration. It could translate product philosophy into layout, motion, data, and code, then understand direct criticism when the result felt generic, empty, or too mechanical. The final identity came from that friction: a mineral and ink field, photographic grain, moving film states, natural response images, a paper response card with a hard shadow, direct language, and a signed-in application that behaves differently from the public landing page.

I remained the person making the decisions. I kept steering the work toward something personal, human, clean, and simple. Codex and GPT-5.6 Sol made those decisions testable at the speed required to rebuild the product during Build Week.

### Data and recommendation quality

The deterministic demo contains 12 people, 86 films, 163 responses, 104 public posts, 71 saved films, 32 follows, 223 likes, 24 comments, and 14 optional response photos. The records vary in length, privacy, contradiction, emotional intensity, rewatches, and conversational depth.

The recommendation engine was tested separately before integration. It excludes watched films and private source responses, preserves person and shared-film provenance, and produces different results for different requested feelings without using genres, ratings, popularity, embeddings, or text classification.

One path captures the product clearly. A joyful request can surface *Scream* through Ananya because her actual response was joyful and she shares emotional common ground with the viewer on *Whiplash*. Moodie does not claim that horror means joy. It shows that one person experienced one film that way.

### Verification

The current application passes frontend and server production builds, lint, 8 frontend tests, 41 server tests, and a 10-step seed verifier covering access, provenance, privacy, timeline diversity, generated media, people-led recommendations, idempotency, and preservation of non-seed relationships.

The repository includes setup instructions, demo credentials, the seed contract, verification commands, the full Build Week story, and every dated relaunch commit.

## Submission answers

### Repository URL

`https://github.com/Prashant002-1/Moodie`

### Testing instructions

Open `https://moodie-server-mauve.vercel.app/` for the hosted project and choose `Enter demo`. For the complete local demo, run `npm install`, copy `.env.example` to `.env`, add a TMDB API key, run `npm run seed`, then run `npm run dev`. Open `http://localhost:5173` and choose `Enter demo`.

### `/feedback` session

`019f5988-6dab-7d61-8a00-322092de9a3b`

Session title: `Redesign minimal product page`

### Video URL

`https://youtu.be/OOV0_9EMOUk`
