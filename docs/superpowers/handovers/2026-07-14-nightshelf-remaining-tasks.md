# Nightshelf — Remaining Tasks

**Date:** 2026-07-14  
**Status:** Open work after UI revamp pass + device feedback  
**Specs:** `docs/superpowers/specs/2026-07-14-nightshelf-ui-revamp-design.md`, `docs/superpowers/specs/2026-07-14-nightshelf-design.md`

## Done enough (do not re-litigate)

- [x] Theme tokens + theme switcher (`night` / `terminal` / `black`)
- [x] Prompt-form connect / login (user confirmed looks good)
- [x] Terminal app bar structure (wordmark + mono status) — still needs polish
- [x] Side drawer Terminal layout (accent rail) — verify after reinstall
- [x] English-only i18n, Android `applicationId`, auth/HQ covers from earlier cycle
- [x] Debug mipmaps fixed (was upside-down ABS overriding main)
- [x] Search model B skeleton (suggestions + chips + list)
- [x] Library `libraryViewMode` rails/grid wiring
- [x] Phosphor bottom nav (partial)

---

## P0 — Blocking “still looks like ABS” (user-flagged)

### Brand / chrome

- [ ] **P0.1** Ship fixed in-app `Logo.png` (star preserved; edge-only knockout). Current appbar shows “dots only” on device until rebuild/install lands.
- [ ] **P0.2** Commit + rebuild/install uncommitted rail chrome work (`LazyBookCard` terminal borders + bracket progress; `Shelf` sizing; Appbar unequal menu bars; `logoImage` edge-aware).
- [ ] **P0.3** Terminal menu icon must not read as stock Material hamburger (unequal bars already drafted — verify on Pixel after install).
- [ ] **P0.4** Drawer open state screenshot QA: brand block, accent rail, Phosphor items, StatusDot on disconnect.

### Cover rails (Home + Library)

- [ ] **P0.5** Rails must look Netflix/Terminal, not ABS shelves: larger covers, mono section labels, “See all”, tight light borders, distinctive bottom progress (`[████] 42` style) — finish CSS if incomplete, install, screenshot.
- [ ] **P0.6** Wire “See all” on rails to dense grid / filtered library view (currently decorative).
- [ ] **P0.7** Library toolbar “0 BOOKS” bug while rails show items — fix entity count for rails mode.
- [ ] **P0.8** Device QA script: Home rails → Library rails → grid toggle → genre chips → filter sheet; capture screenshots.

### Fullscreen / mini player (explicitly under-delivered)

Revamp spec said “no full HUD rewrite”; user feedback rejects that — player still ABS with icon/color tint only.

- [ ] **P0.9** Spec amendment: Terminal player chrome is **in scope** (not just synthwave tint).
- [ ] **P0.10** Fullscreen player redesign: Terminal header (mono playback mode line, PhIcon collapse/cast/more), cover with light border, title/author hierarchy, bracketed/synthwave scrubber as primary control language.
- [ ] **P0.11** Replace remaining Material Symbols in `AudioPlayer.vue` (arrow, cast, more, bookmark, chapter list, jump icons) with Phosphor / Terminal controls.
- [ ] **P0.12** Mini player bar: Terminal strip (border, mono time, synthwave mini track, Ph play/pause) — not ABS gradient bar with stock icons.
- [ ] **P0.13** Player screenshot QA on Pixel while playing (user’s current pain screen).

---

## P1 — Spec gaps / quality-review leftovers

### Chrome & status

- [ ] **P1.1** App bar active filter status (`FILTER · SF`) when Library filters applied.
- [ ] **P1.2** Theme label live-updates when switching themes (MutationObserver drafted — verify).
- [ ] **P1.3** Connection StatusDot language everywhere offline (drawer brand row, empty states, downloads).
- [ ] **P1.4** Expand Phosphor map; remove Material fallbacks on all touched primary surfaces (toolbars, modals opened from Library/Home, player menus). **2026-07-14:** Added player/chrome keys: `bookmark`, `bookmark_filled`, `keyboard_arrow_down`, `format_list_bulleted`, `replay`, `forward_media`, `error`, `autorenew`, `lock`, `lock_open`, `history`, `check_box`, `check_box_outline_blank`, `moon`.

### Home / Library / Search

- [ ] **P1.5** Home empty + connected empty states use Terminal copy/chrome consistently.
- [ ] **P1.6** Genre chip strip: loading when `filterData` empty; active chip sync with filter modal.
- [ ] **P1.7** Search idle suggestions reliability (personalized API failures, offline).
- [ ] **P1.8** Search result rows: Terminal borders / mono meta (match rail language).
- [ ] **P1.9** Remove dead continue-hero leftovers if any remain; clean bookshelf index.

### Settings / system

- [ ] **P1.10** Settings already grouped — pass for Terminal accents / Phosphor info icons.
- [ ] **P1.11** Widget + splash already themed — visual QA on Pixel home screen / cold start.
- [ ] **P1.12** Year-in-review / stats “audiobookshelf” watermarks → Nightshelf if in brand scope.

---

## P2 — Build / release hygiene

- [ ] **P2.1** Commit remaining dirty tree (`Appbar`, `Shelf`, `LazyBookCard`, `Logo.png`, `logoImage.js`, favicons) as coherent feat commits.
- [ ] **P2.2** Push `master` (7+ commits ahead) when user requests.
- [ ] **P2.3** Pixel install recipe — see [Pixel 8 Pro install](#pixel-8-pro-install) below.
- [x] **P2.4** Document debug vs main mipmap trap — see [Debug mipmap override trap](#debug-mipmap-override-trap).
- [x] **P2.5** Sync script + README: `./scripts/sync-debug-mipmaps.sh` copies `main/res/mipmap-*` → `debug/res/mipmap-*` (verified identical 2026-07-14).
- [ ] **P2.6** Do not commit `.agents/` / `skills-lock.json` unless desired.

### Pixel 8 Pro install

Clean reinstall avoids stale WebView cache and wrong launcher icons (`39271FDJG0071M`):

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
./node_modules/.bin/nuxt generate
npx cap sync android
cd android && ./gradlew :app:assembleDebug
adb -s 39271FDJG0071M shell pm clear com.nightshelf.app.debug
adb -s 39271FDJG0071M uninstall com.nightshelf.app.debug
adb -s 39271FDJG0071M install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Debug mipmap override trap

Android **merges** `android/app/src/debug/res/` over `android/app/src/main/res/` for debug builds. Any matching path in debug wins — including `mipmap-*` launcher icons.

**Symptom:** Main icons updated to NightShelf but device still shows old ABS / upside-down art after rebuild.

**Cause:** Stale files under `src/debug/res/mipmap-*` silently override main.

**Fix:** After changing main launcher art, run `./scripts/sync-debug-mipmaps.sh` (or delete debug `mipmap-*` dirs if you want main-only). See `android/app/src/debug/res/README.md`.

---

## P3 — Follow-ups / later cycle

- [x] **P3.1** Download progress indicator — restored to app bar (`widgets-download-progress-indicator` in `Appbar.vue`; removed in `abdb13d1`). Circle progress uses Terminal `success` stroke + mono count.
- [ ] **P3.2** Expand Phosphor across item detail, chapter modal, sleep timer, bookmarks.
- [ ] **P3.3** Kotlin package rename `com.audiobookshelf.app` → `com.nightshelf.app` (deferred thin rename).
- [ ] **P3.4** OAuth scheme still `audiobookshelf://` (keep unless server-coordinated).
- [ ] **P3.5** iOS out of scope.
- [ ] **P3.6** Landscape billboards / server backdrops still out of scope.

---

## Suggested execution order

1. P0.1–P0.2 ship uncommitted chrome + logo + rail borders/progress → Pixel reinstall + screenshots  
2. P0.9–P0.13 Terminal player (fullscreen + mini) — biggest remaining “ABS” surface  
3. P0.6–P0.8 Library rails polish + See all + count bug  
4. P1 sweep  
5. P2 hygiene / push  

## Device checklist (Pixel 8 Pro)

| Screen | Expect |
|--------|--------|
| Launcher | NightShelf star (not ABS) |
| Connect | Prompt form, focus accents, logo above fields |
| Home | Distinctive bordered rails + terminal progress |
| Library | Rails default; grid toggle; genre chips |
| Search | Suggestions idle; chips + list active |
| Player fullscreen | Terminal chrome, not ABS HUD |
| Mini player | Terminal strip |
| Drawer | Brand + accent rail + Phosphor |
