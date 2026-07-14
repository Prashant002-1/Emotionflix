# Product

## Product purpose

EmotionFlix is emotion-based social film discovery.

A person shares a film alongside what it meant to them and the feelings that stayed with them. Other people who responded similarly to the same film become a path to what to watch next. The signed-in home combines the person's own usage with recent film activity. The diary preserves a person's history, and the catalog remains available underneath discovery, but neither should displace people from the center of the experience.

EmotionFlix is not a review platform. It does not ask people to judge a film, assign a score, or write criticism. It asks for a first-person response: how the film felt, what it brought up, and what remained afterward.

Facial-expression analysis is one optional input adapter. It is not the product, the default path, or the definition of emotion. A face can only produce a narrow expression estimate at one moment. It cannot explain what a film meant to someone.

## The social response

One shared response contains:

- the film;
- a first-person note about what the film meant to the person;
- a reviewed mix of feelings;
- public or private visibility;
- an optional expression photo chosen by the person.

The note and feeling controls are the primary paths. Suggestions may later come from the writing or another consented source, but the person reviews them before saving.

An expression photo is an optional, playful reaction attached to a response. It adds a little life when the person wants it; it is not emotional evidence, is never analyzed automatically, and is optional even when the response is public. Expression analysis is a separate opt-in adapter whose output is only a suggestion.

There are no user ratings. TMDB metadata may contain catalog values internally, but ratings and vote counts do not appear in the product experience and do not power personal recommendations.

## Product surfaces

### Public overview

The logged-out landing page explains the product as a human sequence: the small moment after a film, keeping words and feelings, recognizing another person, and finding films through them. It shows multiple films so the discovery network is legible, explains who the product is for, and makes the care behind privacy, contradiction, and optional media visible. It does not expose a streaming-style catalog. Sign in and the one-step demo are the routes into the product.

### Home and activity

Home is the signed-in orientation surface. It shows the account's diary, public-response and saved-film counts; active films across the community; compact recent activity; the latest diary entries; and saved films. It does not reuse landing-page storytelling, use a generic `Feed` heading, create portrait-first social cards, or duplicate publishing actions. Following changes whose activity appears first.

### Add a film

The composer starts with a film, then asks: how did it make you feel, and what did it mean to you? Direct sliders and writing are sufficient. Optional adapters belong in a secondary area. One save creates one complete response.

### Discover

Recommendations begin with people who felt something similar about the same films. The primary path is:

1. find a film both people responded to;
2. compare their reviewed feeling mixes for that film;
3. identify people with meaningful emotional overlap;
4. recommend other films those people responded to strongly;
5. show the people and shared film behind the recommendation.

Browse and search remain available below this people-led layer. They are supporting catalog tools, not the product's organizing idea.

### Diary

The diary is a person's private and public history. It supports editing, visibility, saved films, and reflection over time. It does not turn the person into a taste score or genre profile.

### Film and member pages

A film page leads with the film and then shows how people felt. A member page shows that person's public responses and the films that stayed with them. Navigation should move naturally between a person, a shared film, and another response.

## Recommendation rules

- People-led recommendations are the primary personalized source.
- Similarity is grounded in reviewed feelings on films both people have seen.
- A recommended film must come from a real public response by a matched person.
- Reasons name the person and the shared film in plain language.
- Genre, TMDB rating, vote count, and universal emotion-to-genre mappings do not determine recommendations.
- Popular or trending catalog items may be used only as an explicitly separate cold-start or browse fallback.
- Pseudo-scientific percentages are not presented as proof of compatibility.

## Product principles

1. **People are the discovery engine.** Films become relevant through another person's lived response.
2. **Response, not review.** The product invites meaning and feeling, not scores or criticism.
3. **The person is the authority.** Direct input is complete. Any derived value is an editable suggestion.
4. **Social has a purpose.** Follows, public responses, and reactions create paths to films rather than popularity theater.
5. **Private stays private.** A private response may improve the owner's matching but never appears in another person's feed or recommendation explanation.
6. **Media is not evidence.** An attached expression photo is optional social context, not a biometric signal.
7. **No emotional stereotypes.** Sadness does not mean drama, and joy does not mean comedy. Relationships are learned between people and films.
8. **Simple language.** Use response, feelings, note, person, film, feed, diary, and recommendation. Avoid invented system names and technical explanations in the interface.
9. **Film art and human words carry the experience.** Technology should remain quiet.

## Data boundaries

`diary_entries` is the source of truth for one person's response to one viewing. The film, note, visibility, and reviewed feeling mix are saved atomically.

Input evidence and the reviewed feeling mix are different concepts. Direct sliders, text-derived suggestions, and expression estimates may contribute suggestions. Only the values the person accepts are used for matching.

Optional post media is stored separately from the reviewed feeling mix. Removing the media must not change the meaning or recommendation value of the response.

Saved films, follows, and reactions are separate relationships. Reactions express resonance with a post, not a universal judgment of a film.

The current seven-key vector and `manual`, `upload`, and `webcam` sources are prototype constraints. They must not become the permanent feeling vocabulary or source model. The target is defined in `docs/EMOTIONAL_SIGNAL_MODEL.md`.

## API boundaries

- `/api/catalog`: server-side TMDB access; keys never ship to the browser.
- `/api/diary`: complete response reads and writes plus diary summary.
- `/api/library`: saved films only.
- `/api/recommendations`: people-led recommendations and separate catalog fallbacks.
- `/api/discovery`: feed, public responses, people, follows, and reactions.
- `/api/auth`: account access and profile changes.

## Accessibility and inclusion

Target WCAG 2.2 AA. Every core flow works with keyboard input. Focus remains visible. Tap targets are at least 44 by 44 pixels. Motion respects `prefers-reduced-motion`. Feeling data never relies on color alone. A complete response can be created without a camera, microphone, biometric input, or model access.

## Data policy

Raw camera frames and uploaded images used for an expression estimate stay in the browser and are discarded after review. Attaching a photo to a public post is a separate, explicit choice. Private responses remain private. Written notes remain part of the diary; future text analysis stores only the reviewed result and minimum provenance. No demo-content seeding runs at server startup. `database/seed-contract.json` defines the separate seed-data task.
