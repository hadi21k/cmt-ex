---
name: Operations Command Center
description: Design system extracted from cmonkeytribe.com, retargeted for a workflow-routing dashboard
source: https://cmonkeytribe.com/
sourceRegister: brand (creative-agency marketing site)
targetRegister: product (operations dashboard)
colors:
  brand-teal: "#12536B"
  brand-orange: "#ED5338"
  cream: "#FDFBF7"
  ink: "#2E2A39"
  ink-soft: "rgba(46, 42, 57, 0.85)"
  body: "rgba(0, 0, 0, 0.75)"
  surface: "#FFFFFF"
  surface-mute: "rgba(0, 0, 0, 0.03)"
  surface-overlay: "rgba(0, 0, 0, 0.5)"
  border-contrast: "#BFBFBF"
typography:
  display:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.6px"
  headline:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "40px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.6px"
  title:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.6px"
  subheading:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.6px"
  body:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0.6px"
  body-strong:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.6px"
  label:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "1px"
  meta:
    fontFamily: "Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.8
    letterSpacing: "0.6px"
rounded:
  sm: "10px"
  md: "11px"
  lg: "12px"
  xl: "22px"
  pill: "20px"
spacing:
  hairline: "4px"
  xs: "8px"
  sm: "16px"
  md: "20px"
  lg: "28px"
  xl: "32px"
  gutter-mobile: "16px"
  gutter-desktop: "32px"
  section-mobile: "20px"
  section-desktop: "28px"
  page-max: "1200px"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px 30px"
  button-primary-hover:
    backgroundColor: "{colors.brand-teal}"
    textColor: "{colors.cream}"
    rounded: "{rounded.md}"
    padding: "12px 30px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 30px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.body}"
    rounded: "{rounded.lg}"
    padding: "24px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
  badge-status:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
---

# Design System: Operations Command Center

> Sourced from cmonkeytribe.com on 2026-05-25. The source is a brand-register marketing site for a Lebanese creative agency. This document captures its design vocabulary verbatim, then translates it into product-register guidance for a workflow-routing dashboard. Tokens above are normative. Prose below explains how to apply them where the source and target registers diverge.

## 1. Overview

**Creative North Star: "The Confident Operator"**

The source site speaks in two voices stacked on a calm cream-white field: a deep teal-blue display weight that reads like a typographic poster (CONCEPT / CONTENT / CONVERSION.), and a single saturated orange CTA that owns ~5% of every screen. Headings are quietly heavy, body type is generous, cards are barely-shadowed and softly cornered, and the whole composition leans on negative space rather than ornament. There is no display font, no gradient, no decorative outline. Hierarchy is built from weight and color, not from typeface or graphic treatment.

For the operations dashboard, the personality carries forward as **calm authority**: an SRE-style command surface that an operator can scan in one second and act on in two, with one orange beat per workspace marking the next thing to do. The display register (64px bold teal) does not survive the translation literally; it becomes a single tone of voice in the page heading and is otherwise reserved for empty-state hero moments. The product borrows the source's posture (still, decisive, never noisy) without borrowing its scale.

**Key Characteristics:**
- Two-color brand discipline: deep teal-blue for identity and authority, vibrant orange for the next action only.
- Cream-white surface, never pure paper. Tinted to warm the eye in long sessions.
- Helvetica everywhere. No display family, no decorative pairing. Weight (400 vs 700) carries the rhythm.
- Generous letter-spacing (0.6px on body, 1px on labels) gives type a faintly editorial cadence.
- Card softness without card overuse: 12px radius, near-zero shadow, no nested cards.
- Single source of urgency. The orange button is the *only* element using the brand orange. Everything else is teal, ink, or neutral.

## 2. Colors

A two-color brand system riding on a near-white field. Teal-blue is the system's voice; orange is its imperative.

### Primary
- **Deep Teal-Blue** (`#12536B`): the display color and the brand mark. Reserved for the page heading, dashboard title, the active nav state, and the iconographic accents (logo, focal data-viz line, primary chart series). Translates in the product to: the brand mark in the sidebar, the active route indicator, the streamlabel chip for the dominant workflow stream, the primary line in the audit timeline.
- **Brand Orange** (`#ED5338`): used *only* as the primary CTA. In the source it is one rounded rectangle per section ("Start your Digital Journey", "Get in Touch"). In the dashboard it is the **single most important action on the current screen**: "Submit Event", "Approve", "Mark Resolved". Never used as a status color, never used for icons, never used as a hover state.

### Neutral
- **Cream** (`#FDFBF7`): button text only in the source. In the dashboard this is the canvas tint we use for elevated empty-state surfaces (review-queue empty card, simulator empty preview).
- **Ink** (`#2E2A39`): the link color, the soft shadow color. Used for primary body text where higher contrast matters (event titles, table cells, form labels).
- **Ink-soft** (`rgba(46, 42, 57, 0.85)`): the underlined-link color. Meta text in tables and the audit timeline timestamps.
- **Body** (`rgba(0, 0, 0, 0.75)`): the default body text color. Used for paragraph copy and form descriptions.
- **Surface** (`#FFFFFF`): page background and elevated card surface.
- **Surface-mute** (`rgba(0, 0, 0, 0.03)`): the only "background variation" the source uses. Becomes the zebra row on tables and the resting state of inactive filter chips.
- **Border-contrast** (`#BFBFBF`): the foreground-contrast token. Becomes the hairline border on dividers and table rows.

### Named Rules

**The One Orange Rule.** Brand Orange is the *only* color used for primary action. There is exactly one orange element per screen at any time. If two actions would both deserve orange, the lesser becomes teal-outlined or ghost. Never use orange for status, hover state, charts, or icons. Its scarcity is the affordance.

**The Two-Voice Rule.** Color hierarchy is teal (identity, history, "what is this") and orange (action, "what next"). Status colors (red for failed, yellow for review_required, green for completed, slate for received/processing) live in a *separate* role layer described in Components and never mix with the brand pair on the same element.

**The No Pure Black Rule.** Body copy uses `rgba(0,0,0,0.75)`, not `#000`. Borders use `#BFBFBF`. Headings can use `#000` for emphasis but the system prefers `#2E2A39` (ink) so the surface stays warm.

## 3. Typography

**Display Font:** Helvetica, Arial, sans-serif (system stack; no custom display family)
**Body Font:** same
**Label Font:** same

**Character:** Single-family typography. The system rejects display pairings on purpose. The rhythm comes from weight (400 vs 700), generous line-height (1.8 on body), and a consistent 0.6px letter-spacing that reads slightly editorial without being mannered. The label scale jumps to 1px letter-spacing — the only place spacing escalates.

### Hierarchy
- **Display** (700, 64px, line-height 1.1): hero display words like CONCEPT / CONTENT / CONVERSION. In the dashboard this is reserved for empty-state heroes ("No events yet. Drop one in the simulator.") and the marketing-style landing of the auth screen. Not used on data screens.
- **Headline** (400, 40px, line-height 1.3): section titles ("Branding Projects", "BLOG"). In the dashboard: page titles ("Event Inbox", "Review Queue", "Simulator").
- **Title** (700, 26px, line-height 1.2): the brand tagline weight ("The 3Cs..."). In the dashboard: dashboard-card big numbers (total events, completed count, failed count). The weight contrast is what gives the metric authority.
- **Subheading** (400, 24px, line-height 1.3): blog card headings. In the dashboard: event detail panel section labels ("Original Payload", "Generated Actions", "Audit Timeline").
- **Body-strong** (400, 18px, line-height 1.3): navigation labels. In the dashboard: table row primary content (event title, source_event_id), navigation links.
- **Body** (400, 16px, line-height 1.8): paragraph copy. Letter-spacing 0.6px. Max line length 65–75ch on text-heavy screens (event detail).
- **Label** (400, 15px, line-height 1.2, letter-spacing 1px): button text. The widest tracking in the system. Triggers a slightly mechanical, decisive feel on action elements.
- **Meta** (400, 14px, line-height 1.8): footer links, "View all" links. In the dashboard: table column headers, timestamp text, audit-log entries.

### Named Rules

**The Weight Switch Rule.** Headings use weight 400 by default. The system reserves 700 for two things only: the *display* register (huge hero words) and the *title* register (the 26px tagline-style line). Mid-size headings (40px) stay at 400 — the *size* carries the hierarchy, the *weight* does not have to.

**The Tracking Step Rule.** Body and headings track at 0.6px. Buttons and labels jump to 1px. Nowhere else. Resist the urge to track-out a third register; the two-step rhythm is the point.

## 4. Elevation

Near-flat. The source uses tonal layering on a cream-white field rather than meaningful shadow. Cards rest on the page; they do not float above it. The shadow values exist but they are calibrated so low (5% opacity at 35px blur, far-throw) that they read as a barely-there visual seam, not as elevation.

For the dashboard: keep the flat posture for resting state. Use real shadow only as a *response to state*: a hover lift on row cards in the event inbox, a focus ring on inputs, a popover offset for the simulate-failure toggle's tooltip.

### Shadow Vocabulary

- **card-rest** (`box-shadow: 10px 10px 35px rgba(46, 42, 57, 0.05)`): the source's `--blog-card-shadow`. Use on resting cards in the event inbox and review queue. Subtle enough to read as separation but not elevation.
- **media-soft** (`box-shadow: 10px 12px 20px rgba(46, 42, 57, 0.1)`): the source's `--media-shadow`. Use on the simulator JSON-preview panel and event-detail payload panel to differentiate them as "look here" surfaces.
- **focus-ring** (`box-shadow: 0 0 0 3px #FFFFFF, 0 0 0.5rem 4px rgba(0, 0, 0, 0.3)`): the source's focused-base shadow. Apply on `:focus-visible` for keyboard navigation. Never on `:focus` alone (avoids ring-flash on mouse click).

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. The dashboard never uses shadow to communicate hierarchy at rest — that's what the cream/white tonal step is for. Shadow appears only as a state response.

**The No Inner Shadow Rule.** Inset shadows are forbidden everywhere. The source has none; the product has none.

## 5. Components

For each component the source defines a shape, the product defines the *behavior* the source doesn't have.

### Buttons

- **Shape:** Soft rectangles. Border-radius 11px (outer, button-primary) or 10px (inner content). No pill buttons in the source CTA pattern.
- **Primary:** background brand-orange, text cream, padding `0 30px` with the height carried by line-height 18px + label-tracking 1px. In the dashboard, height becomes a fixed `44px` so it aligns with the input scale. Label is uppercase-on-demand (not by default), 15px.
- **Hover / Focus:** the source has no visible hover treatment on primary CTAs. We add a barely-detectable lift on hover (`transform: translateY(-1px)` + `box-shadow: 0 4px 12px rgba(237, 83, 56, 0.2)`) and a teal-blue background swap on active. Focus uses the `focus-ring` token from Elevation.
- **Secondary:** white background, ink text, 1px ink-soft border, same radius. Used for "Cancel", "Back", non-destructive supporting actions.
- **Ghost (product-only):** transparent background, ink-soft text, no border. Used in dense table action menus and the audit timeline filter chips. Hover swaps to surface-mute.

### Cards

- **Shape:** Border-radius 12px. Internal padding 24px (`xl` token). No border in the source; the dashboard adds a 1px ink-soft@10% hairline border on cards that sit on the same surface tone as the page background to give them a contour.
- **Background:** surface (white).
- **Shadow Strategy:** `card-rest` token at rest. Hover lifts to `media-soft` only on cards that are also links (inbox row cards, blog cards). Pure information cards never lift.
- **Internal Padding:** 24px on desktop, 20px on mobile.

### Inputs

- **Shape:** Border-radius 10px. Padding `12px 16px`. Height 44px to match buttons.
- **Border:** 1px solid `rgba(46, 42, 57, 0.55)` (ink at 55% opacity, source's `--inputs-border-opacity` token).
- **Focus:** border shifts to brand-teal (`#12536B`), focus-ring shadow appears outside the border.
- **Error:** border shifts to a status-error red (defined in the status layer below), error message in 14px error-red below the field.
- **Disabled:** background surface-mute, border 1px ink-soft@30%, text body@40%.

### Navigation

- **Style:** Horizontal in the source header (About / Portfolio / Blog / Careers / Contact). In the dashboard this becomes a left sidebar (Dashboard / Inbox / Simulator / Review / Settings) using the same type treatment.
- **Typography:** body-strong (18px, weight 400, letter-spacing 0.6px) at default. The source uses `padding: 11px 30px` per link — kept on hover hit-area but visual padding stays tight in the sidebar.
- **States:** default body color; hover swaps to brand-teal; active route uses brand-teal + a 3px brand-teal vertical bar on the leading edge (the *one* place a left-side accent is allowed, because it is a system-level navigation primitive, not a card stripe).
- **Mobile:** sidebar collapses to a top sheet from a hamburger; same type rules.

### Status Chips (product-only; the source has no equivalent)

The source provides no status chip vocabulary, so the dashboard extends with a separate role layer that does not overlap with the brand pair:

- **received:** background `rgba(46, 42, 57, 0.08)`, text ink, rounded pill (20px), 4px 12px padding.
- **processing:** background `rgba(18, 83, 107, 0.12)` (teal tinted), text brand-teal. *This is the only product-only place teal appears as a background.*
- **completed:** background `rgba(34, 134, 81, 0.12)`, text `#226051`.
- **review_required:** background `rgba(202, 138, 4, 0.14)`, text `#854D0E`.
- **failed:** background `rgba(180, 35, 24, 0.12)`, text `#8B1F12`. **Never brand-orange.** Brand-orange is action, not failure.

### Audit Timeline (signature)

Vertical list. Each row is a 14px meta timestamp on the left, an 18px body-strong message in the center, and an optional 14px ink-soft secondary metadata line below. Status changes use the chip vocabulary above as inline pills inside the message. The timeline trunk is a 1px brand-teal hairline running down the left column. No card wrapper around the timeline as a whole; it sits on the page tonal field directly.

### Tables (product-only)

The source has none, so the product specifies:

- **Header row:** meta (14px, weight 400, letter-spacing 0.6px), text ink-soft, background surface-mute, hairline border on bottom.
- **Body row:** body-strong (18px) for the primary column, body (16px) for secondary, meta (14px ink-soft) for the trailing timestamp.
- **Row height:** 56px. No more compact; the system's letter-spacing reads poorly under 44px.
- **Zebra:** alternate rows use surface (white) and surface-mute (`rgba(0,0,0,0.03)`).
- **Row hover:** lift to surface; on rows that link, cursor switches to pointer and a small `→` glyph appears at the trailing edge in ink-soft.

## 6. Do's and Don'ts

### Do:
- **Do** keep brand-orange as the single action accent. One per screen. Reserve it for "Submit", "Approve", "Mark Resolved" — never decoration, never status.
- **Do** lean on weight contrast (400 / 700) and tracking step (0.6px / 1px) for hierarchy. The system is single-family on purpose.
- **Do** keep cards near-flat. Shadow only as a state response (hover, focus), never as a resting elevation.
- **Do** tint neutrals toward the brand: cream over pure white when warmth helps (empty states), 0.75-alpha black over pure black for body copy.
- **Do** keep generous line-height on body (1.8) even in dense screens. The system's calm is built on vertical breathing room.
- **Do** maintain the 1200px (120rem) max page width on wide screens; let the surrounding cream do the framing.
- **Do** use the teal hairline as the audit-timeline trunk and as the active-nav indicator. Those are the only two places it appears as a *line*.

### Don't:
- **Don't** introduce a third brand color. The source uses exactly two; the dashboard inherits exactly two. Status colors live in their own role layer and never adjacent to brand-orange or brand-teal.
- **Don't** use brand-orange for failure, error, or destructive states. It is the *next action* color. Failed events use the status-failed red; the orange "Retry" button below them is the next action, not the failure itself.
- **Don't** add a display font. Helvetica/Arial across the board. The system rejects serif-display pairings, monospace data fonts, and "technical" fonts.
- **Don't** use side-stripe borders on cards or callouts. The brand-teal vertical bar on the active nav route is the *only* allowed leading-edge accent.
- **Don't** use gradient text, gradient buttons, glassmorphism, neon, or any "AI-product cliché" treatment. The source rejects all of these by example. Pure flat color, soft corners, generous space.
- **Don't** add `box-shadow` for "depth" on a resting card. The system is flat at rest. Shadow appears only on hover, focus, and on the two designated "look here" panels (simulator preview, event-detail payload).
- **Don't** use em dashes in microcopy, labels, or empty states. Use commas, colons, periods, or parentheses.
- **Don't** stack cards inside cards. The source has zero nested cards; the dashboard has zero nested cards.
- **Don't** retrofit pure black `#000` for body text. The system's body is 0.75-alpha black so the cream surface stays warm.

---

## Register translation note

The source is brand-register: a marketing site where design *is* the product. The target is product-register: an operations dashboard where design *serves* the product. Three vocabulary items transferred almost unchanged (color pair, type weight contrast, soft-rounded button), one was reduced (display 64px is now empty-state-only, not a standing element on data screens), and four were added (status chip layer, table specification, audit timeline trunk, focus ring) because the source has no analog. When applying this design to dashboard screens, treat the four product-only sections as canonical extensions rather than departures from the source.

The source's posture — calm, two-color, generous space, weight-driven hierarchy — is what we are inheriting. The source's literal scale — 64px display words taking a third of the viewport — is not.
