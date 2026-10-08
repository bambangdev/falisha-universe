# Jalankan dari root repo: python3 games/falisha-kart-turbo/tools/build_atlas.py games/falisha-kart-turbo/assets/raw games/falisha-kart-turbo/assets/sprites
"""Fase 3: olah sprite Nano Banana -> atlas game (chroma-key magenta, potong grid, trim, anchor bawah-tengah)."""
import sys, json, os
from PIL import Image, ImageFilter
RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

BG = (252, 1, 249)
def dist(p, q): return ((p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2) ** 0.5

def key(cell):
    """Hapus latar magenta yang TERSAMBUNG ke tepi sel (flood fill), supaya warna pink di objek aman."""
    cell = cell.convert('RGBA'); px = cell.load(); w, h = cell.size
    bgm = [[dist(px[x, y], BG) < 110 for x in range(w)] for y in range(h)]
    seen = [[False] * w for _ in range(h)]
    stack = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while stack:
        x, y = stack.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x] or not bgm[y][x]: continue
        seen[y][x] = True
        stack += [(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)]
    for y in range(h):
        for x in range(w):
            # latar tersambung ke tepi, ATAU lubang tertutup yang magenta hampir murni (pink objek jauh lebih kusam)
            if not seen[y][x] and dist(px[x, y], BG) < 75: seen[y][x] = True
            if seen[y][x]: px[x, y] = (0, 0, 0, 0)
    # tepi transisi: piksel di samping latar yang masih bersemburat magenta
    for y in range(h):
        for x in range(w):
            if seen[y][x]: continue
            if any(0 <= x + dx < w and 0 <= y + dy < h and seen[y + dy][x + dx] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                r, g, b, a = px[x, y]
                if dist((r, g, b), BG) < 170: px[x, y] = (0, 0, 0, 0)
    return cell

def cells(path, inset=6, crop_bottom=None):
    im = Image.open(path).convert('RGB'); W, H = im.size; cw, ch = W // 4, H // 4
    out = []
    for r in range(4):
        for c in range(4):
            bot = ch - inset
            if crop_bottom and crop_bottom(r, c): bot = crop_bottom(r, c)
            box = (c * cw + inset, r * ch + inset, (c + 1) * cw - inset, r * ch + bot)
            out.append((key(im.crop(box)), cw - 2 * inset, ch - inset))
    return out

def pack(name, frames, scale):
    """frames: list of (key, img, cellw, cellh). Hasil: name.png + meta {key:[x,y,w,h,ox,oy]}."""
    items = []
    for k, img, cw, ch in frames:
        bb = img.getbbox()
        if not bb: print('KOSONG', name, k); continue
        t = img.crop(bb)
        t = t.resize((max(1, round(t.width * scale)), max(1, round(t.height * scale))), Image.LANCZOS)
        ox = round((bb[0] - cw / 2) * scale)          # kiri relatif tengah sel
        oy = round((bb[3] - ch) * scale)              # bawah relatif bawah sel (<=0)
        items.append((k, t, ox, oy))
    W = 1024; x = y = rowh = 0; pos = []
    for k, t, ox, oy in items:
        if x + t.width + 2 > W: x = 0; y += rowh + 2; rowh = 0
        pos.append((k, x, y, t, ox, oy)); x += t.width + 2; rowh = max(rowh, t.height)
    atlas = Image.new('RGBA', (W, y + rowh + 2), (0, 0, 0, 0))
    meta = {}
    for k, x, y, t, ox, oy in pos:
        atlas.paste(t, (x, y)); meta[k] = [x, y, t.width, t.height, ox, oy]
    atlas.save(f'{OUT}/{name}.png', optimize=True)
    return meta

ATLAS = {}
RACER_FR = ['a0', 'a45', 'a90', 'a135', 'a180', 'a225', 'a270', 'a315', 'turnL', 'turnR', 'drift', 'spin', 'jump', 'win', 'lose', 'face']
racers = {}
for rid in ['falisha', 'arsyad', 'nono', 'pupu', 'baymax']:
    cs = cells(f'{RAW}/racer_{rid}.png', crop_bottom=lambda r, c: 208 if (r, c) == (3, 0) else None)
    racers.update({f'{rid}.{RACER_FR[i]}': c for i, c in enumerate(cs)})
ATLAS['racers'] = pack('racers', [(k, *v) for k, v in racers.items()], 0.5)

ITEM_FR = ['sambal', 'kumon', 'piano', 'pisang', 'bintang', 'awan', 'balon', 'kotak', 'koin', 'ramp', 'cone', 'asap', 'sparkB', 'sparkO', 'pow', 'kilau']
cs = cells(f'{RAW}/items.png')
ATLAS['items'] = pack('items', [(ITEM_FR[i], *c) for i, c in enumerate(cs)], 0.5)

DECOR = {
  'kuta': ['palm1', 'palm2', 'palm3', 'palm4', 'payung', 'selancar', 'gapuraL', 'gapuraR', 'jukung', 'istanapasir', 'karang', 'semak', 'pura', 'bendera', 'kios', 'pelampung'],
  'jakarta': ['gedung1', 'gedung2', 'gedung3', 'lampu', 'monas', 'bajaj', 'nasgor', 'pohon', 'halte', 'reklame', 'lalin', 'barrier', 'pot', 'tiang', 'kucing', 'gedung4'],
  'bromo': ['cemara1', 'cemara2', 'cemara3', 'cemara4', 'batu', 'kuda', 'jip', 'tenda', 'pagar', 'edelweiss', 'papan', 'tumpukbatu', 'pura', 'gubuk', 'kabut1', 'kabut2'],
  'permen': ['lolipop1', 'tongkat', 'cupcake', 'donat', 'cokelat', 'eskrim', 'jeli', 'gulali', 'kastil', 'marshmallow', 'biskuit', 'jamur', 'lolipop2', 'lolipop3', 'lolipop4', 'lolihati'],
}
for t, names in DECOR.items():
    cb = (lambda r, c: 224) if t == 'kuta' else None     # buang garis rak abu-abu di bawah sel
    cs = cells(f'{RAW}/decor_{t}.png', inset=7, crop_bottom=cb)
    ATLAS[f'decor_{t}'] = pack(f'decor_{t}', [(names[i], *c) for i, c in enumerate(cs)], 0.5)

# panorama langit: rasio 3:1, 1536x512, sambungan kiri-kanan mulus
for t, mode in [('kuta', 'mirror'), ('jakarta', 'fade'), ('bromo', 'fade'), ('permen', 'fade')]:
    im = Image.open(f'{RAW}/sky_{t}.jpg').convert('RGB'); w, h = im.size
    nh = round(w / 3); top = max(0, h - nh - (h - nh) // 4)
    im = im.crop((0, top, w, top + min(nh, h))).resize((1536, 512), Image.LANCZOS)
    if mode == 'mirror':
        out = Image.new('RGB', (3072, 512)); out.paste(im, (0, 0)); out.paste(im.transpose(Image.FLIP_LEFT_RIGHT), (1536, 0)); im = out
    else:
        f = 96; W = im.width; px = im.load(); src = im.copy().load()
        for x in range(f):
            k = (x + 1) / (f + 1)
            for y in range(512):
                a = src[W - f + x, y]; b = src[x, y]
                px[W - f + x, y] = tuple(round(a[i] * (1 - k) + b[i] * k) for i in range(3))
    im.save(f'{OUT}/sky_{t}.jpg', quality=86)
cov = Image.open(f'{RAW}/cover.jpg').convert('RGB')
cov.resize((1280, round(1280 * cov.height / cov.width)), Image.LANCZOS).save(f'{OUT}/cover.jpg', quality=85)
with open(f'{OUT}/atlas.js', 'w') as fh:
    fh.write('/* Falisha Kart Turbo – data atlas sprite (auto-generated dari assets/raw): [x, y, w, h, offsetX dari tengah, offsetY dari bawah] */\n')
    fh.write('window.ATLAS = ' + json.dumps(ATLAS, separators=(',', ':')) + ';\n')
print({k: len(v) for k, v in ATLAS.items()})
