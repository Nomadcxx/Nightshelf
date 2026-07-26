/**
 * Peek geometry.
 *
 * When a long press commits, the pressed cover appears to lift off the shelf
 * and the action panel appears beside it. That illusion only holds if the
 * lifted cover starts exactly where the real card is, so the card measures
 * itself and hands the rect here; this module decides where the cover lands and
 * where the panel goes without touching the DOM.
 *
 * The hard requirement is that nothing lands off screen. A shelf card can sit
 * anywhere — half-scrolled off the top, hard against the right edge, at the
 * bottom behind the player — and every one of those cases has to produce a
 * layout a thumb can reach.
 */

/** Minimum gap between anything Peek draws and the edge of the viewport. */
export const PEEK_EDGE_MARGIN = 16

/** Gap between the lifted cover and the action panel. */
export const PEEK_GAP = 12

/** Vertical space one action row occupies, plus the panel's own padding. */
const PEEK_ACTION_ROW_HEIGHT = 48
const PEEK_PANEL_HEADER_HEIGHT = 64
const PEEK_PANEL_PADDING = 16

/** How much bigger the lifted cover is than the card, before clamping. */
const PEEK_LIFT_FACTOR = 1.45

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Reduce a DOMRect (or anything shaped like one) to plain numbers.
 * Returns null for a rect with no area — a card that has been recycled out of
 * the DOM measures as zero, and lifting from nothing looks like a glitch.
 */
export function normalizeOriginRect(rect) {
  if (!rect || typeof rect !== 'object') return null
  const { left, top, width, height } = rect
  if (![left, top, width, height].every(isFiniteNumber)) return null
  if (width <= 0 || height <= 0) return null
  return { left, top, width, height }
}

function clamp(value, min, max) {
  // When the available range is inverted — a viewport smaller than the content —
  // min wins, keeping the top-left corner visible rather than centring overflow.
  if (max < min) return min
  return Math.min(max, Math.max(min, value))
}

function estimatePanelHeight(actionCount, viewportHeight) {
  const rows = Math.max(1, Math.floor(actionCount) || 1)
  const natural = PEEK_PANEL_HEADER_HEIGHT + PEEK_PANEL_PADDING + rows * PEEK_ACTION_ROW_HEIGHT
  // A long list scrolls inside the panel rather than pushing it off screen.
  const maxHeight = viewportHeight - PEEK_EDGE_MARGIN * 2
  return Math.max(1, Math.min(natural, maxHeight))
}

/**
 * Work out where the lifted cover and the action panel belong.
 *
 * @param {object} originRect  the pressed card's viewport rect
 * @param {object} viewport    { width, height }
 * @param {object} [options]   { actionCount }
 * @returns {object|null} { cover, panel, placement } or null if unlayoutable
 */
export function computePeekLayout(originRect, viewport, options = {}) {
  const origin = normalizeOriginRect(originRect)
  if (!origin) return null
  if (!viewport || !isFiniteNumber(viewport.width) || !isFiniteNumber(viewport.height)) return null
  if (viewport.width <= 0 || viewport.height <= 0) return null

  const actionCount = options.actionCount || 5
  const panelHeight = estimatePanelHeight(actionCount, viewport.height)

  // Space left for the cover once the panel and its gap are accounted for.
  const availableHeight = viewport.height - PEEK_EDGE_MARGIN * 2
  const heightForCover = Math.max(1, availableHeight - panelHeight - PEEK_GAP)

  const aspect = origin.height / origin.width
  let coverWidth = origin.width * PEEK_LIFT_FACTOR
  let coverHeight = coverWidth * aspect

  // Shrink to fit rather than overflow, preserving the aspect ratio both ways.
  const maxCoverWidth = viewport.width - PEEK_EDGE_MARGIN * 2
  if (coverWidth > maxCoverWidth) {
    coverWidth = maxCoverWidth
    coverHeight = coverWidth * aspect
  }
  if (coverHeight > heightForCover) {
    coverHeight = heightForCover
    coverWidth = coverHeight / aspect
  }

  // Horizontally the cover stays over its origin so the lift reads as the same
  // object moving, not a new one appearing.
  const originCentreX = origin.left + origin.width / 2
  const coverLeft = clamp(originCentreX - coverWidth / 2, PEEK_EDGE_MARGIN, viewport.width - PEEK_EDGE_MARGIN - coverWidth)

  // Prefer the panel below the cover; flip above when the card sits low enough
  // that "below" would push the panel off the bottom.
  const spaceBelowOrigin = viewport.height - (origin.top + origin.height)
  const placement = spaceBelowOrigin >= panelHeight + PEEK_GAP + PEEK_EDGE_MARGIN ? 'below' : 'above'

  const blockHeight = coverHeight + PEEK_GAP + panelHeight
  const originCentreY = origin.top + origin.height / 2

  let coverTop
  if (placement === 'below') {
    // Keep the cover near where it was, then clamp the whole block on screen.
    coverTop = clamp(origin.top, PEEK_EDGE_MARGIN, viewport.height - PEEK_EDGE_MARGIN - blockHeight)
  } else {
    // Panel above: the cover sits at the bottom of the block.
    const blockTop = clamp(originCentreY - blockHeight / 2, PEEK_EDGE_MARGIN, viewport.height - PEEK_EDGE_MARGIN - blockHeight)
    coverTop = blockTop + panelHeight + PEEK_GAP
  }

  const panelTop = placement === 'below' ? coverTop + coverHeight + PEEK_GAP : coverTop - PEEK_GAP - panelHeight

  return {
    placement,
    cover: {
      top: coverTop,
      left: coverLeft,
      width: coverWidth,
      height: coverHeight
    },
    panel: {
      top: panelTop,
      left: PEEK_EDGE_MARGIN,
      width: viewport.width - PEEK_EDGE_MARGIN * 2,
      height: panelHeight
    }
  }
}
