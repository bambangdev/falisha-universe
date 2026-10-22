# Olah gambar Google Flow (assets/raw) -> atlas WebP transparan + assets/sprites/atlas.js
# Jalankan dari root repo (butuh Pillow + numpy; scipy opsional untuk mode 'auto'):
#   python3 -I games/falisha-slug-3d/tools/build_sprites.py            -> build
#   python3 -I games/falisha-slug-3d/tools/build_sprites.py --debug D  -> juga simpan lembar nomor frame ke folder D
#
# Sheet "grid" dipotong rata (cols x rows) sesuai prompt di docs/plans/11-falisha-slug-3d-sprite-prompts.md.
# Kalau Flow tidak menuruti grid, ganti mode sheet itu ke 'auto' (deteksi tiap pose sebagai komponen terhubung,
# butuh scipy) lalu petakan ulang nomor frame -> nama pose di SHEETS. Nilai 'f<n>' = frame n dicerminkan.
import sys, os, json
import numpy as np
from PIL import Image, ImageDraw, ImageOps
try:
    from scipy import ndimage
except ImportError:  # mode 'grid' tetap jalan tanpa scipy
    ndimage = None

ROOT = 'games/falisha-slug-3d'
RAW, OUT = f'{ROOT}/assets/raw', f'{ROOT}/assets/sprites'
MAX_H = 300  # tinggi frame terbesar di atlas (px)

HERO = dict(mode='grid', cols=4, rows=4, run=[0, 1, 2, 3], idle=4, jump=5, shoot=6, shootUp=7, crouch=8, hurt=9,
            throw=10, cheer=11, tied=12, inTank=13, special=14, portrait=15)
SHEETS = {
    **{f'hero_{i}': dict(HERO) for i in ['falisha', 'arsyad', 'nono', 'pupu', 'baymax']},
    'soldier': dict(mode='grid', cols=4, rows=2, idle=0, run=[1, 2], shoot=3, panic=[4, 5], surrender=6, portrait=7),
    'robot': dict(mode='grid', cols=4, rows=2, idle=0, walk=[1, 2], shoot=3, hit=4, broken=[5, 6], portrait=7),
    'items': dict(mode='grid', cols=4, rows=2, names=['H', 'R', 'bomb', 'food', 'special', 'armor', 'star', 'trophy']),
    'boss': dict(mode='grid', cols=2, rows=2, names=['yanto_idle', 'yanto_angry', 'yanto_cry', 'yanto_wave']),
}
BACKDROPS = ['bg_desert', 'bg_jungle', 'bg_city']
COVER_OUT = 'portal/cover_game11.jpg'


def find(name):
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        p = f'{RAW}/{name}.{ext}'
        if os.path.exists(p): return p
    return None


def key(img, t0=0.22):
    """RGB -> RGBA: hapus latar & bayangan magenta (juga yang bergradasi), bersihkan semburat di tepi."""
    if img.mode == 'RGBA' and np.asarray(img)[..., 3].min() < 128: return img  # sudah transparan (PNG dari Flow)
    a = np.asarray(img.convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    m = np.minimum(r, b)
    ratio = (m - g) / np.maximum(m, 1)
    s = np.clip((ratio - t0) / 0.3, 0, 1) * np.clip((m - 60) / 40, 0, 1) * np.clip(1 - np.abs(r - b) / 140, 0, 1)
    alpha = 1 - s
    if ndimage is not None: alpha = ndimage.grey_erosion(alpha, size=(2, 2)) * 0.5 + alpha * 0.5   # tepi sedikit lebih rapat
    spill = np.clip(m - g - 8, 0, None) * np.clip((1 - alpha) * 3 + 0.25, 0, 1)
    edge = alpha < 0.999
    r = np.where(edge | (ratio > 0.2), r - spill * 0.85, r); b = np.where(edge | (ratio > 0.2), b - spill * 0.85, b)
    out = np.dstack([np.clip(r, 0, 255), g, np.clip(b, 0, 255), np.clip(alpha, 0, 1) * 255]).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


def blobs(rgba, min_frac=0.002, dil=6):
    al = np.asarray(rgba)[..., 3] > 128
    if ndimage is None:  # tanpa scipy: seluruh piksel buram dianggap satu blob
        ys, xs = np.where(al)
        if not len(xs): return [], np.zeros(al.shape, dtype=int)
        lab = al.astype(int)
        return [(int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1, 1)], lab
    lab, n = ndimage.label(ndimage.binary_dilation(al, iterations=dil))
    H, W = al.shape; out = []
    for i, sl in enumerate(ndimage.find_objects(lab)):
        if sl is None: continue
        area = (al[sl] & (lab[sl] == i + 1)).sum()
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if area < min_frac * W * H: continue
        if (w > 0.8 * W and h < 0.03 * H) or (h > 0.8 * H and w < 0.03 * W): continue  # garis grid
        out.append((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop, i + 1))
    return out, lab


def cut_auto(rgba):
    if ndimage is None: raise SystemExit('mode auto butuh scipy: pip install scipy (atau pakai mode grid)')
    bs, lab = blobs(rgba)
    hs = sorted(b[3] - b[1] for b in bs); mh = hs[len(hs) // 2]
    bs.sort(key=lambda b: (b[1] + b[3]) / 2)
    rows, cur = [], []
    for b in bs:
        cy = (b[1] + b[3]) / 2
        if cur and cy - (cur[0][1] + cur[0][3]) / 2 > 0.5 * mh: rows.append(cur); cur = []
        cur.append(b)
    rows.append(cur)
    frames = []
    arr = np.asarray(rgba).copy()
    for row in rows:
        for x0, y0, x1, y1, li in sorted(row, key=lambda b: b[0]):
            sub = arr[y0:y1, x0:x1].copy()
            sub[..., 3] = np.where(lab[y0:y1, x0:x1] == li, sub[..., 3], 0)  # hanya blob ini
            frames.append(Image.fromarray(sub, 'RGBA'))
    return frames


def cut_grid(rgba, cols, rows):
    W, H = rgba.size; cw, ch = W / cols, H / rows; ins = 6; frames = []
    for r in range(rows):
        for c in range(cols):
            cell = rgba.crop((round(c * cw + ins), round(r * ch + ins), round((c + 1) * cw - ins), round((r + 1) * ch - ins)))
            bs, lab = blobs(cell, min_frac=0.004, dil=8)
            if not bs: frames.append(None); continue
            big = max((b[2] - b[0]) * (b[3] - b[1]) for b in bs)
            keep = [b for b in bs if (b[2] - b[0]) * (b[3] - b[1]) > 0.03 * big]
            a = np.asarray(cell).copy()
            a[..., 3] = np.where(np.isin(lab, [b[4] for b in keep]), a[..., 3], 0)
            frames.append(Image.fromarray(a, 'RGBA'))
    return frames


def trim(im, pad=3):
    bb = im.getbbox()
    if not bb: return None
    return im.crop((max(0, bb[0] - pad), max(0, bb[1] - pad), min(im.width, bb[2] + pad), min(im.height, bb[3] + pad)))


def resolve(frames, spec):
    """Ganti 'f<n>' dengan frame cermin yang ditambahkan di akhir; kembalikan peta nama -> indeks."""
    out = {}
    def one(v):
        if isinstance(v, str) and v.startswith('f'):
            frames.append(ImageOps.mirror(frames[int(v[1:])])); return len(frames) - 1
        return v
    for k, v in spec.items():
        if k in ('mode', 'cols', 'rows', 'names', 't0'): continue
        out[k] = [one(x) for x in v] if isinstance(v, list) else one(v)
    if 'names' in spec: out = {n: i for i, n in enumerate(spec['names'])}
    return out


def pack(name, frames):
    frames = [trim(f) if f is not None else None for f in frames]
    hmax = max(f.height for f in frames if f); s = min(1, MAX_H / hmax)
    frames = [f.resize((max(1, round(f.width * s)), max(1, round(f.height * s))), Image.LANCZOS) if f else None for f in frames]
    cw = max(f.width for f in frames if f) + 4; ch = max(f.height for f in frames if f) + 4
    cols = min(8, len(frames)); rows = -(-len(frames) // cols)
    atlas = Image.new('RGBA', (cols * cw, rows * ch), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        if f: atlas.paste(f, ((i % cols) * cw + (cw - f.width) // 2, (i // cols) * ch + ch - 2 - f.height), f)
    atlas.save(f'{OUT}/{name}.webp', 'WEBP', quality=88, method=6)
    return dict(file=f'{name}.webp', cols=cols, rows=rows, n=len(frames))


def debug_sheet(name, frames, d):
    th = 150; W = 8 * (th + 10); rows = -(-len(frames) // 8)
    im = Image.new('RGB', (W, rows * (th + 24)), (40, 120, 60)); dr = ImageDraw.Draw(im)
    for i, f in enumerate(frames):
        x, y = (i % 8) * (th + 10), (i // 8) * (th + 24)
        if f is not None:
            t = trim(f) or f; t = t.copy(); t.thumbnail((th, th)); im.paste(t, (x + (th - t.width) // 2, y + 20 + th - t.height), t)
        dr.text((x + 4, y + 2), str(i), fill=(255, 255, 0))
    im.save(f'{d}/{name}.png')


def crop_white(p, out, max_w=1024):
    im = Image.open(p).convert('RGB'); a = np.asarray(im).astype(int)
    nonwhite = (a.min(axis=2) < 235)
    ys, xs = np.where(nonwhite)
    im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    if im.width > max_w: im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
    im.save(out, quality=86); return im.size


def main():
    dbg = sys.argv[sys.argv.index('--debug') + 1] if '--debug' in sys.argv else None
    os.makedirs(OUT, exist_ok=True)
    if dbg: os.makedirs(dbg, exist_ok=True)
    manifest = {}
    for name, spec in SHEETS.items():
        p = find(name)
        if not p: print('lewati (belum ada):', name); continue
        rgba = key(Image.open(p), spec.get('t0', 0.22))
        frames = cut_auto(rgba) if spec['mode'] == 'auto' else cut_grid(rgba, spec['cols'], spec['rows'])
        if dbg: debug_sheet(name, frames, dbg)
        fmap = resolve(frames, spec)
        manifest[name] = {**pack(name, frames), 'map': fmap}
        print(f'{name}: {len(frames)} frame')
    for name in BACKDROPS:
        p = find(name)
        if not p: continue
        im = Image.open(p).convert('RGB'); im.thumbnail((2048, 2048)); im.save(f'{OUT}/{name}.jpg', quality=85)
        manifest[name] = {'file': f'{name}.jpg', 'size': im.size}
        print(f'{name}: {im.size[0]}x{im.size[1]}')
    p = find('cover')
    if p:
        im = Image.open(p).convert('RGB'); im = ImageOps.fit(im, (960, 540), Image.LANCZOS); im.save(COVER_OUT, quality=85)
        print('cover ->', COVER_OUT)
    with open(f'{OUT}/atlas.js', 'w') as f:
        f.write('/* Dibuat oleh tools/build_sprites.py dari assets/raw (Google Flow). Jangan diedit manual. */\n')
        f.write('export const ATLAS = ' + json.dumps(manifest, separators=(',', ':')) + ';\n')
    print('selesai ->', OUT)


main()
