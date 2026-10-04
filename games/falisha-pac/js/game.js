/* FALISHA PAC: ARCADE PAC-MAN REMAKE
   Visual Retro Neon Synthwave, 4 Labirin Unik, 4 Hantu Keluarga, Mega Kumon Power, & Flash Dash!
*/

(() => {
'use strict';

const W = 960, H = 540;
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const COARSE = matchMedia('(pointer: coarse)').matches;
const rand = Math.random, sgn = v => (v > 0) - (v < 0);

/* ---------- Audio Synth ---------- */
const _ = null;
const THEMES = [
  // 0: Pac Arcade Intro Jingle
  { bpm: 150, wave: 'square', bass: [48,_,48,_, 55,_,55,_, 51,_,51,_, 58,_,58,_], lead: [72,84,79,76, 84,79,76,_, 73,85,80,77, 85,80,77,_, 72,84,79,76, 84,79,76,_, 75,76,77,_, 78,79,80,84] }
];

let wakaStep = false;
const sfx = {
  waka: () => {
    wakaStep = !wakaStep;
    Chip.beep(wakaStep ? 440 : 330, 0.05, 'triangle', 0.06, wakaStep ? -100 : 100);
  },
  powerPellet: () => {
    [330, 440, 550, 660, 880].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.08, 'sawtooth', 0.08), i * 50));
  },
  eatGhost: () => {
    Chip.hit(1.2);
    [880, 1100, 1320, 1760].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.07, 'square', 0.1), i * 40));
  },
  eatFruit: () => {
    [523, 659, 784, 1047, 1318].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.09, 'triangle', 0.08), i * 45));
  },
  dash: () => {
    Chip.beep(400, 0.25, 'sawtooth', 0.12, 600);
    Chip.noise(Chip.now(), 0.18, 0.07, 3000);
  },
  die: () => {
    for (let i = 0; i < 8; i++) {
      setTimeout(() => Chip.beep(600 - i * 50, 0.08, 'sawtooth', 0.09), i * 70);
    }
  },
  stageClear: () => {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.12, 'square', 0.08), i * 90));
  },
  select: () => Chip.beep(880, 0.08, 'square', 0.06)
};

function setMuted(m) { Chip.setMuted(m); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }
setMuted(Chip.isMuted());

/* ---------- 4 Labirin (25 Kolom x 21 Baris) ---------- */
// 0: Kosong / Jalan (tanpa dot)
// 1: Tembok / Wall
// 2: Dot Petir (+10 poin)
// 3: Power Pellet Kumon (+50 poin)
// 4: Pintu Ghost House
// 5: Ruang Ghost House
const MAZE_TEMPLATES = [
  // Stage 1: Classic Neon Blue
  [
    "1111111111111111111111111",
    "1322222222111112222222231",
    "1211112111211121112111121",
    "1211112111211121112111121",
    "1222222222222222222222221",
    "1211112112111112112111121",
    "1222222112221222112222221",
    "1111112111101011112111111",
    "0000012110000000112100000",
    "1111112110144410112111111",
    "0000002000155510002000000", // Warp row (row 10)
    "1111112110111110112111111",
    "0000012110000000112100000",
    "1111112110111110112111111",
    "1222222222221222222222221",
    "1211112111121211112111121",
    "1322112222220222222112231",
    "1112112112111112112112111",
    "1222222112221222112222221",
    "1211111111121211111111121",
    "1111111111111111111111111"
  ],
  // Stage 2: Cyber Magenta
  [
    "1111111111111111111111111",
    "1322222222221222222222231",
    "1211121111121211111211121",
    "1211122222222222222211121",
    "1222221112111112111222221",
    "1112121112111112111212111",
    "1222122222221222222212221",
    "1211111211101011121111121",
    "0000011211000001121100000",
    "1111011211014101121101111",
    "0000002000015100002000000",
    "1111011211011101121101111",
    "0000011211000001121100000",
    "1111111211111111121111111",
    "1222222222221222222222221",
    "1211121111121211111211121",
    "1322122221120211222212231",
    "1112111121121211211112111",
    "1222222222221222222222221",
    "1211111111111111111111121",
    "1111111111111111111111111"
  ],
  // Stage 3: Emerald Jade Temple
  [
    "1111111111111111111111111",
    "1322222112221222112222231",
    "1211112112121212112111121",
    "1211112222122212222111121",
    "1222222111111111112222221",
    "1112112222221222222112111",
    "1222111121121211211112221",
    "1212222221101011222222121",
    "0011121121000001211211100",
    "1111121121014101211211111",
    "0000020000015100000200000",
    "1111121121011101211211111",
    "0011121121000001211211100",
    "1212222221111111222222121",
    "1212111122221222211112121",
    "1222221121121211211222221",
    "1311122221120211222211131",
    "1211121111121211111211121",
    "1222222222222222222222221",
    "1211111111111111111111121",
    "1111111111111111111111111"
  ],
  // Stage 4: Golden Fortress Yanto
  [
    "1111111111111111111111111",
    "1322222222111112222222231",
    "1211121112111112111211121",
    "1211121112221222111211121",
    "1222222222121212222222221",
    "1211121111121211111211121",
    "1211122222222222222211121",
    "1222221110111110111222221",
    "0011121110000000111211100",
    "1111121110144410111211111",
    "0000020000155510000200000",
    "1111121110111110111211111",
    "0011121110000000111211100",
    "1222221110111110111222221",
    "1211122222221222222211121",
    "1211121111121211111211121",
    "1322222222220222222222231",
    "1211121112111112111211121",
    "1211121112111112111211121",
    "1222222222222222222222221",
    "1111111111111111111111111"
  ]
];

const STAGE_CONFIGS = [
  { name: 'STAGE 1: NEON CLASSIC', wall: '#00f0ff', wallGlow: '#0077ff', floor: '#040817' },
  { name: 'STAGE 2: CYBER MAGENTA', wall: '#ff007f', wallGlow: '#7900ff', floor: '#0c0514' },
  { name: 'STAGE 3: EMERALD TEMPLE', wall: '#00ff88', wallGlow: '#00aa50', floor: '#02120a' },
  { name: 'STAGE 4: GOLDEN FORTRESS', wall: '#ffd23f', wallGlow: '#ff6b00', floor: '#140c02' }
];

const FRUITS = [
  { name: 'CERI', pts: 100, icon: '🍒', color: '#ff3366' },
  { name: 'STROBERI', pts: 300, icon: '🍓', color: '#ff4d6d' },
  { name: 'DONAT', pts: 500, icon: '🍩', color: '#c77dff' },
  { name: 'KUMON', pts: 700, icon: '📚', color: '#ffd166' },
  { name: 'PIANO', pts: 1000, icon: '🎹', color: '#00f0ff' },
  { name: 'MAHKOTA', pts: 2000, icon: '👑', color: '#ffe600' }
];

/* ---------- Grid Setup ---------- */
const COLS = 25, ROWS = 21, TS = 24; // 600 x 504 px
const OX = 180, OY = 18; // Offset Maze di Canvas

let grid = [];
let totalDots = 0, dotsRemaining = 0;

function parseGrid(stageIdx) {
  const tmpl = MAZE_TEMPLATES[stageIdx % MAZE_TEMPLATES.length];
  grid = [];
  totalDots = 0;
  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const v = parseInt(tmpl[r][c], 10);
      row.push(v);
      if (v === 2 || v === 3) totalDots++;
    }
    grid.push(row);
  }
  dotsRemaining = totalDots;
}

function isWall(c, r) {
  if (r === 10 && (c < 0 || c >= COLS)) return false; // Warp tunnel
  if (r < 0 || r >= ROWS || c < 0 || c >= COLS) return true;
  const v = grid[r][c];
  return v === 1 || v === 4;
}

/* ---------- State Game ---------- */
const G = {
  mode: 'title', // title, get_ready, playing, dying, stage_clear, gameover, victory
  stage: 0,
  score: 0,
  highScore: 19840,
  lives: 3,
  t: 0,
  frightTimer: 0,
  frightGhostsEaten: 0,
  dashCooldown: 0,
  dashActive: 0,
  fruit: null, // { c, r, type, timer }
  fruitTimer: 0,
  timer: 0
};

// Cover Art Image
let coverImg = null;
const cov = new Image();
cov.src = 'assets/cover.jpg';
cov.onload = () => { coverImg = cov; };

/* ---------- Pemain: Falisha ---------- */
const P = {
  x: 12 * TS, y: 16 * TS,
  dirX: 0, dirY: 0,
  nextX: 0, nextY: 0,
  angle: 0,
  mouthAngle: 0.25,
  mouthSpeed: 0.08,
  speed: 2.2,
  radius: 11
};

/* ---------- 4 Hantu Keluarga ---------- */
// 0: Blinky (Yanto - Merah / Chaser)
// 1: Pinky (Pupu - Pink / Ambusher)
// 2: Inky (Arshad - Cyan / Flanker)
// 3: Clyde (Nono - Oranye / Wanderer)
const GHOSTS = [
  { id: 'yanto', name: 'YANTO', color: '#ff2a2a', homeC: 12, homeR: 8, cornerC: 23, cornerR: 1, x: 0, y: 0, dirX: 0, dirY: -1, mode: 'chase', speed: 1.85 },
  { id: 'pupu',  name: 'PUPU',  color: '#ff66cc', homeC: 11, homeR: 10, cornerC: 1, cornerR: 1, x: 0, y: 0, dirX: 0, dirY: -1, mode: 'house', speed: 1.8 },
  { id: 'arshad',name: 'ARSHAD',color: '#00f0ff', homeC: 12, homeR: 10, cornerC: 23, cornerR: 19, x: 0, y: 0, dirX: 0, dirY: -1, mode: 'house', speed: 1.75 },
  { id: 'nono',  name: 'NONO',  color: '#ff9900', homeC: 13, homeR: 10, cornerC: 1, cornerR: 19, x: 0, y: 0, dirX: 0, dirY: -1, mode: 'house', speed: 1.7 }
];

let particles = [];
let popups = [];

function addPop(x, y, text, color = '#ffd23f') {
  popups.push({ x, y, text, color, life: 45 });
}

function addSpark(x, y, color = '#00f0ff', n = 6) {
  for (let i = 0; i < n; i++) {
    const a = rand() * 6.28, s = 1.5 + rand() * 3.5;
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, color, life: 18 + rand() * 10 | 0, r: 2 + rand() * 2 });
  }
}

/* ---------- Inisialisasi Karakter ---------- */
function resetPositions() {
  P.x = 12 * TS; P.y = 16 * TS;
  P.dirX = -1; P.dirY = 0;
  P.nextX = -1; P.nextY = 0;
  P.angle = Math.PI;

  const houseC = 12, houseR = 10;
  GHOSTS[0].x = houseC * TS; GHOSTS[0].y = 8 * TS; GHOSTS[0].dirX = -1; GHOSTS[0].dirY = 0; GHOSTS[0].mode = 'chase';
  GHOSTS[1].x = (houseC - 1) * TS; GHOSTS[1].y = houseR * TS; GHOSTS[1].dirX = 0; GHOSTS[1].dirY = -1; GHOSTS[1].mode = 'house'; GHOSTS[1].exitTimer = 40;
  GHOSTS[2].x = houseC * TS; GHOSTS[2].y = houseR * TS; GHOSTS[2].dirX = 0; GHOSTS[2].dirY = 1; GHOSTS[2].mode = 'house'; GHOSTS[2].exitTimer = 160;
  GHOSTS[3].x = (houseC + 1) * TS; GHOSTS[3].y = houseR * TS; GHOSTS[3].dirX = 0; GHOSTS[3].dirY = -1; GHOSTS[3].mode = 'house'; GHOSTS[3].exitTimer = 280;

  G.frightTimer = 0;
  G.frightGhostsEaten = 0;
}

function initStage(s) {
  G.stage = s;
  parseGrid(s);
  resetPositions();
  G.fruit = null;
  G.fruitTimer = 0;
  G.dashActive = 0;
  G.dashCooldown = 0;
  G.mode = 'get_ready';
  G.timer = 80;
  sfx.select();
}

function initGame() {
  G.score = 0;
  G.lives = 3;
  initStage(0);
}

/* ---------- Input Controller ---------- */
let confirmReq = false;

function gesture() { Chip.ensure(); if (!gesture.done) { gesture.done = true; Chip.play(THEMES, 0); } }

addEventListener('keydown', e => {
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'a', 's', 'd'].includes(e.key)) e.preventDefault();
  if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { P.nextX = -1; P.nextY = 0; gesture(); }
  else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { P.nextX = 1; P.nextY = 0; gesture(); }
  else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { P.nextX = 0; P.nextY = -1; gesture(); }
  else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { P.nextX = 0; P.nextY = 1; gesture(); }
  else if (e.key === ' ') { triggerDash(); confirmReq = true; gesture(); }
  else if (e.key === 'Enter') { confirmReq = true; gesture(); }
  else if (e.key === 'm' || e.key === 'M') setMuted(!Chip.isMuted());
});

function triggerDash() {
  if (G.dashCooldown <= 0 && G.mode === 'playing') {
    G.dashActive = 120; // 2 detik flash speed
    G.dashCooldown = 600; // 10 detik cooldown
    sfx.dash();
    addPop(P.x + OX, P.y + OY - 20, 'FLASH DASH!', '#ffd23f');
  }
}

// Touch Handling on Tablet & Mobile
cv.addEventListener('pointerdown', e => {
  confirmReq = true; gesture();
  if (COARSE && !document.fullscreenElement) {
    document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  }
  // Swipe detection start
  cv.touchStartX = e.clientX; cv.touchStartY = e.clientY;
});

cv.addEventListener('pointerup', e => {
  if (cv.touchStartX === undefined) return;
  const dx = e.clientX - cv.touchStartX, dy = e.clientY - cv.touchStartY;
  if (Math.hypot(dx, dy) > 20) {
    if (Math.abs(dx) > Math.abs(dy)) {
      P.nextX = dx > 0 ? 1 : -1; P.nextY = 0;
    } else {
      P.nextX = 0; P.nextY = dy > 0 ? 1 : -1;
    }
  }
  cv.touchStartX = undefined; cv.touchStartY = undefined;
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
    spans.left?.classList.toggle('on', !!l);
    spans.right?.classList.toggle('on', !!r);
    spans.up?.classList.toggle('on', !!u);
    spans.down?.classList.toggle('on', !!d);
    if (l) { P.nextX = -1; P.nextY = 0; }
    else if (r) { P.nextX = 1; P.nextY = 0; }
    else if (u) { P.nextX = 0; P.nextY = -1; }
    else if (d) { P.nextX = 0; P.nextY = 1; }
  };
  const handlePoint = (clientX, clientY) => {
    const b = dpad.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
    const dx = clientX - cx, dy = clientY - cy;
    if (Math.hypot(dx, dy) < b.width * 0.12) { setDir(false, false, false, false); return; }
    if (Math.abs(dx) > Math.abs(dy)) {
      setDir(dx < 0, dx > 0, false, false);
    } else {
      setDir(false, false, dy < 0, dy > 0);
    }
  };
  dpad.addEventListener('pointerdown', e => { e.preventDefault(); dpad.setPointerCapture?.(e.pointerId); gesture(); handlePoint(e.clientX, e.clientY); });
  dpad.addEventListener('pointermove', e => { if (e.buttons > 0 || e.pressure > 0) handlePoint(e.clientX, e.clientY); });
  const off = e => { e.preventDefault(); spans.left?.classList.remove('on'); spans.right?.classList.remove('on'); spans.up?.classList.remove('on'); spans.down?.classList.remove('on'); };
  dpad.addEventListener('pointerup', off); dpad.addEventListener('pointercancel', off);
})();

// Setup Dash Button
const dashBtn = document.getElementById('btn-dash');
if (dashBtn) {
  dashBtn.addEventListener('pointerdown', e => {
    e.preventDefault(); gesture(); triggerDash();
  });
}

document.getElementById('btn-mute').onclick = e => { e.stopPropagation(); setMuted(!Chip.isMuted()); };
document.getElementById('btn-full').onclick = e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};

/* ---------- Logika Pac-Man & Hantu ---------- */
function updatePacman() {
  const currentSpeed = (G.dashActive > 0) ? P.speed * 1.85 : P.speed;
  if (G.dashActive > 0) {
    G.dashActive--;
    if (G.t % 3 === 0) addSpark(P.x + OX + (rand() - 0.5) * 12, P.y + OY + (rand() - 0.5) * 12, '#ffd23f', 2);
  }
  if (G.dashCooldown > 0) {
    G.dashCooldown--;
    dashBtn?.classList.toggle('ready', G.dashCooldown <= 0);
  }

  // Pre-turn buffer / perpindahan arah di persimpangan grid
  const cellC = Math.round(P.x / TS), cellR = Math.round(P.y / TS);
  const alignedX = Math.abs(P.x - cellC * TS) < currentSpeed + 0.5;
  const alignedY = Math.abs(P.y - cellR * TS) < currentSpeed + 0.5;

  // Cek apakah nextDir bisa berbalik langsung 180 derajat
  if ((P.nextX !== 0 && P.nextX === -P.dirX) || (P.nextY !== 0 && P.nextY === -P.dirY)) {
    P.dirX = P.nextX; P.dirY = P.nextY;
  }

  // Cek belokan di persimpangan
  if (alignedX && alignedY) {
    if (P.nextX !== 0 || P.nextY !== 0) {
      if (!isWall(cellC + P.nextX, cellR + P.nextY)) {
        P.x = cellC * TS; P.y = cellR * TS;
        P.dirX = P.nextX; P.dirY = P.nextY;
      }
    }
    // Jika arah sekarang terhalang tembok, berhenti
    if (isWall(cellC + P.dirX, cellR + P.dirY)) {
      P.x = cellC * TS; P.y = cellR * TS;
      P.dirX = 0; P.dirY = 0;
    }
  }

  // Bergerak
  P.x += P.dirX * currentSpeed;
  P.y += P.dirY * currentSpeed;

  // Warp tunnel di baris 10
  if (cellR === 10) {
    if (P.x < -TS / 2) P.x = (COLS - 0.5) * TS;
    else if (P.x > (COLS - 0.5) * TS) P.x = -TS / 2;
  }

  // Arah hadap & animasi mulut
  if (P.dirX !== 0 || P.dirY !== 0) {
    P.angle = Math.atan2(P.dirY, P.dirX);
    P.mouthAngle += P.mouthSpeed;
    if (P.mouthAngle > 0.4 || P.mouthAngle < 0.05) P.mouthSpeed = -P.mouthSpeed;
  }

  // Makan Dot & Power Pellet
  const curC = Math.round(P.x / TS), curR = Math.round(P.y / TS);
  if (curC >= 0 && curC < COLS && curR >= 0 && curR < ROWS) {
    const tile = grid[curR][curC];
    if (tile === 2) {
      grid[curR][curC] = 0;
      G.score += 10;
      dotsRemaining--;
      sfx.waka();
      addSpark(curC * TS + OX + 12, curR * TS + OY + 12, '#ffd23f', 3);
      checkFruitSpawn();
    } else if (tile === 3) {
      grid[curR][curC] = 0;
      G.score += 50;
      dotsRemaining--;
      sfx.powerPellet();
      G.frightTimer = 400; // ~6.6 detik mode scared
      G.frightGhostsEaten = 0;
      GHOSTS.forEach(g => {
        if (g.mode === 'chase' || g.mode === 'scatter') g.mode = 'fright';
      });
      addPop(P.x + OX, P.y + OY - 20, 'MEGA KUMON!', '#00f0ff');
      addSpark(curC * TS + OX + 12, curR * TS + OY + 12, '#00f0ff', 12);
      checkFruitSpawn();
    }
  }

  // Makan Buah Bonus
  if (G.fruit && Math.abs(P.x - G.fruit.c * TS) < 14 && Math.abs(P.y - G.fruit.r * TS) < 14) {
    const fr = FRUITS[G.fruit.type];
    G.score += fr.pts;
    sfx.eatFruit();
    addPop(G.fruit.c * TS + OX, G.fruit.r * TS + OY - 14, `+${fr.pts}`, fr.color);
    G.fruit = null;
  }

  // Cek Stage Clear
  if (dotsRemaining <= 0) {
    G.mode = 'stage_clear';
    G.timer = 120;
    sfx.stageClear();
  }
}

function checkFruitSpawn() {
  if (!G.fruit && (dotsRemaining === Math.floor(totalDots * 0.7) || dotsRemaining === Math.floor(totalDots * 0.3))) {
    const fIdx = Math.min(FRUITS.length - 1, G.stage);
    G.fruit = { c: 12, r: 12, type: fIdx, life: 600 };
  }
}

function updateGhosts() {
  if (G.frightTimer > 0) G.frightTimer--;

  GHOSTS.forEach(g => {
    // Mode Dalam Rumah (Ghost House)
    if (g.mode === 'house') {
      if (--g.exitTimer <= 0) {
        g.x = 12 * TS; g.y = 8 * TS;
        g.mode = 'chase'; g.dirX = -1; g.dirY = 0;
      } else {
        // Naik-turun di dalam rumah
        g.y += Math.sin(G.t * 0.1) * 0.8;
      }
      return;
    }

    // Kecepatan hantu
    let sp = g.speed;
    if (g.mode === 'fright') sp *= 0.65;
    else if (g.mode === 'eyes') sp *= 2.4;
    else if (g.id === 'yanto' && dotsRemaining < 25) sp *= 1.15; // Cruise Elroy

    const cellC = Math.round(g.x / TS), cellR = Math.round(g.y / TS);
    const alignedX = Math.abs(g.x - cellC * TS) < sp + 0.5;
    const alignedY = Math.abs(g.y - cellR * TS) < sp + 0.5;

    if (alignedX && alignedY) {
      g.x = cellC * TS; g.y = cellR * TS;

      // Hantu mata pulang ke rumah
      if (g.mode === 'eyes' && cellC === 12 && (cellR === 8 || cellR === 9 || cellR === 10)) {
        g.mode = 'house'; g.exitTimer = 60;
        return;
      }

      // Tentukan target koordinat sesuai AI hantu
      let targetC = cellC, targetR = cellR;
      if (g.mode === 'eyes') {
        targetC = 12; targetR = 9;
      } else if (g.mode === 'fright') {
        targetC = (rand() * COLS) | 0; targetR = (rand() * ROWS) | 0;
      } else {
        const pC = Math.round(P.x / TS), pR = Math.round(P.y / TS);
        if (g.id === 'yanto') {
          // Blinky: langsung buru Falisha
          targetC = pC; targetR = pR;
        } else if (g.id === 'pupu') {
          // Pinky: 4 petak di depan Falisha
          targetC = pC + P.dirX * 4; targetR = pR + P.dirY * 4;
        } else if (g.id === 'arshad') {
          // Inky: koordinat bersilang
          const bC = Math.round(GHOSTS[0].x / TS), bR = Math.round(GHOSTS[0].y / TS);
          targetC = pC + (pC - bC); targetR = pR + (pR - bR);
        } else if (g.id === 'nono') {
          // Clyde: jika jarak > 8 tile buru, jika dekat mundur ke sudut
          const dist = Math.hypot(pC - cellC, pR - cellR);
          if (dist > 8) { targetC = pC; targetR = pR; }
          else { targetC = g.cornerC; targetR = g.cornerR; }
        }
      }

      // Pilih arah terbaik di persimpangan (tidak boleh berputar balik 180 derajat)
      const dirs = [
        { dx: 0, dy: -1 }, // Up
        { dx: -1, dy: 0 }, // Left
        { dx: 0, dy: 1 },  // Down
        { dx: 1, dy: 0 }   // Right
      ];
      let bestDir = null, minDist = Infinity;
      for (const d of dirs) {
        // Jangan putar balik kecuali tak ada jalan
        if (d.dx === -g.dirX && d.dy === -g.dirY) continue;
        const nc = cellC + d.dx, nr = cellR + d.dy;
        // Pintu rumah hantu hanya bisa dilewati hantu mata
        if (g.mode !== 'eyes' && nr === 9 && (nc === 11 || nc === 12 || nc === 13)) continue;
        if (!isWall(nc, nr)) {
          const d2 = Math.hypot(nc - targetC, nr - targetR);
          if (d2 < minDist) { minDist = d2; bestDir = d; }
        }
      }
      if (bestDir) { g.dirX = bestDir.dx; g.dirY = bestDir.dy; }
    }

    g.x += g.dirX * sp;
    g.y += g.dirY * sp;

    // Warp tunnel di baris 10
    if (cellR === 10) {
      if (g.x < -TS / 2) g.x = (COLS - 0.5) * TS;
      else if (g.x > (COLS - 0.5) * TS) g.x = -TS / 2;
    }

    // Cek Tabrakan dengan Falisha
    const distPlayer = Math.hypot(g.x - P.x, g.y - P.y);
    if (distPlayer < 18) {
      if (g.mode === 'fright') {
        // Falisha makan hantu!
        g.mode = 'eyes';
        G.frightGhostsEaten++;
        const pts = Math.min(1600, 200 * Math.pow(2, G.frightGhostsEaten - 1));
        G.score += pts;
        sfx.eatGhost();
        addPop(g.x + OX, g.y + OY - 10, `+${pts}`, '#00f0ff');
      } else if (g.mode === 'chase' || g.mode === 'scatter') {
        // Falisha terkena hantu
        G.mode = 'dying';
        G.timer = 90;
        sfx.die();
      }
    }
  });
}

/* ---------- Update Loop ---------- */
function update() {
  G.t++;
  if (G.fruit && --G.fruit.life <= 0) G.fruit = null;

  // Popups & Partikel
  for (const p of popups) { p.y -= 0.6; p.life--; }
  popups = popups.filter(p => p.life > 0);

  for (const p of particles) {
    p.x += p.vx; p.y += p.vy; p.life--;
  }
  particles = particles.filter(p => p.life > 0);

  if (G.mode === 'title') {
    if (confirmReq && G.t > 15) { confirmReq = false; sfx.select(); initGame(); }
    return;
  }

  if (G.mode === 'get_ready') {
    if (--G.timer <= 0) G.mode = 'playing';
    return;
  }

  if (G.mode === 'playing') {
    updatePacman();
    updateGhosts();
    return;
  }

  if (G.mode === 'dying') {
    if (--G.timer <= 0) {
      G.lives--;
      if (G.lives <= 0) {
        G.mode = 'gameover';
        G.timer = 150;
      } else {
        resetPositions();
        G.mode = 'get_ready';
        G.timer = 80;
      }
    }
    return;
  }

  if (G.mode === 'stage_clear') {
    if (--G.timer <= 0) {
      if (G.stage + 1 < STAGE_CONFIGS.length) {
        initStage(G.stage + 1);
      } else {
        G.mode = 'victory';
        sfx.stageClear();
      }
    }
    return;
  }

  if (G.mode === 'gameover' || G.mode === 'victory') {
    if (confirmReq && G.t > 30) { confirmReq = false; G.mode = 'title'; }
    return;
  }
}

/* ---------- Render Graphics ---------- */
function draw() {
  ctx.save();
  ctx.fillStyle = '#020308';
  ctx.fillRect(0, 0, W, H);

  if (G.mode === 'title') {
    drawTitle();
    ctx.restore();
    return;
  }

  const cfg = STAGE_CONFIGS[G.stage % STAGE_CONFIGS.length];

  // 1. Gambar Latar & Labirin Neon
  drawMaze(cfg);

  // 2. Gambar Buah Bonus
  if (G.fruit) {
    const fr = FRUITS[G.fruit.type];
    const fx = G.fruit.c * TS + OX + 12, fy = G.fruit.r * TS + OY + 12;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(fr.icon, fx, fy + Math.sin(G.t * 0.15) * 3);
  }

  // 3. Gambar Hantu
  drawGhosts();

  // 4. Gambar Falisha
  drawFalisha();

  // 5. Partikel & Efek Popups
  drawFx();

  // 6. HUD Lengkap (Kiri & Kanan)
  drawHUD(cfg);

  // 7. Overlays (Ready / Stage Clear / Game Over)
  drawOverlays();

  ctx.restore();
}

function drawMaze(cfg) {
  ctx.save();
  ctx.translate(OX, OY);

  // Background labirin
  ctx.fillStyle = cfg.floor;
  ctx.fillRect(0, 0, COLS * TS, ROWS * TS);

  // Garis luar labirin
  ctx.shadowColor = cfg.wallGlow;
  ctx.shadowBlur = 12;
  ctx.strokeStyle = cfg.wall;
  ctx.lineWidth = 2.5;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const v = grid[r][c];
      const x = c * TS, y = r * TS;

      if (v === 1) {
        // Kotak dinding neon
        ctx.fillStyle = 'rgba(6, 12, 35, 0.9)';
        ctx.fillRect(x, y, TS, TS);
        ctx.strokeRect(x + 1, y + 1, TS - 2, TS - 2);
      } else if (v === 4) {
        // Pintu Ghost House (garis pink tipis)
        ctx.fillStyle = '#ff66cc';
        ctx.fillRect(x, y + 8, TS, 4);
      } else if (v === 2) {
        // Titik Cincin Petir (+10)
        ctx.fillStyle = '#ffd23f';
        ctx.shadowColor = '#ffd23f';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(x + TS / 2, y + TS / 2, 3, 0, 6.28);
        ctx.fill();
      } else if (v === 3) {
        // Mega Power Pellet Kumon (+50)
        const pulse = 6 + Math.sin(G.t * 0.2) * 2;
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(x + TS / 2, y + TS / 2, pulse, 0, 6.28);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x + TS / 2, y + TS / 2, pulse * 0.5, 0, 6.28);
        ctx.fill();
      }
    }
  }
  ctx.restore();
}

function drawFalisha() {
  const fx = P.x + OX + TS / 2, fy = P.y + OY + TS / 2;

  ctx.save();
  ctx.translate(fx, fy);

  if (G.mode === 'dying') {
    // Animasi putaran saat kalah
    const deathAngle = (G.timer / 90) * 6.28;
    ctx.rotate(deathAngle);
    ctx.scale(G.timer / 90, G.timer / 90);
  } else {
    ctx.rotate(P.angle);
  }

  // Efek Flash Dash (Aura petir berkobar)
  if (G.dashActive > 0) {
    ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 25;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(0, 0, P.radius + 6, 0, 6.28);
    ctx.stroke();
  }

  // Badan Falisha Pac (Kuning Emas Glowing)
  const mouth = (G.mode === 'dying') ? 0.45 : P.mouthAngle;
  ctx.fillStyle = '#ffcc00';
  ctx.beginPath();
  ctx.arc(0, 0, P.radius, mouth, 6.28 - mouth);
  ctx.lineTo(0, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();

  // Bando Merah & Pita Khas Falisha
  ctx.fillStyle = '#ff2a2a';
  ctx.fillRect(-2, -P.radius - 2, 4, P.radius * 2 + 4);
  // Pita bando di kepala
  ctx.beginPath();
  ctx.arc(-2, -P.radius - 3, 4, 0, 6.28);
  ctx.fill();

  // Mata anime imut
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(2, -P.radius / 2, 2.5, 0, 6.28);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(3, -P.radius / 2 - 1, 1, 0, 6.28);
  ctx.fill();

  ctx.restore();
}

function drawGhosts() {
  GHOSTS.forEach(g => {
    const gx = g.x + OX + TS / 2, gy = g.y + OY + TS / 2;
    ctx.save();
    ctx.translate(gx, gy);

    if (g.mode === 'eyes') {
      // Hanya sepasang mata melayang yang kembali ke rumah
      drawGhostEyes(g.dirX, g.dirY);
      ctx.restore();
      return;
    }

    // Warna Hantu: Normal atau Frightened (Biru Neon)
    let bodyColor = g.color;
    if (g.mode === 'fright') {
      const flash = G.frightTimer < 100 && (G.t / 8 | 0) % 2 === 0;
      bodyColor = flash ? '#ffffff' : '#1e40af';
    }

    // Badan Hantu (Setengah lingkaran atas + kaki bergelombang bawah)
    ctx.fillStyle = bodyColor;
    ctx.shadowColor = bodyColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -2, 11, Math.PI, 0, false);
    ctx.lineTo(11, 8);
    // Kaki bergelombang bergerak
    const wave = Math.sin(G.t * 0.3) * 2;
    ctx.lineTo(6, 6 + wave); ctx.lineTo(0, 8); ctx.lineTo(-6, 6 - wave); ctx.lineTo(-11, 8);
    ctx.closePath();
    ctx.fill();

    // Hiasan identitas keluarga di atas kepala hantu
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.font = '7px "Press Start 2P"';
    ctx.textAlign = 'center';
    if (g.id === 'yanto') {
      ctx.fillText('⚡', 0, -14); // Yanto petir kumon
    } else if (g.id === 'pupu') {
      ctx.fillText('🌸', 0, -14); // Pupu bunga
    } else if (g.id === 'arshad') {
      ctx.fillText('🏃', 0, -14); // Arshad lari
    } else if (g.id === 'nono') {
      ctx.fillText('📿', 0, -14); // Babah Nono doa
    }

    // Mata Hantu
    if (g.mode === 'fright') {
      // Mata ketakutan kecil
      ctx.fillStyle = '#ffd23f';
      ctx.beginPath(); ctx.arc(-4, -2, 2, 0, 6.28); ctx.arc(4, -2, 2, 0, 6.28); ctx.fill();
      // Mulut bergelombang panik
      ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, 4); ctx.lineTo(-2, 2); ctx.lineTo(2, 4); ctx.lineTo(6, 2);
      ctx.stroke();
    } else {
      drawGhostEyes(g.dirX, g.dirY);
    }

    ctx.restore();
  });
}

function drawGhostEyes(dx, dy) {
  const offX = dx * 2.5, offY = dy * 2.5;
  // Bagian putih mata
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-4 + offX * 0.4, -2 + offY * 0.4, 3.5, 0, 6.28);
  ctx.arc(4 + offX * 0.4, -2 + offY * 0.4, 3.5, 0, 6.28);
  ctx.fill();
  // Pupil biru gelap
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-4 + offX, -2 + offY, 1.8, 0, 6.28);
  ctx.arc(4 + offX, -2 + offY, 1.8, 0, 6.28);
  ctx.fill();
}

function drawFx() {
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.r, p.r);
  }
  for (const pop of popups) {
    ctx.save();
    ctx.font = '11px "Press Start 2P"';
    ctx.fillStyle = pop.color;
    ctx.shadowColor = '#000'; ctx.shadowBlur = 6;
    ctx.textAlign = 'center';
    ctx.fillText(pop.text, pop.x, pop.y);
    ctx.restore();
  }
}

function drawHUD(cfg) {
  ctx.save();

  // --- HUD Kiri: Skor & Nyawa ---
  ctx.fillStyle = '#00f0ff';
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText('HIGH SCORE', 24, 35);
  ctx.fillStyle = '#fff';
  ctx.fillText(String(Math.max(G.score, G.highScore)).padStart(6, '0'), 24, 55);

  ctx.fillStyle = '#ffd23f';
  ctx.fillText('1UP SCORE', 24, 90);
  ctx.fillStyle = '#fff';
  ctx.fillText(String(G.score).padStart(6, '0'), 24, 110);

  // Nyawa Falisha
  ctx.fillStyle = '#ff66cc';
  ctx.fillText('LIVES', 24, 155);
  for (let i = 0; i < G.lives; i++) {
    const lx = 32 + i * 26, ly = 180;
    ctx.fillStyle = '#ffcc00';
    ctx.beginPath();
    ctx.arc(lx, ly, 9, 0.25, 6.28 - 0.25);
    ctx.lineTo(lx, ly);
    ctx.fill();
  }

  // Nama Stage Aktif
  ctx.fillStyle = cfg.wall;
  ctx.font = '8px "Press Start 2P"';
  ctx.fillText('CURRENT MAZE', 24, 235);
  ctx.fillStyle = '#fff';
  ctx.fillText(`STAGE ${G.stage + 1}`, 24, 255);

  // Sisa Dot
  ctx.fillStyle = '#ffd23f';
  ctx.fillText('DOTS LEFT', 24, 295);
  ctx.fillStyle = '#fff';
  ctx.fillText(`${dotsRemaining} / ${totalDots}`, 24, 315);

  // --- HUD Kanan: Flash Dash & Hantu ---
  ctx.fillStyle = '#ffd23f';
  ctx.font = '10px "Press Start 2P"';
  ctx.fillText('FLASH DASH', W - 155, 72);

  // Gauge Dash Bar
  ctx.fillStyle = 'rgba(10, 16, 40, 0.8)';
  ctx.fillRect(W - 155, 85, 130, 16);
  const readyPct = Math.max(0, 1 - G.dashCooldown / 600);
  ctx.fillStyle = readyPct >= 1 ? '#00f0ff' : '#ff9900';
  ctx.fillRect(W - 153, 87, 126 * readyPct, 12);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect(W - 155, 85, 130, 16);

  ctx.font = '8px "Press Start 2P"';
  ctx.fillStyle = readyPct >= 1 ? '#00f0ff' : '#fff';
  ctx.fillText(readyPct >= 1 ? 'READY! [SPACE]' : 'CHARGING...', W - 155, 117);

  // Daftar Hantu Keluarga
  ctx.fillStyle = '#ff66cc';
  ctx.font = '9px "Press Start 2P"';
  ctx.fillText('GHOST CLAN', W - 155, 155);

  GHOSTS.forEach((gh, idx) => {
    const gy = 180 + idx * 34;
    ctx.fillStyle = gh.color;
    ctx.fillRect(W - 155, gy, 12, 12);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillStyle = '#fff';
    ctx.fillText(gh.name, W - 135, gy + 10);
  });

  // Buah Buah Koleksi
  ctx.fillStyle = '#ffd23f';
  ctx.font = '9px "Press Start 2P"';
  ctx.fillText('FRUIT ITEM', W - 155, 340);
  const fr = FRUITS[Math.min(FRUITS.length - 1, G.stage)];
  ctx.font = '22px sans-serif';
  ctx.fillText(fr.icon, W - 155, 385);
  ctx.font = '8px "Press Start 2P"';
  ctx.fillStyle = '#fff';
  ctx.fillText(`+${fr.pts} PTS`, W - 110, 380);

  ctx.restore();
}

function drawOverlays() {
  if (G.mode === 'get_ready') {
    ctx.save();
    ctx.fillStyle = '#ffd23f'; ctx.font = '22px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.shadowColor = '#ffd23f'; ctx.shadowBlur = 15;
    ctx.fillText('READY!', OX + (COLS * TS) / 2, OY + 12 * TS);
    ctx.restore();
  } else if (G.mode === 'stage_clear') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#00f0ff'; ctx.font = '28px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('STAGE CLEAR!', W / 2, H / 2 - 20);
    ctx.font = '14px "Press Start 2P"'; ctx.fillStyle = '#ffd23f';
    ctx.fillText('MEMPERSIAPKAN LABIRIN BERIKUTNYA...', W / 2, H / 2 + 25);
    ctx.restore();
  } else if (G.mode === 'gameover') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ff2a2a'; ctx.font = '32px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 30);
    ctx.font = '14px "Press Start 2P"'; ctx.fillStyle = '#ffd23f';
    ctx.fillText('TOTAL SKOR: ' + G.score, W / 2, H / 2 + 15);
    ctx.font = '12px "Press Start 2P"'; ctx.fillStyle = '#00f0ff';
    ctx.fillText(COARSE ? 'Sentuh layar untuk main lagi' : 'Tekan Spasi / Enter untuk main lagi', W / 2, H / 2 + 65);
    ctx.restore();
  } else if (G.mode === 'victory') {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffd23f'; ctx.font = '30px "Press Start 2P"'; ctx.textAlign = 'center';
    ctx.fillText('SELURUH 4 LABIRIN TAMAT!', W / 2, H / 2 - 40);
    ctx.fillStyle = '#fff'; ctx.font = '16px "Press Start 2P"';
    ctx.fillText('SELAMAT FALISHA, KAMU JUARA PAC-MAN!', W / 2, H / 2 + 10);
    ctx.fillStyle = '#00f0ff'; ctx.font = '18px "Press Start 2P"';
    ctx.fillText('FINAL SKOR: ' + G.score, W / 2, H / 2 + 50);
    ctx.font = '12px "Press Start 2P"'; ctx.fillStyle = '#ff66cc';
    ctx.fillText(COARSE ? 'Sentuh untuk ke Menu' : 'Tekan Spasi untuk ke Menu', W / 2, H / 2 + 95);
    ctx.restore();
  }
}

function drawTitle() {
  if (coverImg) {
    ctx.drawImage(coverImg, 0, 0, W, H);
  } else {
    ctx.fillStyle = '#060814'; ctx.fillRect(0, 0, W, H);
  }
  const bg = ctx.createLinearGradient(0, H - 150, 0, H);
  bg.addColorStop(0, 'rgba(6,8,20,0)');
  bg.addColorStop(1, 'rgba(6,8,20,0.92)');
  ctx.fillStyle = bg; ctx.fillRect(0, H - 150, W, 150);

  ctx.save();
  ctx.shadowColor = '#000'; ctx.shadowBlur = 10;
  ctx.textAlign = 'center';
  ctx.font = '16px "Press Start 2P"';
  ctx.fillStyle = Math.sin(G.t * 0.1) > 0 ? '#ffd23f' : '#00f0ff';
  ctx.fillText(COARSE ? 'SENTUH LAYAR UNTUK MAIN' : 'TEKAN SPASI / ENTER UNTUK MAIN', W / 2, H - 55);
  ctx.font = '10px "Press Start 2P"'; ctx.fillStyle = '#ff66cc';
  ctx.fillText('4 LABIRIN NEON • 4 HANTU KELUARGA • FLASH DASH', W / 2, H - 25);
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

requestAnimationFrame(loop);

})();
