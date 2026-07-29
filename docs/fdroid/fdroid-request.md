# F-Droid submission

NightShelf goes to the main F-Droid repository, not to IzzyOnDroid. Every
dependency is free software, so F-Droid can build it from source on its own
servers.

Upstream cannot go there. `audiobookshelf-app` links Google's proprietary Cast
framework, and F-Droid refuses proprietary dependencies, which is why you find
it on IzzyOnDroid under `NonFreeComp` and `NonFreeNet` flags. Removing Cast is
what separates the two.

Submit only after tagging a release. F-Droid reads `fastlane/` from the commit
it builds, so a tag without that directory produces a listing with no
description and no screenshots.

## What was removed

Google Cast, in commit `5e37c008`. It reached the build through exoplayer's
`extension-cast`, which pulls in `play-services-cast-framework` and part of
Google Play services behind it.

Gone with it: `CastManager`, `CastPlayer`, `CastTimeline`,
`CastTimelineTracker`, `CastTrackSelection`, `CastOptionsProvider`, the manifest
`OPTIONS_PROVIDER_CLASS_NAME` entry, the second player inside
`PlayerNotificationService`, and the Cast controls in the web layer.

Dropping Cast also dropped `androidx.mediarouter`, which had been supplying the
home screen widget's play and pause icons. Those two icons are now vendored
alongside the `exo_icon_*` drawables already in the tree.

You lose Chromecast. Android Auto survives, because it runs through
`androidx.media` rather than anything of Google's. The release APK fell from
19.0 MB to 17.3 MB.

Verified against the built APK: no `play-services`, `gms`, `mediarouter` or
`firebase` entries in the package, and no Cast classes in the dex.

## Before submitting

- [ ] Tag a release, so `Builds[].commit` can name a tag rather than a hash
- [ ] Attach the signed APK to the GitHub release
- [ ] Tell advplyr, since F-Droid asks that upstream knows and does not object
- [ ] Fork <https://gitlab.com/fdroid/fdroiddata>, add the file below, open a
      merge request

## metadata/com.nightshelf.app.yml

Check this against a current file in `fdroiddata` before opening the merge
request. F-Droid changes the schema from time to time, and a stale field is the
most common reason a first submission bounces.

```yaml
Categories:
  - Multimedia
License: GPL-3.0-only
AuthorName: Nomadcxx
SourceCode: https://github.com/Nomadcxx/Nightshelf
IssueTracker: https://github.com/Nomadcxx/Nightshelf/issues

AutoName: NightShelf

RepoType: git
Repo: https://github.com/Nomadcxx/Nightshelf.git

Builds:
  - versionName: 0.1.2-beta
    versionCode: 3
    commit: v0.1.2-beta
    sudo:
      - apt-get update
      - apt-get install -y openjdk-21-jdk
      - update-alternatives --auto java
    init:
      - npm ci
    subdir: android/app
    gradle:
      - yes
    prebuild:
      - pushd $$SRC$$ && ./node_modules/.bin/nuxt generate && npx cap sync android && popd

AutoUpdateMode: Version
UpdateCheckMode: Tags
CurrentVersion: 0.1.2-beta
CurrentVersionCode: 3
```

The description comes from `fastlane/metadata/android/en-US/full_description.txt`,
so the YAML carries no `Description` field.

## Build notes for the reviewer

Two things about this project will waste a reviewer's afternoon, so the merge
request should say them up front.

**Nuxt has to run from the local binary.** `npx nuxt` fetches Nuxt 4, which
fails against this Nuxt 2 project. Use `./node_modules/.bin/nuxt`.

**JDK 21, not 17.** Capacitor compiles against Java release 21, so JDK 17 stops
with `invalid source release: 21`. Gradle 8.11.1 rejects Java 25 as well.

The build runs in two stages: Nuxt generates the web layer, Capacitor copies it
into the Android project, and only then does Gradle run. The `prebuild` step
above covers both.

## Reproducible builds

F-Droid encourages these for new apps and does not require them. Worth setting
up afterwards, so F-Droid can ship the APK signed with the NightShelf key
rather than its own. Users could then move between the GitHub download and the
F-Droid one without uninstalling.

## Fork disclosure for the merge request

F-Droid asks forks to distinguish themselves. NightShelf does:

- Own package name, `com.nightshelf.app`, so it installs beside upstream
- Own display name, icon and feature graphic
- Own screenshots and descriptions, captured from this build against a
  public-domain LibriVox library
- Upstream authorship, the GPL-3.0 licence and the notices all kept, with every
  change in the commit history
- The description says that Audiobookshelf neither endorses nor supports it

## Anti-features

None to declare.

`android:usesCleartextTraffic` is set, and the Network Security Config permits
cleartext, because people reach self-hosted Audiobookshelf servers over plain
HTTP on a LAN. Upstream does the same. F-Droid's anti-feature list does not
cover this, but a reviewer will notice it, so the merge request should explain
it.
