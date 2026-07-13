# Product

## Register

brand

## Product purpose

EmotionFlix is emotion-based social film discovery, built on a personal film diary.

A person records a viewing as one entry: the film, date, rating, note, visibility, and emotional record. The record is source-agnostic. A person can set it directly with sliders or labels, ask for suggestions from a written note or review, or choose another consented input that can produce emotional evidence. Any derived values remain suggestions until the person reviews them.

Facial-expression analysis is one optional input adapter. It is not the product, the default path, or the definition of emotion. A face can only provide a narrow expression estimate at one moment. It cannot explain what a film meant to someone.

The recommendation engine reads patterns across the diary. It learns relationships among films, ratings, written responses, reviewed emotional records, and recurring taste for that person. It also compares those patterns with other people. A temporary discovery intent can shift the current results, but the diary remains the base layer.

Public entries create a second discovery path. People can find films through viewers whose response patterns feel familiar, follow those diaries, and react to individual entries. This is social discovery through recorded resonance, not a feed of what is broadly popular.

## Core record

`diary_entries` is the source of truth for the reviewed viewing record. A viewing and its canonical emotional response must never be split across separate writes or joined by timestamp proximity.

Input evidence and the reviewed emotional record are different concepts. Direct sliders, text-derived suggestions, and measured estimates may all contribute evidence. The reviewed record is what the person accepts or edits and what the recommendation engine may use. Provenance and model confidence describe how a suggestion was produced. They do not describe whether the person's feeling is true.

Saved films, follows, and reactions are separate relationships. They do not change the meaning of a diary entry.

The current seven-key emotion vector and `manual`, `upload`, and `webcam` source enum are prototype constraints. They must not become the permanent emotional vocabulary or source model. The target model is defined in `docs/EMOTIONAL_SIGNAL_MODEL.md`.

The old list, standalone emotion, profile, and user-maintained genre-mapping APIs are not part of the current product.

## User journeys

### Understand the product

A visitor lands on a public product overview and can answer three questions without signing in: what a person records, how repeated records change recommendations, and how emotional similarity between people creates social discovery. The visitor enters the product only after signing in or choosing the one-step demo.

### Add a diary entry

An authenticated person searches for a film, records the viewing details, chooses private or public visibility, and creates an emotional record. Direct input and writing are the primary paths. Analysis can suggest values from the note or review. Other inputs, including expression analysis, remain optional and secondary. One save creates one complete diary entry. The date, rating, note, visibility, emotional record, and reviewed source suggestions remain editable afterward.

### Find the next film

The recommendation API ranks films from the accumulated diary pattern and excludes films already recorded. The interface shows the history size, dominant emotional traces, recurring film relationships, and a short reason for each personal recommendation. A temporary discovery intent is optional and can be entered directly or described in words.

### Discover through people

The community route shows public entries and people with established patterns. Each person opens into a full public diary. Film pages also show public entries for that film, so discovery can move between a film, a person, and the larger diary pattern. Following changes feed order. Reactions stay attached to entries and do not pretend to be a universal rating.

## Product principles

1. **Emotion-based social discovery is the product.** The diary exists to preserve emotional memory. The social layer exists to find people whose response patterns reveal films worth watching.
2. **The person is the authority.** Direct input is valid on its own. Any machine-derived value is a suggestion that the person can accept, edit, or ignore.
3. **The emotional record is source-agnostic.** Sliders, labels, writing, expression estimates, and future consented inputs can use one adapter contract without defining separate products.
4. **Writing is emotional evidence.** A note or review can contain more context than a momentary expression. Text-derived suggestions belong beside direct input, not behind facial analysis.
5. **Facial expression is peripheral.** Camera and photo analysis are optional experiments. They never lead the landing page, entry flow, navigation, imagery, or recommendation explanation.
6. **Record, do not diagnose.** Emotion values describe what the person chose to save about a viewing. The product does not infer identity, mental health, or an objective internal state.
7. **Learn personal relationships, not universal stereotypes.** The system should learn how this person responds to films. It must not permanently encode rules such as sadness means drama or joy means comedy.
8. **Recommendations must show their source.** History size, recurring traces, film relationships, and item-level reasons make personalization visible without exposing internal scoring.
9. **Social means people, not volume.** Public diary entries, follows, and resonance reactions matter. Popularity alone is not a social layer.
10. **Private by default.** New entries begin private. Publishing is an explicit choice.
11. **Film art carries the atmosphere.** The interface frames the record and the artwork. Decorative technology imagery has no place in the product.

## API boundaries

- `/api/catalog`: server-side TMDB access. The TMDB key never ships to the browser.
- `/api/diary`: complete diary-entry reads and writes plus personal summary.
- `/api/library`: saved films only.
- `/api/recommendations`: diary-derived ranking with an optional temporary discovery intent.
- `/api/discovery`: public entries, people, follows, and reactions.
- `/api/auth`: account access and password changes.

## Accessibility and inclusion

Target WCAG 2.2 AA. Every flow works with keyboard input. Focus remains visible. Tap targets are at least 44 by 44 pixels. Body copy and placeholders meet contrast requirements. Motion respects `prefers-reduced-motion`. Emotion data never relies on color alone. Direct entry and text remain complete without camera, microphone, biometric, or model access. Every optional sensor or analysis method requires an explicit action and a review step.

## Data policy

Raw camera frames and uploaded images stay in the browser and are discarded after review. Written notes remain part of the diary entry; text analysis stores only the reviewed emotional result and the minimum provenance required to reproduce or explain the suggestion. The system distinguishes model confidence from human certainty. No automatic demo-content seeding runs at server startup. `database/seed-contract.json` defines the separate seed-data task.
