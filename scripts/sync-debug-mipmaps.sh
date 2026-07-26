#!/usr/bin/env bash
# Copy NightShelf launcher mipmaps from main → debug so debug build icons cannot drift.
# Android merges src/debug/res over src/main/res; stale debug mipmaps override main silently.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MAIN="$ROOT/android/app/src/main/res"
DEBUG="$ROOT/android/app/src/debug/res"
for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi mipmap-anydpi-v26; do
  rm -rf "$DEBUG/$dir"
  cp -a "$MAIN/$dir" "$DEBUG/"
done

# The debug source set also carries its own copies of identity drawables, which
# override main for debug builds in exactly the same silent way the mipmaps do.
mkdir -p "$DEBUG/drawable"
for f in icon_monochrome.xml ic_launcher_foreground.xml; do
  [ -f "$MAIN/drawable/$f" ] && cp -a "$MAIN/drawable/$f" "$DEBUG/drawable/$f"
done

echo "Synced debug mipmaps and identity drawables from main."
