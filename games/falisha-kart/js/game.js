/* Falisha Kart – orkestrasi: state machine, input, HUD, Grand Prix */
(() => {
'use strict';
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = canvas.width, H = canvas.height;
const $ = id => document.getElementById(id);
const hud = $('hud'), hudPos = $('hud-pos'), hudLap = $('hud-lap'), hudTime = $('hud-time'),
      hudItem = $('hud-item'), hudMsg = $('hud-msg'), hudCount = $('hud-count');
const screens = { title: $('screen-title'), select: $('screen-select'), results: $('screen-results'), podium: $('screen-podium') };
const ORD = ['1st','2nd','3rd','4th','5th','6th','7th','8th'];
const GP_POINTS = [15, 12, 10, 8, 7, 5, 4, 3];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Chip = window.Chip || null;
function sfx(fn) { try { fn(); } catch (e) {} }
const MUS = {
  menu:  [{ bpm: 132, wave: 'square', lead: [72,0,76,0,79,0,76,0,81,0,79,0,76,74,72,0], bass: [48,48,53,55] }],
  race:  [{ bpm: 152, wave: 'square', lead: [72,72,74,76,76,74,72,69,72,72,74,76,79,76,74,72], bass: [48,48,50,52] }],
  podium:[ [{ bpm: 110, wave: 'triangle', lead: [72,76,79,84,79,84,86,0,84,0,79,0,72,0,0,0], bass: [48,53,48,53] }][0] ],
};
function music(name) { if (Chip) { try { Chip.play(MUS[name], 0); } catch (e) {} } }

/* ---------------- input ---------------- */
const keys = {};
const touchBtns = {};
addEventListener('keydown', e => {
  if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault();
  keys[e.key.toLowerCase()] = true;
  if (e.key === ' ') usePlayerItem();
  if (e.key.toLowerCase() === 'm') toggleMute();
});
addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
function readInput() {
  return {
    left: keys['arrowleft'] || keys['a'] || touchBtns.left,
    right: keys['arrowright'] || keys['d'] || touchBtns.right,
    gas: keys['arrowup'] || keys['w'] || touchBtns.gas,
    brake: keys['arrowdown'] || keys['s'] || touchBtns.brake,
    drift: keys['shift'] || touchBtns.drift,
  };
}
function bindTouch(id, name) {
  const el = $(id);
  const on = e => { e.preventDefault(); touchBtns[name] = true; el.classList.add('on'); if (name === 'item') usePlayerItem(); };
  const off = e => { e.preventDefault(); touchBtns[name] = false; el.classList.remove('on'); };
  el.addEventListener('pointerdown', on);
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('pointerleave', off);
  el.addEventListener('contextmenu', e => e.preventDefault());
}
bindTouch('t-left','left'); bindTouch('t-right','right'); bindTouch('t-gas','gas');
bindTouch('t-brake','brake'); bindTouch('t-drift','drift'); bindTouch('t-item','item');

function toggleMute() {
  if (!Chip) return;
  Chip.setMuted(!Chip.isMuted());
  $('btn-mute').textContent = Chip.isMuted() ? '🔇' : '🔊';
}
$('btn-mute').onclick = toggleMute;
$('btn-full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => {});
};

/* ---------------- state ---------------- */
let state = 'title';
let playerChar = KartDB.CHARACTERS[0];
let gp = null;            // {raceIdx, totals:{name:pts}}
let race = null;          // {track, player, cpus, racers, itemSt, time, countT, countStep, over}
let msgT = 0;

/* ---------------- particle effects ---------------- */
const particles = [];
function spawn(o) { if (particles.length < 400) particles.push(Object.assign({ t: 0, life: 0.6 }, o)); }
function burst(x, y, n, opt) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, sp = (opt.sp || 120) * (0.4 + Math.random());
    spawn(Object.assign({ type: 'circle', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.up || 0),
      size: 4 + Math.random() * (opt.size || 6), color: opt.color, life: 0.5 + Math.random() * 0.5 }, opt.extra || {}));
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.t += dt;
    if (p.t >= p.life) { particles.splice(i, 1); continue; }
    p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt;
    if (p.grav) p.vy += p.grav * dt;
    if (p.drag) { p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt); }
  }
}
function drawParticles() {
  for (const p of particles) {
    const k = 1 - p.t / p.life;
    if (p.type === 'circle') {
      ctx.globalAlpha = k * 0.85;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.grow ? (0.5 + p.t * 2.2) : 1), 0, 7); ctx.fill();
    } else if (p.type === 'rect') {
      ctx.globalAlpha = k;
      ctx.fillStyle = p.color;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.rot || 0) + p.t * (p.spin || 3));
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    } else if (p.type === 'text') {
      ctx.globalAlpha = Math.min(1, k * 2);
      ctx.font = `${p.size}px "Press Start 2P", monospace`; ctx.textAlign = 'center';
      ctx.lineWidth = 5; ctx.strokeStyle = '#000';
      const yy = p.y - p.t * 46;
      ctx.strokeText(p.text, p.x, yy); ctx.fillStyle = p.color; ctx.fillText(p.text, p.x, yy);
    }
  }
  ctx.globalAlpha = 1;
}
function confetti(n = 90) {
  const cols = ['#ff3333', '#ffe55c', '#37b24d', '#3388ff', '#ff6b9d', '#ffffff'];
  for (let i = 0; i < n; i++) spawn({ type: 'rect', x: Math.random() * W, y: -20 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 160, size: 8 + Math.random() * 8,
    color: cols[i % cols.length], life: 2.5 + Math.random(), rot: Math.random() * 6, spin: 2 + Math.random() * 5 });
}

function show(name) {
  for (const k in screens) screens[k].classList.toggle('hidden', k !== name);
  if (!name) for (const k in screens) screens[k].classList.add('hidden');
}
function setMsg(t, secs = 2) { hudMsg.textContent = t; msgT = secs; }
function fmtTime(s) {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60), d = Math.floor((s % 1) * 10);
  return `${m}:${String(sec).padStart(2, '0')}.${d}`;
}

/* ---------------- karakter select ---------------- */
function buildSelect() {
  const wrap = $('chars'); wrap.innerHTML = '';
  for (const c of KartDB.CHARACTERS) {
    const d = document.createElement('div');
    d.className = 'char';
    const uri = (typeof Sprites !== 'undefined') ? Sprites.racerDataURI(c.id, 0) : null;
    const face = uri
      ? `<div class="face" style="background-image:url(${uri});background-size:contain;background-repeat:no-repeat;background-position:center bottom;background-color:#0e1438"></div>`
      : `<div class="face" style="background:${c.color}">${c.emoji}</div>`;
    d.innerHTML = `${face}
      <div class="nm">${c.name}</div><div class="st">${c.title}<br>SPD ${Math.round(c.maxSpeed*100)} ACC ${Math.round(c.accel*100)}</div>`;
    d.onclick = () => { playerChar = c; sfx(() => Chip.beep(660, 0.12)); startGP(); };
    wrap.appendChild(d);
  }
}
$('btn-start').onclick = () => { sfx(() => Chip.ensure()); buildSelect(); show('select'); };

/* ---------------- grand prix ---------------- */
function startGP() {
  gp = { raceIdx: 0, totals: {} };
  for (const c of KartDB.CHARACTERS) gp.totals[c.name] = 0;
  gp.totals['__cpu_extra'] = 0;
  show(null); startRace();
}

function startRace() {
  const track = TrackDB.TRACKS[gp.raceIdx];
  ItemSys.resetBoxes(track);
  const player = KartDB.createPlayer(playerChar);
  const cpus = [];
  const chars = KartDB.CHARACTERS.filter(c => c.id !== playerChar.id);
  for (let i = 0; i < 7; i++) {
    const ch = i < chars.length ? chars[i] : KartDB.CHARACTERS[i % KartDB.CHARACTERS.length];
    cpus.push(KartAI.createCPU(ch, i, track.road));
  }
  const racers = [player, ...cpus];
  racers.player = player;
  race = { track, player, cpus, racers, itemSt: ItemSys.createState(),
           time: 0, countT: 0, countStep: -1, over: false, done: false, results: null };
  state = 'countdown';
  hud.classList.remove('hidden');
  $('touch').classList.remove('hidden');
  hudCount.textContent = '';
  setMsg(`${track.name} — RACE ${gp.raceIdx + 1}/4`, 2.5);
  music('race');
}

function usePlayerItem() {
  if (state !== 'race' || !race || race.player.finished) return;
  const fx = ItemSys.useItem(race.player, race.itemSt, race.racers, race.track);
  if (!fx) return;
  const sounds = {
    boost: () => Chip.beep(300, 0.3, 'sawtooth', 0.08, 500),
    star: () => { Chip.beep(880, 0.15); setTimeout(() => Chip.beep(1174, 0.2), 120); },
    drop: () => Chip.beep(220, 0.15),
    shoot: () => Chip.beep(500, 0.2, 'square', 0.07, 300),
    shell: () => Chip.beep(150, 0.4, 'sawtooth', 0.09, -60),
  };
  sfx(() => sounds[fx] && sounds[fx]());
  updateItemHud();
}
function updateItemHud() {
  const it = race && race.player.item;
  hudItem.textContent = it ? ItemSys.DEFS[it].icon : '—';
}

/* ---------------- update ---------------- */
function update(dt) {
  if (msgT > 0) { msgT -= dt; if (msgT <= 0) hudMsg.textContent = ''; }

  if (state === 'countdown') {
    race.countT += dt;
    const step = Math.floor(race.countT / 0.85); // 0,1,2 = 3,2,1 ; 3 = GO
    if (step !== race.countStep) {
      race.countStep = step;
      if (step < 3) { hudCount.textContent = String(3 - step); sfx(() => Chip.beep(440, 0.15)); }
      else {
        hudCount.textContent = 'GO!'; sfx(() => Chip.beep(880, 0.35));
        state = 'race';
        const inp = readInput();
        if (inp.gas) { race.player.boostT = 1.1; race.player.boostPow = 1; setMsg('START BOOST! ⚡', 1.5); }
        setTimeout(() => { if (state === 'race') hudCount.textContent = ''; }, 700);
      }
    }
    return;
  }
  if (state !== 'race') return;

  const { track, player, cpus, racers, itemSt } = race;
  race.time += dt;
  const input = readInput();

  KartDB.updatePlayer(player, input, dt, track.road);
  for (const cpu of cpus) KartAI.update(cpu, player, dt, track, itemSt, racers, null);

  ItemSys.updateBoxes(track, dt);
  const order = KartAI.rank(racers);
  const playerPos = order.indexOf(player) + 1;
  ItemSys.pickup(player, track, playerPos, id => {
    setMsg(`${ItemSys.DEFS[id].icon} ${ItemSys.DEFS[id].name}!`, 1.4);
    sfx(() => Chip.beep(990, 0.12));
    burst(W / 2, H - 120, 14, { color: '#ffe55c', sp: 160, up: 60, size: 7 });
    updateItemHud();
  });
  ItemSys.update(itemSt, racers, track, dt, kart => {
    if (kart === player) {
      setMsg('Aduh! Kena! 😵', 1.2);
      sfx(() => Chip.hit(1));
      spawn({ type: 'text', text: 'POW!', x: W / 2, y: H - 200, size: 34, color: '#ff5533', life: 1 });
      burst(W / 2, H - 140, 12, { color: '#ff9d2e', sp: 200, size: 8 });
    }
  });

  // --- efek partikel pemain ---
  const pkx = W / 2, pky = H - 40;
  if (player.drift.on) {
    const col = player.drift.charge > 1.4 ? '#ff9d2e' : player.drift.charge > 0.6 ? '#ffe55c' : '#9fd8ff';
    for (let i = 0; i < 2; i++)
      spawn({ type: 'circle', x: pkx + (Math.random() - 0.5) * 90, y: pky - 10, vx: (Math.random() - 0.5) * 40,
        vy: -40 - Math.random() * 40, size: 7 + Math.random() * 6, color: col, life: 0.55, grow: true });
  }
  if (player.boostT > 0) {
    for (let i = 0; i < 2; i++)
      spawn({ type: 'circle', x: pkx + (Math.random() - 0.5) * 70, y: pky - 6, vx: (Math.random() - 0.5) * 60,
        vy: 60 + Math.random() * 80, size: 5 + Math.random() * 6, color: Math.random() < 0.5 ? '#ff9d2e' : '#ffe55c', life: 0.4 });
  }
  if (player.starT > 0 && Math.random() < 0.5) {
    const cols = ['#ff3333', '#ffe55c', '#37b24d', '#3388ff'];
    spawn({ type: 'circle', x: pkx + (Math.random() - 0.5) * 160, y: pky - 60 - Math.random() * 120,
      vx: 0, vy: -30, size: 4 + Math.random() * 4, color: cols[(Math.random() * 4) | 0], life: 0.7 });
  }
  updateParticles(dt);

  // tabrakan pemain vs CPU (senggolan)
  for (const cpu of cpus) {
    if (cpu.finished) continue;
    let dz = cpu.z - player.z;
    const tl = track.trackLength;
    if (dz < -tl / 2) dz += tl; if (dz > tl / 2) dz -= tl;
    if (Math.abs(dz) < 500 && Math.abs(cpu.x - player.x) < 0.42 && player.starT <= 0) {
      player.speed *= 0.92;
      player.x += (player.x < cpu.x ? -1 : 1) * dt * 3;
    }
  }

  // lap & finish pemain
  if (!player.finished && player.lap > track.laps) {
    player.finished = true; player.finishTime = race.time;
    player.finishPos = KartAI.rank(racers).indexOf(player) + 1;
    setMsg(`FINISH! ${ORD[player.finishPos - 1]} 🏁`, 3);
    sfx(() => { Chip.beep(784, 0.15); setTimeout(() => Chip.beep(1046, 0.3), 150); });
    if (player.finishPos <= 3) confetti(110);
    finishRace();
  } else if (!player.finished && player.lap === track.laps) {
    if (!race.finalLapMsg) { race.finalLapMsg = true; setMsg('FINAL LAP! 🔥', 2); }
  }

  // HUD
  hudPos.textContent = ORD[clamp(playerPos - 1, 0, 7)];
  hudPos.style.color = playerPos <= 3 ? '#ffe55c' : '#fff';
  hudLap.textContent = `LAP ${Math.min(player.lap, track.laps)}/${track.laps}`;
  hudTime.textContent = fmtTime(race.time);
}

function finishRace() {
  const { track, player, cpus, racers, itemSt } = race;
  // simulasi cepat CPU sampai semua finish (maks 40 detik virtual)
  let simT = race.time, guard = 0;
  const orderDone = [];
  while (guard < 40 * 60) {
    let all = true;
    for (const cpu of cpus) {
      if (cpu.finished) continue;
      all = false;
      KartAI.update(cpu, player, 1 / 60, track, itemSt, racers, null);
      ItemSys.update(itemSt, racers, track, 1 / 60, null);
      simT += 1 / 60 / Math.max(1, cpus.filter(c => !c.finished).length);
      if (cpu.lap > track.laps) { cpu.finished = true; cpu.finishTime = simT; orderDone.push(cpu); }
    }
    if (all) break;
    guard++;
  }
  for (const cpu of cpus) if (!cpu.finished) { cpu.finished = true; cpu.finishTime = 9999; }
  const order = KartAI.rank(racers);
  race.results = order.map((k, i) => ({ kart: k, pos: i + 1, pts: GP_POINTS[i] || 1,
    time: k.finishTime >= 9999 ? '—' : fmtTime(k.finishTime) }));
  for (const r of race.results) {
    const key = r.kart.isPlayer ? r.kart.char.name : (r.kart.char.name + '#' + cpus.indexOf(r.kart));
    gp.totals[key] = (gp.totals[key] || 0) + r.pts;
    r.key = key;
  }
  state = 'raceover';
  race.overT = 0;
}

function updateRaceover(dt) {
  race.overT += dt;
  updateParticles(dt);
  if (race.overT > 2.2) showResults();
}

function showResults() {
  state = 'results';
  const r = race.results;
  $('res-title').textContent = `${race.track.name} — HASIL`;
  const t = $('res-table'); t.innerHTML = '';
  for (const row of r) {
    const d = document.createElement('div');
    d.className = 'rrow' + (row.kart.isPlayer ? ' me' : '');
    d.innerHTML = `<span>${ORD[row.pos - 1]} ${row.kart.char.emoji} ${row.kart.char.name}</span><span>${row.time}</span><span class="pts">+${row.pts}</span>`;
    t.appendChild(d);
  }
  $('btn-next').textContent = gp.raceIdx < 3 ? '▶ BALAPAN BERIKUTNYA' : '🏆 LIHAT PODIUM';
  hud.classList.add('hidden'); $('touch').classList.add('hidden');
  show('results');
}
$('btn-next').onclick = () => {
  sfx(() => Chip.beep(660, 0.12));
  if (gp.raceIdx < 3) { gp.raceIdx++; show(null); startRace(); }
  else showPodium();
};

function showPodium() {
  state = 'podium';
  music('podium');
  const rows = Object.entries(gp.totals).filter(([k]) => k !== '__cpu_extra')
    .sort((a, b) => b[1] - a[1]);
  const medals = ['🥇', '🥈', '🥉'];
  const t = $('pod-table'); t.innerHTML = '';
  rows.forEach(([name, pts], i) => {
    const d = document.createElement('div');
    const isMe = name === playerChar.name;
    d.className = 'rrow' + (isMe ? ' me' : '');
    d.innerHTML = `<span>${medals[i] || `${i + 1}.`} ${isMe ? '⭐ ' : ''}${name}</span><span class="pts">${pts} pts</span>`;
    t.appendChild(d);
  });
  show('podium');
}
$('btn-again').onclick = () => { buildSelect(); show('select'); };

/* ---------------- render ---------------- */
function render() {
  if (!race || state === 'title' || state === 'select') {
    // background menu: langit + jalan demo
    ctx.fillStyle = '#0b1030'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffe55c'; ctx.font = '20px "Press Start 2P"'; ctx.textAlign = 'center';
    if (state === 'title') ctx.fillText('🏎️💨', W / 2, H / 2);
    return;
  }
  const { track, player, cpus, racers, itemSt } = race;
  const road = track.road, tl = track.trackLength;

  // kumpulkan sprite: dekorasi segmen terlihat + item + kart CPU
  const sprites = [];
  const baseIdx = Math.floor(player.z / Mode7.SEG_LEN);
  const pushSprite = (zAbsRaw, x, w, draw) => {
    let zAbs = ((zAbsRaw % tl) + tl) % tl;
    let relZ = zAbs - player.z;
    if (relZ < 0) relZ += tl;
    if (relZ > Mode7.DRAW_DIST * Mode7.SEG_LEN || relZ < Mode7.CAM_DEPTH * 2) return;
    sprites.push({ zAbs, relZ, x, w, draw });
  };

  for (let n = 0; n < Mode7.DRAW_DIST; n++) {
    const seg = road.segments[(baseIdx + n) % road.segments.length];
    for (const sp of seg.sprites) {
      let zAbs = seg.index * Mode7.SEG_LEN;
      if (seg.index < baseIdx) zAbs += tl;
      pushSprite(zAbs, sp.x, sp.w, sp.draw);
    }
  }
  const tNow = performance.now() / 1000;
  for (const b of track.boxes) {
    if (b.taken) continue;
    pushSprite(b.seg * Mode7.SEG_LEN, b.x, 700, (c, x, y, w) => ItemSys.drawBox(c, x, y, w, tNow));
  }
  for (const hz of itemSt.hazards) pushSprite(hz.z, hz.x, 500, (c, x, y, w) => ItemSys.drawBanana(c, x, y, w));
  for (const pr of itemSt.projectiles) pushSprite(pr.z, pr.x, 650, (c, x, y, w) => ItemSys.drawProjectile(c, x, y, w, pr.type));
  for (const cpu of cpus) {
    const ch = cpu.char;
    const cpose = cpu.steerDir < 0 ? 1 : cpu.steerDir > 0 ? 2 : 0;
    pushSprite(cpu.z, cpu.x, 1500, (c, x, y, w) => KartDB.drawKart(c, x, y, w, ch, { pose: cpose, star: cpu.starT > 0 }));
  }

  Mode7.render(ctx, W, H, road, {
    position: player.z, playerX: player.x, theme: track.theme, sprites,
  });

  // kart pemain (POV agak dari atas: kart lebih kecil, jalan depan lebih lega)
  const kw = Math.min(W * 0.24, 240);
  const kx = W / 2, ky = H - 10;
  const steerDir = ((readInputCache.left ? -1 : 0) + (readInputCache.right ? 1 : 0));
  const pose = steerDir < 0 ? 1 : steerDir > 0 ? 2 : 0;
  let smoke = null;
  if (player.drift.on) smoke = player.drift.charge > 1.4 ? '#ff9d2e' : player.drift.charge > 0.6 ? '#ffe55c' : '#9fd8ff';
  KartDB.drawKart(ctx, kx, ky, kw, player.char, { pose, vscale: 0.9, star: player.starT > 0, driftSmoke: smoke });
  // efek boost: garis kecepatan
  if (player.boostT > 0 || player.starT > 0) {
    ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const sx = Math.random() * W, sy = Math.random() * H * 0.7;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy + 30 + Math.random() * 40); ctx.stroke();
    }
  }
  drawParticles();
}
let readInputCache = {};
setInterval(() => { readInputCache = readInput(); }, 50);

/* ---------------- main loop ---------------- */
let last = performance.now();
function loop(now) {
  let dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state === 'countdown' || state === 'race') update(dt);
  else if (state === 'raceover') updateRaceover(dt);
  render();
  requestAnimationFrame(loop);
}

/* ---------------- boot ---------------- */
if (typeof Sprites !== 'undefined') Sprites.load();
music('menu');
show('title');
requestAnimationFrame(loop);
})();
