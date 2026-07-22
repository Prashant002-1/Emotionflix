# Product

## Product purpose

Moodie is emotion-based social film discovery.

A person shares a film alongside what it meant to them and the feelings that stayed with them. A shared film and overlapping feelings can connect that person to someone else's response, then to another film. The signed-in feed keeps people and their responses at the center. The diary preserves a person's history, and the catalog remains available underneath discovery.

Moodie is not a review platform. It does not ask people to judge a film, assign a score, or write criticism. It asks for a first-person response: how the film felt, what it brought up, and what remained afterward.

## The social response

One shared response contains:

- the film;
- a first-person note about what the film meant to the person;
- a reviewed mix of feelings;
- public or private visibility;
- an optional expression photo chosen by the person.

The note and feeling controls are the complete path. The person sets the feelings that belong to the viewing before saving.

An expression photo is an optional, playful reaction attached to a response. It adds a little life when the person wants it; it is not emotional evidence, is never analyzed, and is optional even when the response is public.

There are no user ratings. TMDB metadata may contain catalog values internally, but ratings and vote counts do not appear in the product experience and do not power personal recommendations.

## Product surfaces

The complete signed-in information architecture and user journeys live in `docs/PRODUCT_SPEC.md`.

### Public overview

The public landing page explains the product as a human sequence: the small moment after a film, keeping words and feelings, recognizing another person, and finding films through them. It shows multiple films so the discovery network is legible, explains who the product is for, and makes the care behind privacy, contradiction, and optional media visible. It does not expose a streaming-style catalog. The one-step demo is the route into the product.

### Feed

The signed-in home has For you, Following, and Everyone views. For you leads with one recommendation from a real person, then keeps recommended films, followed responses, people, active community films, and saved films within reach. Each recommendation names the person and shared film, shows the feelings both people recorded there, and carries the public response behind the recommended film. Following and Everyone become chronological streams of complete responses. Every response keeps the person, film, note, feeling trace, and optional photo together. The home is dense enough to support several discovery paths without becoming a metrics dashboard or making photos and likes the primary content.

### Add a film

The composer starts with a film, then asks: how did it make you feel, and what did it mean to you? Direct controls and writing create one complete response.

### Discovery paths

Recommendations are not a primary destination in the navigation. They begin inside the response stream or immediately after a response is saved, when a person who felt something similar about the same film creates a path to another film. The sequence is:

1. find a film both people responded to;
2. compare their reviewed feeling mixes for that film;
3. identify people with meaningful emotional overlap;
4. recommend other films those people responded to strongly;
5. show the people and shared film behind the recommendation.

One shared film can begin a recommendation path. Repeated overlap strengthens that connection as both diaries grow. A person can follow the path into a focused exploration view, open the film, or continue to the source person's responses. Search remains a supporting tool, not the product's organizing idea.

### Diary

The diary is a person's private and public history. It supports editing, visibility, saved films, and reflection over time. It does not turn the person into a taste score or genre profile.

### People

People is the connection surface. It separates people already followed from wider discovery, keeps each person's latest film and response visible, shows a shared film when one exists, and supports following in place. It does not show compatibility scores or reduce a person to a taste profile.

### Search

Search covers films, feelings, and people. Film search supports saving and adding a response. Feeling search starts with how the person wants to feel, keeps genre open, and returns films that connected people described with those feelings. Every result keeps the person, shared film, overlapping feelings, and source response visible. People results keep shared-film context and follow actions visible.

### Activity

Activity is the return trail for likes, comments, followers, and recent responses from people already followed. Every event links to the person, film, or exact response that caused it. The product does not claim unread state without storing it.

### Film and member pages

A film page leads with the film, then separates responses from related films. A member page uses separate views for that person's public responses and the films that stayed with them. Navigation should move naturally between a person, a shared film, and another response without placing every path on screen at once.

## Recommendation rules

- People-led recommendations are the primary personalized source.
- Similarity is grounded in reviewed feelings on films both people have seen.
- A recommended film must come from a real public response by a matched person.
- Reasons name the person and shared film, show the feelings both people recorded on that film, and show what the source person felt after the recommended film.
- A person may compare both written responses to the shared film without seeing an internal score.
- Genre, TMDB rating, vote count, and universal emotion-to-genre mappings do not determine recommendations.
- Popular or trending catalog items may be used only as an explicitly separate cold-start or browse fallback.
- Pseudo-scientific percentages are not presented as proof of compatibility.

## Product principles

1. **People are the discovery engine.** Films become relevant through another person's lived response.
2. **Response, not review.** The product invites meaning and feeling, not scores or criticism.
3. **The person is the authority.** Direct input is complete.
4. **Social has a purpose.** Follows, public responses, likes, and comments create paths to films rather than popularity theater.
5. **Private stays private.** A private response may improve the owner's matching but never appears in another person's feed or recommendation explanation.
6. **Media is not evidence.** An attached expression photo is optional social context, not a biometric signal.
7. **No emotional stereotypes.** Sadness does not mean drama, and joy does not mean comedy. Relationships are learned between people and films.
8. **Simple language.** Use response, feelings, note, person, film, diary, and recommendation only when the word is needed. Avoid invented system names, page-sized labels, and technical explanations in the interface.
9. **Film art and human words carry the experience.** Technology should remain quiet.

## Data boundaries

`diary_entries` is the source of truth for one person's response to one viewing. The film, note, visibility, and reviewed feeling mix are saved atomically.

The reviewed feeling mix is set directly by the person. Only those saved values are used for matching.

Optional post media is stored separately from the reviewed feeling mix. Removing the media must not change the meaning or recommendation value of the response.

Saved films, follows, likes, and comments are separate relationships. A like expresses resonance with a response, not a universal judgment of a film.

The current seven-key vector is a prototype constraint. It must not become the permanent feeling vocabulary. The target is defined in `docs/EMOTIONAL_SIGNAL_MODEL.md`.

## API boundaries

- `/api/catalog`: server-side TMDB access; keys never ship to the browser.
- `/api/diary`: complete response reads and writes plus diary summary.
- `/api/library`: saved films only.
- `/api/recommendations`: people-led recommendations and separate catalog fallbacks.
- `/api/discovery`: feed, public responses, people, follows, likes, and comments.
- `/api/discovery/activity`: likes, comments, and follows that lead back to the exact social event.
- `/api/discovery/pulse`: films with recent public responses from the community.
- `/api/auth/demo`: opens the prepared demo session and returns its initial product data.

## Accessibility and inclusion

Target WCAG 2.2 AA. Every core flow works with keyboard input. Focus remains visible. Tap targets are at least 44 by 44 pixels. Motion respects `prefers-reduced-motion`. Feeling data never relies on color alone.

## Data policy

Attaching a photo is a separate, explicit choice. Photos are never analyzed and do not affect recommendations. Private responses remain private. Written notes remain part of the diary. No demo-content seeding runs at server startup. `database/seed-contract.json` defines the separate seed-data task.
