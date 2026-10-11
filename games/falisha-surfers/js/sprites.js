/* Pemuat sprite Nano Banana dari assets/raw/.
   File dibaca langsung, sel dipotong menurut grid, latar (warna sudut sel) dihapus dengan flood fill dari tepi,
   lalu pinggiran dibersihkan dari semburat magenta. File yang belum ada -> null, game memakai model 3D sementara. */
const RAW = 'assets/raw/';
const MAX_CELL = 384;

function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
export async function findImage(name) {
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const img = await loadImg(`${RAW}${name}.${ext}?v=1`);
    if (img) return img;
  }
  return null;
}

function keyCell(cv) {
  const w = cv.width, h = cv.height, ctx = cv.getContext('2d', { willReadFrequently: true });
  const id = ctx.getImageData(0, 0, w, h), d = id.data;
  // warna latar = rata-rata patch 4 sudut
  let br = 0, bg = 0, bb = 0, n = 0;
  for (const [cx, cy] of [[0, 0], [w - 4, 0], [0, h - 4], [w - 4, h - 4]])
    for (let y = cy; y < cy + 4; y++) for (let x = cx; x < cx + 4; x++) { const i = (y * w + x) * 4; br += d[i]; bg += d[i + 1]; bb += d[i + 2]; n++; }
  br /= n; bg /= n; bb /= n;
  const magentaBg = br > 150 && bb > 150 && bg < 110;
  const dist = new Float32Array(w * h);
  for (let p = 0; p < w * h; p++) { const i = p * 4; dist[p] = Math.hypot(d[i] - br, d[i + 1] - bg, d[i + 2] - bb); }
  const TOL = 95, seen = new Uint8Array(w * h), st = [];
  for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
  while (st.length) {
    const p = st.pop();
    if (seen[p] || dist[p] >= TOL) continue;
    seen[p] = 1; const x = p % w;
    if (x > 0) st.push(p - 1); if (x < w - 1) st.push(p + 1);
    if (p >= w) st.push(p - w); if (p < w * (h - 1)) st.push(p + w);
  }
  for (let p = 0; p < w * h; p++) {
    const i = p * 4;
    if (seen[p] || (magentaBg && dist[p] < 60)) { d[i + 3] = 0; seen[p] = 1; continue; }
    const x = p % w;
    const edge = (x > 0 && seen[p - 1]) || (x < w - 1 && seen[p + 1]) || (p >= w && seen[p - w]) || (p < w * (h - 1) && seen[p + w]);
    if (edge) d[i + 3] = Math.max(0, Math.min(255, (dist[p] - TOL * 0.6) * 3));
    if (magentaBg) { // despill: magenta = merah & biru tinggi, hijau rendah
      const m = Math.min(d[i], d[i + 2]);
      if (m > d[i + 1] + 40) { const k = (m - d[i + 1] - 40) * (edge ? 0.9 : 0.5); d[i] -= k; d[i + 2] -= k; }
    }
  }
  ctx.putImageData(id, 0, 0);
  // bounding box isi
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return x1 < 0 ? null : { cv, w, h, x0, y0, x1, y1 };
}

/* Potong gambar menjadi cols x rows sel yang sudah di-key. */
export function sliceSheet(img, cols, rows, keyed = true) {
  const cw = img.width / cols, ch = img.height / rows, inset = Math.round(Math.min(cw, ch) * 0.015);
  const sc = Math.min(1, MAX_CELL / Math.max(cw, ch));
  const out = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cv = document.createElement('canvas');
    cv.width = Math.round((cw - inset * 2) * sc); cv.height = Math.round((ch - inset * 2) * sc);
    cv.getContext('2d').drawImage(img, c * cw + inset, r * ch + inset, cw - inset * 2, ch - inset * 2, 0, 0, cv.width, cv.height);
    out.push(keyed ? keyCell(cv) : { cv, w: cv.width, h: cv.height, x0: 0, y0: 0, x1: cv.width - 1, y1: cv.height - 1 });
  }
  return out;
}

/* Sheet pelari 4x4, atau dua file _a/_b berisi 4x2. */
export async function loadRunner(id) {
  const full = await findImage(`runner_${id}`);
  if (full) return sliceSheet(full, 4, 4);
  const [a, b] = await Promise.all([findImage(`runner_${id}_a`), findImage(`runner_${id}_b`)]);
  if (!a) return null;
  const cells = sliceSheet(a, 4, 2);
  return cells.concat(b ? sliceSheet(b, 4, 2) : new Array(8).fill(null));
}

export async function loadAll(ids) {
  const [runners, chaser, items, obstacles, trainFront, trainSide, city] = await Promise.all([
    Promise.all(ids.map(loadRunner)),
    findImage('chaser'), findImage('items'), findImage('obstacles'),
    findImage('train_front'), findImage('train_side'), findImage('bg_city')
  ]);
  const runnerMap = {};
  ids.forEach((id, i) => { if (runners[i]) runnerMap[id] = runners[i]; });
  return {
    runners: runnerMap,
    chaser: chaser ? sliceSheet(chaser, 4, 2) : null,
    items: items ? sliceSheet(items, 4, 2) : null,
    obstacles: obstacles ? sliceSheet(obstacles, 4, 2) : null,
    trainFront, trainSide, city
  };
}

/* Gambar potret sel ke canvas persegi kecil (untuk menu/HUD). */
export function portraitURL(cell) {
  if (!cell) return null;
  const s = Math.max(cell.x1 - cell.x0, cell.y1 - cell.y0) + 8, cv = document.createElement('canvas');
  cv.width = cv.height = 160;
  const cx = (cell.x0 + cell.x1) / 2, cy = (cell.y0 + cell.y1) / 2;
  cv.getContext('2d').drawImage(cell.cv, cx - s / 2, cy - s / 2, s, s, 0, 0, 160, 160);
  return cv.toDataURL();
}
