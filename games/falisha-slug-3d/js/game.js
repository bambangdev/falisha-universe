/* Falisha Slug 3D – run & gun 2.5D ala Metal Slug (Three.js). Logika 60 Hz tetap (1 unit = 40 px game 2D). */
import * as THREE from '../../../shared/vendor/three.module.min.js';
import { CHARS, SOLDIER, YANTO } from './chars.js';
import { MISSIONS, groundAt } from './missions.js';
import { loadAll, portraitURL } from './sprites.js';
import * as A from './actors.js';
import * as W from './world.js';
import { FX } from './weapons.js';
import { makeMech, animateMech, wreckMech, updateBoss } from './boss.js';

const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a), sgn = v => (v > 0) - (v < 0), clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const store = {
  get(k, d) { try { const v = localStorage.getItem('fslug3_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fslug3_' + k, JSON.stringify(v)); } catch (e) {} }
};
const Chip = window.Chip;
const _ = null;
const TRACKS = [
  { bpm: 130, wave: 'square', bass: [48, 48, 51, 53], lead: [72, _, 75, 77, 79, _, 77, 75, 72, 75, 77, _, 80, 79, 77, 75, 72, _, 75, 77, 84, _, 82, 79, 77, _, 75, _, 72, _, _, _] },
  { bpm: 142, wave: 'sawtooth', bass: [45, 45, 48, 50], lead: [69, 69, _, 72, 74, _, 72, 69, 71, _, 74, _, 76, 74, 72, 71, 69, 69, _, 72, 77, _, 76, 74, 72, _, 71, _, 69, _, _, _] },
  { bpm: 152, wave: 'square', bass: [48, 45, 48, 53], lead: [72, _, 75, _, 79, _, 77, 75, 72, _, 75, _, 80, _, 79, 77, 72, _, 75, _, 84, _, 82, 79, 77, _, 75, _, 72, _, _, _] },
  { bpm: 165, wave: 'sawtooth', bass: [40, 43, 40, 45], lead: [64, 64, 67, 64, 70, _, 67, 64, 63, _, 67, _, 72, 70, 67, 63, 64, 64, 67, 64, 76, _, 75, 72, 70, _, 67, _, 64, _, _, _] }
];
const music = i => Chip?.play(TRACKS, i);
function speak(text) {
  if (!Chip || Chip.isMuted()) return;
  try { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.15; u.pitch = 0.85; u.volume = 0.95; speechSynthesis.speak(u); } } catch (e) {}
}
const sfx = {
  pistol: () => { Chip?.beep(750, 0.05, 'square', 0.07, -400); if (Chip?.ensure()) Chip.noise(Chip.now(), 0.06, 0.06, 2500); },
  hmg: () => { Chip?.beep(620, 0.06, 'sawtooth', 0.09, -350); if (Chip?.ensure()) Chip.noise(Chip.now(), 0.08, 0.08, 1800); },
  rocket: () => { Chip?.beep(300, 0.25, 'sawtooth', 0.09, 300); if (Chip?.ensure()) Chip.noise(Chip.now(), 0.2, 0.08, 800); },
  cannon: () => { Chip?.hit(2.2); Chip?.beep(120, 0.35, 'sawtooth', 0.15, -60); },
  grenade: () => Chip?.beep(320, 0.15, 'triangle', 0.06, 150),
  boom: () => Chip?.hit(1.6),
  pickup: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => Chip?.beep(f, 0.08, 'square', 0.05), i * 60)),
  thankyou: () => { speak('Thank you!'); [440, 554, 659].forEach((f, i) => setTimeout(() => Chip?.beep(f, 0.12, 'triangle', 0.06), i * 90)); },
  enterSlug: () => { Chip?.beep(220, 0.12, 'sawtooth', 0.08, 150); setTimeout(() => Chip?.beep(440, 0.18, 'square', 0.08, 200), 100); },
  special: () => [660, 880, 1320].forEach((f, i) => setTimeout(() => Chip?.beep(f, 0.1, 'square', 0.07), i * 50)),
  hit: () => Chip?.hit(0.8),
  ko: () => Chip?.beep(110, 0.5, 'sawtooth', 0.12, -70),
  select: () => Chip?.beep(880, 0.08, 'square', 0.06)
};

/* ---------- renderer, scene, fx ---------- */
const cv = $('game');
const { renderer, scene, camera, sun, cam, halfW } = W.createScene(cv);
const fx = new FX(scene, $('pops'));
const heroShadow = W.makeShadow(1.4); scene.add(heroShadow);
const SPD = { walk: 0.095, crouch: 0.04, jumpV: 0.3125, g: 0.01625, tank: 0.1075, bullet: 0.375 };
const COARSE = matchMedia('(pointer: coarse), (hover: none)').matches;

/* ---------- state ---------- */
let assets = { heroes: {}, bgs: {} }, charIdx = clamp(store.get('char', 0), 0, CHARS.length - 1);
let state = 'loading';
const G = { mis: 0, cx: 0, score: 0, t: 0, clearT: 0, overT: 0, timers: [] };
let M = MISSIONS[0], level = null;
let P = null, tanks = [], boss = null, heli = null, hero = null;
let bullets = [], ebullets = [], bombs = [], enemies = [], hostages = [], drops = [];
const input = { left: 0, right: 0, up: 0, down: 0, fire: 0, jump: 0, bomb: 0, slug: 0, special: 0 };
const keys = {}, pad = { left: 0, right: 0, up: 0, down: 0, fire: 0, jump: 0, bomb: 0, slug: 0, special: 0 }, gp = { ...pad };
let confirmReq = false, tPlay = 0;
const after = (frames, fn) => G.timers.push({ at: G.t + frames, fn });

/* ---------- aktor & entitas ---------- */
function makeRobot(cells) {
  if (cells) return A.makeActor({ h: 1.5 }, cells);
  const g = new THREE.Group(), m = A.mat('#c0c7d1', { metalness: 0.6, roughness: 0.35 }), red = A.mat('#e63946');
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.8), m); body.position.y = 0.95; g.add(body);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.55, 0.7), m); head.position.y = 1.75; g.add(head);
  const eye = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.05), new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff2020', emissiveIntensity: 1.2 })); eye.position.set(0, 1.78, 0.36); g.add(eye);
  const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), m); ant.position.y = 2.2; g.add(ant);
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), red); ball.position.y = 2.42; g.add(ball);
  const arms = [-1, 1].map(s => { const a = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.8, 8), m); a.position.set(s * 0.65, 0.9, 0); g.add(a); return a; });
  const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 12), A.mat('#333')); wheel.rotation.z = Math.PI / 2; wheel.position.y = 0.3; g.add(wheel);
  let ph = 0;
  return { root: g, setFace(f) { g.rotation.y = f * 1.15; }, update(dt, pose, speed) {
    ph += dt * 6; wheel.rotation.x -= speed * 20 * dt; body.position.y = 0.95 + Math.sin(ph) * 0.03;
    arms.forEach((a, i) => { a.rotation.x = pose === 'shoot' ? -1.4 : pose === 'broken' ? rnd(-0.4, 0.4) : Math.sin(ph + i * 3) * 0.3; });
    if (pose === 'broken') { g.rotation.z = Math.sin(ph * 3) * 0.1; eye.material.emissiveIntensity = Math.random() < 0.5 ? 0 : 1.2; }
  } };
}
function addActor(a, x = 0, y = 0, z = 0) { a.root.position.set(x, y, z); scene.add(a.root); return a; }
function removeActor(a) { if (!a) return; scene.remove(a.root || a); A.disposeActor(a); }
function makeTankEntity(x) {
  const mesh = W.makeTank(); mesh.position.set(x, 0, 0); scene.add(mesh);
  return { x, y: 0, vx: 0, active: false, armor: 3, maxArmor: 3, shootCd: 0, wreck: false, mesh };
}

function clearLevel() {
  removeActor(hero); hero = null;
  for (const e of enemies) removeActor(e.actor || e.mesh);
  for (const h of hostages) removeActor(h.actor);
  for (const d of drops) removeActor(d.mesh);
  for (const t of tanks) scene.remove(t.mesh);
  if (boss) { scene.remove(boss.mesh); removeActor(boss.pilot); }
  if (heli) scene.remove(heli.mesh);
  enemies = []; hostages = []; drops = []; tanks = []; boss = null; heli = null; bullets = []; ebullets = []; bombs = []; G.timers = [];
  fx.reset(); W.disposeLevel(scene, level); level = null;
}

function loadMission(idx, keepP = true) {
  clearLevel();
  G.mis = idx; M = MISSIONS[idx]; G.clearT = 0; G.overT = 0;
  const c = CHARS[charIdx];
  const prev = keepP && P ? P : null;
  P = { x: 2.5, y: 0, vx: 0, vy: 0, onGround: true, face: 1, aimUp: false, crouch: false,
    weapon: prev ? prev.weapon : 'pistol', ammo: prev ? { ...prev.ammo } : { H: 0, R: 0, bomb: 10 },
    shootCd: 0, inTank: false, tank: null, hp: prev ? Math.max(50, prev.hp) : c.maxHp, maxHp: c.maxHp,
    invuln: 60, hurtT: 0, shootT: 0, throwT: 0, spT: 0, sp: 3, locks: {} };
  G.cx = halfW();
  level = W.buildLevel(scene, M, assets.bgs[M.bg]);
  hero = addActor(A.makeActor(c, assets.heroes[c.id]), P.x, 0, 1.3);
  tanks = [makeTankEntity(M.tankX)]; if (M.tank2X) tanks.push(makeTankEntity(M.tank2X));
  const others = CHARS.filter(o => o.id !== c.id);
  hostages = M.hostages.map((h, i) => { const who = others[i % others.length];
    return { ...h, who, freed: false, t: 0, actor: addActor(A.makeActor(who, assets.heroes[who.id], 0.95), h.x, h.y, 0.6) }; });
  enemies = M.enemies.map((e, i) => {
    const en = { ...e, face: -1, cd: 60 + (rnd(0, 40) | 0), panic: false, dead: false, vx: 0, vy: 0, t: 0, rot: 0 };
    if (e.type === 'chopper') { en.mesh = W.makeChopper(e.isMiniBoss ? 'mini' : 'enemy'); en.mesh.position.set(e.x, e.y, 0.5 + 0.02 * i); scene.add(en.mesh); en.baseX = e.x; }
    else if (e.type === 'robot') { en.actor = addActor(makeRobot(assets.robot), e.x, e.y, 1.0 + 0.02 * i); en.actor.setFace(-1); }
    else { en.actor = addActor(A.makeActor(SOLDIER, assets.soldier), e.x, e.y, 1.0 + 0.02 * i); en.actor.setFace(-1); }
    return en;
  });
  if (M.isFinalBoss) {
    const mesh = makeMech(); mesh.position.set(M.bossX, 0, -0.5); scene.add(mesh);
    const bc = assets.boss, cell = bc && bc[bc.map?.yanto_idle];
    let pilot;
    if (cell) { pilot = A.billboard(cell, 0, 1.3); pilot.position.y = -0.1; }
    else { pilot = new A.ChibiActor(YANTO); pilot.root.scale.setScalar(0.85); pilot.root.position.y = -0.2; pilot.update(0, 'idle'); pilot = pilot.root; }
    mesh.userData.seat.add(pilot);
    boss = { x: M.bossX, y: 0, hp: 130, maxHp: 130, shootCd: 100, wreck: false, active: false, queue: [], mesh, pilot: null };
  } else {
    const mesh = W.makeChopper('rescue'); mesh.position.set(M.len - 3.5, 11, -1.5); scene.add(mesh);
    heli = { x: M.len - 3.5, y: 11, target: 11, mesh };
  }
  state = 'play'; show('hud');
  hudStatic(); toast(`${M.title}… START!`);
  speak(`Mission ${M.num}. Start!`); music(M.music);
}
function initGame() { G.score = 0; P = null; loadMission(0, false); }

/* ---------- helper pertempuran ---------- */
const spawnEnemyBullet = b => ebullets.push({ life: 75, r: 0.2, ...b });
function killEnemy(e, bonus, label) {
  if (e.panic || e.dead) return;
  G.score += bonus; fx.pop(e.x, e.y + 2.2, label, '#ffd23f', 16); fx.spark(e.x, e.y + 1, '#ffd23f', 10);
  if (e.type === 'soldier') { e.panic = true; e.vx = P.face * 0.1 || 0.1; }
  else if (e.type === 'robot') { e.dead = true; e.t = 0; }
  else { e.dead = true; e.vy = 0; e.rot = 0; }
}
function hitEnemy(e, dmg) { e.hp -= dmg; if (e.hp <= 0) killEnemy(e, e.isMiniBoss ? 800 : 100, e.isMiniBoss ? '+800' : '+100'); }
function hitBoss(dmg) { if (!boss || boss.hp <= 0) return; boss.hp -= dmg; if (boss.hp <= 0) defeatBoss(); }
function freeHostage(h) {
  h.freed = true; sfx.thankyou(); fx.pop(h.x, h.y + 2.2, 'THANK YOU!', '#ffd23f', 18); fx.spark(h.x, h.y + 1, '#ffd23f', 12); G.score += 1000;
  after(30, () => { const mesh = A.makeItem(h.gift, assets.items); mesh.position.set(h.x + 0.9, h.y + 0.5, 1.1); scene.add(mesh); drops.push({ x: h.x + 0.9, y: h.y + 0.5, type: h.gift, life: 400, mesh }); });
}
function defeatBoss() {
  boss.wreck = true; wreckMech(boss.mesh); fx.shake = 0.6; fx.explosion(boss.x - 1, boss.y + 2.5, 2.5); sfx.boom();
  after(12, () => fx.explosion(boss.x + 1, boss.y + 1.5, 2.0)); after(27, () => fx.explosion(boss.x, boss.y + 4, 2.8));
  after(40, () => { fx.pop(boss.x, boss.y + 8, 'HUAAA… KUMONNYA…', '#9ff4ff', 14); });
  speak('All Missions Complete! Victory!'); toast('ALL MISSIONS COMPLETE!'); G.score += 20000;
  after(114, () => { state = 'victory'; sfx.pickup(); showOver(true); });
}
function hurtPlayer(dmg) {
  if (P.invuln > 0) return;
  P.hp -= dmg; P.invuln = 45; P.hurtT = 16; sfx.hit(); fx.spark(P.x, P.y + 1.1, '#ff4d5a', 10); fx.pop(P.x, P.y + 2.2, '-' + dmg, '#ff4d5a', 16);
  if (P.hp <= 0) { P.hp = 0; state = 'over'; G.overT = 0; sfx.ko(); speak('Game Over'); toast('GAME OVER'); music(-1); }
}
function hitTank(t) {
  t.armor--; sfx.hit(); fx.spark(t.x, t.y + 1.5, '#48cae4', 10); fx.pop(t.x, t.y + 2.6, 'ARMOR -1', '#ff4d5a', 14);
  if (t.armor <= 0) { t.wreck = true; t.active = false; P.inTank = false; P.tank = null; P.vy = 0.25; P.y += 0.5; P.onGround = false; fx.explosion(t.x, t.y + 1, 1.6); W.wreckTank(t.mesh); fx.pop(P.x, P.y + 2.2, 'TANK DOWN!', '#ff4d5a', 18); }
}
function useSpecial() {
  const c = CHARS[charIdx], id = c.special.id, x = P.x + P.face * 0.8, y = P.y + 1.4;
  P.sp--; P.spT = 24; sfx.special(); fx.pop(P.x, P.y + 2.6, c.special.name, '#9ff4ff', 14); speak(c.special.name);
  if (id === 'kilat') [-0.35, 0, 0.35].forEach(a => bullets.push({ x, y, vx: P.face * 0.3 * Math.cos(a), vy: 0.3 * Math.sin(a), dmg: 6, life: 40, kind: 'kilat', pierce: true, hit: new Set(), big: 0.5 }));
  else if (id === 'teriak') {
    fx.ringList.push({ x: P.x, y: P.y + 1.2, z: 1.4, r: 0.5, vr: 0.24, life: 25, t: 0, color: '#4cc9f0' }); fx.shake = 0.2;
    for (const e of enemies) if (Math.hypot(e.x - P.x, e.y - P.y) < 6) { hitEnemy(e, 10); if (e.hp > 0 && e.type === 'soldier') { e.cd += 60; } }
    if (boss && boss.active && Math.abs(boss.x - P.x) < 8) hitBoss(10);
  }
  else if (id === 'kopi') bombs.push({ x, y, vx: P.face * 0.18, vy: 0.12, dmg: 12, rad: 2, kind: 'kopi', bounces: 3, life: 150 });
  else if (id === 'makan') { P.hp = Math.min(P.maxHp, P.hp + 40); fx.pop(P.x, P.y + 3, '+40 HP!', '#2ec4b6', 16);
    for (let i = 0; i < 5; i++) bullets.push({ x, y: y + i * 0.1, vx: P.face * 0.2, vy: (i - 2) * 0.05, dmg: 4, life: 90, kind: 'bakso', homing: 0.015, big: 0.3 }); }
  else if (id === 'tinju') bullets.push({ x, y, vx: P.face * 0.2, vy: 0, dmg: 20, life: 120, kind: 'tinju', pierce: true, hit: new Set(), big: 0.6 });
}

/* ---------- update 60 Hz ---------- */
function readInput() {
  const k = keys;
  input.left = k.arrowleft || k.a || pad.left || gp.left; input.right = k.arrowright || k.d || pad.right || gp.right;
  input.up = k.arrowup || k.w || pad.up || gp.up; input.down = k.arrowdown || k.s || pad.down || gp.down;
  input.fire = k.j || pad.fire || gp.fire; input.jump = k[' '] || k.k || pad.jump || gp.jump;
  input.bomb = k.l || pad.bomb || gp.bomb; input.slug = k.e || k.u || pad.slug || gp.slug; input.special = k.i || pad.special || gp.special;
}
function update() {
  G.t++;
  for (const tm of G.timers) if (G.t >= tm.at) tm.fn();
  G.timers = G.timers.filter(tm => G.t < tm.at);
  fx.step();
  if (state === 'over') { G.overT++; if (G.overT === 90) showOver(false); return; }
  if (state !== 'play') return;
  readInput();
  const hw = halfW(); let camL = G.cx - hw;
  const { left: kLeft, right: kRight, up: kUp, down: kDown, jump: kJump, fire: kFire, bomb: kBomb, slug: kSlug, special: kSp } = input;
  if (P.invuln > 0) P.invuln--; if (P.hurtT > 0) P.hurtT--; if (P.shootCd > 0) P.shootCd--; if (P.shootT > 0) P.shootT--; if (P.throwT > 0) P.throwT--; if (P.spT > 0) P.spT--;

  // masuk / keluar tank
  const near = tanks.find(t => !t.wreck && !t.active && Math.abs(P.x - t.x) < 2);
  $('pb-slug').classList.toggle('ready', !!near || P.inTank);
  if (kSlug && !P.locks.slug) {
    P.locks.slug = true;
    if (P.inTank) { const t = P.tank; P.inTank = false; t.active = false; P.tank = null; P.vy = 0.2; P.y += 0.75; P.onGround = false; sfx.enterSlug(); fx.pop(P.x, P.y + 1.5, 'SLUG OUT!', '#48cae4', 14); }
    else if (near) { P.inTank = true; P.tank = near; near.active = true; sfx.enterSlug(); fx.pop(near.x, near.y + 2.6, 'SLUG IN!', '#70e000', 16); }
  }
  if (!kSlug) P.locks.slug = false;

  if (P.inTank) {
    const t = P.tank; t.vx = (kRight ? 1 : 0) - (kLeft ? 1 : 0); t.x += t.vx * SPD.tank;
    t.x = clamp(t.x, camL + 1.5, camL + 2 * hw - 1.75); if (t.vx) P.face = t.vx;
    P.x = t.x; P.y = 0; P.onGround = true; P.crouch = false; P.aimUp = false;
    if (t.shootCd > 0) t.shootCd--;
    if (kFire && t.shootCd <= 0) {
      t.shootCd = 6; sfx.hmg(); P.shootT = 6;
      [0.85, 1.1].forEach(dy => bullets.push({ x: t.x + P.face * 1.4, y: t.y + dy + 0.7, vx: P.face * 0.4, vy: rnd(-0.02, 0.02), dmg: 3, life: 60, kind: 'vulcan' }));
      fx.spark(t.x + P.face * 1.5, t.y + 1.7, '#ffe55c', 4);
    }
    if (kBomb && !P.locks.bomb && P.ammo.bomb > 0) {
      P.locks.bomb = true; P.ammo.bomb--; sfx.cannon(); fx.shake = 0.35;
      bombs.push({ x: t.x + P.face * 1.6, y: t.y + 1.8, vx: P.face * 0.35, vy: 0.075, dmg: 24, rad: 2.1, isCannon: true, life: 70 });
      fx.spark(t.x + P.face * 1.75, t.y + 1.8, '#ff4d5a', 12);
    }
  } else {
    P.aimUp = kUp && !kRight && !kLeft; P.crouch = kDown && P.onGround;
    const sp = P.crouch ? SPD.crouch : SPD.walk;
    P.vx = P.crouch && P.onGround ? 0 : ((kRight ? 1 : 0) - (kLeft ? 1 : 0)) * sp;
    if (P.vx) P.face = sgn(P.vx);
    P.x = clamp(P.x + P.vx, camL + 0.75, camL + 2 * hw - 1);
    const prevY = P.y;
    if (kJump && P.onGround && !P.crouch && !P.locks.jump) { P.vy = SPD.jumpV; P.onGround = false; sfx.grenade(); }
    P.locks.jump = !!kJump;
    if (!P.onGround) {
      P.vy -= SPD.g; P.y += P.vy;
      const gy = groundAt(M, P.x, P.y, prevY);
      if (P.vy <= 0 && P.y <= gy) { P.y = gy; P.vy = 0; P.onGround = true; }
    } else {
      const gy = groundAt(M, P.x, P.y - 0.1, P.y);
      if (P.y > gy + 0.05 && !kJump) P.onGround = false;
    }
    // tembak
    if (kFire && P.shootCd <= 0) {
      const up = kUp, vy = up ? 0.35 : 0, vx = up ? P.face * 0.05 : P.face * SPD.bullet;
      const sy = P.crouch ? P.y + 0.9 : up ? P.y + 2.75 : P.y + 1.7, sx = P.x + (up ? P.face * 0.25 : P.face * 1.1);
      P.shootT = 8;
      if (P.weapon === 'pistol') { P.shootCd = 12; sfx.pistol(); bullets.push({ x: sx, y: sy, vx, vy, dmg: 1.5, life: 60, kind: 'p' }); }
      else if (P.weapon === 'H') { P.shootCd = 6; P.ammo.H--; sfx.hmg(); bullets.push({ x: sx, y: sy + rnd(-0.08, 0.08), vx, vy: vy + rnd(-0.025, 0.025), dmg: 2.8, life: 60, kind: 'H' });
        if (P.ammo.H <= 0) { P.weapon = 'pistol'; fx.pop(P.x, P.y + 2.2, 'PISTOL', '#fff', 12); } }
      else if (P.weapon === 'R') { P.shootCd = 18; P.ammo.R--; sfx.rocket(); bullets.push({ x: sx, y: sy, vx: vx * 0.7, vy, dmg: 8, isRocket: true, life: 80, kind: 'R', homing: 0.02 });
        if (P.ammo.R <= 0) { P.weapon = 'pistol'; fx.pop(P.x, P.y + 2.2, 'PISTOL', '#fff', 12); } }
      fx.spark(sx, sy, '#ffe55c', 4);
    }
    if (kBomb && !P.locks.bomb && P.ammo.bomb > 0) {
      P.locks.bomb = true; P.ammo.bomb--; sfx.grenade(); P.throwT = 14;
      bombs.push({ x: P.x + P.face * 0.75, y: P.y + 1.5, vx: P.face * 0.225, vy: 0.2, dmg: 16, rad: 1.6, life: 75 });
    }
    if (kSp && !P.locks.sp && P.sp > 0) { P.locks.sp = true; useSpecial(); }
    if (!kSp) P.locks.sp = false;
  }
  if (!kBomb) P.locks.bomb = false;

  // kamera
  const maxL = M.len - 2 * hw;
  const mini = enemies.find(e => e.isMiniBoss && !e.dead);
  if (mini && P.x >= mini.x - 13) {
    const lockL = Math.min(maxL, mini.x - 12);
    if (camL < lockL) camL = Math.min(lockL, camL + 0.095);
    P.x = clamp(P.x, camL + 0.75, camL + 2 * hw - 1); if (P.inTank) P.tank.x = P.x;
  } else if (P.x - camL > hw * 0.9 && camL < maxL && (!boss || !boss.active)) camL = Math.min(maxL, P.x - hw * 0.9);
  if (boss && !boss.active && P.x > M.arenaX) { boss.active = true; camL = Math.min(camL, maxL); toast('YANTO-01 MECH!'); speak('Boss! Yanto Mech!'); }
  if (boss && boss.active && boss.hp > 0) { camL = Math.min(camL, maxL); if (camL < maxL) camL = Math.min(maxL, camL + 0.095); }
  if (M.musicAt && !M._musicDone && P.x > M.musicAt.x) { M._musicDone = true; music(M.musicAt.track); }
  G.cx = camL + hw;

  // proyektil pemain
  for (const b of bullets) {
    b.life--;
    if (b.homing) {
      const target = enemies.find(e => !e.dead && !e.panic && Math.hypot(e.x - b.x, e.y + 1 - b.y) < 7) || (boss && boss.hp > 0 && boss.active && b.x > boss.x - 8 ? { x: boss.x, y: boss.y + 2 } : null);
      if (target) { const a = Math.atan2(target.y + 1 - b.y, target.x - b.x); b.vx += Math.cos(a) * b.homing; b.vy += Math.sin(a) * b.homing; }
      if (b.isRocket && b.life % 2 === 0) fx.smoke(b.x, b.y);
    }
    b.x += b.vx; b.y += b.vy;
    const big = b.big || 0;
    for (const e of enemies) {
      if (e.dead || e.panic) continue;
      if (b.pierce && b.hit.has(e)) continue;
      const ey = e.y + (e.type === 'chopper' ? 0 : 1.1), hh = (e.type === 'chopper' ? 0.9 : 1.1) + big, hwid = (e.isMiniBoss ? 1.8 : 0.85) + big;
      if (Math.abs(b.x - e.x) < hwid && Math.abs(b.y - ey) < hh) {
        if (b.pierce) b.hit.add(e); else b.life = 0;
        fx.spark(b.x, b.y, '#ffd23f', 6); if (b.isRocket) fx.explosion(b.x, b.y, 0.8);
        hitEnemy(e, b.dmg);
      }
    }
    if (boss && boss.hp > 0 && boss.active && !(b.pierce && b.hit.has(boss)) && Math.abs(b.x - boss.x) < 3.0 + big && b.y > boss.y && b.y < boss.y + 7.5) {
      if (b.pierce) b.hit.add(boss); else b.life = 0;
      fx.spark(b.x, b.y, '#ff4d5a', 8); if (b.isRocket) fx.explosion(b.x, b.y, 1.1); hitBoss(b.dmg);
    }
    for (const h of hostages) if (!h.freed && Math.abs(b.x - h.x) < 0.8 && Math.abs(b.y - (h.y + 0.9)) < 0.9) { if (!b.pierce) b.life = 0; freeHostage(h); }
  }
  bullets = bullets.filter(b => b.life > 0 && b.x > camL - 2 && b.x < camL + 2 * hw + 2 && b.y > -1 && b.y < 16);

  // bom / granat / meriam / kopi
  for (const b of bombs) {
    b.life--; b.x += b.vx; b.vy -= 0.01375; b.y += b.vy;
    let boom = false;
    if (b.y <= 0.25) { b.y = 0.25; b.vy = -b.vy * 0.45; b.vx *= 0.7; if (b.kind === 'kopi') { boom = true; b.bounces--; if (b.bounces <= 0) b.life = 0; else b.vy = 0.14; } }
    if (b.life <= 0 || (b.isCannon && b.life < 55 && b.y <= 0.5)) { b.life = 0; boom = true; }
    if (boom) {
      fx.explosion(b.x, b.y, b.isCannon ? 1.8 : b.kind === 'kopi' ? 0.9 : 1.3);
      for (const e of enemies) if (!e.dead && !e.panic && Math.hypot(e.x - b.x, e.y + 1 - b.y) < b.rad + 0.8) { e.hp -= b.dmg; if (e.hp <= 0) killEnemy(e, e.isMiniBoss ? 800 : 150, e.isMiniBoss ? '+800' : '+150'); }
      if (boss && boss.hp > 0 && boss.active && Math.hypot(boss.x - b.x, boss.y + 2 - b.y) < b.rad + 2) hitBoss(b.dmg);
      for (const h of hostages) if (!h.freed && Math.hypot(h.x - b.x, h.y - b.y) < b.rad) freeHostage(h);
    }
  }
  bombs = bombs.filter(b => b.life > 0);

  // musuh
  for (const e of enemies) {
    if (e.panic) { e.x += e.vx; continue; }
    if (e.dead) {
      e.t++;
      if (e.type === 'chopper') { e.vy -= 0.01; e.y += e.vy; e.rot += 0.08; e.x += 0.03; if (e.t % 4 === 0) fx.smoke(e.x, e.y); if (e.y <= 0.6) { fx.explosion(e.x, 0.8, e.isMiniBoss ? 2.2 : 1.2); e.gone = true; } }
      else if (e.t > 50) { fx.explosion(e.x, e.y + 0.8, 0.9); e.gone = true; }
      continue;
    }
    if (Math.abs(e.x - G.cx) > hw + 6) continue;
    const dist = P.x - e.x; e.face = sgn(dist) || -1; e.shootT = Math.max(0, (e.shootT || 0) - 1);
    if (e.type === 'chopper') {
      e.x = e.baseX + Math.sin(G.t * 0.04) * 1.2;
      if (--e.cd <= 0 && Math.abs(dist) < 8) { e.cd = e.isMiniBoss ? 55 : 90; spawnEnemyBullet({ x: e.x, y: e.y - 0.5, vx: 0, vy: -0.1125, dmg: 14, life: 90, kind: 'ebomb', ball: true, r: 0.35 }); sfx.pistol();
        if (e.isMiniBoss) spawnEnemyBullet({ x: e.x + e.face * 1.5, y: e.y - 0.8, vx: e.face * 0.17, vy: -0.02, dmg: 12, life: 80, kind: 'e' }); }
    } else if (e.type === 'robot') {
      if (Math.abs(dist) > 3) e.x += e.face * 0.03;
      if (--e.cd <= 0 && Math.abs(dist) < 9) { e.cd = 150; e.shootT = 20; spawnEnemyBullet({ x: e.x + e.face * 0.6, y: e.y + 1.4, vx: e.face * 0.1, vy: 0.15, g: 0.008, dmg: 10, life: 130, kind: 'eball', ball: true, r: 0.3 }); sfx.grenade(); }
    } else {
      if (--e.cd <= 0 && Math.abs(dist) < 9) { e.cd = 100 + (rnd(0, 40) | 0); e.shootT = 14; spawnEnemyBullet({ x: e.x + e.face * 0.75, y: e.y + 1.25, vx: e.face * 0.15, vy: 0, dmg: 12, life: 75, kind: 'e' }); sfx.pistol(); }
    }
  }
  for (const e of enemies) if ((e.panic && (e.x < camL - 4 || e.x > camL + 2 * hw + 4)) || e.gone) { removeActor(e.actor || e.mesh); e.removed = true; }
  enemies = enemies.filter(e => !e.removed);

  // peluru musuh
  for (const eb of ebullets) {
    eb.life--; if (eb.g) eb.vy -= eb.g; eb.x += eb.vx; eb.y += eb.vy;
    if (eb.ball && eb.g && eb.y <= 0.3) { eb.y = 0.3; eb.vy = -eb.vy * 0.6; }
    if (eb.isRocket && eb.life % 2 === 0) fx.smoke(eb.x, eb.y);
    if (eb.y < 0 && !eb.g) { eb.life = 0; fx.explosion(eb.x, 0.3, 0.7); continue; }
    if (P.inTank) { const t = P.tank; if (Math.abs(eb.x - t.x) < 1.6 + eb.r && Math.abs(eb.y - (t.y + 1.25)) < 1.1 + eb.r) { eb.life = 0; hitTank(t); } }
    else if (P.invuln <= 0 && Math.abs(eb.x - P.x) < 0.7 + eb.r && Math.abs(eb.y - (P.y + (P.crouch ? 0.7 : 1.25))) < (P.crouch ? 0.7 : 1.1) + eb.r) { eb.life = 0; hurtPlayer(eb.dmg); }
  }
  ebullets = ebullets.filter(eb => eb.life > 0 && eb.x > camL - 4 && eb.x < camL + 2 * hw + 4);

  // sandera & drop
  for (const h of hostages) if (h.freed) h.t++;
  for (const d of drops) {
    d.life--;
    if (Math.abs(P.x - d.x) < 1.1 && Math.abs(P.y + 0.8 - d.y) < 1.4) {
      d.life = 0; sfx.pickup();
      if (d.type === 'H') { P.weapon = 'H'; P.ammo.H = 200; speak('Heavy Machine Gun!'); fx.pop(P.x, P.y + 2.4, 'HEAVY MACHINE GUN!', '#ff9f1c', 16); G.score += 500; }
      else if (d.type === 'R') { P.weapon = 'R'; P.ammo.R = 30; speak('Rocket Launcher!'); fx.pop(P.x, P.y + 2.4, 'ROCKET LAUNCHER!', '#ff4d5a', 16); G.score += 500; }
      else { P.hp = Math.min(P.maxHp, P.hp + 50); fx.pop(P.x, P.y + 2.4, '+50 HP!', '#2ec4b6', 16); G.score += 300; }
    }
  }
  for (const d of drops) if (d.life <= 0) removeActor(d.mesh);
  drops = drops.filter(d => d.life > 0);

  // heli evakuasi & selesai misi
  if (!M.isFinalBoss) {
    const miniDead = !enemies.some(e => e.isMiniBoss && !e.dead);
    if (heli) heli.target = miniDead ? 4.2 : 11;
    if (miniDead && P.x >= M.len - 3.5) { state = 'clear'; G.clearT = 0; sfx.thankyou(); toast(`MISI ${M.num} SELESAI!`); speak('Mission Complete!'); showClear(); }
  } else if (boss && boss.hp > 0) {
    updateBoss(boss, { P, t: G.t, spawnEnemyBullet, pop: (...a) => fx.pop(...a), spark: (...a) => fx.spark(...a), sfx, speak });
  }
}

/* ---------- visual per frame ---------- */
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function visuals(dt) {
  tPlay += dt;
  if (hero && P) {
    let pose = 'idle';
    const moving = Math.abs(P.vx) > 0.001;
    if (P.inTank) pose = 'inTank';
    else if (P.hurtT > 0) pose = 'hurt';
    else if (P.spT > 0) pose = 'special';
    else if (!P.onGround) pose = 'jump';
    else if (P.crouch) pose = 'crouch';
    else if (P.throwT > 0) pose = 'throw';
    else if (P.shootT > 0) pose = P.aimUp ? 'shootUp' : 'shoot';
    else if (moving) pose = 'run';
    hero.setFace(P.face); hero.update(dt, pose, Math.abs(P.vx));
    if (P.inTank) hero.root.position.set(P.tank.x - 0.3 * P.face, 2.1, 0.1); else hero.root.position.set(P.x, P.y, 1.3);
    hero.root.visible = !(P.invuln > 0 && P.invuln < 40 && Math.floor(tPlay * 14) % 2 && state === 'play');
    heroShadow.position.set(P.x, (P.inTank ? 0 : groundAt(M, P.x, P.y, P.y + 5)) + 0.02, 1.3); heroShadow.visible = !P.inTank;
    heroShadow.scale.setScalar(Math.max(0.4, 1 - (P.y - groundAt(M, P.x, P.y, P.y + 5)) * 0.15));
  }
  for (const t of tanks) {
    t.mesh.position.set(t.x, t.y, 0); if (!t.wreck) { t.mesh.scale.x = t.active ? P.face : t.mesh.scale.x; const spin = t.active ? t.vx * 0.3 : 0; t.mesh.userData.wheels.forEach(w => { w.rotation.z -= spin; }); }
    if (t.active && P.shootT > 0) t.mesh.userData.turret.position.x = -0.2 - rnd(0, 0.1); else t.mesh.userData.turret.position.x = -0.2;
  }
  for (const e of enemies) {
    if (e.mesh) { e.mesh.position.x = e.x; e.mesh.position.y = e.y; e.mesh.rotation.z = e.dead ? e.rot : Math.sin(tPlay * 2) * 0.04; e.mesh.scale.x = (e.isMiniBoss ? 1.8 : 1) * (e.face || -1); e.mesh.userData.rotor.rotation.y += dt * 30; e.mesh.userData.tailRotor.rotation.z += dt * 40; }
    else if (e.actor) {
      e.actor.root.position.x = e.x; e.actor.root.position.y = e.y; e.actor.setFace(e.face || -1);
      const pose = e.panic ? 'panic' : e.dead ? 'broken' : e.shootT > 0 ? 'shoot' : e.type === 'robot' && Math.abs(P.x - e.x) > 3 && Math.abs(e.x - G.cx) < halfW() + 6 ? 'walk' : 'idle';
      e.actor.update(dt, pose, e.panic ? 0.12 : e.type === 'robot' ? 0.03 : 0);
    }
  }
  for (const h of hostages) { h.actor.setFace(1); h.actor.update(dt, h.freed ? 'cheer' : 'tied', 0); }
  for (const d of drops) { d.mesh.position.y = d.y + Math.sin(tPlay * 4) * 0.12; if (d.mesh.userData.spin) d.mesh.userData.spin.rotation.y += dt * 2; d.mesh.visible = !(d.life < 90 && Math.floor(tPlay * 10) % 2); }
  if (boss) { animateMech(boss.mesh, G.t, boss); }
  if (heli) { heli.y += (heli.target - heli.y) * Math.min(1, dt * 1.2); heli.mesh.position.set(heli.x, heli.y + Math.sin(tPlay * 2) * 0.15, -1.5); heli.mesh.userData.rotor.rotation.y += dt * 30; heli.mesh.userData.tailRotor.rotation.z += dt * 40; }
  // kamera
  const cz = cam.z;
  camPos.set(G.cx, 4.6, cz);
  if (state === 'menu') { camPos.set(6, 3.0, cz * 0.8); camLook.set(8, 2.2, 0); camera.position.lerp(camPos, Math.min(1, dt * 3)); camera.lookAt(camLook); }
  else {
    camera.position.x += (camPos.x - camera.position.x) * Math.min(1, dt * 9); camera.position.y = camPos.y; camera.position.z = cz;
    camLook.set(camera.position.x, 3.6, 0); camera.lookAt(camLook);
    if (fx.shake > 0) { camera.position.x += rnd(-1, 1) * fx.shake; camera.position.y += rnd(-1, 1) * fx.shake; }
  }
  sun.position.set(camera.position.x + 6, 14, 10); sun.target.position.set(camera.position.x, 0, 0);
  A.faceCamera(camera);
  fx.sync(camera, bullets.concat(ebullets.filter(b => !b.ball)), bombs.concat(ebullets.filter(b => b.ball)), innerWidth, innerHeight);
}

/* ---------- HUD & panel ---------- */
let toastT = 0;
function toast(s) { const t = $('toast'); t.textContent = s; t.classList.add('show'); toastT = 2.2; }
function show(id) { ['menu', 'clear', 'over', 'pause', 'hud', 'loading'].forEach(k => $(k).classList.toggle('hidden', !id.includes(k))); }
function hudStatic() { $('h-title').textContent = M.title; $('h-name').textContent = CHARS[charIdx].name.toUpperCase(); $('boss-bar').classList.toggle('hidden', !M.isFinalBoss); }
let hudCache = '';
function hud() {
  if (!P) return;
  const arms = P.weapon === 'pistol' ? 'ARMS ∞' : `ARMS ${P.weapon} ${P.ammo[P.weapon]}`;
  const key = `${G.score}|${arms}|${P.ammo.bomb}|${P.sp}|${P.hp}|${P.inTank ? P.tank.armor : -1}|${boss ? boss.hp : -1}|${boss?.active}`;
  if (key === hudCache) return; hudCache = key;
  $('h-score').textContent = 'SCORE ' + String(G.score).padStart(6, '0');
  $('h-arms').textContent = arms; $('h-bomb').textContent = 'BOMB ' + P.ammo.bomb; $('h-sp').textContent = CHARS[charIdx].special.emoji + ' ' + P.sp;
  const hp = $('h-hp').firstElementChild; hp.style.width = Math.max(0, P.hp / P.maxHp * 100) + '%'; hp.classList.toggle('low', P.hp < 30);
  $('h-armor').classList.toggle('hidden', !P.inTank);
  if (P.inTank) $('h-armor').querySelectorAll('b').forEach((b, i) => b.classList.toggle('off', i >= P.tank.armor));
  if (boss) { $('boss-bar').classList.toggle('hidden', !boss.active); $('boss-bar').querySelector('i').style.width = Math.max(0, boss.hp / boss.maxHp * 100) + '%'; }
}
function buildMenu() {
  const grid = $('chars'); grid.innerHTML = '';
  CHARS.forEach((c, i) => {
    const b = document.createElement('button'); b.className = 'char' + (i === charIdx ? ' sel' : '');
    const cells = assets.heroes[c.id], src = (cells && portraitURL(cells[cells.map.portrait] ?? cells[cells.map.idle])) || `assets/faces/${c.id}.jpg`;
    b.innerHTML = `<img src="${src}" alt=""><b>${c.name}</b><small>${c.tag}</small>`;
    b.onclick = () => { Chip?.ensure(); sfx.select(); setChar(i); grid.querySelectorAll('.char').forEach((e, j) => e.classList.toggle('sel', j === i)); };
    grid.appendChild(b);
  });
  $('m-best').textContent = store.get('best', 0).toLocaleString('id-ID');
  const have = CHARS.filter(c => assets.heroes[c.id]).length, extra = ['soldier', 'robot', 'items', 'boss'].filter(k => assets[k]).length + Object.values(assets.bgs).filter(Boolean).length;
  $('m-sprites').textContent = `Sprite Google Flow: ${have}/5 jagoan • ${extra}/7 aset lain`;
  setChar(charIdx);
}
function setChar(i) {
  charIdx = i; store.set('char', i); const c = CHARS[i];
  $('m-special').textContent = `${c.special.emoji} ${c.special.name} — ${c.special.desc}`;
  if (state === 'menu') { removeActor(hero); hero = addActor(A.makeActor(c, assets.heroes[c.id]), 8, 0, 1.3); P = { x: 8, y: 0, vx: 0, face: 1, invuln: 0, onGround: true, shootT: 0, throwT: 0, spT: 0, hurtT: 0 }; }
}
function toMenu() {
  clearLevel(); state = 'menu'; M = MISSIONS[0]; level = W.buildLevel(scene, M, assets.bgs[M.bg]); G.cx = halfW();
  show('menu'); buildMenu(); music(0);
}
function startGame() { Chip?.ensure(); sfx.select(); initGame(); }
function showClear() { $('c-title').textContent = `MISI ${M.num} SELESAI!`; $('c-host').textContent = `${hostages.filter(h => h.freed).length}/${hostages.length}`; $('c-score').textContent = G.score.toLocaleString('id-ID'); show('clear hud'); }
function nextMission() { if (G.mis + 1 < MISSIONS.length) loadMission(G.mis + 1); }
function showOver(victory) {
  const b = store.get('best', 0), nb = G.score > b; if (nb) store.set('best', G.score);
  $('o-title').textContent = victory ? 'SEMUA MISI SELESAI! 🏆' : 'CONTINUE?';
  $('o-score').textContent = G.score.toLocaleString('id-ID'); $('o-best').textContent = Math.max(G.score, b).toLocaleString('id-ID'); $('o-new').classList.toggle('hidden', !nb);
  $('btn-cont').textContent = victory ? '↻ MAIN LAGI' : '↻ LANJUT';
  const rc = assets.heroes[CHARS[charIdx].id]; $('o-face').src = (rc && portraitURL(rc[rc.map[victory ? 'cheer' : 'hurt']] ?? rc[rc.map.portrait])) || `assets/faces/${CHARS[charIdx].id}.jpg`;
  show('over hud');
}
function continueGame() { if (state === 'victory') return initGame(); P.weapon = 'pistol'; P.ammo = { H: 0, R: 0, bomb: 10 }; P.hp = P.maxHp; loadMission(G.mis); }
function pause(on) {
  if (on && state === 'play') { state = 'pause'; show('pause hud'); music(-1); }
  else if (!on && state === 'pause') { state = 'play'; show('hud'); music(M.music); last = performance.now(); }
}

/* ---------- input ---------- */
function gesture() { Chip?.ensure(); if (COARSE && !document.fullscreenElement && state !== 'loading') document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); }
addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' '].includes(k)) e.preventDefault();
  if (!keys[k]) {
    Chip?.ensure();
    if (k === 'enter' || (k === ' ' && state !== 'play')) { if (state === 'menu') startGame(); else if (state === 'clear') nextMission(); else if ((state === 'over' && G.overT >= 90) || state === 'victory') continueGame(); }
    if (k === 'p' || k === 'escape') pause(state === 'play');
    if (k === 'm') toggleMute();
    if (k === 'f') toggleFull();
  }
  keys[k] = true;
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
cv.addEventListener('pointerdown', gesture);
function toggleMute() { Chip?.setMuted(!Chip.isMuted()); $('btn-mute').textContent = Chip?.isMuted() ? '🔇' : '🔊'; }
function toggleFull() { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {}); }
$('btn-mute').onclick = toggleMute; $('btn-mute').textContent = Chip?.isMuted() ? '🔇' : '🔊';
$('btn-pause').onclick = () => pause(state === 'play');
$('btn-full').onclick = toggleFull;
$('btn-start').onclick = startGame; $('btn-next').onclick = nextMission; $('btn-cont').onclick = continueGame; $('btn-menu').onclick = toMenu;
$('btn-resume').onclick = () => pause(false); $('btn-quit').onclick = () => { state = 'over'; toMenu(); };

/* joypad virtual: tombol tahan + dpad sudut. Default menyala di layar sentuh. */
function setPad(on) { document.body.classList.toggle('pad-on', on); store.set('pad', on); $('btn-pad').classList.toggle('off', !on); }
setPad(store.get('pad', COARSE));
$('btn-pad').onclick = () => setPad(!document.body.classList.contains('pad-on'));
document.querySelectorAll('.pbtn').forEach(b => {
  const act = b.dataset.act;
  b.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture?.(e.pointerId); gesture(); pad[act] = 1; b.classList.add('on'); });
  const up = e => { e.preventDefault(); pad[act] = 0; b.classList.remove('on'); };
  ['pointerup', 'pointercancel'].forEach(t => b.addEventListener(t, up));
  b.addEventListener('contextmenu', e => e.preventDefault());
});
(() => {
  const dp = $('dpad'), sp = { up: dp.querySelector('.dp-up'), left: dp.querySelector('.dp-left'), right: dp.querySelector('.dp-right'), down: dp.querySelector('.dp-down') };
  const set = (l, r, u, d) => { pad.left = +l; pad.right = +r; pad.up = +u; pad.down = +d; sp.left.classList.toggle('on', l); sp.right.classList.toggle('on', r); sp.up.classList.toggle('on', u); sp.down.classList.toggle('on', d); };
  const at = (x, y) => { const b = dp.getBoundingClientRect(), dx = x - (b.left + b.width / 2), dy = y - (b.top + b.height / 2);
    if (Math.hypot(dx, dy) < b.width * 0.12) return set(false, false, false, false); const th = b.width * 0.14; set(dx < -th, dx > th, dy < -th, dy > th); };
  dp.addEventListener('pointerdown', e => { e.preventDefault(); dp.setPointerCapture?.(e.pointerId); gesture(); at(e.clientX, e.clientY); });
  dp.addEventListener('pointermove', e => { if (e.buttons > 0 || e.pressure > 0) at(e.clientX, e.clientY); });
  const off = e => { e.preventDefault(); set(false, false, false, false); };
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => dp.addEventListener(t, off));
})();
/* gamepad */
let gpConfirm = false;
function pollPad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  let any = false;
  for (const g of gps) {
    if (!g) continue; any = true; const b = g.buttons, ax = g.axes;
    gp.left = +(ax[0] < -0.5 || b[14]?.pressed); gp.right = +(ax[0] > 0.5 || b[15]?.pressed); gp.up = +(ax[1] < -0.5 || b[12]?.pressed); gp.down = +(ax[1] > 0.5 || b[13]?.pressed);
    gp.jump = +!!b[0]?.pressed; gp.fire = +!!b[2]?.pressed; gp.bomb = +!!b[1]?.pressed; gp.slug = +!!b[3]?.pressed; gp.special = +!!(b[5]?.pressed || b[7]?.pressed);
    const start = !!b[9]?.pressed, conf = !!b[0]?.pressed || start;
    if (conf && !gpConfirm) { if (state === 'menu') startGame(); else if (state === 'clear') nextMission(); else if ((state === 'over' && G.overT >= 90) || state === 'victory') continueGame(); else if (start) pause(state === 'play'); else if (state === 'pause') pause(false); }
    gpConfirm = conf;
  }
  if (!any) for (const k in gp) gp[k] = 0;
}

/* ---------- loop ---------- */
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  pollPad();
  if (state === 'play' || state === 'over') { acc += dt; while (acc >= 1 / 60) { update(); acc -= 1 / 60; } }
  requestAnimationFrame(frame);
  if (state !== 'pause' && state !== 'loading') visuals(dt);
  if (toastT > 0 && (toastT -= dt) <= 0) $('toast').classList.remove('show');
  if (state !== 'menu' && state !== 'loading') hud();
  renderer.render(scene, camera);
}

/* ---------- mulai ---------- */
(async () => {
  show('loading');
  try { assets = await loadAll(CHARS.map(c => c.id)); } catch (e) { console.warn('Sprite gagal dimuat', e); assets = { heroes: {}, bgs: {} }; }
  toMenu();
  requestAnimationFrame(frame);
})();

/* kait untuk smoke test (tools/smoke.js) */
window.__slug = {
  state: () => state, P: () => P, G, tanks: () => tanks, boss: () => boss, enemies: () => enemies, hostages: () => hostages, drops: () => drops,
  bullets: () => bullets, ebullets: () => ebullets, score: () => G.score, mission: () => G.mis, input: pad, fx, renderer, camera,
  start: i => { if (i != null) setChar(i); startGame(); }, next: nextMission, cont: continueGame,
  step(n) { for (let i = 0; i < n && (state === 'play' || state === 'over'); i++) update(); },
  warp(x) { if (!P) return; P.x = x; if (P.inTank) P.tank.x = x; G.cx = clamp(x - halfW() * 0.5, halfW(), Math.max(halfW(), M.len - halfW())); }
};
