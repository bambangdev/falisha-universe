/* Falisha Kart Turbo – state game, menu, balapan, HUD, input */
const cv = document.getElementById('game'), ctx = cv.getContext('2d');
const W = Road.W, H = Road.H;
const touchEl = document.getElementById('touch');

/* ---------- Opsi & penyimpanan ---------- */
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const store = {
  get(k, d) { try { const v = localStorage.getItem('fkt_' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('fkt_' + k, JSON.stringify(v)); } catch (e) {} }
};
const opts = store.get('opts', { diff: 0, autogas: isTouch });

/* ---------- Audio ---------- */
const mk = (bpm, wave, bass, lead) => ({ bpm, wave, bass, lead });
const SONGS = [
  mk(150, 'square', [48, 53, 55, 53], [72, 76, 79, 76, 81, 79, 76, 74, 72, 74, 76, 79, 77, 76, 74, null, 72, 76, 79, 84, 83, 81, 79, 77, 76, 77, 79, 81, 79, 76, 72, null]),
  mk(140, 'triangle', [45, 41, 43, 40], [69, null, 72, 76, 74, 72, 69, 67, 69, 72, 74, 76, 79, 76, 74, null, 72, 74, 76, 79, 81, 79, 76, 74, 72, 69, 67, 69, 72, null, 69, null]),
  mk(132, 'square', [50, 48, 46, 45], [74, 77, 81, 77, 79, 76, 72, 76, 77, 74, 70, 74, 76, 73, 69, null, 74, 77, 81, 86, 84, 81, 77, 74, 72, 74, 76, 77, 76, null, 74, null]),
  mk(160, 'square', [52, 57, 55, 50], [76, 79, 83, 88, 86, 83, 79, 83, 81, 84, 88, 84, 83, 79, 76, null, 76, 80, 83, 88, 86, 83, 80, 76, 78, 81, 85, 81, 83, 86, 88, null])
];
const TRACKS_MUSIC = SONGS.concat(SONGS.map(s => ({ ...s, bpm: Math.round(s.bpm * 1.2) })));   // 4-7 = lap terakhir
TRACKS_MUSIC.push(mk(120, 'triangle', [48, 45, 41, 43], [72, null, 76, null, 79, 77, 76, null, 74, null, 77, null, 81, 79, 77, null, 76, null, 79, null, 84, 83, 81, null, 79, 77, 76, 74, 72, null, null, null]));  // 8 menu
const SFX = {
  count: () => Chip.beep(440, 0.18, 'square', 0.07),
  go: () => Chip.beep(880, 0.4, 'square', 0.08),
  box: () => [660, 880, 1100].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.06, 'square', 0.04), i * 40)),
  item: () => Chip.beep(1200, 0.05, 'square', 0.03),
  boost: () => Chip.beep(300, 0.35, 'sawtooth', 0.06, 900),
  turbo: lvl => Chip.beep(lvl > 1 ? 700 : 500, 0.3, 'sawtooth', 0.06, 900),
  spin: () => { Chip.hit(1); Chip.beep(900, 0.5, 'triangle', 0.05, -700); },
  hop: () => Chip.beep(260, 0.06, 'square', 0.03, 200),
  ramp: () => Chip.beep(400, 0.3, 'triangle', 0.06, 600),
  bump: () => Chip.beep(120, 0.08, 'square', 0.05, -40),
  throw: () => Chip.beep(700, 0.12, 'triangle', 0.05, -300),
  lap: () => [784, 988, 1175].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.1, 'square', 0.05), i * 90)),
  finish: () => [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.15, 'square', 0.06), i * 120)),
  click: () => Chip.beep(900, 0.05, 'square', 0.04)
};
function setMuted(m) { Chip.setMuted(m); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }
setMuted(Chip.isMuted());

/* ---------- Input ---------- */
const keys = {}, pressed = {};
function press(k) { if (!keys[k]) pressed[k] = true; keys[k] = true; Chip.ensure(); }
function release(k) { keys[k] = false; }
const KMAP = { ArrowUp: 'gas', w: 'gas', W: 'gas', ArrowDown: 'brake', s: 'brake', S: 'brake', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
  Shift: 'drift', k: 'drift', K: 'drift', ' ': 'item', j: 'item', J: 'item', Enter: 'ok', Escape: 'back', p: 'pause', P: 'pause' };
addEventListener('keydown', e => {
  if (e.key === 'm' || e.key === 'M') { setMuted(!Chip.isMuted()); return; }
  const k = KMAP[e.key]; if (!k) return;
  e.preventDefault(); press(k);
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
  for (const b of UI) if (x > b.x && x < b.x + b.w && y > b.y && y < b.y + b.h) { SFX.click(); b.act(); return; }
});
document.getElementById('btn-mute').onclick = e => { e.stopPropagation(); setMuted(!Chip.isMuted()); };
document.getElementById('btn-pause').onclick = e => { e.stopPropagation(); togglePause(); };
document.getElementById('btn-full').onclick = e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};
addEventListener('blur', () => { if (S.mode === 'race' && R && R.phase === 'run') S.paused = true; });

/* ---------- State ---------- */
const S = { mode: 'load', t: 0, modeT: 0, focus: 0, paused: false, game: null, char: 'falisha', track: 0 };
let UI = [], R = null;
function go(mode) { S.mode = mode; S.modeT = 0; S.focus = 0; S.paused = false; touchEl.classList.toggle('hidden', mode !== 'race'); if (mode !== 'race') Chip.play(TRACKS_MUSIC, 8); }
function togglePause() { if (S.mode === 'race' && R && R.phase !== 'done') S.paused = !S.paused; }
const fmt = t => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`; };
const POINTS = [10, 7, 5, 3, 1];

/* ---------- Balapan ---------- */
function startRace(trackIdx) {
  const def = TRACKS[trackIdx], T = Road.build(def);
  const g = S.game, mode = g.mode;
  const ids = mode === 'gp' ? [S.char, ...RACER_IDS.filter(i => i !== S.char)] : [S.char];
  let order = ids.slice();
  if (mode === 'gp') {   // grid: urutan klasemen, pemain start paling belakang (kamera tidak terhalang)
    const others = ids.slice(1).sort((a, b) => (g.pts[b] || 0) - (g.pts[a] || 0));
    order = [...others, S.char];
  }
  const karts = order.map((id, i) => {
    const k = new Kart(id, id !== S.char || false);
    k.z = T.startZ - 450 - i * 420;
    k.x = order.length === 1 ? 0 : [-0.5, 0.5][i % 2]; k.dist = k.z - T.startZ;
    return k;
  });
  const player = karts.find(k => !k.cpu);
  if (mode === 'tt') { player.item = 'sambal'; player.itemN = 3; }
  Items.reset();
  const best = mode === 'tt' ? store.get('tt_' + def.id, null) : null;
  R = { def, T, karts, player, mode, t: 0, phase: 'count', count: 3.6, camX: player.x * Road.ROADW, skyOff: 0, msg: null, parts: [], lastLap: false,
    ghost: best && best.g, ghostRec: [], best, finishT: 0, results: null, startBoost: 0 };
  Chip.play(TRACKS_MUSIC, def.music);
  go('race');
}
function say(text, t = 1.6, col = '#ffe14d') { R.msg = { text, t, col }; }
function fx(type, k, extra) {
  const me = k === R.player;
  if (type === 'box') { if (me) SFX.box(); }
  else if (type === 'turbo1' || type === 'turbo2') { if (me) { SFX.turbo(type === 'turbo2' ? 2 : 1); say(type === 'turbo2' ? 'SUPER TURBO!' : 'MINI TURBO!', 0.9, type === 'turbo2' ? '#ff9a3b' : '#6fd3ff'); } }
  else if (type === 'sambal' || type === 'bintang') { if (me) SFX.boost(); }
  else if (type === 'spin') { if (me) { SFX.spin(); say(extra === 'pisang' ? 'Licin! Kulit pisang!' : 'Aduh! Kena ' + (extra === 'kumon' ? 'Buku Kumon' : 'Piano') + '!', 1.4, '#ff8080'); } }
  else if (type === 'awan') { if (me) say('Awan hujan di atasmu!', 1.4, '#9fd8ff'); }
  else if (type === 'hop') { if (me) SFX.hop(); }
  else if (type === 'ramp') { if (me) { SFX.ramp(); say('LONCAT! Tekan DRIFT untuk trik!', 1, '#fff'); } }
  else if (type === 'trick') { if (me) { SFX.turbo(1); say('TRIK KEREN!', 0.8, '#7dffb0'); } }
  else if (type === 'bump') { if (me) SFX.bump(); }
  else if (type === 'throw' || type === 'drop' || type === 'balon') { if (me) SFX.throw(); }
}
function playerInput() {
  const steer = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  const gas = opts.autogas ? !keys.brake : !!keys.gas;
  return { gas, brake: !!keys.brake, steer, drift: !!keys.drift, use: !!pressed.item };
}
function updateRace(dt) {
  const { T, karts, player } = R;
  if (R.msg) { R.msg.t -= dt; if (R.msg.t <= 0) R.msg = null; }
  if (R.phase === 'count') {
    const before = Math.ceil(R.count); R.count -= dt;
    const after = Math.ceil(R.count);
    if (after !== before && after >= 1 && after <= 3) SFX.count();
    if (keys.gas && R.count < 0.6 && R.count > 0 && R.startBoost === 0) R.startBoost = 1;   // start boost: tekan gas tepat sebelum GO
    if (keys.gas && R.count > 1.6) R.startBoost = -1;                                       // terlalu cepat: mesin tersendat
    if (R.count <= 0) {
      R.phase = 'run'; SFX.go(); say('GO!', 0.8, '#7dffb0');
      if (R.startBoost > 0) { player.boost = 1; say('START TURBO!', 1, '#ff9a3b'); }
      else if (R.startBoost < 0) { player.spin = 0.6; }
    }
    return;
  }
  R.t += dt;
  const n = karts.length;
  // urutan
  const ranked = karts.slice().sort((a, b) => (a.finished && b.finished) ? a.time - b.time : (b.finished - a.finished) || (b.dist - a.dist));
  ranked.forEach((k, i) => (k.rank = i));
  for (const k of karts) {
    let inp;
    if (k.cpu || k.finished) inp = AI.input(k, T, k.cpu ? player : null, k.cpu ? opts.diff : 1, dt);
    else {
      inp = playerInput();
      if (inp.drift && pressed.drift && k.air && k.vy !== 0) k.trick = true;
    }
    if (k.roll > 0) { k.roll -= dt; if (k.roll <= 0 && !k.cpu) SFX.item(); }
    if (inp.use && k.item && R.phase === 'run') Items.use(k, karts, T, fx);
    k.update(dt, inp, T, fx);
    if (!k.finished && k.dist >= T.length * 3) {
      k.finished = true; k.time = R.t;
      if (k === player) finishPlayer();
    }
    if (!k.cpu && !k.finished && k.lap > (k._lap || 1)) {
      k._lap = k.lap;
      if (k.lap === 3) { say('LAP TERAKHIR!', 2, '#ff9a3b'); Chip.play(TRACKS_MUSIC, R.def.music + 4); } else say('LAP ' + k.lap, 1.2, '#fff');
      SFX.lap();
    }
  }
  collideKarts(karts.filter(k => !k.finished), T, fx);
  Items.update(dt, karts.filter(k => !k.finished), T, fx);
  Items.boxes(dt, karts.filter(k => !k.finished), T, fx, R.mode !== 'tt');
  // slipstream untuk pemain
  for (const o of karts) {
    if (o === player) continue;
    let dz = o.z - player.z; if (dz < 0) dz += T.length;
    if (dz > 150 && dz < 1300 && Math.abs(o.x - player.x) < 0.18 && player.sp > 0.6) { R.slip = (R.slip || 0) + dt; if (R.slip > 1.3) { player.boost = Math.max(player.boost, 0.6); R.slip = 0; say('SLIPSTREAM!', 0.8, '#9fd8ff'); } break; }
  }
  if (R.mode === 'tt' && R.phase === 'run' && Math.floor(R.t * 20) > R.ghostRec.length) R.ghostRec.push([Math.round(player.dist), +player.x.toFixed(2)]);
  if (R.phase === 'done') { R.finishT -= dt; if (R.finishT <= 0) go('result'); }
  if (pressed.pause || pressed.back) togglePause();
}
function finishPlayer() {
  const { karts, player, T } = R;
  SFX.finish(); R.phase = 'done'; R.finishT = 3.2;
  player.cpu = false;
  // perkiraan waktu CPU yang belum finish
  for (const k of karts) if (!k.finished) k.estTime = R.t + (T.length * 3 - k.dist) / (MAXS * 0.85 * (k.cpuF || 0.9));
  const order = karts.slice().sort((a, b) => (a.finished ? a.time : a.estTime) - (b.finished ? b.time : b.estTime));
  R.results = order.map((k, i) => ({ id: k.id, time: k.finished ? k.time : k.estTime, me: k === player, pts: POINTS[i] || 0 }));
  const pos = R.results.findIndex(r => r.me);
  say(R.mode === 'gp' ? ['JUARA 1!', 'POSISI 2!', 'POSISI 3!', 'POSISI 4', 'POSISI 5'][pos] : 'FINISH!', 3, '#ffe14d');
  if (R.mode === 'gp') for (const r of R.results) S.game.pts[r.id] = (S.game.pts[r.id] || 0) + r.pts;
  if (R.mode === 'tt') {
    const t = player.time, b = R.best;
    R.newRecord = !b || t < b.time;
    if (R.newRecord) store.set('tt_' + R.def.id, { time: t, g: R.ghostRec, char: S.char });
  }
}

/* ---------- Render balapan ---------- */
function kartFrame(k) {
  if (k.spin > 0) return { f: k.spin < 0.3 ? 'spin' : ['a0', 'a45', 'a90', 'a135', 'a180', 'a225', 'a270', 'a315'][Math.floor(k.spin * 14) % 8], flip: false };
  if (k.drift) return { f: 'drift', flip: k.drift < 0 };          // frame drift asli menghadap kanan
  if (k.steerVis < -0.35) return { f: 'a315', flip: false };      // moncong ke kiri
  if (k.steerVis > 0.35) return { f: 'a45', flip: false };        // moncong ke kanan
  return { f: 'a0', flip: false };
}
const KART_W = 540;
function drawKart(k, sg, pct, alpha) {
  const p = Road.screenAt(sg, pct, k.x, k.jy), g = Road.screenAt(sg, pct, k.x, 0);
  const cw = Math.min(KART_W * p.k, R.playerCw * 1.15 || 1e9);
  if (cw < 3 || p.x < -cw || p.x > W + cw) return;
  ctx.globalAlpha = alpha;
  if (k.jy > 0) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(g.x, g.y, cw * 0.35, cw * 0.08, 0, 0, 7); ctx.fill(); }
  if (k.star > 0 && Math.floor(S.t * 20) % 2) ctx.globalAlpha = alpha * 0.6;
  const fr = kartFrame(k);
  Spr.draw(ctx, 'racers', k.id + '.' + fr.f, p.x, p.y, cw, fr.flip);
  ctx.globalAlpha = alpha;
  if (k.star > 0) Spr.draw(ctx, 'items', 'kilau', p.x + Math.sin(S.t * 13) * cw * 0.3, p.y - cw * 0.6, cw * 0.3);
  if (k.cloud > 0) Spr.draw(ctx, 'items', 'awan', p.x, p.y - cw * 0.85, cw * 0.55);
  if (k.boost > 0 && k !== R.player) Spr.draw(ctx, 'items', 'sparkO', p.x, p.y + cw * 0.05, cw * 0.35);
  ctx.globalAlpha = 1;
}
function renderRace() {
  const { T, player, def } = R, th = def.theme;
  const camZ = (player.z - Road.PLAYER_Z + T.length) % T.length;
  const psg = Road.find(T, player.z), ppct = (player.z % Road.SEG) / Road.SEG;
  const py = psg.p1.world.y + (psg.p2.world.y - psg.p1.world.y) * ppct;
  R.camX += (player.x * Road.ROADW - R.camX) * 0.35;
  const cam = { x: R.camX, y: py + Road.CAM_H + player.jy * 0.35, z: camZ };
  R.skyOff += psg.curve * player.sp * 0.0009 * (S.paused ? 0 : 1);
  const inTun = Road.find(T, camZ + Road.PLAYER_Z * 0.3).flags.tunnel;
  Road.sky(ctx, Spr.img[def.sky], R.skyOff, th, inTun);
  // kelompokkan kart & item per segmen
  const bySeg = new Map(), put = (z, o) => { const i = Math.floor(z / Road.SEG) % T.segs.length; if (!bySeg.has(i)) bySeg.set(i, []); bySeg.get(i).push(o); };
  for (const k of R.karts) put(k.z, { kart: k });
  for (const o of Items.list) put(o.z, { item: o });
  if (R.ghost && R.mode === 'tt' && R.phase !== 'count') {
    const s = R.ghost[Math.min(R.ghost.length - 1, Math.floor(R.t * 20))];
    if (s) { const gk = R.ghostK || (R.ghostK = new Kart(store.get('tt_' + def.id, {}).char || S.char, true)); gk.dist = s[0]; gk.z = ((T.startZ + s[0]) % T.length + T.length) % T.length; gk.x = s[1]; put(gk.z, { kart: gk, ghost: true }); }
  }
  const atlas = def.decorAtlas;
  R.playerCw = KART_W * Road.DEPTH / Road.PLAYER_Z * W / 2;
  Road.render(ctx, T, cam, th, sg => {
    const a = 1 - (sg.fog || 0) * 0.9;
    for (const d of sg.sprites) {
      const p = Road.screenAt(sg, 0, d.x, 0);
      if (d.name === '__lamp') { const q = Road.screenAt(sg, 0, d.x, 1900), r = 140 * q.k; ctx.fillStyle = '#ffe9a0'; ctx.fillRect(q.x - r / 2, q.y - r / 2, r, r * 0.6); continue; }
      if (d.name === '__flag') {
        const top = Road.screenAt(sg, 0, d.x, 2300), pw = Math.max(1, 60 * p.k);
        if (sg.p1.camera.z < Road.PLAYER_Z + 150) ctx.globalAlpha = 0.35;
        ctx.fillStyle = '#ddd'; ctx.fillRect(p.x - pw / 2, top.y, pw, p.y - top.y);
        if (d.x > 0) {
          const l = Road.screenAt(sg, 0, -d.x, 2300), bh = 380 * p.k, n = 16, w = (top.x - l.x) / n;
          for (let i = 0; i < n; i++) for (let j = 0; j < 2; j++) { ctx.fillStyle = (i + j) % 2 ? '#111' : '#fff'; ctx.fillRect(l.x + i * w, top.y + j * bh / 2, w + 0.5, bh / 2 + 0.5); }
        }
        ctx.globalAlpha = 1;
        continue;
      }
      const cw = d.w * p.k;
      if (cw < 2 || p.x < -cw || p.x > W + cw) continue;
      ctx.globalAlpha = sg.p1.camera.z < Road.PLAYER_Z + 150 ? 0.35 : a; Spr.draw(ctx, atlas, d.name, p.x, p.y, cw); ctx.globalAlpha = 1;
    }
    if (sg.boxes) for (const b of sg.boxes) {
      if (b.t > 0) continue;
      const p = Road.screenAt(sg, 0.5, b.x, 260 + Math.sin(S.t * 4 + b.x * 5) * 60);
      ctx.globalAlpha = a; Spr.draw(ctx, 'items', 'kotak', p.x, p.y, 430 * p.k); ctx.globalAlpha = 1;
    }
    const objs = bySeg.get(sg.index);
    if (objs) {
      objs.sort((u, v) => ((v.kart || v.item).z % Road.SEG) - ((u.kart || u.item).z % Road.SEG));
      for (const o of objs) {
        const z = (o.kart || o.item).z, pct = (z % Road.SEG) / Road.SEG;
        if (o.kart) drawKart(o.kart, sg, pct, o.ghost ? 0.45 : a);
        else {
          const it = o.item, p = Road.screenAt(sg, pct, it.x, it.type === 'piano' ? 350 + Math.sin(S.t * 8) * 60 : 0);
          const w = { pisang: 330, kumon: 380, piano: 520 }[it.type] * p.k;
          Spr.draw(ctx, 'items', it.type, p.x, p.y, w);
        }
      }
    }
  });
  // efek pemain (layar)
  const pp = Road.screenAt(psg, ppct, player.x, player.jy), cw = KART_W * pp.k;
  if (player.drift && player.dcharge > 0.8 && !player.air) {
    const f = player.dcharge > 1.7 ? 'sparkO' : 'sparkB', s = cw * (0.22 + Math.random() * 0.08);
    Spr.draw(ctx, 'items', f, pp.x - cw * 0.3, pp.y + 4, s); Spr.draw(ctx, 'items', f, pp.x + cw * 0.3, pp.y + 4, s);
  }
  if (player.boost > 0) { ctx.globalAlpha = 0.85; Spr.draw(ctx, 'items', 'sparkO', pp.x, pp.y + cw * 0.08, cw * (0.35 + Math.random() * 0.1)); ctx.globalAlpha = 1; }
  if ((Math.abs(player.x) > 1.06 && player.sp > 0.3 && !player.air) || (player.drift && Math.random() < 0.5)) {
    R.parts.push({ x: pp.x + (Math.random() - 0.5) * cw * 0.6, y: pp.y - 4, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 40, life: 0.5, s: cw * 0.18 });
  }
  for (const q of R.parts) { q.x += q.vx / 60; q.y += q.vy / 60; q.life -= 1 / 60; ctx.globalAlpha = Math.max(0, q.life * 1.6); Spr.draw(ctx, 'items', 'asap', q.x, q.y, q.s); }
  ctx.globalAlpha = 1;
  R.parts = R.parts.filter(q => q.life > 0).slice(-40);
  if (th.fog) { const g = ctx.createLinearGradient(0, 120, 0, 300); g.addColorStop(0, 'rgba(230,215,215,0.5)'); g.addColorStop(1, 'rgba(230,215,215,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 300); }
  drawHUD();
}

/* ---------- HUD ---------- */
function txt(s, x, y, size, col = '#fff', align = 'center', outline = '#000') {
  ctx.font = `${size}px "Press Start 2P", monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 4); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
const ITEM_KEYS = Object.keys(ITEM_INFO);
function drawHUD() {
  const { player, karts, T } = R;
  // posisi & lap
  if (R.mode === 'gp') {
    const n = karts.length, pos = player.rank + 1;
    txt(String(pos), 52, 58, 52, pos === 1 ? '#ffe14d' : '#fff'); txt('/' + n, 96, 74, 16);
    // daftar wajah urutan
    karts.slice().sort((a, b) => a.rank - b.rank).forEach((k, i) => {
      const y = 120 + i * 50;
      ctx.fillStyle = k === player ? 'rgba(255,225,77,0.85)' : 'rgba(0,0,0,0.45)'; rr(10, y, 50, 46, 8); ctx.fill();
      Spr.draw(ctx, 'racers', k.id + '.face', 35, y + 44, 48);
      txt(String(i + 1), 66, y + 34, 10, '#fff', 'left');
    });
  }
  const lap = Math.min(3, player.lap);
  txt(`LAP ${lap}/3`, R.mode === 'gp' ? 150 : 20, R.mode === 'gp' ? 40 : 34, 16, '#fff', 'left');
  txt(fmt(R.t), 944, 82, 16, '#fff', 'right');
  if (R.mode === 'tt' && R.best) txt('REKOR ' + fmt(R.best.time), 944, 108, 9, '#9fd8ff', 'right');
  // kotak item
  const bx = 430, by = 14;
  ctx.fillStyle = 'rgba(10,15,44,0.75)'; rr(bx, by, 100, 84, 14); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
  if (player.item) {
    const show = player.roll > 0 ? ITEM_KEYS[Math.floor(S.t * 14) % ITEM_KEYS.length] : player.item;
    Spr.draw(ctx, 'items', show, bx + 50, by + 76, 72);
    if (player.itemN > 1) txt('x' + player.itemN, bx + 92, by + 72, 10, '#ffe14d', 'right');
  }
  // meteran drift
  if (player.drift) {
    const c = player.dcharge, w = Math.min(1, c / 1.7);
    ctx.fillStyle = 'rgba(0,0,0,0.5)'; rr(380, 108, 200, 12, 6); ctx.fill();
    ctx.fillStyle = c > 1.7 ? '#ff9a3b' : c > 0.8 ? '#6fd3ff' : '#ccc'; rr(382, 110, 196 * w, 8, 4); ctx.fill();
  }
  // progres lap (strip)
  const sx = 620, sy = 506, sw = 320;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; rr(sx, sy, sw, 14, 7); ctx.fill();
  for (const k of karts) {
    const f = Math.max(0, Math.min(1, k.dist / (T.length * 3)));
    Spr.draw(ctx, 'racers', k.id + '.face', sx + f * sw, sy + 22, k === player ? 34 : 26);
  }
  if (R.phase === 'count') {
    const c = Math.ceil(R.count);
    if (c <= 3 && c >= 1) txt(String(c), W / 2, H / 2 - 40, 72, '#ffe14d', 'center', '#a3121a');
    // lampu start
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#222'; rr(W / 2 - 75 + i * 52, 120, 44, 44, 22); ctx.fill(); ctx.fillStyle = 3 - i >= c && c <= 3 ? (c <= 0 ? '#3f3' : '#f33') : '#444'; ctx.beginPath(); ctx.arc(W / 2 - 53 + i * 52, 142, 16, 0, 7); ctx.fill(); }
    if (R.count < 1.6) txt('Gas sekarang untuk START TURBO!', W / 2, 196, 10, '#fff');
  }
  if (R.msg) txt(R.msg.text, W / 2, 230, R.msg.text.length > 16 ? 16 : 28, R.msg.col, 'center', '#000');
  if (S.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    txt('PAUSE', W / 2, 180, 36, '#ffe14d');
    button(W / 2 - 150, 250, 300, 54, '▶ LANJUT', () => { S.paused = false; });
    button(W / 2 - 150, 320, 300, 54, '↺ ULANG BALAPAN', () => startRace(S.game.mode === 'gp' ? S.game.tracks[S.game.idx] : S.track));
    button(W / 2 - 150, 390, 300, 54, '☰ MENU UTAMA', () => go('title'));
  }
}

/* ---------- Tombol UI (canvas) ---------- */
function button(x, y, w, h, label, act, o = {}) {
  const i = UI.length, f = S.focus === i;
  UI.push({ x, y, w, h, act });
  ctx.fillStyle = o.on ? '#2f9e44' : f ? '#ff9a3b' : (o.col || '#e0262f'); rr(x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = f ? '#fff' : '#ffe14d'; ctx.lineWidth = f ? 4 : 3; ctx.stroke();
  txt(label, x + w / 2, y + h / 2 + 1, o.size || 14);
}
function menuKeys() {
  if (!UI.length) return;
  if (pressed.left || pressed.gas) S.focus = (S.focus - 1 + UI.length) % UI.length;
  if (pressed.right || pressed.brake) S.focus = (S.focus + 1) % UI.length;
  if (pressed.ok || pressed.item) { SFX.click(); UI[Math.min(S.focus, UI.length - 1)].act(); }
}
function bg(dim = 0.55) {
  const im = Spr.img.cover;
  if (Spr.ok(im)) { const s = Math.max(W / im.naturalWidth, H / im.naturalHeight); ctx.drawImage(im, (W - im.naturalWidth * s) / 2, (H - im.naturalHeight * s) / 2, im.naturalWidth * s, im.naturalHeight * s); }
  else { ctx.fillStyle = '#1d2a6b'; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = `rgba(8,12,40,${dim})`; ctx.fillRect(0, 0, W, H);
}
const DIFF = ['MUDAH', 'SEDANG', 'SUSAH'];

function drawTitle() {
  bg(0.1);
  const y = 66 + Math.sin(S.t * 2) * 4;
  txt('FALISHA KART', W / 2, y, 46, '#ffe14d', 'center', '#a3121a');
  txt('TURBO', W / 2, y + 54, 34, '#ff5a3b', 'center', '#16206a');
  button(W / 2 - 130, 440, 260, 62, '▶ MULAI', () => go('modes'), { size: 18 });
}
function drawModes() {
  bg();
  txt('PILIH MODE', W / 2, 54, 26, '#ffe14d');
  const best = TRACKS.map(t => store.get('tt_' + t.id, null)).filter(Boolean).length;
  button(80, 100, 250, 150, '', () => { S.game = { mode: 'gp', pts: {}, tracks: [0, 1, 2, 3], idx: 0 }; go('char'); });
  button(355, 100, 250, 150, '', () => { S.game = { mode: 'tt' }; go('char'); }, { col: '#2456d8' });
  button(630, 100, 250, 150, '', () => { S.game = { mode: 'free' }; go('char'); }, { col: '#2f9e44' });
  txt('🏆', 205, 140, 30); txt('GRAND PRIX', 205, 192, 14); txt('4 sirkuit vs CPU', 205, 222, 8, '#ffe14d');
  txt('⏱️', 480, 140, 30); txt('TIME TRIAL', 480, 192, 14); txt(`Kejar rekor & ghost (${best}/4)`, 480, 222, 8, '#ffe14d');
  txt('🚗', 755, 140, 30); txt('LATIHAN', 755, 192, 14); txt('Bebas, tanpa lawan', 755, 222, 8, '#ffe14d');
  txt('PENGATURAN', W / 2, 300, 14, '#9fd8ff');
  button(150, 330, 310, 56, 'KESULITAN: ' + DIFF[opts.diff], () => { opts.diff = (opts.diff + 1) % 3; store.set('opts', opts); }, { col: '#6c3fb0', size: 12 });
  button(500, 330, 310, 56, 'GAS OTOMATIS: ' + (opts.autogas ? 'ON' : 'OFF'), () => { opts.autogas = !opts.autogas; store.set('opts', opts); }, { col: opts.autogas ? '#2f9e44' : '#555', size: 12 });
  button(W / 2 - 110, 440, 220, 54, '◀ KEMBALI', () => go('title'), { col: '#2a3170', size: 12 });
  txt('Keyboard: ↑ gas • ↓ rem • ←/→ belok • Shift drift • Spasi item • P pause', W / 2, 516, 8, '#c8d0ff');
}
const STAT_ROWS = [['KECEPATAN', 'top', 0.9, 1.0], ['AKSELERASI', 'acc', 0.74, 1.0], ['HANDLING', 'handle', 0.84, 1.14]];
function drawChar() {
  bg();
  txt('PILIH PEMBALAP', W / 2, 46, 24, '#ffe14d');
  const ang = ['a0', 'a45', 'a90', 'a135', 'a180', 'a225', 'a270', 'a315'][Math.floor(S.t * 4) % 8];
  RACER_IDS.forEach((id, i) => {
    const x = 18 + i * 186, y = 80, st = RACERS[id];
    button(x, y, 176, 380, '', () => { S.char = id; if (S.game.mode === 'gp') startRace(S.game.tracks[0]); else go('track'); }, { col: '#1a2158' });
    Spr.draw(ctx, 'racers', id + '.face', x + 88, y + 110, 100);
    Spr.draw(ctx, 'racers', id + '.' + (S.focus === i ? ang : 'a180'), x + 88, y + 240, 150);
    txt(st.name, x + 88, y + 262, st.name.length > 8 ? 10 : 12);
    txt(st.cls, x + 88, y + 284, 9, '#ffe14d');
    STAT_ROWS.forEach(([lbl, key, lo, hi], j) => {
      const yy = y + 306 + j * 22, f = (st[key] - lo) / (hi - lo);
      txt(lbl, x + 12, yy, 6, '#c8d0ff', 'left');
      ctx.fillStyle = '#333'; rr(x + 86, yy - 5, 78, 10, 4); ctx.fill();
      ctx.fillStyle = st.col === '#333' ? '#e3262d' : st.col; rr(x + 86, yy - 5, 78 * Math.max(0.15, Math.min(1, f)), 10, 4); ctx.fill();
    });
    txt('BERAT ' + '■'.repeat(st.weight), x + 12, y + 372, 6, '#c8d0ff', 'left');
  });
  button(W / 2 - 110, 474, 220, 50, '◀ KEMBALI', () => go('modes'), { col: '#2a3170', size: 12 });
}
function drawTrackSel() {
  bg();
  txt(S.game.mode === 'tt' ? 'TIME TRIAL: PILIH SIRKUIT' : 'LATIHAN: PILIH SIRKUIT', W / 2, 46, 20, '#ffe14d');
  TRACKS.forEach((t, i) => {
    const x = 30 + (i % 2) * 455, y = 80 + Math.floor(i / 2) * 190;
    button(x, y, 440, 176, '', () => { S.track = i; startRace(i); }, { col: '#1a2158' });
    const im = Spr.img[t.sky];
    if (Spr.ok(im)) { ctx.save(); rr(x + 10, y + 10, 420, 110, 10); ctx.clip(); ctx.drawImage(im, 0, 0, im.naturalWidth / 2, im.naturalHeight, x + 10, y + 10, 420, 140); ctx.restore(); }
    txt(`${i + 1}. ${t.name}`, x + 220, y + 138, 13);
    const b = store.get('tt_' + t.id, null);
    txt(S.game.mode === 'tt' ? (b ? 'REKOR ' + fmt(b.time) : 'Belum ada rekor') : t.sub, x + 220, y + 160, 8, '#ffe14d');
  });
  button(W / 2 - 110, 474, 220, 50, '◀ KEMBALI', () => go('char'), { col: '#2a3170', size: 12 });
}
function drawResult() {
  const g = S.game;
  bg(0.65);
  const r = R.results;
  txt(R.mode === 'gp' ? `HASIL – ${R.def.name}` : R.def.name, W / 2, 46, 18, '#ffe14d');
  if (R.mode === 'gp') {
    r.forEach((row, i) => {
      const y = 80 + i * 62;
      ctx.fillStyle = row.me ? 'rgba(255,200,40,0.85)' : 'rgba(26,33,88,0.9)'; rr(170, y, 620, 54, 12); ctx.fill();
      txt(String(i + 1), 205, y + 28, 20, i === 0 ? '#ffe14d' : '#fff');
      Spr.draw(ctx, 'racers', row.id + '.' + (i === 0 ? 'win' : i === r.length - 1 ? 'lose' : 'face'), 275, y + 54, 56);
      txt(RACERS[row.id].name, 320, y + 28, 12, '#fff', 'left');
      txt(fmt(row.time), 640, y + 28, 11, '#fff', 'right');
      txt('+' + row.pts, 760, y + 28, 12, '#ffe14d', 'right');
    });
    const last = g.idx >= g.tracks.length - 1;
    button(W / 2 - 150, 410, 300, 58, last ? '🏆 PODIUM' : '▶ SIRKUIT BERIKUTNYA', () => { if (last) go('podium'); else { g.idx++; startRace(g.tracks[g.idx]); } }, { size: 12 });
    txt('Klasemen: ' + RACER_IDS.slice().sort((a, b) => (g.pts[b] || 0) - (g.pts[a] || 0)).map(id => `${RACERS[id].name.split(' ').pop()} ${g.pts[id] || 0}`).join(' • '), W / 2, 494, 8, '#c8d0ff');
  } else {
    const me = r.find(x => x.me);
    Spr.draw(ctx, 'racers', S.char + '.win', W / 2, 300, 230);
    txt('WAKTU ' + fmt(me.time), W / 2, 340, 20);
    if (R.mode === 'tt') txt(R.newRecord ? '★ REKOR BARU! Ghost tersimpan ★' : 'Rekor: ' + fmt(R.best.time), W / 2, 376, 12, R.newRecord ? '#ffe14d' : '#9fd8ff');
    button(W / 2 - 310, 420, 290, 58, '↺ ULANGI', () => startRace(S.track), { size: 12 });
    button(W / 2 + 20, 420, 290, 58, '☰ PILIH SIRKUIT', () => go('track'), { col: '#2456d8', size: 12 });
  }
}
function drawPodium() {
  const g = S.game;
  bg(0.75);
  const order = RACER_IDS.slice().sort((a, b) => (g.pts[b] || 0) - (g.pts[a] || 0));
  txt('🏆 PIALA NUSANTARA 🏆', W / 2, 44, 22, '#ffe14d', 'center', '#a3121a');
  const spots = [[W / 2, 300, 150, '#ffd23f'], [W / 2 - 220, 340, 110, '#c0c6d0'], [W / 2 + 220, 360, 90, '#cd7f32']];
  spots.forEach(([x, y, hgt, col], i) => {
    ctx.fillStyle = col; ctx.fillRect(x - 90, y, 180, H - y - 70); txt(String(i + 1), x, y + 34, 30, '#fff');
    const id = order[i]; Spr.draw(ctx, 'racers', id + '.win', x, y + 4 + Math.sin(S.t * 5 + i) * 4, 200);
    txt(`${RACERS[id].name} ${g.pts[id] || 0}`, x, y + 76, 9);
  });
  const lastId = order[order.length - 1];
  Spr.draw(ctx, 'racers', lastId + '.lose', 70, 470, 110);
  const pos = order.indexOf(S.char) + 1;
  txt(pos === 1 ? 'SELAMAT! KAMU JUARA PIALA!' : `Kamu juara ${pos}. Ayo coba lagi!`, W / 2, 98, 14, '#fff');
  button(W / 2 - 150, 478, 300, 50, '☰ MENU UTAMA', () => go('title'), { size: 12 });
}
function drawLoad() {
  ctx.fillStyle = '#0b1030'; ctx.fillRect(0, 0, W, H);
  txt('FALISHA KART TURBO', W / 2, 220, 26, '#ffe14d');
  ctx.fillStyle = '#333'; rr(280, 270, 400, 20, 10); ctx.fill();
  ctx.fillStyle = '#ffe14d'; rr(282, 272, 396 * Spr.progress(), 16, 8); ctx.fill();
}

/* ---------- Loop ---------- */
function frame(dt) {
  S.t += dt; S.modeT += dt;
  UI = [];
  ctx.clearRect(0, 0, W, H);
  if (S.mode === 'load') drawLoad();
  else if (S.mode === 'race') { if (!S.paused) updateRace(dt); else if (pressed.pause || pressed.back) togglePause(); if (S.mode === 'race') renderRace(); }
  else if (S.mode === 'title') drawTitle();
  else if (S.mode === 'modes') drawModes();
  else if (S.mode === 'char') drawChar();
  else if (S.mode === 'track') drawTrackSel();
  else if (S.mode === 'result') drawResult();
  else if (S.mode === 'podium') drawPodium();
  if (S.mode !== 'race' || S.paused) menuKeys();
  for (const k in pressed) pressed[k] = false;
}
let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  frame(dt);
  requestAnimationFrame(loop);
}
Spr.load().then(() => go('title'));
requestAnimationFrame(loop);
