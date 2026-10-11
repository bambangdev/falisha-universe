/* Smoke test Playwright. Server: `python3 -m http.server 8765` dari root repo.
   Jalankan: PW=$(npm root -g)/playwright SMOKE_OUT=dir node games/falisha-surfers/tools/smoke.js [w h] */
const { chromium } = require(process.env.PW || 'playwright');
const OUT = process.env.SMOKE_OUT || '/tmp';
const [W, H] = [+process.argv[2] || 1280, +process.argv[3] || 720];
const fail = msg => { console.error('FAIL ' + msg); process.exitCode = 1; };
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/games/falisha-surfers/');
  await p.waitForFunction(() => window.__surf && __surf.state() === 'menu', null, { timeout: 20000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/menu_${W}.png` });
  await p.keyboard.press('Enter');
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/play1_${W}.png` });
  // kebal, lalu coba semua aksi dan power-up
  await p.evaluate(() => { __surf.P.invuln = 9999; });
  for (const k of ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowRight', 'ArrowDown', 'ArrowLeft']) { await p.keyboard.press(k); await p.waitForTimeout(250); }
  await p.screenshot({ path: `${OUT}/play2_${W}.png` });
  await p.evaluate(() => { __surf.collectPower('jetpack'); __surf.step(100); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/jet_${W}.png` });
  await p.evaluate(() => { __surf.step(600); __surf.collectPower('magnet'); __surf.collectPower('double'); __surf.useBoard(); __surf.step(240); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/power_${W}.png` });
  const info = await p.evaluate(() => ({ st: __surf.state(), dist: __surf.dist(), score: __surf.score(), objs: __surf.objs(), coins: __surf.coins() }));
  console.log('info', JSON.stringify(info));
  if (info.st !== 'play' || info.dist < 100) fail('tidak berjalan normal');
  // simulasi jauh (kecepatan tinggi) lalu biarkan mati
  await p.evaluate(() => __surf.step(60 * 120));
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/far_${W}.png` });
  const far = await p.evaluate(() => ({ dist: __surf.dist(), objs: __surf.objs(), coins: __surf.coins() }));
  console.log('far', JSON.stringify(far));
  if (far.objs > 120 || far.coins > 400) fail('objek menumpuk (cull bocor)');
  await p.evaluate(() => { __surf.P.invuln = 0; __surf.pw.board = 0; __surf.step(60 * 60); });
  await p.waitForFunction(() => __surf.state() === 'over', null, { timeout: 60000 }).catch(() => fail('tidak game over'));
  await p.waitForTimeout(500);
  await p.screenshot({ path: `${OUT}/over_${W}.png` });
  if (errs.length) fail(errs.join('\n'));
  else console.log('OK tanpa error');
  await b.close();
})();
