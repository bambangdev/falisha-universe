/* FALISHA SLUG: SUPER VEHICLE 001
   Remake 2D Arcade Run-and-Gun ala Metal Slug (Neo Geo)
   Fitur: 5 Level Lengkap, Platform Pijakan Nyata, Tank SV-001, Sandera Babah Nono, Boss Yanto Mech */

(() => {
'use strict';

const W = 960, H = 540, FLOOR = 435;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const COARSE = matchMedia('(pointer: coarse)').matches;
const rand = Math.random, sgn = v => (v > 0) - (v < 0);

/* ---------- Musik & Audio Synth ---------- */
const _ = null;
const TRACKS = [
  // 0: Menu Theme
  { bpm: 130, wave: 'square', bass: [48, 48, 51, 53], lead: [72,_,75,77, 79,_,77,75, 72,75,77,_, 80,79,77,75, 72,_,75,77, 84,_,82,79, 77,_,75,_, 72,_,_,_] },
  // 1: Desert & Jungle (Misi 1 & 2)
  { bpm: 142, wave: 'sawtooth', bass: [45, 45, 48, 50], lead: [69,69,_,72, 74,_,72,69, 71,_,74,_, 76,74,72,71, 69,69,_,72, 77,_,76,74, 72,_,71,_, 69,_,_,_] },
  // 2: City & Lab (Misi 3 & 4)
  { bpm: 152, wave: 'square', bass: [48, 45, 48, 53], lead: [72,_,75,_, 79,_,77,75, 72,_,75,_, 80,_,79,77, 72,_,75,_, 84,_,82,79, 77,_,75,_, 72,_,_,_] },
  // 3: Boss Fortress (Misi 5)
  { bpm: 165, wave: 'sawtooth', bass: [40, 43, 40, 45], lead: [64,64,67,64, 70,_,67,64, 63,_,67,_, 72,70,67,63, 64,64,67,64, 76,_,75,72, 70,_,67,_, 64,_,_,_] }
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
  const g = c.getContext('2d');
  g.drawImage(img, x, y, w, h, 0, 0, w, h);
  const d = g.getImageData(0, 0, w, h), p = d.data;
  let minX = w, minY = h, maxX = 0, maxY = 0;
  let nonBgCount = 0;
  for (let i = 0; i < p.length; i += 4) {
    const r = p[i], gr = p[i + 1], b = p[i + 2];
    // Chroma-key deteksi magenta: merah dan biru dominan tinggi, hijau rendah
    if (r > 130 && b > 110 && gr < Math.min(r, b) - 35) {
      p[i + 3] = 0;
    } else {
      nonBgCount++;
      const px = (i / 4) % w, py = (i / 4 / w) | 0;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
    }
  }
  g.putImageData(d, 0, 0);

  // Safeguard: jika gambar kosong atau crop tidak valid, kembalikan seluruh canvas sel
  if (nonBgCount < 40 || maxX <= minX || maxY <= minY) {
    return { c, w, h };
  }

  const tw = maxX - minX + 1, th = maxY - minY + 1;
  const out = document.createElement('canvas'); out.width = tw; out.height = th;
  out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return { c: out, w: tw, h: th };
}

const S = { falisha: [], items: [], boss: {}, bgs: {}, cover: null };

async function loadAssets() {
  const [faImg, itImg, boImg, covImg, desImg, junImg, citImg, labImg, forImg] = await Promise.all([
    loadImg('assets/falisha.jpg'),
    loadImg('assets/items.jpg'),
    loadImg('assets/boss.jpg'),
    loadImg('assets/cover.jpg'),
    loadImg('assets/desert.jpg'),
    loadImg('assets/jungle.jpg'),
    loadImg('assets/city.jpg'),
    loadImg('assets/lab.jpg'),
    loadImg('assets/fortress.jpg')
  ]);

  // 1. Falisha grid (4 cols x 3 rows)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      S.falisha.push(cutSprite(faImg, c * 300 + 4, r * 298 + 4, 292, 290));
    }
  }

  // 2. Items & enemies grid
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      S.items.push(cutSprite(itImg, c * 300 + 4, r * 298 + 4, 292, 290));
    }
  }

  // 3. Boss sprites
  S.boss.mech = cutSprite(boImg, 20, 160, 720, 580);
  S.boss.wreck = cutSprite(boImg, 740, 20, 620, 460);
  S.boss.yanto = cutSprite(boImg, 880, 490, 290, 270);

  // 4. Backgrounds & Cover
  S.cover = covImg;
  S.bgs = {
    desert: desImg,
    jungle: junImg,
    city: citImg,
    lab: labImg,
    fortress: forImg
  };
}

/* ---------- 5 Level Definitions ---------- */
const MISSIONS = [
  {
    num: 1,
    title: 'MISI 1: LEMBAH GURUN',
    bg: 'desert',
    len: 2300,
    groundType: 'sand',
    music: 1,
    platforms: [
      { x0: 360, x1: 640, y: 340, type: 'wood' },
      { x0: 760, x1: 1060, y: 270, type: 'wood' },
      { x0: 1180, x1: 1450, y: 350, type: 'sandbag' },
      { x0: 1560, x1: 1860, y: 290, type: 'wood' }
    ],
    hostages: [
      { id: 1, x: 500, y: 340, gift: 'H' },
      { id: 2, x: 1300, y: 350, gift: 'food' }
    ],
    enemies: [
      { type: 'soldier', x: 450, y: 340, hp: 2 },
      { type: 'soldier', x: 720, y: FLOOR, hp: 2 },
      { type: 'soldier', x: 920, y: 270, hp: 2 },
      { type: 'chopper', x: 1120, y: 180, hp: 6 },
      { type: 'soldier', x: 1380, y: FLOOR, hp: 2 },
      { type: 'soldier', x: 1680, y: 290, hp: 2 },
      { type: 'chopper', x: 2020, y: 170, isMiniBoss: true, hp: 16 }
    ],
    hasTank: true,
    tankX: 340 // Tank SV-001 terparkir di Misi 1 siap dinaiki!
  },
  {
    num: 2,
    title: 'MISI 2: HUTAN TROPIK',
    bg: 'jungle',
    len: 2400,
    groundType: 'grass',
    music: 1,
    platforms: [
      { x0: 340, x1: 620, y: 340, type: 'wood' },
      { x0: 720, x1: 1000, y: 260, type: 'wood' },
      { x0: 1100, x1: 1380, y: 330, type: 'wood' },
      { x0: 1500, x1: 1820, y: 270, type: 'wood' }
    ],
    hostages: [
      { id: 1, x: 480, y: 340, gift: 'R' },
      { id: 2, x: 1240, y: 330, gift: 'H' },
      { id: 3, x: 1660, y: 270, gift: 'food' }
    ],
    enemies: [
      { type: 'soldier', x: 500, y: 340, hp: 2 },
      { type: 'soldier', x: 780, y: 260, hp: 2 },
      { type: 'chopper', x: 950, y: 170, hp: 6 },
      { type: 'soldier', x: 1200, y: FLOOR, hp: 2 },
      { type: 'soldier', x: 1600, y: 270, hp: 2 },
      { type: 'chopper', x: 2100, y: 170, isMiniBoss: true, hp: 20 }
    ],
    hasTank: true,
    tankX: 380
  },
  {
    num: 3,
    title: 'MISI 3: KOTA KILAT',
    bg: 'city',
    len: 2500,
    groundType: 'steel',
    music: 2,
    platforms: [
      { x0: 350, x1: 680, y: 340, type: 'steel' },
      { x0: 780, x1: 1100, y: 270, type: 'steel' },
      { x0: 1220, x1: 1540, y: 330, type: 'steel' },
      { x0: 1660, x1: 2000, y: 260, type: 'steel' }
    ],
    hostages: [
      { id: 1, x: 520, y: 340, gift: 'H' },
      { id: 2, x: 1380, y: 330, gift: 'R' }
    ],
    enemies: [
      { type: 'soldier', x: 500, y: 340, hp: 3 },
      { type: 'soldier', x: 820, y: 270, hp: 3 },
      { type: 'chopper', x: 1050, y: 180, hp: 6 },
      { type: 'soldier', x: 1350, y: 330, hp: 3 },
      { type: 'soldier', x: 1800, y: 260, hp: 3 },
      { type: 'chopper', x: 2200, y: 170, isMiniBoss: true, hp: 20 }
    ],
    hasTank: true,
    tankX: 420 // Tank SV-001 terparkir di Misi 3!
  },
  {
    num: 4,
    title: 'MISI 4: PABRIK PETIR',
    bg: 'lab',
    len: 2500,
    groundType: 'hazard',
    music: 2,
    platforms: [
      { x0: 320, x1: 660, y: 330, type: 'hazard' },
      { x0: 780, x1: 1120, y: 260, type: 'hazard' },
      { x0: 1240, x1: 1600, y: 330, type: 'hazard' },
      { x0: 1720, x1: 2100, y: 270, type: 'hazard' }
    ],
    hostages: [
      { id: 1, x: 500, y: 330, gift: 'H' },
      { id: 2, x: 960, y: 260, gift: 'R' },
      { id: 3, x: 1420, y: 330, gift: 'food' }
    ],
    enemies: [
      { type: 'soldier', x: 480, y: 330, hp: 3 },
      { type: 'soldier', x: 880, y: 260, hp: 3 },
      { type: 'chopper', x: 1100, y: 180, hp: 6 },
      { type: 'soldier', x: 1450, y: 330, hp: 3 },
      { type: 'soldier', x: 1900, y: 270, hp: 3 },
      { type: 'chopper', x: 2250, y: 170, isMiniBoss: true, hp: 24 }
    ],
    hasTank: true,
    tankX: 1150
  },
  {
    num: 5,
    title: 'MISI FINAL: BENTENG YANTO',
    bg: 'fortress',
    len: 1800,
    groundType: 'steel',
    music: 3,
    platforms: [
      { x0: 250, x1: 580, y: 340, type: 'steel' },
      { x0: 680, x1: 1000, y: 260, type: 'steel' },
      { x0: 1100, x1: 1420, y: 330, type: 'steel' }
    ],
    hostages: [
      { id: 1, x: 420, y: 340, gift: 'H' },
      { id: 2, x: 840, y: 260, gift: 'R' }
    ],
    enemies: [
      { type: 'soldier', x: 380, y: 340, hp: 3 },
      { type: 'soldier', x: 780, y: 260, hp: 3 }
    ],
    hasTank: true,
    tankX: 300, // Tank siap untuk pertempuran puncak!
    isFinalBoss: true,
    bossX: 1350
  }
];

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
    touchState.left = !!l; touchState.right = !!r; touchState.up = !!u; touchState.down = !!d;
    spans.left?.classList.toggle('on', !!l);
    spans.right?.classList.toggle('on', !!r);
    spans.up?.classList.toggle('on', !!u);
    spans.down?.classList.toggle('on', !!d);
  };
  const handlePoint = (clientX, clientY) => {
    const b = dpad.getBoundingClientRect();
    const cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const dx = clientX - cx, dy = clientY - cy;
    const dist = Math.hypot(dx, dy);
    const deadzone = b.width * 0.12;
    if (dist < deadzone) { setDir(false, false, false, false); return; }
    const thresh = b.width * 0.14;
    setDir(dx < -thresh, dx > thresh, dy < -thresh, dy > thresh);
  };
  dpad.addEventListener('pointerdown', e => {
    e.preventDefault();
    dpad.setPointerCapture?.(e.pointerId);
    gesture();
    handlePoint(e.clientX, e.clientY);
  });
  dpad.addEventListener('pointermove', e => {
    if (e.buttons > 0 || e.pressure > 0 || e.isPrimary) {
      handlePoint(e.clientX, e.clientY);
    }
  });
  const off = e => {
    e.preventDefault();
    setDir(false, false, false, false);
  };
  dpad.addEventListener('pointerup', off);
  dpad.addEventListener('pointercancel', off);
  dpad.addEventListener('pointerleave', off);
})();

document.getElementById('btn-mute').onclick = e => { e.stopPropagation(); setMuted(!Chip.isMuted()); };
document.getElementById('btn-full').onclick = e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};

/* ---------- Game State ---------- */
const G = {
  mode: 'title', // title, playing, stage_clear, gameover, victory
  currentMissionIdx: 0,
  camX: 0,
  score: 0,
  t: 0,
  shake: 0,
  banner: '',
  bannerT: 0,
  bannerColor: '#ffd23f',
  clearTimer: 0
};

let currentMis = MISSIONS[0];
let P = null, tank = null, boss = null;
let bullets = [], enemyBullets = [], bombs = [], fx = [], hostages = [], enemies = [], drops = [];

function showBanner(text, dur = 100, color = '#ffd23f') {
  G.banner = text; G.bannerT = dur; G.bannerColor = color;
}

// Deteksi Pijakan Platform
function getGroundSurface(x, curY, prevY) {
  let highest = FLOOR;
  for (const plat of currentMis.platforms) {
    if (x >= plat.x0 - 20 && x <= plat.x1 + 20) {
      // Cek pendaratan dari atas
      if (prevY <= plat.y + 6 && curY >= plat.y - 4 && plat.y < highest) {
        highest = plat.y;
      }
    }
  }
  return highest;
}

function loadMission(idx) {
  G.currentMissionIdx = idx;
  currentMis = MISSIONS[idx];
  G.camX = 0;
  G.clearTimer = 0;

  // Preserve player weapon and ammo across stages if continuing
  const prevWpn = P ? P.weapon : 'pistol';
  const prevAmmo = P ? { ...P.ammo } : { H: 0, R: 0, bomb: 10 };
  const prevHp = P ? Math.max(50, P.hp) : 100;

  P = {
    x: 100, y: FLOOR, vx: 0, vy: 0, onGround: true, face: 1,
    aimUp: false, crouch: false,
    weapon: prevWpn,
    ammo: prevAmmo,
    shootCd: 0,
    inTank: false,
    hp: prevHp, maxHp: 100,
    invuln: 60, hurtT: 0,
    state: 'idle'
  };

  // Tank setup for this mission
  if (currentMis.hasTank) {
    tank = {
      x: currentMis.tankX, y: FLOOR, vx: 0,
      active: false,
      armor: 3, maxArmor: 3,
      shootCd: 0,
      wreck: false
    };
  } else {
    tank = null;
  }

  // Boss setup for Final Mission
  if (currentMis.isFinalBoss) {
    boss = {
      x: currentMis.bossX, y: FLOOR - 10,
      hp: 130, maxHp: 130,
      phase: 1,
      shootCd: 100,
      wreck: false,
      yantoState: 'hidden'
    };
  } else {
    boss = null;
  }

  // Load Hostages (Babah Nono)
  hostages = currentMis.hostages.map(h => ({
    ...h, freed: false, t: 0
  }));

  // Load Enemies
  enemies = currentMis.enemies.map(e => ({
    ...e, face: -1, cd: 60 + (rand() * 40 | 0), panic: false, vx: 0
  }));

  bullets = []; enemyBullets = []; bombs = []; drops = [];
  G.mode = 'playing';

  showBanner(`${currentMis.title}... START!`, 110, '#ffd23f');
  speakAnnouncer(`Mission ${currentMis.num}... Start!`);
  music(currentMis.music);
}

function initGame() {
  G.score = 0;
  loadMission(0);
}

/* ---------- Partikel & Ledakan FX ---------- */
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
  if (G.mode === 'gameover') {
    if (confirmReq && G.t > 40) { confirmReq = false; G.mode = 'title'; G.t = 0; music(0); }
    return;
  }
  if (G.mode === 'victory') {
    if (confirmReq && G.t > 60) { confirmReq = false; G.mode = 'title'; G.t = 0; music(0); }
    return;
  }
  if (G.mode === 'stage_clear') {
    G.clearTimer++;
    // Hanya pindah stage jika pemain menekan confirmReq (Spasi / Enter / Sentuh Layar)
    // dan sudah tampil minimal 45 frame (0.75 detik) agar pemain dapat membaca ringkasan misi
    if (confirmReq && G.clearTimer > 45) {
      confirmReq = false;
      sfx.select();
      if (G.currentMissionIdx + 1 < MISSIONS.length) {
        loadMission(G.currentMissionIdx + 1);
      } else {
        G.mode = 'victory';
        sfx.pickup();
        speakAnnouncer('All Missions Complete! You are a hero!');
      }
    }
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
  const nearTank = tank && Math.abs(P.x - tank.x) < 80 && !tank.wreck && !P.inTank;
  document.getElementById('btn-slug')?.classList.toggle('ready', nearTank || P.inTank);

  if (kSlug && !P.slugKeyLock && tank) {
    P.slugKeyLock = true;
    if (P.inTank) {
      P.inTank = false;
      tank.active = false;
      P.vy = -8; P.y -= 30;
      sfx.enterSlug();
      popText(P.x, P.y - 60, 'SLUG OUT!', '#48cae4', 16);
    } else if (nearTank) {
      P.inTank = true;
      tank.active = true;
      sfx.enterSlug();
      popText(tank.x, tank.y - 70, 'SLUG IN!', '#70e000', 18);
    }
  }
  if (!kSlug) P.slugKeyLock = false;

  // Gerakan Pemain
  if (P.inTank && tank) {
    // Mode Dalam Tank
    const sp = 4.3;
    tank.vx = (kRight ? 1 : 0) - (kLeft ? 1 : 0);
    tank.x += tank.vx * sp;
    tank.x = Math.max(G.camX + 60, Math.min(G.camX + W - 70, tank.x));
    if (tank.vx !== 0) P.face = tank.vx;
    P.x = tank.x; P.y = tank.y; P.onGround = true;

    // Tembak Vulcan Cannon
    if (tank.shootCd > 0) tank.shootCd--;
    if (kFire && tank.shootCd <= 0) {
      tank.shootCd = 6;
      sfx.hmg();
      bullets.push({ x: tank.x + P.face * 55, y: tank.y - 34, vx: P.face * 16, vy: (rand() - 0.5) * 1.5, dmg: 3, w: 20, h: 8, life: 60, color: '#ffb703' });
      bullets.push({ x: tank.x + P.face * 55, y: tank.y - 44, vx: P.face * 16, vy: (rand() - 0.5) * 1.5, dmg: 3, w: 20, h: 8, life: 60, color: '#ffb703' });
      spark(tank.x + P.face * 60, tank.y - 38, '#ffe55c', 4);
    }

    // Tembak Meriam Tank (Cannon Shell)
    if (kBomb && !P.bombKeyLock && P.ammo.bomb > 0) {
      P.bombKeyLock = true;
      P.ammo.bomb--;
      sfx.cannon();
      G.shake = 14;
      bombs.push({ x: tank.x + P.face * 65, y: tank.y - 45, vx: P.face * 14, vy: -3, dmg: 24, rad: 85, isCannon: true, life: 70 });
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

    const prevY = P.y;

    // Lompat
    if (kJump && P.onGround && !P.crouch) {
      P.vy = -12.5;
      P.onGround = false;
      sfx.grenade();
    }

    // Fisika Gravitasi & Pijakan Platform
    if (!P.onGround) {
      P.vy += 0.65;
      P.y += P.vy;
      const groundY = getGroundSurface(P.x, P.y, prevY);
      if (P.y >= groundY) {
        P.y = groundY;
        P.vy = 0;
        P.onGround = true;
      }
    } else {
      // Cek apakah pemain melangkah jatuh dari platform
      const groundY = getGroundSurface(P.x, P.y + 4, P.y);
      if (P.y < groundY && !kJump) {
        P.onGround = false;
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

  // Kamera scrolling
  const maxCam = currentMis.len - W;
  const activeMini = enemies.find(e => e.isMiniBoss && e.hp > 0);
  if (activeMini && P.x >= activeMini.x - 520) {
    // Kunci kamera di arena pertarungan mini-boss hingga dikalahkan
    const lockCam = Math.min(maxCam, activeMini.x - 480);
    if (G.camX < lockCam) G.camX = Math.min(lockCam, G.camX + 3.8);
    P.x = Math.max(G.camX + 30, Math.min(G.camX + W - 40, P.x));
  } else if (P.x - G.camX > W * 0.45 && G.camX < maxCam && (!boss || boss.hp <= 0 || P.x < 1100)) {
    G.camX = Math.min(maxCam, P.x - W * 0.45);
  }

  // --- Update Proyektil Player ---
  for (const b of bullets) {
    b.life--;
    if (b.isRocket) {
      const target = enemies.find(e => Math.hypot(e.x - b.x, e.y - b.y) < 280) || (boss && boss.hp > 0 && b.x > boss.x - 200 ? boss : null);
      if (target) {
        const angle = Math.atan2(target.y - 40 - b.y, target.x - b.x);
        b.vx += Math.cos(angle) * 0.8;
        b.vy += Math.sin(angle) * 0.8;
      }
      if (b.life % 2 === 0) addFx({ type: 'p', x: b.x, y: b.y, vx: -b.vx * 0.3, vy: (rand() - 0.5) * 2, life: 10, color: '#ced4da', size: 5 });
    }
    b.x += b.vx; b.y += b.vy;

    // Hit Musuh
    for (const e of enemies) {
      if (Math.abs(b.x - e.x) < 34 && Math.abs(b.y - (e.y - 45)) < 45) {
        b.life = 0;
        e.hp -= b.dmg;
        spark(b.x, b.y, '#ffd23f', 6);
        if (b.isRocket) explosion(b.x, b.y, 0.8);
        if (e.hp <= 0 && !e.panic) {
          e.panic = true; e.vx = P.face * 4;
          G.score += e.isMiniBoss ? 800 : 100;
          popText(e.x, e.y - 60, e.isMiniBoss ? '+800' : '+100', '#ffd23f', 16);
          spark(e.x, e.y - 30, '#ff4d5a', 10);
        }
      }
    }

    // Hit Boss Yanto Mech (Misi 5)
    if (boss && boss.hp > 0 && Math.abs(b.x - boss.x) < 140 && b.y > boss.y - 180 && b.y < boss.y) {
      b.life = 0;
      boss.hp -= b.dmg;
      spark(b.x, b.y, '#ff4d5a', 8);
      if (b.isRocket) explosion(b.x, b.y, 1.1);
      if (boss.hp <= 0) defeatBoss();
    }

    // Hit Tali Sandera
    for (const h of hostages) {
      if (!h.freed && Math.abs(b.x - h.x) < 32 && Math.abs(b.y - (h.y - 35)) < 35) {
        b.life = 0;
        freeHostage(h);
      }
    }
  }
  bullets = bullets.filter(b => b.life > 0 && b.x > G.camX - 50 && b.x < G.camX + W + 50);

  // --- Update Bom ---
  for (const b of bombs) {
    b.life--; b.x += b.vx; b.vy += 0.55; b.y += b.vy;
    if (b.y >= FLOOR - 10) {
      b.y = FLOOR - 10; b.vy = -b.vy * 0.45; b.vx *= 0.7;
    }
    if (b.life <= 0 || (b.isCannon && b.life < 55 && b.y >= FLOOR - 20)) {
      b.life = 0;
      explosion(b.x, b.y, b.isCannon ? 1.8 : 1.3);
      for (const e of enemies) {
        if (Math.hypot(e.x - b.x, e.y - b.y) < b.rad) {
          e.hp -= b.dmg;
          if (e.hp <= 0 && !e.panic) { e.panic = true; e.vx = P.face * 5; G.score += 150; popText(e.x, e.y - 60, '+150', '#ffd23f', 16); }
        }
      }
      if (boss && boss.hp > 0 && Math.hypot(boss.x - b.x, boss.y - 80 - b.y) < b.rad + 80) {
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
    if (e.panic) { e.x += e.vx; continue; }
    const dist = P.x - e.x;
    e.face = sgn(dist) || -1;

    if (e.type === 'chopper') {
      e.x += Math.sin(G.t * 0.04) * 2;
      if (--e.cd <= 0 && Math.abs(dist) < 320) {
        e.cd = 90;
        enemyBullets.push({ x: e.x, y: e.y + 20, vx: 0, vy: 4.5, dmg: 14, life: 80, rad: 8 });
        sfx.pistol();
      }
    } else {
      if (--e.cd <= 0 && Math.abs(dist) < 360) {
        e.cd = 100 + (rand() * 40 | 0);
        enemyBullets.push({ x: e.x + e.face * 30, y: e.y - 50, vx: e.face * 6, vy: 0, dmg: 12, life: 75, rad: 6 });
        sfx.pistol();
      }
    }
  }

  // Hapus musuh panik/kalah yang sudah terlempar jauh keluar layar
  enemies = enemies.filter(e => !(e.panic && (e.x < G.camX - 150 || e.x > G.camX + W + 150)));

  // --- Update Peluru Musuh ---
  for (const eb of enemyBullets) {
    eb.life--; eb.x += eb.vx; eb.y += eb.vy;
    if (P.inTank && tank) {
      if (Math.abs(eb.x - tank.x) < 65 && Math.abs(eb.y - (tank.y - 50)) < 45) {
        eb.life = 0; tank.armor--; sfx.hit(); spark(eb.x, eb.y, '#48cae4', 10);
        popText(tank.x, tank.y - 90, 'ARMOR -1', '#ff4d5a', 16);
        if (tank.armor <= 0) {
          tank.wreck = true; P.inTank = false; tank.active = false; P.vy = -10;
          explosion(tank.x, tank.y - 40, 1.6);
          popText(P.x, P.y - 80, 'TANK DOWN!', '#ff4d5a', 20);
        }
      }
    } else {
      if (P.invuln <= 0 && Math.abs(eb.x - P.x) < 28 && Math.abs(eb.y - (P.y - 50)) < 45) {
        eb.life = 0; P.hp -= eb.dmg; P.invuln = 45; P.hurtT = 16; sfx.hit();
        spark(P.x, P.y - 45, '#ff4d5a', 10);
        popText(P.x, P.y - 80, '-' + eb.dmg, '#ff4d5a', 18);
        if (P.hp <= 0) {
          G.mode = 'gameover'; sfx.ko(); speakAnnouncer('Game Over');
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
        drops.push({ x: h.x + 35, y: h.y - 20, type: h.gift, life: 350 });
      }
    }
  }

  // --- Update Drops ---
  for (const d of drops) {
    d.life--;
    if (Math.abs(P.x - d.x) < 45 && Math.abs(P.y - d.y) < 55) {
      d.life = 0; sfx.pickup();
      if (d.type === 'H') {
        P.weapon = 'H'; P.ammo.H = 200; speakAnnouncer('Heavy Machine Gun!');
        popText(P.x, P.y - 80, 'HEAVY MACHINE GUN!', '#ff9f1c', 20); G.score += 500;
      } else if (d.type === 'R') {
        P.weapon = 'R'; P.ammo.R = 30; speakAnnouncer('Rocket Launcher!');
        popText(P.x, P.y - 80, 'ROCKET LAUNCHER!', '#ff4d5a', 20); G.score += 500;
      } else if (d.type === 'food') {
        P.hp = Math.min(P.maxHp, P.hp + 50); popText(P.x, P.y - 80, '+50 HP!', '#2ec4b6', 20); G.score += 300;
      }
    }
  }
  drops = drops.filter(d => d.life > 0);

  // --- Cek Selesai Misi (Clear Stage) ---
  if (!currentMis.isFinalBoss) {
    // Selesai misi hanya jika sampai di helikopter evakuasi dan mini-boss telah kalah
    const miniBoss = enemies.find(e => e.isMiniBoss);
    const finishX = currentMis.len - 140;
    const miniBossDead = !miniBoss || miniBoss.hp <= 0;
    if (P.x >= finishX && miniBossDead) {
      G.mode = 'stage_clear';
      G.clearTimer = 0;
      sfx.thankyou();
      showBanner(`MISI ${currentMis.num} SELESAI!`, 180, '#ffd23f');
      speakAnnouncer('Mission Complete!');
    }
  } else if (boss && boss.hp > 0) {
    // Misi 5: Boss Yanto
    if (P.x > 800) {
      G.camX = Math.min(G.camX, currentMis.len - W);
      if (--boss.shootCd <= 0) {
        boss.shootCd = 110;
        sfx.rocket();
        for (let i = 0; i < 4; i++) {
          setTimeout(() => {
            enemyBullets.push({
              x: boss.x - 70, y: boss.y - 140,
              vx: -5.5 - rand() * 2, vy: (rand() - 0.5) * 3,
              dmg: 18, life: 100, rad: 10
            });
            spark(boss.x - 70, boss.y - 140, '#ff4d5a', 8);
          }, i * 140);
        }
        popText(boss.x - 40, boss.y - 200, 'KERJAIN KUMON!', '#ff4d5a', 16);
      }
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
  G.shake = 24;
  explosion(boss.x - 40, boss.y - 100, 2.5);
  setTimeout(() => explosion(boss.x + 30, boss.y - 60, 2.0), 200);
  setTimeout(() => explosion(boss.x, boss.y - 120, 2.8), 450);
  sfx.boom();
  speakAnnouncer('All Missions Complete! Victory!');
  showBanner('ALL MISSIONS COMPLETE!', 240, '#ffd23f');
  G.score += 20000;
  setTimeout(() => {
    G.mode = 'victory';
    sfx.pickup();
  }, 1900);
}

/* ---------- Rendering & Platform Footing ---------- */
function draw() {
  ctx.save();
  if (G.shake > 0) ctx.translate((rand() - 0.5) * G.shake, (rand() - 0.5) * G.shake);

  if (G.mode === 'title') {
    drawTitle();
    ctx.restore();
    return;
  }

  // 1. Gambar Latar Belakang Parallax
  drawParallaxBackground();

  // 2. Gambar Seluruh Pijakan (Platforms) Bertingkat
  drawPlatforms();

  // 2b. Gambar Helikopter Evakuasi di Akhir Stage
  if (!currentMis.isFinalBoss) {
    const extX = currentMis.len - 100 - G.camX;
    if (extX > -150 && extX < W + 150) {
      drawExtractionPost(extX);
    }
  }

  // 3. Gambar Sandera Babah Nono
  for (const h of hostages) {
    const screenX = h.x - G.camX;
    if (screenX > -100 && screenX < W + 100) {
      drawShadow(screenX, h.y, 22);
      const fr = h.freed ? S.items[3] : S.items[2];
      const sc = 110 / fr.h;
      ctx.drawImage(fr.c, screenX - fr.w * sc / 2, h.y - fr.h * sc, fr.w * sc, fr.h * sc);
    }
  }

  // 4. Gambar Tank SV-001 (Jika Belum Dinaiki)
  if (tank && !P.inTank) {
    const screenX = tank.x - G.camX;
    if (screenX > -150 && screenX < W + 150) {
      drawShadow(screenX, tank.y, 45);
      const fr = S.items[tank.shootCd > 0 ? 1 : 0];
      const sc = 140 / fr.h;
      ctx.drawImage(fr.c, screenX - fr.w * sc / 2, tank.y - fr.h * sc + 6, fr.w * sc, fr.h * sc);
      if (!tank.wreck) {
        ctx.fillStyle = '#70e000'; ctx.font = '10px monospace';
        ctx.fillText('▼ SV-001 (SLUG)', screenX - 45, tank.y - 145 + Math.sin(G.t * 0.15) * 4);
      }
    }
  }

  // 5. Gambar Musuh
  for (const e of enemies) {
    const screenX = e.x - G.camX;
    if (screenX > -100 && screenX < W + 100) {
      if (e.type === 'chopper') {
        drawGunship(screenX, e.y, e);
      } else {
        drawShadow(screenX, e.y, 24);
        ctx.save();
        ctx.translate(screenX, e.y);
        ctx.scale(e.face, 1);
        const fr = S.items[e.panic ? 7 : 6];
        const sc = 115 / fr.h;
        ctx.drawImage(fr.c, -fr.w * sc / 2, -fr.h * sc, fr.w * sc, fr.h * sc);
        ctx.restore();
      }
    }
  }

  // 6. Gambar Boss Yanto Mech (Misi 5)
  if (boss) {
    const bossScreenX = boss.x - G.camX;
    if (bossScreenX > -300 && bossScreenX < W + 300) {
      drawShadow(bossScreenX, boss.y, 80);
      const fr = boss.wreck ? S.boss.wreck : S.boss.mech;
      const sc = 260 / fr.h;
      ctx.drawImage(fr.c, bossScreenX - fr.w * sc / 2, boss.y - fr.h * sc, fr.w * sc, fr.h * sc);

      if (boss.wreck) {
        const yfr = S.boss.yanto;
        const ysc = 110 / yfr.h;
        ctx.drawImage(yfr.c, bossScreenX + 80, boss.y - yfr.h * ysc, yfr.w * ysc, yfr.h * ysc);
      }
    }
  }

  // 7. Gambar Player (Falisha) / Tank
  if (P.inTank && tank) {
    const screenX = P.x - G.camX;
    drawShadow(screenX, tank.y, 50);
    const fr = S.items[tank.shootCd > 0 ? 1 : 0];
    const sc = 145 / fr.h;
    ctx.save();
    ctx.translate(screenX, tank.y);
    ctx.scale(P.face, 1);
    ctx.drawImage(fr.c, -fr.w * sc / 2, -fr.h * sc + 6, fr.w * sc, fr.h * sc);
    // Falisha mengintip di kubah tank
    const hfr = S.falisha[11];
    const hsc = 80 / hfr.h;
    ctx.drawImage(hfr.c, -hfr.w * hsc / 2 + 10, -fr.h * sc - 20, hfr.w * hsc, hfr.h * hsc);
    ctx.restore();
  } else {
    const screenX = P.x - G.camX;
    drawShadow(screenX, P.y, P.crouch ? 28 : 22);

    ctx.save();
    ctx.translate(screenX, P.y);
    ctx.scale(P.face, 1);
    if (P.invuln > 0 && P.invuln % 4 < 2) ctx.globalAlpha = 0.5;

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

  // 8. Gambar Proyektil & Bom
  for (const b of bullets) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x - G.camX, b.y, b.w, b.h);
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

  // 9. Gambar Drops Item
  for (const d of drops) {
    const screenX = d.x - G.camX;
    drawShadow(screenX, d.y, 16);
    const fr = S.items[d.type === 'H' ? 8 : (d.type === 'R' ? 9 : 11)];
    const sc = 42 / fr.h;
    const bob = Math.sin(G.t * 0.15) * 4;
    ctx.drawImage(fr.c, screenX - fr.w * sc / 2, d.y - fr.h * sc + bob, fr.w * sc, fr.h * sc);
  }

  // 10. Gambar FX
  drawFx();

  // 11. HUD Metal Slug
  drawHUD();

  // 12. Banners & Overlays
  if (G.bannerT > 0) {
    ctx.save();
    ctx.shadowColor = '#000'; ctx.shadowBlur = 14;
    ctx.font = '32px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = G.bannerColor;
    ctx.fillText(G.banner, W / 2, H / 2 - 20 + Math.sin(G.t * 0.1) * 4);
    ctx.restore();
  }

  if (G.mode === 'stage_clear') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);

    // Kartu Hasil Misi Metal Slug
    const boxW = 660, boxH = 340;
    const bx = W / 2 - boxW / 2, by = H / 2 - boxH / 2;
    ctx.fillStyle = '#140c06'; ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#ff9933'; ctx.lineWidth = 4; ctx.strokeRect(bx, by, boxW, boxH);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1; ctx.strokeRect(bx + 6, by + 6, boxW - 12, boxH - 12);

    ctx.fillStyle = '#ffd23f'; ctx.font = '26px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('MISSION COMPLETE!', W / 2, by + 55);

    ctx.font = '13px "Press Start 2P"'; ctx.fillStyle = '#ff9f1c';
    ctx.fillText(currentMis.title, W / 2, by + 95);

    ctx.font = '12px "Press Start 2P"'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    const freedCount = hostages.filter(h => h.freed).length;
    ctx.fillText(`• SANDERA DISELAMATKAN : ${freedCount} / ${hostages.length}`, bx + 60, by + 150);
    ctx.fillText(`• SENJATA TERAKHIR     : ${P.weapon.toUpperCase()}`, bx + 60, by + 185);
    ctx.fillText(`• TOTAL SKOR SAAT INI  : ${G.score}`, bx + 60, by + 220);

    const blink = Math.sin(G.t * 0.12) > 0;
    ctx.textAlign = 'center';
    ctx.font = '12px "Press Start 2P"';
    ctx.fillStyle = blink ? '#70e000' : '#fff';
    ctx.fillText(COARSE ? '▶ SENTUH LAYAR UNTUK MISI SELANJUTNYA ◀' : '▶ TEKAN SPASI / ENTER UNTUK LANJUT ◀', W / 2, by + 295);
    ctx.restore();
  } else if (G.mode === 'gameover') {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff4d5a'; ctx.font = '36px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('CONTINUE?', W / 2, H / 2 - 30);
    ctx.font = '14px "Press Start 2P"'; ctx.fillStyle = '#ffd23f';
    ctx.fillText(COARSE ? 'Sentuh layar untuk ulang' : 'Tekan Spasi untuk ulang', W / 2, H / 2 + 30);
  } else if (G.mode === 'victory') {
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd23f'; ctx.font = '36px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('SELURUH 5 MISI TAMAT!', W / 2, H / 2 - 50);
    ctx.fillStyle = '#fff'; ctx.font = '18px "Press Start 2P"';
    ctx.fillText('TOTAL SKOR AKHIR: ' + G.score, W / 2, H / 2 + 10);
    ctx.font = '13px "Press Start 2P"'; ctx.fillStyle = '#48cae4';
    ctx.fillText(COARSE ? 'Sentuh untuk ke Menu' : 'Tekan Spasi untuk ke Menu', W / 2, H / 2 + 65);
  }

  ctx.restore();
}

function drawShadow(x, y, rad = 22) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, rad, 6, 0, 0, 6.28);
  ctx.fill();
  ctx.restore();
}

// Gambar Pesawat Tempur / Gunship Chopper ala Metal Slug
function drawGunship(x, y, e) {
  ctx.save();
  const isMini = !!e.isMiniBoss;
  const sz = isMini ? 1.35 : 1.0;
  ctx.translate(x, y);

  // Bayangan tanah tegap
  drawShadow(0, FLOOR - y, isMini ? 45 : 32);

  // Bobbing helikopter
  const bob = Math.sin(G.t * 0.08 + (e.x % 10)) * 4;
  ctx.translate(0, bob);

  // Arah hadap (menghadap player)
  ctx.scale(e.face, 1);

  // 1. Baling-Baling Utama (Rotor Blades)
  const rotorW = (isMini ? 95 : 68) * Math.cos(G.t * 0.7);
  ctx.strokeStyle = '#1b263b'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-rotorW, -34 * sz); ctx.lineTo(rotorW, -34 * sz);
  ctx.stroke();

  // Rotor Hub
  ctx.fillStyle = '#415a77';
  ctx.fillRect(-6 * sz, -32 * sz, 12 * sz, 9 * sz);

  // 2. Ekor Helikopter (Tail Boom & Tail Rotor)
  ctx.fillStyle = isMini ? '#7f1d1d' : '#2b4129';
  ctx.fillRect(18 * sz, -12 * sz, 44 * sz, 9 * sz);
  // Tail fin
  ctx.beginPath();
  ctx.moveTo(56 * sz, -12 * sz); ctx.lineTo(62 * sz, -26 * sz); ctx.lineTo(66 * sz, -8 * sz);
  ctx.fill();
  // Tail rotor spin
  const tailR = 12 * Math.sin(G.t * 0.8);
  ctx.strokeStyle = '#222'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(64 * sz, -20 * sz - tailR); ctx.lineTo(64 * sz, -20 * sz + tailR);
  ctx.stroke();

  // 3. Badan Helikopter (Fuselage)
  ctx.fillStyle = isMini ? '#991b1b' : '#3d5a40';
  ctx.beginPath();
  ctx.ellipse(0, 0, 36 * sz, 20 * sz, 0, 0, 6.28);
  ctx.fill();
  ctx.strokeStyle = isMini ? '#f87171' : '#588157'; ctx.lineWidth = 2.5;
  ctx.stroke();

  // 4. Kaca Kokpit
  ctx.fillStyle = isMini ? 'rgba(254, 202, 202, 0.9)' : 'rgba(72, 202, 228, 0.85)';
  ctx.beginPath();
  ctx.ellipse(-16 * sz, -4 * sz, 15 * sz, 11 * sz, -0.2, 0, 6.28);
  ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

  // Siluet pilot
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-14 * sz, -3 * sz, 4 * sz, 0, 6.28);
  ctx.fill();

  // 5. Sayap Senjata & Pod Roket
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10 * sz, 8 * sz, 24 * sz, 6 * sz);
  ctx.fillStyle = '#475569';
  ctx.fillRect(-14 * sz, 11 * sz, 20 * sz, 8 * sz);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-16 * sz, 12 * sz, 3 * sz, 6 * sz);

  // 6. Moncong Meriam Vulcan di depan
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-38 * sz, 2 * sz, 14 * sz, 5 * sz);
  if (e.cd > 75) {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(-44 * sz, 0, 7 * sz, 9 * sz);
  }

  // 7. Lampu Beacon Berkedip
  if ((G.t / 12 | 0) % 2 === 0) {
    ctx.fillStyle = isMini ? '#ef4444' : '#22c55e';
    ctx.beginPath();
    ctx.arc(0, -30 * sz, 3.5 * sz, 0, 6.28);
    ctx.fill();
  }

  // Label Boss Bar jika Mini Boss
  if (isMini) {
    ctx.restore();
    ctx.save();
    ctx.translate(x, y - 65 * sz);
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(-50, 0, 100, 12);
    const hpPct = Math.max(0, e.hp / 16);
    ctx.fillStyle = '#ef4444'; ctx.fillRect(-48, 2, 96 * hpPct, 8);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1; ctx.strokeRect(-50, 0, 100, 12);
    ctx.font = '8px "Press Start 2P"'; ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'center';
    ctx.fillText(`GUNSHIP BOSS [${e.hp}]`, 0, -5);
  }

  ctx.restore();
}

// Gambar Helikopter Evakuasi di Garis Finish Misi
function drawExtractionPost(x) {
  ctx.save();
  ctx.translate(x, 260);

  // Bayangan helikopter evakuasi
  drawShadow(0, FLOOR - 260, 48);

  const bob = Math.sin(G.t * 0.08) * 5;
  ctx.translate(0, bob);

  // Baling-Baling Penyelamat
  const rotorW = 85 * Math.cos(G.t * 0.7);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-rotorW, -36); ctx.lineTo(rotorW, -36);
  ctx.stroke();

  // Badan Helikopter Evakuasi Medis / Militer Putih & Biru
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.ellipse(0, 0, 44, 24, 0, 0, 6.28);
  ctx.fill();
  ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3; ctx.stroke();

  // Palang Penyelamat Merah
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-8, -4, 16, 8);
  ctx.fillRect(-4, -8, 8, 16);

  // Kaca Kokpit
  ctx.fillStyle = 'rgba(56, 189, 248, 0.85)';
  ctx.beginPath();
  ctx.ellipse(-20, -4, 16, 12, -0.2, 0, 6.28);
  ctx.fill();

  // Tangga Tali Penyelamat Turun ke Tanah
  ctx.strokeStyle = '#d97706'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-8, 22); ctx.lineTo(-8, FLOOR - 260 - bob);
  ctx.moveTo(8, 22); ctx.lineTo(8, FLOOR - 260 - bob);
  ctx.stroke();
  for (let ly = 32; ly < FLOOR - 260 - bob; ly += 18) {
    ctx.beginPath();
    ctx.moveTo(-10, ly); ctx.lineTo(10, ly);
    ctx.stroke();
  }

  // Tanda RESCUE ZONE
  ctx.restore();
  ctx.save();
  ctx.translate(x, FLOOR - 140);
  ctx.font = '10px "Press Start 2P"';
  ctx.fillStyle = Math.sin(G.t * 0.15) > 0 ? '#4ade80' : '#ffd23f';
  ctx.textAlign = 'center';
  ctx.fillText('▼ RESCUE ZONE ▼', 0, Math.sin(G.t * 0.1) * 3);
  ctx.restore();
}

// Parallax Background Rendering
function drawParallaxBackground() {
  const bgImg = S.bgs[currentMis.bg] || S.bgs.desert;
  if (!bgImg) return;
  const bgW = W;
  const offX = -(G.camX * 0.4) % bgW;
  ctx.drawImage(bgImg, offX, 0, bgW, H);
  if (offX + bgW < W) ctx.drawImage(bgImg, offX + bgW, 0, bgW, H);

  // Gambar Lapisan Tanah / Lantai Utama Nyata Sesuai Tema
  const col = {
    sand: { top: '#c4894d', main: '#8c5326', border: '#e8b87d' },
    grass: { top: '#4f772d', main: '#31572c', border: '#90a955' },
    steel: { top: '#495057', main: '#212529', border: '#adb5bd' },
    hazard: { top: '#f4a261', main: '#264653', border: '#e76f51' }
  }[currentMis.groundType || 'sand'];

  // Badan tanah dasar
  ctx.fillStyle = col.main;
  ctx.fillRect(0, FLOOR, W, H - FLOOR);
  // Garis tepi atas pijakan tanah
  ctx.fillStyle = col.top;
  ctx.fillRect(0, FLOOR, W, 10);
  ctx.fillStyle = col.border;
  ctx.fillRect(0, FLOOR, W, 3);

  // Pola paku / batu pada tanah
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let x = -((G.camX) % 40); x < W; x += 40) {
    ctx.fillRect(x, FLOOR + 12, 18, 5);
  }
}

// Menggambar Seluruh Pijakan (Platforms)
function drawPlatforms() {
  for (const p of currentMis.platforms) {
    const sx = p.x0 - G.camX, w = p.x1 - p.x0;
    if (sx + w < -50 || sx > W + 50) continue;

    ctx.save();
    if (p.type === 'wood') {
      // Tiang Penyangga Kayu ke Tanah
      ctx.fillStyle = '#5c3818';
      ctx.fillRect(sx + 20, p.y, 14, FLOOR - p.y);
      ctx.fillRect(sx + w - 34, p.y, 14, FLOOR - p.y);
      // Palang silang penyangga
      ctx.strokeStyle = '#432810'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sx + 27, p.y + 10); ctx.lineTo(sx + w - 27, FLOOR - 10);
      ctx.moveTo(sx + w - 27, p.y + 10); ctx.lineTo(sx + 27, FLOOR - 10);
      ctx.stroke();

      // Papan Pijakan Kayu
      ctx.fillStyle = '#8b5a2b';
      ctx.fillRect(sx, p.y, w, 16);
      ctx.fillStyle = '#d4a373';
      ctx.fillRect(sx, p.y, w, 4); // Highlight atas
      ctx.fillStyle = '#3a200a';
      ctx.fillRect(sx, p.y + 16, w, 3); // Bayangan bawah
      // Paku kayu
      ctx.fillStyle = '#1f1306';
      for (let px = sx + 15; px < sx + w; px += 35) {
        ctx.fillRect(px, p.y + 7, 3, 3);
      }
    } else if (p.type === 'sandbag') {
      // Pijakan Karung Pasir (Sandbag Bunker)
      ctx.fillStyle = '#a68a3e';
      ctx.fillRect(sx, p.y, w, 22);
      ctx.fillStyle = '#e9d8a6';
      ctx.fillRect(sx, p.y, w, 4);
      // Jahitan karung
      ctx.strokeStyle = '#70571b'; ctx.lineWidth = 2;
      for (let px = sx + 25; px < sx + w; px += 30) {
        ctx.strokeRect(px - 15, p.y + 4, 28, 16);
      }
    } else if (p.type === 'steel') {
      // Balok Baja Industri & Catwalk
      ctx.fillStyle = '#2b2d42';
      ctx.fillRect(sx + 25, p.y, 12, FLOOR - p.y);
      ctx.fillRect(sx + w - 37, p.y, 12, FLOOR - p.y);

      ctx.fillStyle = '#4a4e69';
      ctx.fillRect(sx, p.y, w, 18);
      ctx.fillStyle = '#9a8c98';
      ctx.fillRect(sx, p.y, w, 4);
      // Baut baja
      ctx.fillStyle = '#f2e9e4';
      for (let px = sx + 12; px < sx + w; px += 24) {
        ctx.fillRect(px, p.y + 8, 4, 4);
      }
    } else if (p.type === 'hazard') {
      // Pijakan Garis Kuning-Hitam (Lab / Pabrik)
      ctx.fillStyle = '#1d3557';
      ctx.fillRect(sx + 20, p.y, 14, FLOOR - p.y);
      ctx.fillRect(sx + w - 34, p.y, 14, FLOOR - p.y);

      ctx.fillStyle = '#212529';
      ctx.fillRect(sx, p.y, w, 18);
      // Garis hazard belang kuning
      ctx.fillStyle = '#ffd166';
      for (let px = sx; px < sx + w; px += 20) {
        ctx.beginPath();
        ctx.moveTo(px, p.y); ctx.lineTo(px + 10, p.y);
        ctx.lineTo(px + 4, p.y + 18); ctx.lineTo(px - 6, p.y + 18);
        ctx.fill();
      }
      ctx.fillStyle = '#06d6a0';
      ctx.fillRect(sx, p.y, w, 3); // Neon strip
    }
    ctx.restore();
  }
}

function drawHUD() {
  ctx.save();
  // Judul Misi Aktif
  ctx.font = '11px "Press Start 2P"';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(currentMis.title, 24, 30);

  // Skor
  ctx.fillStyle = '#fff';
  ctx.fillText('SCORE: ' + String(G.score).padStart(6, '0'), 24, 52);

  // Amunisi Senjata
  const wpnName = P.weapon === 'pistol' ? 'PISTOL' : (P.weapon === 'H' ? 'HMG' : 'ROCKET');
  const ammoStr = P.weapon === 'pistol' ? '∞' : P.ammo[P.weapon];
  ctx.fillStyle = P.weapon === 'pistol' ? '#ffd23f' : '#ff9f1c';
  ctx.fillText(`ARMS: ${wpnName} [${ammoStr}]`, 24, 76);

  // Bom Granat
  ctx.fillStyle = '#ff4d5a';
  ctx.fillText(`BOMB: ${P.ammo.bomb}`, 24, 100);

  // HP Bar Pemain
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(W - 240, 16, 210, 22);
  const hpPct = Math.max(0, P.hp / P.maxHp);
  ctx.fillStyle = hpPct > 0.4 ? '#4cd964' : '#ff3b3b';
  ctx.fillRect(W - 238, 18, 206 * hpPct, 18);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
  ctx.strokeRect(W - 240, 16, 210, 22);
  ctx.font = '10px "Press Start 2P"'; ctx.fillStyle = '#fff';
  ctx.fillText(`HP: ${P.hp}`, W - 225, 32);

  // Status Tank
  if (P.inTank && tank) {
    ctx.fillStyle = '#70e000';
    ctx.fillText(`TANK ARMOR: ${tank.armor}/${tank.maxArmor}`, W - 240, 56);
  }

  // Boss HP Bar (Misi 5)
  if (boss && boss.hp > 0 && P.x > 750) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(W / 2 - 200, 16, 400, 26);
    const bPct = Math.max(0, boss.hp / boss.maxHp);
    ctx.fillStyle = '#ff3b3b';
    ctx.fillRect(W / 2 - 196, 20, 392 * bPct, 18);
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 2;
    ctx.strokeRect(W / 2 - 200, 16, 400, 26);
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(`BOSS: YANTO-01 MECH (${boss.hp})`, W / 2, 33);
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
  bg.addColorStop(1, 'rgba(10,5,2,0.92)');
  ctx.fillStyle = bg; ctx.fillRect(0, H - 150, W, 150);

  ctx.save();
  ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillStyle = Math.sin(G.t * 0.1) > 0 ? '#ffd23f' : '#fff';
  ctx.fillText(COARSE ? 'SENTUH LAYAR UNTUK MAIN' : 'TEKAN SPASI / ENTER UNTUK MAIN', W / 2, H - 55);
  ctx.font = '10px "Press Start 2P"'; ctx.fillStyle = '#ff9f1c';
  ctx.fillText('5 MISI PETUALANGAN ARCADE RETRO', W / 2, H - 25);
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
