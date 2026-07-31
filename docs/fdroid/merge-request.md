## Required

* [x] The app complies with the [inclusion criteria](https://f-droid.org/docs/Inclusion_Policy)
* [x] The original app author has been notified (and does not oppose the inclusion) <!--I am the author of NightShelf. It is a fork of advplyr/audiobookshelf-app under GPL-3.0, published under its own application ID and name, with upstream authorship and notices kept. See "Fork distinctiveness" below.-->
* [x] All related [fdroiddata](https://gitlab.com/fdroid/fdroiddata/issues) and [RFP issues](https://gitlab.com/fdroid/rfp/issues) have been referenced in this merge request <!--There are none. No RFP issue was opened for this app; this merge request is the first request.-->
* [x] Builds with `fdroid build` and all pipelines pass
* [x] There is an issue tracker and contact info of the author so that we can report bugs and contact the author.

## Strongly Recommended

* [x] The upstream app source code repo contains the app metadata _(summary/description/images/changelog/etc)_ in a [Fastlane](https://gitlab.com/snippets/1895688) or [Triple-T](https://gitlab.com/snippets/1901490) folder structure <!--fastlane/metadata/android/en-US in the app repo: title, short and full description, icon, feature graphic, phone screenshots and a changelog per version code.-->
* [x] Releases are tagged and auto update is enabled <!--UpdateCheckMode: Tags, AutoUpdateMode: Version.-->

## Suggested

* [ ] External repos are added as git submodules instead of srclibs <!--Not applicable: no srclibs and no external repos. Everything comes from npm and Maven Central.-->
* [ ] Enable [Reproducible Builds](https://f-droid.org/docs/Reproducible_Builds) <!--No, I don't want this. The build runs `nuxt generate` before Gradle and I have not shown that stage to be byte-reproducible, so I would rather not hold up the submission on it.-->
* [ ] Multiple apks for native code <!--Not applicable: no native code of our own, and the universal APK is 16 MB.-->

---------------------

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
`firebase` entries in the package, and no Cast classes in the dex.

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

* **Node comes from Debian.** The buildserver image has no Node at all. trixie
  carries nodejs 20.19 and npm 9.2, which reads this repo's lockfileVersion 3
  lockfile, so `apt-get install npm` is enough.
* **Nuxt must run from the local binary.** `npx nuxt` fetches Nuxt 4, which
  fails against this Nuxt 2 project, so `prebuild` calls
  `./node_modules/.bin/nuxt`.

`init` and `prebuild` start in `subdir`, so both begin with `cd ../..` to reach
the project root where `package.json` lives. The build then runs in two stages:
Nuxt generates the web layer, Capacitor copies it into the Android project, and
Gradle runs against `android/app`. `scandelete: node_modules` drops the npm tree
before the scanner sees it, since it is full of prebuilt binaries that are not
shipped in the APK.

### Cleartext traffic

`android:usesCleartextTraffic` is set and the Network Security Config permits
cleartext, because people reach self-hosted Audiobookshelf servers over plain
HTTP on a LAN. Upstream does the same. Flagging it here since it is the kind of
thing a reviewer notices.

/label ~"New App"
