NightShelf is an audiobook and podcast player for a self-hosted Audiobookshelf
server. It hosts nothing and has no account of its own: you point it at your own
server.

It is a fork of [advplyr/audiobookshelf-app](https://github.com/advplyr/audiobookshelf-app),
rebuilt around dark-room, one-handed use. A resume hero on Home, four covers per
row instead of two, a long-press panel on every cover, five themes including a
true `#000000` OLED one, and fixes to Android Auto and to keyboard and TalkBack
navigation.

* Source: https://github.com/Nomadcxx/Nightshelf
* Licence: GPL-3.0-only
* Package: `com.nightshelf.app`

### Free software throughout

The app this forks links Google's proprietary Cast framework, through
exoplayer's `extension-cast`, which pulls in part of Google Play services. That
is why it sits on IzzyOnDroid under `NonFreeComp` and `NonFreeNet` rather than
here.

Cast is removed in NightShelf, along with `androidx.mediarouter`, which had come
in behind it. Users lose Chromecast. Android Auto still works, running through
`androidx.media`.

Verified against the built APK: no `play-services`, `gms`, `mediarouter` or
`firebase` entries in the package, and no Cast classes in the dex. The release
APK is 17.3 MB, down from 19.0 MB before the removal.

There are no anti-features to declare. No analytics, no crash reporting, no
advertising, no account system, no self-update. The app talks to the server the
user configures and to nothing else.

### Fork distinctiveness

Own package name so it installs beside upstream, own display name, own icon and
feature graphic, and screenshots captured from this build against a
public-domain LibriVox library rather than copied from upstream. Upstream
authorship, the GPL-3.0 licence and the notices are kept, every change is in the
commit history, and the description states that Audiobookshelf neither endorses
nor supports the fork.

### Build notes

Two things about this project are worth knowing before building it:

* **Nuxt must run from the local binary.** `npx nuxt` fetches Nuxt 4, which
  fails against this Nuxt 2 project, so `prebuild` calls
  `./node_modules/.bin/nuxt`.
* **JDK 21.** Capacitor compiles against Java release 21, so JDK 17 stops with
  `invalid source release: 21`. Gradle 8.11.1 rejects Java 25. The `sudo` block
  installs and selects `openjdk-21-jdk`.

The build runs in two stages: Nuxt generates the web layer, Capacitor copies it
into the Android project, then Gradle runs against `android/app`.

### Cleartext traffic

`android:usesCleartextTraffic` is set and the Network Security Config permits
cleartext, because people reach self-hosted Audiobookshelf servers over plain
HTTP on a LAN. Upstream does the same. Flagging it here since it is the kind of
thing a reviewer notices.
