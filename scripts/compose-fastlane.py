#!/usr/bin/env python3
"""
Build the Fastlane metadata images that F-Droid and IzzyOnDroid read.

Both repos pick the Fastlane tree from the same tag they build the app from,
so this runs before tagging, not after.

The only real transform is the aspect ratio. IzzyOnDroid asks that a phone
screenshot be at most 2:1 high, and every modern phone is taller than that --
the Pixel 8 Pro captures here are 1008x2244, or 2.226:1. Cropping would cost
the player controls at the bottom of the frame, so the frames are matted
sideways instead: nothing is lost and the ratio lands on exactly 2:1.

The mat colour is the Night canvas, which is also what the status and
navigation bands in every capture are already filled with, so the mat reads as
a continuation of the system bars rather than as a border bolted on.
"""
from PIL import Image
import pathlib
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / 'docs' / 'screenshots'
PLAY = ROOT / 'docs' / 'play'
OUT = ROOT / 'fastlane' / 'metadata' / 'android' / 'en-US' / 'images'

MAT = (33, 35, 55)  # #212337, the Night canvas
MAX_RATIO = 2.0

# The F-Droid client shows these as a horizontal strip and most people stop
# after two, so the two claims that distinguish this fork go first: shelves
# dense enough to fit four covers per row, then the long-press panel. Home is
# fourth rather than first because its Continue Listening rail is half empty
# on a fresh library, which is a poor frame to lead with.
SCREENS = [
    'rails',
    'peek',
    'player',
    'home',
    'drawer',
    'theme-black',
    'theme-terminal',
    'theme-graphite',
    'theme-ember',
]


def mat_to_ratio(im):
    """Widen the frame until it is no taller than MAX_RATIO, centred."""
    if im.height <= im.width * MAX_RATIO:
        return im
    width = -(-im.height // MAX_RATIO)  # ceil, so rounding cannot leave us over
    out = Image.new('RGB', (int(width), im.height), MAT)
    out.paste(im, ((int(width) - im.width) // 2, 0))
    return out


def main():
    phone = OUT / 'phoneScreenshots'
    phone.mkdir(parents=True, exist_ok=True)

    for n, name in enumerate(SCREENS, start=1):
        src = SHOTS / f'{name}.png'
        # Flattened onto the mat rather than composited over nothing: a stray
        # alpha channel would otherwise be dropped to black by the repo's own
        # recompression, which is not what these frames should fall back to.
        im = Image.open(src).convert('RGBA')
        flat = Image.new('RGB', im.size, MAT)
        flat.paste(im, (0, 0), im)

        out = mat_to_ratio(flat)
        dest = phone / f'{n:02d}.png'
        out.save(dest, optimize=True)
        print(f'  {dest.relative_to(ROOT)}  {out.width}x{out.height}'
              f'  ratio {out.height / out.width:.3f}  <- {name}')

    for src, dest in ((PLAY / 'icon-512.png', OUT / 'icon.png'),
                      (PLAY / 'feature-graphic.png', OUT / 'featureGraphic.png')):
        shutil.copyfile(src, dest)
        with Image.open(dest) as im:
            print(f'  {dest.relative_to(ROOT)}  {im.width}x{im.height}  mode={im.mode}')


if __name__ == '__main__':
    main()
