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

const { getActiveGenre, selectQuickGenres } = loadUtil('libraryGenreChips.js')

test('prefers concise genres over compound metadata values', () => {
  const genres = ['Action & Adventure, Anthologies & Short Stories', 'Action', 'Adventure', 'Science Fiction', 'Action']

  assert.deepEqual(selectQuickGenres(genres, 'all', 3), ['Action', 'Adventure', 'Science Fiction'])
})

test('keeps the active encoded genre at the front of the quick filters', () => {
  const active = 'genres.Action%20%26%20Adventure%2C%20Anthologies%20%26%20Short%20Stories'
  const genres = ['Action', 'Adventure', 'Action & Adventure, Anthologies & Short Stories']

  assert.equal(getActiveGenre(active), 'Action & Adventure, Anthologies & Short Stories')
  assert.deepEqual(selectQuickGenres(genres, active, 2), ['Action & Adventure, Anthologies & Short Stories', 'Action'])
})

test('handles invalid or repeated genre data safely', () => {
  assert.deepEqual(selectQuickGenres([null, '', 'Action', 'action', '  Adventure  ']), ['Action', 'Adventure'])
  assert.equal(getActiveGenre('authors.someone'), null)
})
