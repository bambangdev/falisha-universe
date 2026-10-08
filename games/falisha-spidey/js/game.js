/* Falisha Spidey & Sahabat – logika utama (platformer ayun jaring) */
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const W = 960, H = 540, GY = Levels.GY;
const G = 1800, JUMP = 720, SPEED = 270;

/* ---------- Audio ---------- */
const TRACKS = [
  { bpm: 140, wave: 'square', bass: [48, 53, 55, 48], lead: [72, null, 76, 79, 84, null, 79, 76, 77, null, 81, 84, 79, null, 76, 74, 72, null, 76, 79, 84, 86, 88, null, 86, 84, 81, 79, 77, 76, 74, null] },
  { bpm: 128, wave: 'triangle', bass: [45, 50, 52, 45], lead: [69, 72, 76, null, 74, 72, 69, null, 71, 74, 77, null, 76, 74, 71, null, 69, 72, 76, 81, 79, 76, 72, null, 74, 77, 79, 77, 76, 72, 69, null] },
  { bpm: 150, wave: 'square', bass: [43, 46, 48, 50], lead: [67, 70, 74, 70, 79, 74, 70, 67, 68, 72, 75, 72, 80, 75, 72, 68, 70, 74, 77, 74, 82, 77, 74, 70, 72, 75, 79, 82, 84, null, 79, null] },
  { bpm: 168, wave: 'sawtooth', bass: [40, 40, 43, 38], lead: [64, 64, 76, 64, 75, 64, 74, 73, 64, 64, 76, 64, 79, 78, 77, 76, 64, 64, 76, 64, 75, 64, 74, 73, 71, 72, 74, 76, 77, 79, 81, 83] }
];
const SFX = {
  thwip: () => { Chip.beep(1400, 0.08, 'square', 0.04, -900); },
  jump: () => Chip.beep(420, 0.12, 'square', 0.05, 380),
  swing: () => { Chip.beep(900, 0.06, 'triangle', 0.06, 600); Chip.beep(1500, 0.05, 'square', 0.03); },
  token: () => { Chip.beep(1320, 0.06, 'square', 0.04); setTimeout(() => Chip.beep(1760, 0.08, 'square', 0.04), 50); },
  webbed: () => { Chip.beep(600, 0.15, 'triangle', 0.08, 500); },
  hurt: () => Chip.hit(1),
  save: () => [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.12, 'square', 0.05), i * 90)),
  swap: () => { Chip.beep(500, 0.08, 'triangle', 0.07, 700); },
  boom: () => Chip.hit(2),
  team: () => [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.18, 'square', 0.06), i * 80)),
  clear: () => [659, 784, 1047, 784, 1047, 1319].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.16, 'square', 0.06), i * 120))
};
function setMuted(m) { Chip.setMuted(m); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }
setMuted(Chip.isMuted());

let unlocked = 1;
try { unlocked = Math.max(1, Math.min(3, +localStorage.getItem('fsp_unlocked') || 1)); } catch (e) {}
function saveUnlock(n) { unlocked = Math.max(unlocked, n); try { localStorage.setItem('fsp_unlocked', unlocked); } catch (e) {} }

/* ---------- Input ---------- */
const keys = {}, pressed = {};
function press(k) { if (!keys[k]) pressed[k] = true; keys[k] = true; Chip.ensure(); }
function release(k) { keys[k] = false; }
const KMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'jump', w: 'jump', W: 'jump', ' ': 'jump',
  j: 'shoot', J: 'shoot', z: 'shoot', Z: 'shoot', k: 'swing', K: 'swing', x: 'swing', X: 'swing', l: 'swap', L: 'swap', c: 'swap', C: 'swap', u: 'team', U: 'team', v: 'team', V: 'team', Enter: 'ok' };
addEventListener('keydown', e => {
  if (e.key === 'm' || e.key === 'M') { setMuted(!Chip.isMuted()); return; }
  const k = KMAP[e.key]; if (!k) return;
  e.preventDefault(); press(k);
  if (k === 'jump' || k === 'shoot') pressed.ok = true;
});
addEventListener('keyup', e => { const k = KMAP[e.key]; if (k) release(k); });
document.querySelectorAll('#touch .tbtn').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); b.setPointerCapture?.(e.pointerId); b.classList.add('on'); press(k); };
  const off = e => { e.preventDefault(); b.classList.remove('on'); release(k); };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('lostpointercapture', off);
});
cv.addEventListener('pointerdown', e => {
  Chip.ensure();
  const r = cv.getBoundingClientRect(), s = Math.min(r.width / W, r.height / H);
  const x = (e.clientX - r.left - (r.width - W * s) / 2) / s, y = (e.clientY - r.top - (r.height - H * s) / 2) / s;
  tap(x, y);
});
document.getElementById('btn-mute').onclick = e => { e.stopPropagation(); setMuted(!Chip.isMuted()); };
document.getElementById('btn-full').onclick = e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};
const teamBtn = document.querySelector('#touch .team');

/* ---------- State ---------- */
const HERO_IDS = ['falisha', 'pupu', 'baymax'];
const S = { mode: 'title', t: 0, modeT: 0, stage: 0, score: 0, stars: 0 };
let L, P, team, act, shots, enemies, bombs, waves, parts, pops, tokens, civs, bosses, cam, meter, checkpoint, msg, shake, teamT, bossOn, clearT;

function startStage(i) {
  S.stage = i; L = Levels.build(i);
  team = HERO_IDS.map(id => ({ id, hp: 3 }));
  act = 0; meter = 0; checkpoint = 60; cam = 0; shake = 0; teamT = 0; bossOn = false; clearT = 0;
  shots = []; bombs = []; waves = []; parts = []; pops = []; bosses = [];
  enemies = L.enemies.map(e => ({ ...e, hp: 2, t: Math.random() * 6, bx: e.x, by: e.y, vx: 60, webT: 0, cd: 2 + Math.random() * 2 }));
  tokens = L.tokens.map(t => ({ ...t, got: false }));
  civs = L.civs.map(c => ({ ...c, saved: false }));
  resetPlayer(checkpoint);
  S.mode = 'intro'; S.modeT = 0; msg = null;
  Chip.play(TRACKS, L.music);
}
function resetPlayer(x) {
  P = { x, y: GY, vx: 0, vy: 0, face: 1, onGround: true, jumps: 0, rope: null, inv: 1.5, cd: 0, pose: 'idle', shootT: 0, safeX: x };
}
const hero = () => team[act];
function say(text, t = 2.2) { msg = { text, t }; }

/* ---------- Partikel ---------- */
function burst(x, y, col, n = 10, sp = 220) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = sp * (0.3 + Math.random()); parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.6 + Math.random() * 0.4, col, s: 3 + Math.random() * 3 }); }
}
function pop(x, y, text, col = '#ffe14d') { pops.push({ x, y, text, col, life: 1 }); }
function addMeter(n) { meter = Math.min(100, meter + n); }

/* ---------- Pemain ---------- */
function findAnchor() {
  const range = hero().id === 'falisha' ? 520 : 430;
  let best = null, bd = 1e9;
  for (const a of L.anchors) {
    const dx = a.x - P.x, dy = (P.y - 45) - a.y;
    if (dy < 80) continue;
    const d = Math.hypot(dx, dy);
    if (d > range) continue;
    const score = d - dx * P.face * 0.6;   // utamakan jangkar di depan
    if (score < bd) { bd = score; best = a; }
  }
  return best;
}
function hurt(n, fall) {
  if (P.inv > 0 && !fall) return;
  const h = hero();
  h.hp -= h.id === 'baymax' ? n * 0.5 : n;
  P.inv = 1.4; shake = 8; SFX.hurt();
  burst(P.x, P.y - 40, '#fff', 8);
  if (!fall) { P.vx = -P.face * 260; P.vy = -380; P.rope = null; }
  if (h.hp <= 0) {
    h.hp = 0;
    const next = team.findIndex(t => t.hp > 0);
    if (next >= 0) { say(`${Art.HEROES[h.id].name} pingsan! Ayo ${Art.HEROES[team[next].id].name}!`); act = next; SFX.swap(); }
    else {
      team.forEach(t => (t.hp = 3)); act = 0;
      say('Ayo coba lagi! Tim bangkit!');
      resetPlayer(bossOn ? L.arenaX + 120 : checkpoint); return;
    }
  }
  if (fall) {
    const pitX = P.x, next = L.ground.find(([a]) => a > P.safeX);
    S.falls = S.fallAt === P.safeX ? (S.falls || 0) + 1 : 1; S.fallAt = P.safeX;
    let x = P.safeX;
    if (S.falls >= 2 && next && next[0] > pitX - 400) { x = next[0] + 60; S.falls = 0; say('Teman membantu menyeberang!', 1.6); }
    resetPlayer(x); P.inv = 1.4;
  }
}
function swapHero(dir = 1) {
  for (let k = 1; k <= 3; k++) { const n = (act + dir * k + 3) % 3; if (team[n].hp > 0 && n !== act) { act = n; SFX.swap(); burst(P.x, P.y - 40, '#9fd8ff', 14); P.inv = Math.max(P.inv, 0.4); pop(P.x, P.y - 90, Art.HEROES[team[n].id].name, '#9fd8ff'); return; } }
}
function shoot() {
  const id = hero().id, ox = P.x + P.face * 22, oy = P.y - 32;
  if (id === 'falisha') { shots.push({ x: ox, y: oy, vx: P.face * 700, vy: 0, life: 0.6, dmg: 1, r: 7 }); P.cd = 0.2; }
  else if (id === 'pupu') { for (const a of [-0.2, 0, 0.2]) shots.push({ x: ox, y: oy, vx: Math.cos(a) * P.face * 600, vy: Math.sin(a) * 600, life: 0.55, dmg: 1, r: 6 }); P.cd = 0.4; }
  else { shots.push({ x: ox, y: oy, vx: P.face * 560, vy: 0, life: 0.65, dmg: 2, r: 11 }); P.cd = 0.32; }
  P.shootT = 0.18; SFX.thwip();
}
function landOn(prevY) {
  P.onGround = false;
  if (P.vy < 0) return;
  for (const [a, b] of L.ground) if (P.x >= a - 6 && P.x <= b + 6 && prevY <= GY + 2 && P.y >= GY) { P.y = GY; P.vy = 0; P.onGround = true; if (P.x > a + 40 && P.x < b - 40) P.safeX = P.x; return; }
  for (const p of L.plats) if (P.x >= p.x - 8 && P.x <= p.x + p.w + 8 && prevY <= p.y + 2 && P.y >= p.y) { P.y = p.y; P.vy = 0; P.onGround = true; return; }
}
function updatePlayer(dt) {
  const ax = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (ax) P.face = ax;
  P.inv = Math.max(0, P.inv - dt); P.cd = Math.max(0, P.cd - dt); P.shootT = Math.max(0, P.shootT - dt);
  // ayun jaring
  if ((pressed.swing || (keys.swing && !P.onGround)) && !P.rope) {
    const a = findAnchor();
    if (a) {
      if (P.onGround) { P.vy = -420; P.y -= 2; P.onGround = false; }
      P.rope = { ax: a.x, ay: a.y, len: Math.hypot(a.x - P.x, a.y - (P.y - 45)) };
      SFX.swing();
    }
  }
  if (P.rope && !keys.swing) { P.rope = null; P.vy = Math.min(P.vy, 0) - 180; P.vx *= 1.1; P.jumps = 1; }
  if (pressed.jump) {
    if (P.rope) { P.rope = null; P.vy = Math.min(P.vy, 0) - 380; P.jumps = 1; SFX.jump(); }
    else if (P.onGround) { P.vy = -JUMP; P.onGround = false; P.jumps = 1; SFX.jump(); }
    else if (hero().id === 'pupu' && P.jumps < 2) { P.vy = -JUMP * 0.85; P.jumps = 2; SFX.jump(); burst(P.x, P.y, '#ff9ccf', 8, 120); }
  }
  if (!keys.jump && P.vy < -250 && !P.rope) P.vy = -250;   // lompat pendek kalau tombol dilepas cepat
  if ((pressed.shoot || keys.shoot) && P.cd <= 0) shoot();
  if (pressed.swap) swapHero(1);

  const prevY = P.y;
  if (P.rope) {
    const r = P.rope;
    P.vy += G * dt; P.vx += ax * 700 * dt;
    r.len = Math.max(150, r.len - 70 * dt);
    P.x += P.vx * dt; P.y += P.vy * dt;
    const hx = P.x - r.ax, hy = (P.y - 45) - r.ay, d = Math.hypot(hx, hy);
    if (d > r.len) {
      const nx = hx / d, ny = hy / d;
      P.x = r.ax + nx * r.len; P.y = r.ay + ny * r.len + 45;
      const vr = P.vx * nx + P.vy * ny;
      if (vr > 0) { P.vx -= vr * nx; P.vy -= vr * ny; }
    }
    const sp = Math.hypot(P.vx, P.vy); if (sp > 950) { P.vx *= 950 / sp; P.vy *= 950 / sp; }
    if (Math.random() < 0.3) parts.push({ x: P.x, y: P.y - 30, vx: 0, vy: 0, life: 0.3, col: 'rgba(255,255,255,0.6)', s: 3 });
  } else {
    const target = ax * SPEED * (hero().id === 'baymax' ? 0.92 : 1);
    const acc = P.onGround ? 2200 : 900;
    if (P.onGround || ax) P.vx += Math.max(-acc * dt, Math.min(acc * dt, target - P.vx));
    else P.vx *= Math.pow(0.6, dt);
    P.vy = Math.min(P.vy + G * dt, 1100);
    P.x += P.vx * dt; P.y += P.vy * dt;
  }
  landOn(prevY);
  if (P.onGround) { P.jumps = 0; if (P.rope) P.rope = null; }
  if (P.y < 70) { P.y = 70; P.vy = Math.max(P.vy, 0); }
  const minX = bossOn ? L.arenaX + 24 : Math.max(20, cam + 10), maxX = bossOn ? L.arenaX + W - 24 : L.arenaX + W - 24;
  if (P.x < minX) { P.x = minX; P.vx = Math.max(0, P.vx); }
  if (P.x > maxX) { P.x = maxX; P.vx = Math.min(0, P.vx); }
  if (P.y > 640) hurt(1, true);
  P.pose = P.rope ? 'swing' : P.shootT > 0 ? 'shoot' : P.inv > 1.1 ? 'hurt' : !P.onGround ? 'jump' : Math.abs(P.vx) > 30 ? 'run' : 'idle';
  // checkpoint
  for (const c of L.checkpoints) if (P.onGround && P.x > c && c > checkpoint) { checkpoint = c; pop(c, GY - 120, 'CHECKPOINT!', '#7dffb0'); SFX.token(); }
  if (!bossOn && P.x > L.arenaX + 140) startBoss();
}

/* ---------- Musuh ---------- */
const near = (x, m = 260) => x > cam - m && x < cam + W + m;
function webEnemy(e) { e.webT = 0.9; SFX.webbed(); S.score += 100; addMeter(8); pop(e.x, e.y - 50, '+100'); burst(e.x, e.y - 20, '#fff', 12); }
function updateEnemies(dt) {
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.webT > 0) { e.webT -= dt; if (e.webT <= 0) { e.dead = true; burst(e.x, e.y - 20, '#ffd23f', 10); } continue; }
    if (!near(e.x)) continue;
    e.t += dt;
    if (e.type === 'bot') {
      e.x += e.vx * dt;
      if (e.x < e.min) { e.x = e.min; e.vx = Math.abs(e.vx); } if (e.x > e.max) { e.x = e.max; e.vx = -Math.abs(e.vx); }
    } else {
      e.x = e.bx + Math.sin(e.t * 0.9) * 90; e.y = e.by + Math.sin(e.t * 2.3) * 24;
      e.cd -= dt;
      if (e.cd <= 0 && Math.abs(P.x - e.x) < 260) { e.cd = 2.6; bombs.push({ x: e.x, y: e.y + 10, vx: 0, vy: 60, kind: 'candy' }); }
    }
    const ey = e.type === 'bot' ? e.y - 18 : e.y, er = e.type === 'bot' ? 18 : 16;
    if (Math.abs(P.x - e.x) < er + 12 && Math.abs((P.y - 30) - ey) < er + 28) {
      if (P.vy > 120 && P.y - 10 < ey) { webEnemy(e); P.vy = -520; P.rope = null; }
      else hurt(1);
    }
  }
}

/* ---------- Bos ---------- */
function startBoss() {
  bossOn = true; Chip.play(TRACKS, 3);
  const ax = L.arenaX, duo = L.boss === 'duo', hpA = duo ? 22 : 30, hpN = duo ? 24 : 36;
  if (L.boss === 'arsyad' || duo) bosses.push({ kind: 'arsyad', x: ax + 760, y: 220, hp: hpA, max: hpA, t: 0, cd: 2, mode: 'fly', mt: 0, face: -1, hurtT: 0, slow: duo ? 1.4 : 1 });
  if (L.boss === 'nono' || duo) bosses.push({ kind: 'nono', x: ax + (duo ? 620 : 760), y: GY, vx: 0, vy: 0, hp: hpN, max: hpN, t: 0, mode: 'walk', mt: 2, face: -1, hurtT: 0, slow: duo ? 1.4 : 1, step: 0 });
  say(duo ? 'Goblin Kacamata & Badak Peci datang!' : L.boss === 'arsyad' ? 'Hihihi! Aku Goblin Kacamata!' : 'Hrrr! Badak Peci siap menyeruduk!', 2.6);
}
function bossBox(b) { return b.kind === 'arsyad' ? { x: b.x, y: b.y - 60, w: 70, h: 110 } : { x: b.x, y: b.y - 80, w: 80, h: 160 }; }
function damageBoss(b, n) {
  if (b.hp <= 0) return;
  const mul = b.kind === 'nono' && b.mode === 'dizzy' ? 2 : 1;
  const d = Math.min(b.hp, n * mul); b.hp -= d; b.hurtT = 0.12; S.score += Math.round(20 * d);
  if (b.hp <= 0) { b.webT = 0; SFX.webbed(); shake = 12; burst(b.x, b.y - 60, '#fff', 30, 300); S.score += 2000; pop(b.x, b.y - 160, 'TERJARING! +2000'); }
}
function updateBosses(dt) {
  const ax = L.arenaX;
  for (const b of bosses) {
    b.t += dt; b.hurtT = Math.max(0, b.hurtT - dt);
    if (b.hp <= 0) { if (b.kind === 'arsyad' && b.y < GY) b.y = Math.min(GY, b.y + 260 * dt); continue; }
    if (b.kind === 'arsyad') {
      b.mt -= dt;
      if (b.mode === 'fly') {
        b.x = ax + 480 + Math.sin(b.t * 0.7) * 340; b.y = 210 + Math.sin(b.t * 1.7) * 40;
        b.face = Math.cos(b.t * 0.7) > 0 ? 1 : -1;
        b.cd -= dt;
        if (b.cd <= 0) { b.cd = 1.7 * b.slow; const tt = 1.1; bombs.push({ x: b.x, y: b.y - 60, vx: (P.x - b.x) / tt, vy: (P.y - 20 - (b.y - 60) - 0.5 * 600 * tt * tt) / tt, kind: 'bomb' }); Chip.beep(700, 0.1, 'triangle', 0.05, -300); }
        if (b.t > 6 && b.mt <= 0) { b.mode = 'swoop'; b.mt = 2.2; b.sx = b.x; b.dir = P.x > b.x ? 1 : -1; say('Awas! Goblin menukik!', 1.2); }
      } else {
        const k = 1 - b.mt / 2.2;
        b.x = b.sx + b.dir * k * 600; b.y = 210 + Math.sin(k * Math.PI) * 200; b.face = b.dir;
        b.x = Math.max(ax + 60, Math.min(ax + W - 60, b.x));
        if (b.mt <= 0) { b.mode = 'fly'; b.mt = 6 * b.slow; b.t = Math.asin(Math.max(-1, Math.min(1, (b.x - ax - 480) / 340))) / 0.7; }
      }
    } else {
      b.mt -= dt;
      if (b.mode === 'walk') { b.face = P.x > b.x ? 1 : -1; b.x += b.face * 70 * dt; if (b.mt <= 0) { b.step++; if (b.step % 2) { b.mode = 'wind'; b.mt = 0.8; } else { b.mode = 'jump'; b.vy = -760; b.vx = (P.x - b.x) * 0.9; } } }
      else if (b.mode === 'wind') { if (Math.random() < 0.5) parts.push({ x: b.x - b.face * 40, y: GY - 4, vx: -b.face * 80, vy: -40, life: 0.5, col: '#c8b89a', s: 5 }); if (b.mt <= 0) { b.mode = 'charge'; say('NGUUUUNG!', 0.9); } }
      else if (b.mode === 'charge') {
        b.x += b.face * 540 * dt;
        if (b.x < ax + 60 || b.x > ax + W - 60) { b.x = Math.max(ax + 60, Math.min(ax + W - 60, b.x)); b.mode = 'dizzy'; b.mt = 2.4 / b.slow; shake = 14; SFX.boom(); say('Pusing... Tembak sekarang!', 1.4); }
      } else if (b.mode === 'dizzy') { if (b.mt <= 0) { b.mode = 'walk'; b.mt = 1.6 * b.slow; } }
      else if (b.mode === 'jump') {
        b.vy += G * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.x = Math.max(ax + 60, Math.min(ax + W - 60, b.x));
        if (b.y >= GY) { b.y = GY; b.mode = 'walk'; b.mt = 1.8 * b.slow; shake = 12; SFX.boom(); waves.push({ x: b.x, dir: 1, life: 1.6 }, { x: b.x, dir: -1, life: 1.6 }); }
      }
    }
    const bx = bossBox(b);
    if (Math.abs(P.x - bx.x) < bx.w / 2 + 10 && Math.abs((P.y - 30) - bx.y) < bx.h / 2 + 26) hurt(1);
  }
  if (bosses.length && bosses.every(b => b.hp <= 0) && !clearT) { clearT = 3; Chip.play(TRACKS, L.music); SFX.clear(); say('Maaf ya, Falisha... Kami jadi baik lagi!', 3); }
}
function updateProjectiles(dt) {
  for (const s of shots) {
    s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt;
    for (const e of enemies) {
      if (e.dead || e.webT > 0 || !near(e.x, 0)) continue;
      const ey = e.type === 'bot' ? e.y - 18 : e.y;
      if (Math.abs(s.x - e.x) < 18 + s.r && Math.abs(s.y - ey) < 18 + s.r) { s.life = 0; e.hp -= s.dmg; burst(s.x, s.y, '#fff', 5, 100); if (e.hp <= 0) webEnemy(e); break; }
    }
    if (s.life > 0) for (const b of bosses) { const bx = bossBox(b); if (b.hp > 0 && Math.abs(s.x - bx.x) < bx.w / 2 + s.r && Math.abs(s.y - bx.y) < bx.h / 2 + s.r) { s.life = 0; damageBoss(b, s.dmg); burst(s.x, s.y, '#fff', 5, 100); break; } }
  }
  shots = shots.filter(s => s.life > 0);
  for (const o of bombs) {
    o.vy += (o.kind === 'bomb' ? 600 : 500) * dt; o.x += o.vx * dt; o.y += o.vy * dt;
    if (Math.abs(P.x - o.x) < 22 && Math.abs(P.y - 30 - o.y) < 34) { o.dead = true; hurt(1); burst(o.x, o.y, '#ff5fa8', 10); }
    for (const s of shots) if (Math.hypot(s.x - o.x, s.y - o.y) < 18 + s.r) { o.dead = true; s.life = 0; burst(o.x, o.y, '#fff', 8); S.score += 10; }
    if (o.y > GY) { o.dead = true; burst(o.x, GY - 4, '#ff5fa8', 12, 160); if (Math.abs(P.x - o.x) < 46 && P.y > GY - 40) hurt(1); }
  }
  bombs = bombs.filter(o => !o.dead);
  for (const w of waves) {
    w.x += w.dir * 380 * dt; w.life -= dt;
    if (Math.abs(P.x - w.x) < 22 && P.onGround && P.y >= GY - 1) hurt(1);
  }
  waves = waves.filter(w => w.life > 0);
}
function teamUp() {
  if (meter < 100 || teamT > 0) return;
  meter = 0; teamT = 1.8; SFX.team(); shake = 10;
  for (const e of enemies) if (!e.dead && !e.webT && near(e.x, 0)) webEnemy(e);
  for (const b of bosses) damageBoss(b, 8);
  bombs = [];
}

/* ---------- Update ---------- */
function update(dt) {
  S.t += dt; S.modeT += dt;
  if (msg) { msg.t -= dt; if (msg.t <= 0) msg = null; }
  if (S.mode === 'title') { if (pressed.ok) startStage(Math.min(unlocked, 3) - 1); }
  else if (S.mode === 'intro') { if (S.modeT > 2.4 || (S.modeT > 0.4 && (pressed.ok || pressed.jump))) { S.mode = 'play'; S.modeT = 0; } }
  else if (S.mode === 'play') {
    updatePlayer(dt);
    if (pressed.team) teamUp();
    teamT = Math.max(0, teamT - dt);
    updateEnemies(dt); updateBosses(dt); updateProjectiles(dt);
    for (const t of tokens) if (!t.got && Math.abs(P.x - t.x) < 24 && Math.abs(P.y - 30 - t.y) < 40) { t.got = true; S.score += 50; addMeter(3); SFX.token(); burst(t.x, t.y, '#ffd23f', 6, 120); }
    for (const c of civs) if (!c.saved && Math.abs(P.x - c.x) < 34 && Math.abs(P.y - c.y) < 50) { c.saved = true; S.stars++; S.score += 500; addMeter(15); SFX.save(); pop(c.x, c.y - 70, '★ DISELAMATKAN!'); say(c.kind === 'cat' ? 'Meong! Terima kasih, pahlawan!' : 'Hore! Terima kasih, tim laba-laba!', 1.8); burst(c.x, c.y - 30, '#ffe14d', 16); }
    const tx = bossOn ? L.arenaX : Math.max(0, Math.min(L.arenaX, P.x - 380 + P.face * 60));
    cam += (tx - cam) * Math.min(1, dt * (bossOn ? 3 : 6));
    if (clearT) { clearT -= dt; if (clearT <= 0) { clearT = 0; saveUnlock(S.stage + 2); S.mode = 'clear'; S.modeT = 0; } }
  } else if (S.mode === 'clear') {
    if (S.modeT > 1 && pressed.ok) { if (S.stage < 2) startStage(S.stage + 1); else { S.mode = 'ending'; S.modeT = 0; Chip.play(TRACKS, 0); } }
  } else if (S.mode === 'ending') { if (S.modeT > 2 && pressed.ok) { S.mode = 'title'; S.modeT = 0; S.score = 0; S.stars = 0; } }
  for (const p of parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 500 * dt; p.life -= dt; }
  parts = (parts || []).filter(p => p.life > 0);
  for (const p of pops) { p.y -= 40 * dt; p.life -= dt * 0.8; }
  pops = (pops || []).filter(p => p.life > 0);
  shake = Math.max(0, (shake || 0) - dt * 30);
  if (teamBtn) teamBtn.classList.toggle('off', !(S.mode === 'play' && meter >= 100));
  for (const k in pressed) pressed[k] = false;
}
parts = []; pops = [];

/* ---------- Tap di canvas (menu) ---------- */
const STAGE_BTNS = [0, 1, 2].map(i => ({ x: 180 + i * 220, y: 430, w: 180, h: 56 }));
function tap(x, y) {
  if (S.mode === 'title') {
    STAGE_BTNS.forEach((b, i) => { if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h && i < unlocked) { S.score = 0; S.stars = 0; startStage(i); } });
  } else pressed.ok = true;
}

/* ---------- Render ---------- */
function txt(s, x, y, size, col = '#fff', align = 'center', outline = '#000') {
  ctx.font = `${size}px "Press Start 2P", monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 4); ctx.strokeStyle = outline; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function webShot(s) {
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.6, 0, 7); ctx.fill();
  ctx.strokeStyle = '#cfd8ff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let a = 0; a < 6; a++) { ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + Math.cos(a * 1.047) * s.r, s.y + Math.sin(a * 1.047) * s.r); } ctx.stroke();
}
function drawWorld() {
  const t = S.t;
  Art.background(ctx, S.stage, cam, t);
  ctx.save();
  ctx.translate(-Math.round(cam) + (shake ? (Math.random() - 0.5) * shake : 0), shake ? (Math.random() - 0.5) * shake : 0);
  for (const [a, b] of L.ground) if (b > cam - 50 && a < cam + W + 50) Art.ground(ctx, Math.max(a, cam - 50), Math.min(b, cam + W + 50), GY, S.stage);
  for (const p of L.plats) if (near(p.x, 220)) Art.platform(ctx, p.x, p.y, p.w, S.stage);
  const na = P.rope ? null : findAnchor();
  for (const a of L.anchors) if (near(a.x, 40)) Art.anchor(ctx, a.x, a.y, t, a === na);
  for (const c of L.checkpoints) if (c > 0 && near(c)) {
    ctx.fillStyle = '#ddd'; ctx.fillRect(c, GY - 90, 4, 90);
    ctx.fillStyle = checkpoint >= c ? '#2fd36b' : '#e0262f'; ctx.beginPath(); ctx.moveTo(c + 4, GY - 90); ctx.lineTo(c + 40, GY - 78); ctx.lineTo(c + 4, GY - 66); ctx.fill();
  }
  for (const k of tokens) if (!k.got && near(k.x)) Art.token(ctx, k.x, k.y + Math.sin(t * 3 + k.x) * 3, t);
  for (const c of civs) if (near(c.x)) Art.civilian(ctx, c.x, c.y, c.kind, t, c.saved);
  for (const e of enemies) {
    if (e.dead || !near(e.x)) continue;
    if (e.webT > 0) { Art.cocoon(ctx, e.x, e.type === 'bot' ? e.y : e.y + 18, 36, 40); continue; }
    if (e.type === 'bot') Art.bot(ctx, e.x, e.y, e.t, e.vx > 0 ? 1 : -1); else Art.drone(ctx, e.x, e.y, e.t);
  }
  for (const b of bosses) {
    if (b.hp <= 0) { Art.cocoon(ctx, b.x, b.y, 90, 150); Art.face(ctx, b.kind, b.x, b.y - 120, 40, 46); continue; }
    if (b.kind === 'arsyad') Art.arsyad(ctx, b.x, b.y, b.face, b.t, b.hurtT > 0);
    else Art.nono(ctx, b.x, b.y, b.face, b.t, b.mode, b.hurtT > 0);
  }
  for (const o of bombs) {
    ctx.fillStyle = o.kind === 'bomb' ? '#ff5fa8' : '#ffb347'; ctx.beginPath(); ctx.arc(o.x, o.y, 9, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(o.x - 2, o.y - 9, 4, 18); ctx.strokeStyle = '#7a1d4a'; ctx.lineWidth = 2; ctx.stroke();
  }
  for (const w of waves) { ctx.fillStyle = `rgba(255,220,120,${Math.min(1, w.life)})`; ctx.beginPath(); ctx.ellipse(w.x, GY - 8, 18, 16, 0, Math.PI, 0); ctx.fill(); }
  for (const s of shots) webShot(s);
  if (P.rope) {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(P.rope.ax, P.rope.ay);
    ctx.lineTo(P.x + P.face * 10, P.y - 52); ctx.stroke();
  }
  if (!(P.inv > 0 && Math.floor(S.t * 16) % 2)) Art.hero(ctx, hero().id, P.x, P.y, P.face, P.pose, t, 1.15);
  for (const p of parts) { ctx.globalAlpha = Math.min(1, p.life * 2); ctx.fillStyle = p.col; ctx.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  ctx.globalAlpha = 1;
  for (const p of pops) { ctx.globalAlpha = Math.max(0, p.life); txt(p.text, p.x, p.y, 12, p.col); }
  ctx.globalAlpha = 1;
  ctx.restore();
}
function heart(x, y, fill) {
  ctx.fillStyle = '#3a1020'; ctx.fillRect(x, y, 14, 12);
  ctx.fillStyle = '#ff3b5c'; if (fill >= 1) ctx.fillRect(x + 2, y + 2, 10, 8); else if (fill > 0) ctx.fillRect(x + 2, y + 2, 5, 8);
}
function drawHUD() {
  team.forEach((m, i) => {
    const x = 16 + i * 92, y = 12, on = i === act;
    ctx.fillStyle = on ? 'rgba(255,225,77,0.9)' : 'rgba(0,0,0,0.45)'; Art.rr(ctx, x, y, 84, 72, 10); ctx.fill();
    ctx.globalAlpha = m.hp > 0 ? 1 : 0.35; Art.face(ctx, m.id, x + 42, y + 28, 36, 42); ctx.globalAlpha = 1;
    for (let h = 0; h < 3; h++) heart(x + 10 + h * 22, y + 54, Math.max(0, Math.min(1, m.hp - h)));
  });
  txt(`SKOR ${S.score}`, 944, 74, 14, '#fff', 'right');
  txt(`★ ${S.stars}`, 944, 98, 14, '#ffe14d', 'right');
  // meteran Team-Up
  const mx = 300, my = 20, mw = 300;
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; Art.rr(ctx, mx, my, mw, 22, 8); ctx.fill();
  ctx.fillStyle = meter >= 100 ? (Math.floor(S.t * 6) % 2 ? '#ffe14d' : '#ff8a3b') : '#3dd6ff';
  Art.rr(ctx, mx + 3, my + 3, (mw - 6) * meter / 100, 16, 6); ctx.fill();
  txt(meter >= 100 ? 'TEAM-UP SIAP! (U / ⭐)' : 'TEAM-UP', mx + mw / 2, my + 12, 9);
  if (bossOn && bosses.length) {
    const hp = bosses.reduce((s, b) => s + b.hp, 0), mx2 = bosses.reduce((s, b) => s + b.max, 0);
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; Art.rr(ctx, 310, 50, 400, 18, 8); ctx.fill();
    ctx.fillStyle = '#2fd36b'; Art.rr(ctx, 313, 53, 394 * hp / mx2, 12, 6); ctx.fill();
    txt(L.boss === 'duo' ? 'GOBLIN & BADAK' : L.boss === 'arsyad' ? 'GOBLIN KACAMATA' : 'BADAK PECI', 510, 80, 9, '#b8ffcf');
  }
  if (msg) {
    ctx.fillStyle = 'rgba(10,15,44,0.8)'; Art.rr(ctx, 160, 100, 640, 40, 12); ctx.fill();
    txt(msg.text, 480, 120, 12, '#fff');
  }
}
function drawTeamUp() {
  const k = 1 - teamT / 1.8;
  ctx.save(); ctx.globalAlpha = Math.min(1, teamT * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
  for (let a = 0; a < 12; a++) { ctx.moveTo(480, 270); ctx.lineTo(480 + Math.cos(a * 0.524) * 700 * k, 270 + Math.sin(a * 0.524) * 700 * k); }
  for (let r = 1; r < 6; r++) { const rr = r * 110 * k; for (let a = 0; a <= 12; a++) { const x = 480 + Math.cos(a * 0.524) * rr, y = 270 + Math.sin(a * 0.524) * rr; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }
  ctx.stroke();
  HERO_IDS.forEach((id, i) => Art.hero(ctx, id, -100 + k * 1200 - i * 150, 330 + i * 40 + Math.sin(k * 8 + i) * 10, 1, 'swing', S.t, 2));
  txt('GO WEBS GO!', 480, 120, 36, '#ffe14d', 'center', '#a3121a');
  ctx.restore();
}
function drawTitle() {
  Art.background(ctx, 2, S.t * 40, S.t);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let a = 0; a < 10; a++) { ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a * 0.17) * 520, Math.sin(a * 0.17) * 520); }
  for (let r = 1; r < 6; r++) { for (let a = 0; a < 10; a++) { const x = Math.cos(a * 0.17) * r * 90, y = Math.sin(a * 0.17) * r * 90; a ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } }
  ctx.stroke();
  txt('FALISHA SPIDEY', 480, 70, 40, '#ff3b4a', 'center', '#16206a');
  txt('& SAHABAT', 480, 120, 24, '#9fd8ff', 'center', '#16206a');
  HERO_IDS.forEach((id, i) => {
    const x = 330 + i * 150, y = 340 + Math.sin(S.t * 3 + i) * 6;
    Art.hero(ctx, id, x, y, 1, i === 1 ? 'jump' : 'idle', S.t, 2);
    txt(Art.HEROES[id].name, x, 360, 10, '#fff'); txt(Art.HEROES[id].title, x, 378, 8, '#ffe14d');
  });
  Art.face(ctx, 'arsyad', 90, 250, 60, 70); Art.face(ctx, 'nono', 870, 250, 60, 70);
  txt('MUSUH', 90, 300, 8, '#ff9a9a'); txt('MUSUH', 870, 300, 8, '#ff9a9a');
  STAGE_BTNS.forEach((b, i) => {
    const open = i < unlocked;
    ctx.fillStyle = open ? '#e0262f' : '#555'; Art.rr(ctx, b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
    txt(open ? `STAGE ${i + 1}` : '🔒', b.x + b.w / 2, b.y + 20, 12); txt(open ? Levels.DEF[i].name : 'TERKUNCI', b.x + b.w / 2, b.y + 40, 7, '#ffe14d');
  });
  if (Math.floor(S.t * 2) % 2) txt('Ketuk stage / tekan ENTER', 480, 410, 9, '#fff');
}
function drawIntro() {
  drawWorld();
  ctx.fillStyle = 'rgba(10,15,44,0.82)'; ctx.fillRect(0, 150, W, 230);
  txt(`STAGE ${S.stage + 1}`, 480, 190, 16, '#ffe14d');
  txt(L.name, 480, 230, 28, '#ff3b4a');
  txt(L.sub, 480, 275, 12, '#fff');
  const vs = L.boss === 'duo' ? ['arsyad', 'nono'] : [L.boss];
  vs.forEach((v, i) => Art.face(ctx, v, 480 + (i - (vs.length - 1) / 2) * 90, 330, 54, 62));
}
function drawClear() {
  drawWorld();
  ctx.fillStyle = 'rgba(10,15,44,0.85)'; ctx.fillRect(0, 110, W, 320);
  txt('STAGE CLEAR!', 480, 160, 32, '#ffe14d', 'center', '#a3121a');
  HERO_IDS.forEach((id, i) => Art.hero(ctx, id, 380 + i * 100, 320, 1, 'idle', S.t, 1.5));
  txt(`SKOR ${S.score}   ★ ${S.stars}`, 480, 360, 14);
  if (S.modeT > 1 && Math.floor(S.t * 2) % 2) txt(S.stage < 2 ? 'Ketuk untuk lanjut' : 'Ketuk untuk penutup', 480, 400, 10);
}
function drawEnding() {
  Art.background(ctx, 0, S.t * 30, S.t);
  txt('KOTA AMAN!', 480, 80, 36, '#ffe14d', 'center', '#a3121a');
  txt('Goblin & Badak jadi teman lagi', 480, 130, 12);
  HERO_IDS.forEach((id, i) => Art.hero(ctx, id, 260 + i * 120, 380 + Math.sin(S.t * 4 + i) * 8, 1, 'jump', S.t, 2));
  Art.arsyad(ctx, 650, 330 + Math.sin(S.t * 3) * 10, -1, S.t, false);
  Art.nono(ctx, 800, 470, -1, S.t, 'walk', false);
  txt(`SKOR AKHIR ${S.score}   ★ ${S.stars}`, 480, 500, 14);
  if (S.modeT > 2 && Math.floor(S.t * 2) % 2) txt('Ketuk untuk ke judul', 480, 170, 10);
}
function render() {
  ctx.clearRect(0, 0, W, H);
  if (S.mode === 'title') drawTitle();
  else if (S.mode === 'intro') drawIntro();
  else if (S.mode === 'play') { drawWorld(); drawHUD(); if (teamT > 0) drawTeamUp(); }
  else if (S.mode === 'clear') drawClear();
  else drawEnding();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000); last = now;
  update(dt); render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
