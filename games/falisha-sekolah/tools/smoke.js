/* Smoke test Playwright. Server: `python3 -m http.server 8765` dari root repo.
   Jalankan: PW=$(npm root -g)/playwright node games/falisha-sekolah/tools/smoke.js <minigames|day> [SMOKE_OUT=dir] */
const { chromium } = require(process.env.PW || 'playwright');
const MODE = process.argv[2] || 'minigames';
const OUT = process.env.SMOKE_OUT || '/tmp';
const BASE = 'http://localhost:8765/games/falisha-sekolah/';
const IDS = ['wudhu', 'dhuha', 'iqro', 'hitung', 'doa', 'jajan', 'lompat_tali'];
const fail = msg => { console.error('FAIL ' + msg); process.exitCode = 1; };

async function minigames(p) {
  await p.goto(BASE + 'tools/mg.html'); await p.waitForTimeout(800);
  let ok = 0;
  for (const id of IDS) {
    await p.evaluate(id => { window.__done = null; Minigames.start(id, s => { window.__done = s; }); }, id);
    await p.waitForTimeout(600);
    await p.screenshot({ path: `${OUT}/mg_${id}.png` });
    for (let i = 0; i < 400 && await p.evaluate(() => Minigames.active()); i++) {
      await p.evaluate(() => Minigames.debugSolveStep());
      await p.waitForTimeout(id === 'lompat_tali' ? 30 : 15);
    }
    await p.waitForTimeout(1800);
    const done = await p.evaluate(() => window.__done);
    if (done !== 3) fail(`${id}: onDone=${done}`); else ok++;
  }
  console.log(`OK minigames ${ok}/${IDS.length}`);
}

async function day(p) {
  const D = (fn, arg) => p.evaluate(fn, arg);
  const shot = name => p.screenshot({ path: `${OUT}/day_${name}.png` });
  const solve = async () => {
    for (let i = 0; i < 500 && await D(() => Game.debug.screen() === 'minigame'); i++) { await D(() => Game.debug.solveStep()); await p.waitForTimeout(20); }
    if (await D(() => Game.debug.screen()) !== 'world') fail('mini-game tidak kembali ke dunia');
  };
  const step = () => D(() => Game.debug.state().step);
  const expect = async (n, label) => { const s = await step(); if (s !== n) fail(`${label}: step=${s}, harap ${n}`); };
  await p.goto(BASE + '?debug=1'); await p.waitForTimeout(1200);
  await D(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1200);
  await shot('title');
  await D(() => Game.debug.newGame()); await p.waitForTimeout(400);
  // 1 siap
  await D(() => Game.debug.pickAll('tas')); await D(() => Game.debug.pickAll('botol')); await expect(1, 'siap');
  // 2 pamit
  await D(() => Game.debug.talk('pupu', true)); await p.waitForTimeout(300); await shot('dialog'); await D(() => Game.debug.flushDialog()); await expect(2, 'pamit');
  // 3 berangkat
  await D(() => Game.debug.teleport('jalan', 'rumah')); await p.waitForTimeout(400); await shot('jalan');
  await D(() => Game.debug.teleport('gerbang', 'jalan')); await expect(3, 'berangkat'); await p.waitForTimeout(300); await shot('gerbang');
  // 4 salam guru
  await D(() => Game.debug.talk('guru')); await expect(4, 'salam_guru');
  // 5-6 musala
  await D(() => Game.debug.teleport('musala', 'gerbang')); await p.waitForTimeout(300); await shot('musala');
  await D(() => Game.debug.talk('ustadz')); await solve(); await expect(5, 'wudhu');
  await D(() => Game.debug.talk('ustadz')); await solve(); await expect(6, 'dhuha');
  // 7-9 kelas
  await D(() => Game.debug.teleport('kelas', 'gerbang')); await p.waitForTimeout(300); await shot('kelas');
  await D(() => Game.debug.talk('guru')); await solve(); await expect(7, 'iqro');
  // simpanan: muat ulang di tengah langkah 8
  await p.reload(); await p.waitForTimeout(1200);
  if (await step() !== 7) fail('simpanan tidak termuat: step=' + await step());
  await D(() => Game.debug.continueGame()); await D(() => Game.debug.teleport('kelas', 'gerbang'));
  await D(() => Game.debug.talk('guru')); await solve(); await expect(8, 'hitung');
  await D(() => Game.debug.talk('guru')); await solve(); await expect(9, 'doa');
  // 10 kantin
  await D(() => Game.debug.teleport('lapangan', 'gerbang')); await p.waitForTimeout(300); await shot('lapangan');
  await D(() => Game.debug.teleport('kantin', 'lapangan')); await p.waitForTimeout(300); await shot('kantin');
  await D(() => Game.debug.talk('kantin')); await solve(); await expect(10, 'jajan');
  // 11 lompat tali
  await D(() => Game.debug.teleport('lapangan', 'kantin'));
  await D(() => Game.debug.talk('anasya')); await solve(); await expect(11, 'lompat_tali');
  // 12 pensil
  await D(() => Game.debug.pickAll('pensil'));
  if (await D(() => Game.debug.state().items.pensil) !== 5) fail('pensil tidak 5');
  await D(() => Game.debug.teleport('kelas', 'gerbang')); await D(() => Game.debug.talk('putra')); await expect(12, 'pensil');
  // 13 piket
  await D(() => Game.debug.pickAll('sampah')); await D(() => Game.debug.useSpot('tong')); await expect(13, 'piket');
  // 14 pulang
  await D(() => Game.debug.teleport('gerbang', 'kelas')); await p.waitForTimeout(300); await shot('pulang');
  await D(() => Game.debug.talk('nono')); await p.waitForTimeout(500);
  const fin = await D(() => ({ screen: Game.debug.screen(), st: Game.debug.state() }));
  if (fin.screen !== 'rapor') fail('layar akhir ' + fin.screen);
  if (fin.st.stickers !== 14) fail('stiker ' + fin.st.stickers);
  const stars = Object.values(fin.st.stars);
  if (stars.length !== 7 || stars.some(s => s !== 3)) fail('bintang ' + JSON.stringify(fin.st.stars));
  await shot('rapor');
  // rapor & judul: satu tekan Spasi / ketukan tidak boleh menghapus simpanan
  await p.keyboard.press('Space'); await p.mouse.click(480, 497); await p.waitForTimeout(300);
  if (await D(() => Game.debug.state().step) !== 14) fail('rapor: simpanan terhapus oleh satu tekan/ketukan');
  await p.reload(); await p.waitForTimeout(1200);
  await p.mouse.click(640, 472); await p.waitForTimeout(300);
  if (await D(() => Game.debug.state().step) !== 14) fail('judul: MAIN BARU menghapus tanpa konfirmasi');
  // joystick dilepas dengan pointercancel → Falisha berhenti
  await D(() => Game.debug.newGame()); await p.waitForTimeout(300);
  const moved = await D(async () => {
    const t = document.getElementById('touch'); t.classList.remove('hidden'); t.style.display = 'flex';
    const j = document.getElementById('joy'), r = j.getBoundingClientRect();
    j.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 7, clientX: r.right - 5, clientY: r.top + r.height / 2, bubbles: true }));
    await new Promise(res => setTimeout(res, 300));
    j.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7, bubbles: true }));
    await new Promise(res => setTimeout(res, 100));
    const a = { ...Scene.player() };
    await new Promise(res => setTimeout(res, 1000));
    const b = Scene.player();
    return { started: a.x, dx: Math.abs(b.x - a.x) + Math.abs(b.y - a.y) };
  });
  if (moved.dx > 0.5) fail('joystick tidak berhenti: ' + JSON.stringify(moved));
  if (!process.exitCode) console.log('OK day 14/14');
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 960, height: 540 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  try {
    if (MODE === 'minigames') await minigames(p);
    else if (MODE === 'day' && typeof day === 'function') await day(p);
    else fail('mode tidak dikenal: ' + MODE);
  } catch (e) { fail(e.message); }
  if (errs.length) fail('pageerror: ' + errs.join(' | '));
  await b.close();
})();
