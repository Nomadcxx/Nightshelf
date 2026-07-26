/**
 * The action model behind long-press Peek.
 *
 * A shelf holds six different kinds of thing, and each one supports a different
 * set of actions. Peek asks this module what an entity can do; it never branches
 * on entity type itself. Keeping that decision here means the rule "a podcast is
 * not marked finished as a whole" is stated once and tested, rather than
 * re-derived in five card components.
 *
 * Everything here is pure: no store, no router, no Vue. Labels are returned as
 * string keys so the caller localises them.
 */

export const SHELF_ENTITY_TYPES = ['book', 'podcast', 'episode', 'series', 'collection', 'playlist']

/**
 * Actions are emitted in this group order and never interleave. The sequence is
 * intent-first: what you most likely want, then progress, then organisation,
 * then files, then information.
 */
export const SHELF_ACTION_GROUPS = ['primary', 'progress', 'organize', 'local', 'info']

function clampProgress(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return 0
  return Math.min(1, Math.max(0, num))
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function resolveEntityType(source) {
  if (source.entityType && SHELF_ENTITY_TYPES.includes(source.entityType)) return source.entityType
  if (source.series) return 'series'
  if (source.collection) return 'collection'
  if (source.playlist) return 'playlist'
  if (source.episode) return 'episode'
  if (source.libraryItem) {
    return source.libraryItem.mediaType === 'podcast' ? 'podcast' : 'book'
  }
  return null
}

function describeLibraryItemEntity(type, source) {
  const libraryItem = source.libraryItem || {}
  const media = libraryItem.media || {}
  const metadata = media.metadata || {}
  const episode = source.episode || null

  const id = libraryItem.id
  if (!id) return null
  if (type === 'episode' && !episode?.id) return null

  const isLocal = !!libraryItem.isLocal
  const localLibraryItem = isLocal ? libraryItem : libraryItem.localLibraryItem || null
  const numEpisodes = type === 'podcast' ? (Array.isArray(media.episodes) ? media.episodes.length : media.numEpisodes || 0) : 0

  // A podcast as a whole is a container, not something you press play on; its
  // episodes are the playable objects.
  let canPlay = false
  if (type === 'episode') canPlay = true
  else if (type === 'book') canPlay = !!(media.numTracks || (Array.isArray(media.tracks) && media.tracks.length))

  return {
    type,
    id,
    episodeId: episode?.id || null,
    title: type === 'episode' ? firstNonEmpty(episode.title, metadata.title) : firstNonEmpty(metadata.title),
    subtitle: type === 'podcast' ? firstNonEmpty(metadata.author) : firstNonEmpty(metadata.authorName, metadata.author),
    routeTo: type === 'episode' ? `/item/${id}/${episode.id}` : `/item/${id}`,
    canPlay,
    numItems: numEpisodes,
    isLocal,
    localLibraryItemId: localLibraryItem?.id || null,
    hasLocalCopy: !!localLibraryItem,
    // A local-only item has no server counterpart, so server actions must not
    // be offered for it even while the app is online.
    serverId: isLocal ? libraryItem.libraryItemId || null : id,
    seriesId: source.seriesId || null,
    progress: clampProgress(source.mediaProgress?.progress),
    isFinished: !!source.mediaProgress?.isFinished
  }
}

function describeGroupEntity(type, source) {
  const entity = source[type]
  if (!entity?.id) return null

  const members = type === 'playlist' ? entity.items : entity.books
  const count = Array.isArray(members) ? members.length : 0
  const routePrefix = type === 'series' ? '/bookshelf/series' : `/${type}`

  return {
    type,
    id: entity.id,
    episodeId: null,
    title: firstNonEmpty(entity.name),
    subtitle: '',
    routeTo: `${routePrefix}/${entity.id}`,
    // An empty group has nothing to start, so play would be a dead button.
    canPlay: count > 0,
    numItems: count,
    isLocal: false,
    localLibraryItemId: null,
    hasLocalCopy: false,
    serverId: entity.id,
    seriesId: type === 'series' ? entity.id : null,
    progress: clampProgress(source.progress),
    isFinished: !!source.isFinished
  }
}

/**
 * Normalise whatever a card is holding into one flat descriptor.
 * Returns null when the source cannot be identified — callers treat that as
 * "no Peek", which is the correct behaviour for a card still awaiting data.
 */
export function describeShelfEntity(source) {
  if (!source || typeof source !== 'object') return null

  const type = resolveEntityType(source)
  if (!type) return null

  if (type === 'series' || type === 'collection' || type === 'playlist') {
    return describeGroupEntity(type, source)
  }
  return describeLibraryItemEntity(type, source)
}

function action(id, labelKey, icon, group, destructive = false) {
  return { id, labelKey, icon, group, destructive }
}

function bookLikeActions(descriptor, context, actions) {
  if (descriptor.canPlay) {
    actions.push(action('play', descriptor.progress > 0 ? 'ButtonResume' : 'ButtonPlay', 'play_arrow', 'primary'))
  }

  if (descriptor.isFinished) {
    actions.push(action('markNotFinished', 'MessageMarkAsNotFinished', 'check_box_outline_blank', 'progress'))
  } else {
    actions.push(action('markFinished', 'MessageMarkAsFinished', 'check', 'progress'))
  }
  if (descriptor.progress > 0) {
    actions.push(action('discardProgress', 'MessageDiscardProgress', 'replay', 'progress', true))
  }

  // Playlists live on the server, so both a server id and a live connection are
  // required — a downloaded book viewed offline cannot be added to one.
  if (descriptor.serverId && context.isConnectedToServer) {
    actions.push(action('addToPlaylist', 'LabelAddToPlaylist', 'queue_music', 'organize'))
    if (context.playlist) {
      actions.push(action('removeFromPlaylist', 'LabelRemoveFromPlaylist', 'remove', 'organize', true))
    }
  }
  if (context.canSelect) {
    actions.push(action('select', 'LabelSelect', 'check_box', 'organize'))
  }

  if (descriptor.hasLocalCopy) {
    actions.push(action('manageLocal', 'ButtonManageLocalFiles', 'folder', 'local'))
    actions.push(action('deleteLocal', descriptor.type === 'episode' ? 'ButtonDeleteLocalEpisode' : 'ButtonDeleteLocalItem', 'delete', 'local', true))
  }

  if (descriptor.seriesId) {
    actions.push(action('viewSeries', 'LabelViewSeries', 'bookmark', 'info'))
  }
  if (descriptor.serverId && context.isConnectedToServer) {
    actions.push(action('openWebClient', 'ButtonGoToWebClient', 'language', 'info'))
  }
  actions.push(action('moreInfo', 'LabelMoreInfo', 'info', 'info'))
}

function podcastActions(descriptor, context, actions) {
  actions.push(action('viewEpisodes', 'LabelEpisodes', 'podcasts', 'primary'))
  if (context.canSelect) {
    actions.push(action('select', 'LabelSelect', 'check_box', 'organize'))
  }
  if (descriptor.hasLocalCopy) {
    actions.push(action('manageLocal', 'ButtonManageLocalFiles', 'folder', 'local'))
  }
  if (descriptor.serverId && context.isConnectedToServer) {
    actions.push(action('openWebClient', 'ButtonGoToWebClient', 'language', 'info'))
  }
  actions.push(action('moreInfo', 'LabelMoreInfo', 'info', 'info'))
}

function groupActions(descriptor, context, actions) {
  if (descriptor.canPlay) {
    actions.push(action('play', 'ButtonPlay', 'play_arrow', 'primary'))
  }
  if (descriptor.type === 'series') {
    actions.push(action('viewSeries', 'LabelViewSeries', 'bookmark', 'info'))
    if (context.canSelect) actions.push(action('select', 'LabelSelect', 'check_box', 'organize'))
  } else if (descriptor.type === 'playlist') {
    actions.push(action('viewPlaylist', 'LabelViewPlaylist', 'queue_music', 'info'))
  } else {
    actions.push(action('viewCollection', 'LabelViewCollection', 'collections_bookmark', 'info'))
  }
}

/**
 * Build the ordered action list for a described entity.
 *
 * Context flags gate actions that depend on where the user is rather than on
 * what the entity is: `isConnectedToServer`, `canSelect` (this shelf supports
 * multi-select), and `playlist` (the user is looking at that playlist now).
 */
export function buildShelfEntityActions(descriptor, context = {}) {
  if (!descriptor || !SHELF_ENTITY_TYPES.includes(descriptor.type)) return []
  const ctx = context || {}

  const actions = []
  if (descriptor.type === 'book' || descriptor.type === 'episode') {
    bookLikeActions(descriptor, ctx, actions)
  } else if (descriptor.type === 'podcast') {
    podcastActions(descriptor, ctx, actions)
  } else {
    groupActions(descriptor, ctx, actions)
  }

  // Stable sort by group so callers can render section breaks without needing
  // to know the order actions happened to be pushed in.
  return actions
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => {
      const groupDiff = SHELF_ACTION_GROUPS.indexOf(a.entry.group) - SHELF_ACTION_GROUPS.indexOf(b.entry.group)
      return groupDiff !== 0 ? groupDiff : a.index - b.index
    })
    .map(({ entry }) => entry)
}
