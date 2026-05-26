---
name: Operations Command Center
description: Design system for the operator console. Lime-green primary CTA on sage canvas, near-black ink, generous 24 px pill geometry, heavy-display plus utility typography pair.
register: product (operations dashboard)
colors:
  primary: "#9fe870"
  primary-hover: "#cdffad"
  primary-neutral: "#c5edab"
  primary-pale: "#e2f6d5"
  canvas: "#ffffff"
  canvas-soft: "#e8ebe6"
  ink: "#0e0f0c"
  ink-deep: "#163300"
  body: "#454745"
  mute: "#868685"
  positive: "#2ead4b"
  positive-deep: "#054d28"
  warning: "#ffd11a"
  warning-deep: "#b86700"
  warning-content: "#4a3b1c"
  negative: "#d03238"
  negative-deep: "#a72027"
  negative-darkest: "#a7000d"
  negative-bg: "#320707"
  accent-orange: "#ffc091"
  accent-cyan: "#38c8ff"
typography:
  display-xl:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 900
    lineHeight: "54.4px"
    letterSpacing: "0"
  display-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "40px"
    fontWeight: 900
    lineHeight: "44px"
    letterSpacing: "0"
  display-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "38.4px"
    letterSpacing: "-0.96px"
  display-xs:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: "31.2px"
    letterSpacing: "-0.48px"
  body-lg:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 400
    lineHeight: "30px"
    letterSpacing: "0"
  body-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
    letterSpacing: "0"
  body-md-strong:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "0"
  body-sm:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
    letterSpacing: "0"
  body-sm-strong:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
    letterSpacing: "0"
  caption:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0"
  button-md:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "24px"
    letterSpacing: "0"
rounded:
  none: "0px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  pill: "9999px"
  full: "9999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  "2xl": "32px"
  "3xl": "48px"
  gutter-mobile: "16px"
  gutter-desktop: "24px"
  page-max: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-secondary:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  button-tertiary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.ink}"
    rounded: "{rounded.xl}"
    padding: "12px 24px"
  card-content:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-feature-sage:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  text-input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    border: "1px solid {colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  status-chip-received:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.mute}"
    border: "1px solid rgba(14, 15, 12, 0.10)"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  status-chip-processing:
    backgroundColor: "{colors.canvas-soft}"
    textColor: "{colors.ink}"
    border: "1px solid rgba(14, 15, 12, 0.15)"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  status-chip-completed:
    backgroundColor: "rgba(46, 173, 75, 0.12)"
    textColor: "{colors.positive-deep}"
    border: "1px solid rgba(46, 173, 75, 0.40)"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  status-chip-review-required:
    backgroundColor: "rgba(255, 209, 26, 0.20)"
    textColor: "{colors.warning-content}"
    border: "1px solid rgba(255, 209, 26, 0.60)"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  status-chip-failed:
    backgroundColor: "rgba(208, 50, 56, 0.12)"
    textColor: "{colors.negative-darkest}"
    border: "1px solid rgba(208, 50, 56, 0.40)"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Operations Command Center

> A design system for the operator console: a lime-green primary CTA on a sage canvas, near-black ink, generous 24 px pill geometry, and a heavy-display + utility typography pair. Tokens above are normative. Prose below explains how to apply them across the dashboard's five pages.

## 1. Overview

**Creative North Star: "The Confident Operator"**

The operator console wears a single decisive identity: a vivid lime-green `{colors.primary}` (`#9fe870`) used as the one primary CTA per screen, set against a pale sage-tinted canvas `{colors.canvas-soft}` (`#e8ebe6`) that frames white `{colors.canvas}` cards as the working surface, with a near-black ink `{colors.ink}` (`#0e0f0c`) carrying every typographic moment. The system reads like a calm operations console rather than a marketing site: generous whitespace, large 24 px rounded cards, an unusually heavy display weight (900) for the few headline moments, and an Inter weight-600 utility voice for everything else.

The product personality is **calm authority**: a command surface that an operator can scan in one second and act on in two, with one lime-green beat per screen marking the next thing to do. Status colors live in a separate role layer (positive / warning / negative, plus two neutrals for `received` and `processing`) and never overlap with the brand pair. Surface contrast (sage canvas hosting white cards) is the primary elevation cue. Shadow is reserved for state response (hover, focus). Resting surfaces are flat.

**Key Characteristics:**
- A single lime-green CTA accent `{colors.primary}` (`#9fe870`). No second brand accent.
- Two-face typography: heavy-display (Inter weight 900, or Manrope 800 / 900 as open-source substitute) for the few headline moments + Inter weight 600 for sub-displays and emphasis + Inter weight 400 for body. The weight contrast is the typographic story.
- `{rounded.xl}` 24 px is the canonical card + button radius. Generous, friendly.
- Sage `{colors.canvas-soft}` is the page background; white `{colors.canvas}` is reserved for cards within the sage band.
- A full semantic palette (positive green, warning yellow, negative red), each with content / hover / active variants for in-product status.
- A five-status palette mapping for the operator console: `received` / `processing` / `completed` / `review_required` / `failed`. Documented in 5 Status Chips.

## 2. Colors

A single-accent brand system on a sage-canvas field. Lime-green is the action voice; ink is the identity voice.

### Brand & Accent

- **Primary** (`#9fe870`): the universal CTA color. Every primary button, every "Submit", "Approve", "Mark Resolved" pill. The lime pill IS the brand's conversion signature.
- **Primary Hover** (`#cdffad`): the lighter green for active state.
- **Primary Neutral** (`#c5edab`): a mid-saturation green used as a neutral active fill.
- **Primary Pale** (`#e2f6d5`): the lightest green for soft surface tints. Use sparingly. The brand sits the green CTA on neutral surfaces (sage / white / ink), never on green.

### Surface

- **Canvas** (`#ffffff`): pure white for card interiors.
- **Canvas Soft** (`#e8ebe6`): the sage-tinted page background. Defining mood.

### Text

- **Ink** (`#0e0f0c`): near-black with a hint of olive warmth. Default text and headings color.
- **Ink Deep** (`#163300`): a deep forest-green ink used on positive-state surfaces.
- **Body** (`#454745`): secondary body text.
- **Mute** (`#868685`): lowest-priority text: captions, placeholder, fine print, the `received` status chip's text.

### Semantic

- **Positive** (`#2ead4b`) / **Positive Deep** (`#054d28`): success indicator + pressed state. Used by the `completed` status chip and by any in-product positive callout.
- **Warning** (`#ffd11a`) / **Warning Deep** (`#b86700`) / **Warning Content** (`#4a3b1c`): caution indicator, pressed state, text on warning surfaces. Used by the `review_required` status chip and the review banner.
- **Negative** (`#d03238`) / **Negative Deep** (`#a72027`) / **Negative Darkest** (`#a7000d`) / **Negative Bg** (`#320707`): destructive / error red, pressed state, highest-emphasis destructive text, dark callout background. Used by the `failed` status chip.

### Tertiary Brand Accents (sparing)

- **Accent Orange** (`#ffc091`): bright peach for empty-state illustration content. Never used as an action color (lime owns that).
- **Accent Cyan** (`#38c8ff`): bright sky-blue as a tertiary illustration accent.

### Named Rules

**The One Primary Rule.** Lime-green is the *only* color used for primary action. There is exactly one lime element per screen at any time. If two actions would both deserve lime, the lesser becomes ghost or sage-secondary. Never use lime for status, hover state, charts, or icons. Its scarcity is the affordance.

**The Two-Voice Rule.** Color hierarchy is ink (identity, history, "what is this") and lime (action, "what next"). Status colors live in a *separate* role layer documented in 5 Status Chips and never mix with the brand pair on the same element.

**The No Pure Black Rule.** Body copy uses `{colors.ink}` (`#0e0f0c`, near-black with olive warmth), not `#000`. Borders use ink at 10–15% alpha for hairlines. The system warms its blacks so the sage canvas reads as calm rather than industrial.

## 3. Typography

**Display Font:** Inter weight 900 (or Manrope 800 / 900 as open-source substitute). Used for the heavy-display register only.
**Body Font:** Inter weight 400 / 600. Loaded with `font-feature-settings: "calt"` for contextual alternates.
**Label Font:** same.

**Character:** Two-face typography. Heavy-display (weight 900) carries the few headline moments; Inter (weight 600 for emphasis, 400 for body) carries everything else. The contrast between weight 900 and weight 600 is the typographic story.

### Hierarchy

- **display-xl** (Inter 900, 64 px, line-height 54.4 px): empty-state heroes only ("No events yet. Drop one in the simulator."). Not used on data screens.
- **display-md** (Inter 900, 40 px, line-height 44 px): page titles ("Dashboard", "Event Inbox", "Review Queue", "Simulator"). The page anchor.
- **display-sm** (Inter 600, 32 px, line-height 38.4 px, tracking -0.96 px): dashboard KPI numbers (total events, completed count, failed count). The metric anchor.
- **display-xs** (Inter 600, 24 px, line-height 31.2 px, tracking -0.48 px): event detail section labels ("Original Payload", "Generated Actions", "Audit Timeline").
- **body-lg** (Inter 400, 20 px, line-height 30 px): paragraph copy on text-heavy screens.
- **body-md** (Inter 400, 16 px, line-height 24 px): default body. Max line length 65 to 75 ch on text-heavy screens.
- **body-md-strong** (Inter 600, 16 px, line-height 24 px): table row primary content (event title, source_event_id), navigation labels, bold inline body.
- **body-sm** (Inter 400, 14 px, line-height 20 px): secondary text, table column headers, timestamp text, audit-log entries.
- **body-sm-strong** (Inter 600, 14 px, line-height 20 px): chip labels, nav-link emphasis.
- **caption** (Inter 400, 12 px, line-height 16 px): fine print only.
- **button-md** (Inter 600, 16 px, line-height 24 px): button labels.

### Named Rules

**The Weight Switch Rule.** Headings use weight 900 for the display register and weight 600 for sub-displays and table-primary content. Body and meta use weight 400. The contrast between 900 (display) and 600 (utility) is the only hierarchy signal in the type system. Do not introduce weight 700.

**The Single-Family Rule.** Inter for everything. No serif-display pairings, no monospace data fonts except where actually rendering code or IDs, no "technical" fonts. The system rejects display pairings on purpose: the weight contrast is the pairing.

**The No Uppercase Rule.** Column headers, chip labels, and meta text are NOT uppercase. The new type scale does not include an uppercase tier. Uppercase 12 px tracking is forbidden, regardless of how it appears in legacy shadcn defaults.

## 4. Elevation

Flat by default. The system uses surface contrast (sage canvas-soft band hosting white canvas cards) as the primary elevation cue. Shadow appears only as a state response.

### Levels

- **Level 0 - Flat.** No shadow, no border. Default for cards on the sage canvas. The white card on sage background IS the elevation.
- **Level 1 - Hairline.** 1 px solid ink border (or ink at low alpha for soft hairlines). Used for tertiary outline buttons, text inputs, table row dividers.
- **Level 2 - Soft Card.** Implicit Level 0 white card sitting on sage canvas. The surface contrast IS the elevation. No explicit shadow.

### Shadow Vocabulary (state response only)

- **focus-ring** (`box-shadow: 0 0 0 3px {colors.canvas}, 0 0 0 6px {colors.primary}`): focus ring for keyboard navigation. The primary lime color signals focus.
- **hover-lift** (`transform: translateY(-1px)` + `box-shadow: 0 4px 12px rgba(14, 15, 12, 0.08)`): row cards on hover only. Pure information cards never lift.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Hierarchy comes from surface contrast (sage canvas vs white card), never from resting shadow. Active states swap borders, not shadows: a 1 px solid ink border replaces a 1 px ink/10% hairline. No box-shadow lifts on resting cards or active list items.

**The No Inner Shadow Rule.** Inset shadows are forbidden everywhere.

## 5. Components

### Buttons

- **Shape:** 24 px pill-rectangle (`{rounded.xl}`). No sharp corners. The 24 px radius is the brand's friendliness signature.
- **Primary:** background `{colors.primary}` lime, text `{colors.ink}`, label `{typography.button-md}`, padding `12px 24px`. Height 48 px. The brand's universal CTA.
- **Secondary:** background `{colors.canvas-soft}` sage, text `{colors.ink}`, same typography / padding / shape. Used for "Cancel", "Back", non-destructive supporting actions, and "Mark resolved" in the review queue.
- **Tertiary:** background `{colors.canvas}` white, text `{colors.ink}`, 1 px solid `{colors.ink}` border, same typography / padding / shape. Used for ghost / outline secondary actions.
- **Ghost (operator extension):** transparent background, ink at 70% alpha text, no border, smaller padding (8 px 16 px), 12 px radius. Used in dense table action menus and the review-queue Reject verb.
- **Hover / Focus:** primary hovers to `{colors.primary-hover}` lighter lime. Tertiary hovers to canvas-soft. Focus uses the `focus-ring` token.

### Cards & Containers

- **card-content:** background `{colors.canvas}` white, text `{colors.ink}`, padding 24 px, 24 px radius. No border, no shadow. Sits on sage canvas.
- **card-feature-sage:** background `{colors.canvas-soft}` sage, text `{colors.ink}`, padding 24 px, 24 px radius. Used for secondary surfaces inside white sections.
- **card-feature-pale (operator extension):** background `{colors.primary-pale}` pale lime tint, text `{colors.ink}`, padding 24 px, 24 px radius. Used sparingly for review-banner emphasis.
- **Internal Padding:** 24 px on desktop, 16 px on mobile.

### Inputs & Forms

- **text-input:** background `{colors.canvas}` white, text `{colors.ink}`, 1 px solid `{colors.ink}` border, body in `{typography.body-md}`, padding `12px 16px`, 12 px radius. Height 48 px to match buttons.
- **Focus:** border shifts to `{colors.primary}` lime, focus-ring shadow appears outside the border.
- **Error:** border shifts to `{colors.negative}` red. Error message in `{typography.body-sm}` `{colors.negative-darkest}` below the field.
- **Disabled:** background `{colors.canvas-soft}` sage, border ink at 30% alpha, text body at 40% alpha.

### Navigation

- **nav-bar:** background `{colors.canvas}` white, text `{colors.ink}`, padding `12px 24px`. Sticky top.
- **nav-link:** text `{colors.ink}`, set in `{typography.body-sm-strong}`. Hover swaps to `{colors.primary}` lime. Active route uses primary lime + a 3 px primary lime vertical bar on the leading edge. The vertical bar is the only place lime appears as a *line* on the operator console.
- **Sidebar (operator extension):** left rail (Dashboard / Inbox / Simulator / Review / Settings). Same type treatment as `nav-link`. Active indicator is the primary lime vertical bar.

### Status Chips (operator extension; 5-status palette)

The semantic palette ships only 3 families (positive / warning / negative). The operator console needs 5 statuses; the mapping below extends the semantic palette with two neutral chips for `received` and `processing`. All chips: pill shape `{rounded.pill}`, padding `4px 12px`, label in `{typography.body-sm-strong}`.

- **received** - bg `{colors.canvas}` white, text `{colors.mute}`, 1 px ink at 10% alpha border. Fresh, untouched.
- **processing** - bg `{colors.canvas-soft}` sage, text `{colors.ink}`, 1 px ink at 15% alpha border. In-flight, neutral. Distinct from primary-pale to avoid confusion with the CTA.
- **completed** - bg positive at 12% alpha, text `{colors.positive-deep}`, 1 px positive at 40% alpha border. Clear success.
- **review_required** - bg warning at 20% alpha, text `{colors.warning-content}`, 1 px warning at 60% alpha border. Caution.
- **failed** - bg negative at 12% alpha, text `{colors.negative-darkest}`, 1 px negative at 40% alpha border. **Never primary lime.** Lime is action, not failure.

### Audit Timeline (signature)

Vertical list. Each row: a 14 px caption timestamp on the left, a 16 px body-md-strong message in the center, an optional 14 px body-sm secondary metadata line below. Status changes use the chip vocabulary above as inline pills inside the message. The timeline trunk is a 1 px ink at 25% alpha hairline running down the left column. No card wrapper around the timeline as a whole; it sits on the page tonal field directly.

### Tables (operator extension)

- **Header row:** body-sm-strong (14 px weight 600), text ink, background `{colors.canvas-soft}` sage, 1 px ink at 10% alpha hairline on bottom. NOT uppercase. NOT tracked.
- **Body row:** body-md-strong (16 px weight 600) for the primary column, body-md (16 px) for secondary, body-sm (14 px) body color for the trailing timestamp.
- **Row height:** 56 px. The system's generous line-height reads poorly under 48 px.
- **Row divider:** 1 px ink at 10% alpha hairline. No zebra striping (surface contrast on this brand is canvas vs canvas-soft only, not row striping).
- **Row hover:** background shifts to canvas-soft sage; on rows that link, cursor switches to pointer and a small `→` glyph appears at the trailing edge in ink at 70% alpha.

### Filter Chips (operator extension; distinct from status chips)

Inbox and simulator filter chips MUST use a visual treatment distinct from status chips. Filters control listing; status chips communicate event state. Sharing one visual collapses two affordances into one.

- **Resting:** bg `{colors.canvas}` white, text `{colors.body}`, 1 px ink at 15% alpha border, 12 px radius (`{rounded.md}`), label in `{typography.body-sm}`. NOT pill-shaped (the pill belongs to status chips).
- **Active:** bg `{colors.ink}` ink, text `{colors.canvas}` white, no border. The polarity flip carries activation; no tint reuse with the chip palette.

## 6. Do's and Don'ts

### Do
- **Do** keep lime-green as the single action accent. One per screen. Reserve it for "Submit", "Approve", "Mark Resolved": never decoration, never status, never success indicator (positive green handles success).
- **Do** lean on weight contrast (400 / 600 / 900) for hierarchy. The system is single-family on purpose.
- **Do** keep cards flat at rest. Surface contrast (sage canvas vs white card) carries elevation. Shadow only as a state response.
- **Do** use the full semantic palette (positive / warning / negative) for in-product status. Never repurpose lime as a success indicator.
- **Do** maintain the 1200 px max page width on wide screens; let the surrounding sage do the framing.
- **Do** use ink at 25% alpha hairline as the audit-timeline trunk and as inter-row dividers. Those are the only places hairlines appear as a *line*.
- **Do** prefer 24 px (`{rounded.xl}`) for cards and buttons. Friendliness is non-negotiable.
- **Do** keep filter-chip and status-chip visuals distinct. Filters use the rectangular ink-polarity treatment; status chips use the semantic-pill treatment.

### Don't
- **Don't** introduce a second brand accent. Lime is the sole identity color.
- **Don't** render the page title in weight 700 or 600. Page titles use display-md (40 px, weight 900). The brand's display weight is full-black.
- **Don't** render CTAs as sharp rectangles. The 24 px pill geometry is non-negotiable.
- **Don't** pair the green CTA with a green background. Lime always sits on neutral surfaces (sage / white / ink).
- **Don't** use lime for failure, error, or destructive states. Failed events use the status-failed red. The lime "Retry" or "Approve" button below them is the next action, not the failure itself.
- **Don't** add a serif-display font or a monospace body font. Inter across the board. Monospace renders only inside code or IDs.
- **Don't** retrofit pure black `#000` for body text. The system's body is ink `#0e0f0c` with olive warmth.
- **Don't** add `box-shadow` for "depth" on a resting card. Surface contrast carries elevation.
- **Don't** use em dashes in microcopy, labels, or empty states. Use commas, colons, periods, or parentheses.
- **Don't** stack cards inside cards. Zero nested cards.
- **Don't** uppercase column headers, chip labels, or meta text. The new type scale does not use uppercase tracking.
- **Don't** use a box-shadow lift on active list items in the review queue or anywhere else. Border swap only. The elevation system is flat.
- **Don't** subtitle every button with a hint (e.g. "Run the pending actions." under "Approve"). Button labels carry their meaning. Subtitles read as "I don't trust my labels."

---

## Register translation note

This system is purpose-built for the operator console. The vocabulary borrowed from a marketing-band heritage (heavy-display 900 hero scale, sage-canvas hosting white cards, lime-green CTA pill, 24 px pill geometry) translates almost unchanged: hero scale becomes empty-state-only, sage canvas becomes the dashboard's working surface, the lime CTA becomes the "next action" beat per screen. Four operator-only sections extend the heritage where it has no analog:

1. **Status chip palette (5-status)** - the semantic palette ships only 3 families; we map two neutral chips for `received` and `processing`.
2. **Tables** - operator dashboards are table-heavy; the marketing heritage has none. Specified above.
3. **Audit timeline trunk** - signature operator extension. Ink-hairline running down the left column.
4. **Filter chips** - operator extension. Rectangular ink-polarity treatment to stay visually distinct from status chips.
5. **Focus ring** - accessibility primitive. Uses lime as the focus color.

Treat the operator-only sections as canonical extensions, not departures.
