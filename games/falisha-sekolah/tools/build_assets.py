# Jalankan dari root repo:
#   python3 -I games/falisha-sekolah/tools/build_assets.py games/falisha-sekolah/assets/raw games/falisha-sekolah/assets/sprites
"""Olah sprite Gemini (assets/raw) -> atlas PNG + atlas.js + peta JPG 1280x720.
Latar dihapus dengan flood fill dari tepi sel (warna latar per sheet), jadi warna serupa di dalam objek aman."""
import sys, os, json, glob
from PIL import Image

RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(f'{OUT}/maps', exist_ok=True)
MAGENTA = (252, 1, 249)

def find(name):
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        p = f'{RAW}/{name}.{ext}'
        if os.path.exists(p): return p
    return None

def dist(p, q): return ((p[0]-q[0])**2 + (p[1]-q[1])**2 + (p[2]-q[2])**2) ** 0.5

def key(cell, bg=MAGENTA, tol=110, hole=75):
    cell = cell.convert('RGBA'); px = cell.load(); w, h = cell.size
    near = [[dist(px[x, y], bg) < tol for x in range(w)] for y in range(h)]
    seen = [[False] * w for _ in range(h)]
    st = [(x, y) for x in range(w) for y in (0, h - 1)] + [(x, y) for y in range(h) for x in (0, w - 1)]
    while st:
        x, y = st.pop()
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x] or not near[y][x]: continue
        seen[y][x] = True; st += [(x+1, y), (x-1, y), (x, y+1), (x, y-1)]
    for y in range(h):
        for x in range(w):
            if not seen[y][x] and dist(px[x, y], bg) < hole: seen[y][x] = True
            if seen[y][x]: px[x, y] = (0, 0, 0, 0)
    for y in range(h):          # tepi transisi bersemburat warna latar
        for x in range(w):
            if seen[y][x]: continue
            if any(0 <= x+dx < w and 0 <= y+dy < h and seen[y+dy][x+dx] for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                if dist(px[x, y][:3], bg) < tol + 60: px[x, y] = (0, 0, 0, 0)
    return cell

def grid(path, cols, rows, box=None, inset=8, keyed=True, bg=MAGENTA, take=None, tol=110, hole=75):
    im = Image.open(path).convert('RGB')
    if box: im = im.crop(box)
    W, H = im.size; cw, ch = W / cols, H / rows
    out = []
    for r in range(rows):
        for c in range(cols):
            if take and (r, c) not in take: continue
            cell = im.crop((round(c*cw + inset), round(r*ch + inset), round((c+1)*cw - inset), round((r+1)*ch - inset)))
            out.append(key(cell, bg, tol, hole) if keyed else cell.convert('RGBA'))
    return out

def pack(name, frames, cell_h_target=160):
    """frames: [(nama, img)] semua dari sel berukuran sama. Simpan: [x,y,w,h,ox,oy] relatif tengah-bawah sel."""
    ch = frames[0][1].height; scale = min(1, cell_h_target / ch)
    items = []
    for k, img in frames:
        bb = img.getbbox()
        if not bb: print('KOSONG', name, k); continue
        t = img.crop(bb); t = t.resize((max(1, round(t.width*scale)), max(1, round(t.height*scale))), Image.LANCZOS)
        items.append((k, t, round((bb[0] - img.width/2)*scale), round((bb[3] - img.height)*scale)))
    Wd = 1024; x = y = rowh = 0; pos = []
    for k, t, ox, oy in items:
        if x + t.width + 2 > Wd: x = 0; y += rowh + 2; rowh = 0
        pos.append((k, x, y, t, ox, oy)); x += t.width + 2; rowh = max(rowh, t.height)
    atlas = Image.new('RGBA', (Wd, y + rowh + 2), (0, 0, 0, 0))
    meta = {}
    for k, x, y, t, ox, oy in pos: atlas.paste(t, (x, y)); meta[k] = [x, y, t.width, t.height, ox, oy]
    atlas.save(f'{OUT}/{name}.png', optimize=True)
    return {'cell': round(ch * scale), 'frames': meta}

ATLAS = {}
def sheet(name, frames):
    ATLAS[name] = pack(name, frames); print(name, len(ATLAS[name]['frames']))

# Falisha: jalan 3x4 + pose 4x2 (dibuat setinggi sel jalan)
walk = grid(find('char_falisha_walk'), 3, 4, inset=6)
dirs = ['down', 'left', 'right', 'up']
fr = [(f'walk.{dirs[i // 3]}.{i % 3}', c) for i, c in enumerate(walk)]
poses = grid(find('char_falisha_poses'), 4, 2, inset=10)
ref_h, pw = walk[0].height, walk[0].width
def fit(p):
    """skala pose setinggi sel jalan, lalu taruh di tengah kanvas selebar sel jalan (anchor bawah sama)."""
    p = p.resize((round(p.width * ref_h / p.height), ref_h), Image.LANCZOS)
    c = Image.new('RGBA', (pw, ref_h), (0, 0, 0, 0)); c.alpha_composite(p, ((pw - p.width) // 2, 0)) if p.width <= pw else c.alpha_composite(p.crop(((p.width - pw) // 2, 0, (p.width - pw) // 2 + pw, ref_h)))
    return c
names = ['lompat', 'baca', 'makan', 'tali', 'qiyam', 'rukuk', 'sujud', 'duduk']
fr += [(f'pose.{names[i]}', fit(p)) for i, p in enumerate(poses)]
sheet('falisha', fr)

kel = grid(find('char_keluarga'), 4, 4, inset=6)
who = ['pupu', 'baymax', 'nono', 'arsyad']; pose = ['down', 'wave', 'walk0', 'walk1']
sheet('keluarga', [(f'{who[i % 4]}.{pose[i // 4]}', c) for i, c in enumerate(kel)])

sek = grid(find('char_sekolah'), 4, 2, inset=6)
sheet('sekolah', list(zip(['guru', 'ustadz', 'satpam', 'kantin', 'putra', 'anasya', 'ayana', 'seyan'], sek)))

pu = grid(find('portrait_utama'), 4, 2, inset=4)
def card(cell):
    """potong kartu potret hijau muda (tanpa chroma-key, supaya peci/jenggot hitam aman)."""
    rgb = cell.convert('RGB'); px = rgb.load(); w, h = rgb.size
    xs = [x for x in range(w) for y in range(0, h, 4) if px[x, y][1] > 200 and px[x, y][0] > 150 and px[x, y][2] < 200]
    ys = [y for y in range(h) for x in range(0, w, 4) if px[x, y][1] > 200 and px[x, y][0] > 150 and px[x, y][2] < 200]
    return rgb.crop((min(xs), min(ys), max(xs) + 1, max(ys) + 1)).convert('RGBA')
ps = [card(c) for c in grid(find('portrait_sekolah'), 4, 2, inset=4, keyed=False)]
ps = [p.resize(pu[0].size, Image.LANCZOS) for p in ps]
sheet('portrait', list(zip(['falisha.senang', 'falisha.kaget', 'falisha.sedih', 'falisha.bangga', 'pupu', 'baymax', 'nono', 'arsyad',
                            'guru', 'ustadz', 'satpam', 'kantin', 'putra', 'anasya', 'ayana', 'seyan'], pu + ps)))

it = grid(find('items'), 4, 4, box=(232, 0, 1144, 768), inset=12)
sheet('items', list(zip(['tas', 'botol', 'iqro', 'bekal', 'pensil_merah', 'pensil_kuning', 'pensil_hijau', 'pensil_biru',
                         'pensil_ungu', 'kertas', 'botol_plastik', 'bungkus', 'tong', 'bintang', 'hati', 'panah'], it)))

ja = grid(find('jajan_uang'), 4, 3, inset=8, take={(0, 0), (0, 1), (0, 2), (0, 3), (1, 0), (1, 1), (1, 2), (1, 3)})
sheet('jajan', list(zip(['roti', 'susu', 'pisang', 'risol', 'uang500', 'uang1000', 'uang2000', 'dompet'], ja)))

wu = grid(find('wudhu'), 4, 2, box=(30, 40, 1348, 728), inset=4, keyed=False)
sheet('wudhu', list(zip(['tangan', 'kumur', 'hidung', 'wajah', 'lengan', 'kepala', 'telinga', 'kaki'], wu)))

if find('iqro_cards'):
    iq = grid(find('iqro_cards'), 7, 4, box=(14, 20, 1362, 750), inset=4, keyed=False)
    sheet('iqro', [(str(i), c) for i, c in enumerate(iq)])
else: print('LEWATI iqro_cards')

pr = grid(find('minigame_props'), 4, 2, inset=14)
sheet('props', list(zip(['apel', 'tali', 'bedug', 'hati_bubble', 'keran', 'sajadah', 'bel', 'piala'], pr)))

dlg = key(Image.open(find('dialog_box')).convert('RGB'))
ATLAS['ui'] = pack('ui', [('dialog', dlg)], cell_h_target=300); print('ui', 1)

# latar penuh
MAPS = {'rumah': 'map_rumah', 'jalan': 'map_jalan', 'gerbang': 'map_sekolah', 'lapangan': 'map_lapangan',
        'kelas': 'map_kelas', 'musala': 'map_musala', 'kantin': 'map_kantin'}
for mid, f in MAPS.items():
    Image.open(find(f)).convert('RGB').resize((1280, 720), Image.LANCZOS).save(f'{OUT}/maps/{mid}.jpg', quality=85)
for f in ('cover', 'rapor_bg'):
    Image.open(find(f)).convert('RGB').resize((1280, 720), Image.LANCZOS).save(f'{OUT}/{f}.jpg', quality=85)
print('maps', len(MAPS))
with open(f'{OUT}/atlas.js', 'w') as fh:
    fh.write('/* Petualangan Falisha di MIMHa – atlas sprite (auto-generated oleh tools/build_assets.py) */\n')
    fh.write('window.ATLAS = ' + json.dumps(ATLAS, separators=(',', ':')) + ';\n')
