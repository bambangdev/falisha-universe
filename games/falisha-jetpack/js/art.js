/* Grafis: atlas sprite Nano Banana (assets/sprites, dibuat tools/build_sprites.py) + gambar prosedural sementara. */
export const ART = { falisha: null, hazards: null, items: null, decor: null, space: null, floor: null };
const rnd = (a, b) => a + Math.random() * (b - a);
const TAU = Math.PI * 2;

function loadImg(src) {
  return new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
}
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
export async function loadArt() {
  let ATLAS = {};
  try { ({ ATLAS } = await import('../assets/sprites/atlas.js')); } catch (e) { /* belum ada sprite */ }
  const get = async k => { const e = ATLAS[k]; if (!e) return null; const img = await loadImg('assets/sprites/' + e.file); return img && e.cols ? slice(img, e) : img; };
  const keys = ['falisha_astro', 'hazards', 'items', 'decor', 'bg_space', 'floor'];
  const [f, h, i, d, s, fl] = await Promise.all(keys.map(get));
  Object.assign(ART, { falisha: f, hazards: h, items: i, decor: d, space: s, floor: fl });
  ART.face = await loadImg('assets/faces/falisha.jpg');
  ART.count = [f, h, i, d, s, fl].filter(Boolean).length;
}

/* Gambar sel sprite: bbox-nya berpusat di (x, y), tinggi bbox = h (atau skala tetap s). */
export function drawCell(g, cell, x, y, { h, s, rot = 0, flip = false, alpha = 1 } = {}) {
  if (!cell) return;
  const bw = cell.x1 - cell.x0 + 1, bh = cell.y1 - cell.y0 + 1, k = s ?? h / bh;
  g.save(); g.globalAlpha = alpha; g.translate(x, y); if (rot) g.rotate(rot); if (flip) g.scale(-1, 1);
  g.drawImage(cell.cv, cell.x0, cell.y0, bw, bh, -bw * k / 2, -bh * k / 2, bw * k, bh * k);
  g.restore();
}
export const cellH = c => c ? c.y1 - c.y0 + 1 : 1;

/* ---------- latar prosedural ---------- */
export function makeSpaceLayer(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#0b0a2e'); gr.addColorStop(0.55, '#231653'); gr.addColorStop(1, '#3a1d5e');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const neb = [['#ff4fa3', 0.18], ['#4fb8ff', 0.16], ['#9b5cff', 0.2], ['#ff9a4f', 0.1]];
  for (let i = 0; i < 9; i++) {
    const [c, a] = neb[i % neb.length], x = rnd(0, w), y = rnd(h * 0.1, h * 0.9), r = rnd(160, 380);
    for (const dx of [-w, 0, w]) { // sambung kiri-kanan
      const rg = g.createRadialGradient(x + dx, y, 0, x + dx, y, r); rg.addColorStop(0, c); rg.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = a; g.fillStyle = rg; g.fillRect(x + dx - r, y - r, r * 2, r * 2);
    }
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 380; i++) { const s = Math.random() < 0.9 ? rnd(0.6, 1.6) : rnd(1.8, 2.8); g.fillStyle = `rgba(255,255,255,${rnd(0.35, 1)})`; g.beginPath(); g.arc(rnd(0, w), rnd(0, h), s, 0, TAU); g.fill(); }
  return cv;
}
export function makePlanetsLayer(w, h) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const planet = (x, y, r, c1, c2, ring) => {
    if (ring) { g.save(); g.translate(x, y); g.rotate(-0.35); g.strokeStyle = 'rgba(255,220,170,.55)'; g.lineWidth = r * 0.14; g.beginPath(); g.ellipse(0, 0, r * 1.9, r * 0.45, 0, Math.PI, TAU); g.stroke(); g.restore(); }
    const rg = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r); rg.addColorStop(0, c1); rg.addColorStop(1, c2);
    g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.globalAlpha = 0.18; g.fillStyle = '#fff'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x, y - r * 0.4 + i * r * 0.35, r * 0.95, r * 0.07, 0, 0, TAU); g.fill(); } g.globalAlpha = 1;
    if (ring) { g.save(); g.translate(x, y); g.rotate(-0.35); g.strokeStyle = 'rgba(255,220,170,.7)'; g.lineWidth = r * 0.14; g.beginPath(); g.ellipse(0, 0, r * 1.9, r * 0.45, 0, 0, Math.PI); g.stroke(); g.restore(); }
  };
  planet(w * 0.18, h * 0.3, 70, '#ffc27a', '#c4521f', true);
  planet(w * 0.55, h * 0.62, 34, '#9fe0ff', '#2b5fbf', false);
  planet(w * 0.82, h * 0.24, 46, '#e6e1f5', '#7c7396', false);
  return cv;
}
export function makeDeck(w, h, ceiling) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, ceiling ? '#3b4257' : '#8e9bb5'); gr.addColorStop(ceiling ? 0.15 : 0.12, '#5c6680'); gr.addColorStop(1, '#2a3043');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const edge = ceiling ? h - 10 : 0;
  for (let x = -20; x < w + 20; x += 28) { g.fillStyle = (x / 28) % 2 ? '#1e1e1e' : '#ffcc1a'; g.beginPath(); g.moveTo(x, edge); g.lineTo(x + 14, edge); g.lineTo(x + 24, edge + 10); g.lineTo(x + 10, edge + 10); g.fill(); }
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2;
  for (let x = 0; x < w; x += 128) { g.beginPath(); g.moveTo(x, ceiling ? 0 : 12); g.lineTo(x, ceiling ? h - 10 : h); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.25)'; [[x + 8, 0.45], [x + 120, 0.45]].forEach(([bx, k]) => { g.beginPath(); g.arc(bx, h * k, 3, 0, TAU); g.fill(); }); }
  for (let x = 64; x < w; x += 128) { const ly = ceiling ? h - 22 : 24; const lg = g.createRadialGradient(x, ly, 1, x, ly, 14); lg.addColorStop(0, '#bff6ff'); lg.addColorStop(0.4, '#36d2ff'); lg.addColorStop(1, 'rgba(54,210,255,0)'); g.fillStyle = lg; g.fillRect(x - 14, ly - 14, 28, 28); }
  return cv;
}

/* ---------- Falisha astronot prosedural (tampak samping, menghadap kanan) ---------- */
function capsule(g, x1, y1, x2, y2, r, fill) { g.strokeStyle = fill; g.lineWidth = r * 2; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
function shade(g, x, y, r, c1, c2) { const rg = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1); rg.addColorStop(0, c1); rg.addColorStop(1, c2); return rg; }
export function flame(g, x, y, len, t) {
  const l = len * (0.8 + 0.25 * Math.sin(t * 40) + 0.1 * Math.random());
  const fg = g.createLinearGradient(x, y, x, y + l); fg.addColorStop(0, '#fffbe0'); fg.addColorStop(0.3, '#ffd23a'); fg.addColorStop(0.7, '#ff6a1a'); fg.addColorStop(1, 'rgba(255,60,20,0)');
  g.fillStyle = fg; g.beginPath(); g.moveTo(x - 9, y); g.quadraticCurveTo(x, y + l * 1.15, x + 9, y); g.fill();
}
export function drawFalisha(g, x, y, pose, t, sc = 1) {
  g.save(); g.translate(x, y); g.scale(sc, sc);
  if (pose === 'tumble') g.rotate(t * 9);
  if (pose === 'dizzy') g.translate(0, 18);
  const run = pose === 'run', fly = pose === 'fly', sw = run ? Math.sin(t * 16) : 0;
  // jetpack
  g.fillStyle = shade(g, -30, -8, 26, '#ff7b6b', '#a3161b'); g.beginPath(); g.roundRect(-44, -30, 26, 48, 10); g.fill();
  g.fillStyle = '#cfd6e0'; g.beginPath(); g.roundRect(-42, 16, 10, 10, 3); g.roundRect(-30, 16, 10, 10, 3); g.fill();
  if (fly) { flame(g, -37, 26, 46, t); flame(g, -25, 26, 40, t + 0.3); }
  // kaki
  const legA = run ? sw * 0.7 : fly ? 0.25 : pose === 'fall' ? -0.3 : 0.1, legB = run ? -sw * 0.7 : fly ? 0.45 : pose === 'fall' ? 0.3 : -0.1;
  [[legB, '#d9dee6'], [legA, '#ffffff']].forEach(([a, c]) => {
    const kx = Math.sin(a) * 26, ky = 22 + Math.cos(a) * 26;
    capsule(g, -4, 18, kx - 4, ky + 2, 8, c);
    g.fillStyle = shade(g, kx, ky + 6, 10, '#ffb36b', '#d9531a'); g.beginPath(); g.ellipse(kx + 1, ky + 8, 11, 7, 0, 0, TAU); g.fill();
  });
  // badan
  g.fillStyle = shade(g, -2, -4, 26, '#ffffff', '#c7cfdb'); g.beginPath(); g.roundRect(-22, -26, 40, 50, 16); g.fill();
  g.fillStyle = '#ff8a1a'; g.fillRect(-22, 6, 40, 7); g.fillStyle = '#ffd23a'; g.beginPath(); g.arc(6, -10, 5, 0, TAU); g.fill();
  // lengan
  const arm = run ? -sw * 0.9 : fly ? -0.6 : pose === 'fall' ? -2.4 : pose === 'zap' ? -2.8 : 0.3;
  const ax = Math.sin(arm) * 22, ay = -18 + Math.cos(arm) * 22;
  capsule(g, 0, -16, ax, ay, 7, '#f4f6f9'); g.fillStyle = '#ff8a1a'; g.beginPath(); g.arc(ax, ay, 7, 0, TAU); g.fill();
  // helm + wajah
  const hy = -50;
  g.fillStyle = '#e8edf3'; g.beginPath(); g.arc(0, hy, 31, 0, TAU); g.fill();
  g.save(); g.beginPath(); g.arc(2, hy, 26, 0, TAU); g.clip();
  if (ART.face) g.drawImage(ART.face, -26, hy - 28, 56, 56); else { g.fillStyle = '#d9a07a'; g.fill(); }
  g.fillStyle = 'rgba(120,200,255,.18)'; g.fillRect(-30, hy - 30, 64, 64);
  if (pose === 'zap') { g.fillStyle = 'rgba(80,220,255,.45)'; g.fillRect(-30, hy - 30, 64, 64); }
  g.restore();
  const gl = g.createLinearGradient(-20, hy - 24, 10, hy); gl.addColorStop(0, 'rgba(255,255,255,.75)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gl; g.beginPath(); g.ellipse(-8, hy - 12, 12, 8, -0.6, 0, TAU); g.fill();
  g.strokeStyle = '#ff8a1a'; g.lineWidth = 5; g.beginPath(); g.arc(0, hy, 30, 0.9, 2.25); g.stroke();
  if (pose === 'zap') { g.strokeStyle = '#8ff4ff'; g.lineWidth = 3; for (let i = 0; i < 6; i++) { const a = rnd(0, TAU), r = rnd(30, 60); g.beginPath(); g.moveTo(Math.cos(a) * 20, -20 + Math.sin(a) * 20); g.lineTo(Math.cos(a) * r + rnd(-8, 8), -20 + Math.sin(a) * r); g.stroke(); } }
  if (pose === 'dizzy') { g.fillStyle = '#ffe14a'; for (let i = 0; i < 3; i++) { const a = t * 4 + i * TAU / 3; g.beginPath(); g.arc(Math.cos(a) * 34, hy - 30 + Math.sin(a) * 8, 5, 0, TAU); g.fill(); } }
  g.restore();
}

/* ---------- rintangan & item prosedural ---------- */
export function drawOrb(g, x, y, r, t) {
  g.fillStyle = shade(g, x, y, r, '#e8edf3', '#4c566a'); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  const c = g.createRadialGradient(x, y, 1, x, y, r * 0.75); c.addColorStop(0, '#ffffff'); c.addColorStop(0.4, '#5ff2ff'); c.addColorStop(1, 'rgba(40,180,255,0)');
  g.fillStyle = c; g.beginPath(); g.arc(x, y, r * (0.7 + 0.08 * Math.sin(t * 20)), 0, TAU); g.fill();
}
export function drawBeam(g, x1, y1, x2, y2, t) {
  const n = Math.max(4, Math.round(Math.hypot(x2 - x1, y2 - y1) / 22)), pts = [];
  for (let i = 0; i <= n; i++) { const k = i / n, j = i === 0 || i === n ? 0 : rnd(-9, 9); pts.push([x1 + (x2 - x1) * k + j * (y2 - y1) / Math.hypot(x2 - x1, y2 - y1), y1 + (y2 - y1) * k - j * (x2 - x1) / Math.hypot(x2 - x1, y2 - y1)]); }
  const path = () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const p of pts) g.lineTo(p[0], p[1]); };
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.strokeStyle = 'rgba(60,200,255,.25)'; g.lineWidth = 22; path(); g.stroke();
  g.strokeStyle = 'rgba(120,235,255,.7)'; g.lineWidth = 8; path(); g.stroke();
  g.strokeStyle = '#ffffff'; g.lineWidth = 2.5; path(); g.stroke();
}
export function drawMissile(g, x, y, t) {
  g.save(); g.translate(x, y);
  g.save(); g.rotate(-Math.PI / 2); flame(g, 0, 26, 34, t); g.restore();
  g.fillStyle = shade(g, 0, -4, 26, '#ffffff', '#b9c2cf'); g.beginPath(); g.roundRect(-26, -11, 50, 22, 11); g.fill();
  g.fillStyle = '#e02424'; g.beginPath(); g.moveTo(-26, 0); g.quadraticCurveTo(-40, 0, -26, -11); g.lineTo(-20, -11); g.lineTo(-20, 11); g.lineTo(-26, 11); g.quadraticCurveTo(-40, 0, -26, 0); g.fill();
  g.fillStyle = '#e02424'; g.beginPath(); g.moveTo(14, -11); g.lineTo(28, -22); g.lineTo(26, -9); g.fill(); g.beginPath(); g.moveTo(14, 11); g.lineTo(28, 22); g.lineTo(26, 9); g.fill();
  g.fillStyle = '#e02424'; g.fillRect(-4, -11, 6, 22);
  g.restore();
}
export function drawRock(g, x, y, r, rot, shape) {
  g.save(); g.translate(x, y); g.rotate(rot);
  g.fillStyle = shade(g, 0, 0, r, '#b9a48c', '#4e4033'); g.beginPath();
  shape.forEach((k, i) => { const a = i / shape.length * TAU; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r * k, Math.sin(a) * r * k); }); g.closePath(); g.fill();
  g.fillStyle = 'rgba(0,0,0,.22)'; [[0.3, -0.2, 0.22], [-0.35, 0.25, 0.16], [0.1, 0.45, 0.12]].forEach(([a, b, c]) => { g.beginPath(); g.arc(a * r, b * r, c * r, 0, TAU); g.fill(); });
  g.restore();
}
export function drawMine(g, x, y, r, t) {
  g.save(); g.translate(x, y); g.rotate(t * 0.8);
  g.fillStyle = '#3a3f4d'; for (let i = 0; i < 8; i++) { g.save(); g.rotate(i * TAU / 8); g.beginPath(); g.moveTo(-6, -r * 0.8); g.lineTo(0, -r * 1.35); g.lineTo(6, -r * 0.8); g.fill(); g.restore(); }
  g.fillStyle = shade(g, 0, 0, r, '#7d8597', '#23262f'); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.fillStyle = Math.sin(t * 8) > 0 ? '#ff3b30' : '#7a1010'; g.beginPath(); g.arc(0, 0, r * 0.28, 0, TAU); g.fill();
  g.restore();
}
export function drawCoin(g, x, y, r, t) {
  const sx = Math.max(0.15, Math.abs(Math.cos(t * 3 + x * 0.01)));
  g.save(); g.translate(x, y); g.scale(sx, 1);
  g.fillStyle = shade(g, 0, 0, r, '#fff3a6', '#d68a00'); g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
  g.strokeStyle = '#b86e00'; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, r * 0.72, 0, TAU); g.stroke();
  g.fillStyle = '#fff6c9'; star(g, 0, 0, r * 0.45, r * 0.2); g.restore();
}
export function star(g, x, y, R, r) {
  g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k); } g.closePath(); g.fill();
}
export const POWER = {
  shield: { emoji: '🛡️', color: '#36d2ff', dur: 0, cell: 1, name: 'Perisai!' },
  magnet: { emoji: '🧲', color: '#ff4d4d', dur: 9, cell: 2, name: 'Magnet!' },
  double: { emoji: '⭐', color: '#ffd21a', dur: 10, cell: 3, name: 'Koin x2!' },
  boost: { emoji: '🚀', color: '#ff8a1a', dur: 3.5, cell: 4, name: 'Turbo!' },
  heart: { emoji: '❤️', color: '#ff5c8a', dur: 0, cell: 6, name: 'Nyawa +1!' }
};
export function drawPower(g, k, x, y, t) {
  const p = POWER[k], r = 30 + Math.sin(t * 5) * 2;
  const rg = g.createRadialGradient(x - 8, y - 10, 3, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(0.6, p.color + 'aa'); rg.addColorStop(1, p.color + '00');
  g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.strokeStyle = p.color; g.lineWidth = 3; g.beginPath(); g.arc(x, y, r - 2, t * 3, t * 3 + 4.5); g.stroke();
  const ic = ART.items && ART.items[ART.items.map[k]];
  if (ic) drawCell(g, ic, x, y, { h: 40 });
  else { g.font = '30px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.emoji, x, y + 2); }
}
