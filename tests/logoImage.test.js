const test = require('node:test')
const assert = require('node:assert/strict')
const { shouldKnockOutPixel, boostLuminance } = require('../utils/logoImage')

test('knocks out near-white opaque pixels', () => {
  assert.equal(shouldKnockOutPixel({ r: 253, g: 253, b: 254, a: 255 }, 220), true)
  assert.equal(shouldKnockOutPixel({ r: 237, g: 237, b: 237, a: 255 }, 220), true)
  assert.equal(shouldKnockOutPixel({ r: 40, g: 40, b: 80, a: 255 }, 220), false)
})

test('edge-aware knockout preserves center whites', () => {
  const { shouldKnockOutPixelAt } = require('../utils/logoImage')
  const white = { r: 255, g: 255, b: 255, a: 255 }
  assert.equal(shouldKnockOutPixelAt(256, 256, 512, 512, white, 220, 0.72), false)
  assert.equal(shouldKnockOutPixelAt(10, 10, 512, 512, white, 220, 0.72), true)
})

test('boostLuminance raises dark midtones without clipping white', () => {
  const out = boostLuminance({ r: 30, g: 40, b: 60, a: 255 }, 1.35)
  assert.ok(out.r > 30 && out.g > 40 && out.b > 60)
  assert.equal(boostLuminance({ r: 250, g: 250, b: 250, a: 255 }, 1.35).r, 255)
})
