# Handover: Google Cast removal

**Status: shipped as v0.1.2-beta, never run on a phone.** Read the
[risk register](#risk-register) before you trust it.

This document hands the change to an independent reviewer. It says what moved,
why each deletion looked safe, what evidence exists, and where that evidence
runs out.

| | |
|---|---|
| Commit | `5e37c008` |
| Follow-ups | `025f21e0` docs, `c3a0eb3e` checksum fix |
| Released as | `v0.1.2-beta`, version code 3 |
| Size | 2,208 lines deleted, 38 added, across 25 files |
| Previous good release | `v0.1.1-beta`, version code 2 |

## Why the change happened

The user asked for NightShelf on F-Droid. F-Droid builds every app from source
on its own servers and refuses proprietary dependencies. NightShelf carried
one: Google Cast, inherited from upstream through exoplayer's `extension-cast`,
which pulls in `play-services-cast-framework` and part of Google Play services.

That dependency is why `audiobookshelf-app` sits on IzzyOnDroid under
`NonFreeComp` and `NonFreeNet` flags instead of in the main F-Droid repository.
Removing it moves NightShelf into the main repository and drops the flags.

The user asked for the removal after I laid out that trade. Chromecast support
is the cost.

## What changed, and why each piece looked safe

### Deleted outright

`CastManager`, `CastPlayer`, `CastTimeline`, `CastTimelineTracker`,
`CastTrackSelection`, `CastOptionsProvider`. Nothing outside the Cast path
referenced them.

### PlayerNotificationService

This is the file that matters. It held two players, `mPlayer` and `castPlayer`,
with `currentPlayer` pointing at one of them.

| Removed | Reasoning |
|---|---|
| `castPlayer` field | No second player left |
| `switchToPlayer()` | Its only caller sat inside a Cast branch that also went |
| `isSwitchingPlayer` | Set true only inside `switchToPlayer` |
| `setMediaSessionToCastVolume()` | Built a `VolumeProviderCompat` around `castPlayer` |
| `setMediaSessionToLocalVolume()` | Called only from `switchToPlayer` |
| `remoteVolumeProvider` field | Written in the two volume methods, read nowhere |
| `PLAYER_CAST` const | No player answers to it now |
| `onMediaPlayerChanged` event | Fired only from `switchToPlayer` |
| Cast branches in `preparePlayer` | Guarded on `mediaPlayer == PLAYER_CAST` |

`getMediaPlayer()` survives and returns `PLAYER_EXO`. The web layer and the
server API each key playback sessions on that string, so it has to keep
returning something.

### PlaybackSession

Lost `getQueueItem()` and `getCastMediaMetadata()`, and stopped calling
`setTag(queueItem)` when building MediaItems.

I checked the tag question, because a wrong answer here breaks the notification
and Android Auto rather than Cast. `CastPlayer.kt:160` held the only read:
`(mediaItem.localConfiguration!!.tag as MediaQueueItem?)!!`. The queue navigator
at `PlayerNotificationService.kt:340` builds its `MediaDescriptionCompat` from
`currentPlaybackSession`, and `AbMediaDescriptionAdapter` goes through
`MediaControllerCompat`. Neither touches a MediaItem tag.

### The widget icons

Dropping Cast dropped `androidx.mediarouter` with it, which had been supplying
`ic_media_play_dark` and `ic_media_pause_dark` to the home screen widget. The
build failed on a missing drawable and that is how I found it.

I vendored two Material vectors as `widget_icon_play.xml` and
`widget_icon_pause.xml`, matching the `exo_icon_*` drawables already in the
tree. **Nobody has looked at the widget since.** See risk 3.

### Web layer

Removed the Cast control from the player header and the drawer, the `isCasting`
and `isCastAvailable` store state, and three branches that chose a server item
over a downloaded one while a cast was running.

Two of those branches collapsed rather than vanished, and both deserve a second
pair of eyes:

`LazyListBookCard.vue:391`, before:

```js
if (this.localLibraryItem && !this.isCasting) {
  libraryItemId = this.localLibraryItem.id
} else if (this.hasLocal) {
  libraryItemId = this.localLibraryItem.id
}
```

after:

```js
if (this.localLibraryItem) {
  libraryItemId = this.localLibraryItem.id
}
```

`pages/item/_id/index.vue:613` collapsed the same shape. My reasoning: with
`isCasting` pinned false, the first arm covers every case the second one could,
so long as `hasLocal` implies `localLibraryItem` is truthy. **I did not verify
that implication.** See risk 4.

`serverEpisodeId` came out of `AudioPlayerContainer`, having had no reader other
than the Cast path. `serverLibraryItemId` stays, because bookmarks are a server
concept looked up by it.

### Manifest

Removed the `OPTIONS_PROVIDER_CLASS_NAME` meta-data. Kept the two
`com.google.android.gms.car.*` entries: those are name strings Android Auto
looks for, not a dependency on any Google library. Auto runs through
`androidx.media`.

## Evidence that exists

Static checks, all reproducible:

- **No proprietary code in the shipped APK.** I downloaded the published
  `v0.1.2-beta` artifact rather than trusting the CI run. Zero entries matching
  `play-services`, `gms`, `mediarouter` or `firebase`. No Cast classes in the
  dex.
- **Signature intact.** `apksigner` reports `CN=NightShelf, OU=NightShelf,
  O=Nomadcxx`, so the release still upgrades over v0.1.1-beta.
- **Checksum matches** the published `SHA256SUMS.txt`.
- **Compiles clean**, debug and signed release.
- **148 unit tests pass.**
- **Size fell** from 19.0 MB to 17.3 MB, which is consistent with Play services
  leaving the package.

Reproduce the APK check with:

```bash
gh release download v0.1.2-beta --repo Nomadcxx/Nightshelf
unzip -l nightshelf-v0.1.2-beta.apk | grep -icE 'play-services|gms|mediarouter|firebase'
```

## Where the evidence runs out

The unit suite covers theme tokens, view transitions and utility code. **It
executes none of the Kotlin I edited.** No instrumentation tests exist. The APK
scan proves Cast is absent; it proves nothing about whether audio still plays.

No phone was attached at any point during this work.

## Risk register

Ordered by what I would check first.

### 1. Playback on a device, untested end to end

I edited the service that owns playback, the notification and the media
session. Nothing has played a file since.

**Check:** start a stream, start a downloaded item, seek, skip chapters, pause
from the notification, lock the screen, let it play through a track boundary.

**Failure would look like:** playback failing to start, the notification going
missing, or track transitions stalling.

### 2. Media session volume

`setMediaSessionToLocalVolume()` called `mediaSession.setPlaybackToLocal(STREAM_MUSIC)`.
Its only caller was `switchToPlayer`, so I removed both. My reasoning: a
`MediaSessionCompat` is local by default, and nothing calls `setPlaybackToRemote`
any more, so the explicit call was only ever undoing a Cast session.

**Check:** hardware volume keys during playback, and the volume slider in the
notification.

**Failure would look like:** volume keys changing the wrong stream, or a remote
volume slider appearing with nothing behind it.

**If wrong:** call `setPlaybackToLocal` once during service setup.

### 3. The home screen widget

Two vendored vectors replacing library drawables, never rendered.

**Check:** add the widget, confirm the play icon appears, press it, confirm it
becomes a pause icon.

**Failure would look like:** a blank or clipped button. My pause path
(`M6,19h4V5H6v14zM14,5v14h4V5h-4z`) is hand-written and worth reading.

### 4. The collapsed local-vs-server branches

Two call sites, described above. The question is whether `hasLocal` can be true
while `localLibraryItem` is falsy. If it can, the old second arm would have
thrown, so this is likely safe, but I am reasoning about upstream code I did not
write.

**Check:** play a downloaded book, then a downloaded podcast episode, and
confirm each plays from local storage rather than streaming.

### 5. `serverEpisodeId` removal

Removed as write-only. Podcast episodes carry both a local and a server id, and
that pairing is fiddlier than the book case.

**Check:** bookmarks on a downloaded podcast episode, and progress syncing back
to the server for one.

### 6. Android Auto

Untouched by intent, but it shares `PlayerNotificationService` and the media
session, and it is where upstream had four defects.

**Check:** browse and play through Auto or the Desktop Head Unit.

### 7. F-Droid metadata correctness

`docs/fdroid/fdroid-request.md` carries a `metadata/com.nightshelf.app.yml` I
wrote from the F-Droid docs and never ran through `fdroid build`. Treat it as a
draft.

## What I would ask a reviewer to do

1. Read `git show 5e37c008 -- android/app/src/main/java/com/audiobookshelf/app/player/PlayerNotificationService.kt`
   against the file as it stands, and say whether any removed branch had a
   second purpose beyond Cast.
2. Confirm the MediaItem tag finding independently. Search the exoplayer and
   `extension-mediasession` sources for reads of `localConfiguration.tag`, not
   only this repository.
3. Run the seven checks above on hardware.
4. Judge whether `setMediaSessionToLocalVolume` should come back as a one-time
   call during setup.
5. Say whether the change should have shipped before a device test. I flagged
   the gap and tagged anyway because the user asked for the tag in the same
   breath as the removal. A reviewer may reasonably call that wrong.

## Rolling back

`git revert 5e37c008` restores Cast and reinstates the proprietary dependency.
The revert touches the widget icons too, so check the widget after.

For users, `v0.1.1-beta` carries the same signing key and installs over
v0.1.2-beta without an uninstall.

Nobody has been told about v0.1.2-beta, and the F-Droid submission has not been
filed, so the blast radius today is whoever finds the release page.
