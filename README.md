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

## Screenshots

<a href="docs/screenshots/home.png"><img src="docs/screenshots/home.png" width="23%" alt="Home screen with the resume hero" /></a>
<a href="docs/screenshots/rails.png"><img src="docs/screenshots/rails.png" width="23%" alt="Library shelves, each carrying a wash from its leading cover" /></a>
<a href="docs/screenshots/peek.png"><img src="docs/screenshots/peek.png" width="23%" alt="Long-press panel showing a book's actions" /></a>
<a href="docs/screenshots/player.png"><img src="docs/screenshots/player.png" width="23%" alt="Full player with waveform progress" /></a>

<sub>Home · Shelves · Long press · Player &nbsp;·&nbsp; tap any shot to enlarge</sub>

## Themes

<a href="docs/screenshots/theme-night.png"><img src="docs/screenshots/theme-night.png" width="19%" alt="Library in the Night theme" /></a>
<a href="docs/screenshots/theme-black.png"><img src="docs/screenshots/theme-black.png" width="19%" alt="Library in the Black OLED theme" /></a>
<a href="docs/screenshots/theme-terminal.png"><img src="docs/screenshots/theme-terminal.png" width="19%" alt="Library in the Terminal theme" /></a>
<a href="docs/screenshots/theme-graphite.png"><img src="docs/screenshots/theme-graphite.png" width="19%" alt="Library in the Graphite theme" /></a>
<a href="docs/screenshots/theme-ember.png"><img src="docs/screenshots/theme-ember.png" width="19%" alt="Library in the Ember theme" /></a>

<sub>Night · Black OLED · Terminal · Graphite · Ember</sub>

Same shelf, same scroll position. Black OLED is genuinely `#000000`, so the pixels are off rather than dark. Screenshots use a public-domain LibriVox library.

## Features

- **Resume hero**: whatever you are part-way through sits at the top of Home, with time remaining and one control
- **Shelf glass**: every rail sits on a blurred wash of its own leading cover, so the colour shifts as you scroll
- **Four covers per row**: rails came down from 205px to 104px, and the grid solves for columns against screen width
- **Long press**: hold a cover for 420ms and it lifts, with that item's actions underneath
- **Five themes**, switchable from Settings
- **Library switching**: pick a library from the drawer, or on first connect. Upstream renders the picker but never opens it
- **Motion control**: System, Full or Reduced, with Android's own reduced-motion request always winning
- **Semantic haptics**: six named intents, so meaning maps to intensity in one place rather than at each call site
- **Keyboard and TalkBack**: shelf cards take focus and answer to Enter or Space; the long-press panel traps focus and restores it on close
- **Android Auto**: four defects fixed, including one that truncated every library at 100 items

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

Working on it? [CONTRIBUTING.md](CONTRIBUTING.md) has the traps that are not obvious from the code.
## Status

Beta, running daily against a 1,928-item library on a Pixel 8 Pro. Not there yet: iOS, and any store listing.

## Licence

GPL-3.0, inherited from Audiobookshelf. Upstream copyright belongs to [advplyr and the Audiobookshelf contributors](https://github.com/advplyr/audiobookshelf-app/graphs/contributors); this fork modifies that work, keeps the licence and notices, and records every change in the commit history. Audiobookshelf neither endorses nor supports it.
