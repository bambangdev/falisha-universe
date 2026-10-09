/* Petualangan Falisha di MIMHa – layar judul, dunia, HUD, menu, rapor, audio, alur satu hari */
const Game = (() => {
  const W = 960, H = 540;
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  const touchEl = document.getElementById('touch');
  const DEBUG = /[?&]debug=1/.test(location.search);
  const PLACE = { rumah: 'Rumah', jalan: 'Jalan Cikadut', gerbang: 'Halaman MIMHa', lapangan: 'Lapangan', kelas: 'Kelas', musala: 'Musala', kantin: 'Kantin' };
  const ICON = { siap: 'tas', pamit: 'hati', berangkat: 'panah', salam_guru: 'hati', wudhu: 'botol', dhuha: 'bintang', iqro: 'iqro', hitung: 'bintang',
    doa: 'hati', jajan: 'bekal', lompat_tali: 'bintang', pensil: 'pensil_merah', piket: 'tong', pulang: 'hati' };
  const MG = ['wudhu', 'dhuha', 'iqro', 'hitung', 'doa', 'jajan', 'lompat_tali'];

  /* ---------- audio ---------- */
  const TRACKS = [
    { bpm: 112, wave: 'triangle', bass: [48, 53, 55, 48], lead: [72, null, 76, 79, 77, null, 76, 74, 72, null, 74, 76, 79, null, 77, null, 76, null, 79, 84, 81, null, 79, 77, 76, 74, 72, null, 74, null, 72, null] },
    { bpm: 124, wave: 'square', bass: [45, 50, 52, 45], lead: [69, 72, 76, null, 74, 72, 69, null, 71, 74, 77, null, 76, 74, 71, null, 69, 72, 76, 81, 79, 76, 72, null, 74, 77, 79, 77, 76, 72, 69, null] },
    { bpm: 138, wave: 'square', bass: [48, 52, 55, 53], lead: [76, 79, 84, 79, 81, 77, 74, 77, 79, 76, 72, 76, 77, 74, 71, null, 76, 79, 84, 88, 86, 84, 81, 79, 77, 76, 74, 72, 74, null, 72, null] },
    { bpm: 100, wave: 'triangle', bass: [48, 45, 41, 43], lead: [72, null, 76, null, 79, 77, 76, null, 74, null, 77, null, 81, 79, 77, null, 76, null, 79, null, 84, 83, 81, null, 79, 77, 76, 74, 72, null, null, null] }
  ];
  const has = typeof Chip !== 'undefined';
  const sfx = {
    pick: () => has && [880, 1175].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.07, 'square', 0.05), i * 60)),
    step: () => has && [659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => Chip.beep(f, 0.12, 'square', 0.05), i * 90)),
    talk: () => has && Chip.beep(700, 0.04, 'square', 0.03),
    no: () => has && Chip.beep(240, 0.15, 'triangle', 0.05)
  };
  function music(i) { if (has) Chip.play(TRACKS, i); }
  function setMuted(m) { if (has) Chip.setMuted(m); document.getElementById('btn-mute').textContent = m ? '🔇' : '🔊'; }
  if (has) setMuted(Chip.isMuted());

  /* ---------- state ---------- */
  let st = Save.load(localStorage);
  let screen = 'load', mapId = 'rumah', tap = null, toasts = [], t = 0, confirmNew = false, celebrate = 0;
  const save = () => Save.store(localStorage, st);
  const current = () => Quests.current(st);
  function toast(text, col = '#fff') { toasts.push({ text, col, t: 2.2 }); if (toasts.length > 3) toasts.shift(); }
  function setScreen(s) {
    screen = s;
    touchEl.classList.toggle('hidden', s !== 'world');
    if (s !== 'world') Input.reset();
  }

  /* ---------- alur ---------- */
  function complete(id) {
    if (!Quests.complete(st, id)) return false;
    save(); sfx.step(); celebrate = 1.6;
    const c = current();
    if (c) toast('⭐ Stiker! Berikutnya: ' + c.text, '#ffe14d');
    if (id === 'pulang') { setScreen('rapor'); music(3); }
    return true;
  }
  function checkAuto() {
    const c = current();
    if (c && c.id === 'siap' && Quests.count(st, 'tas') && Quests.count(st, 'botol')) complete('siap');
  }
  function enterMap(id, at) {
    mapId = id; Scene.enter(id, at, st);
    music(id === 'rumah' || id === 'jalan' ? 0 : 1);
    const c = current();
    if (id === 'gerbang' && c && c.id === 'berangkat') { complete('berangkat'); toast('Sampai di MIMHa! Terima kasih, Baymax.', '#9fe3c0'); }
  }
  function pick(key, item) {
    if (!Quests.markPicked(st, key)) return;
    Quests.addItem(st, item); save(); sfx.pick();
    const n = Quests.count(st, item);
    toast(item === 'pensil' ? `Pensil warna ${n}/5` : item === 'sampah' ? `Sampah dipungut (${n + Quests.count(st, 'dibuang')}/8)` : `Dapat ${item === 'tas' ? 'tas' : 'botol minum'}!`);
    checkAuto();
  }
  function spot(id) {
    const c = current();
    if (id === 'tong') {
      const n = Quests.count(st, 'sampah');
      if (!n) { toast('Tempat sampah. Cari sampahnya dulu ya!'); return; }
      Quests.takeItem(st, 'sampah', n); Quests.addItem(st, 'dibuang', n); save(); sfx.pick();
      const total = Quests.count(st, 'dibuang');
      toast(`Sampah dibuang ${total}/8`, '#9fe3c0');
      if (total >= 8 && c && c.id === 'piket') complete('piket');
    } else if (id === 'keran') toast(c && c.id === 'wudhu' ? 'Minta Pak Ustadz mengajari wudhu dulu, ya!' : 'Airnya segar!');
  }
  function apply(a) {
    if (!a) return;
    if (a.type === 'complete') complete(a.id);
    else if (a.type === 'give') { if (Quests.takeItem(st, a.item, a.n)) complete(current().id); }
    else if (a.type === 'minigame') startMinigame(a.id);
  }
  function talk(npc) {
    const r = Script.talk(npc, st); sfx.talk();
    Dialog.open(r.lines, () => apply(r.action));
  }
  function startMinigame(id) {
    setScreen('minigame'); music(2);
    Minigames.start(id, stars => {
      Quests.setStars(st, id, stars); save();
      setScreen('world'); music(mapId === 'rumah' || mapId === 'jalan' ? 0 : 1);
      const c = current();
      if (c && c.id === id) complete(id); else toast('Bintang: ' + '★'.repeat(stars), '#ffe14d');
    });
  }
  function newGame() { Save.clear(localStorage); st = Quests.create(); save(); setScreen('world'); enterMap('rumah', 'default'); toast('Pagi, Falisha! ' + current().text, '#ffe14d'); }
  function continueGame() {
    if (Quests.finished(st)) { setScreen('rapor'); music(3); return; }
    setScreen('world'); const c = current(); enterMap(c.id === 'siap' || c.id === 'pamit' ? 'rumah' : c.map, 'default');
  }

  /* ---------- input ---------- */
  Input.attach(window, document.getElementById('joy'), document.querySelectorAll('#touch .tbtn'));
  cv.addEventListener('pointerdown', e => {
    if (has) Chip.ensure();
    const r = cv.getBoundingClientRect(), s = Math.min(r.width / W, r.height / H);
    tap = { x: (e.clientX - r.left - (r.width - W * s) / 2) / s, y: (e.clientY - r.top - (r.height - H * s) / 2) / s };
  });
  addEventListener('keydown', () => { if (has) Chip.ensure(); });
  document.getElementById('btn-mute').onclick = e => { e.stopPropagation(); if (has) setMuted(!Chip.isMuted()); };
  document.getElementById('btn-menu').onclick = e => { e.stopPropagation(); toggleMenu(); };
  document.getElementById('btn-full').onclick = e => {
    e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.().then(() => window.screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
  };
  function toggleMenu() { if (screen === 'world') { setScreen('menu'); confirmNew = false; } else if (screen === 'menu') setScreen('world'); }

  /* ---------- gambar ---------- */
  function txt(s, x, y, size, col = '#fff', align = 'center', outline = '#123') {
    ctx.font = `${size}px "Press Start 2P", monospace`; ctx.textAlign = align; ctx.textBaseline = 'middle';
    ctx.lineWidth = Math.max(3, size / 4); ctx.strokeStyle = outline; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  let UI = [];
  function button(x, y, w, h, label, act, col = '#2e8c46', size = 14) {
    UI.push({ x, y, w, h, act });
    ctx.fillStyle = col; rr(x, y, w, h, 14); ctx.fill(); ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 3; ctx.stroke();
    txt(label, x + w / 2, y + h / 2 + 1, size);
  }
  function hud() {
    const c = current();
    if (c) {
      ctx.fillStyle = 'rgba(18,48,28,0.82)'; rr(10, 10, 520, 50, 12); ctx.fill();
      Spr.fit(ctx, 'items', ICON[c.id], 18, 16, 38, 38);
      ctx.font = '11px "Press Start 2P", monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff';
      ctx.fillText(c.text, 64, 28);
      let sub = '';
      if (c.id === 'pensil') sub = `Pensil ${Quests.count(st, 'pensil')}/5`;
      else if (c.id === 'piket') sub = `Sampah ${Quests.count(st, 'sampah') + Quests.count(st, 'dibuang')}/8 • dibuang ${Quests.count(st, 'dibuang')}/8`;
      else if (c.id === 'siap') sub = `Tas ${Quests.count(st, 'tas') ? '✓' : '-'}  Botol ${Quests.count(st, 'botol') ? '✓' : '-'}`;
      const target = c.id === 'pensil' || c.id === 'piket' ? null : (c.id === 'siap' || c.id === 'pamit') ? 'rumah' : c.map;
      if (target && target !== mapId) sub = (sub ? sub + '  ' : '') + '→ ke ' + PLACE[target];
      if (sub) { ctx.fillStyle = '#ffe14d'; ctx.font = '9px "Press Start 2P", monospace'; ctx.fillText(sub, 64, 47); }
    }
    ctx.fillStyle = 'rgba(18,48,28,0.82)'; rr(10, 66, 120, 30, 10); ctx.fill();
    Spr.fit(ctx, 'items', 'bintang', 16, 69, 24, 24); txt('x' + st.stickers, 50, 82, 11, '#ffe14d', 'left');
    ctx.fillStyle = 'rgba(18,48,28,0.82)'; rr(136, 66, 200, 30, 10); ctx.fill(); txt(PLACE[mapId], 236, 82, 9, '#fff');
    toasts.forEach((o, i) => { ctx.globalAlpha = Math.min(1, o.t * 2); ctx.fillStyle = 'rgba(18,48,28,0.88)'; rr(230, 110 + i * 40, 500, 34, 10); ctx.fill(); txt(o.text, 480, 127 + i * 40, o.text.length > 36 ? 9 : 11, o.col); ctx.globalAlpha = 1; });
    if (celebrate > 0) { const k = 1 - celebrate / 1.6; ctx.globalAlpha = Math.min(1, celebrate * 1.5); Spr.fit(ctx, 'items', 'bintang', 450 - k * 420, 230 - k * 160, 60 - k * 30, 60 - k * 30); ctx.globalAlpha = 1; }
  }
  function drawTitle() {
    const im = Spr.img('cover');
    if (im) ctx.drawImage(im, 0, 0, W, H); else { ctx.fillStyle = '#1d4d2b'; ctx.fillRect(0, 0, W, H); }
    txt('PETUALANGAN FALISHA', 400, 54, 26, '#ffe14d', 'center', '#1d4d2b');
    txt('di MIMHa', 400, 98, 20, '#fff', 'center', '#1d4d2b');
    const cont = st.step > 0;
    if (cont) { button(W / 2 - 300, 440, 280, 64, Quests.finished(st) ? '📜 RAPOR' : '▶ LANJUTKAN', continueGame); button(W / 2 + 20, 440, 280, 64, '★ MAIN BARU', newGame, '#c0392b'); }
    else button(W / 2 - 140, 440, 280, 64, '▶ MULAI', newGame);
  }
  function drawMenu() {
    Scene.draw(ctx, st);
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H);
    txt('MENU', W / 2, 90, 30, '#ffe14d');
    button(W / 2 - 160, 140, 320, 58, '▶ LANJUT', () => setScreen('world'));
    button(W / 2 - 160, 214, 320, 58, has && Chip.isMuted() ? '🔇 SUARA: MATI' : '🔊 SUARA: NYALA', () => has && setMuted(!Chip.isMuted()), '#2456d8', 12);
    button(W / 2 - 160, 288, 320, 58, confirmNew ? 'YAKIN? KETUK LAGI' : '★ MAIN BARU', () => { if (confirmNew) newGame(); else confirmNew = true; }, '#c0392b', 12);
    button(W / 2 - 160, 362, 320, 58, '🏠 PORTAL', () => { location.href = '../../index.html'; }, '#555', 12);
  }
  function drawRapor() {
    const im = Spr.img('rapor_bg');
    if (im) ctx.drawImage(im, 0, 0, W, H); else { ctx.fillStyle = '#fbf1d6'; ctx.fillRect(0, 0, W, H); }
    ctx.fillStyle = 'rgba(255,250,240,0.9)'; rr(170, 40, 620, 460, 18); ctx.fill(); ctx.strokeStyle = '#2f6b3f'; ctx.lineWidth = 4; ctx.stroke();
    txt('RAPOR HARI INI', W / 2, 78, 22, '#2f6b3f', 'center', '#fff');
    MG.forEach((id, i) => {
      const y = 120 + i * 40, n = st.stars[id] || 0;
      txt(Minigames.TITLE[id], 200, y, 10, '#2b2b2b', 'left', '#fff');
      ctx.font = '24px serif'; ctx.textAlign = 'right'; ctx.fillStyle = '#f4b400'; ctx.fillText('★'.repeat(n) + '☆'.repeat(3 - n), 640, y + 2);
    });
    txt(`Stiker: ${st.stickers}/14`, 200, 410, 13, '#c0392b', 'left', '#fff');
    Spr.draw(ctx, 'falisha', 'pose.lompat', 720, 440 + Math.sin(t * 6) * 6, 150);
    txt('MasyaAllah, hari yang hebat!', W / 2, 455, 11, '#2f6b3f', 'center', '#fff');
    button(W / 2 - 150, 470, 300, 54, '↻ MAIN LAGI', newGame);
  }
  function drawLoad() {
    ctx.fillStyle = '#1d4d2b'; ctx.fillRect(0, 0, W, H);
    txt('Memuat...', W / 2, 240, 18);
    ctx.fillStyle = '#123'; rr(280, 280, 400, 20, 10); ctx.fill(); ctx.fillStyle = '#ffe14d'; rr(282, 282, 396 * Spr.progress(), 16, 8); ctx.fill();
  }

  /* ---------- loop ---------- */
  function frame(dt) {
    t += dt; UI = [];
    for (const o of toasts) o.t -= dt; toasts = toasts.filter(o => o.t > 0);
    celebrate = Math.max(0, celebrate - dt);
    if (Input.pressed('mute') && has) setMuted(!Chip.isMuted());
    if (Input.pressed('menu')) toggleMenu();
    touchEl.classList.toggle('hidden', screen !== 'world' || Dialog.active());
    if (screen === 'load') drawLoad();
    else if (screen === 'title') drawTitle();
    else if (screen === 'world') {
      if (Dialog.active()) Dialog.update(dt, Input.pressed('action') || !!tap);
      else {
        const ev = Scene.update(dt, Input.axis(), Input.pressed('action'), st);
        if (ev) { if (ev.type === 'warp') enterMap(ev.to, ev.at); else if (ev.type === 'talk') talk(ev.npc); else if (ev.type === 'pick') pick(ev.key, ev.item); else if (ev.type === 'spot') spot(ev.id); }
      }
      if (screen === 'world') { Scene.draw(ctx, st); hud(); Dialog.draw(ctx); }
    } else if (screen === 'minigame') {
      const nav = (Input.pressed('right') || Input.pressed('down') ? 1 : 0) - (Input.pressed('left') || Input.pressed('up') ? 1 : 0);
      Minigames.update(dt, tap, Input.pressed('action'), nav);
      if (screen === 'minigame') Minigames.draw(ctx); else { Scene.draw(ctx, st); hud(); }
    } else if (screen === 'menu') drawMenu();
    else if (screen === 'rapor') drawRapor();
    if (tap && screen !== 'minigame' && !(screen === 'world')) { const b = UI.find(u => tap.x >= u.x && tap.x <= u.x + u.w && tap.y >= u.y && tap.y <= u.y + u.h); if (b) b.act(); }
    else if (screen !== 'world' && screen !== 'minigame' && Input.pressed('action') && UI.length) UI[0].act();
    tap = null; Input.endFrame();
  }
  let last = performance.now();
  function loop(now) { const dt = Math.min(0.05, (now - last) / 1000); last = now; frame(dt); requestAnimationFrame(loop); }
  Spr.load().then(() => setScreen('title'));
  requestAnimationFrame(loop);

  /* ---------- API debug (?debug=1) ---------- */
  const debug = !DEBUG ? null : {
    state: () => st, screen: () => screen, newGame, continueGame,
    teleport: (map, at) => { setScreen('world'); enterMap(map, at || 'default'); },
    talk: (npc, keepOpen) => { talk(npc); if (!keepOpen) debug.flushDialog(); },
    flushDialog: () => { for (let i = 0; i < 200 && Dialog.active(); i++) Dialog.update(0.01, true); },
    pickAll: item => {
      for (const id of Object.keys(MAPS)) for (const o of MAPS[id].objects) {
        const c = current();
        if (o.item === item && c && o.step === c.id) pick(id + ':' + o.id, o.item);
      }
    },
    useSpot: id => spot(id),
    minigame: id => startMinigame(id),
    solveStep: () => Minigames.debugSolveStep(),
    finishMinigame: s => Minigames.debugFinish(s)
  };
  if (DEBUG) Scene.debug = /[?&]walls=1/.test(location.search);
  return { debug };
})();
