# Emotional signal model

## Decision

EmotionFlix is an emotion-based social film discovery product. It is not a facial-expression detector with movie recommendations attached.

The product saves how a person responded to a film, compares reviewed feelings on shared films, and uses that overlap to reveal what emotionally similar people watched next. No single input source defines the product.

## Four separate concepts

### Emotional evidence

Evidence is an input that can contribute to a feeling suggestion:

- values set directly through sliders or labels;
- language in a note or other text the person explicitly chooses to analyze;
- an optional expression estimate from a camera frame or uploaded image;
- a future consented adapter that returns values and provenance.

Evidence is not automatically true. It is presented for review.

### Suggested feeling mix

An adapter converts evidence into proposed feeling values. A suggestion records its source, method or model version, confidence when applicable, and creation time.

Model confidence describes an adapter output. It does not say how certain the product is about the person's inner experience. Direct input has no model confidence and must not be stored with a fabricated confidence score.

### Reviewed feeling mix

The reviewed feeling mix is the canonical vector attached to one diary entry. The person can accept, edit, replace, or directly set every value. Matching uses only this reviewed mix, never unreviewed evidence.

One viewing has one current reviewed mix. Revision history and contributing suggestions may be stored separately.

### Person-to-person overlap

Overlap is calculated from films two people have both responded to. Each shared film provides a comparison between two reviewed feeling mixes. Several meaningful shared-film comparisons create a stronger connection than one coincidental match.

This connection is contextual, not a personality diagnosis. It means two people responded similarly to particular films. It may change as either diary grows.

## Optional post media is separate

A person may attach an expression photo to a public response. This photo is social media, not emotional evidence.

- It is never analyzed automatically.
- It is not required for a public post.
- It does not affect matching or recommendation order.
- Removing it does not alter the reviewed feeling mix.
- It requires a separate, explicit attachment choice.

The optional expression-analysis adapter is a different flow. If a person chooses it, the image remains local by default and produces an editable suggestion. Accepting that suggestion does not publish or attach the source image.

## Source hierarchy

Direct input is the primary path because the person is the authority on their response.

Text-derived input is the primary assisted path because writing can express context, contradiction, and meaning that a single expression cannot. The person reviews any proposed values before saving.

Facial-expression analysis is an optional secondary experiment. It estimates visible expression in one frame. It must not be described as reading, detecting, or understanding how the person felt about a film.

Future adapters use the same evidence-to-suggestion contract. Adding an adapter must not redesign the diary or recommendation model around that source.

## Feeling vocabulary

The current seven keys, `neutral`, `happy`, `sad`, `angry`, `fearful`, `disgusted`, and `surprised`, came from the face-api expression model. They are an implementation scaffold, not the final vocabulary for film response.

The target vocabulary should support mixed and film-specific responses such as tenderness, melancholy, wonder, unease, tension, joy, amusement, grief, anger, and emotional distance. A person may feel several at once. Values do not need to sum to 100 percent.

The vocabulary must be versioned. Historical entries retain the version they used; migrations must not silently reinterpret a person's response.

## Recommendation model

### Primary people-led path

1. Load the owner's diary entries with reviewed feeling mixes.
2. Find other people with public responses to the same films.
3. Compare the feeling mixes per shared film.
4. Weight a connection by overlap quality, number of shared films, and enough evidence to avoid a one-film overfit.
5. Gather unseen films from those people's public responses.
6. Rank candidates by the strength of the human connection and the matched person's emotional engagement with that candidate.
7. Return the people and shared films that explain each recommendation.

The interface translates this into plain language, for example: “Maya felt something similar about *Past Lives*. This stayed with her too.” It does not expose a percentage as objective proof.

### Exclusions

User ratings do not exist. TMDB ratings, vote counts, genres, and universal emotion-to-genre maps do not contribute to personal matching or recommendation rank. A person's note may later contribute semantic context after explicit review, but it cannot replace the saved feeling mix without consent.

### Cold start and browse

When there is not enough shared-film evidence, the system may show a separate community or catalog fallback. That fallback must be labeled through placement and language, kept distinct from personal recommendations, and replaced as real people-led evidence grows.

Private entries may help match their owner internally, but their film title, note, feelings, or existence must never appear to another person. Recommendation explanations may name only public responses.

## Interaction rules

The public landing page is a product overview. The signed-in home is an activity and usage dashboard.

The composer starts with the film and then asks how it felt and what it meant. Direct controls and writing are sufficient. Optional adapters sit in a secondary disclosure. Publishing and optional photo attachment are separate choices.

Use plain terms: feelings, response, suggestion, source, person, shared film. Avoid emotion detection, face reading, mood scan, taste DNA, emotional fingerprint, or any claim that the product understands the person.

## Privacy and consent

Every derived source is opt-in. The person must know which input will be analyzed and what will be saved before analysis begins.

Raw camera frames, uploaded analysis images, audio, or other sensor data are not persisted by default. The saved response contains the reviewed feeling values and limited provenance. A public media attachment is stored only after a separate explicit choice.

Private responses remain private. Publishing is independent from accepting a feeling suggestion.

## Current implementation boundary

The current schema stores one seven-key vector with `capture_method` limited to `manual`, `webcam`, or `upload`, plus one numeric confidence value. The current interface supports sliders and optional face-api expression estimates. Text-derived suggestions are not implemented yet.

Before adding text or other adapters, separate reviewed feeling mixes from source observations. The target model needs:

- an extensible source identifier such as `direct`, `text`, `expression`, `imported`, or `combined`;
- nullable model confidence;
- source and model versions;
- a vocabulary version;
- review and revision timestamps;
- optional observation rows when several sources contribute;
- a retention policy for raw evidence;
- optional post media stored outside emotional evidence.

This migration preserves `diary_entries` as the atomic viewing response while allowing input sources and social media to evolve independently.
