function shouldKnockOutPixel({ r, g, b, a }, threshold = 220) {
  if (a === 0) return true
  return r >= threshold && g >= threshold && b >= threshold
}

function boostLuminance({ r, g, b, a }, factor = 1.35) {
  const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)))
  return { r: clamp(r * factor), g: clamp(g * factor), b: clamp(b * factor), a }
}

function processRgbaBuffer(data, { threshold = 220, boost = 1.35 } = {}) {
  for (let i = 0; i < data.length; i += 4) {
    const px = { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] }
    if (shouldKnockOutPixel(px, threshold)) {
      data[i + 3] = 0
      continue
    }
    const out = boostLuminance(px, boost)
    data[i] = out.r
    data[i + 1] = out.g
    data[i + 2] = out.b
  }
  return data
}

module.exports = { shouldKnockOutPixel, boostLuminance, processRgbaBuffer }
