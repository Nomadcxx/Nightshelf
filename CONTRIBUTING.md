# Contributing

## Artwork

Touching any launcher or notification artwork means running
`./scripts/sync-debug-mipmaps.sh` afterwards. Android merges `src/debug/res/`
over `src/main/res/`, so a stale debug mipmap silently replaces the real icon
and the build still succeeds.

## Themes

Theme values are edited in `utils/themes.js` and nowhere else. Run
`node scripts/generate-theme-css.js` after any change, then
`node --test tests/themes.test.js` — the suite fails if the committed CSS has
drifted from the registry, or if a theme breaks WCAG AA. `design.md` at the
repo root is the locked system; read it before changing colour or glass.

## Commits

No AI or assistant attribution, and no `Co-authored-by` trailers.

## Screenshots

`docs/screens.png` and `docs/themes.png` are composed, not captured. The
sources live in `docs/screenshots/`; regenerate with:

```bash
python3 scripts/compose-screenshots.py
```

The compositor trims the status bar and navigation bar from every capture.
Left in, one strip shows four different clock times and battery levels, which
reads as four snapshots rather than one asset.
