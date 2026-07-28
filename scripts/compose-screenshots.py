#!/usr/bin/env python3
"""Compose the README screenshot strips.

Two different treatments on purpose. The app screens need their full height —
the resume hero and the player are about the whole screen. The theme shots are
a palette comparison, so they are cropped to the chrome and the first rows of
covers, which is all that carries the colour.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import pathlib

SRC = pathlib.Path('/home/nomadx/audiobookshelf-app/docs/screenshots')
OUT = pathlib.Path('/home/nomadx/audiobookshelf-app/docs')
FONT = '/home/nomadx/.local/share/fonts/JetBrains/JetBrainsMonoNerdFont-Regular.ttf'

BG      = (18, 19, 28)      # sits calmly on GitHub light and dark alike
LABEL   = (150, 152, 168)
RADIUS  = 26
SHADOW  = (0, 0, 0, 130)


def rounded(im, radius):
    mask = Image.new('L', im.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, im.width - 1, im.height - 1], radius, fill=255)
    out = Image.new('RGBA', im.size, (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def drop(canvas, tile, x, y):
    """Paste with a soft shadow so the tiles read as objects, not as flat crops."""
    pad = 26
    sh = Image.new('RGBA', (tile.width + pad * 2, tile.height + pad * 2), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [pad, pad + 6, pad + tile.width, pad + tile.height + 6], RADIUS, fill=SHADOW)
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    canvas.alpha_composite(sh, (x - pad, y - pad))
    canvas.alpha_composite(tile, (x, y))


# The captures carry a real status bar and nav bar. Left in, they show four
# different clock times and battery levels across one composite, which reads as
# four snapshots rather than one asset. Trimming both also shortens every tile.
STATUS_BAR = 100
NAV_BAR = 116


def build(items, cols, out_name, tile_w, crop=None, label_size=30, gutter=56):
    tiles, labels = [], []
    for name, label in items:
        im = Image.open(SRC / name).convert('RGB')
        bottom = int(im.height * crop) if crop else im.height - NAV_BAR
        im = im.crop((0, STATUS_BAR, im.width, bottom))
        h = round(im.height * tile_w / im.width)
        tiles.append(rounded(im.resize((tile_w, h), Image.LANCZOS), RADIUS))
        labels.append(label)

    tile_h = tiles[0].height
    rows = (len(tiles) + cols - 1) // cols
    lab_h = label_size + 18
    W = cols * tile_w + (cols + 1) * gutter
    H = rows * (tile_h + lab_h) + (rows + 1) * gutter

    canvas = Image.new('RGBA', (W, H), BG + (255,))
    d = ImageDraw.Draw(canvas)
    f = ImageFont.truetype(FONT, label_size)

    for i, (tile, label) in enumerate(zip(tiles, labels)):
        r, c = divmod(i, cols)
        x = gutter + c * (tile_w + gutter)
        y = gutter + r * (tile_h + lab_h + gutter)
        drop(canvas, tile, x, y)
        tw = d.textlength(label, font=f)
        d.text((x + (tile_w - tw) / 2, y + tile_h + 14), label, font=f, fill=LABEL)

    canvas.convert('RGB').save(OUT / out_name, optimize=True)
    print(f"  {out_name:22} {W}x{H}  ratio {W/H:.2f}")


# Four across rather than two-by-two. A 2x2 of portrait phones renders about
# 740px tall on a phone; this is 200px and each screen still reads.
build(
    [('home.png', 'Home'), ('rails.png', 'Shelves'),
     ('peek.png', 'Long press'), ('player.png', 'Player')],
    cols=4, out_name='screens.png', tile_w=440, label_size=34, gutter=40)

build(
    [('theme-night.png', 'Night'), ('theme-black.png', 'Black OLED'),
     ('theme-terminal.png', 'Terminal'), ('theme-graphite.png', 'Graphite'),
     ('theme-ember.png', 'Ember')],
    cols=5, out_name='themes.png', tile_w=420, crop=0.62, label_size=34, gutter=40)
