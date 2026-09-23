---
name: Brickwork
description: A lit brickfilm set where every win is a toy brick snapped onto its goal's tower.
colors:
  ink: "#232420"
  ink-soft: "#57564f"
  paper: "#dcd8cf"
  panel: "#f1eee7"
  hair: "rgba(35, 36, 32, 0.16)"
  ink-night: "#efebe3"
  ink-soft-night: "#aba599"
  paper-night: "#1d1c19"
  panel-night: "#2b2925"
  hair-night: "rgba(239, 235, 227, 0.2)"
  signal: "#f04a00"
  signal-press: "#d84200"
  film-black: "#0c0c0b"
  film-type: "#efece5"
  sweep-day: "#c1c3c2"
  fog-day: "#c9cac6"
  sweep-night: "#3a3a3e"
  fog-night: "#141413"
  plinth-day: "#575d66"
  plinth-night: "#46536a"
  tile-day: "#f1efe9"
  tile-night: "#efebe3"
  key-day: "#fffaf3"
  key-night: "#ffe2c4"
  fill-day: "#dde6f5"
  fill-night: "#8fa6d6"
  seam-shadow: "#1c1812"
  brick-red: "#c91a09"
  brick-yellow: "#f2cd37"
  brick-pink: "#ff698f"
  brick-blue: "#0055bf"
  brick-green: "#237841"
  brick-lavender: "#ac78ba"
  brick-azure: "#36aebf"
  brick-tan: "#aa7d55"
  milestone-gold: "#d9a23a"
typography:
  display:
    fontFamily: "Google Sans Flex Variable, Helvetica Neue, sans-serif"
    fontSize: "88px"
    fontWeight: 730
    lineHeight: 0.86
    letterSpacing: "-0.045em"
    fontFeature: "tnum"
    fontVariation: "'ROND' 100"
  headline:
    fontFamily: "Google Sans Flex Variable, Helvetica Neue, sans-serif"
    fontSize: "40px"
    fontWeight: 730
    letterSpacing: "-0.04em"
    fontFeature: "tnum"
    fontVariation: "'ROND' 100"
  title:
    fontFamily: "Google Sans Flex Variable, Helvetica Neue, sans-serif"
    fontSize: "24px"
    fontWeight: 720
    letterSpacing: "-0.02em"
    fontVariation: "'ROND' 100"
  body:
    fontFamily: "Google Sans Flex Variable, Helvetica Neue, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
    fontVariation: "'ROND' 100"
  label:
    fontFamily: "Google Sans Flex Variable, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 640
    lineHeight: 1.4
    fontVariation: "'ROND' 100"
  caption:
    fontFamily: "Google Sans Flex Variable, Helvetica Neue, sans-serif"
    fontSize: "12px"
    fontWeight: 540
    fontFeature: "tnum"
    fontVariation: "'ROND' 100"
rounded:
  day: "6px"
  stop: "8px"
  tool: "10px"
  button: "12px"
  pad: "14px"
  sheet: "20px"
  mark: "50%"
spacing:
  half-stud: "4px"
  stud: "8px"
  stud-and-half: "12px"
  two-studs: "16px"
  three-studs: "24px"
  four-studs: "32px"
components:
  tool:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.tool}"
    padding: "0 12px"
    height: "36px"
  tool-film:
    backgroundColor: "{colors.signal}"
    textColor: "#ffffff"
    rounded: "{rounded.tool}"
    padding: "0 12px"
    height: "36px"
  tool-film-hover:
    backgroundColor: "{colors.signal-press}"
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.panel}"
    typography: "{typography.body}"
    rounded: "{rounded.button}"
    padding: "0 22px"
    height: "44px"
  pad:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pad}"
    padding: "6px 4px 8px"
    width: "92px"
  picker-sheet:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.sheet}"
    padding: "20px 24px 24px"
    width: "860px"
  tip:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.tool}"
    padding: "8px 12px"
  day-cell:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.day}"
    width: "24px"
    height: "56px"
  film-bar:
    backgroundColor: "{colors.film-black}"
    textColor: "{colors.film-type}"
    padding: "0 32px"
---

# Design System: Brickwork

## Overview

**Creative North Star: "The Brickfilm Set"**

Brickwork is a miniature stop-motion set on a desk. Glossy toy bricks stand in towers on a dark studded baseplate, over a paper sweep that curves up into a back wall. The set follows the room's light: the Mac's appearance picks the mood (`prefers-color-scheme`, or `?day` and `?night` to force it). Day is a neutral studio under a soft white key. Night is the same sweep in a dark studio under one warm lamp whose pool falls off into the dark.

The interface is printed ink sitting on that set, never a panel system laid over it. Two ink weights, one signal orange, and a drawn isometric brick do all the work. Colour belongs to the bricks. Motion runs at 12 frames per second in whole frames, so a jump in time plays as stop motion and the film cuts in and out on a single frame.

Density is low. The first viewport is the set, full bleed, with the step numeral top left, tools top right, and the goal pads bottom centre with the day strip just above them.

**Key Characteristics:**
- A full-bleed WebGL set with two moods (day, night) that share one geometry.
- Bricks are physical: clearcoat ABS, rounded edges, studs, a seam between neighbours.
- UI is two inks plus one signal orange; colour lives in the bricks.
- Everything that animates steps at 12 fps (83.3 ms per frame).
- Google Sans Flex with the rounded axis at 100, heavy tabular numerals.
- One stroke icon family (Lucide), drawn bricks for every goal reference.

## Colors

A warm neutral ink system over a gray studio set, with a toy-brick palette that is the only saturated colour on screen apart from one orange.

### Primary
- **Signal Orange** (signal): the film transport ("Play the film" fill) and the 2px mark under the selected day. Also the focus ring, the text caret and the selection tint (22% alpha). Its press state is **Burnt Signal** (signal-press), used only on the film button's hover.

### Neutral (HTML layer, day)
- **Warm Ink** (ink): all primary text, the primary button fill, the check mark on a chosen goal, the name tiles' print on the set in both moods.
- **Soft Ink** (ink-soft): units, dates, counts, hints, placeholders, disabled labels.
- **Studio Paper** (paper): the body behind the canvas.
- **Card Stock** (panel): the picker sheet (at 94% opacity), hover tips, the inspector, and the text colour on ink-filled buttons.
- **Hairline** (hair): every 1px border. Hover washes are ink at 7% (`color-mix`), underlines are ink at 22 to 38%.

### Neutral (HTML layer, night)
- **Lamp Ink** (ink-night), **Dim Ink** (ink-soft-night), **Dark Studio** (paper-night), **Dark Card** (panel-night), **Night Hairline** (hair-night). Same roles as day; the swap happens on `:root[data-mood='night']` and nothing else changes.

### Film
- **Letterbox Black** (film-black): the two letterbox bars, fixed for both moods.
- **Slate White** (film-type): the step, date and Stop control inside the bottom bar.

### The Set (3D, from `LOOKS` in theme.ts)
- **Day Sweep** and **Day Haze** (sweep-day, fog-day): the paper sweep and the fog and clear colour. Fog runs 220 to 900 units.
- **Night Sweep** and **Night Dark** (sweep-night, fog-night): same roles; fog pulls in to 90 to 520 units so the studio falls off fast.
- **Baseplate Slate** (plinth-day) and **Baseplate Night Blue** (plinth-night): the studded plinth.
- **Tile White** (tile-day, tile-night): the printed 8x2 name tiles.
- **Softbox White** (key-day, intensity 3.2) and **Lamp Amber** (key-night, intensity 4.2): the key light. Day is a directional softbox; night is one spot lamp (penumbra 0.75).
- **Sky Fill** (fill-day, 0.5) and **Moon Fill** (fill-night, 0.16): the cool fill from camera right.
- **Seam Brown** (seam-shadow): the tint of ambient occlusion in the seams.

### Bricks
- **Build Red, Money Yellow, Body Pink, Learn Blue, People Green, Create Lavender, Rest Azure, Home Tan** (brick-red through brick-tan): one per goal, at most 6 goals on a set.
- **Milestone Gold** (milestone-gold): every 100th brick of a goal, as lacquered amber-gold plastic (metalness 0.15, clearcoat 0.85, a faint #3a2600 self-light at 0.25). Warmer and deeper than Money Yellow, and it stays gold under the night lamp, where full metal turned olive.

### Named Rules
**The Colour Lives In Bricks Rule.** Saturated colour appears only on bricks and brick glyphs. The HTML layer is ink, paper and one orange.

**The Never Tinted Rule.** A goal's colour is never tinted, dimmed or recoloured for state. Selection, hover and today are shown with marks, weight and washes of ink, not by changing a brick.

**The One Gold Rule.** Gold is reserved for the 100th brick milestone. Nothing else is gold.

**The Signal Is Scarce Rule.** Orange marks the film transport, the selected day and keyboard focus. It never fills a second button.

## Typography

**Display Font:** Google Sans Flex Variable (with Helvetica Neue, sans-serif), loaded through `@fontsource-variable/google-sans-flex`.
**Body Font:** the same family.

**Character:** One rounded sans at many weights. `font-variation-settings: 'ROND' 100` is set on the body, so every glyph, including the numerals, has the soft corners of a moulded part. Weights are tuned by tens (520 to 760), not by named steps.

### Hierarchy
- **Display** (730, 88px, 0.86, -0.045em, tabular): the step numeral, "day N of building". 60px under 720px wide. Its unit ("day") sits beside it at 17px/650 in Soft Ink.
- **Headline** (730, 40px, -0.04em, tabular): the step number in the film letterbox.
- **Title** (720, 24px, -0.02em): the picker heading. 20px on mobile.
- **Body** (400 base, 15px, 1.4): the date line (15px/620, soft part at 520), buttons (15px/660), inputs (14px).
- **Label** (640, 13px): part rows, pad names (650), tips, text buttons, the drop bar (560).
- **Caption** (540, 12px, tabular): counts on pads and choices.

### Named Rules
**The Step Numeral Leads Rule.** The biggest type on screen is always a day count, set heavy and tabular, like a build booklet step. No sentence is ever set larger than it.

**The Tabular Count Rule.** Every number that changes (step, part counts, pad counts, day numbers) uses `tabular-nums` so it can tick frame by frame without the line moving.

## Layout

The set is full bleed (`position: fixed; inset: 0`), and the HTML layer floats on it in three corners of attention: day panel top left (24px, 32px; max 340px wide), tools top right (20px, 24px), dock bottom centre (16px from the bottom or the safe area). The camera frames the towers inside the space those leave: 120px top, 236px bottom, 72px each side on desktop. When the picker is open the bottom reserve grows to 470px.

**The stud module.** One stud pitch is the unit of the world: a brick is 1.2 pitches tall (9.6 mm over 8 mm), a stud is 0.3 in radius and 0.18 tall, and neighbours lose 0.012 per side as a seam. Brick sizes are 1x2 (small), 2x2 (solid) and 2x4 (big). In the UI, one stud is 8px, and spacing runs on half studs: 4, 8, 12, 16, 24, 32px.

**The setback.** Each goal owns an 8x8 stud plot with a 2-stud-deep name tile in front of it. Layers 0 to 5 fill the whole 8x8 as a podium. From layer 6 a 6x6 tower steps back by one stud. Plots sit 3 studs apart in rows, on a plinth with a 2-stud margin. A brick takes the lowest free seat, prefers to bridge two bricks below it, and never moves once placed.

**Responsive.** One breakpoint at 720px. Below it: the numeral drops to 60px, the panel moves to 14px/16px and caps at 62vw, notes hide, tool labels hide to icons, pads shrink from 92px to 60px with the glyph at 0.8 scale, and the camera reserves 26% of the height on top and 32% on the bottom.

## Elevation & Depth

Depth is real light, not UI shadow. The HTML layer is flat: no box shadows on tools, tips, the picker or buttons. The only UI shadow is a soft drop under drawn bricks, which reads as the brick standing on the paper.

The set gets its depth from a shadow-casting key (2048px shadow maps), N8AO ambient occlusion (radius 0.9, intensity 2.2, tinted Seam Brown), a faint tilt-shift (blur 0.07 across the middle band at 0.46), neutral tone mapping, and a vignette (0.3 day, 0.4 night). A film grain sits over everything at 55% soft light, 80% during the film.

### Shadow Vocabulary
- **Brick on paper** (`filter: drop-shadow(0 3px 2px rgba(20, 19, 17, 0.3))`): under every pad glyph. The picker glyphs use 0.28 alpha.

### Named Rules
**The Lit Not Lifted Rule.** Nothing in the HTML layer floats on a shadow. If something needs to read as raised, it is a brick, and the set's light does it.

## Shapes

Two form languages, one for each layer. On the set, everything is a moulded part: bricks with a 0.045 edge round, studs as lathed cylinders with a rounded lip, a plinth slab with a 0.28 round, name tiles with a 0.05 round, and a sweep that curves from floor to wall on a 70-unit radius.

In the HTML layer, corners grow with the size of the thing: 6px on a day cell, 8px on the film Stop control, 10px on tools and tips, 12px on the primary button, 14px on pads and choices, 20px on the picker sheet. The only circle is the 22px check mark on a chosen goal. Borders are 1px hairlines. Inputs are a single underline, never a box.

Every goal reference in the UI is a **BrickGlyph**: an isometric SVG brick drawn from the same geometry as the 3D brick (height 1.2, stud radius 0.3), with faces shaded from the goal colour (right face -30%, front -14%, top edge highlight +28%, studs -22% and +10%). Glyph scale is px per stud: 13 on pads, 11 in the picker, 7 in the day panel, 6 in notes and the drop bar.

## Components

### Buttons
Ink on the set, one fill per screen.
- **Shape:** gently rounded (12px) at 44px tall for the primary; 10px at 36px for tools.
- **Primary:** Warm Ink fill with Card Stock text, 0 22px padding, 15px/660. Used once: the picker's "Start building" (or "Done" on later edits).
- **Tool:** transparent with a hairline border, 14px/600, an 18px Lucide icon at stroke 1.75 and a label. Hover adds the 7% ink wash.
- **Film:** the tool shape filled Signal Orange with white text and a 16px Play icon at stroke 2. Hover goes to Burnt Signal. Disabled (no bricks yet) drops to a hairline ghost in Soft Ink.
- **Text button:** 13px/640 with an underline at 38% ink, 3px offset, full ink on hover.
- **Disabled:** transparent fill, hairline border, Soft Ink text. No greyed fills.

### Pads (signature)
The primary action. One pad per goal, 92px wide, 4px apart, bottom centre.
- **Content:** the goal's BrickGlyph (58px well), the name (13px/650, clipped at 84px), the count (12px/540 Soft Ink).
- **Gesture:** press drops a 2x2; holding grows the held brick to 2x2 at 380 ms and to 2x4 at 860 ms; release lets it go. Keys 1 to 6 do the same.
- **States:** hover adds the ink wash and a hairline. Press or hold pushes the glyph down 2px with no transition.
- **Add pad:** the same shape with a Plus icon in Soft Ink.

### Day Strip
A step sequencer read left to right, up to 760px wide, fading in over the first 56px.
- **Cell:** 24px by 56px, 2px apart, 6px radius. A stack of 3px segments in goal colours rises from the bottom (time runs upward), then the day number at 10px.
- **Today:** the number goes to full ink at 760.
- **Selected:** a 2px Signal Orange bar under the cell, inset 6px each side. The cell itself is never tinted.
- **Scroll:** horizontal, `scroll-snap-type: x mandatory`, snapping to whole days.

### Picker (first run)
A Card Stock sheet (94%), 20px radius, hairline, up to 860px, on the lower half of the set. A 4-column grid of choices: a 4x2 BrickGlyph at 11px per stud, an editable underlined name (14px/650), and a count. A chosen goal gets a hairline, the ink wash and the ink check mark. At most 6.

### Tips and Inspector
Card Stock, hairline, 10px radius, 13px text. The tip is centred and passive (8px 12px). The inspector is 280px, left aligned, 12px 14px, and holds the note input and a Trash text button.

### Inputs
Transparent, with one underline at 32% ink (22% in the picker), turning full ink on focus. The caret is Signal Orange. Placeholders in Soft Ink.

### Film Frame
Letterbox bars in Letterbox Black at a 2.39:1 frame (each bar clamped 40px to 16vh). The bottom bar carries the step at 40px, the long date at 14px/560, and a Stop control (32px, 8px radius, 30% slate hairline, 12px Square icon). The bars cut in and out on one frame, with no fade.

### Motion (all components)
- **Frame:** 12 fps, `FRAME_MS` = 83.3 ms. Timers step on whole frames; nothing tweens between them.
- **Drop:** five poses, one per frame (height 2.6, 1.3, 0.38, -0.06, then rest at 0.12); the snap sound and contact land on frame 3.
- **Count ticks:** a jump in counts plays over at most 10 frames.
- **Hop:** the shown day's bricks hop once, 600 ms after you land on the day, over 6 frames (0.3, 0.62, 0.78, 0.62, 0.3, 0.04).
- **Film:** one day per frame, one note per goal per frame; the camera orbits 0.0055 rad per frame on the same clock.
- **Grain:** boils in `steps(12)` over 1 s during the film; still under `prefers-reduced-motion`.
- **Free camera:** the only eased motion (smooth time 0.32 s, 0.08 s while dragging), zooming toward the cursor from 900 down to 7 units.
- **Drop bar:** the last drop's line stays for 8000 ms.

## Do's and Don'ts

### Do:
- **Do** step every animation on the 12 fps frame (83.3 ms) and snap to whole poses.
- **Do** cut the film in and out on one frame.
- **Do** draw goals as BrickGlyphs in the goal colour, at the glyph scales above.
- **Do** keep spacing on half studs (4, 8, 12, 16, 24, 32px).
- **Do** swap only the ink, paper, panel and hairline tokens between day and night; the set swaps through `LOOKS`.
- **Do** set every changing number in tabular figures.
- **Do** use Lucide icons at one stroke family (1.75 for 18px tools, 2 to 2.5 for small transport icons).

### Don't:
- **Don't** tint, dim or recolour a goal's bricks for state.
- **Don't** use gold for anything but the 100th brick.
- **Don't** fill a second button with Signal Orange.
- **Don't** put box shadows on the HTML layer.
- **Don't** fade or ease the film, drops or count ticks.
- **Don't** add streak flames, checklists, a contribution heatmap or bar charts.
- **Don't** move a placed brick; the build only grows.
