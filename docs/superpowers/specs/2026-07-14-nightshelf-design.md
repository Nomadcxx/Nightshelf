# Nightshelf Design Spec

**Date:** 2026-07-14  
**Repo:** fork of [audiobookshelf-app](https://github.com/Nomadcxx/audiobookshelf-app)  
**Status:** Approved for implementation planning

## Summary

Nightshelf is an Android-only Audiobookshelf client fork with a distinct night-listening identity: Eldritch-based themes, Phosphor icons, Inter + JetBrains Mono typography, and a selective UI rethink of Home, Player, Bookshelf, and Settings. Terminal aesthetics are flavor (monospace accents, green/cyan emphasis), not a full HUD redesign. Upstream PRs #1909 and #1917 are merged after thin foundations and before the major UI pass.

## Goals

1. Rebrand to **Nightshelf** (`com.nightshelf.app`) as an Android clone
2. Themes: **Night**, **Terminal**, **Black OLED** with switching; drop Light
3. Clean and polish UI; selectively redesign high-traffic surfaces (Bookshelf is the heaviest lift)
4. Replace Material / absicons with **Phosphor**
5. Strip non-English locales and light non-essential cruft
6. Merge upstream [#1917](https://github.com/advplyr/audiobookshelf-app/pull/1917) (HQ notification covers) and [#1909](https://github.com/advplyr/audiobookshelf-app/pull/1909) (auth refresh: logout only on genuine 401)

## Non-goals (this cycle)

- Shipping or maintaining iOS
- Audiobookshelf server changes
- Full information-architecture rewrite of every screen
- Custom OEM notification layouts (system MediaStyle limits)
- Animated home-screen widget progress
- Full-screen ambient effects (CRT scanlines, particles)

## Product identity

| Item | Value |
|------|--------|
| Display name | Nightshelf |
| Application ID | `com.nightshelf.app` |
| Platform | Android only (Capacitor); remove/ignore iOS from active packaging |
| Personality | Late-night library + soft terminal flavor |
| Default theme | Night (Eldritch Cthulhu) |

### Terminal means

**Flavor** — modern dark player with monospace accents and Eldritch green/cyan cues. Same layouts as other themes; not a separate HUD chrome system.

## Theme system (§1 approved)

### Theme keys

Replace upstream `black` / `dark` / `light` with:

| Theme | Eldritch source | Role |
|-------|-----------------|------|
| `night` | Cthulhu (default) | Primary product look |
| `black` | Abyss | OLED / deeper blacks |
| `terminal` | Cthulhu/Abyss bases + green/cyan emphasis + stronger mono | Flavor variant |

Implementation: `document.documentElement.dataset.theme = 'night' | 'terminal' | 'black'`.

### Core tokens (Cthulhu / Night)

| Role | Hex | Eldritch name |
|------|-----|----------------|
| Background | `#212337` | Sunken Depths Grey |
| Surface | `#323449` | Shallow Depths Grey |
| Border / elevated edge | `#454759` | Tidal Surface |
| Muted | `#5b5c66` | Murk Overlay |
| Text | `#ebfafa` | Lighthouse White |
| Accent violet | `#a48cf2` | Lovecraft Purple |
| Action / phosphor green | `#37f499` | Great Old One Green |
| Info cyan | `#04d1f9` | Watery Tomb Blue |
| Warning amber | `#f7c67f` | Dreaming Orange |
| Danger | `#f16c75` | R'lyeh' Red |
| Secondary purple | `#7081d0` | The Old One Purple |

### Black (Abyss) mapping

| Role | Hex |
|------|-----|
| Background | `#171928` |
| Surface | `#252738` |
| Border | `#353746` |
| Muted | `#474852` |
| Text | `#d8e6e6` |
| Green | `#2dcc82` |
| Violet | `#8b75d9` |
| Teal | `#0396b3` |

Source of truth: [eldritch-theme/eldritch](https://github.com/eldritch-theme/eldritch).

### Typography

- **UI / body:** Inter (or equivalent geometric sans)
- **Mono accents:** JetBrains Mono — timestamps, theme labels, terminal cues, compact settings values

### Icons

- **Phosphor** (stroke), replace Material-style and absicons on touched surfaces first, then expand
- Do not keep Material as the design language

## Native surfaces & motion (§2 approved)

### Theme reach

| Surface | Strategy |
|---------|----------|
| In-app WebView UI | Full Eldritch CSS variables + Tailwind |
| StatusBar / navigation bar | Capacitor sync on theme change |
| Splash / launch | Android styles → Eldritch background |
| App icon | Nightshelf adaptive icon |
| Media notification | System MediaStyle; supply HQ bitmap (#1917), title/artist; limited accent tint |
| Lock screen / Bluetooth | Metadata + artwork only |
| Android Auto | Browse tree + playback; system chrome; Eldritch-tinted assets where we ship drawables |
| Home widget | Restyle with Eldritch; **static** progress fill |

### Signature motion: synthwave progress

- **Full player:** low-amplitude animated waveform along/behind the scrubber (green → cyan → violet)
- **Mini player:** compact shimmer strip
- Active only while **playing**; freeze when paused
- Disabled under `prefers-reduced-motion: reduce`

### Animate

- Synthwave progress (signature)
- Theme switch crossfade (~200–300ms)
- Play/pause tap feedback (Phosphor)
- Modal/sheet enter/exit
- One subtle Continue-card reveal on Home
- Download determinate progress (optional soft pulse when active)

### Do not animate

- Bookshelf scroll / cover grids
- Notification / lock screen / Auto chrome
- Widget progress loops
- Settings rows and form micro-interactions
- Full-screen ambient loops
- Anything under reduced motion

### Performance

- CSS transforms/opacity only for waves; no per-frame JS layout thrash
- Pause animations when WebView not visible or playback paused
- At most one signature ambient loop on screen (progress)

## Selective UI rethink (§3 approved)

Same overall IA as Audiobookshelf. Token polish everywhere we touch. Structural redesign focus:

### 1. Home

- Hero **Continue** card
- Clearer hierarchy; less toolbar clutter
- **Nightshelf** as primary chrome brand signal
- One load reveal on Continue card

### 2. Player

- Cover-forward layout
- Synthwave scrubber
- Phosphor transport controls
- Mono time / speed labels
- Sleep / chapters as secondary sheets

### 3. Bookshelf (**heaviest lift**)

- Tighter grid density and cleaner filter/sort chrome
- Eldritch progress indicators on covers
- No scroll-driven animations
- Preserve lazy-loading / virtualization performance

### 4. Settings

- Grouped sections
- Theme switcher first-class: Night / Terminal / Black
- Remove language picker (English only)
- Mono for compact values

### Everywhere else

Connect/login, search, downloads, item detail, modals: Eldritch tokens + Phosphor as touched. No IA rewrite unless blocking the four surfaces above.

## Delivery sequence (§4 approved)

**Approach 1:** Foundations → PRs → design-system wiring → selective rethink → native polish.

| Phase | Work |
|-------|------|
| 1. Foundations (thin) | Rename app/id; Eldritch CSS tokens + theme keys; drop light; StatusBar bridge; English-only strings; Android-only packaging path |
| 2. Upstream PRs | Cherry-pick #1909 (Android + JS auth paths; skip iOS; adopt vitest/CI only if low churn) then #1917 (notification bitmaps) |
| 3. Design system | Phosphor pipeline; Inter + JetBrains Mono; shared primitives (buttons, progress, sheets) |
| 4. Selective rethink | Player (synthwave) → Home → Settings → **Bookshelf** |
| 5. Native polish | Splash, adaptive icon, media widget Eldritch restyle, notification channel/tint where possible |

### Risks

- Package rename touches Kotlin namespaces and related identifiers — isolate in a dedicated foundations commit
- #1909 test/CI additions may be optional if they force large Nuxt 2 toolchain changes; auth fix is mandatory
- Bookshelf redesign must not break lazy card virtualization

## Success criteria

- App installs/runs as **Nightshelf** on Android with `com.nightshelf.app`
- Three themes switch reliably; default Night; no Light theme
- Player synthwave progress reads as a deliberate brand moment while playing
- Home, Player, Bookshelf, Settings feel distinctly Nightshelf, not a recolor of ABS
- Phosphor icons on redesigned surfaces; Material not the visual language
- English-only; language setting removed
- #1909 behavior: credentials retained on transient refresh failures; logout only on 401
- #1917: higher-quality notification/lock-screen artwork
- iOS not part of the shipping path

## Open implementation details (for the plan, not blockers)

- Exact Phosphor packaging approach for Nuxt 2 (SVG sprite vs icon component library)
- Font loading strategy (bundled vs system fallbacks for offline)
- Whether `terminal` stores as its own preference key or a modifier on night/black (recommendation: own key for simplicity)

## Reference decisions log

| Decision | Choice |
|----------|--------|
| Terminal intensity | Flavor (A) |
| Theme set | Night + Terminal + Black OLED (C) |
| Platform | Android only (B) |
| UI depth | Selective rethink (B); Bookshelf heaviest |
| Palette | Eldritch (Cthulhu / Abyss / Terminal flavor) |
| Icons | Phosphor |
| Type | Inter + JetBrains Mono (B) |
| Default theme | Night (A) |
| Strip | English only + light cruft (B) |
| App ID | `com.nightshelf.app` (A) |
| Execution | Approach 1: Foundations → PRs → UI |
