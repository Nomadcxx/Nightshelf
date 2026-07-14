function shouldKnockOutPixel({ r, g, b, a }, threshold = 220) {
  if (a === 0) return true
  return r >= threshold && g >= threshold && b >= threshold
}

/**
 * Only knock out near-white pixels near the image edge so bright glyph
 * centers (e.g. a white star) are preserved.
 */
function shouldKnockOutPixelAt(x, y, width, height, px, threshold = 220, edgeRatio = 0.72) {
  if (!shouldKnockOutPixel(px, threshold)) return false
  const cx = width / 2
  const cy = height / 2
  const dx = (x - cx) / (width / 2)
  const dy = (y - cy) / (height / 2)
  const dist = Math.sqrt(dx * dx + dy * dy)
  return dist > edgeRatio
}

function boostLuminance({ r, g, b, a }, factor = 1.35) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
  return { r: clamp(r * factor), g: clamp(g * factor), b: clamp(b * factor), a }
}

function processRgbaBuffer(data, { threshold = 220, boost = 1.35, width, height, edgeAware = false } = {}) {
  for (let i = 0; i < data.length; i += 4) {
    const px = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
    let knock = false
    if (edgeAware && width && height) {
      const idx = i / 4
      const x = idx % width
      const y = Math.floor(idx / width)
      knock = shouldKnockOutPixelAt(x, y, width, height, px, threshold)
    } else {
      knock = shouldKnockOutPixel(px, threshold)
    }
    if (knock) {
      data[i + 3] = 0
      continue
    }
    if (shouldKnockOutPixel(px, 250)) {
      // preserve pure white glyph cores when edge-aware
      if (!edgeAware) {
        data[i + 3] = 0
        continue
      }
    }
    const out = boostLuminance(px, boost)
    data[i] = out.r
    data[i + 1] = out.g
    data[i + 2] = out.b
  }
  return data
}

module.exports = { shouldKnockOutPixel, shouldKnockOutPixelAt, boostLuminance, processRgbaBuffer }
