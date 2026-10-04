/* FALISHA SLUG: SUPER VEHICLE 001
   Remake 2D Arcade Run-and-Gun ala Metal Slug (Neo Geo)
   Karakter: Falisha Commando, Hostage Babah Nono, Super Tank SV-001, Boss Yanto Mech */

(() => {
'use strict';

const W = 960, H = 540, FLOOR = 430, STAGE_LEN = 3600;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const COARSE = matchMedia('(pointer: coarse)').matches;
const rand = Math.random, sgn = v => (v > 0) - (v < 0);

/* ---------- Musik & Audio Synth ---------- */
const _ = null;
const TRACKS = [
  // 0: Menu Theme
  { bpm: 130, wave: 'square', bass: [48, 48, 51, 53], lead: [72,_,75,77, 79,_,77,75, 72,75,77,_, 80,79,77,75, 72,_,75,77, 84,_,82,79, 77,_,75,_, 72,_,_,_] },
  // 1: Desert Mission (Driving Military Groove)
  { bpm: 142, wave: 'sawtooth', bass: [45, 45, 48, 50], lead: [69,69,_,72, 74,_,72,69, 71,_,74,_, 76,74,72,71, 69,69,_,72, 77,_,76,74, 72,_,71,_, 69,_,_,_] },
  // 2: Boss Battle (Fast Dramatic March)
  { bpm: 160, wave: 'sawtooth', bass: [40, 43, 40, 45], lead: [64,64,67,64, 70,_,67,64, 63,_,67,_, 72,70,67,63, 64,64,67,64, 76,_,75,72, 70,_,67,_, 64,_,_,_] }
];

const music = i => Chip.play(TRACKS, i);

// Synthesized Announcer Voice
function speakAnnouncer(text) {
  if (Chip.isMuted()) return;
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 1.15;
      u.pitch = 0.85;
      u.volume = 0.95;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}
}

const sfx = {
  pistol: () => { Chip.beep(750, 0.05, 'square', 0.07, -400); Chip.noise(Chip.now(), 0.06, 0.06, 2500); },
  hmg: () => { Chip.beep(620, 0.06, 'sawtooth', 0.09, -350); Chip.noise(Chip.now(), 0.08, 0.08, 1800); },
  rocket: () => { Chip.beep(300, 0.25, 'sawtooth', 0.09, 300); Chip.noise(Chip.now(), 0.2, 0.08, 800); },
  cannon: () => { Chip.hit(2.2); Chip.beep(120, 0.35, 'sawtooth', 0.15, -60); },
  grenade: () => { Chip.beep(320, 0.15, 'triangle', 0.06, 150); },
  boom: () => { Chip.hit(1.6); },
  pickup: () => { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.08, 'square', 0.05), i * 60)); },
  thankyou: () => { speakAnnouncer('Thank you!'); [440, 554, 659].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.12, 'triangle', 0.06), i * 90)); },
  enterSlug: () => { Chip.beep(220, 0.12, 'sawtooth', 0.08, 150); setTimeout(() => Chip.beep(440, 0.18, 'square', 0.08, 200), 100); },
  hit: () => Chip.hit(0.8),
  ko: () => Chip.beep(110, 0.5, 'sawtooth', 0.12, -70),
  select: () => Chip.beep(880, 0.08, 'square', 0.06)
};

function setMuted(m) { Chip.setMuted(m); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }
setMuted(Chip.isMuted());

/* ---------- Sprite Loading & Cutting ---------- */
const loadImg = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });

function cutSprite(img, x, y, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); g.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gr = p[i + 1], b = p[i + 2];
    // Chroma key solid magenta: high red & blue, low green
    if (r > 135 && b > 120 && gr < Math.min(r, b) - 45) {
      p[i + 3] = 0;
    } else {
      const px = (i / 4) % w, py = (i / 4 / w) | 0;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
    }
  }
  g.putImageData(d, 0, 0);
  const tw = Math.max(1, maxX - minX + 1), th = Math.max(1, maxY - minY + 1);
  const out = document.createElement('canvas'); out.width = tw; out.height = th;
  out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return { c: out, w: tw, h: th };
}

const S = { falisha: [], items: [], boss: {}, bg: null, cover: null };

async function loadAssets() {
  const [faImg, itImg, boImg, bgImg, covImg] = await Promise.all([
    loadImg('assets/falisha.jpg'),
    loadImg('assets/items.jpg'),
    loadImg('assets/boss.jpg'),
    loadImg('assets/desert.jpg'),
    loadImg('assets/cover.jpg')
  ]);

  // 1. Falisha grid (4 cols x 3 rows, 1200 x 896 -> 300 x 298 per cell)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      S.falisha.push(cutSprite(faImg, c * 300 + 4, r * 298 + 4, 292, 290));
    }
  }

  // 2. Items & enemies grid (4 cols x 3 rows)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      S.items.push(cutSprite(itImg, c * 300 + 4, r * 298 + 4, 292, 290));
    }
  }

  // 3. Boss sprites
  S.boss.mech = cutSprite(boImg, 20, 160, 720, 580);
  S.boss.wreck = cutSprite(boImg, 740, 20, 620, 460);
  S.boss.yanto = cutSprite(boImg, 880, 490, 290, 270);

  // 4. Background & cover
  S.bg = bgImg;
  S.cover = covImg;
}

/* ---------- Input ---------- */
const keys = {};
const touchState = { left: false, right: false, up: false, down: false, fire: false, jump: false, bomb: false, slug: false };
let confirmReq = false, tapPos = null;

function gesture() { Chip.ensure(); if (!gesture.done) { gesture.done = true; music(0); } }

addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd'].includes(e.key)) e.preventDefault();
  if (!keys[e.key]) {
    if (e.key === 'Enter' || e.key === ' ') confirmReq = true;
    gesture();
  }
  keys[e.key] = true;
  if (e.key === 'm' || e.key === 'M') setMuted(!Chip.isMuted());
});
addEventListener('keyup', e => { keys[e.key] = false; });

cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect();
  tapPos = { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  confirmReq = true; gesture();
  if (COARSE && !document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  }
});

// Setup Touch Buttons
const tbtns = { 'btn-fire': 'fire', 'btn-jump': 'jump', 'btn-bomb': 'bomb', 'btn-slug': 'slug' };
Object.entries(tbtns).forEach(([id, act]) => {
  const b = document.getElementById(id);
  if (!b) return;
  b.addEventListener('pointerdown', e => {
    e.preventDefault(); b.setPointerCapture?.(e.pointerId);
    touchState[act] = true; b.classList.add('on'); gesture();
  });
  const off = e => { e.preventDefault(); touchState[act] = false; b.classList.remove('on'); };
  b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off);
});

// Setup Virtual D-Pad
(() => {
  const dpad = document.getElementById('dpad');
  if (!dpad) return;
  const spans = {
    up: dpad.querySelector('.dp-up'),
    left: dpad.querySelector('.dp-left'),
    right: dpad.querySelector('.dp-right'),
    down: dpad.querySelector('.dp-down')
  };
  const setDir = (l, r, u, d) => {
    touchState.left = l; touchState.right = r; touchState.up = u; touchState.down = d;
    spans.left.classList.toggle('on', l); spans.right.classList.toggle('on', r);
    spans.up.classList.toggle('on', u); spans.down.classList.toggle('on', d);
  };
  const upd = e => {
    const b = dpad.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const dx = e.clientX - cx, dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist < 14) { setDir(false, false, false, false); return; }
    setDir(dx < -18, dx > 18, dy < -18, dy > 18);
  };
  dpad.addEventListener('pointerdown', e => { e.preventDefault(); dpad.setPointerCapture?.(e.pointerId); gesture(); upd(e); });
  dpad.addEventListener('pointermove', e => { if (e.buttons || e.pressure > 0) upd(e); });
  const off = () => setDir(false, false, false, false);
  dpad.addEventListener('pointerup', off); dpad.addEventListener('pointercancel', off);
})();

document.getElementById('btn-mute').onclick = e => { e.stopPropagation(); setMuted(!Chip.isMuted()); };
document.getElementById('btn-full').onclick = e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};

/* ---------- State & Entities ---------- */
const G = {
  mode: 'title', // title, playing, gameover, victory
  camX: 0,
  score: 0,
  t: 0,
  shake: 0,
  banner: '',
  bannerT: 0,
  bannerColor: '#ffd23f'
};

let P = null, tank = null, boss = null;
let bullets = [], enemyBullets = [], bombs = [], fx = [], hostages = [], enemies = [], drops = [];

function showBanner(text, dur = 100, color = '#ffd23f') {
  G.banner = text; G.bannerT = dur; G.bannerColor = color;
}

function initGame() {
  P = {
    x: 120, y: FLOOR, vx: 0, vy: 0, onGround: true, face: 1,
    aimUp: false, crouch: false,
    weapon: 'pistol', // pistol, H, R
    ammo: { H: 0, R: 0, bomb: 10 },
    shootCd: 0,
    inTank: false,
    hp: 100, maxHp: 100,
    invuln: 0, hurtT: 0,
    anim: 0, frame: 0,
    state: 'idle'
  };

  tank = {
    x: 1850, y: FLOOR, vx: 0,
    active: false,
    armor: 3, maxArmor: 3,
    shootCd: 0,
    anim: 0,
    wreck: false
  };

  boss = {
    x: 3300, y: FLOOR - 10,
    hp: 120, maxHp: 120,
    phase: 1,
    shootCd: 120,
    state: 'idle',
    wreck: false,
    yantoState: 'hidden',
    yantoX: 3350, yantoY: FLOOR
  };

  // Hostages (Babah Nono)
  hostages = [
    { id: 1, x: 620, y: FLOOR, freed: false, t: 0, gift: 'H' },
    { id: 2, x: 1400, y: FLOOR, freed: false, t: 0, gift: 'R' },
    { id: 3, x: 2350, y: FLOOR, freed: false, t: 0, gift: 'food' }
  ];

  // Enemies
  enemies = [
    { type: 'soldier', x: 480, y: FLOOR, hp: 2, face: -1, cd: 60, panic: false, vx: 0 },
    { type: 'soldier', x: 800, y: FLOOR, hp: 2, face: -1, cd: 80, panic: false, vx: 0 },
    { type: 'soldier', x: 1050, y: FLOOR, hp: 2, face: -1, cd: 90, panic: false, vx: 0 },
    { type: 'chopper', x: 1250, y: 180, hp: 4, face: -1, cd: 100, vx: 1.2 },
    { type: 'soldier', x: 1600, y: FLOOR, hp: 2, face: -1, cd: 70, panic: false, vx: 0 },
    { type: 'soldier', x: 2100, y: FLOOR, hp: 2, face: -1, cd: 75, panic: false, vx: 0 },
    { type: 'chopper', x: 2500, y: 160, hp: 5, face: -1, cd: 90, vx: 1.4 },
    { type: 'soldier', x: 2750, y: FLOOR, hp: 2, face: -1, cd: 60, panic: false, vx: 0 }
  ];

  bullets = []; enemyBullets = []; bombs = []; fx = []; drops = [];
  G.camX = 0; G.score = 0; G.shake = 0; G.t = 0;
  G.mode = 'playing';

  showBanner('MISSION 1... START!', 110, '#ffd23f');
  speakAnnouncer('Mission 1... Start!');
  music(1);
}

/* ---------- Partikel & FX ---------- */
const addFx = o => fx.push(Object.assign({ life: 30, t: 0 }, o));
const spark = (x, y, color = '#fff', n = 8) => {
  for (let i = 0; i < n; i++) {
    const a = rand() * 6.28, s = 2 + rand() * 5;
    addFx({ type: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 12 + rand() * 10, color, size: 4 });
  }
};
const explosion = (x, y, scale = 1) => {
  G.shake = Math.max(G.shake, 6 * scale);
  sfx.boom();
  for (let k = 0; k < 4; k++) {
    addFx({ type: 'ring', x, y, r: 8 + k * 12, vr: 6 * scale, life: 24 + k * 4, color: k % 2 ? '#ff9f1c' : '#fff' });
  }
  for (let i = 0; i < 18 * scale; i++) {
    const a = rand() * 6.28, s = 2 + rand() * 8 * scale;
    addFx({ type: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 2, life: 20 + rand() * 16, color: ['#ff4d5a', '#ffd23f', '#ff9f1c', '#fff'][(rand() * 4) | 0], size: 5 * scale });
  }
};
const popText = (x, y, text, color = '#fff', size = 16) => addFx({ type: 'txt', x, y, text, color, size, life: 35 });

/* ---------- Update Gameplay ---------- */
function update() {
  G.t++;
  if (G.shake > 0) G.shake *= 0.85; if (G.shake < 0.3) G.shake = 0;
  if (G.bannerT > 0) G.bannerT--;

  if (G.mode === 'title') {
    if (confirmReq && G.t > 15) { confirmReq = false; sfx.select(); initGame(); }
    return;
  }
  if (G.mode === 'gameover' || G.mode === 'victory') {
    if (confirmReq && G.t > 40) { confirmReq = false; G.mode = 'title'; G.t = 0; music(0); }
    return;
  }

  // --- Input Player ---
  const kLeft = keys.ArrowLeft || keys.a || touchState.left;
  const kRight = keys.ArrowRight || keys.d || touchState.right;
  const kUp = keys.ArrowUp || keys.w || touchState.up;
  const kDown = keys.ArrowDown || keys.s || touchState.down;
  const kJump = keys[' '] || keys.k || touchState.jump;
  const kFire = keys.j || touchState.fire;
  const kBomb = keys.l || touchState.bomb;
  const kSlug = keys.e || keys.u || touchState.slug;

  if (P.invuln > 0) P.invuln--;
  if (P.hurtT > 0) P.hurtT--;
  if (P.shootCd > 0) P.shootCd--;

  // Masuk / Keluar Tank
  const nearTank = Math.abs(P.x - tank.x) < 80 && !tank.wreck && !P.inTank;
  document.getElementById('btn-slug')?.classList.toggle('ready', nearTank || P.inTank);

  if (kSlug && !P.slugKeyLock) {
    P.slugKeyLock = true;
    if (P.inTank) {
      // Keluar Tank
      P.inTank = false;
      tank.active = false;
      P.vy = -8;
      P.y -= 30;
      sfx.enterSlug();
      popText(P.x, P.y - 60, 'SLUG OUT!', '#48cae4', 16);
    } else if (nearTank) {
      // Masuk Tank
      P.inTank = true;
      tank.active = true;
      sfx.enterSlug();
      popText(tank.x, tank.y - 70, 'SLUG IN!', '#70e000', 18);
    }
  }
  if (!kSlug) P.slugKeyLock = false;

  // Gerakan Pemain
  if (P.inTank) {
    // Mode Dalam Tank
    const sp = 4.2;
    tank.vx = (kRight ? 1 : 0) - (kLeft ? 1 : 0);
    tank.x += tank.vx * sp;
    tank.x = Math.max(G.camX + 50, Math.min(G.camX + W - 60, tank.x));
    if (tank.vx !== 0) P.face = tank.vx;
    P.x = tank.x;
    P.y = tank.y;
    P.onGround = true;

    // Tembak Vulcan Cannon Tank (Otomatis Dual Stream)
    if (tank.shootCd > 0) tank.shootCd--;
    if (kFire && tank.shootCd <= 0) {
      tank.shootCd = 6;
      sfx.hmg();
      bullets.push({ x: tank.x + P.face * 55, y: tank.y - 34, vx: P.face * 16, vy: (rand() - 0.5) * 1.5, dmg: 3, w: 20, h: 8, life: 60, color: '#ffb703' });
      bullets.push({ x: tank.x + P.face * 55, y: tank.y - 44, vx: P.face * 16, vy: (rand() - 0.5) * 1.5, dmg: 3, w: 20, h: 8, life: 60, color: '#ffb703' });
      spark(tank.x + P.face * 60, tank.y - 38, '#ffe55c', 4);
    }

    // Tembak Meriam Tank Raksasa (Bomb)
    if (kBomb && !P.bombKeyLock && P.ammo.bomb > 0) {
      P.bombKeyLock = true;
      P.ammo.bomb--;
      sfx.cannon();
      G.shake = 14;
      bombs.push({ x: tank.x + P.face * 65, y: tank.y - 45, vx: P.face * 14, vy: -3, dmg: 22, rad: 80, isCannon: true, life: 70 });
      spark(tank.x + P.face * 70, tank.y - 45, '#ff4d5a', 12);
    }
  } else {
    // Mode Jalan Kaki
    P.aimUp = kUp && !kRight && !kLeft;
    P.crouch = kDown && P.onGround;

    const sp = P.crouch ? 1.6 : 3.8;
    P.vx = P.crouch && P.onGround ? 0 : ((kRight ? 1 : 0) - (kLeft ? 1 : 0)) * sp;
    if (P.vx !== 0) P.face = sgn(P.vx);

    P.x += P.vx;
    P.x = Math.max(G.camX + 30, Math.min(G.camX + W - 40, P.x));

    // Lompat
    if (kJump && P.onGround && !P.crouch) {
      P.vy = -12.5;
      P.onGround = false;
      sfx.grenade();
    }

    // Fisika Gravitasi
    if (!P.onGround) {
      P.vy += 0.65;
      P.y += P.vy;
      if (P.y >= FLOOR) {
        P.y = FLOOR; P.vy = 0; P.onGround = true;
      }
    }

    // Tembak Senjata
    if (kFire && P.shootCd <= 0) {
      const isUp = kUp;
      const vyDir = isUp ? -14 : 0;
      const vxDir = isUp ? P.face * 2 : P.face * 15;
      const spawnY = P.crouch ? P.y - 35 : (isUp ? P.y - 110 : P.y - 68);
      const spawnX = P.x + (isUp ? P.face * 10 : P.face * 45);

      if (P.weapon === 'pistol') {
        P.shootCd = 12;
        sfx.pistol();
        bullets.push({ x: spawnX, y: spawnY, vx: vxDir, vy: vyDir, dmg: 1.5, w: 14, h: 6, life: 60, color: '#ffd23f' });
      } else if (P.weapon === 'H') {
        P.shootCd = 6;
        P.ammo.H--;
        sfx.hmg();
        bullets.push({ x: spawnX, y: spawnY + (rand() - 0.5) * 6, vx: vxDir, vy: vyDir + (rand() - 0.5) * 2, dmg: 2.8, w: 18, h: 8, life: 60, color: '#ff9f1c' });
        if (P.ammo.H <= 0) { P.weapon = 'pistol'; popText(P.x, P.y - 80, 'PISTOL', '#fff', 14); }
      } else if (P.weapon === 'R') {
        P.shootCd = 18;
        P.ammo.R--;
        sfx.rocket();
        bullets.push({ x: spawnX, y: spawnY, vx: vxDir * 0.7, vy: vyDir, dmg: 8, isRocket: true, w: 26, h: 12, life: 80, color: '#ff4d5a' });
        if (P.ammo.R <= 0) { P.weapon = 'pistol'; popText(P.x, P.y - 80, 'PISTOL', '#fff', 14); }
      }
      spark(spawnX, spawnY, '#ffe55c', 4);
    }

    // Lempar Granat
    if (kBomb && !P.bombKeyLock && P.ammo.bomb > 0) {
      P.bombKeyLock = true;
      P.ammo.bomb--;
      sfx.grenade();
      bombs.push({ x: P.x + P.face * 30, y: P.y - 60, vx: P.face * 9, vy: -8, dmg: 16, rad: 65, life: 75 });
    }
  }
  if (!kBomb) P.bombKeyLock = false;

  // Kamera bergulir ke kanan
  if (P.x - G.camX > W * 0.45 && G.camX < STAGE_LEN - W && boss.hp > 0 && P.x < 3000) {
    G.camX = Math.min(STAGE_LEN - W, P.x - W * 0.45);
  }

  // --- Update Proyektil Player ---
  for (const b of bullets) {
    b.life--;
    if (b.isRocket) {
      // Cari target terdekat
      const target = enemies.find(e => Math.hypot(e.x - b.x, e.y - b.y) < 260) || (boss.hp > 0 && b.x > boss.x - 200 ? boss : null);
      if (target) {
        const angle = Math.atan2(target.y - 40 - b.y, target.x - b.x);
        b.vx += Math.cos(angle) * 0.8;
        b.vy += Math.sin(angle) * 0.8;
      }
      if (b.life % 2 === 0) addFx({ type: 'p', x: b.x, y: b.y, vx: -b.vx * 0.3, vy: (rand() - 0.5) * 2, life: 10, color: '#ced4da', size: 5 });
    }
    b.x += b.vx; b.y += b.vy;

    // Kena Musuh
    for (const e of enemies) {
      if (Math.abs(b.x - e.x) < 32 && Math.abs(b.y - (e.y - 45)) < 40) {
        b.life = 0;
        e.hp -= b.dmg;
        spark(b.x, b.y, '#ffd23f', 6);
        if (b.isRocket) explosion(b.x, b.y, 0.8);
        if (e.hp <= 0 && !e.panic) {
          e.panic = true; e.vx = P.face * 4;
          G.score += 100;
          popText(e.x, e.y - 60, '+100', '#ffd23f', 16);
          spark(e.x, e.y - 30, '#ff4d5a', 10);
        }
      }
    }

    // Kena Bos Yanto Mech
    if (boss.hp > 0 && Math.abs(b.x - boss.x) < 140 && b.y > boss.y - 180 && b.y < boss.y) {
      b.life = 0;
      boss.hp -= b.dmg;
      spark(b.x, b.y, '#ff4d5a', 8);
      if (b.isRocket) explosion(b.x, b.y, 1.1);
      if (boss.hp <= 0) defeatBoss();
    }

    // Kena Tali Sandera
    for (const h of hostages) {
      if (!h.freed && Math.abs(b.x - h.x) < 30 && Math.abs(b.y - (h.y - 35)) < 35) {
        b.life = 0;
        freeHostage(h);
      }
    }
  }
  bullets = bullets.filter(b => b.life > 0 && b.x > G.camX - 50 && b.x < G.camX + W + 50);

  // --- Update Bom / Granat ---
  for (const b of bombs) {
    b.life--;
    b.x += b.vx;
    b.vy += 0.55;
    b.y += b.vy;
    if (b.y >= FLOOR - 10) {
      b.y = FLOOR - 10;
      b.vy = -b.vy * 0.45;
      b.vx *= 0.7;
    }
    if (b.life <= 0 || (b.isCannon && b.life < 55 && b.y >= FLOOR - 20)) {
      b.life = 0;
      explosion(b.x, b.y, b.isCannon ? 1.8 : 1.3);
      // Area damage
      for (const e of enemies) {
        if (Math.hypot(e.x - b.x, e.y - b.y) < b.rad) {
          e.hp -= b.dmg;
          if (e.hp <= 0 && !e.panic) { e.panic = true; e.vx = P.face * 5; G.score += 150; popText(e.x, e.y - 60, '+150', '#ffd23f', 16); }
        }
      }
      if (boss.hp > 0 && Math.hypot(boss.x - b.x, boss.y - 80 - b.y) < b.rad + 80) {
        boss.hp -= b.dmg;
        if (boss.hp <= 0) defeatBoss();
      }
      for (const h of hostages) {
        if (!h.freed && Math.hypot(h.x - b.x, h.y - b.y) < b.rad) freeHostage(h);
      }
    }
  }
  bombs = bombs.filter(b => b.life > 0);

  // --- Update Musuh ---
  for (const e of enemies) {
    if (e.panic) {
      e.x += e.vx; // Lari kabur bawa bendera putih
      continue;
    }
    const dist = P.x - e.x;
    e.face = sgn(dist) || -1;

    if (e.type === 'chopper') {
      e.x += Math.sin(G.t * 0.04) * 2;
      if (--e.cd <= 0 && Math.abs(dist) < 320) {
        e.cd = 90;
        enemyBullets.push({ x: e.x, y: e.y + 20, vx: 0, vy: 4.5, dmg: 15, life: 80, rad: 8 });
        sfx.pistol();
      }
    } else {
      // Tentara menembak blaster
      if (--e.cd <= 0 && Math.abs(dist) < 360) {
        e.cd = 100 + rand() * 40;
        enemyBullets.push({ x: e.x + e.face * 30, y: e.y - 50, vx: e.face * 6, vy: 0, dmg: 12, life: 75, rad: 6 });
        sfx.pistol();
      }
    }
  }

  // --- Update Peluru Musuh ---
  for (const eb of enemyBullets) {
    eb.life--; eb.x += eb.vx; eb.y += eb.vy;
    // Cek tabrakan dengan Player / Tank
    if (P.inTank) {
      if (Math.abs(eb.x - tank.x) < 65 && Math.abs(eb.y - (tank.y - 50)) < 45) {
        eb.life = 0;
        tank.armor--;
        sfx.hit();
        spark(eb.x, eb.y, '#48cae4', 10);
        popText(tank.x, tank.y - 90, 'ARMOR -1', '#ff4d5a', 16);
        if (tank.armor <= 0) {
          // Tank meledak, player terlempar keluar aman
          tank.wreck = true;
          P.inTank = false;
          tank.active = false;
          P.vy = -10;
          explosion(tank.x, tank.y - 40, 1.6);
          popText(P.x, P.y - 80, 'TANK DOWN!', '#ff4d5a', 20);
        }
      }
    } else {
      if (P.invuln <= 0 && Math.abs(eb.x - P.x) < 28 && Math.abs(eb.y - (P.y - 50)) < 45) {
        eb.life = 0;
        P.hp -= eb.dmg;
        P.invuln = 45;
        P.hurtT = 16;
        sfx.hit();
        spark(P.x, P.y - 45, '#ff4d5a', 10);
        popText(P.x, P.y - 80, '-' + eb.dmg, '#ff4d5a', 18);
        if (P.hp <= 0) {
          G.mode = 'gameover';
          sfx.ko();
          speakAnnouncer('Game Over');
          showBanner('GAME OVER', 200, '#ff4d5a');
        }
      }
    }
  }
  enemyBullets = enemyBullets.filter(eb => eb.life > 0);

  // --- Update Sandera (Babah Nono) ---
  for (const h of hostages) {
    if (h.freed && h.t < 120) {
      h.t++;
      if (h.t === 30) {
        // Jatuhkan item hadiah
        drops.push({ x: h.x + 40, y: FLOOR - 20, type: h.gift, life: 300 });
      }
    }
  }

  // --- Update Drop Items ---
  for (const d of drops) {
    d.life--;
    if (Math.abs(P.x - d.x) < 45 && Math.abs(P.y - d.y) < 55) {
      d.life = 0;
      sfx.pickup();
      if (d.type === 'H') {
        P.weapon = 'H';
        P.ammo.H = 200;
        speakAnnouncer('Heavy Machine Gun!');
        popText(P.x, P.y - 80, 'HEAVY MACHINE GUN!', '#ff9f1c', 20);
        G.score += 500;
      } else if (d.type === 'R') {
        P.weapon = 'R';
        P.ammo.R = 30;
        speakAnnouncer('Rocket Launcher!');
        popText(P.x, P.y - 80, 'ROCKET LAUNCHER!', '#ff4d5a', 20);
        G.score += 500;
      } else if (d.type === 'food') {
        P.hp = Math.min(P.maxHp, P.hp + 50);
        popText(P.x, P.y - 80, '+50 HP!', '#2ec4b6', 20);
        G.score += 300;
      }
    }
  }
  drops = drops.filter(d => d.life > 0);

  // --- Update Boss Yanto Mech ---
  if (P.x > 2900 && boss.hp > 0) {
    // Kunci kamera di arena bos
    G.camX = 2640;
    if (G.t % 180 === 60) music(2); // Switch ke lagu boss

    if (--boss.shootCd <= 0) {
      boss.shootCd = 110;
      sfx.rocket();
      // Salvo 3 roket ke atas lalu meluncur ke arah player
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          enemyBullets.push({
            x: boss.x - 70, y: boss.y - 140,
            vx: -5 - rand() * 2, vy: (rand() - 0.5) * 2,
            dmg: 18, life: 100, rad: 10
          });
          spark(boss.x - 70, boss.y - 140, '#ff4d5a', 8);
        }, i * 160);
      }
      popText(boss.x - 40, boss.y - 200, 'KERJAIN KUMON!', '#ff4d5a', 16);
    }
  }

  // Update Partikel FX
  for (const e of fx) {
    e.t++; e.life--;
    if (e.type === 'p') { e.x += e.vx; e.y += e.vy; e.vy += 0.2; }
    else if (e.type === 'txt') e.y -= 0.8;
    else if (e.type === 'ring') e.r += e.vr;
  }
  fx = fx.filter(e => e.life > 0);
}

function freeHostage(h) {
  h.freed = true;
  sfx.thankyou();
  popText(h.x, h.y - 70, 'THANK YOU!', '#ffd23f', 20);
  spark(h.x, h.y - 30, '#ffd23f', 12);
  G.score += 1000;
}

function defeatBoss() {
  boss.wreck = true;
  G.shake = 22;
  explosion(boss.x - 40, boss.y - 100, 2.5);
  setTimeout(() => explosion(boss.x + 30, boss.y - 60, 2.0), 200);
  setTimeout(() => explosion(boss.x, boss.y - 120, 2.8), 450);
  sfx.boom();
  speakAnnouncer('Mission Complete!');
  showBanner('MISSION COMPLETE!', 240, '#ffd23f');
  G.score += 10000;
  setTimeout(() => {
    G.mode = 'victory';
    sfx.pickup();
  }, 1800);
}

/* ---------- Rendering ---------- */
function draw() {
  ctx.save();
  if (G.shake > 0) ctx.translate((rand() - 0.5) * G.shake, (rand() - 0.5) * G.shake);

  if (G.mode === 'title') {
    drawTitle();
    ctx.restore();
    return;
  }

  // 1. Gambar Latar Parallax Desert
  drawBackground();

  // 2. Gambar Sandera
  for (const h of hostages) {
    const screenX = h.x - G.camX;
    if (screenX > -100 && screenX < W + 100) {
      const fr = h.freed ? S.items[3] : S.items[2];
      const sc = 110 / fr.h;
      ctx.drawImage(fr.c, screenX - fr.w * sc / 2, h.y - fr.h * sc, fr.w * sc, fr.h * sc);
    }
  }

  // 3. Gambar Tank SV-001 (Jika Belum Dinaiki / Wreck)
  if (!P.inTank) {
    const screenX = tank.x - G.camX;
    if (screenX > -150 && screenX < W + 150) {
      const fr = S.items[tank.shootCd > 0 ? 1 : 0];
      const sc = 140 / fr.h;
      ctx.drawImage(fr.c, screenX - fr.w * sc / 2, tank.y - fr.h * sc + 6, fr.w * sc, fr.h * sc);
      if (!tank.wreck) {
        ctx.fillStyle = '#70e000';
        ctx.font = '10px monospace';
        ctx.fillText('▼ SV-001', screenX - 25, tank.y - 145 + Math.sin(G.t * 0.15) * 4);
      }
    }
  }

  // 4. Gambar Musuh
  for (const e of enemies) {
    const screenX = e.x - G.camX;
    if (screenX > -100 && screenX < W + 100) {
      ctx.save();
      ctx.translate(screenX, e.y);
      ctx.scale(e.face, 1);
      const fr = S.items[e.panic ? 7 : 6];
      const sc = 115 / fr.h;
      ctx.drawImage(fr.c, -fr.w * sc / 2, -fr.h * sc, fr.w * sc, fr.h * sc);
      ctx.restore();
    }
  }

  // 5. Gambar Bos Yanto Mech
  const bossScreenX = boss.x - G.camX;
  if (bossScreenX > -300 && bossScreenX < W + 300) {
    const fr = boss.wreck ? S.boss.wreck : S.boss.mech;
    const sc = 260 / fr.h;
    ctx.drawImage(fr.c, bossScreenX - fr.w * sc / 2, boss.y - fr.h * sc, fr.w * sc, fr.h * sc);

    // Yanto menangis keluar dari mech saat kalah
    if (boss.wreck) {
      const yfr = S.boss.yanto;
      const ysc = 110 / yfr.h;
      ctx.drawImage(yfr.c, bossScreenX + 80, boss.y - yfr.h * ysc, yfr.w * ysc, yfr.h * ysc);
    }
  }

  // 6. Gambar Player (Falisha) / Tank
  if (P.inTank) {
    const screenX = P.x - G.camX;
    const fr = S.items[tank.shootCd > 0 ? 1 : 0];
    const sc = 145 / fr.h;
    ctx.save();
    ctx.translate(screenX, tank.y);
    ctx.scale(P.face, 1);
    ctx.drawImage(fr.c, -fr.w * sc / 2, -fr.h * sc + 6, fr.w * sc, fr.h * sc);
    // Falisha mengintip di kubah tank (frame 11)
    const hfr = S.falisha[11];
    const hsc = 80 / hfr.h;
    ctx.drawImage(hfr.c, -hfr.w * hsc / 2 + 10, -fr.h * sc - 20, hfr.w * hsc, hfr.h * hsc);
    ctx.restore();
  } else {
    const screenX = P.x - G.camX;
    ctx.save();
    ctx.translate(screenX, P.y);
    ctx.scale(P.face, 1);
    if (P.invuln > 0 && P.invuln % 4 < 2) ctx.globalAlpha = 0.5;

    // Pilih Frame Sprite Sesuai Aksi
    let fIdx = 0;
    if (P.hurtT > 0) fIdx = 8;
    else if (!P.onGround) fIdx = 3;
    else if (P.crouch) fIdx = 6;
    else if (P.aimUp) fIdx = 5;
    else if (P.shootCd > 0) fIdx = 4;
    else if (Math.abs(P.vx) > 0.3) fIdx = 1 + ((G.t / 6 | 0) % 2);

    const fr = S.falisha[fIdx];
    const sc = 120 / fr.h;
    ctx.drawImage(fr.c, -fr.w * sc / 2, -fr.h * sc, fr.w * sc, fr.h * sc);
    ctx.restore();
  }

  // 7. Gambar Proyektil & Bom
  for (const b of bullets) {
    ctx.save();
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - G.camX, b.y, b.w, b.h);
    ctx.restore();
  }
  for (const b of bombs) {
    const screenX = b.x - G.camX;
    const fr = S.items[10];
    const sc = (b.isCannon ? 50 : 32) / fr.h;
    ctx.drawImage(fr.c, screenX - fr.w * sc / 2, b.y - fr.h * sc / 2, fr.w * sc, fr.h * sc);
  }
  for (const eb of enemyBullets) {
    ctx.fillStyle = '#ff4d5a';
    ctx.beginPath();
    ctx.arc(eb.x - G.camX, eb.y, eb.rad, 0, 6.28);
    ctx.fill();
  }

  // 8. Gambar Drops (Senjata [H], [R], Food)
  for (const d of drops) {
    const screenX = d.x - G.camX;
    const fr = S.items[d.type === 'H' ? 8 : (d.type === 'R' ? 9 : 11)];
    const sc = 42 / fr.h;
    const bob = Math.sin(G.t * 0.15) * 4;
    ctx.drawImage(fr.c, screenX - fr.w * sc / 2, d.y - fr.h * sc + bob, fr.w * sc, fr.h * sc);
  }

  // 9. Gambar FX
  drawFx();

  // 10. HUD Metal Slug
  drawHUD();

  // 11. Banner Layar
  if (G.bannerT > 0) {
    ctx.save();
    ctx.shadowColor = '#000'; ctx.shadowBlur = 14;
    ctx.font = '36px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = G.bannerColor;
    ctx.fillText(G.banner, W / 2, H / 2 - 20 + Math.sin(G.t * 0.1) * 4);
    ctx.restore();
  }

  if (G.mode === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4d5a'; ctx.font = '36px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('CONTINUE?', W / 2, H / 2 - 30);
    ctx.font = '14px "Press Start 2P"'; ctx.fillStyle = '#ffd23f';
    ctx.fillText(COARSE ? 'Sentuh layar untuk ulang' : 'Tekan Spasi untuk ulang', W / 2, H / 2 + 30);
  } else if (G.mode === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd23f'; ctx.font = '38px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('VICTORY!', W / 2, H / 2 - 50);
    ctx.fillStyle = '#fff'; ctx.font = '18px "Press Start 2P"';
    ctx.fillText('FINAL SCORE: ' + G.score, W / 2, H / 2 + 10);
    ctx.font = '13px "Press Start 2P"'; ctx.fillStyle = '#48cae4';
    ctx.fillText(COARSE ? 'Sentuh untuk ke Menu' : 'Tekan Spasi untuk ke Menu', W / 2, H / 2 + 65);
  }

  ctx.restore();
}

function drawBackground() {
  if (!S.bg) return;
  // Parallax Layer
  const bgW = W;
  const offX = -(G.camX * 0.5) % bgW;
  ctx.drawImage(S.bg, offX, 0, bgW, H);
  if (offX + bgW < W) ctx.drawImage(S.bg, offX + bgW, 0, bgW, H);

  // Tanah / Lantai Sandstone
  ctx.fillStyle = '#a66a38';
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  ctx.fillStyle = '#804d24';
  ctx.fillRect(0, FLOOR + 6, W, 4);
}

function drawHUD() {
  ctx.save();
  // Skor & Nyawa
  ctx.font = '14px "Press Start 2P"';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('1UP FALISHA', 24, 34);
  ctx.fillStyle = '#fff';
  ctx.fillText(String(G.score).padStart(6, '0'), 24, 56);

  // Amunisi Senjata
  const wpnName = P.weapon === 'pistol' ? 'PISTOL' : (P.weapon === 'H' ? 'HMG' : 'ROCKET');
  const ammoStr = P.weapon === 'pistol' ? '∞' : P.ammo[P.weapon];
  ctx.fillStyle = P.weapon === 'pistol' ? '#ffd23f' : '#ff9f1c';
  ctx.fillText(`ARMS: ${wpnName} [${ammoStr}]`, 24, 82);

  // Granat & HP
  ctx.fillStyle = '#ff4d5a';
  ctx.fillText(`BOMB: ${P.ammo.bomb}`, 24, 106);

  // HP Bar Pemain
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W - 240, 20, 210, 22);
  const hpPct = Math.max(0, P.hp / P.maxHp);
  ctx.fillStyle = hpPct > 0.4 ? '#4cd964' : '#ff3b3b';
  ctx.fillRect(W - 238, 22, 206 * hpPct, 18);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.strokeRect(W - 240, 20, 210, 22);
  ctx.font = '10px "Press Start 2P"'; ctx.fillStyle = '#fff';
  ctx.fillText(`HP: ${P.hp}`, W - 225, 36);

  // Status Tank Jika Sedang Dinaiki
  if (P.inTank) {
    ctx.fillStyle = '#70e000';
    ctx.fillText(`TANK ARMOR: ${tank.armor}/${tank.maxArmor}`, W - 240, 62);
  }

  // Boss HP Bar Jika Sedang Hadapi Boss
  if (P.x > 2900 && boss.hp > 0) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W / 2 - 200, 18, 400, 26);
    const bPct = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(W / 2 - 196, 22, 392 * bPct, 18);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, 18, 400, 26);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(`BOSS: YANTO-01 MECH (${boss.hp})`, W / 2, 35);
  }

  ctx.restore();
}

function drawFx() {
  for (const e of fx) {
    if (e.type === 'p') {
      ctx.globalAlpha = Math.max(0, e.life / 20);
      ctx.fillStyle = e.color;
      ctx.fillRect(e.x - G.camX, e.y, e.size, e.size);
      ctx.globalAlpha = 1;
    } else if (e.type === 'txt') {
      ctx.save();
      ctx.globalAlpha = Math.min(1, e.life / 12);
      ctx.font = `${e.size}px "Press Start 2P"`;
      ctx.fillStyle = e.color;
      ctx.shadowColor = '#000'; ctx.shadowBlur = 8;
      ctx.fillText(e.text, e.x - G.camX, e.y);
      ctx.restore();
    } else if (e.type === 'ring') {
      ctx.save();
      ctx.globalAlpha = Math.max(0, e.life / 25);
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(e.x - G.camX, e.y, e.r, 0, 6.28);
      ctx.stroke();
      ctx.restore();
    }
  }
}

function drawTitle() {
  if (S.cover) {
    ctx.drawImage(S.cover, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#1a0f06'; ctx.fillRect(0, 0, W, H);
  }
  const bg = ctx.createLinearGradient(0, H - 150, 0, H);
  bg.addColorStop(0, 'rgba(10,5,2,0)');
  bg.addColorStop(1, 'rgba(10,5,2,0.9)');
  ctx.fillStyle = bg; ctx.fillRect(0, H - 150, W, 150);

  ctx.save();
  ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillStyle = Math.sin(G.t * 0.1) > 0 ? '#ffd23f' : '#fff';
  ctx.fillText(COARSE ? 'SENTUH LAYAR UNTUK MAIN' : 'TEKAN SPASI / ENTER UNTUK MAIN', W / 2, H - 55);
  ctx.font = '10px "Press Start 2P"'; ctx.fillStyle = '#ff9f1c';
  ctx.fillText('FALISHA SLUG: SUPER VEHICLE 001', W / 2, H - 25);
  ctx.restore();
}

/* ---------- Game Loop ---------- */
let last = 0, acc = 0;
function loop(t) {
  acc += Math.min(100, t - last);
  last = t;
  while (acc >= 1000 / 60) {
    update();
    acc -= 1000 / 60;
  }
  draw();
  requestAnimationFrame(loop);
}

loadAssets().then(() => {
  requestAnimationFrame(loop);
}).catch(err => {
  console.error(err);
  document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff;position:fixed;top:10px;left:10px">Gagal memuat aset.</p>');
});

})();
