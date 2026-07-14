# Debug resource overrides

`src/debug/res` is merged **on top of** `src/main/res` for debug builds. Any file here replaces the main variant with the same path.

**Launcher icons:** Keep `mipmap-*` in sync with main NightShelf icons. Stale debug mipmaps (e.g. old upside-down ABS art) override main silently on device.

After updating main launcher art, run from repo root:

```bash
./scripts/sync-debug-mipmaps.sh
```
