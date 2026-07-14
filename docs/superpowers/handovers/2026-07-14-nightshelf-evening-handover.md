# Handover: Nightshelf UI revamp session (2026-07-14 evening)

**Purpose:** Hand off everything done in this Cursor session so the next agent (or human) can continue turning Nightshelf from “ABS with a dark paint job” into a coherent Terminal product — without re-litigating locked decisions or rediscovering traps.

**Repo:** `/home/nomadx/audiobookshelf-app`  
**Remote:** `https://github.com/Nomadcxx/audiobookshelf-app`  
**Branch:** `master`  
**Transcript:** `8059649e-1f95-4dc0-b880-813f59ce1bab`  
**Device:** Pixel 8 Pro `39271FDJG0071M` (product `husky`) · package `com.nightshelf.app.debug`

**Companion docs:**
- Design (revamp): `docs/superpowers/specs/2026-07-14-nightshelf-ui-revamp-design.md`
- Plan: `docs/superpowers/plans/2026-07-14-nightshelf-ui-revamp-implementation.md`
- Earlier session: `docs/superpowers/handovers/2026-07-14-nightshelf-session-handover.md`
- Checklist (partially superseded by this doc): `docs/superpowers/handovers/2026-07-14-nightshelf-remaining-tasks.md`

---

## 1. Product north star (do not weaken)

Nightshelf is a **forked Audiobookshelf Android client** with Eldritch Terminal identity — not a reskin.

| Decision | Locked value |
|----------|----------------|
| Name / IDs | Nightshelf · `com.nightshelf.app` / `.debug` |
| Kotlin package | Still `com.audiobookshelf.app` (defer rename) |
| Themes | `night` (default) / `terminal` / `black` — **no light** |
| Chrome | Terminal (mono status, Phosphor, StatusDot, unequal menu bars) |
| Connect | Prompt form (logo above fields, left accent focus) — user confirmed good |
| Bookshelf | Cover **rails** (Netflix language), not ABS shelf rows |
| Library | Rails default + dense-grid toggle; Hybrid genre chips + filter sheet |
| Search | Model B — suggestion carousels + type chips + list (**no** landscape billboard / no server backdrops) |
| Player | **Terminal chrome is in scope** (spec amended this session; icons-only was rejected by user) |
| Icons | Phosphor via `PhIcon` / `IconBtn`; Material only as last-resort fallback |
| Type | Inter UI + JetBrains Mono status/labels |
| i18n | English-only |
| OAuth scheme | Keep `audiobookshelf://` |

**Bar for “done”:** A cold look at Home / Library / Search / Player / Drawer should not read as stock ABS with purple tint. If it still does, that surface is unfinished.

---

## 2. What this session accomplished

### 2.1 Commits landed (approx. range on `master`)

| Commit | Summary |
|--------|---------|
| `45d9b9a2` / `75a56769` | Revamp design spec + implementation plan |
| `b873330c` | Transparent brighter logo attempt |
| `3b8255a5` | Terminal chrome, Prompt connect, cover rails, search chips |
| `5f998d4d` | Restore continue rails; wire library rails/grid |
| `4a239768` | Fix debug mipmaps overriding main (upside-down ABS icons) |
| `7b399b49` | Phosphor bottom nav |
| `f0b3d0f3` | **Main finish pass:** rails polish, player Terminal redesign, logo/filter/search/settings, Phosphor expansion |
| `ffe4b60e` | Remaining-tasks doc + sleep-timer Phosphor |
| *(this push)* | Left menu + left drawer; logo rebuilt from preview; this handover |

### 2.2 Surfaces changed (by area)

#### App chrome
- **`Appbar.vue`:** Wordmark `Night`+`shelf`, mono status (`HOME · NIGHT`, `LIBRARY · NIGHT · FILTER · SF`, …), StatusDot via connection indicator, Phosphor search, **Terminal unequal menu bars**.
- **Menu position (latest):** Menu stack moved to the **left** of the logo (before brand). Right cluster is downloads / StatusDot / search only.
- **`SideDrawer.vue`:** Brand block, Phosphor nav, left accent rail on active items, StatusDot offline language. **Opens from the left** (`left-0`, `-translate-x-72` when closed, `border-r`). Swipe-left dismisses.
- **`utils/appbarStatus.js`:** Route + theme labels; filter short-codes on Library.
- **Download progress:** Restored to app bar (`widgets-download-progress-indicator`); Terminal-styled `CircleProgress`.

#### Connect
- Prompt-form connect already approved earlier; left alone this pass except shared chrome/logo.

#### Home / Library rails
- **`Shelf.vue`:** Larger cover rails, mono section labels, **See all** button → sets `libraryViewMode=grid` and routes to `/bookshelf/library`.
- **`LazyBookCard.vue`:** `.rail-item` light border; bottom progress as `[████] 62` (brackets + synthwave fill + mono %).
- **`pages/bookshelf/library.vue`:** Rails mode fetches personalized shelves; emits `bookshelf-total-entities` (fixes **0 BOOKS**); genre filter heuristic; Terminal empty state.
- **`BookshelfToolbar.vue` / `LibraryGenreChips.vue`:** Rails/grid toggle; chips with loading + store sync.
- **`pages/bookshelf/index.vue`:** Dead continue-hero leftovers removed; Terminal empty copy.

#### Search
- **`pages/search.vue`:** Safer idle suggestions (try/catch, offline/empty); reload on library change.
- Search cards: Terminal borders / mono meta.

#### Player (critical — was under-delivered)
- Spec non-goal **amended**: fullscreen + mini player Terminal chrome **in scope**.
- **`AudioPlayer.vue`:** PhIcon collapse/cast/more/bookmark/chapters/jump/sleep; mono playback-mode line; cover light border; bracketed time + synthwave scrubber; square play control; mini strip with top border (no ABS gradient bar).
- **`phosphor-map.js`:** Expanded (~57+ keys) including player/bookmark/sleep ligatures (`bookmark`, `moon`, `replay`, `forward_media`, …).

#### Brand / Android traps
- **`static/Logo.png`:** Rebuilt from `static/branding/nightshelf-icon-preview.png` — **navy plate + white star + lavender accents** in a circular mask. Prior “edge-knockout only” path produced a near-white blob on dark chrome (user-reported).
- **Debug mipmap trap:** Documented + `scripts/sync-debug-mipmaps.sh` + `android/app/src/debug/res/README.md`. Debug `res/` **overrides** main; stale ABS icons there win silently.

#### Settings / stats
- Settings info icons → Phosphor.
- Year-in-review watermarks / share names → Nightshelf.

#### Docs / tests
- Spec acceptance criterion #9 for Terminal player.
- Tests: `tests/appbarStatus.test.js`, `tests/logoImage.test.js` (`node --test`).

### 2.3 Device actions this session

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
./node_modules/.bin/nuxt generate          # NOT npx nuxt
npx cap sync android
cd android && ./gradlew :app:assembleDebug
adb -s 39271FDJG0071M shell pm clear com.nightshelf.app.debug
adb -s 39271FDJG0071M uninstall com.nightshelf.app.debug
adb -s 39271FDJG0071M install -r android/app/build/outputs/apk/debug/app-debug.apk
```

User confirmed after clean install: drawer QA and **audiobook playing**. Remaining note: in-app logo was still wrong until the preview-based rebuild in this handoff commit.

Screenshots from automation: `/tmp/nightshelf-qa/` (may be ephemeral).

---

## 3. What still looks like ABS / needs polish

Treat this as the **priority backlog** for the next session. Goal: stop reading as a poorly designed ABS reskin.

### P0 — Brand & structure (user-facing pain)

1. **In-app logo QA after latest rebuild** — Confirm navy+star mark in appbar + drawer + connect (not white blob). Launcher mipmaps are separate; keep in sync if they drift.
2. **Left menu + left drawer smoke test** — Menu left of logo; drawer slides from left; swipe-left closes; no right-edge remnant.
3. **Player still needs visual hardening while playing** — Structure is Terminal, but hierarchy/spacing/cover size/control rhythm may still feel ABS-derived. Compare fullscreen to a true Terminal HUD: denser mono meta, less Material dialog chrome in menus (`modals-dialog` icons still Material-oriented).
4. **Rail borders still subtle** — User asked for *tight terminal light borders*; current `rgb(fg/0.28)` may vanish on dark covers. Consider stronger `border-fg/40` or 1px `success` hairline on hover/focus.
5. **Library “See all” semantics** — Currently jumps to **full library grid**, not “this shelf’s filter.” Prefer per-shelf filter/query when API allows.

### P1 — Product language gaps

6. **App bar density** — With menu on the left, brand + status can feel crowded on narrow widths; test truncation.
7. **Genre chips + filter sheet** — Functional but still chip/Material-adjacent; Terminalize selected state (left accent, mono, less pill).
8. **Search** — Idle suggestions depend on personalized API; empty/offline states OK but not distinctive. Result rows improved; not yet “Terminal list.”
9. **Item detail / chapters / bookmarks sheets** — Partial Phosphor (bookmarks/sleep done); detail page and chapter modal still largely ABS layout.
10. **Bottom nav** — Phosphor icons shipped; overall ABS tab strip geometry remains. Optional: Terminal underline-only / mono labels only when active (already partly there).
11. **Settings** — Grouping exists; still long ABS settings dump. Accent pass incomplete.
12. **Widgets / notification / cast UI** — Outside web shell; still stock Android/ABS where native.

### P2 — Engineering hygiene

13. **Do not commit** `.agents/` or `skills-lock.json` unless explicitly desired.
14. **Always** `./node_modules/.bin/nuxt generate` (local Nuxt 2). `npx nuxt` may pull Nuxt 4 and break the build.
15. **JDK 21** required for Capacitor Android (`JAVA_HOME=/usr/lib/jvm/java-21-openjdk`).
16. After launcher art changes: `./scripts/sync-debug-mipmaps.sh`.
17. Kotlin package rename + OAuth scheme change = later / coordinated.
18. iOS out of scope.

### P3 — Design debt (reskin → product)

These are what keep the app feeling like a reskin even when tokens are correct:

| Smell | Why it still feels like ABS | Direction |
|-------|-----------------------------|-----------|
| Cover-average-color player backdrop | Classic ABS fullscreen | Prefer theme `bg` + Terminal frame; cover as bordered object only |
| Rounded Material dialogs / sheets | Stock modal language | Square-ish Terminal panels, mono titles, accent rail |
| Progress as thin Material bars | Everywhere outside rails/player | Bracket / block glyph language consistently |
| Dense settings lists | ABS admin heritage | Section terminals: `PLAYBACK`, `SYNC`, `DISPLAY` with mono headers |
| Empty states as centered paragraphs | Generic | Prompt-style: `STATUS · OFFLINE` + single CTA |
| Mixed icon weights | Phosphor + leftover Material | Zero Material on any primary surface touched this cycle |

---

## 4. Key files map (next agent)

| Concern | Paths |
|---------|--------|
| App bar / menu | `components/app/Appbar.vue`, `utils/appbarStatus.js` |
| Drawer | `components/app/SideDrawer.vue` |
| Player | `components/app/AudioPlayer.vue`, `components/ui/SynthwaveProgress.vue` |
| Rails | `components/bookshelf/Shelf.vue`, `components/cards/LazyBookCard.vue` |
| Library mode | `pages/bookshelf/library.vue`, `store/globals.js`, `plugins/localStore.js` |
| Genre chips | `components/home/LibraryGenreChips.vue`, `components/home/BookshelfToolbar.vue` |
| Search | `pages/search.vue`, `components/cards/*SearchCard.vue` |
| Icons | `assets/icons/phosphor-map.js`, `components/ui/PhIcon.vue`, `IconBtn.vue` |
| Logo | `static/Logo.png`, `static/branding/nightshelf-icon-preview.png`, `utils/logoImage.js` |
| Themes | `assets/tailwind.css`, `plugins/init.client.js` |
| Android icons | `android/app/src/main/res/mipmap-*`, `android/app/src/debug/res/` |

---

## 5. Suggested next session order

1. Rebuild + clean install after left-menu/logo commit; screenshot appbar + open drawer + playing fullscreen player.  
2. Harden player HUD (kill ABS color-wash dominance; Terminal panel for controls).  
3. Strengthen rail borders; wire See all per-shelf if feasible.  
4. Phosphor + Terminal panels for item detail + chapters.  
5. Strip remaining Material from primary toolbars/modals.  
6. Only then: Kotlin rename / deeper native chrome.

---

## 6. Explicit non-goals (still)

- ABS **server** landscape backdrops / Netflix billboard assets  
- Stretching portrait covers to 16:9 heroes  
- iOS  
- Custom OEM notification layouts  
- Changing OAuth scheme without server coordination  

---

## 7. User feedback captured this session

- Connect Prompt form: **looks good** (keep).  
- Player was **not** acceptable as icons/synthwave tint only → full Terminal redesign required.  
- Rails needed distinct borders + bracket progress (not ABS shelves).  
- In-app logo became **white blob** after aggressive knockout → fixed by compositing from preview (navy plate + star).  
- Menu should live on the **left**; sidebar opens **left** (not right).  
- After clean install: drawer + playing audiobook confirmed; improvements visible; logo still called out until this fix.

---

*End of handover. Prefer this document over the older remaining-tasks checklist when starting the next agent.*
