# IzzyOnDroid inclusion request

Ready to paste as a new issue at <https://codeberg.org/IzzyOnDroid/repodata/issues>.

File it **after** tagging a release whose APK is attached to the GitHub release,
because IzzyOnDroid reads the Fastlane tree from the same tag it takes the APK
from. A request filed against a tag with no `fastlane/` directory gets a listing
with no description and no screenshots.

Why IzzyOnDroid rather than f-droid.org: the main repo builds every app from
source on its own servers and will not link Google's proprietary Cast framework,
which this app inherits from upstream. That is the same reason the app this one
forks is on IzzyOnDroid and not in the main repo. Removing Cast would open the
main repo up, at the cost of dropping a feature upstream users have.

---

**Title:** `[App] NightShelf — Audiobookshelf client rebuilt for phones used at night`

---

### App

| | |
|---|---|
| Package | `com.nightshelf.app` |
| Name | NightShelf |
| Source | https://github.com/Nomadcxx/Nightshelf |
| Releases | https://github.com/Nomadcxx/Nightshelf/releases |
| Licence | GPL-3.0-only |
| minSdk / targetSdk | 24 / 36 |
| APK size | ~18 MB |
| Fastlane | `fastlane/metadata/android/en-US/` in the repo, at the release tag |

### What it is

An audiobook and podcast player for a self-hosted Audiobookshelf server. It
hosts nothing and has no account of its own — you point it at your own server.

### Fork disclosure

This is a fork of [advplyr/audiobookshelf-app](https://github.com/advplyr/audiobookshelf-app),
which is already in this repo as `com.audiobookshelf.app`. Per the inclusion
policy for forks:

- **Distinct package name** — `com.nightshelf.app`, so both install side by side.
- **Distinct display name** — NightShelf.
- **Distinct icon and featureGraphic** — drawn for this fork, not the upstream mark.
- **Original screenshots and descriptions** — captured from this build against a
  public-domain LibriVox library; none copied from upstream.
- **Credit** — upstream authorship, the GPL-3.0 licence and the notices are kept,
  every change is in the commit history, and the description states that
  Audiobookshelf neither endorses nor supports the fork.
- **Maintenance** — actively developed and used daily against a ~1,900 item library.

The fork exists for the UI: a resume hero on Home, four covers per row instead of
two, a long-press panel on every cover, five themes including a true `#000000`
OLED one, and fixes to Android Auto and to keyboard/TalkBack navigation.

### Anti-features

- **NonFreeComp** — Google Cast support is inherited from upstream and links
  Google's proprietary Cast framework, which pulls in parts of Google Play
  services. This is the only non-free component.

There is no analytics, no crash reporting, no advertising, no account system and
no self-update mechanism. The app connects only to the Audiobookshelf server the
user configures.

`android:usesCleartextTraffic` is set, and a Network Security Config permits
cleartext, because self-hosted Audiobookshelf servers are commonly reached over
plain HTTP on a LAN. Upstream does the same.

### Testing it

The app needs a server, so there is nothing to see without one. A demo server can
be provided on request for the functional check.
