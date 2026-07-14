# Nightshelf UI Revamp Design Spec

**Date:** 2026-07-14  
**Status:** Approved for implementation planning  
**Repo:** `/home/nomadx/audiobookshelf-app`  
**Supersedes (for UI chrome):** shallow “selective rethink” in `2026-07-14-nightshelf-design.md` where it conflicts — theme tokens, identity, and non-goals from that doc still apply.

## Summary

Replace the current Audiobookshelf-shaped shell (Material icons, stock app bar/drawer, flat connect forms, poster-grid bookshelf with a paint job) with a **coherent Nightshelf UI**: Terminal chrome, Prompt-form auth, Cover-rail discovery, Netflix-inspired Search (without landscape billboards), and Hybrid library filters. This is a **revamp**, not a reskin.

## Problem statement (user-flagged)

The following defects were observed on device and **must** be fixed in this pass — not deferred as polish:

| Flag | Required outcome |
|------|------------------|
| Top bar icons still default Material | Phosphor (stroke) on app bar actions |
| Entire top bar still ABS layout | Rebuild as **Terminal chrome** |
| Logo has white edges | True transparency (knock out near-white matte) |
| Logo too dark on night background | Lighten / re-export mark for `#212337` night bg |
| “No library server connected” uses stock icon | Flat **red status dot** + mono copy |
| Hamburger + side drawer unchanged | Phosphor menu + Terminal drawer (accent rail) |
| Connect: logo parked at top of page | Logo **centered just above** server address field |
| Connect / login inputs: no focus affordance | Left accent bar + glow on focused fields |
| Logged-in UI still stock ABS | Home/Library/Search chrome and content language match this spec |
| Bookshelf barely changed | **Cover rails** + grid toggle + hybrid filters — not a background tint |

## Goals

1. One visual system across App bar, Drawer, Connect, Home, Library, Search, empty/offline states  
2. Cover-rail browsing with a dense-grid hunt mode  
3. Search with suggestion carousels + type chips + list results  
4. Hybrid genre chips + filter sheet on Library  
5. Ship as **one coherent pass** (Scope A)  
6. Keep Eldritch theme tokens / theme switcher; no light theme  

## Non-goals

- ABS **server** changes (no landscape backdrops / Netflix billboard assets)  
- Stretching portrait covers into 16:9 heroes  
- iOS  
- ~~Full player HUD rewrite~~ **AMENDED:** Terminal player chrome is in scope (fullscreen + mini); retain synthwave progress as the primary scrubber language
- Custom OEM notification layouts  

## Locked product decisions

| Area | Choice |
|------|--------|
| App chrome | **Terminal chrome** |
| Connect / login | **Prompt form** |
| Bookshelf language | **Cover rails** |
| Library browse | Rails default + **dense-grid toggle** |
| Library filters | **Hybrid** — genre chip strip + full filter sheet |
| Search / discovery | **B** — suggestion carousel + type chips + vertical results |
| Billboard | **Rejected** (no backend backdrops; B instead of C/C+) |
| Implementation scope | **A** — full shell in one cycle |

---

## 1. Terminal chrome (App bar + Drawer)

### App bar

- Left: Nightshelf mark (fixed logo) + wordmark `Night` + accent `shelf`  
- Under wordmark: mono status line, e.g. `HOME · NIGHT` / `LIBRARY · MAIN` / `SEARCH` (JetBrains Mono, success/accent green)  
- Right cluster:  
  - Connection **flat dot** (green online / red offline) — not Material `cloud_off`  
  - Phosphor **search**  
  - Phosphor **list / menu** (not Material `menu`)  
- Library switcher (when connected): restyle to Terminal chip; no stock ABS button look  
- Structure is redesigned (hierarchy, spacing, mono status) — not a color swap on the old bar  

### Side drawer

- Brand block at top (mark + Nightshelf)  
- Nav items with Phosphor icons  
- Active item: **left accent rail** (violet or green per theme) + elevated surface  
- Offline/connection status: same flat red/green dot language  
- Remove Material filled icon language from drawer items  

### Icons

- Phosphor stroke on all chrome, search, empty/offline, drawer, and primary toolbars touched in this pass  
- Material Symbols allowed only as temporary fallback inside untouched deep screens (item detail menus, etc.) — track and shrink  

---

## 2. Prompt-form connect / login

### Layout

- Vertical stack centered in the viewport  
- Logo + wordmark sit **immediately above** the first field (server address), not pinned to the top safe-area as a distant header  
- Mono eyebrow: `CONNECT TO LIBRARY` / `AUTH` as appropriate  
- Short-screen: compress spacing; keep logo↔field proximity  

### Focus

- Idle field: muted border / left bar in `border` token  
- Focused field: **left accent bar** in phosphor green (`#37f499` night) + soft glow ring  
- Same treatment for username and password steps  

### Empty / offline

- Flat red dot + mono line (e.g. `server: offline` / string equivalent)  
- No Material warning/cloud icons as the primary status glyph  

### Logo asset

- Rebuild `static/Logo.png` (and favicon derivatives) with **transparent** background (current corners are opaque near-white)  
- Increase luminance / edge contrast so the mark reads on `#212337` / `#323449`  
- Adaptive Android icons already shipped may need a matching foreground pass if white fringe appears there too  

---

## 3. Cover rails (Home + Library)

### Rail anatomy

- Mono section label (uppercase, tracked), e.g. `CONTINUE LISTENING`, `RECENTLY ADDED`, genre name  
- Horizontal scrolling row of **portrait covers** (existing aspect ratio from library settings)  
- Optional progress strip on cover edge (synthwave / gradient) for in-progress items  
- “See all” → opens dense grid for that section  

### Home

- Stack of rails (Continue, Recent, Discover-from-library shelves as data allows)  
- No landscape billboard hero  

### Library

- **Default:** rails grouped by category/series/system shelves (aligned with available ABS shelf APIs — client composition only)  
- **Toggle:** dense cover grid for hunting  
- Persist toggle preference in local store  

---

## 4. Library filters (Hybrid)

1. **Genre chip strip** under Library chrome — selecting a chip narrows which rails (or grid contents) are shown  
2. **Filters** control opens a sheet: author, series, progress, media type, sort — power-user path  
3. Active filters reflected as mono chips / status in the Library header (`FILTER · SF`)  
4. Clearing chips returns to full rail set  

Implementation note: map chips to existing library filter/collapse APIs and client-side shelf partitions; do not invent server endpoints.

---

## 5. Search (model B)

### Idle

- Suggestion **cover carousels** (e.g. continue, recent searches, “from your library” heuristics using existing local/server data)  
- Terminal search field (same left-accent focus as Prompt form)  

### Active query

- Type chips: All / Books / Podcasts / Series / Authors (as data supports)  
- Vertical result rows: cover thumb + title + mono meta  
- No idle Netflix billboard; no stretched covers  

---

## 6. Visual system reminders

| Token role | Night (default) |
|------------|-----------------|
| Background | `#212337` |
| Surface | `#323449` |
| Border | `#454759` |
| Text | `#ebfafa` |
| Accent violet | `#a48cf2` |
| Phosphor green | `#37f499` |
| Danger / offline | `#f16c75` |

- Type: Inter UI + JetBrains Mono for status, labels, filter chips, offline lines  
- Motion: keep reduced-motion respect; rail scroll is native; avoid noisy chrome animation  

---

## 7. Acceptance criteria

1. Cold start / disconnect: red flat dot status; Prompt-form connect; logo above address; focus visible on fields  
2. App bar and drawer no longer recognizable as stock ABS Material chrome  
3. Logo has no white square/fringe on night backgrounds  
4. Home shows cover rails with mono labels  
5. Library: rails default, grid toggle works, genre chips + filter sheet both work  
6. Search idle shows suggestion rails; query shows chips + list  
7. Theme switcher still works (`night` / `terminal` / `black`)  
8. No new server dependencies; covers remain portrait  
9. Fullscreen + mini player use Terminal chrome (PhIcon controls, mono mode line, light cover border, bracketed scrubber times) — not stock ABS Material player 

---

## 8. Implementation notes for planners

- Primary touch files (expected): `components/app/Appbar.vue`, `SideDrawer.vue`, `pages/connect.vue`, `components/connection/ServerConnectForm.vue`, `pages/index.vue`, bookshelf/home shelf components, `pages/search.vue` (or equivalent), `components/ui/PhIcon.vue` / `IconBtn.vue`, `static/Logo.png`, input components used by connect  
- Rebuild web → `cap sync` → debug APK with **JDK 21**; install via `adb` for verification  
- Prior shallow UI commits are incomplete relative to this spec — treat this doc as the source of truth for the revamp  

## Related docs

- Identity / themes: `docs/superpowers/specs/2026-07-14-nightshelf-design.md`  
- Prior plan: `docs/superpowers/plans/2026-07-14-nightshelf-implementation.md`  
- Session handover: `docs/superpowers/handovers/2026-07-14-nightshelf-session-handover.md`  
