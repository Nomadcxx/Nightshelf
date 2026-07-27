# Design — NightShelf

The locked design system for this app. Read this before changing colour, glass,
or motion. Values are edited in `utils/themes.js`, never here and never directly
in the generated CSS.

## Genre

Atmospheric — a dark canvas for a phone used after dark.

One deliberate departure: the atmospheric genre bans glassmorphism, and
NightShelf is built on it. Nightglass is the product's identity, so the ban does
not apply here. Everything else in the genre holds: dark ground, one accent per
theme, fade-only motion, no gradient text.

## Themes

Five, all dark. There is no light theme.

| Theme | Canvas | Accent | Role |
|---|---|---|---|
| Night | `#212337` | `#a48cf2` lilac | Default. The brand. |
| Black OLED | `#000000` | `#b297fc` lilac | Pixels off. Maximum contrast. |
| Terminal | `#031007` | `#33f5a0` phosphor | CRT ground, green rules. |
| Graphite | `#15171a` | `#5dbee9` steel | Neutral. No hue commitment. |
| Ember | `#2b190d` | `#f6a754` amber | Warm, minimal blue for late listening. |

### Rules that hold across all five

- **Night is pinned.** Its surfaces are the exact values that shipped. Round-tripping
  them through OKLCH moved muted-on-secondary from 4.52:1 to 4.41:1 and broke AA.
  Do not "clean up" Night's numbers.
- **Black is `#000000` exactly.** Any non-zero channel lights the pixel and the
  theme stops being an OLED theme. It previously shipped at `#171928` and saved
  nothing. `tests/themes.test.js` asserts this.
- **Ink never reaches pure white**, most importantly on Black — white on black
  smears on OLED panels during scroll.
- **Elevation goes lighter, never darker.** Roughly +6% OKLCH lightness per level
  (`bg` → `secondary` → `bg-hover`). On Black the canvas stays at zero and
  elevation is carried by `border`.
- **Neutrals are tinted toward the theme's anchor hue** — never flat grey. Graphite
  carries the smallest tint (chroma 0.006) and is still not zero.
- **One accent per theme.** Accent is a highlighter: focus rings, active states,
  progress. Never a large fill.

### Anchor hues

Night 285 · Black 285 · Terminal 155 · Graphite 250 · Ember 55.

Never move a theme's hue between tokens; only lightness and chroma move.

## Colour pipeline

Palettes are **designed in OKLCH** and **shipped as sRGB triplets**. Two reasons,
both binding:

1. `tailwind.config.js` composes colours as `rgb(var(--color-x) / <alpha-value>)`
   so that opacity utilities work. That syntax needs space-separated channels.
2. OKLCH needs WebView 111+. `minSdkVersion` is 24, so older WebViews exist in
   the install base and would get no colour at all.

`design.md` and `utils/themes.js` record the OKLCH source; the CSS carries sRGB.

## Contrast floors

Enforced by `tests/themes.test.js` on every theme, not by eye:

| Pair | Minimum |
|---|---|
| `fg` on `bg` | 4.5:1 |
| `fg-muted` on `bg` | 4.5:1 |
| `fg-muted` on `secondary` | 4.5:1 — the binding one; muted sits on cards more than on canvas |
| `border-strong`, `accent`, `danger`, `success`, `warning`, `info` on `bg` | 3:1 |

**`border` is decorative and is NOT held to 3:1.** It is a hairline. Anything that
bounds an interactive control — inputs, selects, toggles — must use
`border-strong`, which is solved per theme for the 3:1 minimum. Night's `border`
is 1.69:1 on its own canvas; it was being used for form controls, and that was a
real accessibility bug.

## Theme separation

Measured as OKLab ΔE between canvases, floor of 5, asserted in tests.

WCAG contrast ratio is the wrong metric for "do these two surfaces look
different" — it compresses badly at low luminance and every theme here is dark.
Two canvases can sit at 1.1:1 and still be obviously different colours.

Before this system: Terminal was ΔE **0.0** from Night — byte-identical surfaces.
Black was 4.6. Now the closest pair is 5.2 and the furthest is 25.7.

Five dark themes share a narrow lightness band, so the canvas cannot carry the
whole difference. Accent hue, glass tint and border language carry the rest.

## Glass

Per theme, generated from the registry. A navy tint over a true-black canvas
reads as a smear rather than as depth, which is why these are not global.

Three planes, unchanged:

- **Canvas** — opaque, never blurred.
- **Shelf glass** — one low-blur plane per visible row (`--glass-shelf-*`).
- **Floating glass** — player, drawer, Peek, modals (`--glass-float-*`).
- **Book artwork** — never receives glass.

Saturation moves with the theme: Graphite 110% (restrained), Night 125%,
Ember 128%, Terminal 135% (phosphor bloom).

## Motion

Unchanged by this work. Durations, easings and the reduced-motion contract live
in `assets/motion.css`. Transform and opacity only; blur and backdrop-filter are
never animated.

## Adding a theme

1. Add it to `THEMES` in `utils/themes.js`.
2. Run `node scripts/generate-theme-css.js`.
3. Add its label to `strings/en-us.json` under the `stringKey` you named.
4. Run `node --test tests/themes.test.js`.

Nothing else. The settings picker, the status bar colour and the CSS all derive
from the registry. Before it existed this took four hand-edits with nothing
checking they agreed, which is how Terminal ended up a copy of Night.

## What must not be reintroduced

- Literal palette classes — `bg-black`, `text-white`, `text-gray-400`,
  `bg-yellow-400`. Use tokens. Scrims and overlays that sit over **artwork** are
  the exception and may stay black.
- Hex literals in component styles. Use `rgb(var(--color-x))`.
- `var()` inside SVG presentation attributes — support is unreliable. Put a class
  on the element and set the property from a stylesheet.
- Ebook readers (`components/readers/`) are deliberately outside this system.
  They render book pages that are meant to look like paper and carry their own
  light/dark ereader themes.

## Known open item

The player and progress gradients run three stops
(`success → info → accent`). Hallmark bans three-colour gradients and treats
green-to-cyan-to-purple as a recognised tell. They are now theme-aware, so they
recolour correctly, but the stop count has not been reduced — that is a visual
decision, not a token one.
