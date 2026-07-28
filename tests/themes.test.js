const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { loadRegistry } = require('../scripts/generate-theme-css.js')

const { THEMES, THEME_IDS, DEFAULT_THEME, migrateTheme, themeStatusBar } = loadRegistry()

/* ---------------------------------------------------------------------- */
/* Contrast                                                               */
/* ---------------------------------------------------------------------- */

function relativeLuminance([r, g, b]) {
  const channel = (value) => {
    const c = value / 255
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function contrast(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * Perceptual distance in OKLab.
 *
 * WCAG contrast is the wrong tool for "do these two surfaces look different" —
 * it compresses badly at low luminance, and every NightShelf theme is dark.
 * Two canvases can sit at 1.1:1 and still be obviously different colours.
 */
function deltaE(a, b) {
  const toOklab = ([r, g, b2]) => {
    const lin = (v) => {
      const c = v / 255
      return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    }
    const [lr, lg, lb] = [lin(r), lin(g), lin(b2)]
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
    return [
      0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
    ]
  }
  const [l1, a1, b1] = toOklab(a)
  const [l2, a2, b2] = toOklab(b)
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2) * 100
}

test('body text meets WCAG AA on every theme', () => {
  for (const id of THEME_IDS) {
    const c = THEMES[id].colors
    assert.ok(contrast(c.fg, c.bg) >= 4.5, `${id}: fg on bg is ${contrast(c.fg, c.bg).toFixed(2)}:1`)
    assert.ok(contrast(c['fg-muted'], c.bg) >= 4.5, `${id}: muted on bg is ${contrast(c['fg-muted'], c.bg).toFixed(2)}:1`)
    // Muted text sits on cards as often as on the canvas, and the card is the
    // lighter of the two — so this is the binding constraint, not bg.
    assert.ok(
      contrast(c['fg-muted'], c.secondary) >= 4.5,
      `${id}: muted on secondary is ${contrast(c['fg-muted'], c.secondary).toFixed(2)}:1`
    )
  }
})

test('interactive boundaries and status colours meet the 3:1 minimum', () => {
  for (const id of THEME_IDS) {
    const c = THEMES[id].colors
    for (const token of ['border-strong', 'accent', 'chrome', 'danger', 'success', 'warning', 'info']) {
      const ratio = contrast(c[token], c.bg)
      assert.ok(ratio >= 3, `${id}: ${token} on bg is ${ratio.toFixed(2)}:1`)
    }
  }
})

/* ---------------------------------------------------------------------- */
/* Separation — the regression this whole redesign exists to prevent      */
/* ---------------------------------------------------------------------- */

test('no two themes share a canvas', () => {
  // Terminal shipped with surfaces byte-identical to Night (dE 0.0) and Black
  // OLED shipped 4.6 from Night. A floor of 5 keeps that from recurring; the
  // themes are all dark, so this band is inherently tight.
  for (let i = 0; i < THEME_IDS.length; i++) {
    for (let j = i + 1; j < THEME_IDS.length; j++) {
      const a = THEMES[THEME_IDS[i]]
      const b = THEMES[THEME_IDS[j]]
      const d = deltaE(a.colors.bg, b.colors.bg)
      assert.ok(d >= 5, `${a.id} and ${b.id} canvases are only dE ${d.toFixed(1)} apart`)
    }
  }
})

test('the OLED theme is actually black', () => {
  // Anything above zero lights the pixel, which is the entire point of the
  // theme. It previously shipped at #171928 and saved nothing.
  assert.deepEqual(THEMES.black.colors.bg, [0, 0, 0])
  assert.equal(THEMES.black.statusBar, '#000000')
})

test('OLED ink stays off pure white', () => {
  // Pure white on pure black smears on OLED panels during scroll.
  assert.ok(THEMES.black.colors.fg.every((channel) => channel < 255))
})

test('every theme defines every token', () => {
  const expected = Object.keys(THEMES[DEFAULT_THEME].colors)
  for (const id of THEME_IDS) {
    assert.deepEqual(Object.keys(THEMES[id].colors).sort(), [...expected].sort(), `${id} token set`)
    assert.deepEqual(Object.keys(THEMES[id].glass).sort(), Object.keys(THEMES[DEFAULT_THEME].glass).sort(), `${id} glass set`)
    assert.match(THEMES[id].statusBar, /^#[0-9a-f]{6}$/, `${id} status bar colour`)
  }
})

test('the status bar colour matches the theme canvas', () => {
  for (const id of THEME_IDS) {
    const [r, g, b] = THEMES[id].colors.bg
    const hex = `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`
    assert.equal(themeStatusBar(id), hex, `${id} status bar drifted from its canvas`)
  }
})

/* ---------------------------------------------------------------------- */
/* Migration                                                              */
/* ---------------------------------------------------------------------- */

test('unknown and legacy theme ids fall back to the default', () => {
  // 'dark' and 'light' are upstream Audiobookshelf values still in stored
  // settings on upgraded installs.
  for (const value of ['dark', 'light', '', null, undefined, 'nonsense', 0]) {
    assert.equal(migrateTheme(value), DEFAULT_THEME)
  }
  for (const id of THEME_IDS) {
    assert.equal(migrateTheme(id), id)
  }
})

test('migrateTheme is not fooled by inherited object properties', () => {
  assert.equal(migrateTheme('toString'), DEFAULT_THEME)
  assert.equal(migrateTheme('constructor'), DEFAULT_THEME)
})

/* ---------------------------------------------------------------------- */
/* Generated CSS                                                          */
/* ---------------------------------------------------------------------- */

test('the committed theme CSS matches the registry', () => {
  // The four-file edit is exactly how Terminal drifted into being a copy of
  // Night. Regeneration is checked rather than trusted.
  execFileSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'generate-theme-css.js'), '--check'], {
    stdio: 'pipe'
  })
})

test('no theme is referenced in CSS without being in the registry', () => {
  const css = fs.readFileSync(path.join(__dirname, '..', 'assets', 'tailwind.css'), 'utf8')
  const declared = [...css.matchAll(/html\[data-theme='([a-z-]+)'\]/g)].map((m) => m[1])
  for (const id of new Set(declared)) {
    assert.ok(THEME_IDS.includes(id), `tailwind.css styles unknown theme '${id}'`)
  }
  for (const id of THEME_IDS) {
    assert.ok(declared.includes(id), `theme '${id}' has no CSS block`)
  }
})
