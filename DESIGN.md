---
name: EmotionFlix
description: Emotion-based social film discovery built from personal film records.
direction: "Matinee Archive"
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
  family: "Oxygen, sans-serif"
  root: "17px"
  weights: [300, 400, 700]
layout:
  contentWidth: "1380px"
  readingWidth: "68ch"
  controlHeight: "50px"
  navHeight: "82px"
rounded:
  control: "8px"
  surface: "14px"
---

# Design system: EmotionFlix

## Creative direction

**Matinee Archive**

EmotionFlix should feel like leaving a repertory screening in the afternoon and opening a well-kept personal record while the film is still present. The product is warm, open, tactile, and culturally literate. Light carries the room. Saturated color carries meaning. Film artwork and human writing provide the life of the interface.

The public landing page is allowed to be expressive. It uses large color fields, real film imagery, overlapping record objects, and a deliberate narrative rhythm. Authenticated pages become quieter and more task-focused while retaining the same material, color, type, and record grammar.

The interface is not a streaming catalog, a generic dark dashboard, an AI analysis product, a facial-expression product, a film magazine imitation, or an imitation of Letterboxd. Its visual grammar comes from the product model:

1. A film becomes a personal record.
2. Repeated records reveal an emotional pattern.
3. Related patterns connect people.
4. Another person's film record becomes a recommendation with a visible reason.

## Physical scene

A person has just watched a film and is recording what remains while daylight still reaches the room. The interface should feel composed enough for serious film culture, warm enough for personal writing, and clear enough to use repeatedly without ceremony.

## Logo slot

The logo is unresolved and must remain replaceable.

- Navigation and footer use a stable `.brand-lockup` container with a dedicated `.brand-slot` followed by the EmotionFlix wordmark.
- The current `BrandMark` is a placeholder only. Do not derive patterns, icons, motion, or layout motifs from it.
- Reserve at least 36 by 36 pixels for the mark and enough horizontal room for a future lockup without moving the primary navigation.
- The placeholder may inherit the current text color and Oxide accent. It must not be presented as a finalized logo in product copy or documentation.
- Replacing the logo should require editing the mark component, not restructuring navigation or page layouts.

## Typography

Oxygen remains the only family. The approved preview did not introduce a new font. It changed how Oxygen is used.

- Weight 300 carries expressive landing-page display text and large cultural statements.
- Weight 700 creates selective emphasis inside a light display line and handles product headings, actions, and labels.
- Weight 400 carries body copy, notes, metadata, and controls.
- Landing display text uses `clamp()` up to 6rem, line height near 0.96, and letter spacing no tighter than -0.04em.
- Product page titles use a fixed responsive scale with a practical ceiling near 4.5rem.
- Body copy remains between 65 and 72 characters per line with line height between 1.58 and 1.72.
- Metadata is compact but never faint. Use Ink-derived color rather than neutral gray.
- Short system labels may use modest tracking. Do not repeat tiny uppercase eyebrows as section scaffolding.

The desktop root stays at 17px. Mobile returns to 16px. Controls remain at least 50px high and touch targets at least 44px.

## Core palette

### Light fields

- **Mineral `#D8D6D1`:** primary public canvas and secondary product field.
- **Mist `#B9C4C0`:** connective surface, selected state, secondary panel, and social context.
- **Chalk `#F4EFE9`:** primary reading surface, forms, diary notes, and high-clarity content fields.

### Depth fields

- **Ink `#1D2B33`:** primary text, film-depth surface, footer, and high-contrast product state.
- **Teal `#477B78`:** atmosphere, film-led fields, community context, and meaningful section transitions.
- **Blue `#557890`:** secondary trace, informational state, and cool counterweight to the warm palette.

### Human accents

- **Oxide `#D76358`:** primary action, selected control, important transition, and focal editorial field.
- **Fig `#713B42`:** resonance, intimate human emphasis, reaction state, and occasional display emphasis.

### Contrast rules

- Default body text is Ink on Mineral, Mist, or Chalk.
- Oxide controls use a darker action ink `#132027`; ordinary Ink on Oxide is acceptable only for large or bold text.
- Chalk body text is not used directly on Teal. Use `#FAF8F4` for small text on Teal or reserve Chalk for large text.
- Chalk on Fig and Chalk on Ink are approved high-contrast pairs.
- Muted copy uses an Ink-derived tone such as `#435258`, never low-contrast gray.
- Oxide and Fig are not decorative confetti. Oxide indicates action or a major narrative field. Fig indicates human resonance or selective emphasis.

## Grain and material

Texture is part of Matinee Archive, but it must behave like photographic grain rather than a visible pattern.

- Use a deterministic randomized monochrome raster tile, not CSS dots, `feTurbulence`, stripes, paper speckles, or fake distress.
- The reference tile is 192 by 192 pixels and repeats at roughly 126 to 152 CSS pixels so the grain remains fine on high-density screens.
- Blend with `soft-light`; the pixel distribution should center on middle gray so the texture adds density without tinting the field.
- Global light fields use roughly 8 to 10 percent overlay opacity.
- Saturated fields and generated artwork may use 14 to 20 percent depending on local contrast.
- Grain is static. Do not animate it, scroll it independently, or use it as a loading effect.
- Do not put grain between text and its background in a way that lowers readability. Texture sits at the page or artwork material layer, below content.
- Real film images keep their own photographic texture. Add only a very light shared grain when it helps them belong to the page.
- Paper fibers, torn edges, dust, registration errors, and faux aging are not default brand treatments.

## Layout grammar

### Public overview

The logged-out home page is a product overview, not a browse surface. It tells one continuous transformation: record, pattern, person, recommendation.

- The opening composition pairs a light reading field with a committed Teal film-and-record field.
- One real film image and one complete human record prove the product in the first viewport.
- The transformation sequence uses an Oxide field and ruled relationships rather than a grid of feature cards.
- The social recommendation example uses Ink depth, real poster art, and a literal explanation tied to another person's diary.
- The final invitation returns to a light field with one `Enter demo` action and a quieter sign-in option.
- Public navigation contains overview anchors, Sign in, and Enter demo. Product destinations are not shown before authentication.

### Authenticated product

The product shell uses a light-first canvas with a stable top navigation. Pages alternate Chalk reading fields, Mineral background, Mist connective state, and selective Ink or Teal film-led scenes.

The recurring structures are:

1. **Film-led scene:** a real backdrop or poster establishes the film, with readable content placed beside or over a controlled color field.
2. **Record row:** poster, date, visibility, title, rating, emotional trace, note, and actions form one scan path.
3. **Film rail:** artwork scrolls horizontally with titles and metadata below. Recommendation reasons stay visible.
4. **Pattern panel:** a bounded summary only where several records have genuinely produced aggregate state.
5. **Person row:** identity, public-record count, recurring trace, overlap, and follow state remain readable without opening a profile.

Cards are used only when a bounded object needs one: a diary record, a composer, a recommendation explanation, or an authentication dialog. Do not turn every section into an identical rounded card.

## Navigation and authentication

- Logged-out navigation: logo slot, product-overview anchors, Sign in, Enter demo.
- Logged-in navigation: logo slot, For you, Diary, Community, Log a film, and account control.
- `Enter demo` signs in directly with the seeded demo account. Do not display the demo email or password in the interface.
- Authentication uses one calm Chalk dialog with clear login and registration modes.
- Protected product routes redirect signed-out visitors to the public overview.
- The mobile navigation is an explicit full-width sheet with 48px targets and the same information priority.

## Core surfaces

### Diary

Show the aggregate pattern first, then complete chronological records. Notes, visibility, emotional trace, date, and rating remain visible. Editing occurs in place with the film identity fixed.

### Recommendations

Lead with the reason this shelf exists. Show history size, dominant traces, and recurring genres as a readable sentence. A temporary emotional direction is optional and secondary. Each recommendation reason stays attached to its film.

### Community

People and records share one surface. The people column establishes whose patterns are relevant. The public diary remains the primary reading area. Reactions mark resonance with a record rather than generic approval.

### Public member diary

Use one film backdrop to establish the person's public record, then show their recurring trace, connections, films, and full public notes. It should feel like a diary with a social edge, not a generic profile.

### Film detail

The film is the visual anchor. Product actions remain beside the synopsis. Public records for that film explain how different people experienced it. Similar films remain secondary.

### Entry composer

Film selection comes first. Date, rating, note, visibility, and reviewed emotional record remain together. Direct sliders are the default emotional-record path. Writing-assisted suggestions may follow. Camera and photo estimates live under secondary optional input.

### Account

Account state, public bio, password, and diary counts are task-focused. This page uses the quietest expression of the system.

## Emotional record language

The current seven expression-derived keys remain a temporary implementation constraint, not the permanent product vocabulary. Their colors are semantic data only:

- Stillness: muted Mineral/Ink
- Joy: Oxide
- Melancholy: Blue
- Friction: deep red derived from Oxide
- Tension: Fig
- Unease: Teal
- Wonder: light Teal/Mist

Do not encode universal emotion-to-genre rules. Do not use facial imagery, scanning graphics, camera frames, confidence scores, or the temporary emotion labels as brand motifs.

## Components

- **Primary button:** Oxide with dark action ink, 8px radius, 50px minimum height.
- **Secondary button:** Ink or Mist depending on field, with no decorative wide shadow.
- **Quiet button:** transparent at rest with a local surface hover.
- **Surface:** 14px maximum radius for grouped state. Posters use 2 to 6px radii.
- **Input:** Chalk or Mineral fill, visible Ink-derived border, 50px minimum height, readable placeholder.
- **Focus:** 3px Fig outline with 3px offset on light fields; Chalk outline on Ink/Teal fields.
- **Poster:** 2:3 crop. Flat at rest. Motion is limited to a small lift or image scale on hover and keyboard focus.
- **Loading:** content-shaped skeletons for product lists; a compact spinner is acceptable only for short isolated transitions.
- **Empty state:** explains the next useful action and its consequence.
- **Errors:** specific message plus a retry or recovery action when one exists.

## Motion

- Public landing load may use one short staggered composition reveal.
- Product pages load directly into the task. Motion communicates hover, selection, expansion, save, and disclosure state.
- Standard transitions run 160 to 220ms with an exponential ease-out.
- No scroll-jacking, particle fields, looping ornament, animated grain, autoplay carousels, or decorative product-page choreography.
- Respect `prefers-reduced-motion` globally.

## Copy rules

Use film, diary, entry, feeling, emotional record, emotional mix, suggestion, source, public, private, saved, follow, reaction, pattern, and recommendation literally.

Avoid invented feature names, generic trust slogans, security theater, technical architecture copy, marketing buzzwords, em dashes, and repeated rebuttal-shaped taglines. Never claim that EmotionFlix understands, reads, detects, or diagnoses how a person feels.

Use `expression estimate` for the optional facial adapter. Use `suggest feelings from this note` for text analysis, followed by an editable review state.

## Do

- Let real film art carry local color and specificity.
- Keep the full record-to-pattern-to-person-to-film relationship visible on the public overview.
- Make direct input and writing the obvious emotional-record paths.
- Keep every derived suggestion editable and attributable to its source.
- Use large committed fields on the public page and restrained color in product tasks.
- Preserve readable notes, reasons, visibility, and emotional traces.
- Keep the logo slot structurally stable and visually provisional.

## Do not

- Reintroduce a midnight-first or generic black streaming shell.
- Use purple fog, neon blobs, glassmorphism, gradient text, repeated feature-card grids, hero metrics, repeated eyebrows, or oversized radii.
- Use visible dot patterns, fake paper speckles, faux aging, film-strip clichés, clapperboards, or decorative camera imagery.
- Put camera capture, facial imagery, confidence, or privacy proof in the first screen.
- Give camera and photo analysis equal prominence with direct input and writing.
- Show logged-out visitors product navigation, catalog rails, or empty community state.
- Display demo credentials.
- Hide notes, recommendation reasons, visibility, or emotional traces behind hover.
