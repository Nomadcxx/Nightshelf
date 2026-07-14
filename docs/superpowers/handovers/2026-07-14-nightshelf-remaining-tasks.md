# Nightshelf — Remaining Tasks

**Date:** 2026-07-14  
**Status:** Implementation pass complete; clean Pixel reinstall done  
**Specs:** `docs/superpowers/specs/2026-07-14-nightshelf-ui-revamp-design.md`, `docs/superpowers/specs/2026-07-14-nightshelf-design.md`  
**Ship commit:** `f0b3d0f3` — `feat(ui): finish Terminal rails, player chrome, and polish pass`

## Done this cycle

### Brand / chrome
- [x] **P0.1** Edge-aware `Logo.png` (star preserved) + rebuild/install
- [x] **P0.2** Rail borders/progress, Shelf, Appbar unequal menu, `logoImage`
- [x] **P0.3** Terminal unequal menu bars verified on Pixel (not Material hamburger)
- [x] **P0.4** Drawer Terminal layout shipped (brand, accent rail, Phosphor, StatusDot) — open once on device to confirm

### Cover rails
- [x] **P0.5** Larger covers, mono labels, See all, light borders, `[████] 62` progress — Pixel screenshot confirmed
- [x] **P0.6** See all → dense grid + `/bookshelf/library`
- [x] **P0.7** Library rails emit `bookshelf-total-entities` — Pixel showed `90 BOOKS`
- [x] **P0.8** Home + Library rails + genre chips screenshoted after clean install

### Player
- [x] **P0.9** Spec amended: Terminal player chrome in scope
- [x] **P0.10** Fullscreen AudioPlayer Terminal redesign
- [x] **P0.11** Phosphor controls in AudioPlayer
- [x] **P0.12** Mini player Terminal strip
- [ ] **P0.13** Fullscreen player screenshot while playing — **please tap a book and expand player once** (WebView automation could not reliably open player)

### P1
- [x] P1.1–P1.10, P1.12 (filter status, theme live-update, StatusDot, Phosphor, empty states, genre chips, search, dead code, settings, year-in-review)
- [x] **P1.11** Splash/cold start observed after reinstall; widget glance on Pixel home optional

### P2
- [x] **P2.1** Committed coherent feat commit
- [ ] **P2.2** Push `master` when you ask
- [x] **P2.3** Clean install recipe below
- [x] **P2.4** Debug mipmap trap documented
- [x] **P2.5** Sync script + README
- [x] **P2.6** Do not commit `.agents/` / `skills-lock.json`

### P3
- [x] **P3.1** Download progress indicator restored (Terminal styled)
- [x] **P3.2** Phosphor on bookmarks + sleep timer modals
- [ ] **P3.3** Kotlin package rename — deferred
- [ ] **P3.4** OAuth scheme `audiobookshelf://` — keep
- [ ] **P3.5** iOS out of scope
- [ ] **P3.6** Landscape billboards out of scope

---

## Pixel 8 Pro install

Clean reinstall (`39271FDJG0071M`):

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

**Done 2026-07-14:** `pm clear` + uninstall + install of `com.nightshelf.app.debug` succeeded.

### Debug mipmap override trap

Android **merges** `android/app/src/debug/res/` over `android/app/src/main/res/` for debug builds. Stale debug `mipmap-*` silently override NightShelf icons.

**Fix:** `./scripts/sync-debug-mipmaps.sh` — see `android/app/src/debug/res/README.md`.

---

## Quick visual checklist for you

1. Open drawer (unequal menu) — brand + accent rail + StatusDot  
2. Library → grid toggle → genre chip → filter sheet  
3. Play any title → expand fullscreen player (Terminal chrome / Ph icons)  
4. Confirm mini player strip when collapsed  

Screenshots from this pass: `/tmp/nightshelf-qa/`
