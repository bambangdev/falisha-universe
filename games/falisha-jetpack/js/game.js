/* Falisha Jetpack – remake Jetpack Joyride di luar angkasa. Tahan untuk terbang, lepas untuk turun. */
import {
  ART, loadArt, drawCell, cellH, makeSpaceLayer, makePlanetsLayer, makeDeck, drawFalisha, drawOrb, drawBeam,
  drawMissile, drawRock, drawMine, drawCoin, drawPower, POWER, flame
} from './art.js';

const H = 720, CEIL = 70, FLOOR = 640, PR = 26, PHALF = 60, G = 2500, THRUST = 5200;
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const TAU = Math.PI * 2;
const store = {
  get(k, d) { try { const v = localStorage.getItem('fjet_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fjet_' + k, JSON.stringify(v)); } catch (e) {} }
};
const Chip = window.Chip;
const sfx = {
  coin: () => Chip?.beep(1760, 0.06, 'square', 0.03),
  zap: () => { if (!Chip?.ensure()) return; Chip.noise(Chip.now(), 0.35, 0.12, 2500); Chip.beep(110, 0.3, 'sawtooth', 0.06, 300); },
  warn: () => Chip?.beep(1320, 0.08, 'square', 0.04),
  launch: () => { if (Chip?.ensure()) Chip.noise(Chip.now(), 0.4, 0.06, 800); },
  laser: () => Chip?.beep(220, 0.6, 'sawtooth', 0.05, 600),
  power: () => { if (!Chip?.ensure()) return; const t = Chip.now(); [76, 79, 83, 88].forEach((n, i) => Chip.tone(Chip.mtof(n), t + i * 0.06, 0.12, 'square', 0.05)); },
  hurt: () => Chip?.hit(1.2),
  thrust: () => { if (Chip?.ensure()) Chip.noise(Chip.now(), 0.06, 0.012, 600); }
};
const TRACKS = [
  { bpm: 140, wave: 'square', lead: [76, null, 79, 83, null, 81, 79, null, 76, null, 74, 76, null, 79, 81, null, 83, null, 81, 79, null, 76, 79, null, 81, null, 83, 86, null, 83, 79, null],
    bass: [45, 41, 43, 40] },
  { bpm: 90, wave: 'triangle', lead: [72, null, 76, null, 79, null, 84, null, 83, null, 79, null, 76, null, 74, null], bass: [41, 45, 43, 38] }
];

/* ---------- kanvas ---------- */
const cv = $('game'), g = cv.getContext('2d');
let W = 1280, sc = 1, oy = 0, dpr = 1;
function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  sc = Math.min(innerHeight / H, innerWidth / 960);
  W = innerWidth / sc; oy = (innerHeight / sc - H) / 2;
  cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
}
addEventListener('resize', resize); resize();

/* ---------- lapisan latar ---------- */
let space, planets, deckF, deckC;
function buildLayers() {
  space = ART.space || makeSpaceLayer(2048, H);
  planets = makePlanetsLayer(2400, H);
  deckF = makeDeck(512, H - FLOOR + 120, false); deckC = makeDeck(512, CEIL + 120, true);
}
/* Ulang gambar ke kanan. mirror: tiap ulangan ganjil dicerminkan agar tepi gambar yang tidak seamless tetap menyambung. */
function tile(img, off, y, h, flipY = false, mirror = false) {
  const w = img.width * h / img.height, n0 = Math.floor(off / w); let x = -(off - n0 * w);
  for (let n = n0; x < W; x += w, n++) {
    const fx = mirror && n % 2 !== 0;
    g.save(); g.translate(x + (fx ? w : 0), y + (flipY ? h : 0)); g.scale(fx ? -1 : 1, flipY ? -1 : 1); g.drawImage(img, 0, 0, w, h); g.restore();
  }
}

/* ---------- state ---------- */
const P = { x: 0, y: FLOOR - PHALF, vy: 0, floor: true, inv: 0, shield: false, lives: 0, t: 0, pose: 'run', hitT: 0 };
const pw = { magnet: 0, double: 0, boost: 0 };
let state = 'loading', ents = [], coins = [], parts = [], decor = [], dist = 0, speed = 0, coinRun = 0, gap = 0,
  missileT = 0, laserT = 0, laserBusy = 0, holding = false, deadT = 0, tPlay = 0, shake = 0, powerGap = 0, decorGap = 0, thrustSnd = 0;
const meters = () => Math.floor(dist / 40);

function reset() {
  Object.assign(P, { x: Math.max(220, W * 0.24), y: FLOOR - PHALF, vy: 0, floor: true, inv: 0, shield: false, lives: 0, t: 0, pose: 'run', hitT: 0 });
  Object.assign(pw, { magnet: 0, double: 0, boost: 0 });
  ents = []; coins = []; parts = []; decor = []; dist = 0; speed = 430; coinRun = 0; gap = 700;
  missileT = 7; laserT = 28; laserBusy = 0; deadT = 0; tPlay = 0; powerGap = 1600; decorGap = 300;
}

/* ---------- pembuat rintangan ---------- */
const COIN_SHAPES = [
  ['XXXXXXXXXX'],
  ['XXXXXXXX', 'XXXXXXXX', 'XXXXXXXX'],
  ['..XX..XX..', '.XXXXXXXX.', '.XXXXXXXX.', '..XXXXXX..', '...XXXX...', '....XX....'],
  ['X.......X', '.X.....X.', '..X...X..', '...X.X...', '....X....'],
  ['....XX', '...XXX', 'XXXXXXXX', '...XXX', '....XX']
];
function coinShape(x, y) {
  const s = pick(COIN_SHAPES), step = 34, h = (s.length - 1) * step;
  const top = Math.min(Math.max(y - h / 2, CEIL + 40), FLOOR - 40 - h);
  s.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === 'X') coins.push({ x: x + c * step, y: top + r * step }); }));
  return s[0].length * step;
}
function coinWave(x) {
  const n = 14, y0 = rnd(CEIL + 140, FLOOR - 140), a = rnd(60, 120);
  for (let i = 0; i < n; i++) coins.push({ x: x + i * 34, y: y0 + Math.sin(i / 3) * a });
  return n * 34;
}
const diff = () => Math.min(1, dist / 60000);
function spawnChunk() {
  const x = W + 80, d = diff(), r = Math.random();
  if (r < 0.5) { // zapper
    const n = 1 + Math.floor(Math.random() * (1.6 + d * 1.6)), spinP = 0.1 + d * 0.35;
    for (let i = 0; i < n; i++) {
      const len = rnd(150, 230 + d * 90), ang = pick([0, Math.PI / 2, Math.PI / 2, Math.PI / 4, -Math.PI / 4]);
      const half = Math.abs(Math.sin(ang)) * len / 2 + 30;
      const y = rnd(CEIL + half, FLOOR - half);
      ents.push({ type: 'zap', x: x + i * rnd(240, 330), y, len, ang, spin: Math.random() < spinP ? pick([-1, 1]) * rnd(0.8, 1.8) : 0 });
      if (Math.random() < 0.5) coins.push(...Array.from({ length: 5 }, (_, k) => ({ x: x + i * 290 + 120 + k * 34, y: y < H / 2 ? y + 150 : y - 150 })));
    }
    return n * 290 + 200;
  }
  if (r < 0.72) return (Math.random() < 0.5 ? coinShape(x, rnd(CEIL + 100, FLOOR - 100)) : coinWave(x)) + 160;
  if (r < 0.9) { // asteroid
    const n = 2 + Math.floor(Math.random() * (2 + d * 2));
    for (let i = 0; i < n; i++) {
      const rr = rnd(26, 50);
      ents.push({ type: 'rock', x: x + i * rnd(170, 260), y: rnd(CEIL + rr, FLOOR - rr), r: rr, vy: rnd(-60, 60), rot: rnd(0, TAU), vr: rnd(-2, 2),
        shape: Array.from({ length: 11 }, () => rnd(0.78, 1.08)), cell: pick(['rock1', 'rock2', 'rock3']) });
    }
    return n * 220 + 160;
  }
  if (Math.random() < 0.5) { ents.push({ type: 'mine', x, y: rnd(CEIL + 80, FLOOR - 80), r: 26, ph: rnd(0, TAU) }); return 360; }
  ents.push({ type: 'ufo', x, y0: rnd(CEIL + 140, FLOOR - 140), y: 0, ph: rnd(0, TAU) }); return 380;
}
function spawnMissiles() {
  const n = diff() > 0.4 && Math.random() < 0.5 ? 2 + (Math.random() < diff() ? 1 : 0) : 1;
  for (let i = 0; i < n; i++) ents.push({ type: 'missile', st: 'warn', t: -i * 0.55, y: P.y, x: W + 60 });
}
function spawnLaser() {
  const rows = pick([[0.5], [0.25, 0.75], [0.2, 0.5, 0.8], [0.35], [0.65]]).slice(0, 1 + Math.floor(1 + diff() * 2));
  rows.forEach(k => ents.push({ type: 'laser', x: 0, y: CEIL + (FLOOR - CEIL) * k, t: 0 }));
  laserBusy = 3.6;
}

/* ---------- tabrakan ---------- */
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1, k = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - x1 - dx * k, py - y1 - dy * k);
}
function hit(kind) {
  if (P.inv > 0 || pw.boost > 0 || state !== 'play') return;
  if (P.shield) { P.shield = false; P.inv = Math.max(P.inv, 1.2); shake = 0.3; sfx.hurt(); toast('Perisai pecah!'); return; }
  if (P.lives > 0) { P.lives--; P.inv = Math.max(P.inv, 2); shake = 0.4; sfx.hurt(); toast('Nyawa terpakai ❤️'); return; }
  state = 'dead'; deadT = 0; P.hitT = 0; P.pose = kind === 'zap' ? 'zap' : 'tumble'; P.vy = -420; shake = 0.6;
  kind === 'zap' ? sfx.zap() : sfx.hurt(); Chip?.play(TRACKS, -1);
}

/* ---------- update ---------- */
function update(dt) {
  tPlay += dt; P.t += dt;
  const boost = pw.boost > 0;
  speed = Math.min(980, 430 + dist * 0.011) * (boost ? 1.9 : 1);
  dist += speed * dt;
  for (const k in pw) if (pw[k] > 0) pw[k] = Math.max(0, pw[k] - dt);
  if (boost && pw.boost === 0) P.inv = Math.max(P.inv, 1.2);
  P.inv = Math.max(0, P.inv - dt);
  // fisika
  if (boost) { P.y += ((CEIL + FLOOR) / 2 - P.y) * Math.min(1, dt * 4); P.vy = 0; P.floor = false; }
  else {
    P.vy += (G - (holding ? THRUST : 0)) * dt; P.vy = Math.max(-760, Math.min(1000, P.vy)); P.y += P.vy * dt;
    if (P.y >= FLOOR - PHALF) { P.y = FLOOR - PHALF; P.vy = 0; P.floor = true; } else P.floor = false;
    if (P.y <= CEIL + PHALF) { P.y = CEIL + PHALF; P.vy = Math.max(0, P.vy); }
  }
  P.pose = boost || holding ? 'fly' : P.floor ? 'run' : 'fall';
  if (holding || boost) {
    parts.push({ x: P.x - 36, y: P.y + 32, vx: -speed * 0.35 + rnd(-40, 40), vy: rnd(160, 300), life: 0.45, t: 0 });
    if ((thrustSnd -= dt) < 0) { sfx.thrust(); thrustSnd = 0.09; }
  }
  // pembuat
  const mv = speed * dt;
  if (laserBusy > 0) laserBusy -= dt;
  else if ((gap -= mv) <= 0) gap = spawnChunk() + rnd(160, 380) - diff() * 80;
  if ((powerGap -= mv) <= 0) { const k = pick(['shield', 'shield', 'magnet', 'double', 'boost', 'heart']); ents.push({ type: 'power', k, x: W + 60, y: rnd(CEIL + 90, FLOOR - 90), ph: 0 }); powerGap = rnd(2400, 3800); }
  if ((missileT -= dt) <= 0 && laserBusy <= 0) { spawnMissiles(); missileT = rnd(6, 10) - diff() * 3; }
  if (dist > 5000 && (laserT -= dt) <= 0 && laserBusy <= 0 && !ents.some(e => e.type === 'zap' && e.x < W + 100)) { spawnLaser(); laserT = rnd(22, 34) - diff() * 8; }
  if (ART.decor && (decorGap -= mv * 0.35) <= 0) { decor.push({ x: W + 150, y: rnd(CEIL + 60, FLOOR - 160), k: pick([0, 1, 3, 4, 6, 7]), s: rnd(60, 105) }); decorGap = rnd(700, 1300); }
  // entitas
  const hx = P.x + 4, hy = P.y - 8;
  for (const e of ents) {
    if (e.type === 'missile') {
      e.t += dt;
      if (e.st === 'warn') { e.y += (P.y - e.y) * Math.min(1, dt * 3); if (e.t > 1.3) { e.st = 'lock'; e.t = 0; } if (e.t > 0 && Math.floor(e.t * 6) !== Math.floor((e.t - dt) * 6)) sfx.warn(); }
      else if (e.st === 'lock') { if (e.t > 0.45) { e.st = 'fly'; sfx.launch(); } }
      else { e.x -= (1150 + speed) * dt; if (Math.hypot(e.x - hx, e.y - hy) < PR + 16) hit('missile'); }
      continue;
    }
    if (e.type === 'laser') {
      e.t += dt;
      if (e.t > 1.6 && !e.fired) { e.fired = true; sfx.laser(); }
      if (e.t > 1.6 && e.t < 3.0 && Math.abs(hy - e.y) < PR + 12) hit('laser');
      continue;
    }
    e.x -= mv;
    if (e.type === 'zap') {
      e.ang += e.spin * dt;
      const dx = Math.cos(e.ang) * e.len / 2, dy = Math.sin(e.ang) * e.len / 2;
      if (segDist(hx, hy, e.x - dx, e.y - dy, e.x + dx, e.y + dy) < PR + 10) hit('zap');
    } else if (e.type === 'rock') {
      e.y += e.vy * dt; e.rot += e.vr * dt;
      if (e.y < CEIL + e.r || e.y > FLOOR - e.r) e.vy *= -1;
      if (Math.hypot(e.x - hx, e.y - hy) < PR + e.r * 0.78) hit('rock');
    } else if (e.type === 'mine') {
      e.ph += dt; const y = e.y + Math.sin(e.ph * 2) * 30;
      if (Math.hypot(e.x - hx, y - hy) < PR + e.r * 0.95) hit('mine');
    } else if (e.type === 'ufo') {
      e.ph += dt; e.y = e.y0 + Math.sin(e.ph * 2.2) * 120;
      if (Math.hypot(e.x - hx, e.y - hy) < PR + 28) hit('ufo');
    } else if (e.type === 'power') {
      e.ph += dt;
      if (Math.hypot(e.x - hx, e.y + Math.sin(e.ph * 3) * 8 - hy) < PR + 32) { e.dead = true; collect(e.k); }
    }
  }
  ents = ents.filter(e => !e.dead && e.x > -400 && !(e.type === 'laser' && e.t > 3.2) && !(e.type === 'missile' && e.x < -200));
  // koin
  const mult = pw.double > 0 ? 2 : 1;
  coins = coins.filter(c => {
    c.x -= mv;
    if (pw.magnet > 0 && Math.abs(c.x - hx) < 360) { c.x += (hx - c.x) * Math.min(1, dt * 7); c.y += (hy - c.y) * Math.min(1, dt * 7); }
    if (Math.hypot(c.x - hx, c.y - hy) < 44) { coinRun += mult; sfx.coin(); parts.push({ x: c.x, y: c.y, spark: true, life: 0.3, t: 0 }); return false; }
    return c.x > -50;
  });
  decor = decor.filter(d => (d.x -= mv * 0.35) > -200);
}
function collect(k) {
  sfx.power(); toast(POWER[k].name);
  if (k === 'shield') P.shield = true;
  else if (k === 'heart') P.lives = Math.min(3, P.lives + 1);
  else pw[k] = POWER[k].dur;
}
function updateDead(dt) {
  deadT += dt; P.t += dt;
  speed *= Math.exp(-1.6 * dt); dist += speed * dt;
  for (const e of ents) if (e.type !== 'laser' && e.type !== 'missile') e.x -= speed * dt;
  coins.forEach(c => c.x -= speed * dt);
  P.vy += G * dt; P.y += P.vy * dt;
  if (P.y >= FLOOR - PHALF) { P.y = FLOOR - PHALF; P.vy = Math.abs(P.vy) > 300 ? -Math.abs(P.vy) * 0.45 : 0; if (P.pose === 'zap' && deadT > 0.4) P.pose = 'tumble'; }
  if (speed < 60 && P.vy === 0) P.pose = 'dizzy';
  if (P.pose === 'dizzy' && deadT > 2.2) gameOver();
}

/* ---------- gambar ---------- */
const FA = () => ART.falisha;
let faScale = 0;
function falishaFrame(pose, t) {
  const f = FA(), m = f.map, cyc = (v, sp) => Array.isArray(v) ? v[Math.floor(t * sp) % v.length] : v;
  const SP = { run: 10, fly: 14, zap: 12, tumble: 8 };
  return f[cyc(m[pose] ?? m.wave, SP[pose] || 1)] || f[cyc(m.run, 10)];
}
function drawPlayer() {
  const blink = P.inv > 0 && P.inv < 5 && state === 'play' && Math.floor(tPlay * 14) % 2;
  if (blink) return;
  if (FA()) {
    if (!faScale) faScale = 148 / (FA().map.run.reduce((s, i) => s + cellH(FA()[i]), 0) / FA().map.run.length);
    const c = falishaFrame(P.pose, P.t);
    drawCell(g, c, P.x, P.y + (P.pose === 'dizzy' ? 10 : 0), { s: faScale, rot: P.pose === 'tumble' && FA().map.tumble.length < 2 ? P.t * 9 : 0 });
  } else drawFalisha(g, P.x, P.y + 4, P.pose, P.t, 1.05);
  if (P.shield && state === 'play') {
    const rg = g.createRadialGradient(P.x, P.y, 40, P.x, P.y, 80); rg.addColorStop(0, 'rgba(54,210,255,0)'); rg.addColorStop(0.85, 'rgba(54,210,255,.35)'); rg.addColorStop(1, 'rgba(160,240,255,.8)');
    g.fillStyle = rg; g.beginPath(); g.arc(P.x, P.y - 4, 80, 0, TAU); g.fill();
  }
}
const HZ = k => ART.hazards && ART.hazards[ART.hazards.map[k]];
function drawEnts() {
  for (const e of ents) {
    if (e.type === 'zap') {
      const dx = Math.cos(e.ang) * e.len / 2, dy = Math.sin(e.ang) * e.len / 2;
      drawBeam(g, e.x - dx, e.y - dy, e.x + dx, e.y + dy, tPlay);
      for (const s of [-1, 1]) { const ox = e.x + dx * s, oy2 = e.y + dy * s; if (HZ('orb')) drawCell(g, HZ('orb'), ox, oy2, { h: 46, rot: tPlay * 2 }); else drawOrb(g, ox, oy2, 22, tPlay); }
    } else if (e.type === 'rock') {
      if (HZ(e.cell)) drawCell(g, HZ(e.cell), e.x, e.y, { h: e.r * 2.1, rot: e.rot }); else drawRock(g, e.x, e.y, e.r, e.rot, e.shape);
    } else if (e.type === 'mine') {
      const y = e.y + Math.sin(e.ph * 2) * 30;
      if (HZ('mine')) drawCell(g, HZ('mine'), e.x, y, { h: 64, rot: e.ph * 0.8 }); else drawMine(g, e.x, y, e.r, e.ph);
    } else if (e.type === 'ufo') {
      if (HZ('ufo')) drawCell(g, HZ('ufo'), e.x, e.y, { h: 70 }); else drawUfo(e.x, e.y);
    } else if (e.type === 'power') drawPower(g, e.k, e.x, e.y + Math.sin(e.ph * 3) * 8, tPlay);
    else if (e.type === 'missile') drawMissileEnt(e);
    else if (e.type === 'laser') drawLaser(e);
  }
}
function drawUfo(x, y) {
  g.fillStyle = 'rgba(140,255,170,.35)'; g.beginPath(); g.ellipse(x, y - 10, 22, 20, 0, Math.PI, TAU); g.fill();
  const rg = g.createLinearGradient(x, y - 10, x, y + 14); rg.addColorStop(0, '#9be86b'); rg.addColorStop(1, '#2f8a3a');
  g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, 40, 13, 0, 0, TAU); g.fill();
  g.fillStyle = Math.sin(tPlay * 10) > 0 ? '#ffe14a' : '#ff6b6b'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(x + i * 14, y + 2, 3.5, 0, TAU); g.fill(); }
}
function drawMissileEnt(e) {
  if (e.st === 'fly') { if (HZ('missile')) drawCell(g, HZ('missile'), e.x, e.y, { h: 44, flip: true }); else drawMissile(g, e.x, e.y, tPlay); return; }
  const x = W - 46, on = e.st === 'lock' || Math.floor(e.t * 8) % 2 === 0;
  if (e.t < 0) return;
  if (HZ('alarm')) drawCell(g, HZ('alarm'), x, e.y, { h: e.st === 'lock' ? 58 : 46, alpha: on ? 1 : 0.5 });
  else {
    g.fillStyle = on ? '#ff3b30' : '#7a1010'; g.beginPath(); g.arc(x, e.y, e.st === 'lock' ? 26 : 22, 0, TAU); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 30px Fredoka, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', x, e.y + 2);
  }
}
function drawLaser(e) {
  const warm = e.t < 1.6, on = e.t >= 1.6 && e.t < 3.0;
  for (const [x, flip] of [[22, false], [W - 22, true]]) {
    if (HZ('cannon')) drawCell(g, HZ('cannon'), x, e.y, { h: 44, flip });
    else { g.fillStyle = '#5c6680'; g.beginPath(); g.roundRect(x - 20, e.y - 16, 40, 32, 8); g.fill(); g.fillStyle = on || Math.floor(e.t * 10) % 2 ? '#ff3b30' : '#7a1010'; g.beginPath(); g.arc(x + (flip ? -14 : 14), e.y, 8, 0, TAU); g.fill(); }
  }
  if (warm) { g.strokeStyle = `rgba(255,70,70,${0.3 + 0.4 * (Math.floor(e.t * 10) % 2)})`; g.lineWidth = 2; g.setLineDash([14, 10]); g.beginPath(); g.moveTo(44, e.y); g.lineTo(W - 44, e.y); g.stroke(); g.setLineDash([]); }
  if (on) {
    const k = Math.min(1, (e.t - 1.6) * 8, (3.0 - e.t) * 8), h = 30 * k;
    const lg = g.createLinearGradient(0, e.y - h, 0, e.y + h); lg.addColorStop(0, 'rgba(255,40,60,0)'); lg.addColorStop(0.35, 'rgba(255,60,80,.85)'); lg.addColorStop(0.5, '#fff'); lg.addColorStop(0.65, 'rgba(255,60,80,.85)'); lg.addColorStop(1, 'rgba(255,40,60,0)');
    g.fillStyle = lg; g.fillRect(44, e.y - h, W - 88, h * 2);
  }
}
function draw() {
  g.setTransform(dpr * sc, 0, 0, dpr * sc, 0, 0);
  g.fillStyle = '#0b0a2e'; g.fillRect(0, 0, W, innerHeight / sc);
  g.translate(0, oy);
  if (shake > 0) g.translate(rnd(-1, 1) * shake * 14, rnd(-1, 1) * shake * 14);
  tile(space, dist * 0.05, 0, H, false, !!ART.space);
  if (!ART.space) tile(planets, dist * 0.12, 0, H);
  for (const d of decor) if (ART.decor[d.k]) drawCell(g, ART.decor[d.k], d.x, d.y, { h: d.s, alpha: 0.6 });
  // dek
  if (ART.floor) { tile(ART.floor, dist, FLOOR - 6, H - FLOOR + 140); tile(ART.floor, dist, CEIL - (H - FLOOR + 140) + 6, H - FLOOR + 140, true); }
  else { tile(deckF, dist, FLOOR - 4, deckF.height); tile(deckC, dist, CEIL - deckC.height + 4, deckC.height); }
  // koin
  for (const c of coins) {
    if (c.x < -40 || c.x > W + 40) continue;
    const cc = ART.items && ART.items[ART.items.map.coin];
    if (cc) { g.save(); g.translate(c.x, c.y); g.scale(Math.max(0.2, Math.abs(Math.cos(tPlay * 3 + c.x * 0.01))), 1); drawCell(g, cc, 0, 0, { h: 34 }); g.restore(); }
    else drawCoin(g, c.x, c.y, 15, tPlay);
  }
  drawEnts();
  // partikel
  parts = parts.filter(p => (p.t += 1 / 60) < p.life);
  for (const p of parts) {
    const k = p.t / p.life;
    if (p.spark) { g.fillStyle = `rgba(255,236,140,${1 - k})`; g.beginPath(); g.arc(p.x, p.y, 6 + k * 18, 0, TAU); g.fill(); continue; }
    p.x += p.vx / 60; p.y += p.vy / 60;
    g.fillStyle = k < 0.3 ? `rgba(255,200,90,${0.8 - k})` : `rgba(180,170,200,${0.5 * (1 - k)})`; g.beginPath(); g.arc(p.x, p.y, 5 + k * 14, 0, TAU); g.fill();
  }
  drawPlayer();
  if (shake > 0) shake = Math.max(0, shake - 1 / 60);
}

/* ---------- HUD & UI ---------- */
function hud() {
  $('h-dist').textContent = meters().toLocaleString('id-ID') + ' m';
  $('h-coins').textContent = coinRun;
  $('h-best').textContent = 'Rekor ' + Math.max(store.get('best', 0), meters()).toLocaleString('id-ID') + ' m';
  const bars = ['magnet', 'double', 'boost'].filter(k => pw[k] > 0).map(k =>
    `<div class="pbar"><span>${POWER[k].emoji}</span><i style="width:${pw[k] / POWER[k].dur * 100}%;background:${POWER[k].color}"></i></div>`);
  if (P.shield) bars.unshift('<div class="pbar tag">🛡️ Perisai</div>');
  if (P.lives) bars.unshift(`<div class="pbar tag">${'❤️'.repeat(P.lives)}</div>`);
  $('h-powers').innerHTML = bars.join('');
}
let toastT = 0;
function toast(s) { const t = $('toast'); t.textContent = s; t.classList.add('show'); toastT = 1.4; }
function show(ids) { ['menu', 'over', 'pause', 'hud', 'loading'].forEach(k => $(k).classList.toggle('hidden', !ids.includes(k))); }
function portrait() {
  const f = FA(); if (!f) return 'assets/faces/falisha.jpg';
  const c = f[f.map.portrait] || f[f.map.wave], s = Math.max(c.x1 - c.x0, c.y1 - c.y0) + 8, o = document.createElement('canvas'); o.width = o.height = 200;
  o.getContext('2d').drawImage(c.cv, (c.x0 + c.x1) / 2 - s / 2, (c.y0 + c.y1) / 2 - s / 2, s, s, 0, 0, 200, 200); return o.toDataURL();
}
function toMenu() {
  state = 'menu'; reset(); show(['menu']); Chip?.play(TRACKS, 1);
  $('m-best').textContent = store.get('best', 0).toLocaleString('id-ID') + ' m';
  $('m-coins').textContent = store.get('coins', 0).toLocaleString('id-ID');
  $('m-face').src = portrait();
  $('m-sprites').textContent = `Sprite Nano Banana: ${ART.count || 0}/6`;
}
function start() { Chip?.ensure(); reset(); state = 'play'; holding = false; show(['hud']); Chip?.play(TRACKS, 0); }
function gameOver() {
  state = 'over';
  const m = meters(), b = store.get('best', 0), nb = m > b;
  if (nb) store.set('best', m);
  store.set('coins', store.get('coins', 0) + coinRun);
  $('o-dist').textContent = m.toLocaleString('id-ID') + ' m'; $('o-coins').textContent = coinRun;
  $('o-best').textContent = Math.max(m, b).toLocaleString('id-ID') + ' m'; $('o-new').classList.toggle('hidden', !nb);
  $('o-face').src = portrait();
  show(['over']);
}
function pause(on) {
  if (on && state === 'play') { state = 'pause'; holding = false; show(['pause', 'hud']); Chip?.play(TRACKS, -1); }
  else if (!on && state === 'pause') { state = 'play'; show(['hud']); Chip?.play(TRACKS, 0); last = performance.now(); }
}

/* ---------- input: tahan = terbang ---------- */
const down = () => { Chip?.ensure(); if (state === 'play') holding = true; };
const up = () => { holding = false; };
cv.addEventListener('pointerdown', e => { e.preventDefault(); down(); });
addEventListener('pointerup', up); addEventListener('pointercancel', up); addEventListener('blur', up);
$('fly').addEventListener('pointerdown', e => { e.preventDefault(); $('fly').classList.add('on'); down(); });
['pointerup', 'pointercancel', 'pointerleave'].forEach(t => $('fly').addEventListener(t, () => { $('fly').classList.remove('on'); up(); }));
const FLYKEYS = [' ', 'arrowup', 'w', 'enter'];
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown'].includes(k)) e.preventDefault();
  if ((state === 'menu' || state === 'over') && (k === 'enter' || k === ' ')) { if (!e.repeat) start(); return; }
  if (k === 'p' || k === 'escape') return pause(state === 'play');
  if (k === 'm') return toggleMute();
  if (FLYKEYS.includes(k)) down();
});
addEventListener('keyup', e => { if (FLYKEYS.includes(e.key.toLowerCase())) up(); });
function toggleMute() { Chip?.setMuted(!Chip.isMuted()); $('btn-mute').textContent = Chip?.isMuted() ? '🔇' : '🔊'; }
$('btn-mute').onclick = toggleMute; $('btn-mute').textContent = Chip?.isMuted() ? '🔇' : '🔊';
$('btn-pause').onclick = () => pause(state === 'play');
$('btn-full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};
$('btn-start').onclick = start; $('btn-again').onclick = start; $('btn-menu').onclick = toMenu;
$('btn-resume').onclick = () => pause(false); $('btn-quit').onclick = toMenu;

/* ---------- loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state === 'play') update(dt);
  else if (state === 'dead') updateDead(dt);
  else if (state === 'menu') { tPlay += dt; P.t += dt; dist += 160 * dt; P.pose = 'run'; }
  if (state !== 'loading') draw();
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('show');
  if (state === 'play' || state === 'dead') hud();
  requestAnimationFrame(frame);
}
(async () => {
  show(['loading']);
  try { await loadArt(); } catch (e) { console.warn('Sprite gagal dimuat', e); }
  buildLayers(); toMenu(); requestAnimationFrame(frame);
})();

/* kait untuk smoke test (tools/smoke.js) */
window.__jet = { P, pw, state: () => state, dist: () => dist, ents: () => ents.length, coins: () => coins.length, collect, start,
  hold(v) { holding = v; }, step(n) { for (let i = 0; i < n && state === 'play'; i++) update(1 / 60); },
  stepDead(n) { for (let i = 0; i < n && state === 'dead'; i++) updateDead(1 / 60); }, spawnLaser, spawnMissiles };
