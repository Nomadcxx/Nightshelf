# Handover: Nightshelf session (2026-07-14)

**Purpose:** Enable another agent to **audit** this session’s work — verify completeness against the design/plan, spot regressions, and decide what to fix or commit next.

**Repo:** `/home/nomadx/audiobookshelf-app`  
**Remote:** `https://github.com/Nomadcxx/audiobookshelf-app`  
**Branch at end of session:** `master` @ `4db09d02` (pushed) + **uncommitted** rebrand polish (see §5)  
**Transcript:** Cursor agent transcript `8059649e-1f95-4dc0-b880-813f59ce1bab`

---

## 1. Product intent (locked decisions)

| Decision | Value |
|----------|--------|
| Product name | **Nightshelf** |
| Android `applicationId` | `com.nightshelf.app` (debug: `com.nightshelf.app.debug`) |
| Kotlin/Java package | Still `com.audiobookshelf.app` (intentional thin rename) |
| Platforms | **Android only** this cycle (`ios/**` not shipping) |
| Themes | `night` (default, Eldritch Cthulhu), `terminal`, `black` (Abyss OLED). **No light.** |
| Palette | [eldritch-theme](https://github.com/eldritch-theme/eldritch) |
| Icons | Phosphor via `PhIcon` + `IconBtn` bridge (Material still used as fallback) |
| Type | Inter + JetBrains Mono |
| i18n | English-only (`en-us`); language picker removed |
| UI rethink depth | Selective: Home, Player, Settings, **Bookshelf heaviest** |
| Motion | Synthwave progress while playing; respect reduced-motion |
| OAuth deep link | Keep `audiobookshelf://` for ABS server compatibility (**do not change without server coordination**) |

**Canonical docs:**

- Spec: `docs/superpowers/specs/2026-07-14-nightshelf-design.md`
- Plan (15 tasks): `docs/superpowers/plans/2026-07-14-nightshelf-implementation.md`
- Worktree (may lag master): `.worktrees/nightshelf-foundations` on `nightshelf/foundations`

---

## 2. What “done” means for this cycle

Plan Tasks 1–15 were implemented and merged to `master`, then pushed. Approximate commit range:

```
a064e91f  Add Nightshelf implementation plan from approved design spec.
…
4db09d02  feat(brand): NightShelf star adaptive icon and hero assets
```

Plus auth follow-up:

```
a42f0327  fix(auth): avoid logout on nativeHttp retry failures after refresh
```

### Feature areas to audit (by commit theme)

| Area | Key commits | Primary paths |
|------|-------------|---------------|
| Theme tokens + switch | `5a61916f`, `c8040692`, `b321de47` | `assets/tailwind.css`, `plugins/init.client.js`, `plugins/localStore.js`, `pages/settings.vue` |
| English-only i18n | `a3327267`, `43c12667` | `strings/en-us.json`, `plugins/i18n.js`, `ServerConnectForm.vue` (no server-lang copy) |
| Android identity | `95ef861b`, `6016f90c` | `android/app/build.gradle`, `strings.xml`, splash/icon/widget |
| Upstream #1909 auth | `f1c44d36`, `a42f0327` | `ApiHandler.kt`, `plugins/axios.js`, `plugins/nativeHttp.js`, `store/user.js` |
| Upstream #1917 HQ covers | `53d64beb`, `ac66ec4c` | `CoverImageLoader.kt`, Glide size override removal |
| Fonts | `462d1b8f` | `assets/fonts.css`, font files under `static/fonts/` |
| Phosphor | `38a12664` | `components/ui/PhIcon.vue`, `IconBtn.vue` |
| Player synthwave | `80676001` | `components/ui/SynthwaveProgress.vue`, `AudioPlayer.vue` |
| Home / Settings / Bookshelf | `abdb13d1`, `4d94df1b`, `b8ccc9ef` | `pages/index.vue`, `pages/settings.vue`, bookshelf components |
| Brand assets | `4db09d02` + **uncommitted** | `static/branding/`, mipmaps, `static/Logo.png`, `pages/connect.vue` |

---

## 3. Session end-state: build & device install

### Build recipe that worked

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk   # Cap needs source 21; system java-26 / jdk-17 fail
export ANDROID_HOME=$HOME/Android/Sdk
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

cd /home/nomadx/audiobookshelf-app
./node_modules/.bin/nuxt generate   # NOT `npx nuxt` (pulls Nuxt 4)
npx cap sync android
cd android && ./gradlew :app:assembleDebug
```

### Install result (this session)

| Item | Value |
|------|--------|
| APK | `android/app/build/outputs/apk/debug/app-debug.apk` (~21 MB) |
| Package | `com.nightshelf.app.debug` |
| Label | `Nightshelf` |
| Launcher activity | `com.audiobookshelf.app.MainActivity` |
| Device used | Emulator only: `emulator-5554` (Pixel 6 / API 34 AVD `nightshelf_api34`) |
| Physical device | **None attached** when install ran; user offered adb install on phone when connected |
| Launch | `adb shell monkey -p com.nightshelf.app.debug -c android.intent.category.LAUNCHER 1` |

**Re-install on phone when attached:**

```bash
adb devices
adb install -r /home/nomadx/audiobookshelf-app/android/app/build/outputs/apk/debug/app-debug.apk
```

**Note:** Uncommitted rebrand files were present **before** the successful assemble; `nuxt generate` / cap sync / assemble ran with those changes included in the APK that was installed. After committing or reverting, rebuild before claiming APK matches git.

---

## 4. Uncommitted work (must audit / decide)

`git status` at handover (on `master`, tracking `origin/master`):

### Modified (intended rebrand polish — **not committed**)

| File | Change summary |
|------|----------------|
| `pages/connect.vue` | Nightshelf title treatment, Logo styling, GitHub → Nomadcxx |
| `pages/account.vue` | GitHub footer → Nomadcxx |
| `nuxt.config.js` | `title: Nightshelf`, Play URL `com.nightshelf.app` |
| `ionic.config.json` | `name: nightshelf` |
| `static/Logo.png` | Replaced with NightShelf star mark |
| `static/favicon.ico` | Regenerated from mark |
| `strings/en-us.json` | Softer “library server” copy; Nightshelf-named required/GitHub strings |
| `android/.../strings.xml` (main + debug) | Widget description → “Nightshelf playback” |
| `components/connection/ServerConnectForm.vue` | Grammar: “an Audiobookshelf server” |
| `package-lock.json` | Lockfile drift (audit whether accidental npm install) |

### Untracked

| Path | Notes |
|------|--------|
| `.agents/` | Local agent skill install; usually should **not** ship |
| `skills-lock.json` | Same — local tooling |
| `static/favicon-64.png` | New asset; decide if referenced / should be committed |

**Audit action:** Diff each file; either commit as `feat(brand): …` / `chore(brand): …` or discard. Do not commit secrets; none expected here.

---

## 5. Intentional non-changes / compatibility traps

Auditors should **not** treat these as accidental leftovers without reading context:

1. **OAuth / custom URL scheme stays `audiobookshelf`**  
   - `android/.../strings.xml` → `custom_url_scheme`  
   - `ServerConnectForm.vue` → `audiobookshelf://oauth`  
   - `build.gradle` → `appAuthRedirectScheme`: `com.audiobookshelf.app`  
   Changing these breaks OpenID redirect with stock ABS servers.

2. **Kotlin namespace remains `com.audiobookshelf.app`**  
   Only `applicationId` / labels / Capacitor app id were thinned to Nightshelf.

3. **Server product name “Audiobookshelf” remains in copy where accurate**  
   e.g. required-server message still names Audiobookshelf as the server; client is Nightshelf.

4. **iOS tree untouched** by design.

5. **EpubReader internal themes** out of scope for app chrome themes.

---

## 6. Known gaps / review findings (pre-existing from implementation review)

Use these as a defect checklist — not all were fixed this session:

| Severity | Issue | Where to look |
|----------|--------|----------------|
| Medium | Download progress indicator removed from appbar and **not relocated** | `components/app/Appbar.vue`, downloading UI |
| Medium | Continue-listening hero may hide / crowd the rest of continue shelf | `pages/index.vue`, home continue components |
| Low | Phosphor map still thin; many Material Symbol fallbacks | `PhIcon.vue` / IconBtn usage |
| Low | Year-in-review / stats may still watermark “audiobookshelf” | `components/stats/YearInReview*.vue` |
| Low | `TextInput` or other components may still carry `light` theme CSS leftovers | Grep `data-theme.*light`, `theme.*light` |
| Info | User mock `Nightwatch_android_hero.png` was missing; generated hero lives at `static/branding/nightshelf-hero.png` | Branding folder |
| Info | Debug package id suffix `.debug` — testers must open **Nightshelf** debug build, not Play store ABS | `applicationIdSuffix` in `build.gradle` |

---

## 7. Audit checklist (recommended procedure)

### A. Spec / plan conformance

1. Read design spec + plan tasks 1–15.
2. For each task area in §2, confirm files exist and behavior matches locked decisions (themes, no light, English-only, Android-only).
3. Confirm `dark`/`light` theme keys migrated to `night` (storage migration in `init.client.js` / `localStore`).

### B. Branding consistency

```bash
rg -i 'audiobookshelf' --glob '!node_modules/**' --glob '!.worktrees/**' --glob '!android/.gradle/**' \
  pages/ components/ strings/en-us.json nuxt.config.js ionic.config.json capacitor.config.json \
  android/app/src/main/res/
```

Classify each hit: **keep** (server/OAuth/package), **rebrand** (user-facing app name), or **bug**.

### C. Auth regression (#1909 + follow-ups)

- Token refresh should **not** logout on transient/retry failures (`nativeHttp` / `a42f0327`).
- Logout only on genuine refresh rejection (`f1c44d36`).
- iOS auth paths skipped intentionally — do not “fix” by porting unless scoped.

### D. Notification covers (#1917)

- HQ bitmap path in `CoverImageLoader.kt`; Glide size override removed (`ac66ec4c`).
- Smoke: play media → notification / lock-screen art quality.

### E. Theme / UI smoke (device or emulator)

1. Fresh install → default theme is **night**, StatusBar matches.
2. Settings: switch `night` / `terminal` / `black`; no light option.
3. Connect screen shows **Nightshelf** + new logo (after rebuild with uncommitted assets).
4. Player: synthwave progress while playing; reduced-motion path sane.
5. Bookshelf: Eldritch shelf chrome, denser layout; no broken wood-panel regressions.
6. Language: no locale picker; UI English.

### F. Build hygiene

1. Rebuild with JDK 21 recipe in §3 after any commit.
2. Confirm `adb install -r` on **physical device** (user preference) when USB debugging available.
3. Decide fate of uncommitted + untracked files in §4.

### G. Git hygiene for auditor

- Do **not** amend pushed commits on `master` unless user explicitly requests.
- Uncommitted work should be a **new** commit if accepted.
- `.agents/` / `skills-lock.json` — exclude unless project policy says otherwise.

---

## 8. Environment notes (build pitfalls)

| Pitfall | Fix |
|---------|-----|
| `invalid source release: 21` | Use `JAVA_HOME=/usr/lib/jvm/java-21-openjdk` |
| `npx nuxt` pulls Nuxt 4 | Use `./node_modules/.bin/nuxt generate` |
| Emulator Qt/Wayland crash | `DISPLAY=:0 QT_QPA_PLATFORM=xcb` when starting emulator |
| SDK | `~/Android/Sdk`; `android/local.properties` → `sdk.dir` |
| AVD | `nightshelf_api34` |

---

## 9. Suggested next actions for the next agent

1. **Audit** using §7 (do not start new features until audit notes are filed).
2. **Commit or revert** §4 uncommitted rebrand polish.
3. **Physical device test** via `adb install -r` when phone is connected.
4. Triage §6 gaps (download indicator restore is the highest product-visible gap).
5. Optional: expand Phosphor map; Year-in-review watermark → Nightshelf if in brand scope.

---

## 10. Quick file index for auditors

```
docs/superpowers/specs/2026-07-14-nightshelf-design.md
docs/superpowers/plans/2026-07-14-nightshelf-implementation.md
docs/superpowers/handovers/2026-07-14-nightshelf-session-handover.md   ← this file

assets/tailwind.css
assets/fonts.css
plugins/init.client.js
plugins/nativeHttp.js
plugins/axios.js
components/ui/PhIcon.vue
components/ui/SynthwaveProgress.vue
pages/connect.vue          ← uncommitted rebrand
pages/index.vue
pages/settings.vue
strings/en-us.json         ← uncommitted string tweaks
android/app/build.gradle
android/app/src/main/res/values/strings.xml
static/branding/
static/Logo.png            ← uncommitted binary replace
```

---

*Generated for audit handoff. Prefer evidence from `git log`, `git diff`, and device smoke over this narrative if they disagree.*
