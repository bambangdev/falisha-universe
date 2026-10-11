/* Falisha Surfers – endless runner 3D ala Subway Surfers. */
import * as THREE from '../../../shared/vendor/three.module.min.js';
import { CHARS, CHASER } from './chars.js';
import { loadAll, portraitURL } from './sprites.js';
import * as M from './models.js';

const LANES = [-2.4, 0, 2.4], G = 32, JUMP_V = 11, SNEAK_V = 15.5, ROLL_T = 0.7, BOARD_T = 30, CHASE_T = 6;
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const store = {
  get(k, d) { try { const v = localStorage.getItem('fsurf_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fsurf_' + k, JSON.stringify(v)); } catch (e) {} }
};
const Chip = window.Chip;
const sfx = {
  coin: () => Chip?.beep(1568, 0.07, 'square', 0.035),
  jump: () => Chip?.beep(420, 0.14, 'triangle', 0.08, 320),
  roll: () => { if (Chip?.ensure()) Chip.noise(Chip.now(), 0.18, 0.06, 1200); },
  lane: () => Chip?.beep(260, 0.05, 'triangle', 0.05, 90),
  bump: () => Chip?.hit(0.6),
  crash: () => { Chip?.hit(1.6); Chip?.beep(200, 0.5, 'sawtooth', 0.06, -150); },
  power: () => { if (!Chip?.ensure()) return; const t = Chip.now(); [72, 76, 79, 84].forEach((n, i) => Chip.tone(Chip.mtof(n), t + i * 0.07, 0.12, 'square', 0.05)); },
  whistle: () => Chip?.beep(2300, 0.35, 'sine', 0.05, 150)
};
const TRACKS = [
  { bpm: 132, wave: 'square', lead: [72, null, 76, 79, null, 76, 74, null, 72, null, 69, 72, null, 74, 76, null, 77, null, 76, 74, null, 72, 74, null, 76, null, 79, 81, null, 79, 76, null],
    bass: [48, 45, 41, 43] },
  { bpm: 96, wave: 'triangle', lead: [67, null, 71, null, 74, null, 71, null, 69, null, 72, null, 76, null, 72, null], bass: [43, 40, 36, 38] }
];

/* ---------- renderer & scene ---------- */
const cv = $('game');
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = M.canvas(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#4aa8ff'); gr.addColorStop(0.55, '#a9dcff'); gr.addColorStop(1, '#e8f6ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
scene.fog = new THREE.Fog('#cfeaff', 80, 230);
const camera = new THREE.PerspectiveCamera(62, 16 / 9, 0.1, 500);
scene.add(new THREE.HemisphereLight('#eef7ff', '#8a7660', 1.5));
const sun = new THREE.DirectionalLight('#fff0d8', 2.2); sun.position.set(8, 14, 6); scene.add(sun, sun.target);
function resize() {
  const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < 1 ? 78 : 62; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

/* ---------- lingkungan statis yang mengikuti pemain ---------- */
const env = new THREE.Group(); scene.add(env);
const bedTex = M.canvas(512, 128, (g, w, h) => {
  g.fillStyle = '#8f8678'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `hsl(30,${rnd(5, 15)}%,${rnd(35, 62)}%)`; g.fillRect(rnd(0, w), rnd(0, h), rnd(1, 4), rnd(1, 3)); }
  const ppm = w / 9.6;
  LANES.forEach(x => { const cx = (x + 4.8) * ppm; [16, 80].forEach(y => {
    g.fillStyle = '#6b4a32'; g.beginPath(); g.roundRect(cx - 1.0 * ppm, y, 2.0 * ppm, 18, 4); g.fill();
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(cx - 1.0 * ppm + 3, y + 2, 2.0 * ppm - 6, 4); }); });
});
bedTex.wrapT = THREE.RepeatWrapping; bedTex.repeat.set(1, 200);
const bed = new THREE.Mesh(new THREE.PlaneGeometry(9.6, 400), new THREE.MeshStandardMaterial({ map: bedTex, roughness: 0.95 }));
bed.rotation.x = -Math.PI / 2; env.add(bed);
const railM = M.mat('#c9d1da', { metalness: 0.85, roughness: 0.25 });
LANES.forEach(x => [-0.72, 0.72].forEach(o => { const r = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.12, 400), railM); r.position.set(x + o, 0.06, 0); env.add(r); }));
const platTex = M.canvas(256, 64, (g, w, h) => { g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd21a'; g.fillRect(0, 0, 18, h);
  g.strokeStyle = 'rgba(0,0,0,.08)'; for (let x = 30; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } });
platTex.wrapS = platTex.wrapT = THREE.RepeatWrapping; platTex.repeat.set(1, 100);
[-1, 1].forEach(s => {
  const top = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 400), new THREE.MeshStandardMaterial({ map: platTex, roughness: 0.9 }));
  top.rotation.x = -Math.PI / 2; if (s < 0) top.rotation.z = Math.PI; top.position.set(s * 6.4, 0.7, 0); env.add(top);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(400, 0.7), M.mat('#9b968d')); face.rotation.y = -s * Math.PI / 2; face.position.set(s * 4.8, 0.35, 0); env.add(face);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(80, 400), M.mat('#8cc56b', { roughness: 1 })); grass.rotation.x = -Math.PI / 2; grass.position.set(s * 48, 0.69, 0); env.add(grass);
});
let farTex = null;
const far = new THREE.Mesh(new THREE.PlaneGeometry(1100, 260), new THREE.MeshBasicMaterial({ fog: false, transparent: true }));
function skyline() {
  return M.canvas(1024, 256, (g, w, h) => {
    g.fillStyle = '#7fb4d8'; g.beginPath(); g.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) g.lineTo(x, 120 - Math.sin(x / 90) * 40 - Math.sin(x / 31) * 12); g.lineTo(w, h); g.fill();
    for (let x = 0; x < w; x += rnd(18, 40)) { const bh = rnd(30, 110), bw = rnd(16, 36);
      g.fillStyle = pick(['#9cc0dc', '#a7c8e2', '#b4d0e6', '#8fb3d1']); g.fillRect(x, h - bh - 50, bw, bh + 50); }
    g.fillStyle = '#c9e6c0'; g.fillRect(0, h - 52, w, 52);
  });
}
far.position.y = 70; scene.add(far);

/* ---------- aset & aktor ---------- */
let assets = { runners: {} }, trainTex = null, actor = null, chaser = null, cat = null, catSprite = null, charIdx = store.get('char', 0);
const shadowTex = M.canvas(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
shadow.rotation.x = -Math.PI / 2; scene.add(shadow);
function makeActor(c) {
  const cells = assets.runners[c.id];
  const a = cells ? new M.SpriteActor(cells, c.h * 1.12, cells.map) : new M.ChibiActor(c);
  if (!cells) a.root.rotation.y = Math.PI;
  return a;
}
function setChar(i) {
  charIdx = i; store.set('char', i);
  if (actor) scene.remove(actor.root);
  actor = makeActor(CHARS[i]); scene.add(actor.root);
}
function makeChaser() {
  if (chaser) { scene.remove(chaser.root); scene.remove(cat); }
  const cs = assets.chaser;
  if (cs) {
    const m = cs.map || { run: [0, 1, 2, 3], cat: [4, 5], grab: 6 };
    chaser = new M.SpriteActor(cs, CHASER.h * 1.12, { run: m.run, grab: m.grab, caught: m.grab, idle: m.run[0] });
    catSprite = new M.SpriteActor(cs, 0.6, { run: m.cat }); cat = catSprite.root;
  } else {
    chaser = new M.ChibiActor(CHASER); chaser.root.rotation.y = Math.PI;
    catSprite = null; cat = catModel();
  }
  scene.add(chaser.root, cat);
}
function catModel() {
  const g = new THREE.Group(), o = M.mat('#ff9a2e', { roughness: 0.7 }), w = M.mat('#fff3e0');
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 12), o); body.scale.set(0.9, 0.8, 1.4); body.position.y = 0.32; g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), o); head.position.set(0, 0.52, -0.36); g.add(head);
  [-1, 1].forEach(s => { const e = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 8), o); e.position.set(s * 0.1, 0.72, -0.36); g.add(e); });
  const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.4, 4, 8), o); tail.position.set(0, 0.55, 0.42); tail.rotation.x = -0.6; g.add(tail);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), w); belly.position.set(0, 0.25, -0.15); g.add(belly);
  g.userData.legs = [-1, 1].flatMap(s => [-0.2, 0.2].map(z => { const l = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.14, 4, 8), o); l.position.set(s * 0.13, 0.1, z); g.add(l); return l; }));
  return g;
}

/* ---------- state permainan ---------- */
const P = {}, pw = {}, chase = {};
let state = 'loading', objs = [], coins = [], powers = [], decor = [], spawnZ = 0, occ = [], lastUse = [], nextPower = 0, nextDecor = 0,
  nextBld = [0, 0], speed = 0, dist = 0, score = 0, coinRun = 0, deadT = 0, shake = 0, deathKind = '', tPlay = 0;
const best = () => store.get('best', 0);

function clearWorld() {
  for (const o of [...objs, ...coins, ...powers, ...decor]) removeObj(o.obj);
  objs = []; coins = []; powers = []; decor = [];
}
function removeObj(obj) {
  scene.remove(obj);
  obj.traverse(m => { if (m.isMesh && m.userData.disposeGeo) m.geometry.dispose(); });
}
function reset() {
  clearWorld();
  Object.assign(P, { lane: 1, prevLane: 1, x: 0, y: 0, z: 0, pz: 0, vy: 0, roll: 0, ground: true, invuln: 0, coyote: 0, queuedRoll: false });
  Object.assign(pw, { magnet: 0, jetpack: 0, sneakers: 0, double: 0, board: 0 });
  Object.assign(chase, { t: 3.2, d: 3, caught: false });
  spawnZ = -45; occ = [1e9, 1e9, 1e9]; lastUse = [0, 0, 0]; nextPower = -260; nextDecor = 10; nextBld = [20, 20];
  speed = 14; dist = 0; score = 0; coinRun = 0; deadT = 0; tPlay = 0;
  spawnAhead(); spawnDecor();
}

/* ---------- pembuat rintangan ---------- */
function laneFree(l, z) { return z < occ[l] - 5; }
function addObj(o) { scene.add(o.obj); objs.push(o); return o; }
function addTrain(l, zN, len, moving, ramp) {
  const x = LANES[l];
  if (ramp) {
    const r = M.makeRamp(6, M.TRAIN_H); r.position.set(x, 0, zN - 3); addObj({ kind: 'ramp', lane: l, x, zN, zF: zN - 6, obj: r });
    zN -= 6;
  }
  const t = M.makeTrain(trainTex, len, moving); t.position.set(x, 0, zN - len / 2);
  t.traverse(m => { if (m.isMesh) m.userData.disposeGeo = true; });
  addObj({ kind: 'train', lane: l, x, zN, zF: zN - len, v: moving ? 13 : 0, obj: t });
  occ[l] = zN - len; lastUse[l] = Math.min(lastUse[l], zN - len);
  return zN - len;
}
function addBarrier(l, z, type) {
  const o = M.OBST[type], x = LANES[l], obj = M.makeObstacle(type, assets.obstacles);
  obj.position.set(x, 0, z); obj.traverse(m => { if (m.isMesh) m.userData.disposeGeo = true; });
  addObj({ kind: 'bar', type, lane: l, x, zN: z + o.d / 2, zF: z - o.d / 2, y0: o.y0, y1: o.y1, hw: o.w / 2, obj });
  lastUse[l] = Math.min(lastUse[l], z);
}
function addCoin(x, y, z) {
  const obj = M.makeCoin(assets.items); obj.position.set(x, y, z); scene.add(obj);
  coins.push({ x, y, z, obj, flat: !!obj.userData.flat });
}
function coinLine(l, z0, n, yFn) { for (let i = 0; i < n; i++) { const z = z0 - i * 2.2; addCoin(LANES[l], yFn ? yFn(i, z) : 0.75, z); } }
function addPower(l, z, k) {
  const obj = M.makePower(k, assets.items); obj.position.set(LANES[l], 1.1, z); scene.add(obj);
  powers.push({ k, x: LANES[l], y: 1.1, z, obj });
}
function spawnRow(z) {
  const d = Math.min(1, dist / 2500), lanes = [0, 1, 2];
  let free = lanes.filter(l => laneFree(l, z));
  const used = new Set();
  // kereta
  const r = Math.random(), want = r < 0.38 ? 0 : r < 0.85 - 0.1 * d ? 1 : 2;
  for (let k = 0; k < want; k++) {
    if (3 - free.length >= 2 || free.length < 2) break;
    const l = pick(free), len = pick([10, 20, 20, 30]);
    const canMove = lastUse[l] > z + 60 && Math.random() < 0.12 + 0.25 * d;
    const ramp = !canMove && Math.random() < 0.38;
    const end = addTrain(l, z, len, canMove, ramp);
    if (Math.random() < 0.7) { // koin di atap / tanjakan
      if (ramp) for (let i = 0; i < 3; i++) addCoin(LANES[l], 0.9 + (i + 0.5) / 3 * M.TRAIN_H, z - 1 - i * 2);
      coinLine(l, (ramp ? z - 7 : z - 1), Math.floor(len / 2.2), () => M.TRAIN_H + 0.75);
    }
    used.add(l); free = free.filter(x => x !== l); void end;
  }
  // penghalang di jalur bebas
  const barProb = 0.3 + 0.35 * d;
  free.forEach(l => {
    if (Math.random() < barProb) {
      const type = pick(['low', 'low', 'high', 'high', 'cart', 'boxes']); addBarrier(l, z, type); used.add(l);
      if (Math.random() < 0.5) {
        if (type === 'high') coinLine(l, z + 4.4, 5);
        else coinLine(l, z + 4.4, 5, (i) => 0.75 + Math.sin(i / 4 * Math.PI) * 1.6);
      }
    }
  });
  // garis koin di jalur kosong
  const empty = free.filter(l => !used.has(l));
  if (empty.length && Math.random() < 0.6) { const l = pick(empty); coinLine(l, z + 2, 6); lastUse[l] = Math.min(lastUse[l], z - 12); }
  if (z < nextPower && empty.length) {
    const l = pick(empty), k = pick(['magnet', 'magnet', 'jetpack', 'sneakers', 'double', 'double', 'box']);
    addPower(l, z - 6, k); nextPower = z - rnd(260, 420);
  }
}
function spawnAhead() {
  while (spawnZ > P.z - 175) {
    spawnRow(spawnZ);
    spawnZ -= rnd(15, 22) + speed * 0.35;
  }
}
function spawnDecor() {
  while (nextDecor > P.z - 200) {
    const c = M.makeCatenary(); c.position.z = nextDecor; scene.add(c); decor.push({ z: nextDecor, obj: c });
    [-1, 1].forEach(s => {
      const lp = M.makeLamp(assets.obstacles); lp.position.set(s * 6.9, 0.7, nextDecor - 12); if (s < 0 && !assets.obstacles) lp.rotation.y = Math.PI;
      scene.add(lp); decor.push({ z: nextDecor - 12, obj: lp });
      if (Math.random() < 0.6) { const pr = M.makeProp(assets.obstacles); pr.position.set(s * rnd(6.0, 7.4), 0.7, nextDecor - rnd(2, 10));
        if (!assets.obstacles) pr.rotation.y = s > 0 ? -Math.PI / 2 : Math.PI / 2; scene.add(pr); decor.push({ z: pr.position.z, obj: pr }); }
    });
    nextDecor -= 24;
  }
  [-1, 1].forEach((s, i) => {
    while (nextBld[i] > P.z - 230) {
      const w = rnd(5, 9), h = rnd(5, 16), d = rnd(6, 12), b = M.makeBuilding(w, h, d);
      b.position.set(s * (9.5 + w / 2 + rnd(0, 3)), 0.7, nextBld[i] - d / 2); b.traverse(m => { if (m.isMesh) m.userData.disposeGeo = true; });
      scene.add(b); decor.push({ z: nextBld[i] - d, obj: b }); nextBld[i] -= d + rnd(0.5, 4);
    }
  });
}
function cull() {
  const lim = P.z + 14;
  const keep = (arr, zf) => arr.filter(o => { if (zf(o) > lim) { removeObj(o.obj); return false; } return true; });
  objs = keep(objs, o => o.zF); coins = keep(coins, o => o.z); powers = keep(powers, o => o.z); decor = keep(decor, o => o.z);
}

/* ---------- fisika pemain ---------- */
function groundAt(x, z, y) {
  let g = 0;
  for (const o of objs) {
    if (Math.abs(x - o.x) > 1.05 || z > o.zN + 0.35 || z < o.zF - 0.35) continue;
    if (o.kind === 'ramp') { const h = Math.max(0, Math.min(1, (o.zN - z) / (o.zN - o.zF))) * M.TRAIN_H; if (y >= h - 0.9) g = Math.max(g, h); }
    else if (o.kind === 'train' && y >= M.TRAIN_H - 0.9) g = Math.max(g, M.TRAIN_H);
  }
  return g;
}
function moveLane(dir) {
  if (state !== 'play') return;
  const t = P.lane + dir;
  if (t < 0 || t > 2) { sfx.bump(); shake = 0.15; return; }
  P.prevLane = P.lane; P.lane = t; sfx.lane();
}
function jump() {
  if (state !== 'play' || pw.jetpack > 0) return;
  if (P.ground || P.coyote > 0) { P.vy = pw.sneakers > 0 ? SNEAK_V : JUMP_V; P.ground = false; P.coyote = 0; P.roll = 0; sfx.jump(); }
}
function roll() {
  if (state !== 'play' || pw.jetpack > 0) return;
  if (!P.ground) { P.vy = -24; P.queuedRoll = true; } else { P.roll = ROLL_T; sfx.roll(); }
}
function useBoard() {
  if (state !== 'play' || pw.board > 0) return;
  const n = store.get('boards', 3); if (n <= 0) { sfx.bump(); return; }
  store.set('boards', n - 1); pw.board = BOARD_T; if ('hover' in actor) actor.hover = true; sfx.power(); hud();
}
function stumble(o) {
  if (P.invuln > 0) return;
  sfx.bump(); shake = 0.35;
  P.lane = P.prevLane; P.x = o ? o.x + Math.sign(P.x - o.x || 1) * 1.5 : P.x;
  if (chase.t > 0) return die('caught');
  chase.t = CHASE_T; P.invuln = Math.max(P.invuln, 0.6); sfx.whistle();
}
function crash(o) {
  if (P.invuln > 0) return;
  if (pw.board > 0) { pw.board = 0; P.invuln = Math.max(P.invuln, 1.5); shake = 0.4; sfx.crash(); if ('hover' in actor) actor.hover = false; if (o) { removeObj(o.obj); objs = objs.filter(x => x !== o); } return; }
  die('crash');
}
function die(kind) {
  if (state !== 'play') return;
  state = 'dead'; deathKind = kind; deadT = 0; shake = 0.6; sfx.crash(); Chip?.play(TRACKS, -1);
  chase.t = 99;
}
function collectPower(k) {
  sfx.power();
  if (k === 'box') {
    const r = Math.random();
    if (r < 0.35) { store.set('boards', store.get('boards', 3) + 1); toast('+1 Hoverboard 🛹'); }
    else { const n = pick([25, 50, 100]); coinRun += n; toast(`+${n} Koin 🪙`); }
    return;
  }
  pw[k] = M.POWER[k].dur; toast({ magnet: 'Magnet! 🧲', jetpack: 'Jetpack! 🚀', sneakers: 'Sepatu Super! 👟', double: 'Skor x2 ⭐' }[k]);
  if (k === 'jetpack') { // jalur koin di udara
    let l = P.lane;
    for (let z = P.z - 18, i = 0; z > P.z - 18 - (speed + 4) * pw.jetpack; z -= 2.4, i++) {
      if (i % 12 === 11) l = Math.max(0, Math.min(2, l + pick([-1, 1])));
      addCoin(LANES[l], 7.6, z);
    }
  }
}

function update(dt) {
  tPlay += dt;
  speed = Math.min(31, 14 + dist / 180) * (pw.jetpack > 0 ? 1.15 : 1);
  P.pz = P.z; P.z -= speed * dt; dist += speed * dt;
  for (const o of objs) if (o.v) { o.zN += o.v * dt; o.zF += o.v * dt; o.obj.position.z += o.v * dt; }
  // lateral
  const tx = LANES[P.lane], dx = tx - P.x; P.x += Math.sign(dx) * Math.min(Math.abs(dx), dt * 17);
  // timers
  for (const k of ['magnet', 'jetpack', 'sneakers', 'double', 'board']) if (pw[k] > 0) { pw[k] = Math.max(0, pw[k] - dt); if (!pw[k] && k === 'jetpack') { P.invuln = Math.max(P.invuln, 1.2); P.vy = 0; } if (!pw[k] && k === 'board' && 'hover' in actor) actor.hover = false; }
  P.invuln = Math.max(0, P.invuln - dt); P.roll = Math.max(0, P.roll - dt);
  if (chase.t > 0) chase.t -= dt;
  // vertikal
  const gnd = groundAt(P.x, P.z, P.y);
  if (pw.jetpack > 0) { P.y += (7.2 - P.y) * Math.min(1, dt * 3); P.vy = 0; P.ground = false; }
  else {
    P.vy -= G * dt; P.y += P.vy * dt;
    if (P.y <= gnd) {
      if (!P.ground && P.queuedRoll) { P.roll = ROLL_T; P.queuedRoll = false; sfx.roll(); }
      P.y = gnd; P.vy = 0; P.ground = true; P.coyote = 0.1;
    } else if (P.y - gnd > 0.05) { if (P.ground) P.coyote = 0.1; P.ground = false; P.coyote = Math.max(0, P.coyote - dt); }
  }
  // tabrakan
  const hgt = P.roll > 0 ? 0.8 : 1.6;
  for (const o of objs) {
    if (o.kind === 'ramp') continue;
    const hw = o.kind === 'train' ? M.TRAIN_W / 2 : o.hw;
    if (Math.abs(P.x - o.x) > hw + 0.32 || P.z - 0.3 > o.zN || P.z + 0.3 < o.zF) continue;
    const y0 = o.kind === 'train' ? 0 : o.y0, y1 = o.kind === 'train' ? M.TRAIN_H : o.y1;
    if (P.y + hgt <= y0 || P.y >= y1 - (o.kind === 'train' ? 0.85 : 0.05)) continue;
    const front = P.pz - 0.3 >= o.zN - speed * dt - (o.v || 0) * dt - 0.05;
    if (front && Math.abs(P.x - o.x) < hw + 0.05) { crash(o); if (state !== 'play') return; }
    else stumble(o);
    break;
  }
  // koin
  const mag = pw.magnet > 0, mult = pw.double > 0 ? 2 : 1;
  coins = coins.filter(c => {
    const dz = c.z - P.z;
    if (mag && dz < 2 && dz > -14) { c.x += (P.x - c.x) * Math.min(1, dt * 10); c.y += (P.y + 0.8 - c.y) * Math.min(1, dt * 10); c.z += (P.z - c.z) * Math.min(1, dt * 6); }
    if (Math.abs(c.x - P.x) < 0.9 && Math.abs(c.z - P.z) < 1.1 && Math.abs(c.y - (P.y + 0.8)) < 1.3) {
      coinRun++; score += 5 * mult; sfx.coin(); removeObj(c.obj); return false;
    }
    c.obj.position.set(c.x, c.y, c.z);
    if (c.flat) c.obj.scale.x = Math.max(0.15, Math.abs(Math.cos(tPlay * 4 + c.z * 0.3))); else c.obj.rotation.y = tPlay * 4 + c.z * 0.3;
    return true;
  });
  powers = powers.filter(p => {
    p.obj.position.y = p.y + Math.sin(tPlay * 3 + p.z) * 0.15; p.obj.userData.ring.rotation.z = tPlay * 2;
    if (Math.abs(p.x - P.x) < 1 && Math.abs(p.z - P.z) < 1.2 && Math.abs(p.y - (P.y + 0.8)) < 1.4) { collectPower(p.k); removeObj(p.obj); return false; }
    return true;
  });
  score += speed * dt * 0.5 * mult;
  spawnAhead(); spawnDecor(); cull();
}

/* ---------- visual pemain, pengejar, kamera ---------- */
function poseOf() {
  if (state === 'dead') return deathKind === 'caught' ? 'caught' : 'stumble';
  if (state !== 'play') return 'idle';
  if (pw.jetpack > 0) return 'jet';
  if (P.roll > 0) return 'roll';
  if (!P.ground && P.y > 0.15 + groundAt(P.x, P.z, P.y)) return P.vy > 0 ? 'jump' : 'fall';
  if (pw.board > 0) return 'hover';
  if (P.invuln > 0 && chase.t > CHASE_T - 0.5) return 'stumble';
  return 'run';
}
const camPos = new THREE.Vector3(0, 4, 8), camLook = new THREE.Vector3();
function visuals(dt) {
  const pose = poseOf(), lean = (LANES[P.lane] - P.x) / 2.4;
  actor.update(dt, pose, speed, state === 'play' ? lean : 0);
  actor.root.position.set(P.x, P.y + (pw.board > 0 && actor.board ? 0.12 : 0), P.z);
  actor.root.visible = !(P.invuln > 0 && P.invuln < 5 && pw.board === 0 && Math.floor(tPlay * 12) % 2 && state === 'play');
  shadow.position.set(P.x, groundAt(P.x, P.z, P.y) + 0.03, P.z); shadow.scale.setScalar(Math.max(0.4, 1 - (P.y - groundAt(P.x, P.z, P.y)) * 0.12));
  // pengejar
  const dTarget = state === 'dead' ? 1.2 : chase.t > 0 && pw.jetpack <= 0 ? 2.6 : 16;
  chase.d += (dTarget - chase.d) * Math.min(1, dt * (state === 'dead' ? 4 : 1.5));
  const cx = chaser.root.position.x + (P.x - 0.55 - chaser.root.position.x) * Math.min(1, dt * 5);
  const cy = chaser.root.position.y, cg = Math.min(P.y, groundAt(cx, P.z + chase.d, P.y));
  chaser.root.position.set(cx, cy + (cg - cy) * Math.min(1, dt * 8), P.z + chase.d);
  chaser.update(dt, state === 'dead' ? 'grab' : 'run', state === 'menu' ? 0 : speed);
  chaser.root.visible = state !== 'menu';
  cat.visible = state !== 'menu';
  cat.position.set(cx + 1.2, chaser.root.position.y, P.z + chase.d - 0.8);
  if (cat.userData.legs) cat.userData.legs.forEach((l, i) => { l.rotation.x = Math.sin(tPlay * 18 + i * 1.6) * 0.8; });
  if (catSprite) catSprite.update(dt, 'run', speed);
  // kamera
  if (state === 'menu' || state === 'loading') {
    const wide = camera.aspect > 1.1;
    camPos.set(P.x + (wide ? 0.6 : 0), 1.7, P.z - (wide ? 4.4 : 5.6)); camLook.set(P.x + (wide ? 1.5 : 0), wide ? 1.0 : 2.0, P.z);
    camera.position.lerp(camPos, Math.min(1, dt * 3)); camera.lookAt(camLook);
  } else {
    const yb = pw.jetpack > 0 ? P.y * 0.9 : P.y * 0.7;
    camPos.set(P.x * 0.55, yb + 3.9, P.z + 6.6);
    camera.position.x += (camPos.x - camera.position.x) * Math.min(1, dt * 7);
    camera.position.y += (camPos.y - camera.position.y) * Math.min(1, dt * 5);
    camera.position.z = camPos.z;
    camLook.set(P.x * 0.5, yb + 1.2, P.z - 8); camera.lookAt(camLook);
    if (shake > 0) { camera.position.x += rnd(-1, 1) * shake * 0.3; camera.position.y += rnd(-1, 1) * shake * 0.3; shake = Math.max(0, shake - dt); }
  }
  // lingkungan mengikuti
  const snap = Math.round(P.z / 2) * 2; env.position.z = snap - 150;
  far.position.z = P.z - 330; far.position.x = P.x * 0.3;
  sun.position.set(P.x + 8, 14, P.z + 6); sun.target.position.set(P.x, 0, P.z - 6);
}

/* ---------- HUD & UI ---------- */
function hud() {
  $('h-score').textContent = Math.floor(score).toLocaleString('id-ID');
  $('h-coins').textContent = coinRun;
  $('h-mult').textContent = pw.double > 0 ? 'x2' : '';
  $('h-mult').classList.toggle('on', pw.double > 0);
  $('h-board').textContent = '🛹 ' + store.get('boards', 3);
  $('h-board').classList.toggle('active', pw.board > 0);
  const bars = ['magnet', 'jetpack', 'sneakers', 'double', 'board'].filter(k => pw[k] > 0);
  $('h-powers').innerHTML = bars.map(k => {
    const dur = k === 'board' ? BOARD_T : M.POWER[k].dur;
    return `<div class="pbar"><span>${M.POWER[k].emoji}</span><i style="width:${pw[k] / dur * 100}%;background:${M.POWER[k].color}"></i></div>`;
  }).join('');
}
let toastT = 0;
function toast(s) { const t = $('toast'); t.textContent = s; t.classList.add('show'); toastT = 1.6; }
function show(id) { ['menu', 'over', 'pause', 'hud', 'loading'].forEach(k => $(k).classList.toggle('hidden', !id.includes(k))); }

function buildMenu() {
  const grid = $('chars'); grid.innerHTML = '';
  CHARS.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'char' + (i === charIdx ? ' sel' : '');
    const cells = assets.runners[c.id], src = (cells && portraitURL(cells[cells.map.portrait] || cells[cells.map.idle])) || `assets/faces/${c.id}.jpg`;
    b.innerHTML = `<img src="${src}" alt=""><b>${c.name}</b><small>${c.tag}</small>`;
    b.onclick = () => { Chip?.ensure(); Chip?.beep(880, 0.06); setChar(i); grid.querySelectorAll('.char').forEach((e, j) => e.classList.toggle('sel', j === i)); };
    grid.appendChild(b);
  });
  $('m-best').textContent = best().toLocaleString('id-ID');
  $('m-coins').textContent = store.get('coins', 0).toLocaleString('id-ID');
  $('m-boards').textContent = store.get('boards', 3);
  const have = CHARS.filter(c => assets.runners[c.id]).length;
  const extra = ['chaser', 'items', 'obstacles'].filter(k => assets[k]).length + ['trainFront', 'trainSide', 'city'].filter(k => assets[k]).length;
  $('m-sprites').textContent = `Sprite Nano Banana: ${have}/5 pelari • ${extra}/6 aset lain`;
}
function toMenu() {
  state = 'menu'; reset(); show('menu'); buildMenu(); Chip?.play(TRACKS, 1);
}
function start() {
  Chip?.ensure(); reset(); state = 'play'; show('hud'); Chip?.play(TRACKS, 0); sfx.whistle();
}
function gameOver() {
  state = 'over';
  const b = best(), s = Math.floor(score), nb = s > b;
  if (nb) store.set('best', s);
  store.set('coins', store.get('coins', 0) + coinRun);
  $('o-title').textContent = deathKind === 'caught' ? 'Ketangkap Pak Satpam! 👮' : 'Nabrak! 💥';
  $('o-score').textContent = s.toLocaleString('id-ID'); $('o-coins').textContent = coinRun;
  $('o-best').textContent = Math.max(s, b).toLocaleString('id-ID'); $('o-new').classList.toggle('hidden', !nb);
  const rc = assets.runners[CHARS[charIdx].id];
  $('o-face').src = (rc && portraitURL(rc[rc.map.caught] || rc[rc.map.portrait])) || `assets/faces/${CHARS[charIdx].id}.jpg`;
  show('over');
}
function pause(on) {
  if (on && state === 'play') { state = 'pause'; show('pause hud'); Chip?.play(TRACKS, -1); }
  else if (!on && state === 'pause') { state = 'play'; show('hud'); Chip?.play(TRACKS, 0); last = performance.now(); }
}

/* ---------- input ---------- */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
  if (state === 'menu' && (k === 'enter' || k === ' ')) return start();
  if (state === 'over' && (k === 'enter' || k === ' ')) return start();
  if (k === 'p' || k === 'escape') return pause(state === 'play');
  if (k === 'm') return toggleMute();
  if (state !== 'play') return;
  if (k === 'arrowleft' || k === 'a') moveLane(-1);
  else if (k === 'arrowright' || k === 'd') moveLane(1);
  else if (k === 'arrowup' || k === 'w' || k === ' ') jump();
  else if (k === 'arrowdown' || k === 's') roll();
  else if (k === 'h' || k === 'b' || k === 'shift') useBoard();
});
let sw = null, lastTap = 0;
cv.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY, done: false }; Chip?.ensure(); });
cv.addEventListener('pointermove', e => {
  if (!sw || sw.done) return;
  const dx = e.clientX - sw.x, dy = e.clientY - sw.y, th = Math.max(26, innerWidth * 0.03);
  if (Math.max(Math.abs(dx), Math.abs(dy)) < th) return;
  sw.done = true;
  if (Math.abs(dx) > Math.abs(dy)) moveLane(dx < 0 ? -1 : 1); else if (dy < 0) jump(); else roll();
});
cv.addEventListener('pointerup', () => {
  if (sw && !sw.done && state === 'play') { const now = performance.now(); if (now - lastTap < 320) useBoard(); lastTap = now; }
  sw = null;
});
function toggleMute() { Chip?.setMuted(!Chip.isMuted()); $('btn-mute').textContent = Chip?.isMuted() ? '🔇' : '🔊'; }
$('btn-mute').onclick = toggleMute;
$('btn-mute').textContent = Chip?.isMuted() ? '🔇' : '🔊';
$('btn-pause').onclick = () => pause(state === 'play');
$('btn-full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};
$('btn-start').onclick = start;
$('btn-again').onclick = start;
$('btn-menu').onclick = toMenu;
$('btn-resume').onclick = () => pause(false);
$('btn-quit').onclick = () => { state = 'over'; toMenu(); };
$('h-board').onclick = useBoard;

/* ---------- loop ---------- */
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (state === 'play') update(dt);
  else if (state === 'dead') { deadT += dt; tPlay += dt; if (deadT > 1.6) gameOver(); }
  else if (state === 'menu') tPlay += dt;
  if (state !== 'pause' && state !== 'loading') visuals(dt);
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('show');
  if (state === 'play' || state === 'dead') hud();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

/* ---------- mulai ---------- */
(async () => {
  show('loading');
  try { assets = await loadAll(CHARS.map(c => c.id)); } catch (e) { console.warn('Sprite gagal dimuat', e); assets = { runners: {} }; }
  trainTex = M.trainTextures(assets);
  far.material.map = assets.city ? M.imgTexture(assets.city) : (farTex = skyline());
  if (assets.city) {
    const t = far.material.map, ar = assets.city.width / assets.city.height, tileW = 520, W = 1600;
    t.wrapS = THREE.MirroredRepeatWrapping; t.repeat.x = W / tileW;
    far.material.transparent = false; far.scale.set(W / 1100, tileW / ar / 260, 1); far.position.y = tileW / ar / 2 - 40;
    // langit menyambung dengan warna bagian atas gambar
    const c = document.createElement('canvas'); c.width = 32; c.height = 4;
    c.getContext('2d').drawImage(assets.city, 0, 0, assets.city.width, assets.city.height * 0.04, 0, 0, 32, 4);
    const d = c.getContext('2d').getImageData(0, 0, 32, 4).data; let r = 0, g = 0, b = 0;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const n = d.length / 4, top = `rgb(${r / n | 0},${g / n | 0},${b / n | 0})`;
    scene.background = new THREE.Color(top);
  }
  far.material.needsUpdate = true;
  setChar(Math.min(charIdx, CHARS.length - 1)); makeChaser();
  toMenu();
  requestAnimationFrame(frame);
})();

/* kait untuk smoke test (tools/smoke.js) */
window.__surf = { P, pw, chase, state: () => state, score: () => score, dist: () => dist, objs: () => objs.length, coins: () => coins.length,
  collectPower, start, jump, roll, moveLane, useBoard, actor: () => actor, chaser: () => chaser, camera,
  step(n) { for (let i = 0; i < n && state === 'play'; i++) update(1 / 60); } };
