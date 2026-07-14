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
echo "Synced debug mipmaps from main."
