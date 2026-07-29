<template>
  <div v-if="!libraryItem" class="w-full h-full relative flex items-center justify-center bg-bg">
    <ui-loading-indicator />
  </div>
  <div v-else id="item-page" class="w-full h-full overflow-y-auto overflow-x-hidden relative bg-bg">
    <!-- cover -->
    <div class="nightglass-detail-cover-stage w-full flex justify-center relative">
      <div style="width: 0; transform: translateX(-50vw); overflow: visible">
        <div style="width: 150vw; overflow: hidden">
          <div id="coverBg" style="filter: blur(5vw)">
            <covers-book-cover :library-item="libraryItem" :width="coverWidth" :book-cover-aspect-ratio="bookCoverAspectRatio" @imageLoaded="coverImageLoaded" />
          </div>
        </div>
      </div>
      <button type="button" class="nightglass-detail-cover-frame relative focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :aria-label="$strings.LabelOpenCoverArt" @click="showFullscreenCover = true">
        <!-- Landing point for the shelf cover's view transition. The name is
             bound rather than fixed so it only matches the card the user
             actually pressed. -->
        <span class="nightglass-detail-cover relative block" :style="coverTransitionStyle">
          <covers-book-cover :library-item="libraryItem" :width="coverWidth" :book-cover-aspect-ratio="bookCoverAspectRatio" no-bg raw />
        </span>
        <span class="nightglass-detail-cover-frame__footer flex items-center justify-between" aria-hidden="true">
          <span>{{ $strings.LabelCoverArt }}</span>
          <span>{{ $strings.LabelTapToExpand }}</span>
        </span>
      </button>
    </div>

    <div class="relative">
      <!-- background gradient -->
      <div id="item-page-bg-gradient" class="absolute top-0 left-0 w-full pointer-events-none z-0" :style="{ opacity: coverRgb ? 1 : 0 }">
        <div class="w-full h-full" :style="{ backgroundColor: coverRgb }" />
        <div class="w-full h-full absolute top-0 left-0" style="background: var(--gradient-item-page)" />
      </div>

      <main class="nightglass-detail-content relative z-10 px-3 pb-40">
        <section class="nightglass-detail__summary" :aria-label="isPodcast ? $strings.LabelPodcastDetails : $strings.LabelBookDetails">
          <p class="nightglass-detail__eyebrow">{{ isPodcast ? $strings.LabelPodcastDetails : $strings.LabelBookDetails }}</p>
          <div class="flex items-center justify-center gap-1">
            <h1 class="nightglass-detail__title">{{ title }}</h1>
            <widgets-explicit-indicator v-if="isExplicit" />
            <widgets-abridged-indicator v-if="isAbridged" />
          </div>
          <p v-if="subtitle" class="nightglass-detail__subtitle">{{ subtitle }}</p>

          <div v-if="hasLocal" class="mt-4">
          <div v-if="currentServerConnectionConfigId && !isLocalMatchingServerAddress" class="w-full rounded-md bg-warning/10 border border-warning p-4">
            <p class="text-sm">{{ $getString('MessageMediaLinkedToADifferentServer', [localLibraryItem.serverAddress]) }}</p>
          </div>
          <div v-else-if="currentServerConnectionConfigId && !isLocalMatchingUser" class="w-full rounded-md bg-warning/10 border border-warning p-4">
            <p class="text-sm">{{ $strings.MessageMediaLinkedToADifferentUser }}</p>
          </div>
          <div v-else-if="currentServerConnectionConfigId && !isLocalMatchingConnectionConfig" class="w-full rounded-md bg-warning/10 border border-warning p-4">
            <p class="text-sm">Media is linked to a different server connection config. Downloaded User Id: {{ localLibraryItem.serverUserId }}. Downloaded Server Address: {{ localLibraryItem.serverAddress }}. Currently connected User Id: {{ user.id }}. Currently connected server address: {{ currentServerAddress }}.</p>
          </div>
          </div>

          <div class="col-span-full">
          <div v-if="showPlay || showRead" class="nightglass-detail__actions flex mt-5">
            <ui-btn v-if="showPlay" color="success" class="nightglass-detail__primary flex items-center justify-center flex-grow" :loading="playerIsStartingForThisMedia" :padding-x="4" @click="playClick">
              <ui-ph-icon :name="playerIsPlaying ? 'pause' : 'play_arrow'" :size="24" />
              <span class="px-1 text-sm">{{ playerIsPlaying ? $strings.ButtonPause : isPodcast ? $strings.ButtonNextEpisode : hasLocal ? $strings.ButtonPlay : $strings.ButtonStream }}</span>
            </ui-btn>
            <ui-btn v-if="showRead" color="info" class="nightglass-detail__secondary flex items-center justify-center" :class="showPlay ? '' : 'flex-grow'" :padding-x="2" @click="readBook">
              <ui-ph-icon name="auto_stories" :size="24" />
              <span v-if="!showPlay" class="px-2 text-base">{{ $strings.ButtonRead }} {{ ebookFormat }}</span>
            </ui-btn>
            <ui-btn v-if="showDownload" :color="downloadItem ? 'warning' : 'primary'" class="nightglass-detail__secondary flex items-center justify-center" :padding-x="2" :aria-label="downloadItem || startingDownload ? $strings.MessageDownloading : $strings.LabelDownload" @click="downloadClick">
              <ui-ph-icon name="download" :size="24" :class="downloadItem || startingDownload ? 'animate-pulse' : ''" />
            </ui-btn>
            <ui-btn color="primary" class="nightglass-detail__secondary flex items-center justify-center" :padding-x="2" :aria-label="$strings.ButtonMoreOptions" @click="moreButtonPress">
              <ui-ph-icon name="more_vert" :size="24" />
            </ui-btn>
          </div>
          <ui-btn v-else-if="isMissing" color="error" :padding-x="4" small class="nightglass-detail__primary mt-4 flex items-center justify-center w-full" @click="clickMissingButton">
            <ui-ph-icon name="error" :size="22" />
            <span class="px-1 text-base">{{ $strings.LabelMissing }}</span>
          </ui-btn>

          <div v-if="!isPodcast && progressPercent > 0" class="nightglass-detail__progress mt-4">
            <div class="flex items-end justify-between gap-4">
              <div class="min-w-0 text-left">
                <p class="nightglass-detail__eyebrow">{{ $strings.LabelYourProgress }}</p>
                <p v-if="!useEBookProgress && !userIsFinished" class="mt-1 text-sm text-fg-muted">{{ $getString('LabelTimeRemaining', [$elapsedPretty(userTimeRemaining)]) }}</p>
                <p v-else-if="userIsFinished" class="mt-1 text-sm text-fg-muted">{{ $strings.LabelFinished }} {{ $formatDate(userProgressFinishedAt) }}</p>
              </div>
              <p class="font-mono text-xl text-success">{{ Math.round(progressPercent * 100) }}%</p>
            </div>
            <div class="mt-2 h-4 w-full">
              <ui-synthwave-progress :progress="progressPercent" :playing="playerIsPlaying" variant="full" />
            </div>
          </div>
        </div>
        </section>

        <div v-if="downloadItem" class="py-3">
          <p v-if="downloadItem.itemProgress == 1" class="text-center text-lg">{{ $strings.MessageDownloadCompleteProcessing }}</p>
          <p v-else class="text-center text-lg">{{ $strings.MessageDownloading }} ({{ Math.round(downloadItem.itemProgress * 100) }}%)</p>
        </div>

        <section id="metadata" class="nightglass-detail__facts" :aria-label="$strings.LabelMediaDetails">
          <div v-if="podcastAuthor || bookAuthors?.length" class="nightglass-detail__fact">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelAuthor }}</p>
            <p v-if="podcastAuthor" class="nightglass-detail__fact-value">{{ podcastAuthor }}</p>
            <p v-else-if="bookAuthors?.length" class="nightglass-detail__fact-value">
            <template v-for="(author, index) in bookAuthors">
              <nuxt-link :key="author.id" :to="`/bookshelf/library?filter=authors.${$encode(author.id)}`" class="underline whitespace-nowrap">{{ author.name }}</nuxt-link
              ><span :key="`${author.id}-comma`" v-if="index < bookAuthors.length - 1">, </span>
            </template>
            </p>
          </div>

          <div v-if="podcastType" class="nightglass-detail__fact">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelType }}</p>
            <p class="nightglass-detail__fact-value capitalize">{{ podcastType }}</p>
          </div>

          <div v-if="series?.length" class="nightglass-detail__fact">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelSeries }}</p>
            <p class="nightglass-detail__fact-value">
            <template v-for="(series, index) in seriesList">
              <nuxt-link :key="series.id" :to="`/bookshelf/series/${series.id}`" class="underline whitespace-nowrap">{{ series.text }}</nuxt-link
              ><span :key="`${series.id}-comma`" v-if="index < seriesList.length - 1">, </span>
            </template>
            </p>
          </div>

          <div v-if="numTracks" class="nightglass-detail__fact">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelDuration }}</p>
            <p class="nightglass-detail__fact-value">{{ $elapsedPretty(duration) }}</p>
          </div>

          <div v-if="narrators?.length" class="nightglass-detail__fact">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelNarrators }}</p>
            <p class="nightglass-detail__fact-value">
            <template v-for="(narrator, index) in narrators">
              <nuxt-link :key="narrator" :to="`/bookshelf/library?filter=narrators.${$encode(narrator)}`" class="underline whitespace-nowrap">{{ narrator }}</nuxt-link
              ><span :key="index" v-if="index < narrators.length - 1">, </span>
            </template>
            </p>
          </div>

          <div v-if="genres.length" class="nightglass-detail__fact nightglass-detail__fact--wide">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelGenres }}</p>
            <p class="nightglass-detail__fact-value">
            <template v-for="(genre, index) in genres">
              <nuxt-link :key="genre" :to="`/bookshelf/library?filter=genres.${$encode(genre)}`" class="underline whitespace-nowrap">{{ genre }}</nuxt-link
              ><span :key="index" v-if="index < genres.length - 1">, </span>
            </template>
            </p>
          </div>

          <div v-if="tags.length" class="nightglass-detail__fact nightglass-detail__fact--wide">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelTags }}</p>
            <p class="nightglass-detail__fact-value">
            <template v-for="(tag, index) in tags">
              <nuxt-link :key="tag" :to="`/bookshelf/library?filter=tags.${$encode(tag)}`" class="underline whitespace-nowrap">{{ tag }}</nuxt-link
              ><span :key="index" v-if="index < tags.length - 1">, </span>
            </template>
            </p>
          </div>

          <div v-if="publishedYear" class="nightglass-detail__fact">
            <p class="nightglass-detail__fact-label">{{ $strings.LabelPublishYear }}</p>
            <p class="nightglass-detail__fact-value">{{ publishedYear }}</p>
          </div>
        </section>

        <section v-if="description" class="nightglass-detail__description">
          <div>
            <p class="nightglass-detail__eyebrow">{{ $strings.LabelDescription }}</p>
            <h2 class="mt-1 text-lg font-semibold">{{ $strings.LabelAboutThisTitle }}</h2>
          </div>

          <div ref="description" class="nightglass-detail__description-copy default-style less-spacing whitespace-pre-line" :class="{ 'line-clamp-5': !showFullDescription }" v-html="description" />

          <button v-if="descriptionClamped" type="button" class="nightglass-detail__read-toggle mt-3 h-12 w-full flex items-center justify-center gap-2 rounded-xl font-mono text-sm uppercase tracking-wider text-fg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent" :aria-expanded="showFullDescription ? 'true' : 'false'" @click="showFullDescription = !showFullDescription">
            {{ showFullDescription ? $strings.ButtonReadLess : $strings.ButtonReadMore }}
            <ui-ph-icon name="keyboard_arrow_down" :size="20" :class="{ 'rotate-180': showFullDescription }" />
          </button>
        </section>

        <!-- tables -->
        <div class="nightglass-detail__tables">
          <div v-if="isPodcast" class="nightglass-detail__table-panel"><tables-podcast-episodes-table :library-item="libraryItem" :local-library-item-id="localLibraryItemId" :episodes="episodes" :local-episodes="localLibraryItemEpisodes" :is-local="isLocal" /></div>
          <div v-if="numChapters" class="nightglass-detail__table-panel"><tables-chapters-table :library-item="libraryItem" @playAtTimestamp="playAtTimestamp" /></div>
          <div v-if="numTracks" class="nightglass-detail__table-panel"><tables-tracks-table :tracks="tracks" :library-item-id="libraryItemId" /></div>
          <div v-if="ebookFiles.length" class="nightglass-detail__table-panel"><tables-ebook-files-table :library-item="libraryItem" /></div>
        </div>
      </main>
    </div>

    <!-- modals -->
    <modals-item-more-menu-modal v-model="showMoreMenu" :library-item="libraryItem" :rss-feed="rssFeed" :processing.sync="processing" />

    <modals-select-local-folder-modal v-model="showSelectLocalFolder" :media-type="mediaType" @select="selectedLocalFolder" />

    <modals-fullscreen-cover v-model="showFullscreenCover" :library-item="libraryItem" />

    <div v-show="processing" class="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/50 z-50">
      <ui-loading-indicator />
    </div>
  </div>
</template>

<script>
import { Dialog } from '@capacitor/dialog'
import { AbsFileSystem, AbsDownloader } from '@/plugins/capacitor'
import { getAverageColorFromCoverUrl } from '@/utils/coverAverageColor'
import { coverTransitionName } from '@/utils/viewTransition'
import cellularPermissionHelpers from '@/mixins/cellularPermissionHelpers'

export default {
  async asyncData({ store, params, redirect, app, query }) {
    const libraryItemId = params.id
    let libraryItem = null

    if (libraryItemId.startsWith('local')) {
      libraryItem = await app.$db.getLocalLibraryItem(libraryItemId)
      if (!libraryItem) {
        return redirect('/?error=Failed to get downloaded library item')
      }

      // If library item is linked to the currently connected server then redirect to the page using the server library item id
      if (libraryItem?.libraryItemId?.startsWith('li_')) {
        // Detect old library item id
        console.error('Local library item has old server library item id', libraryItem.libraryItemId)
      } else if (query.noredirect !== '1' && libraryItem?.libraryItemId && libraryItem?.serverAddress === store.getters['user/getServerAddress'] && store.state.socketConnected) {
        const queryParams = new URLSearchParams()
        queryParams.set('localLibraryItemId', libraryItemId)
        if (libraryItem.mediaType === 'podcast') {
          // Filter by downloaded when redirecting from the local copy
          queryParams.set('episodefilter', 'downloaded')
        }
        return redirect(`/item/${libraryItem.libraryItemId}?${queryParams.toString()}`)
      }
    } else if (!store.state.user.serverConnectionConfig) {
      // Not connected to server
      return redirect('/?error=No server connection to get library item')
    }

    return {
      libraryItem,
      libraryItemId
    }
  },
  data() {
    return {
      processing: false,
      showSelectLocalFolder: false,
      showMoreMenu: false,
      showFullscreenCover: false,
      coverRgb: null,
      coverBgIsLight: false,
      windowWidth: 0,
      descriptionClamped: false,
      showFullDescription: false,
      episodeStartingPlayback: null,
      startingDownload: false
    }
  },
  mixins: [cellularPermissionHelpers],
  computed: {
    coverTransitionStyle() {
      // Reduced motion removes spatial travel, so the cover simply appears.
      if (this.$store.getters['globals/motionMode'] === 'reduced') return null
      const name = coverTransitionName(this.libraryItemId)
      return name ? { viewTransitionName: name } : null
    },
    isIos() {
      return this.$platform === 'ios'
    },
    userCanDownload() {
      return this.$store.getters['user/getUserCanDownload']
    },
    userIsAdminOrUp() {
      return this.$store.getters['user/getIsAdminOrUp']
    },
    isLocal() {
      return this.libraryItem.isLocal
    },
    hasLocal() {
      // Server library item has matching local library item
      return this.isLocal || this.libraryItem.localLibraryItem
    },
    localLibraryItem() {
      if (this.isLocal) return this.libraryItem
      return this.libraryItem.localLibraryItem || null
    },
    localLibraryItemId() {
      return this.localLibraryItem?.id || null
    },
    localLibraryItemEpisodes() {
      if (!this.isPodcast || !this.localLibraryItem) return []
      var podcastMedia = this.localLibraryItem.media
      return podcastMedia?.episodes || []
    },
    serverLibraryItemId() {
      if (!this.isLocal) return this.libraryItem.id
      // Check if local library item is connected to the current server
      if (!this.libraryItem.serverAddress || !this.libraryItem.libraryItemId) return null
      if (this.currentServerAddress === this.libraryItem.serverAddress) {
        return this.libraryItem.libraryItemId
      }
      return null
    },
    localLibraryItemServerConnectionConfigId() {
      return this.localLibraryItem?.serverConnectionConfigId
    },
    currentServerAddress() {
      return this.$store.getters['user/getServerAddress']
    },
    currentServerConnectionConfigId() {
      return this.$store.getters['user/getServerConnectionConfigId']
    },
    /**
     * User is currently connected to a server and this local library item has the same server address
     */
    isLocalMatchingServerAddress() {
      if (!this.localLibraryItem || !this.currentServerAddress) return false
      return this.localLibraryItem.serverAddress === this.currentServerAddress
    },
    /**
     * User is currently connected to a server and this local library item has the same user id
     */
    isLocalMatchingUser() {
      if (!this.localLibraryItem || !this.user) return false
      return this.localLibraryItem.serverUserId === this.user.id || this.localLibraryItem.serverUserId === this.user.oldUserId
    },
    /**
     * User is currently connected to a server and this local library item has the same connection config id
     */
    isLocalMatchingConnectionConfig() {
      if (!this.localLibraryItemServerConnectionConfigId || !this.currentServerConnectionConfigId) return false
      return this.localLibraryItemServerConnectionConfigId === this.currentServerConnectionConfigId
    },
    bookCoverAspectRatio() {
      return this.$store.getters['libraries/getBookCoverAspectRatio']
    },
    rssFeed() {
      return this.libraryItem?.rssFeed
    },
    mediaType() {
      return this.libraryItem.mediaType
    },
    isPodcast() {
      return this.mediaType == 'podcast'
    },
    media() {
      return this.libraryItem.media || {}
    },
    tags() {
      return this.media.tags || []
    },
    mediaMetadata() {
      return this.media.metadata || {}
    },
    title() {
      return this.mediaMetadata.title
    },
    subtitle() {
      return this.mediaMetadata.subtitle
    },
    genres() {
      return this.mediaMetadata.genres || []
    },
    publishedYear() {
      return this.mediaMetadata.publishedYear
    },
    podcastType() {
      return this.mediaMetadata.type
    },
    podcastAuthor() {
      if (!this.isPodcast) return null
      return this.mediaMetadata.author || ''
    },
    bookAuthors() {
      if (this.isPodcast) return null
      return this.mediaMetadata.authors || []
    },
    narrators() {
      if (this.isPodcast) return null
      return this.mediaMetadata.narrators || []
    },
    description() {
      return this.mediaMetadata.description || ''
    },
    series() {
      return this.mediaMetadata.series || []
    },
    seriesList() {
      if (this.isPodcast) return null
      return this.series.map((se) => {
        var text = se.name
        if (se.sequence) text += ` #${se.sequence}`
        return {
          ...se,
          text
        }
      })
    },
    duration() {
      return this.media.duration
    },
    user() {
      return this.$store.state.user.user
    },
    userItemProgress() {
      if (this.isPodcast) return null
      if (this.isLocal) return this.localItemProgress
      return this.serverItemProgress
    },
    localItemProgress() {
      if (this.isPodcast) return null
      return this.$store.getters['globals/getLocalMediaProgressById'](this.localLibraryItemId)
    },
    serverItemProgress() {
      if (this.isPodcast) return null
      return this.$store.getters['user/getUserMediaProgress'](this.serverLibraryItemId)
    },
    userIsFinished() {
      return !!this.userItemProgress?.isFinished
    },
    userTimeRemaining() {
      if (!this.userItemProgress) return 0
      const duration = this.userItemProgress.duration || this.duration
      return duration - this.userItemProgress.currentTime
    },
    useEBookProgress() {
      if (!this.userItemProgress || this.userItemProgress.progress) return false
      return this.userItemProgress.ebookProgress > 0
    },
    progressPercent() {
      if (this.useEBookProgress) return Math.max(Math.min(1, this.userItemProgress.ebookProgress), 0)
      return Math.max(Math.min(1, this.userItemProgress?.progress || 0), 0)
    },
    userProgressFinishedAt() {
      return this.userItemProgress?.finishedAt || 0
    },
    isStreaming() {
      return this.isPlaying && !this.$store.getters['getIsCurrentSessionLocal']
    },
    isPlaying() {
      if (this.localLibraryItemId && this.$store.getters['getIsMediaStreaming'](this.localLibraryItemId)) return true
      return this.$store.getters['getIsMediaStreaming'](this.libraryItemId)
    },
    playerIsPlaying() {
      return this.$store.state.playerIsPlaying && (this.isStreaming || this.isPlaying)
    },
    playerIsStartingPlayback() {
      // Play has been pressed and waiting for native play response
      return this.$store.state.playerIsStartingPlayback
    },
    playerIsStartingForThisMedia() {
      const mediaId = this.$store.state.playerStartingPlaybackMediaId
      if (!mediaId) return false

      if (this.isPodcast) {
        return mediaId === this.episodeStartingPlayback
      } else {
        return mediaId === this.serverLibraryItemId || mediaId === this.localLibraryItemId
      }
    },
    tracks() {
      return this.media.tracks || []
    },
    numTracks() {
      return this.tracks.length || 0
    },
    numChapters() {
      if (!this.media.chapters) return 0
      return this.media.chapters.length || 0
    },
    isMissing() {
      return this.libraryItem.isMissing
    },
    isInvalid() {
      return this.libraryItem.isInvalid
    },
    isExplicit() {
      return !!this.mediaMetadata.explicit
    },
    isAbridged() {
      return !!this.mediaMetadata.abridged
    },
    showPlay() {
      return !this.isMissing && !this.isInvalid && (this.numTracks || this.episodes.length)
    },
    showRead() {
      return this.ebookFile
    },
    showDownload() {
      if (this.isPodcast || this.hasLocal) return false
      return this.user && this.userCanDownload && (this.showPlay || this.showRead)
    },
    libraryFiles() {
      return this.libraryItem.libraryFiles || []
    },
    ebookFiles() {
      return this.libraryFiles.filter((lf) => lf.fileType === 'ebook')
    },
    ebookFile() {
      return this.media.ebookFile
    },
    ebookFormat() {
      if (!this.ebookFile) return null
      return this.ebookFile.ebookFormat
    },
    downloadItem() {
      return this.$store.getters['globals/getDownloadItem'](this.libraryItemId)
    },
    episodes() {
      return this.media.episodes || []
    },
    coverWidth() {
      let width = Math.min(270, Math.max(175, this.windowWidth * 0.64))
      if (width * this.bookCoverAspectRatio > 300) width = 300 / this.bookCoverAspectRatio
      return width
    },
    coverHeight() {
      return this.coverWidth * this.bookCoverAspectRatio
    }
  },
  methods: {
    clickMissingButton() {
      Dialog.alert({
        title: this.$strings.LabelMissing,
        message: this.$strings.MessageItemMissing,
        cancelText: this.$strings.ButtonOk
      })
    },
    async coverImageLoaded(fullCoverUrl) {
      if (!fullCoverUrl) return
      const avg = await getAverageColorFromCoverUrl(this, fullCoverUrl)
      if (!avg) return
      this.coverRgb = avg.rgba
      this.coverBgIsLight = avg.isLight
    },
    moreButtonPress() {
      this.showMoreMenu = true
    },
    readBook() {
      if (this.localLibraryItem?.media?.ebookFile) {
        // Has local ebook file
        this.$store.commit('showReader', { libraryItem: this.localLibraryItem, keepProgress: true })
      } else {
        this.$store.commit('showReader', { libraryItem: this.libraryItem, keepProgress: true })
      }
    },
    playAtTimestamp(seconds) {
      this.play(seconds)
    },
    async playClick() {
      await this.$hapticsImpact()
      if (this.playerIsPlaying) {
        this.$eventBus.$emit('pause-item')
      } else {
        this.play()
      }
    },
    async play(startTime = null) {
      if (this.playerIsStartingPlayback) return

      if (this.isPodcast) {
        this.episodes.sort((a, b) => {
          if (this.podcastType === 'serial') {
            return String(a.publishedAt).localeCompare(String(b.publishedAt), undefined, { numeric: true, sensitivity: 'base' })
          } else {
            return String(b.publishedAt).localeCompare(String(a.publishedAt), undefined, { numeric: true, sensitivity: 'base' })
          }
        })

        let episode = this.episodes.find((ep) => {
          var podcastProgress = null
          if (!this.isLocal) {
            podcastProgress = this.$store.getters['user/getUserMediaProgress'](this.libraryItemId, ep.id)
          } else {
            podcastProgress = this.$store.getters['globals/getLocalMediaProgressById'](this.libraryItemId, ep.id)
          }
          return !podcastProgress?.isFinished
        })

        if (!episode) episode = this.episodes[0]

        const episodeId = episode.id

        let localEpisode = null
        if (this.hasLocal && !this.isLocal) {
          localEpisode = this.localLibraryItem.media.episodes.find((ep) => ep.serverEpisodeId == episodeId)
        } else if (this.isLocal) {
          localEpisode = episode
        }
        const serverEpisodeId = !this.isLocal ? episodeId : localEpisode?.serverEpisodeId || null

        this.episodeStartingPlayback = serverEpisodeId
        this.$store.commit('setPlayerIsStartingPlayback', serverEpisodeId)
        if (localEpisode) {
          this.$eventBus.$emit('play-item', { libraryItemId: this.localLibraryItem.id, episodeId: localEpisode.id, serverLibraryItemId: this.serverLibraryItemId, serverEpisodeId })
        } else {
          this.$eventBus.$emit('play-item', { libraryItemId: this.libraryItemId, episodeId })
        }
      } else {
        // Audiobook
        let libraryItemId = this.libraryItemId

        // Prefer the downloaded copy whenever there is one
        if (this.hasLocal) {
          libraryItemId = this.localLibraryItem.id
        }

        // If start time and is not already streaming then ask for confirmation
        if (startTime !== null && startTime !== undefined && !this.$store.getters['getIsMediaStreaming'](libraryItemId, null)) {
          const { value } = await Dialog.confirm({
            title: this.$strings.HeaderConfirm,
            message: this.$getString('MessageConfirmPlaybackTime', [this.title, this.$secondsToTimestamp(startTime)])
          })
          if (!value) return
        }

        this.$store.commit('setPlayerIsStartingPlayback', libraryItemId)
        this.$eventBus.$emit('play-item', { libraryItemId, serverLibraryItemId: this.serverLibraryItemId, startTime })
      }
    },
    itemUpdated(libraryItem) {
      if (libraryItem.id === this.serverLibraryItemId) {
        console.log('Item Updated')
        this.libraryItem = libraryItem
        this.checkDescriptionClamped()
      }
    },
    async selectFolder() {
      // Select and save the local folder for media type
      var folderObj = await AbsFileSystem.selectFolder({ mediaType: this.mediaType })
      if (folderObj.error) {
        return this.$toast.error(`Error: ${folderObj.error || 'Unknown Error'}`)
      }
      return folderObj
    },
    selectedLocalFolder(localFolder) {
      this.showSelectLocalFolder = false
      this.download(localFolder)
    },
    async downloadClick() {
      if (this.downloadItem || this.startingDownload) return

      const hasPermission = await this.checkCellularPermission('download')
      if (!hasPermission) return

      this.startingDownload = true
      setTimeout(() => {
        this.startingDownload = false
      }, 1000)

      await this.$hapticsImpact()
      if (this.isIos) {
        // no local folders on iOS
        this.startDownload()
      } else {
        this.download()
      }
    },
    async download(selectedLocalFolder = null) {
      // Get the local folder to download to
      let localFolder = selectedLocalFolder
      if (!localFolder) {
        const localFolders = (await this.$db.getLocalFolders()) || []
        console.log('Local folders loaded', localFolders.length)
        const foldersWithMediaType = localFolders.filter((lf) => {
          console.log('Checking local folder', lf.mediaType)
          return lf.mediaType == this.mediaType
        })
        console.log('Folders with media type', this.mediaType, foldersWithMediaType.length)
        const internalStorageFolder = foldersWithMediaType.find((f) => f.id === `internal-${this.mediaType}`)
        if (!foldersWithMediaType.length) {
          localFolder = {
            id: `internal-${this.mediaType}`,
            name: this.$strings.LabelInternalAppStorage,
            mediaType: this.mediaType
          }
        } else if (foldersWithMediaType.length === 1 && internalStorageFolder) {
          localFolder = internalStorageFolder
        } else {
          this.$store.commit('globals/showSelectLocalFolderModal', {
            mediaType: this.mediaType,
            callback: (folder) => {
              this.download(folder)
            }
          })
          return
        }
      }

      console.log('Local folder', JSON.stringify(localFolder))
      let startDownloadMessage = `Start download for "${this.title}" with ${this.numTracks} audio track${this.numTracks == 1 ? '' : 's'} to folder ${localFolder.name}?`
      if (!this.isIos && this.showRead) {
        if (this.numTracks > 0) {
          startDownloadMessage = `Start download for "${this.title}" with ${this.numTracks} audio track${this.numTracks == 1 ? '' : 's'} and ebook file to folder ${localFolder.name}?`
        } else {
          startDownloadMessage = `Start download for "${this.title}" with ebook file to folder ${localFolder.name}?`
        }
      }
      const { value } = await Dialog.confirm({
        title: this.$strings.HeaderConfirm,
        message: startDownloadMessage
      })
      if (value) {
        this.startDownload(localFolder)
      }
    },
    async startDownload(localFolder = null) {
      const payload = {
        libraryItemId: this.libraryItemId
      }
      if (localFolder) {
        console.log('Starting download to local folder', localFolder.name)
        payload.localFolderId = localFolder.id
      }
      var downloadRes = await AbsDownloader.downloadLibraryItem(payload)
      if (downloadRes && downloadRes.error) {
        var errorMsg = downloadRes.error || 'Unknown error'
        console.error('Download error', errorMsg)
        this.$toast.error(errorMsg)
      }
    },
    newLocalLibraryItem(item) {
      if (item.libraryItemId == this.libraryItemId) {
        console.log('New local library item', item.id)
        this.$set(this.libraryItem, 'localLibraryItem', item)
      }
    },
    libraryChanged(libraryId) {
      if (this.libraryItem.libraryId !== libraryId) {
        this.$router.replace('/bookshelf')
      }
    },
    checkDescriptionClamped() {
      if (this.showFullDescription) return
      if (!this.$refs.description) {
        this.descriptionClamped = false
      } else {
        this.descriptionClamped = this.$refs.description.scrollHeight > this.$refs.description.clientHeight
      }
    },
    windowResized() {
      this.windowWidth = window.innerWidth
      this.checkDescriptionClamped()
    },
    rssFeedOpen(data) {
      if (data.entityId === this.serverLibraryItemId) {
        console.log('RSS Feed Opened', data)
        this.rssFeed = data
      }
    },
    rssFeedClosed(data) {
      if (data.entityId === this.serverLibraryItemId) {
        console.log('RSS Feed Closed', data)
        this.rssFeed = null
      }
    },
    async setLibrary() {
      if (!this.libraryItem.libraryId) return
      await this.$store.dispatch('libraries/fetch', this.libraryItem.libraryId)
      this.$localStore.setLastLibraryId(this.libraryItem.libraryId)
    },
    init() {
      // If library of this item is different from current library then switch libraries
      if (this.$store.state.libraries.currentLibraryId !== this.libraryItem.libraryId) {
        this.setLibrary()
      }

      this.windowWidth = window.innerWidth
      window.addEventListener('resize', this.windowResized)
      this.$eventBus.$on('library-changed', this.libraryChanged)
      this.$eventBus.$on('new-local-library-item', this.newLocalLibraryItem)
      this.$socket.$on('item_updated', this.itemUpdated)
      this.$socket.$on('rss_feed_open', this.rssFeedOpen)
      this.$socket.$on('rss_feed_closed', this.rssFeedClosed)
      this.checkDescriptionClamped()

      // Set height of page below cover image
      const itemPageBgGradientHeight = window.outerHeight - 64 - this.coverHeight
      document.documentElement.style.setProperty('--item-page-bg-gradient-height', itemPageBgGradientHeight + 'px')

      // Set last scroll position if was set for this item
      if (this.$store.state.lastItemScrollData.id === this.libraryItemId && window['item-page']) {
        window['item-page'].scrollTop = this.$store.state.lastItemScrollData.scrollTop || 0
      }
    },
    async loadServerLibraryItem() {
      console.log(`Fetching library item "${this.libraryItemId}" from server`)
      const libraryItem = await this.$nativeHttp.get(`/api/items/${this.libraryItemId}?expanded=1&include=rssfeed`, { connectTimeout: 5000 }).catch((error) => {
        console.error('Failed', error)
        return null
      })

      if (libraryItem) {
        const localLibraryItem = await this.$db.getLocalLibraryItemByLId(this.libraryItemId)
        if (localLibraryItem) {
          console.log('Library item has local library item also', localLibraryItem.id)
          libraryItem.localLibraryItem = localLibraryItem
        }
        this.libraryItem = libraryItem
      } else if (this.$route.query.localLibraryItemId) {
        // Failed to get server library item but is local library item so redirect
        return this.$router.replace(`/item/${this.$route.query.localLibraryItemId}?noredirect=1`)
      } else {
        this.$toast.error('Failed to get library item from server')
        return this.$router.replace('/bookshelf')
      }
    }
  },
  async mounted() {
    if (!this.libraryItem) {
      await this.loadServerLibraryItem()
    }
    this.init()
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.windowResized)
    this.$eventBus.$off('library-changed', this.libraryChanged)
    this.$eventBus.$off('new-local-library-item', this.newLocalLibraryItem)
    this.$socket.$off('item_updated', this.itemUpdated)
    this.$socket.$off('rss_feed_open', this.rssFeedOpen)
    this.$socket.$off('rss_feed_closed', this.rssFeedClosed)

    // Set scroll position
    if (window['item-page']) {
      this.$store.commit('setLastItemScrollData', { scrollTop: window['item-page'].scrollTop || 0, id: this.libraryItemId })
    }
  }
}
</script>

<style>
:root {
  --item-page-bg-gradient-height: 100%;
}

#item-page-bg-gradient {
  transition: opacity 0.5s ease-in-out;
  height: var(--item-page-bg-gradient-height);
}
#item-page-bg-gradient::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgb(var(--color-bg) / 0.7) 0%, rgb(var(--color-bg) / 0.9) 38%, rgb(var(--color-bg)) 100%);
}

.nightglass-detail-cover-stage {
  isolation: isolate;
  overflow: hidden;
  padding: 12px 0 16px;
  background:
    radial-gradient(ellipse at 50% 42%, rgb(var(--color-success) / 0.11), transparent 38%),
    radial-gradient(ellipse at 68% 76%, rgb(var(--color-accent) / 0.09), transparent 34%),
    linear-gradient(180deg, rgb(var(--color-secondary) / 0.36), rgb(var(--color-bg) / 0.92));
}
.nightglass-detail-cover-stage::after {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: linear-gradient(135deg, rgb(var(--color-fg) / 0.035), transparent 34%, rgb(var(--color-accent) / 0.04));
}
#coverBg {
  opacity: 0;
  pointer-events: none;
}
.nightglass-detail-cover-frame {
  display: flex;
  flex-direction: column;
  padding: 10px 10px 7px;
  overflow: hidden;
  color: rgb(var(--color-fg));
  border: 1px solid rgb(var(--color-border) / 0.94);
  border-radius: 32px;
  background: linear-gradient(145deg, rgb(var(--color-secondary) / 0.6), rgb(var(--color-bg) / 0.3));
  box-shadow: 0 24px 58px rgb(0 0 0 / 0.38), inset 0 1px 0 rgb(var(--color-fg) / 0.12), 0 0 0 1px rgb(var(--color-success) / 0.08);
  backdrop-filter: blur(24px) saturate(130%);
  -webkit-backdrop-filter: blur(24px) saturate(130%);
  cursor: pointer;
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), border-color 180ms ease, box-shadow 220ms ease;
}
.nightglass-detail-cover-frame::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(135deg, rgb(var(--color-fg) / 0.08), transparent 30%, transparent 72%, rgb(var(--color-accent) / 0.08));
}
.nightglass-detail-cover-frame:active {
  transform: scale(0.985);
  border-color: rgb(var(--color-success) / 0.54);
  box-shadow: 0 16px 38px rgb(0 0 0 / 0.36), inset 0 1px 0 rgb(var(--color-fg) / 0.1), 0 0 20px rgb(var(--color-success) / 0.08);
}
.nightglass-detail-cover {
  overflow: hidden;
  z-index: 1;
  border: 1px solid rgb(var(--color-fg) / 0.26);
  border-radius: 23px;
  box-shadow: 0 13px 32px rgb(0 0 0 / 0.34), 0 0 0 1px rgb(var(--color-success) / 0.12), inset 0 1px 0 rgb(var(--color-fg) / 0.1);
}
.nightglass-detail-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(135deg, rgb(var(--color-fg) / 0.07), transparent 28%, transparent 76%, rgb(var(--color-accent) / 0.08));
}
.nightglass-detail-cover-frame__footer {
  position: relative;
  z-index: 3;
  min-height: 31px;
  padding: 8px 5px 1px;
  color: rgb(var(--color-fg) / 0.74);
  font-family: 'JetBrains Mono', 'Ubuntu Mono', monospace;
  font-size: 0.6rem;
  font-weight: 600;
  line-height: 1.35;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}
.nightglass-detail-cover-frame__footer span:first-child {
  color: rgb(var(--color-success));
}

.nightglass-detail-content {
  padding-top: 16px;
}
.nightglass-detail__summary,
.nightglass-detail__facts,
.nightglass-detail__description,
.nightglass-detail__table-panel {
  border: 1px solid rgb(var(--color-border) / 0.92);
  background: linear-gradient(145deg, rgb(var(--color-secondary) / 0.6), rgb(var(--color-bg) / 0.34));
  box-shadow: 0 16px 38px rgb(0 0 0 / 0.28), inset 0 1px 0 rgb(var(--color-fg) / 0.1);
  backdrop-filter: blur(22px) saturate(128%);
  -webkit-backdrop-filter: blur(22px) saturate(128%);
}
.nightglass-detail__summary {
  position: relative;
  overflow: hidden;
  padding: 20px 16px 16px;
  border-radius: 28px;
  text-align: center;
}
.nightglass-detail__summary::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(125deg, rgb(var(--color-fg) / 0.055), transparent 40%, rgb(var(--color-accent) / 0.075));
}
.nightglass-detail__eyebrow,
.nightglass-detail__fact-label {
  color: rgb(var(--color-success));
  font-family: 'JetBrains Mono', 'Ubuntu Mono', monospace;
  font-size: 0.625rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}
.nightglass-detail__title {
  max-width: 28ch;
  color: rgb(var(--color-fg));
  font-size: clamp(1.35rem, 6vw, 2rem);
  font-weight: 650;
  line-height: 1.18;
  text-wrap: balance;
}
.nightglass-detail__subtitle {
  max-width: 42ch;
  margin: 6px auto 0;
  color: rgb(var(--color-fg) / 0.82);
  font-size: 1rem;
  line-height: 1.5;
  text-wrap: balance;
}
.nightglass-detail__actions {
  gap: 8px;
}
.nightglass-detail__actions .btn,
.nightglass-detail__primary.btn,
.nightglass-detail__secondary.btn {
  min-height: 52px;
  border-radius: 16px;
  box-shadow: 0 9px 22px rgb(0 0 0 / 0.24), inset 0 1px 0 rgb(var(--color-fg) / 0.11);
}
.nightglass-detail__primary.btn {
  border-color: rgb(var(--color-success) / 0.72);
  background: linear-gradient(110deg, rgb(var(--color-success) / 0.92), rgb(var(--color-success) / 0.68));
}
.nightglass-detail__secondary.btn {
  min-width: 52px;
  padding-right: 12px;
  padding-left: 12px;
  border-color: rgb(var(--color-border) / 0.94);
  background: rgb(var(--color-bg) / 0.38);
}
.nightglass-detail__progress {
  padding: 14px 16px 12px;
  overflow: hidden;
  border: 1px solid rgb(var(--color-border) / 0.72);
  border-radius: 18px;
  background: linear-gradient(120deg, rgb(var(--color-bg) / 0.22), rgb(var(--color-secondary) / 0.36));
  box-shadow: inset 0 1px 0 rgb(var(--color-fg) / 0.07);
  text-align: left;
}

.nightglass-detail__facts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  margin-top: 16px;
  padding: 8px;
  border-radius: 24px;
}
.nightglass-detail__fact {
  min-width: 0;
  min-height: 76px;
  padding: 12px;
  border: 1px solid rgb(var(--color-border) / 0.58);
  border-radius: 16px;
  background: rgb(var(--color-bg) / 0.18);
}
.nightglass-detail__fact--wide {
  grid-column: 1 / -1;
}
.nightglass-detail__fact-value {
  margin-top: 7px;
  overflow-wrap: anywhere;
  color: rgb(var(--color-fg) / 0.96);
  font-size: 1rem;
  line-height: 1.45;
}
.nightglass-detail__fact-value a {
  color: inherit;
  text-decoration-color: rgb(var(--color-accent) / 0.72);
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}

.nightglass-detail__description {
  margin-top: 16px;
  padding: 20px;
  border-radius: 28px;
}
.nightglass-detail__description-copy {
  max-width: 68ch;
  margin-top: 14px;
  color: rgb(var(--color-fg) / 0.94);
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.68;
  text-align: left;
  hyphens: none;
}
.nightglass-detail__read-toggle {
  border: 1px solid rgb(var(--color-border) / 0.72);
  background: rgb(var(--color-bg) / 0.22);
  transition: color 180ms ease, background 180ms ease, transform 180ms ease;
}
.nightglass-detail__read-toggle:active {
  transform: scale(0.98);
  background: rgb(var(--color-fg) / 0.08);
}
.nightglass-detail__read-toggle .ph-icon {
  transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.nightglass-detail__tables {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}
.nightglass-detail__table-panel {
  overflow: hidden;
  padding: 8px;
  border-radius: 24px;
}

.title-container {
  width: calc(100% - 64px);
  max-width: calc(100% - 64px);
}
#coverBg > div {
  width: 150vw !important;
  max-width: 150vw !important;
}

@media only screen and (min-width: 500px) {
  .nightglass-detail-content {
    max-width: 760px;
    margin-right: auto;
    margin-left: auto;
  }
  .nightglass-detail__summary {
    padding: 24px;
  }
  .nightglass-detail__facts {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .nightglass-detail__fact--wide {
    grid-column: span 2;
  }
}

@media (prefers-reduced-motion: reduce) {
  #item-page-bg-gradient,
  .nightglass-detail-cover-frame,
  .nightglass-detail__read-toggle,
  .nightglass-detail__read-toggle .ph-icon {
    transition: none;
  }
}
</style>
