# Emotional signal model

## Decision

Moodie saves how a person says a film felt. The person is the source of that record.

The saved feeling mix is compared with other people's public responses to the same films. That overlap creates a path to films that moved those people next. Moodie does not infer feelings from a face, photo, genre, rating, or popularity score.

## The reviewed feeling mix

One viewing has one current feeling mix. The person sets every value directly and can revise it later.

The mix belongs to a complete response that also contains:

- the film;
- the viewing date;
- a first-person note;
- public or private visibility;
- an optional attached photo.

Matching uses only the saved feeling mix. The note and photo do not silently change it.

## Optional post media is separate

A person may attach an expression photo to a response. This photo is social media, not emotional evidence.

- It is never analyzed.
- It is not required for a public response.
- It does not affect matching or recommendation order.
- Removing it does not alter the feeling mix.
- It requires a separate attachment choice.

## Person-to-person overlap

Overlap begins when two people respond to the same film. Their saved feeling mixes for that film can be compared.

One shared film can open an initial recommendation path. More shared films strengthen or weaken the connection as both diaries grow. The result is contextual, not a personality diagnosis. It means two people responded similarly to particular films.

## Feeling vocabulary

The current seven keys, `neutral`, `happy`, `sad`, `angry`, `fearful`, `disgusted`, and `surprised`, are an implementation scaffold. They are not the final vocabulary for film response.

The target vocabulary should support mixed and film-specific responses such as tenderness, melancholy, wonder, unease, tension, joy, amusement, grief, anger, and emotional distance. A person may feel several at once. Values do not need to add up to 100 percent.

The vocabulary must be versioned. Historical entries retain the version they used. A migration must not silently reinterpret a person's response.

## Recommendation model

### Primary people-led path

1. Load the person's diary entries and saved feeling mixes.
2. Find public responses by other people to the same films.
3. Compare the feeling mixes for each shared film.
4. Strengthen a connection when meaningful overlap repeats across films.
5. Gather unseen films from those people's public responses.
6. Rank candidates by the human connection and the saved feelings on the recommended film.
7. Return the person, shared film, and public response that explain each recommendation.

The interface uses plain language. It names the person and shared film, and can show what the person wrote about the recommended film. It does not expose a compatibility percentage.

### Feeling intent

A person may say what they want to feel next. That intent is compared with how real people described the recommended film, not with its genre.

A horror film that made someone happy can therefore appear when another person asks for something happy. Moodie follows the response, not a category assumption.

### Exclusions

User ratings do not exist. TMDB ratings, vote counts, genres, and universal emotion-to-genre maps do not contribute to personal matching or recommendation rank.

### Cold start and search

When there is no shared-film connection, personal recommendations stay empty. The interface asks the person to add a response and may show public activity in a clearly separate section.

Film search remains available. Search is a catalog tool, not a personalized recommendation.

Private responses may help their owner internally, but their film title, note, feelings, or existence must never appear to another person. Recommendation explanations may name only public responses.

## Interaction rules

The composer starts with the film and then asks how it felt and what it meant. Direct controls and writing are the complete path. Publishing and optional photo attachment are separate choices.

Use plain terms: feelings, response, person, shared film, recommendation, feed, and diary. Avoid emotion detection, face reading, mood scan, taste DNA, emotional fingerprint, or any claim that the product understands the person.

## Current implementation boundary

The current schema stores one seven-key vector on each diary entry. New responses enter those values directly. Older provenance columns remain only for data compatibility and are not accepted or returned by the active diary API.

Before expanding the feeling vocabulary, add a vocabulary version and a migration path. Preserve `diary_entries` as the atomic viewing response and keep optional media in `entry_media`.
