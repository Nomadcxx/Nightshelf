# Review: Google Cast removal (`5e37c008`)

**Reviewer:** independent pass against tree at `67d276ec`  
**Subject:** `docs/audit/cast-removal-handover.md` + commit `5e37c008`  
**Verdict:** removal is clean and correctly scoped. Ship-before-device-test was process failure; do not file F-Droid or tell users until hardware smoke passes.

---

## Summary

The handover is honest, ordered, and checkable. The diff matches what it claims. Static evidence that proprietary Cast/Play-services is gone is strong. Static evidence that playback still works is absent — same gap the author flagged.

I re-checked the risky collapses. Risk 4 is lower than written. Risks 1, 2, 3, 6 still block any claim of “good.”

---

## Diff vs claims

| Claim | Check |
|---|---|
| 2,208 / 38 / 25 files | Matches `git show --stat` |
| Commit + follow-ups | `5e37c008`, `025f21e0`, `c3a0eb3e` present |
| `extension-cast` gone | Both local-project and maven arms in `build.gradle` |
| `play-services-base` force gone | Yes |
| Cast Kotlin types deleted | `CastManager`, `CastPlayer`, `CastTimeline*`, `CastTrackSelection`, `CastOptionsProvider` |
| Manifest: OPTIONS_PROVIDER out, Auto meta in | Yes, with accurate comment |
| No leftover Cast hooks in app source | `rg` over `*.{kt,java,vue,js,xml,gradle}`: zero hits for cast player / isCasting / requestSession / OPTIONS_PROVIDER / onMediaPlayerChanged |
| Size / APK scan / tests | Not re-run here; handover’s reproduce steps are enough for a second pair of hands |

---

## PlayerNotificationService

Read `git show 5e37c008 -- …/PlayerNotificationService.kt` against current file.

Every removed piece had a Cast-only purpose:

| Removed | Second purpose? |
|---|---|
| `castPlayer`, `PLAYER_CAST`, Cast `preparePlayer` arm | No |
| `switchToPlayer` | No — only Cast bridge |
| `isSwitchingPlayer` | No — written only in `switchToPlayer`, read only in `PlayerNotificationListener` on non-user notification cancel. **Both ends removed together.** Leaving either would have been a bug. |
| Volume remote/local helpers + `remoteVolumeProvider` | No — field was write-only after set |
| `onMediaPlayerChanged` | No — only fired from `switchToPlayer` |
| Cast-guarded custom-action filter | Simplifies to “multi-item → chapter skip actions”; correct for single local player |

`getMediaPlayer() → PLAYER_EXO` is right to keep. Sessions and the web layer still key on that string.

**No removed branch looked dual-purpose.**

---

## MediaItem tag

In-repo:

- No `setTag` / `localConfiguration` usage remains under `android/`.
- Queue navigator builds `MediaDescriptionCompat` from `currentPlaybackSession`, not MediaItem tags (`PlayerNotificationService.kt` ~315–368).
- `AbMediaDescriptionAdapter` goes through `MediaControllerCompat`.

Handover’s “only reader was CastPlayer” holds for this tree. I did not pull exoplayer/`extension-mediasession` sources outside the repo; if a local exoplayer checkout exists on the next machine, still worth a one-line `rg 'localConfiguration\.tag|\.tag'`. Low residual risk: tag was payload for Cast queue items, not for notification/Auto.

---

## Risk register — independent judgment

### 1. Playback E2E — **BLOCKER**

Author edited the service that owns player, notification, and session. Unit suite does not touch that Kotlin. APK scan proves Cast absence only.

**Do not call this good until:** stream, download, seek, chapter skip, notification pause, lock screen, track boundary.

Agree with author: failure modes are start fail, missing notification, stalled transitions.

### 2. Media session volume — **LOW, optional one-liner**

Reasoning holds: `MediaSessionCompat` is local until `setPlaybackToRemote`; nothing calls remote anymore; `setPlaybackToLocal` only undid Cast.

Belt if volume keys misbehave on device:

```kotlin
mediaSession.setPlaybackToLocal(AudioManager.STREAM_MUSIC)
```

once after session create. Not required from static reading. Do not restore the old helper pair.

### 3. Widget icons — **CHECK ON DEVICE**

Paths are standard Material:

- play: `M8,5v14l11,-7z`
- pause: `M6,19h4V5H6v14zM14,5v14h4V5h-4z`

Vendoring instead of keeping mediarouter is correct. Still unrendered on hardware.

### 4. Collapsed local-vs-server branches — **SAFE (stronger than handover)**

**`LazyListBookCard.vue`:** pre-change second arm used `this.hasLocal`, which **was never defined** on that component. Always falsy. Live path was only `localLibraryItem && !isCasting`. Collapse to `if (this.localLibraryItem)` is exact for non-cast and deletes dead code.

**`pages/item/_id/index.vue`:**

```js
hasLocal() {
  return this.isLocal || this.libraryItem.localLibraryItem
},
localLibraryItem() {
  if (this.isLocal) return this.libraryItem
  return this.libraryItem.localLibraryItem || null
},
```

`hasLocal` true ⇒ `localLibraryItem` truthy by construction. `libraryItemId = this.localLibraryItem.id` cannot NPE on that arm.

Podcast cast branch (`serverLibraryItemId && isCasting`) correctly removed; local episode path kept and still emits `serverEpisodeId` on the event.

### 5. `serverEpisodeId` on container — **SAFE statically**

Removed only the container field and the cast-only writers/readers (`castLocalItem`, cast dialog). `play-item` payloads still carry `serverEpisodeId` from item/episode pages. Bookmarks still use `serverLibraryItemId`. Still worth a device check on downloaded podcast progress sync (author’s check list).

### 6. Android Auto — **UNTESTED, shared surface**

Untouched by intent, shares PNS + session. Upstream had defects here. Needs DHU or car. Not a Cast-regression suspect beyond “we touched the shared service.”

### 7. F-Droid metadata — **DRAFT, correctly labeled**

Do not submit until `fdroid build` and device smoke.

---

## Process

Tagging `v0.1.2-beta` with zero device runs after editing `PlayerNotificationService` was wrong, even with user pressure and a frank commit message.

Mitigations already in place:

- Nobody told about the release
- F-Droid not filed
- Same signing key → `v0.1.1-beta` overlays cleanly
- Handover leads with the gap

**Recommendation:** keep the tag as an untested beta artifact. Gate user-facing and F-Droid on the seven hardware checks. If playback is broken, prefer fix-forward on a patch tag over revert unless Cast must return.

---

## Handover quality

| Good | Nit |
|---|---|
| Risk-first, ordered | Risk 4 overstated uncertainty on `hasLocal` |
| Reproduce commands | LazyListBookCard second arm was dead, not “likely safe” |
| Rollback path clear | |
| Asks concrete reviewer actions | |
| Separates APK proof from playback proof | |

No padding. Usable as the audit trail for F-Droid later.

---

## Residual / ignore

- Phosphor `cast` / `cast_connected` glyphs still in `assets/icons/phosphor-map.js` — unused, harmless. Delete only if you want icon-map hygiene.
- `build.gradle` comment typo: “Droping” → “Dropping” (docs-only).

---

## Reviewer checklist (answers)

1. **PNS removed branches dual-purpose?** No.
2. **MediaItem tag?** No in-repo readers; notification/Auto path uses `currentPlaybackSession`. External exoplayer skim still nice-to-have.
3. **Seven hardware checks?** Not run here — still required.
4. **`setMediaSessionToLocalVolume` back?** Optional one-shot at setup if volume misbehaves; not required from static review.
5. **Ship before device test?** Wrong. Acceptable only as labeled untested beta with no distribution. Do not expand blast radius.

---

## Go / no-go

| Gate | Status |
|---|---|
| FOSS / F-Droid dependency goal | **Go** (static) |
| Merge/keep commit in tree | **Go** |
| Tell users / F-Droid submit | **No-go** until risks 1, 3, 6 (and quick 2, 4, 5) pass on hardware |
| Revert | Only if device proves local playback regressed and fix-forward is slower than restore |

**Bottom line:** deletion is the right shape and the lazy one. Evidence stops at “Cast is gone and it compiles.” Finish on a phone before anyone else installs it.
