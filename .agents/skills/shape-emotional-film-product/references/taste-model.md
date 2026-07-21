# Project taste model

This is a distilled design model from the project's direct feedback and approved iterations. It describes why choices worked or failed. Current `PRODUCT.md`, `DESIGN.md`, code, and the latest explicit instruction remain authoritative.

## The core taste

The product should feel authored by someone who cares about film as art and people as the discovery system. It should not look like a school project that received a modern theme, a streaming clone, a social-media clone, a magazine exercise, or a product-marketing deck.

The user does not reject minimalism, motion, editorial composition, dark colors, cards, or web inspiration in isolation. He rejects them when they become a substitute for product thinking and specific visual judgment.

## The durable gradients

### Edited richness, not clutter or emptiness

Early redesigns successfully removed obvious slop but became too minimal and lifeless. The user wanted more to see and do, stronger ambience, deliberate component placement, and a reason someone would return. Later empty boxes and large unused frames caused the same reaction from another direction.

The right answer is selective density. Keep the screen focused, but fill the chosen surface with real state, human writing, film art, and interaction. Hide secondary work behind tabs instead of keeping everything visible.

### Cinematic, not dark

Dark navy and black were repeatedly read as depressing rather than premium or immersive. Warmth is not beige branding or orange softness. The approved lane combined a pale mineral canvas, dark ink frames, restrained colored light, and photographic grain.

Color should move enough to make the page feel alive. It should remain a field behind the product rather than become gradient typography or neon fog.

### Material, not decorative

The user approved granular photo-like grain and rejected dot patterns. Grain should be felt before it is noticed. It must continue across connected surfaces without top and bottom seams, and local texture layers must not double it.

Selective depth worked. The response card's paper surface, internal divider, slight rotation, and hard offset shadow gave the hero personality. Flattening that card during a redesign was an overcorrection.

### Expressive, not busy or mechanical

The first hero piled ratings, stars, ink, flying quotes, a wave, fades, and unrelated timing into a few seconds. It looked chaotic. The next correction became a full-width explainer with stages, controls, and a causal diagram. It looked mechanical and destroyed the original composition.

The useful principle is one expressive behavior. Keep the hero a hero. Let a fixed composition carry a synchronized sequence through poster, person, response, and feeling. Let another person's response become the reason a film arrives. Do not diagram the mechanism.

### Direct, not generic or overexplained

Copy fails when it invents language to make the product sound important. Rejected examples included decorative labels such as "Social film discovery" and "Live response trail," visibility proof such as "public response," and vague poetic claims about a small moment after every film.

"No two people feel the same." worked because it is direct, human, and specific to the premise. The interface should show how a person records a response and how that reaches another person. It should not narrate obvious steps or expose heuristics.

### Inspired, not derivative

The user expects web research when local instincts are stale. He rejected searches that only investigated Lenis or a named mechanic because he had asked for visual inspiration. Useful research spans film sites, motion galleries, editorial work, cultural products, social discovery, and interaction patterns.

Research still has to be metabolized. A film website is not correct because it is a film website. Letterboxd is useful for film-community structure. Beli is useful for connectivity and friend discovery. Neither is a visual template.

## Product distinctions that design must protect

### Response, not review

A response captures what a film meant, the feelings that stayed, and the context in which it was watched. It is not a rating, short criticism, or generic caption. Seed copy improved when it included context, contradiction, emotional residue, and a possible path for the next person.

### People, not genres, create recommendations

The product is compelling when it can recommend a horror film for joy because a real person experienced it that way, and because the viewer shares emotional common ground with that person on other films. Genre mapping, rating rows, and unexplained compatibility scores flatten that idea.

### Optional reaction media, not biometric identity

Reaction photos can add a playful human artifact. Facial analysis is a narrow optional adapter. The visual system must not imply that the product's intelligence is face capture.

### Landing and application are different modes

The landing page can be atmospheric, animated, and explanatory through demonstration. Once signed in, all marketing language should disappear. The application should be snappy, focused, and organized around Feed, Discover, People, Diary, Add response, and Profile or their current replacements.

The same palette may connect the modes. The layout, pacing, navigation, and density do not have to match.

## Repeated frustration patterns

### Generic AI slop

This included:

- random security icons;
- people emoji and icons without a product role;
- Netflix-like catalog framing;
- Instagram-like feed composition;
- oversized "Feed," "Share a film," and duplicate add controls;
- modern dark cards presented as taste;
- arbitrary circles, waves, stars, and progress furniture;
- labels that prove a requirement rather than serve a person;
- a notebook prop used because the product contains a diary;
- marketing sections that resemble consulting slides.

### Overcorrection

Common failures were:

- removing slop and also removing ambience, content, and interaction;
- replacing an approved hero right side when only the left needed invention;
- flattening the approved response card while changing its content;
- interpreting "show the journey" as a guide or flowchart;
- using one design grammar for both the landing page and authenticated app;
- removing a visible affordance such as an underline while cleaning nearby UI.

The corrective move is preservation before invention. Record liked elements as invariants. Change only the seam that is wrong.

### Wrong research behavior

Searching narrowly for smooth scrolling missed the request for inspiration. Copying generic media conventions after broader research would fail for the opposite reason. Search widely, extract principles, and test them against the product thesis.

### Wrong work balance

Repeated browser walkthroughs and broad verification frustrated the user because implementation was moving slowly. The stable working preference is code-first progress, user-led visual review, one bounded browser check only when necessary, and one credible final gate.

## What earned direct approval

### Scale and spacing

The undersized interface read better when viewed at 110 percent. Scaling the system up by roughly ten percent improved weight and spacing. Later feedback still required careful hero top spacing and compact navigation, so this is not permission to enlarge everything blindly.

### Coded palette exploration

The first dark palette was rejected. A comparison board led to Option C, then a temporary coded page proved the atmosphere in actual surfaces. The user approved the lane after dots were replaced with subtle photographic grain. This sequence worked because it separated a high-risk visual decision from the full rewrite.

### The hero's right-side composition

The strong composition used a dominant poster, a smaller natural reaction photo, and an anchored response card with real depth. The user explicitly said the right side was perfect and later asked to retain the posters, reactions, text transitions, shadow, and comment-box UI.

### Diversity through time

The user wanted more than one film, but not a collage. Synchronized transitions between films, people, reactions, and responses matched the intent. The active film gets a complete beat before the next one arrives.

### Product-first landing structure

The direction improved when the page stopped acting like a magazine or slide deck and showed capture, discovery, people, and history as functioning product surfaces on one continuous field.

### Restored visual system and direct copy

The strongest explicit approval followed commit `f15db1f`, built on the restored palette at `0957de6`. That pass blended the header more closely, reduced hero state timing, strengthened the ambient field, removed the progress rail, corrected overlapping display type, used "No two people feel the same.", compressed the final call to action, and thinned the footer.

The header still needed another correction. Commit `bc7d64c` earned approval after separating the tint and progressive blur into distinct layers and extending the blend into the hero. Use these commits as historical evidence, not as code to restore automatically.

## Current signed-in direction

The latest direct product direction is:

- remove the sidebar;
- allow more tabs to preserve focus;
- define hierarchy before exposing features;
- make Feed a real feed, not Activity and not a dashboard;
- keep the interface direct;
- create interaction and connectivity rather than generic media cards;
- use Letterboxd and Beli as sources of insight, while maintaining a distinct identity.

Inspect the current dirty worktree before acting. This signed-in redesign was already in progress when the skill was created.

## A practical taste test

Before keeping a design, ask:

- If the posters were replaced with restaurant photos, would the layout still look equally plausible?
- Is the interface showing a lived response or merely saying "emotion"?
- Does a recommendation visibly come through a person?
- Is the screen focused because hierarchy is strong, or empty because content was removed?
- Is motion carrying one idea, or compensating for weak composition?
- Did an example become inspiration, or did it become a template?
- Did a local fix preserve the parts already working?
