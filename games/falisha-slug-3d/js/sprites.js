/* Pemuat sprite Google Flow yang sudah diolah tools/build_sprites.py menjadi atlas transparan (assets/sprites/).
   Kalau atlas belum ada, semua bernilai null dan game memakai aktor chibi 3D sementara. */
const DIR = 'assets/sprites/';

function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}

/* Potong atlas menjadi sel; tiap sel menyimpan bounding box piksel tidak transparan. */
function slice(img, e) {
  const cw = img.width / e.cols, ch = img.height / e.rows, out = [];
  for (let i = 0; i < e.n; i++) {
    const cv = document.createElement('canvas'); cv.width = Math.round(cw); cv.height = Math.round(ch);
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, (i % e.cols) * cw, Math.floor(i / e.cols) * ch, cw, ch, 0, 0, cv.width, cv.height);
    const d = g.getImageData(0, 0, cv.width, cv.height).data, w = cv.width, h = cv.height;
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 60) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    out.push(x1 < 0 ? null : { cv, w, h, x0, y0, x1, y1 });
  }
  out.map = e.map;
  return out;
}

export async function loadAll(ids) {
  const none = { heroes: {}, bgs: {} };
  let ATLAS = {};
  try { ({ ATLAS } = await import('../assets/sprites/atlas.js')); } catch (e) { return none; }
  const sheet = async k => { const e = ATLAS[k]; if (!e) return null; const img = await loadImg(DIR + e.file); return img && e.cols ? slice(img, e) : img; };
  const [heroes, soldier, robot, items, boss, desert, jungle, city] = await Promise.all([
    Promise.all(ids.map(id => sheet('hero_' + id))),
    sheet('soldier'), sheet('robot'), sheet('items'), sheet('boss'), sheet('bg_desert'), sheet('bg_jungle'), sheet('bg_city')
  ]);
  const heroMap = {};
  ids.forEach((id, i) => { if (heroes[i]) heroMap[id] = heroes[i]; });
  return { heroes: heroMap, soldier, robot, items, boss, bgs: { desert, jungle, city } };
}

/* Gambar sel ke canvas persegi kecil (untuk menu/HUD). */
export function portraitURL(cell) {
  if (!cell) return null;
  const s = Math.max(cell.x1 - cell.x0, cell.y1 - cell.y0) + 8, cv = document.createElement('canvas');
  cv.width = cv.height = 160;
  const cx = (cell.x0 + cell.x1) / 2, cy = (cell.y0 + cell.y1) / 2;
  cv.getContext('2d').drawImage(cell.cv, cx - s / 2, cy - s / 2, s, s, 0, 0, 160, 160);
  return cv.toDataURL();
}
