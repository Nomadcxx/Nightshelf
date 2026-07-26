const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { transformSync } = require('@babel/core')

function loadUtil(filename) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'utils', filename), 'utf8')
  const { code } = transformSync(source, {
    filename,
    presets: [['@babel/preset-env', { targets: { node: 'current' } }]]
  })
  const module = { exports: {} }
  new Function('require', 'module', 'exports', code)(require, module, module.exports)
  return module.exports
}

const { SHELF_ENTITY_TYPES, SHELF_ACTION_GROUPS, describeShelfEntity, buildShelfEntityActions } = loadUtil('shelfEntityActions.js')

function idsOf(actions) {
  return actions.map((a) => a.id)
}

// --- entity description ----------------------------------------------------

test('describes a server book from a library item', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', mediaType: 'book', media: { numTracks: 8, metadata: { title: 'Dune', authorName: 'Frank Herbert' } } }
  })

  assert.equal(descriptor.type, 'book')
  assert.equal(descriptor.id, 'li_1')
  assert.equal(descriptor.title, 'Dune')
  assert.equal(descriptor.subtitle, 'Frank Herbert')
  assert.equal(descriptor.canPlay, true)
  assert.equal(descriptor.routeTo, '/item/li_1')
})

test('a book with no tracks cannot be played', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', mediaType: 'book', media: { numTracks: 0, metadata: { title: 'Notes' } } }
  })
  assert.equal(descriptor.canPlay, false)
})

test('infers podcast type from the library item media type', () => {
  const descriptor = describeShelfEntity({
    libraryItem: { id: 'li_2', mediaType: 'podcast', media: { numEpisodes: 12, metadata: { title: 'A Show', author: 'Someone' } } }
  })
  assert.equal(descriptor.type, 'podcast')
  assert.equal(descriptor.numItems, 12)
})

test('describes a series with its book count and route', () => {
  const descriptor = describeShelfEntity({
    entityType: 'series',
    series: { id: 'ser_1', name: 'The Expanse', books: [{ id: 'a' }, { id: 'b' }] }
  })
  assert.equal(descriptor.type, 'series')
  assert.equal(descriptor.title, 'The Expanse')
  assert.equal(descriptor.numItems, 2)
  assert.equal(descriptor.routeTo, '/bookshelf/series/ser_1')
})

test('describes a playlist and a collection with their own routes', () => {
  const playlist = describeShelfEntity({ entityType: 'playlist', playlist: { id: 'pl_1', name: 'Commute', items: [{}, {}, {}] } })
  assert.equal(playlist.routeTo, '/playlist/pl_1')
  assert.equal(playlist.numItems, 3)

  const collection = describeShelfEntity({ entityType: 'collection', collection: { id: 'co_1', name: 'Favourites', books: [{}] } })
  assert.equal(collection.routeTo, '/collection/co_1')
  assert.equal(collection.numItems, 1)
})

test('reports progress state from the supplied media progress', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } },
    mediaProgress: { progress: 0.42, isFinished: false }
  })
  assert.equal(descriptor.progress, 0.42)
  assert.equal(descriptor.isFinished, false)

  const finished = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } },
    mediaProgress: { progress: 1, isFinished: true }
  })
  assert.equal(finished.isFinished, true)
})

test('clamps out-of-range progress rather than trusting the server', () => {
  const over = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'a', media: { metadata: {} } }, mediaProgress: { progress: 4 } })
  const under = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'a', media: { metadata: {} } }, mediaProgress: { progress: -2 } })
  const nonsense = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'a', media: { metadata: {} } }, mediaProgress: { progress: 'soon' } })
  assert.equal(over.progress, 1)
  assert.equal(under.progress, 0)
  assert.equal(nonsense.progress, 0)
})

test('returns null for an entity it cannot identify', () => {
  assert.equal(describeShelfEntity(null), null)
  assert.equal(describeShelfEntity({}), null)
  assert.equal(describeShelfEntity({ entityType: 'book', libraryItem: { media: {} } }), null)
})

// --- action building -------------------------------------------------------

test('an unplayed book offers play, mark finished, playlist and info', () => {
  const descriptor = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 3, metadata: { title: 'X' } } } })
  const ids = idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true }))

  assert.ok(ids.includes('play'))
  assert.ok(ids.includes('markFinished'))
  assert.ok(ids.includes('addToPlaylist'))
  assert.ok(ids.includes('moreInfo'))
  assert.ok(!ids.includes('discardProgress'), 'nothing to discard yet')
  assert.ok(!ids.includes('markNotFinished'))
})

test('a partially played book offers discard progress', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 3, metadata: { title: 'X' } } },
    mediaProgress: { progress: 0.3 }
  })
  assert.ok(idsOf(buildShelfEntityActions(descriptor, {})).includes('discardProgress'))
})

test('a finished book offers mark not finished instead of mark finished', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 3, metadata: { title: 'X' } } },
    mediaProgress: { progress: 1, isFinished: true }
  })
  const ids = idsOf(buildShelfEntityActions(descriptor, {}))
  assert.ok(ids.includes('markNotFinished'))
  assert.ok(!ids.includes('markFinished'))
})

test('play is the first action whenever it is available', () => {
  const descriptor = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 3, metadata: { title: 'X' } } } })
  assert.equal(buildShelfEntityActions(descriptor, {})[0].id, 'play')
})

test('a book with no playable tracks never offers play', () => {
  const descriptor = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 0, metadata: { title: 'X' } } } })
  assert.ok(!idsOf(buildShelfEntityActions(descriptor, {})).includes('play'))
})

test('playlist and web client actions require a server connection', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'll_1', isLocal: true, media: { numTracks: 3, metadata: { title: 'X' } } }
  })
  const offline = idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: false }))
  assert.ok(!offline.includes('addToPlaylist'))
  assert.ok(!offline.includes('openWebClient'))
  assert.ok(offline.includes('play'), 'a local book still plays offline')
})

test('local file actions appear only when a local copy exists', () => {
  const server = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } } })
  assert.ok(!idsOf(buildShelfEntityActions(server, {})).includes('manageLocal'))

  const downloaded = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } }, localLibraryItem: { id: 'll_1' } }
  })
  const ids = idsOf(buildShelfEntityActions(downloaded, {}))
  assert.ok(ids.includes('manageLocal'))
  assert.ok(ids.includes('deleteLocal'))
})

test('destructive actions are marked so the UI can style and confirm them', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } }, localLibraryItem: { id: 'll_1' } },
    mediaProgress: { progress: 0.5 }
  })
  const actions = buildShelfEntityActions(descriptor, {})
  const byId = Object.fromEntries(actions.map((a) => [a.id, a]))
  assert.equal(byId.deleteLocal.destructive, true)
  assert.equal(byId.discardProgress.destructive, true)
  assert.equal(byId.play.destructive, false)
})

test('a podcast opens its episodes and is never marked finished as a whole', () => {
  const descriptor = describeShelfEntity({ libraryItem: { id: 'li_2', mediaType: 'podcast', media: { numEpisodes: 4, metadata: { title: 'Show' } } } })
  const ids = idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true }))
  assert.ok(ids.includes('viewEpisodes'))
  assert.ok(!ids.includes('markFinished'))
  assert.ok(!ids.includes('addToPlaylist'), 'playlists take episodes, not whole podcasts')
})

test('a podcast episode behaves like a book for progress and playlists', () => {
  const descriptor = describeShelfEntity({
    entityType: 'episode',
    libraryItem: { id: 'li_2', mediaType: 'podcast', media: { metadata: { title: 'Show' } } },
    episode: { id: 'ep_1', title: 'Episode One' },
    mediaProgress: { progress: 0.6 }
  })
  const ids = idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true }))
  assert.equal(descriptor.type, 'episode')
  assert.equal(descriptor.title, 'Episode One')
  assert.equal(descriptor.routeTo, '/item/li_2/ep_1')
  assert.ok(ids.includes('play'))
  assert.ok(ids.includes('markFinished'))
  assert.ok(ids.includes('discardProgress'))
  assert.ok(ids.includes('addToPlaylist'))
})

test('a series opens itself and offers no book-only actions', () => {
  const descriptor = describeShelfEntity({ entityType: 'series', series: { id: 'ser_1', name: 'S', books: [{ id: 'a' }] } })
  const ids = idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true }))
  assert.ok(ids.includes('viewSeries'))
  assert.ok(!ids.includes('addToPlaylist'))
  assert.ok(!ids.includes('manageLocal'))
})

test('an empty series offers no play action', () => {
  const descriptor = describeShelfEntity({ entityType: 'series', series: { id: 'ser_1', name: 'S', books: [] } })
  assert.ok(!idsOf(buildShelfEntityActions(descriptor, {})).includes('play'))
})

test('a playlist and a collection each open themselves', () => {
  const playlist = describeShelfEntity({ entityType: 'playlist', playlist: { id: 'pl_1', name: 'P', items: [{}] } })
  assert.ok(idsOf(buildShelfEntityActions(playlist, {})).includes('viewPlaylist'))

  const collection = describeShelfEntity({ entityType: 'collection', collection: { id: 'co_1', name: 'C', books: [{}] } })
  assert.ok(idsOf(buildShelfEntityActions(collection, {})).includes('viewCollection'))
})

test('remove from playlist appears only while viewing that playlist', () => {
  const descriptor = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } } })
  assert.ok(!idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true })).includes('removeFromPlaylist'))
  assert.ok(idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true, playlist: { id: 'pl_1' } })).includes('removeFromPlaylist'))
})

test('selection is offered only where the shelf supports it', () => {
  const descriptor = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } } })
  assert.ok(!idsOf(buildShelfEntityActions(descriptor, {})).includes('select'))
  assert.ok(idsOf(buildShelfEntityActions(descriptor, { canSelect: true })).includes('select'))
})

test('every action carries the fields the UI needs to render it', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } }, localLibraryItem: { id: 'll_1' } },
    mediaProgress: { progress: 0.5 }
  })
  const actions = buildShelfEntityActions(descriptor, { isConnectedToServer: true, canSelect: true })
  assert.ok(actions.length > 0)
  for (const action of actions) {
    assert.equal(typeof action.id, 'string')
    assert.equal(typeof action.labelKey, 'string')
    assert.equal(typeof action.icon, 'string')
    assert.ok(SHELF_ACTION_GROUPS.includes(action.group), `unknown group ${action.group}`)
    assert.equal(typeof action.destructive, 'boolean')
  }
})

test('actions are emitted grouped, in a stable order', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } }, localLibraryItem: { id: 'll_1' } },
    mediaProgress: { progress: 0.5 }
  })
  const actions = buildShelfEntityActions(descriptor, { isConnectedToServer: true, canSelect: true })
  const groupOrder = actions.map((a) => SHELF_ACTION_GROUPS.indexOf(a.group))
  for (let i = 1; i < groupOrder.length; i++) {
    assert.ok(groupOrder[i] >= groupOrder[i - 1], 'groups must not interleave')
  }
})

test('action ids are unique within a single build', () => {
  const descriptor = describeShelfEntity({
    entityType: 'book',
    libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } }, localLibraryItem: { id: 'll_1' } },
    mediaProgress: { progress: 0.5 }
  })
  const ids = idsOf(buildShelfEntityActions(descriptor, { isConnectedToServer: true, canSelect: true, playlist: { id: 'p' } }))
  assert.equal(new Set(ids).size, ids.length)
})

test('building actions for a missing descriptor yields an empty list', () => {
  assert.deepEqual(buildShelfEntityActions(null, {}), [])
  assert.deepEqual(buildShelfEntityActions({ type: 'unknown-thing', id: 'x' }, {}), [])
})

test('building actions without a context does not throw', () => {
  const descriptor = describeShelfEntity({ entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } } })
  assert.ok(buildShelfEntityActions(descriptor).length > 0)
})

test('every entity type it claims to support produces at least one action', () => {
  const samples = {
    book: { entityType: 'book', libraryItem: { id: 'li_1', media: { numTracks: 1, metadata: { title: 'X' } } } },
    podcast: { libraryItem: { id: 'li_2', mediaType: 'podcast', media: { numEpisodes: 1, metadata: { title: 'X' } } } },
    episode: { entityType: 'episode', libraryItem: { id: 'li_2', mediaType: 'podcast', media: { metadata: {} } }, episode: { id: 'ep', title: 'E' } },
    series: { entityType: 'series', series: { id: 's', name: 'S', books: [{ id: 'a' }] } },
    collection: { entityType: 'collection', collection: { id: 'c', name: 'C', books: [{}] } },
    playlist: { entityType: 'playlist', playlist: { id: 'p', name: 'P', items: [{}] } }
  }
  for (const type of SHELF_ENTITY_TYPES) {
    const descriptor = describeShelfEntity(samples[type])
    assert.ok(descriptor, `no sample for ${type}`)
    assert.equal(descriptor.type, type)
    assert.ok(buildShelfEntityActions(descriptor, { isConnectedToServer: true }).length > 0, `${type} produced no actions`)
  }
})
