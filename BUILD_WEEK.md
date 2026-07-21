# OpenAI Build Week work

Moodie did not begin as a Build Week project.

The [official rules](https://openai.devpost.com/rules) define the submission period as July 13, 2026 at 9:00 AM PT through July 21, 2026 at 5:00 PM PT.

The original application was a class project called EmotionFlix. It used a face or photo to estimate emotion, mapped that estimate to genres, and mixed ratings and popularity into recommendations. It worked as a technical project. It did not understand the part of watching a film that I cared about.

A face cannot explain why a scene stayed with someone. A rating cannot show the contradiction of loving what a film did while hating what it asked you to accept. Before Build Week, I had already started moving the project toward that problem. Moodie was becoming a place to record what a film meant, keep the feelings that remained, and discover films through people who had responded similarly to the same ones.

## What existed before the submission period

The repository itself predates Build Week. Commit [`1f4a3fd`](https://github.com/Prashant002-1/Emotionflix/commit/1f4a3fd8965f9b9d3af963dafad0d11e5caa5520), dated January 21, 2026, is the public baseline before the relaunch branch. It contains the earlier EmotionFlix implementation, authentication, facial-expression capture, manual emotion controls, emotion-to-genre personalization, rating-led recommendations, watchlist concepts, and the original React, Express, and PostgreSQL architecture.

A timestamped Codex session from July 10 documents that the product and design relaunch had already started before the official submission period. The first three branch commits, [`24f4e7e`](https://github.com/Prashant002-1/Emotionflix/commit/24f4e7e), [`99809d8`](https://github.com/Prashant002-1/Emotionflix/commit/99809d8), and [`af9cd5d`](https://github.com/Prashant002-1/Emotionflix/commit/af9cd5d), checkpoint that mixed pre-existing state. I am not presenting those commits as eligible Build Week work.

## What I built during Build Week

The Build Week contribution begins after `af9cd5d`. The eligible range contains 15 commits from [`7ffe1f4`](https://github.com/Prashant002-1/Emotionflix/commit/7ffe1f4) through [`ce4630c`](https://github.com/Prashant002-1/Emotionflix/commit/ce4630c). The range changes 88 files, with 12,701 additions and 3,409 deletions.

The first version tried too hard to explain the idea. I turned the landing sequence into a guide with rows, labels, controls, and states. It was mechanically correct and emotionally wrong. The correction was simple: keep the cinematic scene, let the response carry the meaning, and stop explaining every connection. That decision shaped the rest of the product.

From there, Moodie became a complete social film-discovery product. People can record a film with their own words and feeling mix, keep it private or publish it, and optionally attach a photo that is never analyzed. The diary keeps that history. Following and Everyone show complete responses rather than isolated activity. People, member pages, likes, comments, saved films, and activity all lead back to a person, a film, and what stayed with them.

Recommendations now come through people. Moodie finds films two people have both recorded, compares the feelings they chose for those films, and opens a path to other films that moved the connected person. The explanation shows the person, the shared film, and the public response behind the recommendation. It does not show a compatibility score. It does not use a genre stereotype, a user rating, or a TMDB vote value as emotional evidence.

The work also made the product runnable as one application. The relaunch uses one dependency install, an embedded PGlite database, one development command, and one production process. The social demo contains connected people with individual histories, shared films, private and public responses, saved films, follows, likes, and comments. Its verifier checks the product contract and proves that rerunning the seed does not erase non-seed relationships.

## Commit evidence

The complete eligible comparison is:

[`af9cd5d...ce4630c`](https://github.com/Prashant002-1/Emotionflix/compare/af9cd5ddf0299570def10aa6fd600b5b8568fa6b...ce4630c)

| Date | Commits | Work completed |
| --- | --- | --- |
| July 14 | `7ffe1f4`, `2ec8b9a`, `89d1065` | Tested the passed-response story, corrected the over-mechanical direction, and brought the Moodie identity into the landing experience. |
| July 15 | `ce48ade`, `7e4f909`, `301c611`, `0957de6`, `f15db1f`, `bc7d64c` | Rebuilt and refined the landing product demo, palette, hero composition, motion, and header transition. |
| July 17 | `7efd4a6` | Rebuilt the application around social film discovery. |
| July 18 | `a89959f` | Refined the signed-in home and its discovery paths. |
| July 21 | `c157ecc`, `5f453ad`, `1641f2f`, `ce4630c` | Expanded social discovery and completed the rendering, framing, and scrolling work. |

The pull request preserves these commits individually.

<!--
Submission drafting anchors. Replace this comment with the finished sections after Prashant provides the contribution story.

## Codex contribution

Explain where Codex accelerated the work, where the collaboration challenged or corrected a decision, and which part of the final implementation came from that process.

## GPT-5.6 contribution

Identify the concrete part of the product built with GPT-5.6 instead of making a general model-use claim.

## Decisions I kept ownership of

Possible evidence from the project record includes response-not-review, removing facial inference, keeping optional media separate from emotional evidence, rejecting compatibility scores, and preserving the cinematic hero when an implementation became too mechanical.
-->

## Verification

The Build Week branch is checked with:

```bash
npm run lint
npm run build
npm test
npm --workspace server test -- --runInBand
npm run seed:verify
```

The current results are 8 passing frontend tests, 41 passing server tests, successful frontend and server builds, and a 10-step seed verification covering demo access, response provenance, privacy, social streams, connected people, people-led recommendations, rerun stability, and preservation of non-seed relationships.
