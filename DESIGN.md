---
name: Moodie
description: Social film discovery through personal responses.
direction: "Living Afterimage"
colors:
  mineral: "#D8D6D1"
  mist: "#B9C4C0"
  ink: "#1D2B33"
  chalk: "#F4EFE9"
  oxide: "#D76358"
  fig: "#713B42"
  blue: "#557890"
  teal: "#477B78"
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
- A full loop lasts 20 seconds. Each film has room to register before the next crossfade.
- The trail demonstrates a response being saved, reaching another person, creating common ground, satisfying a feeling request across genre, and continuing through another response.
- Never label a card “public response.” Visibility is ordinary entry state, not a selling point.
- Show film and human diversity through time, never as a pile of simultaneous posters.

The hero must not contain flying quotes, stars, particles, wavy lines, decorative circles, or multiple competing effects.

## Ambient field

The page uses one continuous Mineral and Mist field from hero to final call to action. Dark Ink product frames carry the application demonstrations without turning the public canvas into a night theme.

- Large Oxide, Fig, Teal, and Blue light pools move slowly behind the page.
- Motion is pronounced enough to make the page feel alive, but slow enough to remain peripheral.
- Animate transform and opacity only. Do not animate blur or `backdrop-filter`.
- Keep deterministic grain static and visible across the header, landing page, and footer.
- Color is atmospheric. It must not become neon fog, gradient text, or a set of disconnected matte backgrounds.

The hero and product environment share the same uninterrupted color and grain field. Do not insert an ink divider or decorative handoff between them.

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

### Recommendations

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
- Uppercase labels are reserved for short functional categories such as Input and Feelings.

## Material and depth

Most product surfaces are dark, thin-bordered, and flat enough to scan. Depth is selective.

- The hero response card owns the strongest hard offset shadow.
- Posters may use a smaller hard offset shadow.
- Product frames use one restrained long shadow and a thin inside highlight.
- Avoid repeated floating cards, oversized radii, and generic glass tiles.
- Grain stays below content and never reduces text clarity.

## Navigation and footer

- The public header is a stable 62px layer with Moodie and Enter demo.
- It does not change color by section because the landing field is continuous.
- The mobile header uses the same dark state and a compact menu.
- The signed-in product has no header. A fixed 64px rail is the only persistent navigation.
- The rail stays collapsed by default and contains icons for Home, Search, People, Activity, Diary, and Add response.
- Hovering or focusing within the rail opens one temporary 210px menu that reveals every item name. It cannot be pinned open.
- Navigation icons sit at the vertical center of the rail, not at the top.
- The collapsed rail is transparent over the same Chalk canvas and grain. It should read as icons placed directly on the page. Active and hover states use color only, with no persistent pill, dot, or circle.
- Recommendations do not appear in the rail. They enter through responses, people, films, and the moment after saving a response.
- The footer stays compact and contains only the required TMDB attribution.

## Motion

Motion should express continuity and lived activity.

- Lenis supplies restrained smooth scrolling on the public landing page only.
- The hero uses one synchronized 20-second loop. Content changes in place through crossfades.
- The ambient field and projector light move on separate 22 to 28 second cycles.
- Do not stack entrance animations on the product demonstrations.
- Hover motion is limited to a small lift or color change.
- Grain remains static and continuous across the public shell.
- `prefers-reduced-motion` stops ambient motion and keeps the first complete hero state visible.

## Feeling language and color

The current seven keys remain a temporary implementation constraint:

- Stillness: Mineral and Ink
- Joy: Oxide
- Melancholy: Blue
- Friction: deep Oxide
- Tension: Fig
- Unease: Teal
- Wonder: Mist

Color never stands alone. Every feeling trace has a text label or accessible name. Do not encode emotion-to-genre rules.

## Signed-in product

The signed-in application remains calmer and denser than the landing page.

Its background carries the broadcast identity through warm mineral, oxide, slate-blue, and muted gold light bleed, continuous grain, faint scanlines, and a soft edge vignette. Existing dark product surfaces may carry quieter scanlines. Do not add a television frame, controls, channel labels, or fake broadcast copy.

- The response stream is the signed-in default and contains complete responses from people, newest first. It does not repeat the word Feed as a page title.
- The For you view combines one leading recommendation, more recommended films, responses from followed people, connected people, community films, and saved films. It must feel useful for more than one interaction.
- Feed items keep the person, film, note, feeling trace, and optional photo together. They do not use generic media-first social cards.
- A recommendation appears as a journey moment inside the stream or after a response is saved. It leads with a person, the shared film that created the connection, the feelings both people recorded there, and the public response behind the recommended film. Both written responses to the shared film can be compared without exposing a score.
- Following the moment opens a focused continuation. Recommendations are never framed as a utility destination in the primary navigation.
- Add response starts with film selection, then words and direct feeling controls.
- Diary keeps chronological responses editable and saved films in a separate view.
- Diary supports search, visibility filters, rewatches, chronological grouping, and a recent-viewing feeling summary.
- People cards keep the latest film and response beside the person, and name a shared film when one exists.
- Search covers films, desired feelings, and people without becoming a streaming grid. Desired-feeling results stay people-led and keep genre open. Activity links likes, comments, and follows back to their source.
- Member pages use separate Responses and Films views. They do not assign a compatibility score or a defining feeling to a person.
- Film pages lead with the film, carry the person and shared-film context when reached through a recommendation, then separate human responses from related catalog browsing.
- The hosted product is a prepared demo. It does not expose account creation, profile settings, or password controls.

The landing page may preview these surfaces, but it must not force the full product into the landing layout.

## Copy rules

Use film, response, feelings, note, person, feed, diary, follow, like, comment, and recommendation literally. Reserve reaction for the optional expression photo attached to a viewing.

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
- Use a colored or heavy left border as a mark on a box, quote, or callout. Use a full border, horizontal rule, background shift, or spacing instead.
