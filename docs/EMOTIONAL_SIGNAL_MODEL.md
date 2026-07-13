# Emotional signal model

## Decision

EmotionFlix is an emotion-based social film discovery product. It is not a facial-expression detector with movie recommendations attached.

The product records how a person responded to a film, learns patterns across that history, and connects the person with films found through people who respond in similar ways. Emotional input can come from several sources. No single source defines the product.

## Four separate concepts

### Emotional evidence

Evidence is any input that can contribute to an emotional record. It may be direct, written, or measured:

- values set by the person through sliders, labels, or another direct control;
- language in a diary note, review, or other text the person chooses to analyze;
- an optional expression estimate from a camera frame or uploaded image;
- a future consented adapter that can return emotional values and provenance.

Evidence is not automatically true. It is an input to review.

### Suggested emotional mix

An adapter converts evidence into a proposed set of emotional values. A suggestion records its source, model or method version, confidence when applicable, and creation time.

Model confidence means confidence in the adapter output. It does not mean confidence that the product knows how the person felt. Direct human input has no model confidence and should not be stored as a fake `1.0` confidence score.

### Reviewed emotional record

The reviewed emotional record is the canonical mix attached to one diary entry. The person can accept a suggestion, edit it, replace it, or set the values directly. Recommendations use this reviewed record, not unreviewed evidence.

One viewing has one canonical emotional record at a time. Its edit history and contributing suggestions may be stored separately.

### Emotional pattern

The emotional pattern is an aggregate learned across a diary. It relates films, ratings, notes, emotional records, genres, time, and repeated responses. It is not a diagnosis or a permanent personality profile.

A temporary discovery intent is separate from the diary pattern. It can shift current recommendations without rewriting the historical record.

## Source hierarchy

Direct input is the primary path because the person is the authority on their response.

Text-derived input is the primary assisted path because a note or review can express context, contradiction, and meaning that a single expression cannot. The product may suggest an emotional mix from selected text, but the person reviews it before saving.

Facial-expression analysis is an optional secondary experiment. It estimates a visible expression in one frame. It must not be described as reading, detecting, or understanding how the person felt about a film. It must not lead the product overview or entry flow.

Future adapters use the same evidence-to-suggestion contract. Adding an adapter must not require redesigning the diary or recommendation model around that source.

## Emotional vocabulary

The current seven keys, `neutral`, `happy`, `sad`, `angry`, `fearful`, `disgusted`, and `surprised`, came from the face-api expression model. They are an implementation scaffold, not the final vocabulary for film response.

The target vocabulary must support mixed and film-specific responses such as tenderness, melancholy, wonder, unease, tension, joy, amusement, grief, anger, and emotional distance. A person may feel several at once. Values do not need to sum to 100 percent.

The final taxonomy should be versioned. Historical entries must retain the vocabulary version they used, and migrations must not silently reinterpret a person's record.

## Recommendation rules

The engine learns relationships from a person's own history. It can use reviewed emotional values, ratings, films, genres, written responses, recency, and repeated patterns.

The engine must not depend on a permanent universal map from an emotion to a genre. Rules such as sadness means drama or joy means comedy collapse personal taste into a stereotype. A cold-start fallback may use broad catalog quality or explicitly labeled temporary priors, but personal history must replace those priors as soon as evidence exists.

Social discovery compares response patterns between people. A useful connection is not simply two people liking the same film. It can also be two people responding similarly to one set of films, followed by one person responding strongly to a film the other has not seen.

Every personal recommendation needs a short explanation grounded in real records. It should name the relevant diary pattern, film relationship, or public diary connection. It should not display a pseudo-scientific match score as proof.

## Product and interaction rules

The public landing page is a product overview. It shows how one viewing becomes a record, how records become a pattern, and how patterns between people lead to another film. Product routes begin after sign-in or the one-step demo.

The entry flow starts with the film, rating, date, note, and direct emotional input. After the person writes, the interface may offer to suggest feelings from that text. Optional expression inputs belong in a secondary area and never compete with the primary save path.

The interface uses terms such as emotional record, emotional mix, suggestion, source, and reviewed. It avoids emotion detection, face reading, mood scan, or any claim that the product understands the person.

## Privacy and consent

Every derived source is opt-in. The person must know what input is being analyzed and what will be saved before analysis begins.

Raw camera frames, uploaded images, audio, or other sensor data are not persisted by default. The saved record contains the reviewed emotional values and limited provenance. Written diary text is already part of the entry and is analyzed only after an explicit action or a clearly disclosed setting.

Private entries remain private. Publishing a diary entry is a separate action from accepting an emotional suggestion.

## Current implementation boundary

The current schema stores one seven-key vector with `capture_method` limited to `manual`, `webcam`, or `upload`, plus one numeric confidence value. The current UI supports sliders and optional face-api expression estimates. Text-derived suggestions are not implemented yet.

Before adding text or other adapters, the data model needs to separate reviewed emotional records from source observations. The likely model includes:

- an extensible source identifier such as `direct`, `text`, `expression`, `imported`, or `combined`;
- nullable model confidence rather than a forced confidence value for direct input;
- source and model versions;
- the reviewed values and vocabulary version;
- review and revision timestamps;
- optional observation rows when several sources contribute to one record;
- an explicit retention policy for raw evidence.

This migration should preserve `diary_entries` as the atomic viewing record while allowing source observations to evolve independently.
