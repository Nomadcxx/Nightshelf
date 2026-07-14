# Nightshelf UI Revamp Implementation Plan

> **For agentic workers:** Execute **inline** in this session. Use **modified TDD**: write failing `node:test` helpers first where logic is pure; Vue markup follows. **Spec-check each task** against `docs/superpowers/specs/2026-07-14-nightshelf-ui-revamp-design.md`. **Do not** run per-task quality/code-review subagents. After **all** tasks complete, run **one** large quality review.

**Goal:** Replace ABS-shaped chrome and browsing with Terminal chrome, Prompt-form auth, Cover rails + hybrid library filters, and Search model B — fixing all user-flagged defects in one coherent pass.

**Architecture:** Extract small pure helpers (`utils/`) covered by `node:test`. Rebuild shell components (`Appbar`, `SideDrawer`, connection indicator, connect page, `TextInput` focus mode). Restyle home `Shelf` into cover rails; add library view-mode + genre chips on existing filter/sort modals. Rework `pages/search.vue` idle suggestions + type chips. No server changes.

**Tech Stack:** Nuxt 2 / Vue 2, Tailwind 3, Phosphor (`PhIcon` + `phosphor-map`), Capacitor Preferences via `localStore`, `node:test` for helpers.

**Spec:** `docs/superpowers/specs/2026-07-14-nightshelf-ui-revamp-design.md`

**Process overrides (this plan only):**
- No quality review between tasks
- Spec acceptance checklist at end of each task (self)
- One large quality review after Task 7 build

---

## File map

| Unit | Path | Responsibility |
|------|------|----------------|
| Logo pixel helpers | `utils/logoImage.js` | Knock out near-white → alpha; luminance boost |
| Connection tone | `utils/connectionStatus.js` | Map connection state → `online` / `degraded` / `offline` / `syncing` |
| App bar status label | `utils/appbarStatus.js` | Route + theme → mono status string |
| Library view mode | `utils/libraryViewMode.js` + `localStore` | `rails` \| `grid` persistence helpers |
| Search chip filter | `utils/searchChips.js` | Which result groups visible for chip |
| StatusDot | `components/ui/StatusDot.vue` | Flat green/red/amber/muted dot |
| CoverRail | restyle `components/bookshelf/Shelf.vue` | Mono label + horizontal covers (no wood placard when rail mode) |
| Genre chips | `components/home/LibraryGenreChips.vue` | Chip strip → filter query |
| Prompt input | `components/ui/TextInput.vue` | `variant="prompt"` left accent + focus glow |
| Chrome | `Appbar.vue`, `SideDrawer.vue`, `ConnectionIndicator.vue` | Terminal shell |
| Connect | `pages/connect.vue`, `ServerConnectForm.vue` | Prompt-form layout |
| Home empty | `pages/bookshelf/index.vue` | Red StatusDot; cover-rail shelves; drop Material cloud |
| Library toolbar | `BookshelfToolbar.vue` | Rails/grid toggle + chips row |
| Search | `pages/search.vue` | Suggestions + chips + list |
| Icons | `assets/icons/phosphor-map.js` | menu, home, person, etc. |
| Assets | `static/Logo.png`, favicons | Transparent + brighter |

---

### Task 1: Logo helpers + regenerate

**Files:**
- Create: `utils/logoImage.js`
- Create: `tests/logoImage.test.js`
- Modify: `static/Logo.png` (and favicon if needed) via script using the helper

- [ ] **Step 1: Write failing tests**

```js
// tests/logoImage.test.js
const test = require('node:test')
const assert = require('node:assert/strict')
const { shouldKnockOutPixel, boostLuminance } = require('../utils/logoImage')

test('knocks out near-white opaque pixels', () => {
  assert.equal(shouldKnockOutPixel({ r: 253, g: 253, b: 254, a: 255 }, 245), true)
  assert.equal(shouldKnockOutPixel({ r: 40, g: 40, b: 80, a: 255 }, 245), false)
})

test('boostLuminance raises dark midtones without clipping white', () => {
  const out = boostLuminance({ r: 30, g: 40, b: 60, a: 255 }, 1.35)
  assert.ok(out.r > 30 && out.g > 40 && out.b > 60)
  assert.equal(boostLuminance({ r: 250, g: 250, b: 250, a: 255 }, 1.35).r, 255)
})
```

- [ ] **Step 2: Run tests — expect FAIL** (`Cannot find module`)

```bash
node --test tests/logoImage.test.js
```

- [ ] **Step 3: Implement `utils/logoImage.js`** (CommonJS for node:test)

```js
function shouldKnockOutPixel({ r, g, b, a }, threshold = 245) {
  if (a === 0) return true
  return r >= threshold && g >= threshold && b >= threshold
}

function boostLuminance({ r, g, b, a }, factor = 1.35) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
  return { r: clamp(r * factor), g: clamp(g * factor), b: clamp(b * factor), a }
}

function processRgbaBuffer(data, { threshold = 245, boost = 1.35 } = {}) {
  for (let i = 0; i < data.length; i += 4) {
    const px = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
    if (shouldKnockOutPixel(px, threshold)) {
      data[i + 3] = 0
      continue
    }
    const out = boostLuminance(px, boost)
    data[i] = out.r
    data[i + 1] = out.g
    data[i + 2] = out.b
  }
  return data
}

module.exports = { shouldKnockOutPixel, boostLuminance, processRgbaBuffer }
```

- [ ] **Step 4: Run tests — expect PASS**

- [ ] **Step 5: Process logo assets** with a one-shot node script using `sharp` if available, else `pngjs`/`jimp`, else Pillow via python calling the same thresholds. Write `static/Logo.png` + `static/favicon-64.png` + `static/favicon.ico`.

- [ ] **Step 6: Spec-check** — logo no white fringe; brighter on `#212337`. Commit.

```bash
git add utils/logoImage.js tests/logoImage.test.js static/Logo.png static/favicon.ico static/favicon-64.png
git commit -m "feat(brand): transparent brighter Nightshelf logo"
```

---

### Task 2: Connection status helper + StatusDot + indicator

**Files:**
- Create: `utils/connectionStatus.js`, `tests/connectionStatus.test.js`, `components/ui/StatusDot.vue`
- Modify: `components/widgets/ConnectionIndicator.vue`

- [ ] **Step 1: Failing tests** for `toneFromState({ attempting, networkConnected, socketConnected, isCellular, isNetworkUnmetered })` → `'syncing'|'offline'|'degraded'|'online'`

Rules:
- attempting → `syncing`
- !networkConnected → `offline`
- !socketConnected → `degraded`
- else → `online` (cellular still online; tooltip handles detail)

- [ ] **Step 2: Implement helper + StatusDot** (`tone` prop → `bg-success` / `bg-error` / `bg-warning` / `bg-fg-muted` + optional pulse for syncing)

- [ ] **Step 3: Rewrite ConnectionIndicator** to render `ui-status-dot` instead of Material icons; keep Dialog.alert messages.

- [ ] **Step 4: Spec-check** — offline is flat red dot. Commit.

```bash
git commit -m "feat(ui): StatusDot connection indicator"
```

---

### Task 3: Prompt TextInput + connect layout

**Files:**
- Modify: `components/ui/TextInput.vue`, `pages/connect.vue`, `components/connection/ServerConnectForm.vue`
- Create: `utils/appbarStatus.js` can wait for Task 4; focus classes can be CSS-only (no test) OR test class-name helper.

- [ ] **Step 1: Add `variant` prop** to TextInput: default | `prompt`

Prompt classes when focused (track `:focus-within` on wrapper):
- `border-l-2 border-l-success pl-3`
- `shadow-[0_0_0_3px_rgba(55,244,153,0.15)]`
- Idle: `border-l-2 border-l-border`

Use Phosphor via `ui-ph-icon` for prepend/clear when variant is prompt.

- [ ] **Step 2: Rebuild `pages/connect.vue`** — single centered column: logo → wordmark → mono `CONNECT TO LIBRARY` → `connection-server-connect-form`. Remove top-pinned logo.

- [ ] **Step 3: ServerConnectForm** — use `variant="prompt"` on address/user/pass inputs; replace Material back/more/delete with PhIcon where practical; offline/error row uses StatusDot.

- [ ] **Step 4: Spec-check** — logo above field; focus accent visible. Commit.

```bash
git commit -m "feat(connect): Prompt-form layout and focus accents"
```

---

### Task 4: Terminal Appbar + SideDrawer + Phosphor map

**Files:**
- Create: `utils/appbarStatus.js`, `tests/appbarStatus.test.js`
- Modify: `assets/icons/phosphor-map.js`, `components/app/Appbar.vue`, `components/app/SideDrawer.vue`, `components/ui/IconBtn.vue` if needed

- [ ] **Step 1: Tests** for `statusLabel({ routeName, theme })` e.g. bookshelf → `HOME · NIGHT`, search → `SEARCH · NIGHT`, settings → `SETTINGS · TERMINAL`

- [ ] **Step 2: Expand phosphor-map** with at least: `menu`, `home`, `person`, `equalizer`, `cast`, `cast_connected`, `cloud_off`, `logout`, `download`, `filter_alt`, `sort`, `view_list`, `grid_view`, `arrow_forward` (paths from `@phosphor-icons/core`)

- [ ] **Step 3: Rebuild Appbar** per spec (mark, Night**shelf**, mono status, StatusDot/ConnectionIndicator, PhIcon search, PhIcon menu). Library chip restyle.

- [ ] **Step 4: Rebuild SideDrawer** — brand block, PhIcon items, active left accent rail (`border-l-2 border-l-accent bg-secondary/40`), StatusDot on disconnect row.

- [ ] **Step 5: Spec-check** — no Material menu/search in app bar. Commit.

```bash
git commit -m "feat(chrome): Terminal app bar and side drawer"
```

---

### Task 5: Cover rails + library grid toggle + hybrid filters

**Files:**
- Create: `utils/libraryViewMode.js`, `tests/libraryViewMode.test.js`, `components/home/LibraryGenreChips.vue`
- Modify: `plugins/localStore.js`, `store/globals.js`, `components/bookshelf/Shelf.vue`, `pages/bookshelf/index.vue`, `components/home/BookshelfToolbar.vue`, optionally force rail styling when `enableAltView` / new `libraryViewMode`

**Approach:**
- Treat home categorized shelves as **cover rails**: when `altViewEnabled` OR always for Nightshelf, use mono uppercase label above row; remove wood placard/divider for rail mode.
- Remove Material `cloud_off` empty state → StatusDot + copy.
- Soften/remove large Continue hero card in favor of first rail emphasis (progress edge on cards already via synthwave where present) — keep continue data in `continue-listening` shelf if server provides it; if hero stays, restyle to rail-card not ABS article.
- Library page (`bookshelf/library`): persist `libraryViewMode` `rails`|`grid` (map grid → existing `bookshelfListView` false grid of covers; rails = horizontal rows if available, else denser cover grid with rail chrome). Practical mapping: `grid` = current cover grid (`!bookshelfListView`); list view remains optional. Toggle icon PhIcon `grid_view`/`rows` (rails).
- **Genre chips:** read filter data from existing filter modal source (`modals-filter-modal` / user settings). Show top genres/tags as chips that set `mobileFilterBy` to `genres.<encoded>` or `tags.<encoded>` using existing encode helpers. FILTERS button still opens full sheet.

- [ ] **Step 1: TDD** `normalizeViewMode`, `toggleViewMode`

- [ ] **Step 2: Shelf rail chrome** + home empty StatusDot

- [ ] **Step 3: LibraryGenreChips + toolbar**

- [ ] **Step 4: Spec-check** — rails look Netflix-ish; chips + filter sheet both work. Commit.

```bash
git commit -m "feat(bookshelf): cover rails and hybrid library filters"
```

---

### Task 6: Search model B

**Files:**
- Create: `utils/searchChips.js`, `tests/searchChips.test.js`
- Modify: `pages/search.vue`

- [ ] **Step 1: TDD** `visibleGroups(chip, groups)` — chip `all|books|podcasts|series|authors|…`

- [ ] **Step 2: Idle state** — if `!search`, show suggestion rails from:
  - continue items / recent shelves already in store if accessible, OR fetch lightweight categories once
  - Keep simple: horizontal cover rows from last home shelves cached in `sessionStorage`/`vuex` if present; else hide suggestions gracefully

- [ ] **Step 3: Active state** — prompt TextInput, type chips, filtered vertical lists (reuse search cards)

- [ ] **Step 4: Spec-check** — no billboard; chips filter results. Commit.

```bash
git commit -m "feat(search): suggestion carousels and type chips"
```

---

### Task 7: Build, device install, final quality review

- [ ] **Step 1: Run all helper tests**

```bash
node --test tests/*.test.js
```

- [ ] **Step 2: Build APK**

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export ANDROID_HOME=$HOME/Android/Sdk
./node_modules/.bin/nuxt generate && npx cap sync android
cd android && ./gradlew :app:assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

- [ ] **Step 3: Spec acceptance walkthrough** (device/emulator) against §7 of the revamp spec

- [ ] **Step 4: One large quality review** (code-reviewer / Bugbot-style) of the full diff vs spec — file findings; fix blockers only

- [ ] **Step 5: Commit review fixes if any; stop for user**

---

## Spec coverage checklist (plan self-review)

| Spec requirement | Task |
|------------------|------|
| Terminal app bar + Phosphor | 4 |
| Terminal drawer + accent rail | 4 |
| Flat red/green status dot | 2, 3, 4, 5 |
| Logo transparent + brighter | 1 |
| Prompt connect layout + focus | 3 |
| Cover rails | 5 |
| Library rails/grid toggle | 5 |
| Hybrid genre chips + filter sheet | 5 |
| Search suggestions + chips + list | 6 |
| No billboard / no backend | 6 (explicit) |
| Theme switcher preserved | no change to theme system |
| Final QA | 7 |

## Placeholder scan

None intentional. Idle search suggestions may degrade gracefully if shelf cache empty — acceptable.

---

**Execution:** Inline now with modified TDD; no per-task quality review; one large review at end.
