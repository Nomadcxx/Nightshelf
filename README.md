<div align="center">
  <img src="docs/header.png" alt="NightShelf" width="920" />

  <p>
    <img src="https://img.shields.io/badge/status-beta-A48CF2?style=for-the-badge" alt="beta" />
    <img src="https://img.shields.io/badge/Android-7.0%2B-7CFFB2?style=for-the-badge&logo=android&logoColor=black" alt="Android 7.0+" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/licence-GPL--3.0-7CFFB2?style=for-the-badge" alt="GPL-3.0" /></a>
    <a href="#install"><img src="https://img.shields.io/badge/F--Droid-IzzyOnDroid-1976D2?style=for-the-badge&logo=fdroid&logoColor=white" alt="IzzyOnDroid" /></a>
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

<a href="docs/screens.png"><img src="docs/screens.png" alt="Home, shelves, the long-press panel and the player" /></a>

## Themes

<a href="docs/themes.png"><img src="docs/themes.png" alt="The same shelf in Night, Black OLED, Terminal, Graphite and Ember" /></a>

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

<a id="install"></a>

## Install

You need an Audiobookshelf server. NightShelf hosts nothing and sells nothing.

It installs alongside the official app rather than replacing it. Different package names, `com.nightshelf.app` and `com.audiobookshelf.app`, so you can keep both.

### F-Droid

NightShelf is packaged for [**IzzyOnDroid**](https://apt.izzysoft.de/fdroid/), a third-party F-Droid repository. Add it to your F-Droid client once and NightShelf updates with everything else:

```
https://apt.izzysoft.de/fdroid/repo
```

<!-- Swap this for the live badge and listing link the moment the request at
     https://codeberg.org/IzzyOnDroid/repodata/issues is accepted:
     [![](https://img.shields.io/endpoint?url=https://apt.izzysoft.de/fdroid/api/v1/shield/com.nightshelf.app)](https://apt.izzysoft.de/packages/com.nightshelf.app) -->

> Listing pending. The request is drafted in [`docs/fdroid/izzyondroid-request.md`](docs/fdroid/izzyondroid-request.md) and goes in once a release is tagged with the metadata attached.

Not the main F-Droid repository, and neither is the app this forks. F-Droid builds everything from source on its own servers and will not link Google's proprietary Cast framework, which NightShelf inherits from upstream. IzzyOnDroid takes the signed APK instead and flags the dependency.

### APK

Grab it from [Releases](https://github.com/Nomadcxx/Nightshelf/releases) and check it against `SHA256SUMS.txt`. Android will warn you about installing outside the Play Store, which is expected for a sideloaded build.

Releases are signed with a key held outside this repository, so an update always installs over the last one.

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

Beta, running daily against a 1,928-item library on a Pixel 8 Pro. Not there yet: iOS, and the Play Store.

## Licence

GPL-3.0, inherited from Audiobookshelf. Upstream copyright belongs to [advplyr and the Audiobookshelf contributors](https://github.com/advplyr/audiobookshelf-app/graphs/contributors); this fork modifies that work, keeps the licence and notices, and records every change in the commit history. Audiobookshelf neither endorses nor supports it.

Free software, with one asterisk worth stating plainly: Google Cast is inherited from upstream and links Google's proprietary Cast framework, which pulls in parts of Play services. That is the only non-free component. There is no analytics, no crash reporting, no advertising, no account system and no self-update, and the app talks to no server other than the one you point it at.
