---
name: shape-emotional-film-product
description: Shape, critique, redesign, implement, or refine the product design, UX, interface copy, visual system, layout, motion, landing page, hero, feed, discovery, diary, response composer, navigation, or signed-in surfaces for the emotion-based social film project in this repository. Use only when the current repository contains this skill under .agents/skills and the task concerns this project. Never treat these preferences as global Codex guidance or generalize them to another project.
---

# Shape the emotional film product

Use this skill as a project-local taste and decision system. Do not reduce it to a fixed palette or a list of forbidden components. The product name is provisional and the interface is still evolving.

## Enforce the scope gate

1. Resolve the repository root with `git rev-parse --show-toplevel`.
2. Confirm this `SKILL.md` is inside that root under `.agents/skills`.
3. Apply the skill only to files and design decisions in this repository.
4. Never copy, symlink, install, or summarize this skill into `$HOME/.agents`, `$HOME/.codex`, another repository, or a global memory.
5. If the repository is absent, stop using the skill. Its intended lifetime is the checkout's lifetime.

## Read current truth first

Before making a material design decision:

1. Read `PRODUCT.md` and `DESIGN.md` completely.
2. Inspect the current implementation of the surface being changed.
3. Inspect the current diff before editing. Preserve unrelated and user-owned work.
4. Read [references/taste-model.md](references/taste-model.md) for the project's durable design judgments.
5. Read [references/session-evidence.md](references/session-evidence.md) only when auditing the skill, resolving a conflict, or tracing why a rule exists.

Treat the latest explicit user instruction and screenshots as stronger than this skill. Treat current product documents and working code as stronger than historical implementation details. The brand name, palette, timing, routes, and information architecture may change.

## Work from this product thesis

Keep the current product model visible in the interface:

- Build emotion-based social film discovery, not a streaming catalog or rating site.
- Treat a response as first-person meaning and feeling, not a review score.
- Let people and their lived responses create the path to another film.
- Make direct writing and feeling controls complete on their own.
- Keep expression photos and analysis optional and secondary. Media is not emotional evidence.
- Show recommendation provenance through a person and a shared film without compatibility theater.
- Keep technology quiet. Film art, human words, product state, and interaction carry the experience.

Keep the public landing page and signed-in product distinct:

- Let the landing page welcome, demonstrate, and establish identity.
- Let the application support focused, fast work without marketing language.
- Use a real chronological Feed as the signed-in default, not Activity and not a dashboard summary.
- Prefer focused destinations and local tabs over showing every feature at once.
- Keep public smooth scrolling and cinematic pacing out of the signed-in application.

## Use the taste gradients

Aim between the failure extremes:

- Choose edited richness over both clutter and empty minimalism.
- Choose cinematic warmth and material atmosphere over both generic darkness and cheerful SaaS color.
- Choose one legible expressive idea over both static blandness and stacked motion effects.
- Choose direct, human language over both abstract marketing and cold technical exposition.
- Choose product behavior over labels that announce the requirement was implemented.
- Choose a distinct social-film identity over both a Netflix clone and an Instagram clone.
- Choose research-informed originality over both isolated invention and reference copying.
- Choose selective depth and texture over both flat sameness and floating-card sprawl.

Reject a direction if it could become a generic media, streaming, restaurant-review, or social template by swapping the posters.

## Design in the right order

For a broad redesign:

1. Define or refresh the product hierarchy before styling pages.
2. Establish the design system before polishing individual routes.
3. When the visual lane is uncertain, show a small coded atmosphere or palette study before rewriting the application.
4. Carry an approved system through real product states, not just the landing hero.
5. Keep the system alive. Do not let an old design document override newer direct feedback.

For a focused correction:

1. Identify exactly what the user disliked and exactly what they said to retain.
2. Freeze the approved composition and affordances outside that seam.
3. Make the smallest structural change that solves the actual visual problem.
4. Do not turn a local correction into a redesign unless the user asked for one.

Never overcorrect. Removing slop does not mean removing the creative hand. Fixing one transition does not authorize replacing a liked card, poster composition, shadow, underline, or interaction.

## Build the visual identity

Use these principles unless current `DESIGN.md` or direct feedback replaces them:

- Let film artwork behave as composition, not catalog inventory.
- Use human responses as primary visual material, not filler copy beneath posters.
- Make color atmospheric and noticeable without neon fog, gradient text, or unrelated section backgrounds.
- Prefer a light, inviting, textured field over a default dark "premium" treatment.
- Avoid coffee-brand brown and a teal-led SaaS identity. A teal accent is acceptable only when the current system uses it deliberately.
- Use subtle photographic grain, never visible dots. Keep it static, continuous, and single-layered across connected surfaces.
- Use texture to add material density, not to lower text clarity.
- Keep the public header compact and visually continuous with the hero. It should not look like a separate slab.
- Keep footers thin and functional.
- Remove boxes that hold mostly empty space. Every framed area must earn its footprint through state, content, or action.
- Scale for comfortable density. The project historically read better when the undersized system was enlarged by roughly ten percent, but inspect the current scale before repeating that fix.

## Handle motion as product storytelling

- Start with one idea that explains continuity, resonance, or a response moving between people.
- Keep motion slow, quiet, personal, expressive, and immersive, but do not make interactions sluggish.
- Synchronize poster, backdrop, reaction photo, response text, and feeling state when they tell one beat.
- Show film and human diversity through time, one state at a time, not as a simultaneous pile.
- Keep an approved card physically anchored and change its content in place.
- Make ambient light and color movement visible enough to register, then keep it peripheral.
- Use balanced crossfades. Avoid ghosted overlapping states.
- Do not add progress rails, step counters, arrows, stars, flying quotes, particles, waves, decorative circles, or unrelated effects to explain the sequence.
- Do not turn a hero into a guide, flowchart, or explainer panel.
- Preserve `prefers-reduced-motion` behavior, but do not let production hardening dominate an early art-direction pass.

Read current timing from `DESIGN.md` and code. Do not preserve historical numbers merely because they once earned approval.

## Write interface copy directly

- Use ordinary product nouns: film, response, feelings, note, person, feed, diary, follow, reaction, recommendation.
- State what the product does. Let the interface demonstrate the philosophy.
- Use Feed, not Activity, for the primary social stream.
- Avoid invented labels such as "Live response trail" or decorative labels such as "Social film discovery" when they do not name an actual control or state.
- Do not foreground "public response" to prove visibility exists.
- Never use "check your mood."
- Do not use random bold words as a substitute for hierarchy or expression.
- Avoid technical recommendation heuristics, pseudo-scientific percentages, privacy theater, and feature-proof copy.
- Default to no em dashes in user-visible copy.

The phrase "No two people feel the same." earned direct approval because it states the idea without performing importance. Use that as a copy-quality benchmark, not as permanent required copy.

## Use inspiration correctly

When research would help:

1. Search broad visual fields and focused needs. Use both generic and specific queries.
2. Study film, editorial, cultural, motion, interaction, and social-product work.
3. Treat Letterboxd as useful film-community inspiration and Beli as useful interaction/connectivity inspiration, not as templates.
4. Extract the compositional or interaction principle that fits this product.
5. Explain internally why it fits before implementing it.
6. Discard fashionable patterns that weaken this product's identity.

Do not search only for the implementation mechanic. Do not literalize examples from the user's feedback. Do not follow something online merely because it exists.

## Preserve interaction and hierarchy

- Make connectivity, discovery through friends, following, and movement between people, films, and responses feel usable, not merely described.
- Keep the response, person, film, feelings, and action connected in the same reading path.
- Use tabs when they create focus. More tabs are acceptable when the alternative is a crowded sidebar or an everything-at-once screen.
- Keep intentional affordances such as an active underline unless feedback explicitly removes them.
- Avoid generic media-first cards. A photo may add life but must not displace the response.
- Keep the application denser and calmer than the landing page.

## Collaborate and verify

- Treat the user's screenshots and comments as the visual authority.
- If the user says not to change anything yet, discuss first and do not edit.
- When the user names liked elements, repeat them back as preservation constraints before editing.
- Prefer implementation over prolonged planning, testing, or browser inspection.
- Do not run a broad visual walkthrough unless asked.
- Use at most one bounded browser spot-check when code cannot establish clipping, overlap, or transition behavior and the user has not reserved all visual review.
- Finish with one credible build or lint gate proportional to the change.
- Leave the next visual judgment to the user and keep the handoff short.

Before handing off, ask:

1. Does this look and behave like this product, or like a template with film posters?
2. Can a person understand the product from behavior and state rather than labels?
3. Did the change preserve everything the user said was working?
4. Is the page rich enough to feel authored without becoming crowded?
5. Did one strong idea carry the motion and composition?
6. Did implementation time materially exceed inspection time?
