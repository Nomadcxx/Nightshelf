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

const { buildLibraryItemsQuery, getLibraryItemsTotal } = loadUtil('libraryItemsQuery.js')

test('builds an unfiltered first-page library items query', () => {
  const query = new URLSearchParams(buildLibraryItemsQuery())

  assert.equal(query.get('filter'), null)
  assert.equal(query.get('sort'), null)
  assert.equal(query.get('limit'), '24')
  assert.equal(query.get('page'), '0')
  assert.equal(query.get('minified'), '1')
  assert.equal(query.get('include'), 'rssfeed,numEpisodesIncomplete')
})

test('preserves library filter, sort, and collapsed-series settings', () => {
  const query = new URLSearchParams(
    buildLibraryItemsQuery({
      filterBy: 'genres.Science Fiction',
      orderBy: 'media.metadata.title',
      orderDesc: true,
      collapseSeries: true,
      limit: 12,
      page: 3
    })
  )

  assert.equal(query.get('filter'), 'genres.Science Fiction')
  assert.equal(query.get('sort'), 'media.metadata.title')
  assert.equal(query.get('desc'), '1')
  assert.equal(query.get('collapseseries'), '1')
  assert.equal(query.get('limit'), '12')
  assert.equal(query.get('page'), '3')
})

test('only accepts a valid paginated payload total', () => {
  assert.equal(getLibraryItemsTotal({ total: 1920, results: [{}] }), 1920)
  assert.equal(getLibraryItemsTotal({ total: '18', results: [] }), 18)
  assert.equal(getLibraryItemsTotal({ total: -1, results: [] }), null)
  assert.equal(getLibraryItemsTotal({ total: 90 }), null)
  assert.equal(getLibraryItemsTotal(null), null)
})
