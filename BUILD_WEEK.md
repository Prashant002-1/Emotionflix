# OpenAI Build Week: From a dormant idea to Moodie

No two people feel the same. I have believed that for a long time, and it is the primitive behind Moodie. A recommendation should not begin by reducing someone to a rating history or a point in a system. It should begin with what a film meant to them, find another person who felt something familiar, and let that person create the path to what comes next.

## The idea before Build Week

The idea first existed as a student project called EmotionFlix. I built facial-expression capture, mapped emotions to genres, mixed ratings and popularity into recommendations, and organized the result like an application. It was still a school prototype. The architecture was immature, the interface followed generic product patterns, and the execution never reached the idea.

Commit [`1f4a3fd`](https://github.com/Prashant002-1/Emotionflix/commit/1f4a3fd8965f9b9d3af963dafad0d11e5caa5520), dated January 21, 2026, preserves that baseline. After it, the repository sat untouched for nearly six months. The idea stayed with me, but the product did not move.

OpenAI Build Week changed that. Seeing what Codex and GPT-5.6 Sol could do with frontend work, a real repository, and sustained product context pushed me to reopen it. I did not want to reskin the school project. I wanted to see whether the original belief could finally become a product.

## What changed during Build Week

The core idea survived. Almost everything around it changed.

Moodie stopped asking a camera to decide what someone felt. Writing and direct feeling controls became complete on their own. An optional photo became a human artifact attached to a response, never biometric evidence. The recommendation engine stopped mapping emotions to genres and stopped treating ratings, popularity, or TMDB vote values as personal truth. It now connects people through reviewed feelings on films they both watched, then recommends an unseen film backed by a real public response from that person.

The product became social because the social layer has a purpose. A response, follow, like, comment, diary entry, member page, and film page all preserve the path between a person, a shared film, and what stayed with them. The interface became Moodie: cinematic without becoming dark by default, expressive without becoming busy, and personal without turning into a generic social feed.

The dormant student application also became one runnable system. Docker, the separate system database requirement, duplicate lockfiles, Tailwind scaffolding, the browser facial-analysis bundle, and old emotion-mapping paths were removed. The current application uses one dependency install, one embedded PGlite database, one development command, and one production process.

The full relaunch from the January baseline changes 159 files, with 30,628 additions and 22,080 deletions. For the dated Build Week implementation record, the repository preserves 15 commits after [`af9cd5d`](https://github.com/Prashant002-1/Emotionflix/commit/af9cd5d), from [`7ffe1f4`](https://github.com/Prashant002-1/Emotionflix/commit/7ffe1f4) through [`ce4630c`](https://github.com/Prashant002-1/Emotionflix/commit/ce4630c). That range alone changes 88 files, with 12,701 additions and 3,409 deletions. The first three relaunch commits remain in the history as restart and checkpoint work around the opening of the event. They are not included in the 15-commit comparison.

## Codex contribution

My Codex workflow was deliberately simple. It was one person working with one agent across the repository. I explained what felt wrong. Codex inspected the current product and code, implemented a direction, ran it, and brought back something concrete. I reacted to the result and steered the next pass. I could continue that loop from my computer or while I was away without turning the work into a complicated agent system.

Codex handled the full working surface. It read and refactored an old frontend and backend, ran builds and tests, exercised the product in the browser when visual or runtime evidence was needed, traced privacy and recommendation behavior, simplified the runtime, and kept commits recoverable as the direction changed. This mattered because the old code was not clean enough to explain itself. Codex could recover the intention from immature components and files without treating the old architecture as sacred.

The built-in image workflow became part of the product work rather than a separate design process. Inside coding sessions, Codex generated palette studies that helped establish the visual direction and candid reaction images that were then attached to specific seeded responses. The finished seed includes 14 natural response photos. Eleven appear within the first 12 timeline entries, so the application feels inhabited immediately rather than filling the feed with repeated or posed assets.

The collaboration also became more useful over time. After enough correction and approval had accumulated, Codex reviewed the project sessions and created a repository-specific skill under [`.agents/skills/shape-emotional-film-product`](./.agents/skills/shape-emotional-film-product). The skill records the difference between edited richness and clutter, cinematic warmth and generic darkness, response and review, people-led discovery and compatibility theater, and preservation versus overcorrection. It lets later sessions begin with the product's actual history instead of making me repeat every preference.

## GPT-5.6 Sol contribution

GPT-5.6 Sol contributed most when the project needed judgment rather than more code. It read a facial-recognition project and recognized that facial recognition was not the product. It pushed the emotional record back to the person and separated direct input from optional media. I had tried other models on this project before. None of them challenged the premise this clearly.

That correction changed the recommendation engine. The new engine is intentionally lean. It compares reviewed feeling mixes on shared films, rewards repeated emotional overlap, weakens conflicting overlap, excludes films the viewer has already watched, keeps private responses out of public explanations, and recommends only films supported by a real person's public response. It was first tested as a side experiment before being integrated. The point was not to build a perfect recommender. It was to prove that a simple human path could feel natural without genre rules, ratings, popularity, embeddings, or an unexplained match score.

GPT-5.6 Sol also made the frontend work feel possible. It could move from product philosophy into actual layout, motion, data, and code, then accept direct criticism when the result became generic or mechanical. One hero attempt turned the idea into a guide full of rows, labels, controls, and states. I rejected it. The next pass restored the cinematic response scene and changed only the part that was wrong. The model's value was not getting everything right on the first attempt. It was being able to understand the correction and keep working at the level of the product.

## Decisions I kept ownership of

I kept the core belief and the product boundaries. No two people feel the same. A person should not be represented as a rating profile. Recommendations should come through people. Writing and direct feeling input must be complete. Photos must remain optional and separate from emotional evidence. The engine should stay simple enough to understand.

I also remained the visual judge. Early work removed obvious slop and then became empty. Other passes replaced it with generic dark cards, security theater, streaming layouts, or a mechanical product guide. I kept steering the product toward something more personal, human, clean, and authored. That is how the mineral field, photographic grain, moving film states, hard response-card shadow, direct copy, and separation between the public landing page and signed-in application became a coherent identity.

Codex and GPT-5.6 Sol did not replace those decisions. They made it possible to test them quickly enough that I could see the wrong direction, reject it, and keep moving.

## Data and recommendation evidence

The final deterministic demo contains 12 accounts, 86 films, 163 responses, 104 public posts, 71 saved films, 32 follows, 223 likes, 24 comments, and 14 optional response photos. The writing deliberately varies between short reactions, longer reflections, contradictions, rewatches, private entries, quick replies, and fuller conversations. It is structured enough to verify but varied enough to feel like people rather than templates.

The recommendation path is visible. A joyful request can surface *Scream* through Ananya because her actual response to it was joyful and she shares emotional common ground with the demo viewer on *Whiplash*. Moodie does not claim that horror means joy. It shows that this person experienced this film that way.

The 10-step seed verifier checks demo access, direct input, response provenance, writing quality, shared-film depth, timeline diversity, media separation, people-led recommendations, privacy, idempotency, and preservation of non-seed relationships.

## Session trail

The work happened across multiple Codex sessions rather than one generated pass.

| Session title | Role in the product |
| --- | --- |
| `Redesign minimal product page` | Established the product philosophy, direct emotional input, seed contract, landing-versus-application boundary, visual direction, and the first image-generation work. |
| `Refine product direction` | Rejected generic AI design patterns and made diary, personalization, and social discovery central. |
| `Test heuristic recommendations` | Proved the people-led algorithm separately, integrated it, expanded and verified the seed world, generated response imagery, and kept the engine simple. |
| `Create project design skill` | Reviewed the project history and turned repeated feedback into the local Moodie skill. |

The `/feedback` session used for the submission will be selected by Prashant before submission.

## Commit evidence

The complete 15-commit comparison is:

[`af9cd5d...ce4630c`](https://github.com/Prashant002-1/Emotionflix/compare/af9cd5ddf0299570def10aa6fd600b5b8568fa6b...ce4630c)

| Date | Commits | Work completed |
| --- | --- | --- |
| July 14 | `7ffe1f4`, `2ec8b9a`, `89d1065` | Tested the passed-response story, corrected the mechanical hero direction, and brought the Moodie identity into the landing experience. |
| July 15 | `ce48ade`, `7e4f909`, `301c611`, `0957de6`, `f15db1f`, `bc7d64c` | Rebuilt and refined the landing product demonstration, palette, hero composition, motion, and header transition. |
| July 17 | `7efd4a6` | Rebuilt the application around social film discovery. |
| July 18 | `a89959f` | Refined the signed-in home and its discovery paths. |
| July 21 | `c157ecc`, `5f453ad`, `1641f2f`, `ce4630c` | Expanded the recommendation engine, social data, generated imagery, product surfaces, rendering, framing, and scrolling work. |

Pull request [#6](https://github.com/Prashant002-1/Emotionflix/pull/6) preserves every relaunch commit individually.

## Verification

```bash
npm run lint
npm run build
npm test
npm --workspace server test -- --runInBand
npm run seed:verify
```

The current results are 8 passing frontend tests, 41 passing server tests, successful frontend and server production builds, and a 10-step seed verification.
