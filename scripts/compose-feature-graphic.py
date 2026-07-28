#!/usr/bin/env python3
"""
Compose the Play Store feature graphic.

Play requires exactly 1024x500 with no alpha channel, and overlays its own
chrome near the edges in some placements, so everything meaningful is kept
inside a generous margin.

The README header is 1840x500 and cannot simply be cropped to this — 2.05:1
against 3.68:1 is a different composition, not a crop.
"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
# The Play launcher icon already is the mark on its disc; no need to redraw one.
MARK = ROOT / 'static' / 'branding' / 'ic_launcher-playstore.png'
OUT = ROOT / 'docs' / 'play' / 'feature-graphic.png'

INTER = '/usr/share/fonts/inter/InterVariable.ttf'
MONO = '/home/nomadx/.local/share/fonts/JetBrains/JetBrainsMonoNerdFont-Regular.ttf'

W, H = 1024, 500
CANVAS = (18, 20, 32)
MINT = (124, 255, 178)
LILAC = (164, 140, 242)
INK = (235, 250, 250)
MUTED = (150, 152, 168)


def main():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    im = Image.new('RGB', (W, H), CANVAS)
    d = ImageDraw.Draw(im)

    # A single diagonal wash rather than a radial bloom: it survives Play's
    # thumbnail scaling, where a soft bloom just turns into a grey smudge.
    for y in range(H):
        for_x = y / H
        d.line([(0, y), (W, y)], fill=(
            int(18 + 8 * for_x), int(20 + 7 * for_x), int(32 + 12 * for_x)))

    # Mark, left, vertically centred on the wordmark rather than the canvas.
    size = 246
    mark = Image.open(MARK).convert('RGBA').resize((size, size), Image.LANCZOS)
    im.paste(mark, (96, 128), mark)

    x = 96 + size + 60
    f_word = ImageFont.truetype(INTER, 96)
    f_word.set_variation_by_name('Bold')
    f_eyebrow = ImageFont.truetype(MONO, 25)
    f_tag = ImageFont.truetype(INTER, 32)
    f_tag.set_variation_by_name('Regular')

    # "Night" in ink, "shelf" in lilac — the split is the wordmark.
    d.text((x, 150), 'Night', font=f_word, fill=INK)
    night_w = d.textlength('Night', font=f_word)
    d.text((x + night_w, 150), 'shelf', font=f_word, fill=LILAC)

    # Deliberately does not say "Audiobookshelf". Naming the upstream project
    # in store artwork invites both the impersonation and repetitive-content
    # reads; compatibility belongs in the description, not the graphic.
    d.text((x + 3, 268), 'SELF-HOSTED AUDIOBOOKS', font=f_eyebrow, fill=MINT)
    d.text((x, 312), 'Built for listening in the dark.', font=f_tag, fill=MUTED)

    # Accent rule along the bottom edge, mint to lilac.
    for i in range(W):
        t = i / W
        d.line([(i, H - 6), (i, H)], fill=tuple(
            int(MINT[c] + (LILAC[c] - MINT[c]) * t) for c in range(3)))

    im.save(OUT, optimize=True)
    print(f'  {OUT.relative_to(ROOT)}  {im.width}x{im.height}  mode={im.mode}')


if __name__ == '__main__':
    main()
