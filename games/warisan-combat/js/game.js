/* WARISAN COMBAT – Game Fighting Keluarga (Arcade vs CPU)
   Karakter Lengkap: Falisha, Arshad, Babah Nono, Ibu Pupu, Baymax */
(() => {
'use strict';
const W = 960, H = 540, FLOOR = 452;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const COARSE = matchMedia('(pointer: coarse)').matches;
const rand = Math.random, sgn = v => (v > 0) - (v < 0);

/* ---------- Musik ---------- */
const _ = null;
const TRACKS = [
  { bpm: 128, wave: 'square', bass: [45, 41], lead: [69,_,72,_,76,_,74,72, 69,_,72,_,79,_,76,74, 72,_,76,_,81,_,79,76, 74,_,72,_,69,_,_,_] },        // menu
  { bpm: 158, wave: 'square', bass: [48, 53], lead: [72,_,76,_,79,_,76,72, 74,_,77,_,81,_,77,74, 72,_,76,79,84,_,79,76, 77,_,74,76,72,_,_,_] },        // arena 1
  { bpm: 166, wave: 'square', bass: [45, 41], lead: [69,_,72,_,76,_,72,69, 67,_,71,_,74,_,71,67, 69,72,76,81,_,76,72,69, 65,_,69,72,76,_,_,_] },        // arena 2
  { bpm: 172, wave: 'sawtooth', bass: [40, 43], lead: [64,64,_,67,64,_,71,_, 70,70,_,67,64,_,63,_, 64,64,_,67,64,_,71,74, 75,_,74,71,70,_,67,_] }     // arena 3 / boss
];
const music = i => Chip.play(TRACKS, i);
const sfx = {
  hit: p => Chip.hit(p), block: () => Chip.beep(200, 0.06, 'square', 0.06),
  swing: () => Chip.beep(420, 0.07, 'triangle', 0.04, 300),
  dash: () => Chip.beep(150, 0.25, 'sawtooth', 0.05, 600),
  bolt: () => Chip.beep(900, 0.2, 'square', 0.05, -600),
  eat: () => { Chip.beep(300, 0.08, 'square', 0.06, 200); setTimeout(() => Chip.beep(450, 0.1, 'square', 0.06, 200), 90); },
  shout: () => { Chip.beep(280, 0.5, 'sawtooth', 0.1, -180); setTimeout(() => Chip.beep(210, 0.4, 'square', 0.08, -100), 140); },
  prayer: () => [587, 880, 1174].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.18, 'sine', 0.06), i * 90)),
  roar: () => { Chip.beep(160, 0.45, 'sawtooth', 0.12, -70); setTimeout(() => Chip.beep(130, 0.35, 'sawtooth', 0.1, -50), 120); },
  rocket: () => Chip.beep(240, 0.4, 'sawtooth', 0.08, 450),
  gift: () => { Chip.beep(659, 0.08, 'triangle', 0.05); setTimeout(() => Chip.beep(987, 0.12, 'triangle', 0.05), 80); },
  snore: () => Chip.beep(220, 0.22, 'sine', 0.05, -30),
  ko: () => { Chip.beep(120, 0.6, 'sawtooth', 0.12, -80); },
  fight: () => { Chip.beep(660, 0.12, 'square', 0.08); setTimeout(() => Chip.beep(990, 0.25, 'square', 0.08), 120); },
  win: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.25, 'square', 0.06), i * 140)),
  select: () => Chip.beep(700, 0.07, 'square', 0.05)
};
function setMuted(m) { Chip.setMuted(m); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }
setMuted(Chip.isMuted());

/* ---------- Sprite ---------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
function cutSprite(img, x, y, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gr = p[i + 1], b = p[i + 2];
    if (r > 140 && b > 120 && gr < Math.min(r, b) - 50) p[i + 3] = 0;
    else { const px = (i / 4) % w, py = (i / 4 / w) | 0; if (px < minX) minX = px; if (px > maxX) maxX = px; if (py < minY) minY = py; if (py > maxY) maxY = py; }
  }
  g.putImageData(d, 0, 0);
  const tw = Math.max(1, maxX - minX + 1), th = Math.max(1, maxY - minY + 1);
  const out = document.createElement('canvas'); out.width = tw; out.height = th;
  out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return { c: out, w: tw, h: th };
}
const S = { chars: {}, bg: {} };
async function loadAssets() {
  const [fa, ar, ba, pu, bm, gr, ci, la, cov] = await Promise.all([
    'falisha', 'arshad', 'babah', 'pupu', 'baymax', 'green_hills', 'city', 'lab', 'cover'
  ].map(n => loadImg(`assets/${n}.jpg`)));
  const sheet = img => {
    const f = [];
    for (let r = 0; r < 3; r++)
      for (let c = 0; c < 4; c++)
        f.push(cutSprite(img, c * 344 + 6, r * 256 + 6, 332, 244));
    return f;
  };
  [['falisha', fa], ['arshad', ar], ['babah', ba], ['pupu', pu], ['baymax', bm]].forEach(([id, img]) => {
    const f = sheet(img);
    S.chars[id] = { f, sc: 175 / f[0].h };
  });
  S.bg = { green: [gr, 470], city: [ci, 495], lab: [la, 515] };
  S.cover = cov;
}

/* ---------- Input ---------- */
const ACT = ['jump', 'light', 'heavy', 's1', 's2', 'ult'];
const KEYMAP = { ArrowUp: 'jump', w: 'jump', ' ': 'jump', j: 'light', k: 'heavy', u: 's1', i: 's2', o: 'ult' };
const keys = {}, touch = { left: false, right: false }, buf = { jump: 0, light: 0, heavy: 0, s1: 0, s2: 0, ult: 0 };
let confirmReq = false, tapPos = null, navDir = 0;
function gesture() { Chip.ensure(); if (!gesture.done) { gesture.done = true; music(0); } }
addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(e.key)) e.preventDefault();
  if (!keys[e.key]) {
    const a = KEYMAP[e.key]; if (a) buf[a] = 8;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'j') confirmReq = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') navDir = -1; if (e.key === 'ArrowRight' || e.key === 'd') navDir = 1;
    gesture();
  }
  if (e.key === 'm' || e.key === 'M') setMuted(!Chip.isMuted());
  keys[e.key] = true;
});
addEventListener('keyup', e => { keys[e.key] = false; });
function goFull() { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }).then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); }
cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect(); tapPos = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  confirmReq = true; gesture(); if (COARSE) goFull();
});
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
const btns = { 'btn-jump': 'jump', 'btn-light': 'light', 'btn-heavy': 'heavy', 'btn-s1': 's1', 'btn-s2': 's2', 'btn-ult': 'ult' };
Object.entries(btns).forEach(([id, a]) => {
  const b = document.getElementById(id);
  b.addEventListener('pointerdown', e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); buf[a] = 8; b.classList.add('on'); gesture(); });
  const off = e => { e.preventDefault(); b.classList.remove('on'); };
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off);
});
(() => {
  const d = document.getElementById('dpad'), [l, r] = d.querySelectorAll('span');
  const set = (L, R) => { touch.left = L; touch.right = R; l.classList.toggle('on', L); r.classList.toggle('on', R); };
  const upd = e => { const b = d.getBoundingClientRect(), x = (e.clientX - b.left) / b.width; set(x < 0.5, x >= 0.5); };
  d.addEventListener('pointerdown', e => { e.preventDefault(); d.setPointerCapture(e.pointerId); gesture(); upd(e); navDir = touch.left ? -1 : 1; });
  d.addEventListener('pointermove', e => { if (e.buttons || e.pressure > 0) upd(e); });
  const off = () => set(false, false);
  d.addEventListener('pointerup', off); d.addEventListener('pointercancel', off); d.addEventListener('lostpointercapture', off);
})();
document.getElementById('btn-mute').addEventListener('click', e => { e.stopPropagation(); gesture(); setMuted(!Chip.isMuted()); });
document.getElementById('btn-full').addEventListener('click', e => { e.stopPropagation(); document.fullscreenElement ? document.exitFullscreen() : goFull(); });
const humanInput = () => {
  const dir = ((keys.ArrowRight || keys.d || touch.right) ? 1 : 0) - ((keys.ArrowLeft || keys.a || touch.left) ? 1 : 0);
  const i = { dir }; ACT.forEach(a => { i[a] = buf[a] > 0 ? 1 : 0; }); return i;
};
const consumeBuf = () => ACT.forEach(a => { if (buf[a] > 0) buf[a]--; });

/* ---------- Data karakter & jurus ---------- */
const CHARS = {
  falisha: { id: 'falisha', name: 'FALISHA', hp: 100, speed: 4.6, jump: 13.2, tag: 'Kilat & Kecepatan', moves: ['Kilat Dash', 'Petir Panah', 'Piano Sambil Nangis'], ultName: 'PIANO SAMBIL NANGIS !', ultColor: '#ffd23f' },
  arshad: { id: 'arshad', name: 'ARSHAD', hp: 115, speed: 4.0, jump: 12.2, tag: 'Lari & Makan Banyak', moves: ['Lari Tabrak', 'Makan Banyak', 'TERIAK !'], ultName: 'TERIAAAAK !!!', ultColor: '#ff6b6b' },
  babah: { id: 'babah', name: 'BABAH NONO', hp: 110, speed: 3.8, jump: 12.5, tag: 'Jahit & Doa Ampuh', moves: ['Jahit Baju', 'Doa Cahaya', 'Doa Ampuh'], ultName: 'DOA AMPUH !', ultColor: '#68d391' },
  pupu: { id: 'pupu', name: 'IBU PUPU', hp: 105, speed: 4.3, jump: 13.0, tag: 'Kumon & Singa Marah', moves: ['Suruh Makan', 'Kerjain Kumon', 'Singa Marah'], ultName: 'SINGA MARAH !', ultColor: '#f6ad55' },
  baymax: { id: 'baymax', name: 'BAYMAX', hp: 125, speed: 3.5, jump: 11.8, tag: 'Hadiah & Robot Hebat', moves: ['Kasih Hadiah', 'Tidur Pulas', 'Robot Baymax'], ultName: 'ROBOT BAYMAX !', ultColor: '#fc8181' }
};

const MV = {
  light: { su: 4, act: 4, rec: 9, dmg: 5, kb: 3.5, w: 66, h: 56, ox: 16, oy: -118, frame: 5, stun: 13, gain: 7, sfx: 'swing' },
  heavy: { su: 10, act: 5, rec: 17, dmg: 10, kb: 7, w: 96, h: 66, ox: 14, oy: -110, frame: 6, stun: 22, gain: 11, launch: 1, sfx: 'swing' },
  // Falisha
  falisha_s1: { su: 6, act: 16, rec: 14, dmg: 11, kb: 7, w: 72, h: 110, ox: 0, oy: -130, frame: 7, stun: 20, gain: 10, vx: 13, cd: 100, ghost: 1, sfx: 'dash' },
  falisha_s2: { su: 9, act: 0, rec: 20, frame: 8, cd: 55, spawn: 'bolt' },
  // Arshad
  arshad_s1: { su: 8, act: 24, rec: 20, dmg: 14, kb: 9, w: 72, h: 110, ox: 0, oy: -130, frame: 7, stun: 24, gain: 10, vx: 10.5, cd: 130, dust: 1, sfx: 'dash' },
  arshad_s2: { su: 0, act: 0, rec: 72, frame: 8, cd: 380, eat: 1 },
  // Babah Nono
  babah_s1: { su: 6, act: 16, rec: 14, dmg: 12, kb: 2, w: 90, h: 60, ox: 18, oy: -115, frame: 7, stun: 22, gain: 9, needle: 1, sfx: 'swing' },
  babah_s2: { su: 10, act: 0, rec: 24, frame: 8, cd: 75, spawn: 'prayer' },
  // Ibu Pupu
  pupu_s1: { su: 7, act: 0, rec: 18, frame: 7, cd: 50, spawn: 'spoon' },
  pupu_s2: { su: 8, act: 0, rec: 22, frame: 8, cd: 80, spawn: 'kumon' },
  // Baymax
  baymax_s1: { su: 8, act: 0, rec: 22, frame: 7, cd: 65, spawn: 'gift' },
  baymax_s2: { su: 0, act: 0, rec: 70, frame: 8, cd: 360, sleep: 1 }
};
const ATK_FRAMES = [5, 6, 7, 8];

const ARCADE = [
  { arena: 'green', name: 'Taman Hijau', p: { react: 36, aggro: 0.28, block: 0.16, special: 0.22, dmg: 0.75 }, music: 1 },
  { arena: 'city', name: 'Kota Kilat', p: { react: 28, aggro: 0.36, block: 0.26, special: 0.30, dmg: 0.88 }, music: 2 },
  { arena: 'lab', name: 'Lab Petir', p: { react: 22, aggro: 0.44, block: 0.36, special: 0.38, dmg: 0.98 }, music: 3 },
  { arena: 'city', name: 'Puncak Warisan', tint: 'hue-rotate(280deg) saturate(1.8)', p: { react: 16, aggro: 0.54, block: 0.42, special: 0.46, dmg: 1.1 }, music: 3 }
];
const CHAR_LIST = ['falisha', 'arshad', 'babah', 'pupu', 'baymax'];
function getStageOpponent(stageIdx, playerChar) {
  const pool = CHAR_LIST.filter(c => c !== playerChar);
  if (stageIdx < pool.length) return pool[stageIdx];
  return playerChar;
}

/* ---------- State ---------- */
const G = { mode: 'menu', t: 0, sel: 0, match: 0, round: 1, timer: 60, tf: 0, hitstop: 0, shake: 0, cut: 0, cutF: null, wins: [0, 0], winner: -1, frame: 0 };
let p1, p2, projs = [], fx = [], arena = ARCADE[0], myChar = 'falisha';

function mkFighter(id, side, ai, tint, dmgMul) {
  const c = CHARS[id];
  return { id, c, side, x: side === 0 ? 300 : 660, z: 0, vx: 0, vz: 0, face: side === 0 ? 1 : -1, hp: c.hp, maxHp: c.hp, meter: 0, state: 'idle', t: 0, move: null, hitDone: false,
    stun: 0, blocking: false, invuln: 0, cd: { s1: 0, s2: 0 }, buff: 0, flash: 0, dizzy: 0, ghosts: [], ai: ai ? { p: ai, t: 20, dir: 0, blockT: 0 } : null, tint, dmgMul: dmgMul || 1, anim: 0 };
}
function startMatch(i) {
  G.match = i; arena = ARCADE[i];
  const oppId = getStageOpponent(i, myChar);
  if (i === 0) { G.wins = [0, 0]; }
  p1 = mkFighter(myChar, 0, null, null, 1);
  p2 = mkFighter(oppId, 1, arena.p, arena.tint || null, arena.p.dmg);
  p2.name = (oppId === myChar) ? 'BAYANGAN ' + p2.c.name : p2.c.name;
  G.wins = [0, 0]; G.round = 1; G.mode = 'vs'; G.t = 0; music(arena.music);
}
function startRound() {
  [p1, p2].forEach((f, i) => { const m = f.meter, tint = f.tint, ai = f.ai, nm = f.name, dm = f.dmgMul; Object.assign(f, mkFighter(f.id, i, ai && ai.p, tint, dm)); f.meter = m; f.name = nm; });
  projs = []; fx = []; G.timer = 60; G.tf = 0; G.mode = 'intro'; G.t = 0; G.cut = 0; G.hitstop = 0; G.winner = -1;
}

/* ---------- Efek ---------- */
const addFx = o => fx.push(Object.assign({ life: 30, t: 0 }, o));
const spark = (x, y, color = '#fff', n = 10) => { for (let i = 0; i < n; i++) { const a = rand() * 6.28, s = 2 + rand() * 5; addFx({ type: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 14 + rand() * 12, color, size: 4 }); } };
const popText = (x, y, text, color = '#fff', size = 18) => addFx({ type: 'txt', x, y, text, color, size, life: 40 });

/* ---------- Pertarungan ---------- */
function hurtbox(f) { return { x0: f.x - 30, x1: f.x + 30, y0: FLOOR - f.z - 150, y1: FLOOR - f.z }; }
function overlap(a, b) { return a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0; }
function applyHit(att, def, m, dir) {
  if (def.invuln > 0 || def.state === 'ult' || def.state === 'ko') return false;
  let dmg = m.dmg * att.dmgMul * (att.buff > 0 ? 1.2 : 1);
  const blocked = def.blocking && def.z === 0;
  if (blocked) {
    dmg = Math.max(1, Math.round(dmg * 0.15)); def.vx = dir * (m.kb || 3) * 0.5; sfx.block(); popText(def.x, FLOOR - 170, 'TANGKIS!', '#8fe0ff', 14); spark(def.x - dir * 20, FLOOR - 100, '#8fe0ff', 6);
    def.hp = Math.max(0, def.hp - dmg); def.meter = Math.min(100, def.meter + 4);
  } else {
    dmg = Math.round(dmg); def.hp = Math.max(0, def.hp - dmg);
    if (m.stun) {
      def.state = 'hurt'; def.t = 0; def.move = null; def.stun = m.stun; def.vx = dir * (m.kb || 3);
      if (m.launch || m.kb >= 9) { def.vz = 6; }
      if (m.dizzy) def.dizzy = m.stun;
    } else def.flash = 6;
    sfx.hit(m.stun > 18 ? 1.3 : 0.8); spark(def.x - dir * 10, FLOOR - def.z - 100, m.sparkColor || '#ffe55c', m.stun ? 12 : 4);
    G.hitstop = m.stun ? (m.stun > 18 ? 7 : 4) : 0; G.shake = Math.max(G.shake, m.stun > 18 ? 8 : (m.stun ? 4 : 1));
    def.meter = Math.min(100, def.meter + dmg * 0.9);
    if (dmg >= 8) popText(def.x, FLOOR - 190, '-' + dmg, '#ff6b6b', 20);
  }
  att.meter = Math.min(100, att.meter + (m.gain || 2));
  return true;
}
function startMove(f, key) {
  const id = f.id + '_' + key, m = MV[id] || MV[key];
  if ((key === 's1' || key === 's2') && f.cd[key] > 0) return false;
  f.state = 'attack'; f.move = m; f.t = 0; f.hitDone = false; f.blocking = false;
  if (key === 's1' || key === 's2') f.cd[key] = m.cd;
  if (m.sfx) sfx[m.sfx]();
  return true;
}
function startUlt(f) {
  f.meter = 0; f.state = 'ult'; f.t = 0; f.move = null; f.blocking = false; f.vx = 0; f.invuln = 9999;
  G.cut = 55; G.cutF = f;
  if (f.id === 'falisha' || f.id === 'arshad') sfx.shout();
  else if (f.id === 'babah') sfx.prayer();
  else if (f.id === 'pupu') sfx.roar();
  else if (f.id === 'baymax') sfx.rocket();
}
function spawnProj(o) { projs.push(Object.assign({ life: 200, rot: 0 }, o)); }

function updateFighter(f, o, inp, canAct) {
  if (f.invuln > 0 && f.state !== 'ult') f.invuln--;
  if (f.cd.s1 > 0) f.cd.s1--; if (f.cd.s2 > 0) f.cd.s2--; if (f.buff > 0) f.buff--; if (f.flash > 0) f.flash--; if (f.dizzy > 0) f.dizzy--;
  f.anim++;
  const free = f.state === 'idle' || f.state === 'walk' || f.state === 'jump';
  if (f.state === 'ko') { f.vx *= 0.97; }
  else if (free) {
    if (canAct) f.face = sgn(o.x - f.x) || f.face;
    const sp = f.c.speed * (f.buff > 0 ? 1.25 : 1), dir = canAct ? inp.dir : 0;
    f.blocking = canAct && f.z === 0 && dir !== 0 && dir === -f.face;
    if (f.z === 0) { f.vx = f.blocking ? 0 : dir * sp; } else f.vx += (dir * sp - f.vx) * 0.08;
    f.state = f.z > 0 ? 'jump' : (Math.abs(f.vx) > 0.3 ? 'walk' : 'idle');
    if (canAct && f.z === 0) {
      if (inp.jump) { f.vz = f.c.jump; f.z = 0.1; f.state = 'jump'; }
      else if (inp.ult && f.meter >= 100) startUlt(f);
      else if (inp.s1) startMove(f, 's1');
      else if (inp.s2) startMove(f, 's2');
      else if (inp.heavy) startMove(f, 'heavy');
      else if (inp.light) startMove(f, 'light');
      if (!f.ai && (f.state === 'attack' || f.state === 'ult' || f.z > 0)) ACT.forEach(a => { buf[a] = 0; });
    }
  } else if (f.state === 'attack') {
    const m = f.move; f.t++;
    if (m.vx) {
      if (f.t >= m.su && f.t < m.su + m.act) {
        f.vx = m.vx * f.face;
        if (m.ghost && f.t % 2 === 0) f.ghosts.push({ x: f.x, z: f.z, face: f.face, fr: m.frame, life: 12 });
        if (m.dust && f.t % 3 === 0) addFx({ type: 'p', x: f.x - f.face * 20, y: FLOOR - 4, vx: -f.face * 2, vy: -1 - rand(), life: 18, color: '#d9c9a0', size: 6 });
      } else f.vx *= 0.8;
    } else f.vx *= 0.7;

    // Babah efek jarum emas
    if (m.needle && f.t % 4 === 0) {
      addFx({ type: 'p', x: f.x + f.face * (20 + rand() * 60), y: FLOOR - 110 + (rand() - 0.5) * 20, vx: f.face * 8, vy: 0, life: 10, color: '#ffd23f', size: 4 });
    }

    if (m.dmg && f.t >= m.su && f.t < m.su + m.act && !f.hitDone) {
      const hb = f.face > 0 ? { x0: f.x + m.ox, x1: f.x + m.ox + m.w } : { x0: f.x - m.ox - m.w, x1: f.x - m.ox };
      hb.y0 = FLOOR - f.z + m.oy; hb.y1 = hb.y0 + m.h;
      if (overlap(hb, hurtbox(o)) && applyHit(f, o, m, f.face)) { f.hitDone = true; if (m.vx) f.vx *= 0.3; }
    }
    // Proyektil jurus
    if (m.spawn === 'bolt' && f.t === m.su) {
      sfx.bolt(); spawnProj({ kind: 'bolt', x: f.x + f.face * 50, y: FLOOR - 105, vx: 11 * f.face, dmg: 9, kb: 5, stun: 16, gain: 6, w: 54, h: 34, owner: f, life: 120, sparkColor: '#fff36b' });
    }
    if (m.spawn === 'prayer' && f.t === m.su) {
      sfx.prayer(); spawnProj({ kind: 'prayer', emo: '✨', x: f.x + f.face * 50, y: FLOOR - 105, vx: 7.2 * f.face, dmg: 12, kb: 6, stun: 26, gain: 8, w: 48, h: 48, owner: f, life: 130, sparkColor: '#68d391' });
    }
    if (m.spawn === 'spoon' && f.t === m.su) {
      sfx.swing(); spawnProj({ kind: 'spoon', emo: '🥄', x: f.x + f.face * 50, y: FLOOR - 110, vx: 12 * f.face, dmg: 9, kb: 4, stun: 18, gain: 6, w: 42, h: 42, owner: f, life: 100, sparkColor: '#f6ad55' });
    }
    if (m.spawn === 'kumon' && f.t === m.su) {
      sfx.swing(); spawnProj({ kind: 'kumon', emo: '📝', x: f.x + f.face * 50, y: FLOOR - 105, vx: 8.5 * f.face, vySine: 1, dmg: 11, kb: 5, stun: 30, dizzy: 1, gain: 7, w: 46, h: 46, owner: f, life: 120, sparkColor: '#63b3ed' });
    }
    if (m.spawn === 'gift' && f.t === m.su) {
      sfx.gift(); spawnProj({ kind: 'gift', emo: '🎁', x: f.x + f.face * 50, y: FLOOR - 120, vx: 7.5 * f.face, vy: -5.5, grav: 0.28, dmg: 11, kb: 6, stun: 24, gain: 7, w: 44, h: 44, owner: f, life: 140, sparkColor: '#fc8181' });
    }
    // Arshad Makan Banyak
    if (m.eat) {
      if (f.t % 12 === 6) { sfx.eat(); addFx({ type: 'emo', e: ['🍔', '🍎', '🍌', '🍗'][(f.t / 12 | 0) % 4], x: f.x + f.face * 30, y: FLOOR - 120, vy: -1.2, life: 36, size: 30 }); }
      if (f.t === 36) { const h = Math.min(f.maxHp - f.hp, 16); f.hp += h; f.buff = 300; popText(f.x, FLOOR - 190, '+' + h + ' HP', '#7ed957', 20); spark(f.x, FLOOR - 100, '#7ed957', 14); }
    }
    // Baymax Tidur Pulas
    if (m.sleep) {
      if (f.t % 14 === 0) { sfx.snore(); addFx({ type: 'emo', e: '💤', x: f.x, y: FLOOR - 130, vy: -1.0, life: 36, size: 26 }); }
      if (f.t === 36) { const h = Math.min(f.maxHp - f.hp, 18); f.hp += h; f.buff = 260; popText(f.x, FLOOR - 190, '+' + h + ' HP', '#7ed957', 20); spark(f.x, FLOOR - 100, '#68d391', 14); }
    }
    if (f.t >= m.su + m.act + m.rec) { f.state = 'idle'; f.move = null; }
  } else if (f.state === 'hurt') {
    f.stun--; f.vx *= 0.88;
    if (f.stun <= 0 && f.z === 0) { f.state = 'idle'; f.dizzy = 0; }
  } else if (f.state === 'ult') {
    f.t++; f.vx = 0;
    // 1. Falisha Ultimate
    if (f.id === 'falisha') {
      if (f.t % 6 === 0 && f.t < 130) {
        const tx = Math.max(60, Math.min(W - 60, o.x + (rand() - 0.5) * 300));
        spawnProj({ kind: 'note', emo: ['🎵', '🎶', '🎵', '💧'][(rand() * 4) | 0], x: tx, y: -20, vx: 0, vy: 5 + rand() * 2, dmg: 3, kb: 2, stun: 0, gain: 1, w: 34, h: 34, owner: f, life: 160, rot: rand() * 6, sparkColor: '#ffe55c' });
        if (f.t % 12 === 0) addFx({ type: 'emo', e: '💧', x: f.x + f.face * 6, y: FLOOR - 140, vy: 1.4, life: 30, size: 22 });
      }
      if (f.t >= 140) { f.state = 'idle'; f.invuln = 20; }
    }
    // 2. Arshad Ultimate
    else if (f.id === 'arshad') {
      if (f.t === 10) {
        G.shake = 16; sfx.hit(2);
        for (let k = 0; k < 3; k++) addFx({ type: 'ring', x: f.x, y: FLOOR - 90, r: 10 + k * 20, vr: 11, life: 46 + k * 4, color: k % 2 ? '#fff' : '#ffb3b3' });
        if (!o.invuln && o.state !== 'ko') applyHit(f, o, { dmg: 28, kb: 12, stun: 75, dizzy: 1, gain: 0, launch: 1, sparkColor: '#ff8a8a' }, sgn(o.x - f.x) || 1);
      }
      if (f.t >= 70) { f.state = 'idle'; f.invuln = 20; }
    }
    // 3. Babah Nono Ultimate (Doa Ampuh)
    else if (f.id === 'babah') {
      if (f.t === 1) popText(f.x, FLOOR - 190, 'DOA MUSTAJAB!', '#68d391', 22);
      if (f.t >= 15 && f.t <= 105 && f.t % 18 === 0) {
        const tx = Math.max(60, Math.min(W - 60, o.x + (rand() - 0.5) * 60));
        addFx({ type: 'pillar', x: tx, y: FLOOR, w: 70, life: 24, color: '#e6fffa' });
        G.shake = 7; sfx.hit(1.2); spark(tx, FLOOR - 60, '#68d391', 10);
        if (!o.invuln && o.state !== 'ko') applyHit(f, o, { dmg: 6, kb: 2, stun: 16, gain: 0, sparkColor: '#68d391' }, f.face);
      }
      if (f.t >= 125) { f.state = 'idle'; f.invuln = 20; }
    }
    // 4. Ibu Pupu Ultimate (Singa Marah)
    else if (f.id === 'pupu') {
      if (f.t === 8) { sfx.roar(); popText(f.x, FLOOR - 190, 'AUMM! SINGA MARAH!', '#f6ad55', 24); G.shake = 10; }
      if (f.t >= 12 && f.t <= 46) {
        f.vx = 14 * f.face;
        if (f.t % 2 === 0) addFx({ type: 'p', x: f.x - f.face * 20, y: FLOOR - 80 + (rand() - 0.5) * 40, vx: -f.face * 4, vy: -1, life: 12, color: ['#f6ad55', '#fc8181', '#ffd23f'][(rand() * 3) | 0], size: 6 });
      }
      if (f.t === 16 || f.t === 28 || f.t === 40) {
        sfx.hit(1.4); G.shake = 8;
        addFx({ type: 'claw', x: f.x + f.face * 55, y: FLOOR - 90, face: f.face, life: 18 });
        if (!o.invuln && o.state !== 'ko') applyHit(f, o, { dmg: 10, kb: f.t === 40 ? 10 : 3, stun: 30, gain: 0, launch: f.t === 40 ? 1 : 0, sparkColor: '#f6ad55' }, f.face);
      }
      if (f.t >= 65) { f.state = 'idle'; f.invuln = 20; }
    }
    // 5. Baymax Ultimate (Robot Baymax)
    else if (f.id === 'baymax') {
      if (f.t === 8) { sfx.rocket(); popText(f.x, FLOOR - 190, 'ROBOT ACTIVATED!', '#fc8181', 24); G.shake = 8; }
      if (f.t >= 14 && f.t <= 48) {
        f.z = 24; f.vx = 16 * f.face;
        if (f.t % 2 === 0) {
          addFx({ type: 'p', x: f.x - f.face * 45, y: FLOOR - f.z - 60, vx: -f.face * 6 + (rand() - 0.5) * 2, vy: (rand() - 0.5) * 2, life: 14, color: ['#fc8181', '#f6ad55', '#fff'][(rand() * 3) | 0], size: 8 });
        }
        if (Math.abs(f.x - o.x) < 80 && !f.hitDone) {
          f.hitDone = true; G.shake = 18; sfx.hit(2);
          for (let k = 0; k < 25; k++) spark(o.x, FLOOR - 80, ['#fc8181', '#ffd23f', '#68d391', '#63b3ed'][(rand() * 4) | 0], 6);
          applyHit(f, o, { dmg: 30, kb: 13, stun: 80, launch: 1, gain: 0, sparkColor: '#fc8181' }, f.face);
        }
      }
      if (f.t >= 65) { f.state = 'idle'; f.invuln = 20; f.z = 0; }
    }
  } else if (f.state === 'win') f.vx = 0;

  // Fisika
  f.x += f.vx; f.x = Math.max(50, Math.min(W - 50, f.x));
  if (f.z > 0 || f.vz !== 0) { f.vz -= 0.65; f.z += f.vz; if (f.z <= 0) { f.z = 0; f.vz = 0; if (f.state === 'jump') f.state = 'idle'; } }
  for (const g of f.ghosts) g.life--; f.ghosts = f.ghosts.filter(g => g.life > 0);
}

/* ---------- AI ---------- */
function aiInput(f, o) {
  const a = f.ai, P = a.p, inp = { dir: a.dir, jump: 0, light: 0, heavy: 0, s1: 0, s2: 0, ult: 0 };
  if (a.blockT > 0) { a.blockT--; inp.dir = -f.face; return inp; }
  if (--a.t > 0) return inp;
  a.t = P.react + rand() * 18; a.dir = 0;
  const dist = Math.abs(o.x - f.x), toward = sgn(o.x - f.x) || 1, r = rand();
  if (o.state === 'attack' && dist < 170 && r < P.block) { a.blockT = 24; inp.dir = -f.face; return inp; }
  if (f.meter >= 100 && r < 0.65) { inp.ult = 1; return inp; }

  if (f.id === 'falisha') {
    if (dist > 230 && r < P.special && f.cd.s2 <= 0) { inp.s2 = 1; return inp; }
    if (dist > 150 && dist < 340 && rand() < P.special * 0.8 && f.cd.s1 <= 0) { inp.s1 = 1; return inp; }
  } else if (f.id === 'arshad') {
    if (f.hp < f.maxHp * 0.55 && f.cd.s2 <= 0 && dist > 200 && r < 0.6) { inp.s2 = 1; return inp; }
    if (dist > 180 && dist < 430 && r < P.special && f.cd.s1 <= 0) { inp.s1 = 1; return inp; }
  } else if (f.id === 'babah') {
    if (dist > 220 && r < P.special && f.cd.s2 <= 0) { inp.s2 = 1; return inp; }
    if (dist < 180 && r < P.special && f.cd.s1 <= 0) { inp.s1 = 1; return inp; }
  } else if (f.id === 'pupu') {
    if (dist > 240 && r < P.special && f.cd.s2 <= 0) { inp.s2 = 1; return inp; }
    if (dist > 160 && dist < 320 && r < P.special && f.cd.s1 <= 0) { inp.s1 = 1; return inp; }
  } else if (f.id === 'baymax') {
    if (f.hp < f.maxHp * 0.5 && f.cd.s2 <= 0 && dist > 210 && r < 0.6) { inp.s2 = 1; return inp; }
    if (dist > 180 && r < P.special && f.cd.s1 <= 0) { inp.s1 = 1; return inp; }
  }

  if (dist > 120) { a.dir = r < 0.15 ? 0 : toward; if (dist > 220 && r > 0.94) inp.jump = 1; }
  else if (r < P.aggro) { if (rand() < 0.65) inp.light = 1; else inp.heavy = 1; }
  else if (r < P.aggro + 0.12) a.dir = -toward;
  inp.dir = a.dir; return inp;
}

/* ---------- Update ---------- */
function stepWorld(inp1, canAct) {
  updateFighter(p1, p2, inp1, canAct);
  updateFighter(p2, p1, canAct ? aiInput(p2, p1) : { dir: 0 }, canAct);
  // Dorong agar tidak menumpuk
  if (p1.z === 0 && p2.z === 0 && p1.state !== 'attack' && p2.state !== 'attack' && p1.state !== 'ko' && p2.state !== 'ko') {
    const d = p2.x - p1.x, min = 46;
    if (Math.abs(d) < min) { const push = (min - Math.abs(d)) / 2 * (sgn(d) || 1); p1.x = Math.max(50, p1.x - push); p2.x = Math.min(W - 50, p2.x + push); }
  }
  for (const pr of projs) {
    pr.life--;
    pr.x += pr.vx;
    if (pr.grav) { pr.vy = (pr.vy || 0) + pr.grav; }
    if (pr.vySine) { pr.y += Math.sin(pr.life * 0.18) * 3; }
    else { pr.y += pr.vy || 0; }
    pr.rot += 0.12;

    const def = pr.owner === p1 ? p2 : p1;
    const hb = { x0: pr.x - pr.w / 2, x1: pr.x + pr.w / 2, y0: pr.y - pr.h / 2, y1: pr.y + pr.h / 2 };
    if (overlap(hb, hurtbox(def)) && applyHit(pr.owner, def, pr, sgn(pr.vx) || pr.owner.face)) {
      pr.life = 0;
      if (pr.kind === 'note') spark(pr.x, pr.y, '#ffe55c', 4);
      if (pr.kind === 'prayer') { spark(pr.x, pr.y, '#68d391', 12); popText(def.x, FLOOR - 180, 'BARAKAH!', '#68d391', 18); }
      if (pr.kind === 'spoon') { spark(pr.x, pr.y, '#f6ad55', 8); popText(def.x, FLOOR - 180, 'MAKAN!', '#f6ad55', 18); }
      if (pr.kind === 'kumon') { spark(pr.x, pr.y, '#63b3ed', 10); popText(def.x, FLOOR - 180, 'KUMON!', '#63b3ed', 18); }
      if (pr.kind === 'gift') {
        for (let k = 0; k < 14; k++) spark(pr.x, pr.y, ['#fc8181', '#ffd23f', '#68d391', '#63b3ed'][(rand() * 4) | 0], 5);
        popText(def.x, FLOOR - 180, 'KADO!', '#fc8181', 18);
      }
    }
    if (pr.y > FLOOR - 10) {
      if (pr.kind === 'gift') { for (let k = 0; k < 8; k++) spark(pr.x, FLOOR - 15, '#ffd23f', 3); }
      if (pr.kind === 'note' || pr.kind === 'gift') pr.life = 0;
    }
    if (pr.x < -60 || pr.x > W + 60) pr.life = 0;
  }
  projs = projs.filter(p => p.life > 0);
}

function updateFx() {
  for (const e of fx) {
    e.t++; e.life--;
    if (e.type === 'p') { e.x += e.vx; e.y += e.vy; e.vy += 0.18; }
    else if (e.type === 'txt') e.y -= 0.8;
    else if (e.type === 'emo') { e.y += e.vy; }
    else if (e.type === 'ring') { e.r += e.vr; }
  }
  fx = fx.filter(e => e.life > 0);
}

function endRound(w, timeup) {
  G.winner = w; G.wins[w]++; G.mode = 'koend'; G.t = 0; sfx.ko();
  const win = w === 0 ? p1 : p2; if (win.state !== 'ko') { win.state = 'win'; win.invuln = 9999; }
  G.koText = timeup ? 'WAKTU HABIS!' : 'K.O.!';
}

function update() {
  G.frame++; consumeBuf();
  const req = confirmReq, tap = tapPos, nav = navDir; confirmReq = false; tapPos = null; navDir = 0;
  G.t++;
  if (G.shake > 0) G.shake *= 0.85; if (G.shake < 0.3) G.shake = 0;
  switch (G.mode) {
    case 'menu': if (req && G.t > 20) { G.mode = 'select'; G.t = 0; sfx.select(); } break;
    case 'select': updateSelect(req, tap, nav); break;
    case 'vs': if (G.t > 150 || (req && G.t > 40)) startRound(); break;
    case 'intro': {
      updateFx();
      if (G.t === 78) sfx.fight();
      if (G.t > 108) { G.mode = 'fight'; G.t = 0; }
      break;
    }
    case 'fight': {
      if (G.hitstop > 0) { G.hitstop--; updateFx(); break; }
      if (G.cut > 0) { G.cut--; updateFx(); break; }
      stepWorld(humanInput(), true);
      updateFx();
      if (++G.tf >= 60) { G.tf = 0; G.timer--; }
      if (p1.hp <= 0 || p2.hp <= 0) {
        const w = p1.hp <= 0 && p2.hp <= 0 ? 0 : (p1.hp <= 0 ? 1 : 0), loser = w === 0 ? p2 : p1;
        loser.state = 'ko'; loser.vz = 8; loser.vx = -loser.face * 5; loser.invuln = 9999; loser.move = null; endRound(w, false);
      } else if (G.timer <= 0) endRound(p1.hp >= p2.hp ? 0 : 1, true);
      break;
    }
    case 'koend': {
      if (G.t % 2 === 0 || G.t > 50) stepWorld({ dir: 0 }, false);
      updateFx();
      if (G.t > 130) {
        if (G.wins[G.winner] >= 2) { G.mode = 'matchend'; G.t = 0; if (G.winner === 0) sfx.win(); }
        else { G.round++; startRound(); }
      }
      break;
    }
    case 'matchend':
      updateFx(); if (G.t % 5 === 0 && G.winner === 0) spark(rand() * W, 60 + rand() * 200, ['#ffd23f', '#ff4d5a', '#fff'][(rand() * 3) | 0], 4);
      if (req && G.t > 50) {
        if (G.winner === 0) { if (G.match + 1 < ARCADE.length) startMatch(G.match + 1); else { G.mode = 'champ'; G.t = 0; fx = []; sfx.win(); music(0); } }
        else startMatch(G.match);
      }
      break;
    case 'champ': if (G.t % 4 === 0) spark(rand() * W, rand() * 120, ['#ffd23f', '#ff4d5a', '#fff', '#7ed957'][(rand() * 4) | 0], 5); updateFx(); if (req && G.t > 90) { G.mode = 'menu'; G.t = 0; } break;
  }
  const ready = G.mode === 'fight' && p1 && p1.meter >= 100 && p1.state !== 'ult';
  document.getElementById('btn-ult').classList.toggle('ready', ready);
}

/* ---------- Layar pilih karakter ---------- */
const SLOTS = [{ id: 'falisha' }, { id: 'arshad' }, { id: 'babah' }, { id: 'pupu' }, { id: 'baymax' }];
const cardRect = i => ({ x: 52 + i * 175, y: 115, w: 156, h: 255 });
const START_BTN = { x: 712, y: 418, w: 196, h: 74 };

function updateSelect(req, tap, nav) {
  if (nav) {
    let n = (G.sel + nav + SLOTS.length) % SLOTS.length;
    G.sel = n;
    sfx.select();
  }
  if (tap) {
    for (let i = 0; i < SLOTS.length; i++) {
      const r = cardRect(i);
      if (tap.x >= r.x && tap.x <= r.x + r.w && tap.y >= r.y && tap.y <= r.y + r.h) {
        if (G.sel === i && G.t > 15) return begin();
        G.sel = i;
        sfx.select();
        return;
      }
    }
    const b = START_BTN;
    if (tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h) return begin();
    return;
  }
  if (req && !tap && G.t > 15) begin();
  function begin() { myChar = SLOTS[G.sel].id; sfx.select(); startMatch(0); }
}

/* ---------- Gambar ---------- */
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function text(t, x, y, size = 16, color = '#fff', align = 'left', stroke) {
  ctx.font = `${size}px 'Press Start 2P', monospace`; ctx.textAlign = align; ctx.lineJoin = 'round';
  if (stroke) { ctx.lineWidth = Math.max(6, size / 4); ctx.strokeStyle = stroke; ctx.strokeText(t, x, y); }
  else { ctx.fillStyle = '#000'; ctx.fillText(t, x + 2, y + 2); }
  ctx.fillStyle = color; ctx.fillText(t, x, y);
}
function glow(t, x, y, size, color, stroke = '#2a0a1e') { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 22; text(t, x, y, size, color, 'center', stroke); ctx.restore(); }
function emoji(e, x, y, size, rot = 0, alpha = 1) { ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.font = `${size}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, 0, 0); ctx.restore(); }
function frameOf(f) {
  if (f.state === 'ko') return 10;
  if (f.state === 'win') return 11;
  if (f.state === 'hurt') return 10;
  if (f.state === 'ult') return 9;
  if (f.state === 'attack') return f.move.frame;
  if (f.blocking) return 4;
  if (f.z > 0) return 3;
  if (f.state === 'walk') return 1 + ((f.anim / 8) | 0) % 2;
  return 0;
}
function drawSpriteAt(id, fr, x, bottom, face, scaleMul = 1, alpha = 1, rot = 0) {
  const ch = S.chars[id], d = ch.f[fr], sc = ch.sc * scaleMul, dw = d.w * sc, dh = d.h * sc;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, bottom); ctx.scale(face, 1);
  if (rot) { ctx.translate(0, -dh * 0.3); ctx.rotate(rot); ctx.translate(0, dh * 0.3); }
  const left = ATK_FRAMES.includes(fr) ? -ch.f[0].w * sc / 2 : -dw / 2;
  ctx.drawImage(d.c, left, -dh, dw, dh); ctx.restore();
}
function drawFighter(f) {
  for (const g of f.ghosts) drawSpriteAt(f.id, g.fr, g.x, FLOOR - g.z, g.face, 1, g.life / 12 * 0.4);
  // Bayangan
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(f.x, FLOOR + 4, 46 - f.z * 0.12, 9, 0, 0, 6.3); ctx.fill();
  
  // Visual Ultimate Props
  if (f.state === 'ult') {
    if (f.id === 'falisha') emoji('🎹', f.x + f.face * 85, FLOOR - 36, 84);
    else if (f.id === 'babah') emoji('☀️', f.x, FLOOR - 210, 48);
    else if (f.id === 'pupu') emoji('🦁', f.x + f.face * 60, FLOOR - 140, 54);
    else if (f.id === 'baymax') emoji('🚀', f.x - f.face * 60, FLOOR - f.z - 70, 50, -f.face * 0.4);
  }

  const bob = f.state === 'idle' ? Math.sin(f.anim * 0.12) * 2 : 0;
  ctx.save();
  if (f.tint && 'filter' in ctx) ctx.filter = f.tint;
  if (f.flash > 0 && f.flash % 2 === 0) ctx.globalAlpha = 0.6;
  if (f.buff > 0) {
    ctx.shadowColor = f.id === 'arshad' ? '#7ed957' : (f.id === 'baymax' ? '#fc8181' : '#ffd23f');
    ctx.shadowBlur = 14;
  }
  if (f.state === 'ult') {
    ctx.shadowColor = f.c.ultColor; ctx.shadowBlur = 24;
  }
  drawSpriteAt(f.id, frameOf(f), f.x, FLOOR - f.z + bob, f.face, 1, 1, f.state === 'ko' ? -f.face * 1.2 : 0);
  ctx.restore();
  if (f.dizzy > 0) for (let i = 0; i < 3; i++) { const a = f.anim * 0.15 + i * 2.1; emoji('💫', f.x + Math.cos(a) * 28, FLOOR - f.z - 165 + Math.sin(a) * 8, 22); }
}
function drawBg() {
  const [img, crop] = S.bg[arena.arena], k = 450 / crop, sw = W / k, sx = (img.width - sw) / 2;
  ctx.drawImage(img, sx, 0, sw, crop, 0, 0, W, 450);
  const g = ctx.createLinearGradient(0, 450, 0, H);
  const col = { green: ['#5d9a2e', '#2c4d17'], city: ['#4a2f8f', '#1c0f45'], lab: ['#27406b', '#0a1630'] }[arena.arena];
  g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
  ctx.fillStyle = g; ctx.fillRect(0, FLOOR - 6, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(0, FLOOR - 6, W, 3);
  ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let x = -((G.frame * 0) % 80); x < W; x += 80) ctx.fillRect(x, FLOOR + 20, 40, 6);
}
function drawProj(p) {
  if (p.kind === 'bolt') {
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(sgn(p.vx), 1); ctx.strokeStyle = '#fff36b'; ctx.lineWidth = 6; ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 16; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-10, 8); ctx.lineTo(4, -10); ctx.lineTo(18, 6); ctx.lineTo(32, -2); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
  } else if (p.kind === 'prayer') {
    ctx.save(); ctx.shadowColor = '#68d391'; ctx.shadowBlur = 20;
    emoji('✨', p.x, p.y, 38, p.rot);
    ctx.strokeStyle = '#68d391'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, 6.3); ctx.stroke();
    ctx.restore();
  } else emoji(p.emo, p.x, p.y, 34, p.rot);
}
function drawFx() {
  for (const e of fx) {
    if (e.type === 'p') { ctx.globalAlpha = Math.max(0, e.life / 20); ctx.fillStyle = e.color; ctx.fillRect(e.x, e.y, e.size, e.size); ctx.globalAlpha = 1; }
    else if (e.type === 'txt') { ctx.globalAlpha = Math.min(1, e.life / 15); text(e.text, e.x, e.y, e.size, e.color, 'center', '#1a0a2e'); ctx.globalAlpha = 1; }
    else if (e.type === 'emo') emoji(e.e, e.x, e.y, e.size, 0, Math.min(1, e.life / 14));
    else if (e.type === 'ring') { ctx.save(); ctx.globalAlpha = Math.max(0, e.life / 40); ctx.strokeStyle = e.color; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.3); ctx.stroke(); ctx.restore(); }
    else if (e.type === 'pillar') {
      ctx.save(); ctx.globalAlpha = Math.min(1, e.life / 10);
      const grad = ctx.createLinearGradient(e.x - e.w / 2, 0, e.x + e.w / 2, 0);
      grad.addColorStop(0, 'rgba(255,255,255,0)');
      grad.addColorStop(0.5, 'rgba(255,255,220,0.85)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad; ctx.fillRect(e.x - e.w / 2, 0, e.w, FLOOR);
      ctx.fillStyle = '#fff'; ctx.fillRect(e.x - 3, 0, 6, FLOOR);
      ctx.restore();
    }
    else if (e.type === 'claw') {
      ctx.save(); ctx.globalAlpha = Math.min(1, e.life / 8); ctx.strokeStyle = '#f6ad55'; ctx.lineWidth = 6; ctx.lineCap = 'round';
      for (let c = -1; c <= 1; c++) {
        ctx.beginPath(); ctx.moveTo(e.x + c * 16, e.y - 36); ctx.lineTo(e.x + e.face * 36 + c * 16, e.y + 26); ctx.stroke();
      }
      ctx.restore();
    }
  }
}
function drawHud() {
  const bw = 350, y = 26;
  [[p1, 30, 0], [p2, W - 30 - bw, 1]].forEach(([f, x, s]) => {
    ctx.fillStyle = 'rgba(0,0,0,.65)'; rr(x - 4, y - 4, bw + 8, 30, 8); ctx.fill();
    const pct = Math.max(0, f.hp / f.maxHp), w = bw * pct;
    const col = pct > 0.5 ? '#4cd964' : pct > 0.25 ? '#ffcc00' : '#ff3b3b';
    ctx.fillStyle = col; ctx.fillRect(s === 0 ? x + bw - w : x, y, w, 22);
    ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(s === 0 ? x + bw - w : x, y, w, 7);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(x, y, bw, 22);
    text(f.name || f.c.name, s === 0 ? x : x + bw, y + 56, 11, '#fff', s === 0 ? 'left' : 'right');
    // Meter ultimate
    const mw = 220, mx = s === 0 ? x : x + bw - mw, my = y + 66, full = f.meter >= 100;
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(mx, my, mw, 12);
    ctx.fillStyle = full ? (G.frame % 10 < 5 ? '#fff36b' : '#ff9f1c') : '#6fa8ff'; ctx.fillRect(mx, my, mw * f.meter / 100, 12);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(mx, my, mw, 12);
    if (full) text('ULTIMATE!', s === 0 ? mx + mw + 10 : mx - 10, my + 11, 9, '#ffe55c', s === 0 ? 'left' : 'right');
    // Bintang kemenangan
    for (let i = 0; i < 2; i++) { const sx = s === 0 ? x + bw - 14 - i * 28 : x + 14 + i * 28; emoji(G.wins[s] > i ? '⭐' : '☆', sx, y + 92, 20); }
  });
  ctx.fillStyle = 'rgba(0,0,0,.7)'; rr(W / 2 - 40, 14, 80, 54, 10); ctx.fill();
  text(String(Math.max(0, G.timer)), W / 2, 56, 30, G.timer <= 10 ? '#ff6b6b' : '#fff', 'center');
}
function drawCut() {
  const f = G.cutF, t = 55 - G.cut, a = Math.min(1, t / 8) * Math.min(1, G.cut / 8 + 0.4);
  ctx.save(); ctx.globalAlpha = 0.65 * a; ctx.fillStyle = '#05061a'; ctx.fillRect(0, 0, W, H); ctx.restore();
  ctx.save(); ctx.globalAlpha = a; ctx.translate(0, H / 2 - 80); ctx.fillStyle = f.c.ultColor; ctx.beginPath(); ctx.moveTo(-40, 20); ctx.lineTo(W + 40, 0); ctx.lineTo(W + 40, 150); ctx.lineTo(-40, 170); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 150, W, 14); ctx.restore();
  const slide = Math.min(1, t / 12), px = -150 + slide * 330;
  drawSpriteAt(f.id, 9, px + 80, H / 2 + 150, f.face, 1.8, a);
  ctx.save(); ctx.globalAlpha = a; glow(f.c.ultName, W / 2 + 110, H / 2 + 6 + Math.sin(t * 0.8) * 3, f.c.ultName.length > 14 ? 22 : 32, '#fff', '#3a0d1a'); ctx.restore();
  for (let i = 0; i < 14; i++) { const lx = (i * 97 + t * 40) % W; ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(lx, (i * 53) % H, 70, 2); }
}
function drawBanner() {
  if (G.mode === 'intro') {
    if (G.t < 78) { glow('ROUND ' + G.round, W / 2, 230, 44, '#ffd23f'); if (G.round === 3) text('RONDE PENENTU!', W / 2, 280, 14, '#fff', 'center'); }
    else glow('FIGHT !', W / 2, 250, 64 + (G.t - 78) * 0.6, '#ff4d5a');
  }
  if (G.mode === 'koend' && G.t < 100) glow(G.koText, W / 2, 250, 64, '#ff4d5a');
}
function drawTitleBg() {
  const zoom = 1.04 + Math.sin(G.frame * 0.01) * 0.02;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.drawImage(S.cover, -W / 2, -H / 2, W, H); ctx.restore();
}
function draw() {
  ctx.save();
  if (G.shake > 0) ctx.translate((rand() - 0.5) * G.shake, (rand() - 0.5) * G.shake);
  switch (G.mode) {
    case 'menu': {
      drawTitleBg(); const tg = ctx.createLinearGradient(0, 0, 0, 210); tg.addColorStop(0, 'rgba(20,10,50,.7)'); tg.addColorStop(1, 'rgba(20,10,50,0)'); ctx.fillStyle = tg; ctx.fillRect(0, 0, W, 210);
      const bg = ctx.createLinearGradient(0, H - 150, 0, H); bg.addColorStop(0, 'rgba(10,5,30,0)'); bg.addColorStop(1, 'rgba(10,5,30,.8)'); ctx.fillStyle = bg; ctx.fillRect(0, H - 150, W, 150);
      glow('WARISAN', W / 2, 90 + Math.sin(G.frame * 0.05) * 3, 58, '#ffd23f'); glow('COMBAT', W / 2, 160 + Math.sin(G.frame * 0.05 + 1) * 3, 58, '#ff4d5a');
      text(COARSE ? 'SENTUH LAYAR UNTUK MAIN' : 'TEKAN SPASI / KLIK UNTUK MAIN', W / 2, 490, 16, Math.sin(G.frame * 0.1) > 0 ? '#fff' : '#ffd23f', 'center');
      text('5 JAGOAN KELUARGA • MODE ARCADE vs CPU', W / 2, 520, 10, '#cfd6ff', 'center'); break;
    }
    case 'select': drawSelect(); break;
    case 'vs': drawVs(); break;
    case 'champ': {
      drawTitleBg(); ctx.fillStyle = 'rgba(5,8,30,.6)'; ctx.fillRect(0, 0, W, H);
      glow('JUARA !', W / 2, 140, 64, '#ffd23f'); text(p1.c.name + ' mengalahkan semua lawan!', W / 2, 200, 14, '#fff', 'center');
      drawSpriteAt(myChar, 11, W / 2, 470 - Math.abs(Math.sin(G.t * 0.12)) * 30, 1, 1.7);
      drawFx(); if (G.t > 90) text(COARSE ? 'Sentuh untuk ke menu' : 'Tekan Spasi untuk ke menu', W / 2, 515, 11, '#ffd23f', 'center'); break;
    }
    default: {
      drawBg();
      const fs = [p1, p2].sort((a, b) => a.z - b.z); fs.forEach(drawFighter);
      projs.forEach(drawProj); drawFx(); drawHud(); drawBanner();
      if (G.mode === 'fight' && G.cut > 0) drawCut();
      if (G.mode === 'matchend') {
        ctx.fillStyle = 'rgba(5,8,30,.6)'; ctx.fillRect(0, 0, W, H);
        if (G.winner === 0) { glow('MENANG !', W / 2, 220, 60, '#ffd23f'); text(G.match + 1 < ARCADE.length ? 'Lawan berikutnya menunggu...' : 'Tinggal satu langkah lagi!', W / 2, 280, 13, '#fff', 'center'); }
        else { glow('KALAH...', W / 2, 220, 60, '#8fe0ff'); text('Jangan menyerah! Coba lagi ya', W / 2, 280, 13, '#fff', 'center'); }
        drawFx(); if (G.t > 50) text(COARSE ? 'Sentuh untuk lanjut' : 'Tekan Spasi untuk lanjut', W / 2, 340, 12, '#ffd23f', 'center');
      }
    }
  }
  ctx.restore();
}
function drawSelect() {
  drawTitleBg(); ctx.fillStyle = 'rgba(8,6,32,.78)'; ctx.fillRect(0, 0, W, H);
  glow('PILIH JAGOANMU', W / 2, 72, 30, '#ffd23f');
  SLOTS.forEach((s, i) => {
    const r = cardRect(i), sel = G.sel === i, lift = sel ? -8 + Math.sin(G.frame * 0.15) * 3 : 0;
    ctx.save(); ctx.translate(0, lift);
    const g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h);
    g.addColorStop(0, sel ? '#4a3f9a' : '#2b2360');
    g.addColorStop(1, sel ? '#1e1458' : '#140f38');
    ctx.fillStyle = g; rr(r.x, r.y, r.w, r.h, 14); ctx.fill();
    ctx.lineWidth = sel ? 4 : 2; ctx.strokeStyle = sel ? '#ffd23f' : '#6f78bf';
    if (sel) { ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 20; }
    ctx.stroke(); ctx.shadowBlur = 0;

    const ch = S.chars[s.id], d = ch.f[0], k = 170 / d.h;
    ctx.drawImage(d.c, r.x + r.w / 2 - d.w * k / 2, r.y + 20, d.w * k, 170);
    const nameStr = CHARS[s.id].name;
    const nsize = nameStr.length > 8 ? 10 : 12;
    text(nameStr, r.x + r.w / 2, r.y + 224, nsize, sel ? '#ffd23f' : '#fff', 'center');
    ctx.restore();
  });

  const c = CHARS[SLOTS[G.sel].id];
  ctx.fillStyle = 'rgba(0,0,0,.6)'; rr(52, 388, 640, 132, 14); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2; ctx.stroke();
  text(c.name + ' – ' + c.tag, 72, 420, 13, '#ffd23f');
  text('Jurus 1: ' + c.moves[0], 72, 450, 10, '#fff');
  text('Jurus 2: ' + c.moves[1], 72, 476, 10, '#fff');
  text('ULTIMATE: ' + c.moves[2], 72, 502, 10, '#ff9f1c');

  const b = START_BTN, pulse = 1 + Math.sin(G.frame * 0.15) * 0.03;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse); ctx.fillStyle = '#e63946'; rr(-b.w / 2, -b.h / 2, b.w, b.h, 16); ctx.fill(); ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();
  text('MULAI!', b.x + b.w / 2, b.y + b.h / 2 + 8, 20, '#fff', 'center');
  text(COARSE ? 'Sentuh kartu lalu MULAI' : '← → pilih  •  Spasi / Klik mulai', W / 2, H - 8, 9, '#cfd6ff', 'center');
}
function drawVs() {
  const [img, crop] = S.bg[arena.arena], k = 450 / crop, sw = W / k; ctx.drawImage(img, (img.width - sw) / 2, 0, sw, crop, 0, 0, W, H);
  ctx.fillStyle = 'rgba(8,6,32,.55)'; ctx.fillRect(0, 0, W, H);
  const t = Math.min(1, G.t / 25), e = 1 - Math.pow(1 - t, 3);
  ctx.save(); ctx.shadowColor = '#000'; ctx.shadowBlur = 20;
  drawSpriteAt(p1.id, 0, -150 + e * 400, 470, 1, 1.7); ctx.save(); if (p2.tint && 'filter' in ctx) ctx.filter = p2.tint; drawSpriteAt(p2.id, 0, W + 150 - e * 400, 470, -1, 1.7); ctx.restore(); ctx.restore();
  glow('VS', W / 2, 270 + Math.sin(G.t * 0.3) * 4, 90, '#ff4d5a');
  text(p1.c.name, 40, 70, 22, '#ffd23f'); text(p2.name || p2.c.name, W - 40, 70, 22, '#ff8a8a', 'right');
  text('ARENA ' + (G.match + 1) + ': ' + arena.name.toUpperCase(), W / 2, 515, 13, '#fff', 'center');
}

/* ---------- Loop ---------- */
let last = 0, acc = 0;
function loop(t) { acc += Math.min(100, t - last); last = t; while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; } draw(); requestAnimationFrame(loop); }
loadAssets().then(() => { p1 = mkFighter('falisha', 0); p2 = mkFighter('arshad', 1, ARCADE[0].p); requestAnimationFrame(loop); })
  .catch(e => { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff;position:fixed;top:10px;left:10px">Gagal memuat aset. Jalankan lewat server lokal.</p>'); });
})();
