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
