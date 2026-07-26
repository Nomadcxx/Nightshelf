package com.audiobookshelf.app.player

import android.content.Context
import android.support.v4.media.MediaMetadataCompat
import android.util.Log
import com.audiobookshelf.app.R
import com.audiobookshelf.app.data.*
import com.audiobookshelf.app.media.getUriToDrawable

/**
 * The Android Auto browse hierarchy.
 *
 * The root menu deliberately has a *stable shape*. It previously added
 * "Continue" only once something was in progress and "Recent" only once recents
 * had loaded, so tabs appeared underneath the driver's finger as data arrived.
 * A menu that reorders itself while being read is a hazard in a car, so the root
 * now depends only on whether a server library is reachable — a condition that
 * does not flip during a browse — and empty tabs simply come up empty.
 */
class BrowseTree(
  val context: Context,
  itemsInProgress: List<ItemInProgress>,
  libraries: List<Library>,
  recentsLoaded: Boolean
) {
  private val mediaIdToChildren = mutableMapOf<String, MutableList<MediaMetadataCompat>>()

  private fun browseTab(mediaId: String, titleResId: Int, iconResId: Int): MediaMetadataCompat =
    MediaMetadataCompat.Builder().apply {
      putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, mediaId)
      putString(MediaMetadataCompat.METADATA_KEY_TITLE, context.getString(titleResId))
      putString(
        MediaMetadataCompat.METADATA_KEY_ALBUM_ART_URI,
        getUriToDrawable(context, iconResId).toString()
      )
    }.build()

  init {
    val rootList = mediaIdToChildren[AUTO_BROWSE_ROOT] ?: mutableListOf()

    // One icon family throughout. These previously mixed ExoPlayer's own
    // glyphs with Material Design Icons, which read as two different apps.
    val continueListeningMetadata =
      browseTab(CONTINUE_ROOT, R.string.auto_browse_continue, R.drawable.md_book_open_blank_variant_outline)
    val recentMetadata =
      browseTab(RECENTLY_ROOT, R.string.auto_browse_recent, R.drawable.md_clock_outline)
    val librariesMetadata =
      browseTab(LIBRARIES_ROOT, R.string.auto_browse_libraries, R.drawable.md_book_multiple_outline)
    val downloadsMetadata =
      browseTab(DOWNLOADS_ROOT, R.string.auto_browse_downloads, R.drawable.md_download_outline)

    val hasServerLibraries = libraries.isNotEmpty()

    if (hasServerLibraries) {
      // Fixed order, always all four. Continue and Recent stay present even
      // while empty rather than popping in once their data arrives.
      rootList += continueListeningMetadata
      rootList += recentMetadata
      rootList += librariesMetadata

      libraries.forEach { library ->
        // Skip libraries without audio content
        if (library.stats?.numAudioFiles == 0) return@forEach
        Log.d("BrowseTree", "Library $library | ${library.icon}")
        // Generate library list items for Libraries menu
        val libraryMediaMetadata = library.getMediaMetadata(context)
        val children = mediaIdToChildren[LIBRARIES_ROOT] ?: mutableListOf()
        children += libraryMediaMetadata
        mediaIdToChildren[LIBRARIES_ROOT] = children

        if (recentsLoaded) {
          // Generate library list items for Recent menu
          val recentlyMediaMetadata = library.getMediaMetadata(context, "recently")
          val childrenRecently = mediaIdToChildren[RECENTLY_ROOT] ?: mutableListOf()
          childrenRecently += recentlyMediaMetadata
          mediaIdToChildren[RECENTLY_ROOT] = childrenRecently
        }
      }
    } else if (itemsInProgress.isNotEmpty()) {
      // No server reachable, but local progress exists and is worth resuming.
      rootList += continueListeningMetadata
    }

    rootList += downloadsMetadata

    mediaIdToChildren[AUTO_BROWSE_ROOT] = rootList
  }

  operator fun get(mediaId: String) = mediaIdToChildren[mediaId]
}

const val AUTO_BROWSE_ROOT = "/"
const val CONTINUE_ROOT = "__CONTINUE__"
const val DOWNLOADS_ROOT = "__DOWNLOADS__"
const val LIBRARIES_ROOT = "__LIBRARIES__"
const val RECENTLY_ROOT = "__RECENTLY__"
