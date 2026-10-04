/* Falisha the Flash – platformer pixel art ala Sonic x The Flash
   3 stage + bos Yanto, musik chiptune, kontrol sentuh untuk tablet */
(() => {
'use strict';
const W = 960, H = 540, T = 32;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const COARSE = matchMedia('(pointer: coarse)').matches;

/* ---------- Audio: SFX + musik chiptune ---------- */
let actx = null, muted = localStorage.getItem('ftf_muted') === '1', noiseBuf = null;
function ensureAudio() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    if (!noiseBuf) {
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
  } catch (e) {}
}
function tone(f, t, d, type = 'square', vol = 0.05, slide = 0) {
  if (!actx || muted) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
}
function noise(t, d, vol, hp = 5000) {
  if (!actx || muted || !noiseBuf) return;
  const s = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter();
  s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  s.connect(f).connect(g).connect(actx.destination); s.start(t); s.stop(t + d + 0.02);
}
const beep = (f, d = 0.1, type = 'square', vol = 0.06, slide = 0) => { ensureAudio(); if (actx) tone(f, actx.currentTime, d, type, vol, slide); };
const later = (fn, ms) => setTimeout(fn, ms);
const sfx = {
  jump: () => beep(300, 0.18, 'square', 0.06, 400),
  ring: () => { beep(988, 0.08, 'square', 0.05); later(() => beep(1319, 0.12, 'square', 0.05), 70); },
  stomp: () => beep(220, 0.15, 'sawtooth', 0.07, -150),
  hurt: () => beep(400, 0.35, 'sawtooth', 0.08, -330),
  spring: () => beep(250, 0.25, 'triangle', 0.1, 700),
  check: () => { beep(660, 0.1, 'triangle', 0.08); later(() => beep(880, 0.15, 'triangle', 0.08), 100); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => later(() => beep(f, 0.25, 'square', 0.06), i * 140)),
  turbo: () => beep(120, 0.2, 'sawtooth', 0.04, 500),
  boom: () => { beep(110, 0.4, 'sawtooth', 0.1, -80); ensureAudio(); if (actx) noise(actx.currentTime, 0.3, 0.15, 800); },
  shoot: () => beep(700, 0.15, 'square', 0.04, -450),
  shout: () => { beep(260, 0.35, 'sawtooth', 0.09, -140); later(() => beep(200, 0.3, 'square', 0.07, -80), 120); }
};
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
const SHOUTS = ['KERJAIN KUMON !', 'JANGAN NONTON !', 'MAKAN DULU BARU MAIN !'];
const _ = null;
const TRACKS = [
  { bpm: 150, wave: 'square', bass: [48, 53], lead: [72,_,76,_,79,_,76,72, 74,_,77,_,81,_,77,74, 72,_,76,79,84,_,79,76, 77,_,74,76,72,_,_,_] },        // Taman Hijau
  { bpm: 164, wave: 'square', bass: [45, 41], lead: [69,_,72,_,76,_,72,69, 67,_,71,_,74,_,71,67, 69,72,76,81,_,76,72,69, 65,_,69,72,76,_,_,_] },        // Kota Kilat
  { bpm: 140, wave: 'sawtooth', bass: [38, 34], lead: [62,_,_,65,_,69,_,_, 68,_,_,65,_,62,_,_, 62,_,65,_,69,_,74,_, 73,_,69,_,65,_,62,_] },           // Lab Petir
  { bpm: 176, wave: 'square', bass: [40, 43], boss: true, lead: [64,64,_,67,64,_,71,_, 70,70,_,67,64,_,63,_, 64,64,_,67,64,_,71,74, 75,_,74,71,70,_,67,_] } // Bos
];
const mus = { track: -1, step: 0, next: 0, timer: null };
function playMusic(i) {
  ensureAudio(); if (!actx) return;
  if (mus.track === i) return;
  mus.track = i; mus.step = 0; mus.next = actx.currentTime + 0.1;
  if (!mus.timer) mus.timer = setInterval(schedule, 40);
}
function schedule() {
  if (!actx || mus.track < 0) return;
  if (muted) { mus.next = actx.currentTime + 0.1; return; }
  const tr = TRACKS[mus.track], sd = 60 / tr.bpm / 4;
  while (mus.next < actx.currentTime + 0.25) {
    const s = mus.step, idx = s % 16, t = mus.next;
    const n = tr.lead[s % 32]; if (n !== null) tone(mtof(n), t, sd * 1.8, tr.wave, 0.03);
    if (idx % 2 === 0) { const root = tr.bass[Math.floor(s / 16) % tr.bass.length]; tone(mtof(idx % 4 === 2 ? root + 7 : root), t, sd * 1.7, 'triangle', 0.09); }
    if (idx % 4 === 0 || (tr.boss && idx === 10)) tone(140, t, 0.1, 'sine', 0.12, -100);
    if (idx === 4 || idx === 12) noise(t, 0.1, 0.07, 1500);
    if (idx % 2 === 0) noise(t, 0.04, 0.025, 7000);
    mus.next += sd; mus.step++;
  }
}
function setMuted(m) { muted = m; localStorage.setItem('ftf_muted', m ? '1' : '0'); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }

/* ---------- Sprites (chroma key magenta -> transparan) ---------- */
function loadImg(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
function cutSprite(img, x, y, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gr = p[i + 1], b = p[i + 2];
    if (r > 140 && b > 120 && gr < Math.min(r, b) - 50) p[i + 3] = 0;
    else {
      const px = (i / 4) % w, py = (i / 4 / w) | 0;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
    }
  }
  g.putImageData(d, 0, 0);
  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const out = document.createElement('canvas'); out.width = tw; out.height = th;
  out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}
const S = { bgs: {} };
async function loadAssets() {
  const [pl, it, bs, g, c, l, pu, ti] = await Promise.all([
    loadImg('assets/sprites/falisha.jpg'), loadImg('assets/sprites/items.jpg'), loadImg('assets/sprites/boss.jpg'),
    loadImg('assets/backgrounds/green_hills.jpg'), loadImg('assets/backgrounds/city.jpg'), loadImg('assets/backgrounds/lab.jpg'),
    loadImg('assets/sprites/powerups.jpg'), loadImg('assets/backgrounds/title.jpg')
  ]);
  S.title = ti;
  const P = (x, y, w, h) => cutSprite(pl, x, y, w, h);
  const cell = (col, row) => P(col * 344 + 8, row * 384 + 8, 328, 368);
  S.idle = cell(0, 0);
  S.run = [cell(1, 0), cell(2, 0), cell(3, 0), cell(0, 1)];
  S.fall = cell(1, 1);
  S.spin = cell(2, 1);
  S.hurt = cell(3, 1);
  const I = (x, y, w, h) => cutSprite(it, x, y, w, h);
  S.robot = I(70, 280, 170, 200); S.flyer = I(270, 290, 210, 180); S.ring = I(500, 280, 180, 200);
  S.spring = I(700, 280, 190, 200); S.flag = I(920, 270, 180, 230); S.finish = I(1110, 260, 220, 240);
  S.boss = cutSprite(bs, 40, 55, 545, 650); S.bossHurt = cutSprite(bs, 620, 60, 545, 645); S.orb = cutSprite(bs, 1180, 320, 170, 130);
  S.bgs.green = g; S.bgs.city = c; S.bgs.lab = l;
  S.pw = [[40, 250, 255], [295, 250, 262], [560, 250, 258], [825, 250, 262], [1090, 250, 255]].map(([x, y, w]) => cutSprite(pu, x, y, w, 265));
}

/* ---------- Input (keyboard + multi-touch) ---------- */
const keys = {}; const touch = { left: false, right: false, turbo: false, jump: false };
let jumpBuf = 0, startReq = false;
function gesture() {
  ensureAudio();
  if (mus.track < 0) playMusic(0);
}
addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  if (!keys[e.key] && (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w')) { jumpBuf = 8; startReq = true; gesture(); }
  if (e.key === 'Enter') { startReq = true; gesture(); }
  if (e.key === 'm' || e.key === 'M') setMuted(!muted);
  keys[e.key] = true;
});
addEventListener('keyup', e => { keys[e.key] = false; });
function goFull() {
  if (document.fullscreenElement) return;
  document.documentElement.requestFullscreen?.({ navigationUI: 'hide' })
    .then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
}
cv.addEventListener('pointerdown', () => { startReq = true; gesture(); if (COARSE) goFull(); });
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
function bindBtn(id, k) {
  const b = document.getElementById(id);
  const on = e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); touch[k] = true; b.classList.add('on'); if (k === 'jump') jumpBuf = 8; startReq = true; gesture(); };
  const off = e => { e.preventDefault(); touch[k] = false; b.classList.remove('on'); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
}
bindBtn('btn-turbo', 'turbo'); bindBtn('btn-jump', 'jump');
// D-pad: geser jari dari kiri ke kanan tanpa mengangkat
(() => {
  const d = document.getElementById('dpad'), [l, r] = d.querySelectorAll('span');
  const set = (L, R) => { touch.left = L; touch.right = R; l.classList.toggle('on', L); r.classList.toggle('on', R); };
  const upd = e => { const b = d.getBoundingClientRect(), x = (e.clientX - b.left) / b.width; set(x < 0.5, x >= 0.5); };
  d.addEventListener('pointerdown', e => { e.preventDefault(); d.setPointerCapture(e.pointerId); startReq = true; gesture(); upd(e); });
  d.addEventListener('pointermove', e => { if (e.buttons || e.pressure > 0) upd(e); });
  const off = () => set(false, false);
  d.addEventListener('pointerup', off); d.addEventListener('pointercancel', off); d.addEventListener('lostpointercapture', off);
})();
document.getElementById('btn-mute').addEventListener('click', e => { e.stopPropagation(); gesture(); setMuted(!muted); });
document.getElementById('btn-full').addEventListener('click', e => {
  e.stopPropagation(); if (document.fullscreenElement) document.exitFullscreen(); else goFull();
});
setMuted(muted);
const inp = () => ({
  left: keys.ArrowLeft || keys.a || touch.left, right: keys.ArrowRight || keys.d || touch.right,
  jump: keys[' '] || keys.ArrowUp || keys.w || touch.jump, turbo: keys.Shift || keys.z || touch.turbo
});

/* ---------- Stage ---------- */
const STAGES = [
  { name: 'TAMAN HIJAU', bg: 'green', crop: 470, N: 300, seed: 11, pits: 6, enemyStep: 14, flyerP: 0.3, amp: [38, 18], spd: 0.9, music: 0,
    top: '#43c548', topHi: '#8cf05a', dirt: '#8a5a2b', chk: '#a2702f', fill: ['#2f9e3a', '#14501f'] },
  { name: 'KOTA KILAT', bg: 'city', crop: 495, N: 340, seed: 23, pits: 8, enemyStep: 11, flyerP: 0.4, amp: [48, 24], spd: 1.15, music: 1,
    top: '#ff5fd2', topHi: '#ffb3ec', dirt: '#2d2154', chk: '#3b2b72', fill: ['#2a1760', '#120a30'] },
  { name: 'LAB PETIR', bg: 'lab', crop: 515, N: 380, seed: 37, pits: 9, enemyStep: 9, flyerP: 0.45, amp: [55, 28], spd: 1.4, music: 2,
    top: '#35e0ff', topHi: '#c4f8ff', dirt: '#1b2a4a', chk: '#27406b', fill: ['#0e1e42', '#050c1f'] },
  { name: 'BOS: YANTO', bg: 'lab', crop: 515, N: 34, seed: 5, pits: 0, boss: true, amp: [0, 0], music: 3,
    top: '#ff4d5a', topHi: '#ffb0b6', dirt: '#3a1b2a', chk: '#4d2336', fill: ['#2a0d1e', '#10040c'] }
];
let N = 300, hArr = [], pit = [], pitRanges = [];
let rings, enemies, springs, plats, checkpoints, finishX, boss = null, orbs = [], pickups = [];
/* Powerup sementara (durasi dalam frame, 60 = 1 detik) */
const PW = [
  { key: 'shield', name: 'PERISAI', dur: 900, color: '#4cc9ff' },
  { key: 'speed', name: 'PETIR SUPER', dur: 600, color: '#ffb02e' },
  { key: 'magnet', name: 'MAGNET', dur: 720, color: '#b46bff' },
  { key: 'djump', name: 'LOMPAT GANDA', dur: 720, color: '#5ee26b' },
  { key: 'star', name: 'BINTANG KEBAL', dur: 480, color: '#ffe55c' }
];
const pw = { shield: 0, speed: 0, magnet: 0, djump: 0, star: 0 };
const toast = { t: 0, text: '', color: '#fff' };
let si = 0, st = STAGES[0];

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function groundAt(x) {
  if (x < 0) return hArr[0];
  const c = Math.floor(x / T);
  if (c >= N || pit[c]) return null;
  const f = (x - c * T) / T, a = hArr[c];
  const b = (c + 1 < N && !pit[c + 1]) ? hArr[c + 1] : a;
  return a + (b - a) * f;
}
const nearPit = (c0, c1) => pitRanges.some(([a, b]) => c1 >= a - 1 && c0 <= b + 1);
function buildLevel(idx) {
  si = idx; st = STAGES[idx]; N = st.N; hArr = new Array(N); pit = new Array(N).fill(false); pitRanges = [];
  const R = rng(st.seed);
  for (let c = 0; c < N; c++) {
    const blend = Math.min(1, Math.max(0, (c - 8) / 14));
    hArr[c] = 400 + blend * (st.amp[0] * Math.sin(c * 0.085) + st.amp[1] * Math.sin(c * 0.21 + 1));
  }
  rings = []; enemies = []; springs = []; plats = []; checkpoints = []; boss = null; orbs = []; pickups = [];
  if (st.boss) {
    finishX = Infinity;
    boss = { x: N * T / 2, y: -160, hp: 6, max: 6, mode: 'enter', t: 0, inv: 0, dir: 1, tx: 0, shoot: 60 };
    for (let i = 0; i < 6; i++) rings.push({ x: 200 + i * 130, y: 330 - Math.sin(i / 5 * Math.PI) * 40, got: false });
    pickups.push({ x: 180, y: 320, type: 0, got: false }, { x: 780, y: 320, type: 3, got: false });
    return;
  }
  const gap = (N - 90) / st.pits;
  for (let k = 0; k < st.pits; k++) {
    const a = Math.floor(40 + k * gap + R() * 5), w = 3 + (si > 0 ? 1 : 0) + (R() < 0.3 ? 1 : 0);
    pitRanges.push([a, a + w - 1]);
  }
  pitRanges.forEach(([a, b]) => { for (let c = a; c <= b; c++) { pit[c] = true; hArr[c] = hArr[a - 1]; } });
  finishX = (N - 10) * T;
  for (let c = 12; c < N - 14; c += 14) {
    if (nearPit(c, c + 5)) continue;
    for (let i = 0; i < 5; i++) { const x = c * T + i * 30; rings.push({ x, y: groundAt(x) - 46, got: false }); }
  }
  pitRanges.forEach(([a, b]) => {
    const x0 = (a - 0.5) * T, x1 = (b + 2) * T, base = hArr[a - 1];
    for (let i = 0; i < 7; i++) { const t = i / 6; rings.push({ x: x0 + (x1 - x0) * t, y: base - 50 - Math.sin(t * Math.PI) * 90, got: false }); }
  });
  for (let c = 60; c < N - 20; c += 55 + Math.floor(R() * 15)) {
    if (nearPit(c - 2, c + 6)) continue;
    const y = groundAt(c * T) - 135; plats.push({ x: c * T, y, w: 128 });
    for (let i = 0; i < 4; i++) rings.push({ x: c * T + 18 + i * 30, y: y - 32, got: false });
  }
  for (let c = 66; c < N - 20; c += 46 + Math.floor(R() * 8)) {
    if (nearPit(c - 2, c + 2)) continue;
    springs.push({ x: c * T, y: groundAt(c * T), cool: 0 });
  }
  for (let c = 28; c < N - 16; c += st.enemyStep + Math.floor(R() * 6)) {
    if (nearPit(c - 3, c + 3) || springs.some(s => Math.abs(s.x - c * T) < 96)) continue;
    if (R() < st.flyerP) enemies.push({ type: 'f', x: c * T, x0: c * T, base: groundAt(c * T) - 115, y: 0, alive: true, t: R() * 6 });
    else enemies.push({ type: 'g', x: c * T, x0: c * T, range: 70, dir: 1, alive: true, y: groundAt(c * T), t: 0 });
  }
  for (let c = 46 + Math.floor(R() * 10); c < N - 20; c += 38 + Math.floor(R() * 14)) {
    if (nearPit(c - 2, c + 2)) continue;
    pickups.push({ x: c * T, y: groundAt(c * T) - 85, type: Math.floor(R() * PW.length), got: false });
  }
  [Math.floor(N / 3), Math.floor(2 * N / 3)].forEach(c => {
    while (nearPit(c - 2, c + 2)) c++;
    checkpoints.push({ x: c * T, y: groundAt(c * T), on: false });
  });
}

/* ---------- State ---------- */
let state = 'title', camX = 0, score = 0, lives = 3, ringCount = 0, timeF = 0, frame = 0, stageT = 0, bonus = 0;
const P = {};
const parts = [], ghosts = [];
let respawn = { x: 100, y: 400 };

function resetPlayer(x, y) {
  Object.assign(P, { x, y, vx: 0, vy: 0, grounded: true, plat: null, face: 1, spin: false, inv: 0, hurt: 0, anim: 0, mom: 0, dead: false, deadT: 0, turboOn: false, attacking: false, dj: false });
  for (const k in pw) pw[k] = 0;
}
function startStage(idx) {
  buildLevel(idx); timeF = 0; parts.length = 0; ghosts.length = 0;
  respawn = { x: 100, y: groundAt(100) }; resetPlayer(respawn.x, respawn.y); camX = 0;
  state = 'intro'; stageT = 0; playMusic(st.music);
}
function newGame() { score = 0; lives = 3; ringCount = 0; const q = parseInt(new URLSearchParams(location.search).get('stage')); startStage(q >= 1 && q <= 4 ? q - 1 : 0); }
function spawnParts(x, y, n, color, spd = 4, size = 4) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.28, s = Math.random() * spd;
    parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 20 + Math.random() * 20, color, size });
  }
}
function hurt() {
  if (P.inv > 0 || P.dead || pw.star > 0) return;
  if (pw.shield > 0) {
    pw.shield = 0; P.inv = 70; sfx.stomp(); spawnParts(P.x, P.y - 30, 18, '#4cc9ff', 5, 4);
    toast.text = 'PERISAI PECAH!'; toast.color = '#4cc9ff'; toast.t = 70; return;
  }
  sfx.hurt();
  if (ringCount > 0) {
    spawnParts(P.x, P.y - 30, Math.min(ringCount, 20), '#ffd23f', 6, 5);
    ringCount = 0; P.vy = -7; P.vx = -P.face * 4; P.inv = 120; P.hurt = 35; P.grounded = false; P.spin = false; P.plat = null;
  } else die();
}
function die() {
  if (P.dead) return;
  P.dead = true; P.deadT = 0; P.vy = -11; P.vx = 0; P.grounded = false; lives--; sfx.hurt();
}

/* ---------- Update ---------- */
function updatePlayer() {
  const k = inp();
  if (P.dead) {
    P.vy += 0.55; P.y += P.vy; P.deadT++;
    if (P.deadT > 90) {
      if (lives <= 0) { state = 'gameover'; stageT = 0; }
      else { resetPlayer(respawn.x, respawn.y); ringCount = 0; P.inv = 90; }
    }
    return;
  }
  const dir = (k.right ? 1 : 0) - (k.left ? 1 : 0);
  for (const key in pw) if (pw[key] > 0) pw[key]--;
  const turbo = (k.turbo || pw.speed > 0) && dir !== 0;
  if (turbo && !P.turboOn) sfx.turbo();
  P.turboOn = turbo;
  const maxSp = turbo ? (pw.speed > 0 ? 16 : 13) : 6 + P.mom * 3;
  if (P.hurt > 0) P.hurt--;
  else if (dir) {
    P.face = dir;
    if (Math.sign(P.vx) !== dir && P.vx !== 0 && P.grounded) P.vx += dir * 0.7;
    else if (Math.abs(P.vx) < maxSp) P.vx += dir * (P.grounded ? (turbo ? 0.5 : 0.3) : 0.2);
    if (P.grounded && Math.abs(P.vx) > 5) P.mom = Math.min(1, P.mom + 0.004);
  } else if (P.grounded) { P.vx *= 0.93; if (Math.abs(P.vx) < 0.12) P.vx = 0; }
  else P.vx *= 0.995;
  if (Math.abs(P.vx) > maxSp && !turbo) P.vx -= Math.sign(P.vx) * 0.1;
  if (Math.abs(P.vx) < 2) P.mom = Math.max(0, P.mom - 0.02);

  if (jumpBuf > 0) jumpBuf--;
  if (jumpBuf > 0 && P.grounded && P.hurt === 0) {
    P.vy = -11.8; P.grounded = false; P.plat = null; P.spin = true; jumpBuf = 0; sfx.jump();
    spawnParts(P.x, P.y, 6, '#fff', 2, 3);
  } else if (jumpBuf > 0 && !P.grounded && pw.djump > 0 && !P.dj && P.hurt === 0) {
    P.vy = -11; P.dj = true; P.spin = true; jumpBuf = 0; sfx.jump();
    spawnParts(P.x, P.y - 10, 12, '#9dffa5', 3, 4);
  }
  if (!k.jump && P.vy < -4.5 && !P.grounded) P.vy = -4.5;

  if (P.grounded && !P.plat) {
    const slope = ((groundAt(P.x + 4) ?? P.y) - (groundAt(P.x - 4) ?? P.y)) / 8;
    P.vx += slope * 0.2;
  }
  P.x += P.vx;
  if (P.x < 16) { P.x = 16; P.vx = 0; }
  if (P.x > N * T - 16) { P.x = N * T - 16; P.vx = 0; }

  if (P.grounded) {
    if (P.plat) {
      if (P.x < P.plat.x - 6 || P.x > P.plat.x + P.plat.w + 6) { P.grounded = false; P.plat = null; }
      else P.y = P.plat.y;
    } else {
      const gy = groundAt(P.x);
      if (gy !== null && (gy < P.y || gy - P.y < 16 + Math.abs(P.vx) * 1.2)) P.y = gy;
      else { P.grounded = false; P.vy = Math.max(0, P.vy); }
    }
  }
  if (!P.grounded) {
    P.vy = Math.min(14, P.vy + 0.55);
    const prev = P.y; P.y += P.vy;
    if (P.vy >= 0) {
      const gy = groundAt(P.x);
      if (gy !== null && P.y >= gy && prev <= gy + 16) land(gy, null);
      else for (const p of plats) {
        if (P.x > p.x - 6 && P.x < p.x + p.w + 6 && prev <= p.y + 4 && P.y >= p.y) { land(p.y, p); break; }
      }
    }
  }
  if (P.y > H + 140) die();
  if (P.inv > 0) P.inv--;
  P.anim += Math.abs(P.vx) * 0.045 + 0.02;

  P.attacking = P.spin || (turbo && Math.abs(P.vx) > 9) || pw.star > 0 || (pw.speed > 0 && Math.abs(P.vx) > 6);
  if (Math.abs(P.vx) > 8 || turbo) {
    if (frame % 3 === 0) ghosts.push({ x: P.x, y: P.y, img: curFrame(), face: P.face, life: 14 });
    if (frame % 2 === 0) spawnParts(P.x - P.face * 10, P.y - 28 + (Math.random() - 0.5) * 30, 1, Math.random() < 0.5 ? '#ffe55c' : '#ffffff', 2, 3);
  }
  for (const pk of pickups) {
    if (pk.got) continue;
    if (Math.abs(pk.x - P.x) < 32 && Math.abs(pk.y - (P.y - 28)) < 46) {
      pk.got = true; const d = PW[pk.type]; pw[d.key] = d.dur; score += 50; sfx.check();
      toast.text = d.name + '!'; toast.color = d.color; toast.t = 100; spawnParts(pk.x, pk.y, 16, d.color, 5, 4);
    }
  }
  for (const r of rings) {
    if (r.got) continue;
    if (pw.magnet > 0) {
      const mx = P.x - r.x, my = (P.y - 28) - r.y;
      if (Math.hypot(mx, my) < 190) { r.x += mx * 0.14; r.y += my * 0.14; }
    }
    if (Math.abs(r.x - P.x) < 26 && Math.abs(r.y - (P.y - 28)) < 36) {
      r.got = true; ringCount++; score += 10; sfx.ring(); spawnParts(r.x, r.y, 6, '#ffe55c', 3, 3);
      if (ringCount % 100 === 0) lives++;
    }
  }
  for (const s of springs) {
    if (s.cool > 0) s.cool--;
    if (!s.cool && Math.abs(s.x - P.x) < 24 && P.y >= s.y - 12 && P.y <= s.y + 16 && P.hurt === 0) {
      P.vy = -17; P.grounded = false; P.plat = null; P.spin = true; s.cool = 20; sfx.spring();
    }
  }
  for (const c of checkpoints) if (!c.on && P.x > c.x) { c.on = true; respawn = { x: c.x, y: c.y }; sfx.check(); spawnParts(c.x, c.y - 40, 12, '#ff5252', 4, 4); }
  if (P.x > finishX) {
    state = 'clear'; stageT = 0; sfx.win();
    bonus = Math.max(0, 3000 - Math.floor(timeF / 60) * 15); score += bonus;
  }
}
function land(y, plat) { P.dj = false; P.y = y; P.vy = 0; P.grounded = true; P.plat = plat; P.spin = false; spawnParts(P.x, P.y, 4, '#d9c9a0', 2, 3); }

function updateEnemies() {
  for (const e of enemies) {
    if (!e.alive) continue;
    e.t += 0.05;
    if (e.type === 'g') {
      e.x += e.dir * st.spd;
      if (Math.abs(e.x - e.x0) > e.range) e.dir *= -1;
      const gy = groundAt(e.x);
      if (gy === null) { e.dir *= -1; e.x += e.dir * 2; } else e.y = gy;
    } else { e.x = e.x0 + Math.sin(e.t * 0.7 * st.spd) * 90; e.y = e.base + Math.sin(e.t * 1.6) * 28; }
    if (P.dead) continue;
    const eh = e.type === 'g' ? 40 : 36, ey = e.type === 'g' ? e.y : e.y + 18;
    const ph = P.spin ? 38 : 54;
    if (Math.abs(e.x - P.x) < 28 && P.y > ey - eh && P.y - ph < ey) {
      const stomp = P.vy > 1 && P.y < ey - eh + 24;
      if (stomp || P.attacking) {
        e.alive = false; score += 100; sfx.stomp(); spawnParts(e.x, ey - eh / 2, 14, '#ff9f1c', 5, 4);
        if (stomp) P.vy = (inp().jump ? -10 : -6);
      } else hurt();
    }
  }
}

function updateBoss() {
  const B = boss; if (!B) return;
  B.t++; if (B.inv > 0) B.inv--; if (B.shoutT > 0) B.shoutT--;
  const cx = N * T / 2;
  if (B.mode === 'enter') { B.y += 3; if (B.y >= 300) { B.y = 300; B.mode = 'hover'; B.t = 0; } }
  else if (B.mode === 'hover') {
    B.x += (cx + Math.sin(B.t * 0.022) * 330 - B.x) * 0.06;
    B.y = 300 + Math.sin(B.t * 0.05) * 14;
    B.shoot--;
    if (B.shoot <= 0 && !P.dead) {
      B.shoot = B.hp <= 3 ? 55 : 85; sfx.shoot();
      const n = B.hp <= 3 ? [-0.25, 0, 0.25] : [0];
      const dx = P.x - B.x, dy = (P.y - 28) - (B.y - 60), a = Math.atan2(dy, dx);
      n.forEach(o => orbs.push({ x: B.x, y: B.y - 60, vx: Math.cos(a + o) * 3.6, vy: Math.sin(a + o) * 3.6, life: 300 }));
    }
    if (B.t > (B.hp <= 3 ? 220 : 320)) {
      B.t = 0;
      if (Math.random() < 0.6) {
        B.mode = 'cast'; B.move = B.move === undefined ? 0 : (B.move + 1 + Math.floor(Math.random() * 2)) % 3;
        B.shout = SHOUTS[B.move]; B.shoutT = 130; sfx.shout();
      } else B.mode = 'tele';
    }
  } else if (B.mode === 'cast') {
    B.y += (290 - B.y) * 0.05; B.x += (Math.random() - 0.5) * 3;
    if (B.t === 45) bossSpecial(B);
    if (B.t > 85) { B.mode = 'hover'; B.t = 0; B.shoot = 70; }
  } else if (B.mode === 'tele') {
    B.x += (Math.random() - 0.5) * 6;
    if (B.t > 40) { B.mode = 'dash'; B.t = 0; B.dir = P.x < B.x ? -1 : 1; B.dir = B.x < cx ? 1 : -1; }
  } else if (B.mode === 'dash') {
    B.y += (385 - B.y) * 0.15; B.x += B.dir * (B.hp <= 3 ? 8.5 : 7);
    if (B.x < 90) { B.x = 90; B.mode = 'rise'; B.t = 0; }
    if (B.x > N * T - 90) { B.x = N * T - 90; B.mode = 'rise'; B.t = 0; }
  } else if (B.mode === 'rise') {
    B.y += (300 - B.y) * 0.08; if (B.t > 50) { B.mode = 'hover'; B.t = 0; B.shoot = 40; }
  } else if (B.mode === 'dead') {
    B.y += 0.7; if (B.t % 4 === 0) { spawnParts(B.x + (Math.random() - 0.5) * 100, B.y - Math.random() * 110, 8, ['#ff9f1c', '#ffd23f', '#fff'][B.t % 3], 5, 5); if (B.t % 12 === 0) sfx.boom(); }
    if (B.t > 150) { state = 'win'; stageT = 0; sfx.win(); score += 5000; playMusic(0); }
    return;
  }
  // tabrakan boss
  if (B.mode !== 'enter' && !P.dead) {
    const top = B.y - 120, bot = B.y - 8, ph = P.spin ? 38 : 54;
    if (Math.abs(B.x - P.x) < 58 && P.y > top && P.y - ph < bot) {
      if (B.inv === 0 && (P.attacking || (P.vy > 1 && P.y < top + 30))) {
        B.hp--; B.inv = 70; P.vy = -9; P.vx = (P.x < B.x ? -1 : 1) * 5; P.grounded = false; P.plat = null; P.spin = true;
        spawnParts(B.x, B.y - 70, 22, '#ffd23f', 6, 5); sfx.boom(); score += 500;
        if (B.hp <= 0) { B.mode = 'dead'; B.t = 0; orbs.length = 0; }
        else if (B.mode === 'dash' || B.mode === 'tele' || B.mode === 'cast') { B.mode = 'rise'; B.t = 0; }
      } else if (B.inv === 0 && B.mode !== 'dead') hurt();
    }
  }
  for (const o of orbs) {
    o.x += o.vx; o.y += o.vy; if (o.g) o.vy += o.g; o.life--;
    if (o.kind && o.y > 408) { o.life = 0; spawnParts(o.x, 408, 8, o.kind === 'food' ? '#7ed957' : '#fff', 3, 4); continue; }
    if (!P.dead && Math.hypot(o.x - P.x, o.y - (P.y - 28)) < (o.r || 24)) {
      o.life = 0;
      if (P.attacking) { score += 50; spawnParts(o.x, o.y, 8, '#ff5252', 4, 4); sfx.stomp(); } else hurt();
    }
  }
  for (let i = orbs.length - 1; i >= 0; i--) if (orbs[i].life <= 0 || orbs[i].y > H + 20) orbs.splice(i, 1);
}

function bossSpecial(B) {
  const hard = B.hp <= 3, R = Math.random;
  if (B.move === 0) {            // KERJAIN KUMON ! -> hujan lembar kerja
    const n = hard ? 13 : 9;
    for (let i = 0; i < n; i++) orbs.push({ kind: 'paper', emoji: '📝', x: camX + 40 + (W - 80) * i / (n - 1) + (R() - 0.5) * 30, y: -30 - R() * 170, vx: 0, vy: 2 + R() * 1.3, r: 26, life: 400, rot: R() * 6 });
  } else if (B.move === 1) {     // JANGAN NONTON ! -> ledakan tanda larangan ke segala arah
    const n = hard ? 14 : 10;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.2; orbs.push({ kind: 'ban', emoji: '🚫', x: B.x, y: B.y - 60, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, r: 24, life: 300 }); }
  } else {                       // MAKAN DULU BARU MAIN ! -> lempar makanan
    const n = hard ? 5 : 4, foods = ['🥦', '🍗', '🍚', '🥕'], g = 0.25;
    for (let i = 0; i < n; i++) {
      const tx = Math.max(60, Math.min(N * T - 60, P.x + (i - (n - 1) / 2) * 85)), TT = 55 + i * 9, y0 = B.y - 60;
      orbs.push({ kind: 'food', emoji: foods[i % 4], x: B.x, y: y0, vx: (tx - B.x) / TT, vy: ((408 - y0) - 0.5 * g * TT * TT) / TT, g, r: 24, life: 300, rot: 0 });
    }
  }
  sfx.shoot();
}

function updateCam() {
  const target = Math.max(0, Math.min(N * T - W, P.x - 330 + P.vx * 10));
  camX += (target - camX) * 0.1;
}
function update() {
  frame++;
  const req = startReq; startReq = false;
  if (state === 'title') { if (req) { gesture(); newGame(); } return; }
  if (state === 'intro') { stageT++; updateCam(); if (stageT > 150 || (req && stageT > 30)) state = 'play'; return; }
  if (state === 'gameover') { stageT++; if (req && stageT > 40) { state = 'title'; playMusic(0); } return; }
  if (state === 'win') {
    stageT++; if (stageT % 4 === 0) spawnParts(Math.random() * W + camX, 0, 3, ['#ffd23f', '#ff4d5a', '#fff'][stageT % 3], 2, 5);
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; }
    for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
    if (req && stageT > 60) { state = 'title'; playMusic(0); } return;
  }
  if (state === 'clear') {
    stageT++; if (req && stageT > 60) startStage(si + 1); return;
  }
  timeF++; if (toast.t > 0) toast.t--;
  updatePlayer(); updateEnemies(); updateBoss();
  updateCam();
  for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--; }
  for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life <= 0) parts.splice(i, 1);
  for (const g of ghosts) g.life--;
  for (let i = ghosts.length - 1; i >= 0; i--) if (ghosts[i].life <= 0) ghosts.splice(i, 1);
}

/* ---------- Draw ---------- */
function sprite(img, cx, bottom, h, flip = false, alpha = 1) {
  const w = img.width * h / img.height;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(Math.round(cx), Math.round(bottom));
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h); ctx.restore();
}
function curFrame() {
  if (P.dead || P.hurt > 0) return S.hurt;
  if (P.spin) return S.spin;
  if (!P.grounded) return S.fall;
  if (Math.abs(P.vx) < 0.4) return S.idle;
  return S.run[Math.floor(P.anim) % 4];
}
const frameHeight = img => img.height * (66 / S.idle.height);
function drawBackground() {
  const bg = S.bgs[st.bg], sc = H / bg.height, bw = bg.width * sc, ch = st.crop * sc;
  const off = -((camX * 0.25) % (bw * 2));
  for (let i = -1; i < 4; i++) {
    const x = off + i * bw;
    ctx.save();
    if (i % 2 !== 0) { ctx.translate(x + bw, 0); ctx.scale(-1, 1); } else ctx.translate(x, 0);
    ctx.drawImage(bg, 0, 0, bg.width, st.crop, 0, 0, bw, ch);
    ctx.restore();
  }
  if (st.boss) { ctx.fillStyle = 'rgba(120,0,20,.28)'; ctx.fillRect(0, 0, W, ch); }
  const g = ctx.createLinearGradient(0, ch - 2, 0, H);
  g.addColorStop(0, st.fill[0]); g.addColorStop(1, st.fill[1]);
  ctx.fillStyle = g; ctx.fillRect(0, ch - 2, W, H);
}
function drawGround() {
  ctx.save(); ctx.beginPath();
  const x0 = Math.floor(camX / 8) * 8 - 8, x1 = camX + W + 16;
  let open = false, lastX = 0;
  for (let x = x0; x <= x1; x += 8) {
    const gy = groundAt(x);
    if (gy === null) { if (open) { ctx.lineTo(lastX, H + 10); ctx.closePath(); open = false; } continue; }
    if (!open) { ctx.moveTo(x - camX, H + 10); ctx.lineTo(x - camX, gy); open = true; }
    else ctx.lineTo(x - camX, gy);
    lastX = x - camX;
  }
  if (open) { ctx.lineTo(lastX, H + 10); ctx.closePath(); }
  ctx.fillStyle = st.dirt; ctx.fill(); ctx.clip();
  ctx.fillStyle = st.chk;
  const cs = 32, cx0 = Math.floor(camX / cs) * cs;
  for (let x = cx0; x < camX + W + cs; x += cs) for (let y = 0; y < H; y += cs) {
    if (((x / cs) + (y / cs)) % 2 === 0) ctx.fillRect(x - camX, y, cs, cs);
  }
  ctx.restore();
  ctx.save(); ctx.lineWidth = 12; ctx.strokeStyle = st.top; ctx.lineJoin = 'round'; ctx.beginPath();
  open = false;
  for (let x = x0; x <= x1; x += 8) {
    const gy = groundAt(x);
    if (gy === null) { open = false; continue; }
    if (!open) { ctx.moveTo(x - camX, gy + 4); open = true; } else ctx.lineTo(x - camX, gy + 4);
  }
  ctx.stroke();
  ctx.lineWidth = 4; ctx.strokeStyle = st.topHi; ctx.translate(0, -4); ctx.stroke(); ctx.restore();
}
function drawWorld() {
  for (const p of plats) {
    const x = p.x - camX; if (x < -200 || x > W + 50) continue;
    ctx.fillStyle = st.dirt; ctx.fillRect(x, p.y, p.w, 22);
    ctx.fillStyle = st.chk; for (let i = 0; i < p.w; i += 32) if ((i / 32) % 2 === 0) ctx.fillRect(x + i, p.y + 8, 32, 14);
    ctx.fillStyle = st.top; ctx.fillRect(x - 2, p.y - 4, p.w + 4, 10);
    ctx.fillStyle = st.topHi; ctx.fillRect(x - 2, p.y - 4, p.w + 4, 3);
  }
  for (const s of springs) {
    const x = s.x - camX; if (x < -50 || x > W + 50) continue;
    sprite(S.spring, x, s.y + 2, s.cool > 12 ? 24 : 36);
  }
  for (const c of checkpoints) { const x = c.x - camX; if (x > -60 && x < W + 60) sprite(S.flag, x, c.y + 2, 64, false, c.on ? 1 : 0.65); }
  if (isFinite(finishX)) { const x = finishX - camX; if (x > -80 && x < W + 80) sprite(S.finish, x, groundAt(finishX) + 2, 96); }
  for (const r of rings) {
    if (r.got) continue; const x = r.x - camX; if (x < -30 || x > W + 30) continue;
    const sw = Math.abs(Math.cos(frame * 0.07 + r.x * 0.01)) * 0.7 + 0.3;
    const h = 28, w = S.ring.width * h / S.ring.height * sw;
    ctx.drawImage(S.ring, x - w / 2, r.y - h / 2 + Math.sin(frame * 0.1 + r.x) * 2, w, h);
  }
  for (const e of enemies) {
    if (!e.alive) continue; const x = e.x - camX; if (x < -60 || x > W + 60) continue;
    if (e.type === 'g') sprite(S.robot, x, e.y + 2, 42, e.dir < 0);
    else sprite(S.flyer, x, e.y + 18, 40, Math.cos(e.t * 0.7) < 0);
  }
  if (boss) {
    const B = boss, img = (B.hp <= 3 || B.mode === 'dead') ? S.bossHurt : S.boss;
    if (!(B.inv > 0 && frame % 6 < 3)) {
      const shake = B.mode === 'tele' ? (Math.random() - 0.5) * 6 : 0;
      sprite(img, B.x - camX + shake, B.y, 135, P.x > B.x);
    }
    if (B.mode === 'tele' && frame % 6 < 3) { ctx.fillStyle = '#ff3b3b'; ctx.font = "28px 'Press Start 2P', monospace"; ctx.textAlign = 'center'; ctx.fillText('!', B.x - camX, B.y - 140); }
    for (const o of orbs) {
      if (!o.kind) { sprite(S.orb, o.x - camX, o.y + 12, 24); continue; }
      ctx.save(); ctx.translate(o.x - camX, o.y); ctx.rotate(o.kind === 'ban' ? 0 : (o.rot || 0) + frame * 0.06);
      ctx.font = '32px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.emoji, 0, 0); ctx.restore();
    }
  }
  for (const pk of pickups) {
    if (pk.got) continue; const x = pk.x - camX; if (x < -40 || x > W + 40) continue;
    const by = pk.y + Math.sin(frame * 0.08 + pk.x) * 5;
    ctx.save(); ctx.globalAlpha = 0.35 + 0.15 * Math.sin(frame * 0.15); ctx.fillStyle = PW[pk.type].color;
    ctx.beginPath(); ctx.arc(x, by, 28, 0, 6.3); ctx.fill(); ctx.restore();
    sprite(S.pw[pk.type], x, by + 19, 38);
  }
  for (const g of ghosts) sprite(g.img, g.x - camX, g.y, frameHeight(g.img), g.face < 0, g.life / 14 * 0.45);
  if (!P.dead) {
    const ax = P.x - camX, ay = P.y - 30;
    if (pw.shield > 0 && (pw.shield > 120 || frame % 8 < 4)) {
      ctx.save(); ctx.fillStyle = 'rgba(76,201,255,.25)'; ctx.strokeStyle = '#8fe0ff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ax, ay, 44, 0, 6.3); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    if (pw.star > 0 && (pw.star > 90 || frame % 6 < 3)) {
      ctx.save(); ctx.fillStyle = `hsla(${(frame * 12) % 360},100%,60%,.35)`;
      ctx.beginPath(); ctx.arc(ax, ay, 46, 0, 6.3); ctx.fill(); ctx.restore();
    }
    if (pw.magnet > 0) {
      ctx.save(); ctx.strokeStyle = 'rgba(180,107,255,.5)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -frame;
      ctx.beginPath(); ctx.arc(ax, ay, 90 + Math.sin(frame * 0.2) * 6, 0, 6.3); ctx.stroke(); ctx.restore();
    }
    if (pw.djump > 0 && !P.grounded && !P.dj && frame % 4 === 0) spawnParts(P.x, P.y - 10, 1, '#c8ffd0', 1.5, 3);
  }
  if (!(P.inv > 0 && frame % 6 < 3 && !P.dead)) {
    const img = curFrame(), h = frameHeight(img);
    if (P.spin) {
      ctx.save(); ctx.translate(P.x - camX, P.y - h / 2); ctx.rotate(frame * 0.5 * P.face);
      const w = img.width * h / img.height; ctx.drawImage(img, -w / 2, -h / 2, w, h); ctx.restore();
    } else sprite(img, P.x - camX, P.y, h, P.face < 0);
  }
  for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / 30); ctx.fillStyle = p.color; ctx.fillRect(p.x - camX, p.y, p.size, p.size); }
  ctx.globalAlpha = 1;
  if (P.turboOn && !P.dead) {
    ctx.save(); ctx.strokeStyle = '#fff36b'; ctx.lineWidth = 3; ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 10;
    for (let n = 0; n < 2; n++) {
      ctx.beginPath(); let x = P.x - camX - P.face * 14, y = P.y - 56 + Math.random() * 56; ctx.moveTo(x, y);
      for (let i = 0; i < 4; i++) { x -= P.face * (8 + Math.random() * 10); y += (Math.random() - 0.5) * 22; ctx.lineTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
}
function text(t, x, y, size = 16, color = '#fff', align = 'left') {
  ctx.font = `${size}px 'Press Start 2P', monospace`; ctx.textAlign = align;
  ctx.fillStyle = '#000'; ctx.fillText(t, x + 2, y + 2); ctx.fillStyle = color; ctx.fillText(t, x, y);
}
function hud() {
  ctx.drawImage(S.ring, 18, 16, 26, 28); text('x ' + ringCount, 52, 38, 16, '#ffe55c');
  text('SKOR ' + String(score).padStart(6, '0'), 18, 72, 12);
  let hx = 18;
  PW.forEach((d, i) => {
    const v = pw[d.key]; if (v <= 0) return;
    if (v < 120 && frame % 10 < 5) { hx += 62; return; }
    ctx.drawImage(S.pw[i], hx, 84, 30, 30);
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(hx - 1, 117, 32, 6);
    ctx.fillStyle = d.color; ctx.fillRect(hx, 118, 30 * v / d.dur, 4);
    hx += 62;
  });
  if (toast.t > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, toast.t / 25); text(toast.text, W / 2, 130, 18, toast.color, 'center'); ctx.restore(); }
  text('NYAWA x' + lives, W - 70, 38, 14, '#ff6b6b', 'right');
  const s = Math.floor(timeF / 60); text('WAKTU ' + Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), W - 70, 66, 12, '#fff', 'right');
  if (boss) {
    const bw = 300, x = W / 2 - bw / 2;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, 16, bw, 16);
    ctx.fillStyle = '#ff3b3b'; ctx.fillRect(x, 16, bw * Math.max(0, boss.hp) / boss.max, 16);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, 16, bw, 16);
    text('YANTO', W / 2, 54, 11, '#fff', 'center');
    if (boss.shoutT > 0) {
      ctx.save(); const s = 1 + Math.sin(frame * 0.5) * 0.03;
      ctx.translate(W / 2 + (Math.random() - 0.5) * 3, 108); ctx.scale(s, s); ctx.globalAlpha = Math.min(1, boss.shoutT / 20);
      ctx.font = "22px 'Press Start 2P', monospace"; ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.lineWidth = 8; ctx.strokeStyle = '#3a0d1a';
      ctx.strokeText(boss.shout, 0, 0); ctx.fillStyle = '#ffe55c'; ctx.fillText(boss.shout, 0, 0); ctx.restore();
    }
  } else {
    const prog = Math.min(1, P.x / finishX);
    ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(W / 2 - 120, 14, 240, 10);
    ctx.fillStyle = '#ffd23f'; ctx.fillRect(W / 2 - 120, 14, 240 * prog, 10);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(W / 2 - 120, 14, 240, 10);
  }
}
function overlay(a = 0.55) { ctx.fillStyle = `rgba(5,8,30,${a})`; ctx.fillRect(0, 0, W, H); }
function glowText(t, y, size, color) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 22; text(t, W / 2, y, size, color, 'center'); ctx.restore(); }
function draw() {
  if (state === 'title') {
    if (si !== 0 || !hArr.length) buildLevel(0);
    const pulse = Math.sin(frame * 0.08), zoom = 1.03 + Math.sin(frame * 0.01) * 0.02;
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.drawImage(S.title, -W / 2, -H / 2, W, H); ctx.restore();
    const tg = ctx.createLinearGradient(0, 0, 0, 240); tg.addColorStop(0, 'rgba(20,10,50,.55)'); tg.addColorStop(1, 'rgba(20,10,50,0)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 240);
    const bg = ctx.createLinearGradient(0, H - 130, 0, H); bg.addColorStop(0, 'rgba(10,5,30,0)'); bg.addColorStop(1, 'rgba(10,5,30,.7)');
    ctx.fillStyle = bg; ctx.fillRect(0, H - 130, W, 130);
    for (let i = 0; i < 24; i++) {
      const sx = (i * 197 + frame * (0.3 + (i % 5) * 0.12)) % W, sy = (i * 71 + Math.sin(frame * 0.03 + i) * 12) % (H - 120) + 20;
      ctx.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(frame * 0.07 + i)); ctx.fillStyle = i % 3 ? '#ffe55c' : '#fff'; ctx.fillRect(sx, sy, 3, 3);
    }
    ctx.globalAlpha = 1;
    const fl = (frame % 220); if (fl < 8) { ctx.fillStyle = `rgba(255,255,220,${0.35 * (1 - fl / 8)})`; ctx.fillRect(0, 0, W, H); }
    const y1 = 92 + Math.sin(frame * 0.05) * 3, y2 = 158 + Math.sin(frame * 0.05 + 1) * 3;
    ctx.save(); ctx.lineJoin = 'round'; ctx.textAlign = 'center'; ctx.lineWidth = 12; ctx.strokeStyle = '#3a0d1a';
    ctx.font = "60px 'Press Start 2P', monospace"; ctx.strokeText('FALISHA', W / 2, y1);
    ctx.font = "46px 'Press Start 2P', monospace"; ctx.strokeText('VS YANTO', W / 2, y2); ctx.restore();
    glowText('FALISHA', y1, 60, '#ffd23f'); glowText('VS YANTO', y2, 46, '#ff4d5a');
    text(COARSE ? 'SENTUH LAYAR UNTUK MULAI' : 'TEKAN SPASI UNTUK MULAI', W / 2, 480, 16, pulse > 0 ? '#fff' : '#ffd23f', 'center');
    text('3 Stage + Bos Yanto', W / 2, 515, 11, '#cfd6ff', 'center');
    return;
  }
  drawBackground(); drawGround(); drawWorld(); hud();
  if (state === 'intro') {
    overlay(0.45);
    text(st.boss ? 'BOS TERAKHIR' : 'STAGE ' + (si + 1), W / 2, 230, 22, '#ffd23f', 'center');
    glowText(st.name, 290, 32, st.boss ? '#ff4d5a' : '#fff');
    text(st.boss ? 'Lompat & serang Yanto!' : 'Capai bendera finish!', W / 2, 350, 12, '#cfd6ff', 'center');
  }
  if (state === 'clear') {
    overlay(0.5); glowText('STAGE ' + (si + 1) + ' SELESAI!', 200, 30, '#ffd23f');
    text(st.name, W / 2, 245, 16, '#fff', 'center');
    text('Cincin ' + ringCount + '   Bonus waktu +' + bonus, W / 2, 310, 14, '#fff', 'center');
    text('Skor ' + score, W / 2, 350, 16, '#ffe55c', 'center');
    sprite(S.idle, W / 2, 470 + Math.abs(Math.sin(stageT * 0.15)) * -25, 100);
    if (stageT > 60) text(COARSE ? 'Sentuh untuk lanjut' : 'Tekan Spasi untuk lanjut', W / 2, 500, 11, '#ffd23f', 'center');
  }
  if (state === 'gameover') {
    overlay(); text('GAME OVER', W / 2, 240, 44, '#ff4d5a', 'center');
    text('Skor ' + score, W / 2, 300, 18, '#fff', 'center');
    if (stageT > 40) text(COARSE ? 'Sentuh untuk menu' : 'Tekan Spasi untuk menu', W / 2, 360, 12, '#ffd23f', 'center');
  }
  if (state === 'win') {
    overlay(0.5); glowText('HEBAT FALISHA!', 180, 38, '#ffd23f');
    text('Yanto sudah dikalahkan ⚡', W / 2, 235, 14, '#fff', 'center');
    text('Kamu secepat kilat!', W / 2, 270, 14, '#fff', 'center');
    text('Cincin ' + ringCount + '   Skor ' + score, W / 2, 325, 16, '#ffe55c', 'center');
    sprite(S.idle, W / 2, 450 + Math.abs(Math.sin(stageT * 0.15)) * -30, 110);
    for (const p of parts) { ctx.globalAlpha = Math.max(0, p.life / 30); ctx.fillStyle = p.color; ctx.fillRect(p.x - camX, p.y, p.size, p.size); }
    ctx.globalAlpha = 1;
    if (stageT > 60) text(COARSE ? 'Sentuh untuk main lagi' : 'Tekan Spasi untuk main lagi', W / 2, 500, 11, '#ffd23f', 'center');
  }
}

/* ---------- Loop ---------- */
let last = 0, acc = 0;
function loop(t) {
  acc += Math.min(100, t - last); last = t;
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw(); requestAnimationFrame(loop);
}
buildLevel(0); resetPlayer(100, 400);
loadAssets().then(() => requestAnimationFrame(loop)).catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff">Gagal memuat aset. Jalankan lewat server lokal.</p>'); });
})();
