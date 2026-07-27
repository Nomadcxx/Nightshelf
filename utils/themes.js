/**
 * The single source of truth for NightShelf's themes.
 *
 * Every theme lives here — palette, native chrome colour, and glass treatment.
 * Before this file existed, adding or changing a theme meant editing four places
 * (tailwind.css, init.client.js twice, settings.vue, en-us.json) and nothing
 * checked that they agreed. They stopped agreeing: the Terminal theme shipped
 * with surfaces byte-identical to Night, and Black OLED shipped at #171928,
 * which is not black and so did nothing an OLED panel could act on.
 *
 * The CSS in assets/tailwind.css and assets/motion.css is GENERATED from this
 * file by scripts/generate-theme-css.js. Do not hand-edit the generated blocks;
 * change the values here and re-run the generator. tests/themes.test.js fails
 * if the committed CSS has drifted, and fails if any theme breaks WCAG AA.
 *
 * Colours are sRGB triplets because tailwind.config.js composes them as
 * `rgb(var(--color-x) / <alpha-value>)` to support opacity utilities, and
 * because OKLCH needs WebView 111+ while minSdk 24 allows older WebViews.
 * The palettes were designed in OKLCH; design.md records the source values.
 */

export const DEFAULT_THEME = 'night'

export const THEMES = {
  night: {
    id: 'night',
    label: 'Night',
    stringKey: 'LabelThemeNight',
    description: 'Navy ground, lilac accent',
    statusBar: '#212337',
    colors: {
      'bg': [33, 35, 55],
      'bg-hover': [50, 52, 73],
      'fg': [235, 250, 250],
      'fg-muted': [156, 157, 167],
      'primary': [33, 35, 55],
      'secondary': [50, 52, 73],
      'border': [69, 71, 89],
      'border-strong': [109, 109, 138],
      'bg-toggle': [50, 52, 73],
      'bg-toggle-selected': [69, 71, 89],
      'track': [69, 71, 89],
      'track-cursor': [55, 244, 153],
      'track-buffered': [112, 129, 208],
      'accent': [164, 140, 242],
      'info': [4, 209, 249],
      'success': [55, 244, 153],
      'warning': [247, 198, 127],
      'danger': [241, 108, 117],
    },
    gradients: {
      'item-page': 'linear-gradient(169deg, rgba(33, 35, 55, 0.4) 0%, rgba(33, 35, 55, 1) 80%)',
      'audio-player': 'linear-gradient(180deg, rgba(33, 35, 55, 0) 0%, rgba(33, 35, 55, 1) 80%)',
      'minimized-audio-player': 'linear-gradient(145deg, rgba(50, 52, 73, 0.5) 0%, rgba(33, 35, 55, 0.95) 60%)',
    },
    glass: {
      'shelf-blur': '14px',
      'shelf-saturate': '125%',
      'shelf-tint': 'rgba(18, 20, 38, 0.6)',
      'float-blur': '24px',
      'float-saturate': '125%',
      'float-tint': 'rgba(14, 16, 32, 0.73)',
    },
  },
  black: {
    id: 'black',
    label: 'Black OLED',
    stringKey: 'LabelThemeBlack',
    description: 'True black; pixels off on OLED',
    statusBar: '#000000',
    colors: {
      'bg': [0, 0, 0],
      'bg-hover': [32, 32, 46],
      'fg': [231, 231, 237],
      'fg-muted': [151, 151, 161],
      'primary': [0, 0, 0],
      'secondary': [18, 17, 28],
      'border': [52, 52, 65],
      'border-strong': [89, 89, 107],
      'bg-toggle': [18, 17, 28],
      'bg-toggle-selected': [52, 52, 65],
      'track': [52, 52, 65],
      'track-cursor': [51, 245, 160],
      'track-buffered': [112, 124, 182],
      'accent': [178, 151, 252],
      'info': [55, 210, 242],
      'success': [51, 245, 160],
      'warning': [252, 190, 98],
      'danger': [249, 111, 116],
    },
    gradients: {
      'item-page': 'rgb(0, 0, 0)',
      'audio-player': 'rgb(0, 0, 0)',
      'minimized-audio-player': 'rgb(0, 0, 0)',
    },
    glass: {
      'shelf-blur': '14px',
      'shelf-saturate': '120%',
      'shelf-tint': 'rgba(0, 0, 0, 0.66)',
      'float-blur': '24px',
      'float-saturate': '120%',
      'float-tint': 'rgba(0, 0, 0, 0.8)',
    },
  },
  terminal: {
    id: 'terminal',
    label: 'Terminal',
    stringKey: 'LabelThemeTerminal',
    description: 'Phosphor green on a CRT ground',
    statusBar: '#031007',
    colors: {
      'bg': [3, 16, 7],
      'bg-hover': [24, 45, 31],
      'fg': [216, 241, 223],
      'fg-muted': [137, 167, 146],
      'primary': [3, 16, 7],
      'secondary': [11, 30, 18],
      'border': [32, 70, 47],
      'border-strong': [19, 110, 64],
      'bg-toggle': [11, 30, 18],
      'bg-toggle-selected': [32, 70, 47],
      'track': [32, 70, 47],
      'track-cursor': [51, 245, 160],
      'track-buffered': [35, 147, 130],
      'accent': [51, 245, 160],
      'info': [80, 221, 213],
      'success': [51, 245, 160],
      'warning': [244, 195, 82],
      'danger': [246, 109, 103],
    },
    gradients: {
      'item-page': 'linear-gradient(169deg, rgba(3, 16, 7, 0.4) 0%, rgba(3, 16, 7, 1) 80%)',
      'audio-player': 'linear-gradient(180deg, rgba(3, 16, 7, 0) 0%, rgba(3, 16, 7, 1) 80%)',
      'minimized-audio-player': 'linear-gradient(145deg, rgba(11, 30, 18, 0.5) 0%, rgba(3, 16, 7, 0.95) 60%)',
    },
    glass: {
      'shelf-blur': '14px',
      'shelf-saturate': '135%',
      'shelf-tint': 'rgba(4, 20, 10, 0.62)',
      'float-blur': '24px',
      'float-saturate': '135%',
      'float-tint': 'rgba(2, 14, 7, 0.76)',
    },
  },
  graphite: {
    id: 'graphite',
    label: 'Graphite',
    stringKey: 'LabelThemeGraphite',
    description: 'Neutral dark, steel accent',
    statusBar: '#15171a',
    colors: {
      'bg': [21, 23, 26],
      'bg-hover': [49, 52, 56],
      'fg': [236, 239, 241],
      'fg-muted': [156, 159, 162],
      'primary': [21, 23, 26],
      'secondary': [36, 39, 42],
      'border': [67, 71, 75],
      'border-strong': [96, 101, 106],
      'bg-toggle': [36, 39, 42],
      'bg-toggle-selected': [67, 71, 75],
      'track': [67, 71, 75],
      'track-cursor': [95, 225, 158],
      'track-buffered': [82, 136, 162],
      'accent': [93, 190, 233],
      'info': [55, 210, 242],
      'success': [95, 225, 158],
      'warning': [252, 190, 98],
      'danger': [246, 107, 113],
    },
    gradients: {
      'item-page': 'linear-gradient(169deg, rgba(21, 23, 26, 0.4) 0%, rgba(21, 23, 26, 1) 80%)',
      'audio-player': 'linear-gradient(180deg, rgba(21, 23, 26, 0) 0%, rgba(21, 23, 26, 1) 80%)',
      'minimized-audio-player': 'linear-gradient(145deg, rgba(36, 39, 42, 0.5) 0%, rgba(21, 23, 26, 0.95) 60%)',
    },
    glass: {
      'shelf-blur': '14px',
      'shelf-saturate': '110%',
      'shelf-tint': 'rgba(16, 18, 21, 0.62)',
      'float-blur': '24px',
      'float-saturate': '110%',
      'float-tint': 'rgba(12, 14, 16, 0.75)',
    },
  },
  ember: {
    id: 'ember',
    label: 'Ember',
    stringKey: 'LabelThemeEmber',
    description: 'Warm ground, minimal blue light',
    statusBar: '#2b190d',
    colors: {
      'bg': [43, 25, 13],
      'bg-hover': [75, 53, 38],
      'fg': [246, 235, 221],
      'fg-muted': [171, 155, 141],
      'primary': [43, 25, 13],
      'secondary': [59, 39, 26],
      'border': [91, 71, 57],
      'border-strong': [127, 99, 81],
      'bg-toggle': [59, 39, 26],
      'bg-toggle-selected': [91, 71, 57],
      'track': [91, 71, 57],
      'track-cursor': [150, 217, 135],
      'track-buffered': [167, 120, 81],
      'accent': [246, 167, 84],
      'info': [97, 206, 212],
      'success': [150, 217, 135],
      'warning': [254, 200, 75],
      'danger': [237, 104, 99],
    },
    gradients: {
      'item-page': 'linear-gradient(169deg, rgba(43, 25, 13, 0.4) 0%, rgba(43, 25, 13, 1) 80%)',
      'audio-player': 'linear-gradient(180deg, rgba(43, 25, 13, 0) 0%, rgba(43, 25, 13, 1) 80%)',
      'minimized-audio-player': 'linear-gradient(145deg, rgba(59, 39, 26, 0.5) 0%, rgba(43, 25, 13, 0.95) 60%)',
    },
    glass: {
      'shelf-blur': '14px',
      'shelf-saturate': '128%',
      'shelf-tint': 'rgba(34, 20, 11, 0.62)',
      'float-blur': '24px',
      'float-saturate': '128%',
      'float-tint': 'rgba(26, 15, 8, 0.76)',
    },
  },
}

export const THEME_IDS = Object.keys(THEMES)

/**
 * Normalise a stored theme id.
 *
 * 'dark' and 'light' are upstream Audiobookshelf values that predate NightShelf;
 * anything unrecognised also lands on the default rather than leaving the app
 * with no palette at all.
 */
export function migrateTheme(theme) {
  if (theme && Object.prototype.hasOwnProperty.call(THEMES, theme)) return theme
  return DEFAULT_THEME
}

export function themeStatusBar(theme) {
  return (THEMES[migrateTheme(theme)] || THEMES[DEFAULT_THEME]).statusBar
}
