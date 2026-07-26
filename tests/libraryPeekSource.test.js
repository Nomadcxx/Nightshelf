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

const { PEEK_EDGE_MARGIN, normalizeOriginRect, computePeekLayout } = loadUtil('libraryPeekSource.js')

const viewport = { width: 412, height: 915 }

function rect(left, top, width, height) {
  return { left, top, width, height, right: left + width, bottom: top + height }
}

// --- origin normalization --------------------------------------------------

test('normalizes a DOMRect-like object to plain numbers', () => {
  const origin = normalizeOriginRect(rect(20, 100, 120, 192))
  assert.deepEqual(origin, { left: 20, top: 100, width: 120, height: 192 })
})

test('rejects a rect with no area', () => {
  assert.equal(normalizeOriginRect(rect(0, 0, 0, 192)), null)
  assert.equal(normalizeOriginRect(rect(0, 0, 120, 0)), null)
  assert.equal(normalizeOriginRect(null), null)
  assert.equal(normalizeOriginRect({ left: 'a', top: 0, width: 10, height: 10 }), null)
})

// --- layout ----------------------------------------------------------------

test('produces a cover, a panel and a placement', () => {
  const layout = computePeekLayout(rect(20, 300, 120, 192), viewport)
  assert.ok(layout.cover)
  assert.ok(layout.panel)
  assert.ok(['below', 'above'].includes(layout.placement))
})

test('the lifted cover is larger than the card it came from', () => {
  const origin = rect(20, 300, 120, 192)
  const layout = computePeekLayout(origin, viewport)
  assert.ok(layout.cover.width > origin.width)
  assert.ok(layout.cover.height > origin.height)
})

test('the lifted cover keeps the source aspect ratio', () => {
  const origin = rect(20, 300, 120, 192)
  const layout = computePeekLayout(origin, viewport)
  const sourceRatio = origin.height / origin.width
  const liftedRatio = layout.cover.height / layout.cover.width
  assert.ok(Math.abs(sourceRatio - liftedRatio) < 0.01, `${sourceRatio} vs ${liftedRatio}`)
})

test('the cover stays centred on the card it came from when there is room', () => {
  const origin = rect(146, 300, 120, 192)
  const layout = computePeekLayout(origin, viewport)
  const originCentre = origin.left + origin.width / 2
  const coverCentre = layout.cover.left + layout.cover.width / 2
  assert.ok(Math.abs(originCentre - coverCentre) < 1)
})

test('a cover at the left edge is pulled inside the safe margin', () => {
  const layout = computePeekLayout(rect(2, 300, 120, 192), viewport)
  assert.ok(layout.cover.left >= PEEK_EDGE_MARGIN, `left was ${layout.cover.left}`)
})

test('a cover at the right edge is pulled inside the safe margin', () => {
  const layout = computePeekLayout(rect(viewport.width - 122, 300, 120, 192), viewport)
  assert.ok(layout.cover.left + layout.cover.width <= viewport.width - PEEK_EDGE_MARGIN)
})

test('nothing ever escapes the viewport vertically', () => {
  for (const top of [-40, 0, 200, 500, 800, 1200]) {
    const layout = computePeekLayout(rect(20, top, 120, 192), viewport)
    assert.ok(layout.cover.top >= PEEK_EDGE_MARGIN, `cover top ${layout.cover.top} at origin ${top}`)
    assert.ok(layout.cover.top + layout.cover.height <= viewport.height - PEEK_EDGE_MARGIN, `cover bottom overflows at origin ${top}`)
    assert.ok(layout.panel.top >= PEEK_EDGE_MARGIN, `panel top ${layout.panel.top} at origin ${top}`)
    assert.ok(layout.panel.top + layout.panel.height <= viewport.height - PEEK_EDGE_MARGIN, `panel bottom overflows at origin ${top}`)
  }
})

test('the cover and the panel never overlap', () => {
  for (const top of [0, 200, 400, 600, 850]) {
    const layout = computePeekLayout(rect(20, top, 120, 192), viewport)
    const coverBottom = layout.cover.top + layout.cover.height
    const panelBottom = layout.panel.top + layout.panel.height
    if (layout.placement === 'below') {
      assert.ok(layout.panel.top >= coverBottom, `overlap at origin ${top}`)
    } else {
      assert.ok(panelBottom <= layout.cover.top, `overlap at origin ${top}`)
    }
  }
})

test('a card near the bottom puts the panel above it', () => {
  const layout = computePeekLayout(rect(20, viewport.height - 220, 120, 192), viewport, { actionCount: 6 })
  assert.equal(layout.placement, 'above')
})

test('a card near the top puts the panel below it', () => {
  const layout = computePeekLayout(rect(20, 40, 120, 192), viewport, { actionCount: 6 })
  assert.equal(layout.placement, 'below')
})

test('the panel grows with the number of actions', () => {
  const few = computePeekLayout(rect(20, 300, 120, 192), viewport, { actionCount: 2 })
  const many = computePeekLayout(rect(20, 300, 120, 192), viewport, { actionCount: 9 })
  assert.ok(many.panel.height > few.panel.height)
})

test('the panel height is capped so a long action list still fits on screen', () => {
  const layout = computePeekLayout(rect(20, 300, 120, 192), viewport, { actionCount: 40 })
  assert.ok(layout.panel.height <= viewport.height - PEEK_EDGE_MARGIN * 2)
  assert.ok(layout.panel.top >= PEEK_EDGE_MARGIN)
  assert.ok(layout.panel.top + layout.panel.height <= viewport.height - PEEK_EDGE_MARGIN)
})

test('the layout survives a viewport shorter than the card', () => {
  const layout = computePeekLayout(rect(20, 10, 120, 192), { width: 320, height: 200 }, { actionCount: 5 })
  assert.ok(layout.cover.height > 0)
  assert.ok(layout.panel.height > 0)
  assert.ok(layout.cover.top >= 0)
})

test('an unusable origin or viewport yields no layout instead of NaN geometry', () => {
  assert.equal(computePeekLayout(null, viewport), null)
  assert.equal(computePeekLayout(rect(0, 0, 120, 192), { width: 0, height: 0 }), null)
  assert.equal(computePeekLayout(rect(0, 0, 120, 192), null), null)
})

test('every returned coordinate is a finite number', () => {
  const layout = computePeekLayout(rect(20, 300, 120, 192), viewport, { actionCount: 7 })
  for (const box of [layout.cover, layout.panel]) {
    for (const key of ['top', 'left', 'width', 'height']) {
      assert.ok(Number.isFinite(box[key]), `${key} was ${box[key]}`)
    }
  }
})

test('a square cover stays square', () => {
  const layout = computePeekLayout(rect(20, 300, 160, 160), viewport)
  assert.ok(Math.abs(layout.cover.width - layout.cover.height) < 1)
})
