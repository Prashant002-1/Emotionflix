---
name: Moodie
description: Social film discovery through personal responses.
direction: "Living Afterimage"
colors:
  night: "#090C11"
  panel: "#11161D"
  paper: "#F1EDE5"
  coral: "#E17868"
  teal: "#67A8A1"
  blue: "#7592B2"
typography:
  display: "Newsreader, serif"
  interface: "Oxygen, sans-serif"
layout:
  landingWidth: "1440px"
  productFrameWidth: "1360px"
  navHeight: "62px"
rounded:
  control: "9px"
  productFrame: "18px"
  poster: "3px"
---

# Design system: Moodie

## Creative direction

**Living Afterimage**

Moodie should feel like the minutes after a film ends, when the room is ordinary again but the film is still moving through the people in it. The page is quiet, intimate, and cinematic. Its character comes from human writing, real film art, candid reaction photos, and a slowly changing field of light.

The landing page is a product demonstration, not an editorial campaign. It should show the interface and the data that moves through it with the same clarity a strong developer-tool landing page gives its product. Visitors should be able to see the inputs, the recommendation source, and the output without reading an abstract manifesto.

The visual identity has two connected modes:

- The hero is an expressive welcome built from posters, reaction photos, and one anchored paper response card.
- Everything below the hero is a continuous product environment that exposes capture, discovery, the people feed, and history through real interface states.

Do not split the page into alternating presentation slides. Do not treat each section as a poster or a separate campaign idea.

## Hero

The hero is the product story in motion.

- Keep the left side quiet: one product descriptor, one headline, one conclusion, and two actions.
- Do not underline or draw after the headline.
- The right side cycles through five different films one at a time.
- Poster, backdrop, reaction photo, response text, feeling trace, and context change together.
- The paper response card stays physically anchored while its contents change.
- Use the original paper-card behavior: warm paper, internal metadata divider, compact type, small feeling trace, modest radius, slight rotation, and a hard offset shadow.
- A full loop lasts 30 seconds. Each film has room to register before the next crossfade.
- The trail demonstrates a response being saved, reaching another person, creating common ground, satisfying a feeling request across genre, and continuing through another response.
- Never label a card “public response.” Visibility is ordinary entry state, not a selling point.
- Show film and human diversity through time, never as a pile of simultaneous posters.

The hero must not contain flying quotes, stars, particles, wavy lines, decorative circles, or multiple competing effects.

## Ambient field

The page uses one continuous Night field from hero to final call to action.

- Large coral, teal, blue, and warm projector light pools move slowly behind the page.
- Motion is pronounced enough to make the page feel alive, but slow enough to remain peripheral.
- Animate transform and opacity only. Do not animate blur or `backdrop-filter`.
- Keep deterministic grain static and faint.
- Color is atmospheric. It must not become neon fog, gradient text, or a set of disconnected matte backgrounds.

One soft SVG ink bleed carries the hero into the product environment. It is an organic handoff, not a recurring divider. Keep its edges feathered and its colors close to the fields it joins.

## Product overview

The landing page shows four product surfaces in order.

### Capture

Show a real response composer with:

- selected film;
- freeform response;
- manually adjusted feeling mix;
- optional photo;
- visibility state;
- saved record summary.

State the contract beside the demonstration: freeform input, seven temporary feeling signals, optional media, and visibility per response. Rewatches remain separate records.

### Discovery

Show the recommendation chain in one product frame:

- the visitor asks for a feeling, with genre left open;
- Whiplash is the shared film;
- the visitor and Ananya describe it in a similar way;
- Ananya remains visible as the source;
- Scream satisfies a happy request because her actual viewing was joyful.

The recommendation reason should read like product state, not a narrated tutorial. Do not show match percentages, universal emotion rules, or genre translation.

### People feed

Show a dense response feed with film, person, note, feeling trace, and poster kept together. The selected connection inspector explains why a person entered the feed and allows that person to be followed directly.

### History

Show film history as an application table, not a notebook or diary prop. A row contains the viewing, the person’s own words, the feeling trace, and the date. A secondary panel may summarize recent response patterns, but it must describe a window of time rather than assign a permanent identity.

## Typography

Newsreader is the expressive display face. Oxygen is the product and reading face.

- Use Newsreader for the hero headline, section headings, film titles in prominent cards, and rare human moments.
- Use Oxygen for controls, specifications, response copy, metadata, and product frames.
- Landing section headings should normally stop near 4.35rem. They share the viewport with the product, rather than becoming the entire viewport.
- Interface copy stays compact but readable. Metadata may be small only when contrast and hierarchy remain clear.
- Uppercase labels are reserved for functional categories such as Input, Signal, Capture, and Discovery.

## Material and depth

Most product surfaces are dark, thin-bordered, and flat enough to scan. Depth is selective.

- The hero response card owns the strongest hard offset shadow.
- Posters may use a smaller hard offset shadow.
- Product frames use one restrained long shadow and a thin inside highlight.
- Avoid repeated floating cards, oversized radii, and generic glass tiles.
- Grain stays below content and never reduces text clarity.

## Navigation and footer

- The public header is a stable 62px dark layer with Moodie, Product, How it works, Sign in, and Enter demo.
- It does not change color by section because the landing field is continuous.
- The mobile header uses the same dark state and a compact menu.
- The signed-in product keeps its own navigation rail and is not restyled by the landing page.
- The footer stays compact and contains only the required TMDB attribution.

## Motion

Motion should express continuity and lived activity.

- Lenis supplies restrained smooth scrolling on the public landing page only.
- The hero uses one synchronized 30-second loop. Content changes in place through crossfades.
- The ambient field and projector light move on separate 22 to 28 second cycles.
- Do not stack entrance animations on the product demonstrations.
- Hover motion is limited to a small lift or color change.
- Ink diffusion and grain remain static.
- `prefers-reduced-motion` stops ambient motion and keeps the first complete hero state visible.

## Feeling language and color

The current seven keys remain a temporary implementation constraint:

- Stillness: neutral and Ink
- Joy: Coral
- Melancholy: Blue
- Friction: deep Coral
- Tension: Fig
- Unease: Teal
- Wonder: light Teal

Color never stands alone. Every feeling trace has a text label or accessible name. Do not encode emotion-to-genre rules.

## Signed-in product

The signed-in application remains calmer and denser than the landing page.

- Home combines personal state with recent community activity.
- Discover leads with people who felt something similar about a shared film.
- Add response starts with film selection, then words and direct feeling controls.
- History keeps chronological responses editable and searchable.
- Member pages show a person’s responses and films, not a compatibility score.
- Film pages lead with the film, then show how people felt.

The landing page may preview these surfaces, but it must not force the full product into the landing layout.

## Copy rules

Use film, response, feelings, note, person, activity, history, follow, reaction, and recommendation literally.

Describe what the product does before explaining its philosophy. Use plain specifications where they help a visitor evaluate the product. Keep people and source films visible in recommendation reasons.

Avoid invented feature names, marketing buzzwords, privacy theater, technical architecture copy, and claims that Moodie understands or diagnoses a person.

## Do not

- Reintroduce EmotionFlix or any name ending in “flix.”
- Build a streaming catalog as the landing page.
- Use alternating full-screen matte sections.
- Turn the page into a magazine cover or consulting presentation.
- Use a notebook, diary paper, film strip, clapperboard, or decorative camera prop.
- Add ratings, stars, genre profiles, compatibility percentages, or popularity-first recommendations.
- Add animated headline lines, flying quotes, particles, decorative circles, or wave dividers.
- Center visibility language inside response cards.
- Hide first-person notes, feelings, people, or recommendation sources behind hover.
