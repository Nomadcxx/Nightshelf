# Nightshelf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn this Audiobookshelf Android fork into **Nightshelf** (`com.nightshelf.app`) with Eldritch themes, Phosphor icons, synthwave player progress, English-only strings, upstream #1909/#1917, and a selective rethink of Home / Player / Settings / Bookshelf.

**Architecture:** Keep Nuxt 2 + Capacitor + existing Kotlin player stack. Drive UI chrome through CSS variables on `html[data-theme]`. Change Android `applicationId` / display name without renaming the Java package (`com.audiobookshelf.app`) in this cycle to reduce risk. Cherry-pick upstream auth + notification PRs after thin foundations. Layer Phosphor via a Vue 2-friendly `PhIcon` wrapper; migrate `IconBtn` first. Bookshelf is the last and heaviest UI task.

**Tech Stack:** Nuxt 2, Vue 2, Tailwind 3, Capacitor 7, Kotlin Android player, Eldritch palette, Phosphor icons, Inter + JetBrains Mono

**Spec:** `docs/superpowers/specs/2026-07-14-nightshelf-design.md`

---

## File map (ownership)

| Area | Primary files |
|------|----------------|
| Theme tokens | `assets/tailwind.css`, `tailwind.config.js`, `assets/fonts.css`, `assets/app.css` |
| Theme persist/apply | `plugins/localStore.js`, `plugins/init.client.js`, `pages/settings.vue` |
| i18n strip | `plugins/i18n.js`, `strings/*` (keep `en-us.json` only), `pages/settings.vue` |
| App identity | `capacitor.config.json`, `package.json`, `android/app/build.gradle`, `android/app/src/main/res/values/strings.xml`, `android/app/src/main/assets/capacitor.config.json` |
| Auth PR #1909 | `android/.../server/ApiHandler.kt`, `plugins/axios.js`, `plugins/nativeHttp.js`, `store/user.js` (+ optional vitest) |
| Cover PR #1917 | `android/.../player/{PlayerNotificationService,AbMediaDescriptionAdapter,CoverImageLoader}.kt`, `android/.../data/PlaybackSession.kt` |
| Icons | `components/ui/PhIcon.vue` (new), `components/ui/IconBtn.vue`, later call sites |
| Synthwave progress | `components/ui/SynthwaveProgress.vue` (new), `components/app/AudioPlayer.vue`, `assets/transitions.css` |
| Home | `pages/index.vue`, `components/home/*`, `layouts/default.vue`, `components/app/Appbar.vue` |
| Bookshelf | `components/bookshelf/LazyBookshelf.vue`, `components/home/BookshelfToolbar.vue`, `components/home/BookshelfNavBar.vue`, `components/cards/LazyBookCard.vue`, `assets/app.css` (wood shelf chrome) |
| Native polish | `android/.../res/values/styles.xml`, splash/icon resources, `MediaPlayerWidget.kt` + `media_player_widget.xml` |

**Explicit non-touch this cycle:** `ios/**` (skip shipping); e-reader internal themes in `EpubReader.vue` (separate from app chrome themes).

---

### Task 1: Feature branch + baseline

**Files:** none (git only)

- [ ] **Step 1: Create branch from current master**

```bash
cd /home/nomadx/audiobookshelf-app
git checkout -b nightshelf/foundations
git status -sb
```

Expected: on `nightshelf/foundations`, clean except intentional untracked (`.agents/`, brainstorm artifacts already gitignored).

- [ ] **Step 2: Record baseline build command**

```bash
npm ci
npx nuxt generate
```

Expected: generate succeeds (or note pre-existing failures to avoid blaming later tasks).

- [ ] **Step 3: Commit branch marker only if needed**

No code commit required if tree clean. Proceed to Task 2.

---

### Task 2: Eldritch CSS theme tokens

**Files:**
- Modify: `assets/tailwind.css`
- Modify: `tailwind.config.js`

- [ ] **Step 1: Replace theme blocks in `assets/tailwind.css`**

Replace the `:root` / `black` / `light` blocks with Eldritch-mapped `night` (default on `:root` and `html[data-theme='night']`), `black` (Abyss), and `terminal`. Remove `light` entirely.

Use space-separated RGB channels (existing Tailwind `rgb(var(--color-*) / <alpha-value>)` pattern):

```css
@layer base {
  /* Night (Cthulhu) — default */
  :root,
  html[data-theme='night'] {
    color: #ebfafa;
    --color-bg: 33 35 55;           /* #212337 */
    --color-bg-hover: 50 52 73;     /* #323449 */
    --color-fg: 235 250 250;        /* #ebfafa */
    --color-fg-muted: 91 92 102;    /* #5b5c66 */
    --color-primary: 33 35 55;
    --color-secondary: 50 52 73;
    --color-border: 69 71 89;       /* #454759 */
    --color-bg-toggle: 50 52 73;
    --color-bg-toggle-selected: 69 71 89;
    --color-track-cursor: 55 244 153; /* #37f499 */
    --color-track: 69 71 89;
    --color-track-buffered: 112 129 208; /* #7081d0 */
    --color-accent: 164 140 242;    /* #a48cf2 */
    --color-info: 4 209 249;        /* #04d1f9 */
    --color-success: 55 244 153;
    --color-warning: 247 198 127;
    --color-danger: 241 108 117;
    --gradient-item-page: linear-gradient(169deg, rgba(33, 35, 55, 0.4) 0%, rgba(33, 35, 55, 1) 80%);
    --gradient-audio-player: linear-gradient(180deg, rgba(33, 35, 55, 0) 0%, rgba(33, 35, 55, 1) 80%);
    --gradient-minimized-audio-player: linear-gradient(145deg, rgba(50, 52, 73, 0.5) 0%, rgba(33, 35, 55, 0.95) 60%);
  }

  html[data-theme='black'] {
    color: #d8e6e6;
    --color-bg: 23 25 40;           /* #171928 */
    --color-bg-hover: 37 39 56;     /* #252738 */
    --color-fg: 216 230 230;
    --color-fg-muted: 71 72 82;
    --color-primary: 23 25 40;
    --color-secondary: 37 39 56;
    --color-border: 53 55 70;
    --color-bg-toggle: 37 39 56;
    --color-bg-toggle-selected: 53 55 70;
    --color-track-cursor: 45 204 130; /* #2dcc82 */
    --color-track: 53 55 70;
    --color-track-buffered: 80 98 153;
    --color-accent: 139 117 217;    /* #8b75d9 */
    --color-info: 3 150 179;
    --color-success: 45 204 130;
    --color-warning: 212 166 102;
    --color-danger: 204 88 96;
    --gradient-item-page: rgb(23, 25, 40);
    --gradient-audio-player: rgb(23, 25, 40);
    --gradient-minimized-audio-player: rgb(23, 25, 40);
  }

  html[data-theme='terminal'] {
    /* Same as night surfaces; stronger mono cues applied via utility classes in later tasks */
    color: #ebfafa;
    --color-bg: 33 35 55;
    --color-bg-hover: 50 52 73;
    --color-fg: 235 250 250;
    --color-fg-muted: 91 92 102;
    --color-primary: 33 35 55;
    --color-secondary: 26 28 46;
    --color-border: 55 244 153;
    --color-bg-toggle: 50 52 73;
    --color-bg-toggle-selected: 55 244 153;
    --color-track-cursor: 55 244 153;
    --color-track: 69 71 89;
    --color-track-buffered: 4 209 249;
    --color-accent: 55 244 153;
    --color-info: 4 209 249;
    --color-success: 55 244 153;
    --color-warning: 247 198 127;
    --color-danger: 241 108 117;
    --gradient-item-page: linear-gradient(169deg, rgba(33, 35, 55, 0.5) 0%, rgba(33, 35, 55, 1) 80%);
    --gradient-audio-player: linear-gradient(180deg, rgba(33, 35, 55, 0) 0%, rgba(33, 35, 55, 1) 85%);
    --gradient-minimized-audio-player: linear-gradient(145deg, rgba(50, 52, 73, 0.6) 0%, rgba(33, 35, 55, 1) 60%);
  }

  body {
    @apply bg-primary;
  }
}
```

- [ ] **Step 2: Extend Tailwind colors/fonts in `tailwind.config.js`**

```js
colors: {
  bg: 'rgb(var(--color-bg) / <alpha-value>)',
  'bg-hover': 'rgb(var(--color-bg-hover) / <alpha-value>)',
  fg: 'rgb(var(--color-fg) / <alpha-value>)',
  'fg-muted': 'rgb(var(--color-fg-muted) / <alpha-value>)',
  secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
  primary: 'rgb(var(--color-primary) / <alpha-value>)',
  border: 'rgb(var(--color-border) / <alpha-value>)',
  'bg-toggle': 'rgb(var(--color-bg-toggle) / <alpha-value>)',
  'bg-toggle-selected': 'rgb(var(--color-bg-toggle-selected) / <alpha-value>)',
  'track-cursor': 'rgb(var(--color-track-cursor) / <alpha-value>)',
  track: 'rgb(var(--color-track) / <alpha-value>)',
  'track-buffered': 'rgb(var(--color-track-buffered) / <alpha-value>)',
  accent: 'rgb(var(--color-accent) / <alpha-value>)',
  error: 'rgb(var(--color-danger) / <alpha-value>)',
  info: 'rgb(var(--color-info) / <alpha-value>)',
  success: 'rgb(var(--color-success) / <alpha-value>)',
  warning: 'rgb(var(--color-warning) / <alpha-value>)'
},
fontFamily: {
  sans: ['Inter', 'Source Sans Pro', ...defaultTheme.fontFamily.sans],
  mono: ['JetBrains Mono', 'Ubuntu Mono', ...defaultTheme.fontFamily.mono]
}
```

Remove hardcoded `accent: '#1ad691'` etc. that bypass tokens.

- [ ] **Step 3: Visual smoke check**

```bash
npm run dev
```

Open app, temporarily set `document.documentElement.dataset.theme = 'night'|'black'|'terminal'` in console. Confirm backgrounds shift.

- [ ] **Step 4: Commit**

```bash
git add assets/tailwind.css tailwind.config.js
git commit -m "$(cat <<'EOF'
feat(theme): map Eldritch night/black/terminal CSS tokens

Replace ABS dark/light palettes with Cthulhu/Abyss-based variables.
EOF
)"
```

---

### Task 3: Theme switching + migration + StatusBar

**Files:**
- Modify: `pages/settings.vue`
- Modify: `plugins/init.client.js`
- Modify: `components/app/AudioPlayer.vue` (fallback `'dark'` → `'night'`)
- Modify: `components/readers/Reader.vue` (app chrome theme fallback only — do not change e-reader theme enums)
- Modify: `strings/en-us.json` (theme labels)
- Modify: `capacitor.config.json` (StatusBar default color)

- [ ] **Step 1: Add migration helper in `plugins/init.client.js`**

When loading stored theme:

```js
function migrateTheme(theme) {
  if (theme === 'dark' || theme === 'light' || !theme) return 'night'
  if (['night', 'black', 'terminal'].includes(theme)) return theme
  return 'night'
}
```

Apply: `const theme = migrateTheme(await app.$localStore?.getTheme())` then `document.documentElement.dataset.theme = theme`. If migrated, `setTheme(theme)`.

Sync StatusBar background to theme bg hex on apply (and export a small `applyTheme(theme)` used by settings):

```js
import { StatusBar, Style } from '@capacitor/status-bar'

const THEME_STATUS = {
  night: '#212337',
  black: '#171928',
  terminal: '#212337'
}

async function applyNativeChrome(theme) {
  try {
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: THEME_STATUS[theme] || THEME_STATUS.night })
  } catch (e) {
    // web / unsupported
  }
}
```

Call `applyNativeChrome` whenever theme is set.

- [ ] **Step 2: Update `pages/settings.vue` theme options**

```js
themeOptionItems() {
  return [
    { text: this.$strings.LabelThemeNight || 'Night', value: 'night' },
    { text: this.$strings.LabelThemeTerminal || 'Terminal', value: 'terminal' },
    { text: this.$strings.LabelThemeBlack, value: 'black' }
  ]
}
```

Default `theme: 'night'`. On save, call the same StatusBar sync (via shared helper on `Vue.prototype.$applyTheme` if you extract it).

Remove language UI block (lines ~24–28) in the same pass only if Task 4 is done together; otherwise leave for Task 4.

- [ ] **Step 3: Update string labels in `strings/en-us.json`**

Add/rename:

```json
"LabelThemeNight": "Night",
"LabelThemeTerminal": "Terminal",
"LabelThemeBlack": "Black OLED"
```

Remove or stop using `LabelThemeDark` / `LabelThemeLight` in UI.

- [ ] **Step 4: Fix fallbacks**

In `AudioPlayer.vue` and `Reader.vue` chrome theme computed: `|| 'night'` instead of `|| 'dark'`.

- [ ] **Step 5: Update `capacitor.config.json` StatusBar backgroundColor** to `#212337`.

- [ ] **Step 6: Commit**

```bash
git add pages/settings.vue plugins/init.client.js components/app/AudioPlayer.vue components/readers/Reader.vue strings/en-us.json capacitor.config.json
git commit -m "$(cat <<'EOF'
feat(theme): Night/Terminal/Black switching with StatusBar sync

Migrate stored dark/light to night; drop light from settings.
EOF
)"
```

---

### Task 4: English-only + light cruft

**Files:**
- Modify: `plugins/i18n.js`
- Delete: all `strings/*.json` except `strings/en-us.json`
- Modify: `pages/settings.vue` (remove language row + handlers)
- Modify: any server-driven language sync that forces non-en (keep API fields but ignore for UI)

- [ ] **Step 1: Slim `plugins/i18n.js`**

Keep only `en-us` in `languageCodeMap`. Make `loadi18n` a no-op that always applies `en-us`. Remove dynamic `import(\`../strings/${code}\`)` for other codes.

- [ ] **Step 2: Delete locale files**

```bash
cd /home/nomadx/audiobookshelf-app/strings
find . -type f -name '*.json' ! -name 'en-us.json' -delete
ls
```

Expected: only `en-us.json`.

- [ ] **Step 3: Remove language picker from `pages/settings.vue`**

Delete the language row in the template and `showLanguageOptions` / `language` branches in more-menu handlers. Leave `languageCode: 'en-us'` in device settings payload for server compatibility if required.

- [ ] **Step 4: Commit**

```bash
git add plugins/i18n.js pages/settings.vue strings/
git commit -m "$(cat <<'EOF'
chore(i18n): ship English-only; remove locale packs and picker
EOF
)"
```

---

### Task 5: Android app identity (thin rename)

**Files:**
- Modify: `package.json` (`name`: `nightshelf`)
- Modify: `capacitor.config.json` (`appId`: `com.nightshelf.app`, `appName`: `Nightshelf`)
- Modify: `android/app/build.gradle` (`applicationId "com.nightshelf.app"`)
- Modify: `android/app/src/main/res/values/strings.xml` (`app_name`, `title_activity_main`, `package_name` if present)
- Modify: `android/app/src/debug/res/values/strings.xml`
- Modify: `android/app/src/main/assets/capacitor.config.json` (sync after `npx cap sync` or edit to match)
- Do **not** rename Java/Kotlin package `com.audiobookshelf.app` in this task

- [ ] **Step 1: Edit identity files** as above.

- [ ] **Step 2: Sync Capacitor Android assets**

```bash
npx nuxt generate
npx cap sync android
```

Expected: Android project picks up `com.nightshelf.app` / Nightshelf.

- [ ] **Step 3: Verify gradle applicationId**

```bash
rg -n "applicationId|app_name|com.nightshelf|com.audiobookshelf.app" android/app/build.gradle android/app/src/main/res/values/strings.xml capacitor.config.json
```

Expected: `applicationId` and display name are Nightshelf; Java namespaces may still say `com.audiobookshelf.app`.

- [ ] **Step 4: Commit**

```bash
git add package.json capacitor.config.json android/app/build.gradle android/app/src/main/res/values/strings.xml android/app/src/debug/res/values/strings.xml android/app/src/main/assets/capacitor.config.json
git commit -m "$(cat <<'EOF'
feat(android): rebrand to Nightshelf (com.nightshelf.app)

Keep Kotlin package path for now; change applicationId and labels only.
EOF
)"
```

---

### Task 6: Cherry-pick upstream #1909 (auth, Android+JS)

**Files (expected):**
- Modify: `android/app/src/main/java/com/audiobookshelf/app/server/ApiHandler.kt`
- Modify: `plugins/axios.js`, `plugins/nativeHttp.js`, `store/user.js`
- Optional: `vitest.config.js`, `test/unit/**`, `package.json`, `.github/workflows/build-apk.yml`
- Skip: `ios/App/Shared/util/ApiClient.swift`

- [ ] **Step 1: Fetch PR patch and apply excluding iOS**

```bash
cd /home/nomadx/audiobookshelf-app
git fetch https://github.com/advplyr/audiobookshelf-app.git pull/1909/head:pr-1909
git cherry-pick -n pr-1909
# Drop iOS changes from the index if present
git restore --staged ios/ 2>/dev/null || true
git checkout -- ios/ 2>/dev/null || true
git status
```

If cherry-pick conflicts, resolve preferring PR logic in `ApiHandler.kt` / JS auth files.

- [ ] **Step 2: Decide on vitest**

If `vitest` + workflow changes are low-conflict with Nuxt 2:

```bash
npm install -D vitest
npx vitest run
```

Expected: new unit tests pass. If tooling fight is large, keep only the auth logic commits and discard vitest/CI files:

```bash
git restore --staged vitest.config.js test/ package.json package-lock.json .github/workflows/build-apk.yml
git checkout -- vitest.config.js test/ .github/workflows/build-apk.yml 2>/dev/null || true
# manually ensure package.json has no vitest if discarded
```

- [ ] **Step 3: Sanity-check JS**

```bash
node --check plugins/axios.js
node --check plugins/nativeHttp.js
node --check store/user.js
```

Expected: no syntax errors.

- [ ] **Step 4: Commit**

```bash
git add android/app/src/main/java/com/audiobookshelf/app/server/ApiHandler.kt plugins/axios.js plugins/nativeHttp.js store/user.js
# plus vitest files only if kept
git commit -m "$(cat <<'EOF'
fix(auth): only logout on genuine 401 refresh rejection

Port upstream #1909 Android+JS paths; skip iOS for Nightshelf.
EOF
)"
```

---

### Task 7: Cherry-pick upstream #1917 (HQ notification covers)

**Files:**
- `android/.../data/PlaybackSession.kt`
- `android/.../player/AbMediaDescriptionAdapter.kt`
- `android/.../player/CoverImageLoader.kt` (new)
- `android/.../player/PlayerNotificationService.kt`

- [ ] **Step 1: Fetch and cherry-pick**

```bash
git fetch https://github.com/advplyr/audiobookshelf-app.git pull/1917/head:pr-1917
git cherry-pick pr-1917
```

Resolve conflicts if any (likely around package imports — stay on `com.audiobookshelf.app`).

- [ ] **Step 2: Compile Android module if SDK available**

```bash
cd android && ./gradlew :app:compileDebugKotlin
```

Expected: SUCCESS. If no SDK in environment, note manual device verification later.

- [ ] **Step 3: Commit** (if cherry-pick did not already commit)

```bash
git status
# if cherry-pick created commit, skip; else commit resolved files
```

Message if needed:

```bash
git commit -m "$(cat <<'EOF'
feat(android): high-resolution notification cover bitmaps

Port upstream #1917 CoverImageLoader + metadata bitmap path.
EOF
)"
```

---

### Task 8: Fonts — Inter + JetBrains Mono

**Files:**
- Modify: `assets/fonts.css`
- Add font files under `static/fonts/Inter/` and `static/fonts/JetBrains_Mono/` (woff2)
- Keep Source Sans Pro temporarily as fallback until Inter loads

- [ ] **Step 1: Add woff2 files** (subset latin if possible for size).

- [ ] **Step 2: Prepend `@font-face` rules in `assets/fonts.css` for Inter (400/600/700) and JetBrains Mono (400/500).

- [ ] **Step 3: Confirm `tailwind.config.js` font stacks from Task 2.

- [ ] **Step 4: Commit**

```bash
git add assets/fonts.css static/fonts/Inter static/fonts/JetBrains_Mono
git commit -m "$(cat <<'EOF'
feat(ui): add Inter and JetBrains Mono for Nightshelf type
EOF
)"
```

---

### Task 9: Phosphor icon pipeline

**Files:**
- Create: `components/ui/PhIcon.vue`
- Create: `assets/icons/phosphor-map.js` (material name → phosphor SVG component/path)
- Modify: `components/ui/IconBtn.vue`
- Install: `@phosphor-icons/core` (SVG assets) **or** vendor a curated SVG set under `assets/icons/svg/`

Nuxt 2 / Vue 2 note: `@phosphor-icons/vue` is Vue 3 — do **not** use it. Prefer inline SVG via a map of path data from `@phosphor-icons/core`.

- [ ] **Step 1: Install core package**

```bash
npm install @phosphor-icons/core
```

- [ ] **Step 2: Create `components/ui/PhIcon.vue`**

```vue
<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 256 256"
    fill="currentColor"
    aria-hidden="true"
    class="ph-icon"
  >
    <!-- render path(s) from resolved icon definition -->
    <path v-for="(d, i) in paths" :key="i" :d="d" />
  </svg>
</template>

<script>
import { iconPaths } from '@/assets/icons/phosphor-map'

export default {
  props: {
    name: { type: String, required: true },
    size: { type: [Number, String], default: 24 },
    weight: { type: String, default: 'regular' } // regular|bold|fill
  },
  computed: {
    paths() {
      const def = iconPaths[this.name]
      if (!def) return []
      return Array.isArray(def) ? def : [def]
    }
  }
}
</script>
```

Populate `phosphor-map.js` with the icons `IconBtn` actually uses first (`expand_more`, play/pause, skip, settings, search, etc.). Expand map as screens are redesigned.

- [ ] **Step 3: Update `IconBtn.vue` to prefer PhIcon**

Replace material span with:

```vue
<ph-icon v-if="phosphorName" :name="phosphorName" :size="numericSize" />
<span v-else class="material-symbols text-2xl" ...>{{ icon }}</span>
```

Map known material ligatures → phosphor names; fallback keeps Material temporarily.

- [ ] **Step 4: Smoke-test settings / player chrome icons**

- [ ] **Step 5: Commit**

```bash
git add components/ui/PhIcon.vue components/ui/IconBtn.vue assets/icons package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat(ui): add Phosphor icon wrapper and IconBtn bridge
EOF
)"
```

---

### Task 10: Synthwave progress + Player pass

**Files:**
- Create: `components/ui/SynthwaveProgress.vue`
- Modify: `components/app/AudioPlayer.vue`
- Modify: `assets/transitions.css` (keyframes + `prefers-reduced-motion`)

- [ ] **Step 1: Implement `SynthwaveProgress.vue`**

Props: `progress` (0–1), `buffered` (0–1 optional), `playing` (Boolean), `variant` (`'full' | 'mini'`).

Behavior:
- Render track + filled region with CSS gradient `#37f499 → #04d1f9 → #a48cf2`
- Animated SVG/CSS wave **only when** `playing === true`
- `@media (prefers-reduced-motion: reduce)` → static fill
- Emit `seek` on pointer events (or keep existing cursor logic in AudioPlayer and use this as visual layer only)

Minimal structure:

```vue
<template>
  <div class="synth-track" :class="[variant, { playing: playing && !reducedMotion }]" @click="$emit('track-click', $event)">
    <div class="synth-fill" :style="{ width: percent }">
      <div class="synth-wave" aria-hidden="true" />
    </div>
    <div v-if="variant === 'full'" class="synth-cursor" :style="{ left: percent }" />
  </div>
</template>
```

CSS in component + shared keyframes in `assets/transitions.css`:

```css
@keyframes nightshelf-synthwave {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@media (prefers-reduced-motion: reduce) {
  .synth-track.playing .synth-wave { animation: none !important; }
}
```

- [ ] **Step 2: Wire into `AudioPlayer.vue`**

Replace the visual fill of `playedTrack` / mini bar with `<synthwave-progress>` while keeping existing touch/seek math (`touchstartCursor`, width refs) working. Pass `:playing="!isPaused && !showLoadingState"` (use actual player playing computed already in component).

- [ ] **Step 3: Player chrome polish (selective)**

- Use `font-mono` for time labels and speed
- Swap transport `IconBtn` icons to Phosphor names
- Keep chapter/sleep entry points; prefer sheet density over new IA

- [ ] **Step 4: Manual test**

Play / pause → wave starts/stops. Toggle OS reduced motion if available. Seek still works.

- [ ] **Step 5: Commit**

```bash
git add components/ui/SynthwaveProgress.vue components/app/AudioPlayer.vue assets/transitions.css
git commit -m "$(cat <<'EOF'
feat(player): Eldritch synthwave progress and player chrome polish
EOF
)"
```

---

### Task 11: Home rethink

**Files:**
- Modify: `pages/index.vue`
- Modify: `components/app/Appbar.vue`
- Modify: `layouts/default.vue` (if brand/chrome lives here)
- Related continue-listening widgets/cards as referenced from index

- [ ] **Step 1: Brand chrome**

Show **Nightshelf** as primary appbar/title signal (not only generic library name). Use Inter semibold; optional mono subtitle for active theme name when `terminal`.

- [ ] **Step 2: Hero Continue card**

Elevate continue-listening into a single dominant card using surface/border tokens + mini `SynthwaveProgress` if progress available. Add one short enter transition (opacity/translate) gated by reduced-motion.

- [ ] **Step 3: Reduce toolbar clutter**

Defer secondary actions into existing menus; keep search/library access obvious.

- [ ] **Step 4: Commit**

```bash
git add pages/index.vue components/app/Appbar.vue layouts/default.vue
git commit -m "$(cat <<'EOF'
feat(home): Nightshelf continue hero and brand chrome
EOF
)"
```

---

### Task 12: Settings rethink

**Files:**
- Modify: `pages/settings.vue`

- [ ] **Step 1: Group sections** visually (Appearance, Playback, Downloads, Android Auto, About) with muted mono section labels (`font-mono text-xxs uppercase tracking-wider text-fg-muted`).

- [ ] **Step 2: Appearance first** — theme control already Night/Terminal/Black; ensure language row gone (Task 4).

- [ ] **Step 3: Mono values** for jump times, sleep lengths, etc.

- [ ] **Step 4: Commit**

```bash
git add pages/settings.vue
git commit -m "$(cat <<'EOF'
feat(settings): grouped Nightshelf settings with theme-first appearance
EOF
)"
```

---

### Task 13: Bookshelf rethink (heaviest)

**Files:**
- Modify: `assets/app.css` (replace wood `.bookshelfRow` / `.bookshelfDivider` with Eldritch surfaces)
- Modify: `components/bookshelf/LazyBookshelf.vue`
- Modify: `components/home/BookshelfToolbar.vue`
- Modify: `components/home/BookshelfNavBar.vue`
- Modify: `components/cards/LazyBookCard.vue` (and series/collection cards if sharing chrome)
- Do **not** add scroll-driven animations

- [ ] **Step 1: Remove wood shelf chrome**

Replace photographic wood backgrounds with tokenized `bg-secondary` / border separators so bookshelf matches Night/Abyss.

- [ ] **Step 2: Toolbar / nav density**

Tighten filter/sort controls; Phosphor icons; clearer selected tab using `--color-accent` / success green underline.

- [ ] **Step 3: Cover progress**

On `LazyBookCard`, ensure progress indicator uses Eldritch track colors (static — no synthwave on grid cards for performance).

- [ ] **Step 4: Verify lazy loading**

Scroll large library; confirm cards still virtualize/lazy-load (no full-list mount regression). Profile if needed.

- [ ] **Step 5: Commit**

```bash
git add assets/app.css components/bookshelf components/home/BookshelfToolbar.vue components/home/BookshelfNavBar.vue components/cards/LazyBookCard.vue
git commit -m "$(cat <<'EOF'
feat(bookshelf): Eldritch shelf chrome and denser library UI

Preserve lazy loading; no scroll animations.
EOF
)"
```

---

### Task 14: Native polish (splash, icon, widget)

**Files:**
- Android splash / theme styles under `android/app/src/main/res/values/styles.xml` (+ v21/v31 as present)
- Launcher icons under `android/app/src/main/res/mipmap-*` (generate Nightshelf adaptive icon)
- `android/app/src/main/res/layout/media_player_widget.xml`
- `android/app/src/main/java/com/audiobookshelf/app/MediaPlayerWidget.kt` if colors set in code
- `static/Logo.png` / favicon for web shell

- [ ] **Step 1: Splash + window background** → `#212337` (Night).

- [ ] **Step 2: Adaptive icon** — simple Nightshelf mark (bookshelf + night cue); avoid Material default.

- [ ] **Step 3: Widget** — Eldritch surfaces; **static** progress bar only.

- [ ] **Step 4: `npx cap sync android` + install debug build on device**

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/res static/Logo.png static/favicon.ico
git commit -m "$(cat <<'EOF'
feat(android): Nightshelf splash, icon, and widget theming
EOF
)"
```

---

### Task 15: End-to-end verification checklist

- [ ] **Step 1: Web generate**

```bash
npx nuxt generate
```

Expected: success.

- [ ] **Step 2: Manual QA against spec success criteria**

| Check | Pass? |
|-------|-------|
| App id / name Nightshelf | |
| Themes night/terminal/black switch; default night; no light | |
| StatusBar color follows theme | |
| Synthwave only while playing; reduced-motion safe | |
| Home / Player / Settings / Bookshelf feel redesigned | |
| Phosphor on redesigned controls | |
| English only; no language picker | |
| Auth: transient refresh failure does not wipe session (#1909) | |
| Notification art sharper when playing (#1917) | |
| iOS not required to build/ship | |

- [ ] **Step 3: Final commit only if verification fixes were needed**

---

## Self-review (plan vs spec)

| Spec requirement | Task(s) |
|------------------|---------|
| Rebrand `com.nightshelf.app` | 5, 14 |
| Themes Night/Terminal/Black OLED; drop Light | 2, 3 |
| Eldritch tokens | 2 |
| Terminal as flavor | 2 (`terminal` token set), 11 mono cues |
| StatusBar / splash / widget / notification mapping | 3, 7, 14 |
| Synthwave progress + motion rules | 10 |
| Phosphor icons | 9 (+ later screens) |
| Inter + JetBrains Mono | 8 |
| English-only + light cruft | 4 |
| Selective rethink Home/Player/Settings/Bookshelf | 10–13 |
| Bookshelf heaviest | 13 last among UI |
| #1909 then #1917 after foundations | 6 then 7 |
| Android only / skip iOS | 5, 6 skip ios |
| Approach 1 order | Tasks 1→15 |

**Open items from spec (resolved in plan):**
- Phosphor approach → `@phosphor-icons/core` + `PhIcon` (Task 9)
- Fonts → bundled woff2 (Task 8)
- `terminal` as own preference key → yes (Task 3)

---

## Execution note

Prefer a long-lived branch `nightshelf/foundations` (or rename to `nightshelf/main-work` after Task 5). Do not force-push `master`. Merge to your fork default branch when the verification checklist passes.
