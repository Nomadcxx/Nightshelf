<div align="center">
  <img src="docs/header.png" alt="NightShelf" width="920" />

  <p>
    <img src="https://img.shields.io/badge/status-beta-A48CF2?style=for-the-badge" alt="beta" />
    <img src="https://img.shields.io/badge/Android-7.0%2B-7CFFB2?style=for-the-badge&logo=android&logoColor=black" alt="Android 7.0+" />
    <img src="https://img.shields.io/badge/licence-GPL--3.0-7CFFB2?style=for-the-badge" alt="GPL-3.0" />
  </p>

  <p>A fork of the <a href="https://github.com/advplyr/audiobookshelf-app">Audiobookshelf Android app</a>, rebuilt for phones used at night.</p>

  <p>Same server, same sync, same downloads. Denser shelves, five themes, and a long press that does something.</p>

  <p>
    <a href="https://github.com/Nomadcxx/Nightshelf/releases">Releases</a>
    ·
    <a href="https://github.com/Nomadcxx/Nightshelf/issues">Issues</a>
    ·
    <a href="https://www.audiobookshelf.org">Audiobookshelf</a>
  </p>
</div>

---

## Features

- **Resume hero**: whatever you are part-way through sits at the top of Home with time remaining and one control
- **Four covers per row**: rails dropped from 205px to 104px, and the library grid solves for columns against screen width
- **Shelf glass**: every rail sits on a blurred wash of its own leading cover, so the colour under the glass shifts as you scroll
- **Long press**: hold a cover for 420ms and it lifts with that item's actions underneath
- **Five themes**: Night, Black OLED, Terminal, Graphite and Ember, switchable from Settings. Black OLED is genuinely `#000000`, so the pixels are off
- **Motion control**: System, Full or Reduced, with Android's own reduced-motion request always winning
- **Semantic haptics**: six named intents, so the mapping from meaning to intensity lives in one place rather than at each call site
- **Keyboard and TalkBack**: shelf cards take focus and answer to Enter or Space; the long-press panel traps focus and restores it on close
- **Android Auto**: four defects fixed, including one that truncated every library at 100 items

## Themes

Same library, same scroll position. Three of the five below; Graphite and Ember are pending a fresh capture.

| Night | Terminal | Black OLED |
|:--:|:--:|:--:|
| <img src="docs/screenshots/theme-night.png" width="240" alt="Library grid in the Night theme" /> | <img src="docs/screenshots/theme-terminal.png" width="240" alt="Library grid in the Terminal theme" /> | <img src="docs/screenshots/theme-black.png" width="240" alt="Library grid in the Black OLED theme" /> |
| Navy ground, lilac accent | Phosphor rules and progress | Deeper ground for OLED |

| Long press | Settings | Drawer |
|:--:|:--:|:--:|
| <img src="docs/screenshots/peek.png" width="240" alt="Long-press panel showing the actions for a book" /> | <img src="docs/screenshots/settings.png" width="240" alt="Settings screen" /> | <img src="docs/screenshots/drawer.png" width="240" alt="Navigation drawer" /> |

## Installation

You need an Audiobookshelf server. NightShelf hosts nothing and sells nothing.

### Download

Grab the APK from [Releases](https://github.com/Nomadcxx/Nightshelf/releases). Android will warn you about installing outside the Play Store, which is expected for a sideloaded build.

It installs alongside the official app rather than replacing it. Different package names, `com.nightshelf.app` and `com.audiobookshelf.app`, so you can keep both.

### Build from source

Requirements: Node 18+, JDK 21, Android SDK.

```bash
git clone https://github.com/Nomadcxx/Nightshelf.git
cd Nightshelf
npm ci

./node_modules/.bin/nuxt generate   # build the web layer
npx cap sync android                # copy it into the Android project

cd android && ./gradlew assembleDebug
```

The APK lands in `android/app/build/outputs/apk/debug/`.

> Two things that will cost you an afternoon. Run Nuxt through the local binary, because `npx nuxt` fetches Nuxt 4 and fails against this Nuxt 2 project. And Capacitor compiles against Java release 21, so JDK 17 stops with `invalid source release: 21`.

Tests run without a browser or a device:

```bash
node --test tests/*.test.js
```

Touching any launcher or notification artwork means running `./scripts/sync-debug-mipmaps.sh` afterwards, because Android merges `src/debug/res/` over `src/main/res/` and a stale debug mipmap replaces the real icon silently.

## Status

Beta, running daily against a 1,928-item library on a Pixel 8 Pro. Not there yet: iOS, and any store listing.

## Licence

GPL-3.0, inherited from Audiobookshelf. Upstream copyright belongs to [advplyr and the Audiobookshelf contributors](https://github.com/advplyr/audiobookshelf-app/graphs/contributors); this fork modifies that work, keeps the licence and notices, and records every change in the commit history. Audiobookshelf neither endorses nor supports it.
