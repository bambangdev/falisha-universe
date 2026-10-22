/* Smoke test Playwright. Server: `python3 -m http.server 8765` dari root repo.
   Jalankan: PW=/opt/node-tools/node_modules/playwright SMOKE_OUT=dir node games/falisha-slug-3d/tools/smoke.js [w h] */
const { chromium } = require(process.env.PW || 'playwright');
const OUT = process.env.SMOKE_OUT || '/tmp';
const [W, H] = [+process.argv[2] || 1280, +process.argv[3] || 800];
let failed = 0;
const fail = msg => { console.error('FAIL ' + msg); failed++; process.exitCode = 1; };
const ok = msg => console.log('ok   ' + msg);
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const errs = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/games/falisha-slug-3d/');
  await p.waitForFunction(() => window.__slug && __slug.state() === 'menu', null, { timeout: 30000 });
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/menu_${W}.png` });
  const nChars = await p.$$eval('#chars .char', e => e.length);
  nChars === 5 ? ok('menu 5 karakter') : fail('menu karakter: ' + nChars);
  const S = (fn) => p.evaluate(fn);
  // mulai dengan karakter 1 (Arsyad)
  await S(() => __slug.start(1));
  await p.waitForTimeout(600);
  let st = await S(() => __slug.state()); st === 'play' ? ok('mulai: play') : fail('state ' + st);
  // jalan ke kanan & lompat
  const x0 = await S(() => __slug.P().x);
  await S(() => { __slug.input.right = 1; __slug.step(60); __slug.input.right = 0; });
  const x1 = await S(() => __slug.P().x); x1 > x0 + 3 ? ok(`jalan kanan ${x0.toFixed(1)} -> ${x1.toFixed(1)}`) : fail('tidak jalan');
  await S(() => { __slug.input.jump = 1; __slug.step(3); __slug.input.jump = 0; __slug.step(10); });
  (await S(() => __slug.P().y)) > 0.5 ? ok('lompat') : fail('tidak lompat');
  await S(() => __slug.step(60));
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/play1_${W}.png` });
  // tembak prajurit pertama (x 11.25 di platform y 2.4): naik ke platform dulu
  await S(() => { __slug.P().invuln = 1e9; __slug.warp(9.5); __slug.P().y = 2.4; __slug.P().onGround = true; __slug.step(2); __slug.input.fire = 1; __slug.step(70); __slug.input.fire = 0; });
  let en = await S(() => __slug.enemies().map(e => ({ t: e.type, x: +e.x.toFixed(1), hp: e.hp, panic: e.panic })));
  (en[0]?.panic || en[0]?.hp < 2 || en.length < 7) ? ok('prajurit pertama kena / panik') : fail('prajurit tidak kena: ' + JSON.stringify(en.slice(0, 2)));
  (await S(() => __slug.score())) >= 100 ? ok('skor bertambah') : fail('skor 0');
  // sandera pertama di x 12.5 y 2.4
  await S(() => { __slug.warp(11.3); __slug.P().y = 2.4; __slug.P().onGround = true; __slug.input.fire = 1; __slug.step(40); __slug.input.fire = 0; __slug.step(40); });
  let host = await S(() => __slug.hostages().map(h => h.freed));
  host[0] ? ok('sandera 1 bebas') : fail('sandera tidak bebas ' + JSON.stringify(host));
  (await S(() => __slug.drops().length)) > 0 ? ok('drop muncul') : fail('drop tidak muncul');
  await S(() => { __slug.warp(12.8); __slug.P().y = 2.4; __slug.step(30); });
  const wpn = await S(() => __slug.P().weapon); wpn === 'H' ? ok('ambil Heavy Machine Gun') : fail('senjata ' + wpn);
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/play2_${W}.png` });
  // tank
  await S(() => { __slug.warp(8.5); __slug.P().y = 0; __slug.P().onGround = true; __slug.step(2); __slug.input.slug = 1; __slug.step(2); __slug.input.slug = 0; });
  (await S(() => __slug.P().inTank)) ? ok('masuk tank') : fail('tidak masuk tank');
  await S(() => { __slug.input.right = 1; __slug.input.fire = 1; __slug.step(30); __slug.input.bomb = 1; __slug.step(3); __slug.input.bomb = 0; __slug.step(60); __slug.input.fire = 0; __slug.input.right = 0; });
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/tank_${W}.png` });
  // granat spesial & special
  await S(() => { __slug.input.slug = 1; __slug.step(2); __slug.input.slug = 0; __slug.step(30); __slug.input.special = 1; __slug.step(2); __slug.input.special = 0; __slug.step(40); });
  (await S(() => __slug.P().sp)) === 2 ? ok('jurus spesial terpakai') : fail('special charge salah');
  // mini-boss: warp ke arena, tembak sampai mati
  await S(() => { __slug.warp(44); __slug.P().y = 0; __slug.P().onGround = true; __slug.P().weapon = 'H'; __slug.P().ammo.H = 999; __slug.input.right = 1; __slug.step(70); __slug.input.right = 0; });
  const px = await S(() => __slug.P().x); Math.abs(px - 50.5) < 2 ? ok('berdiri di bawah mini-boss x=' + px.toFixed(1)) : fail('posisi sebelum mini-boss ' + px.toFixed(1));
  await S(() => { __slug.input.up = 1; __slug.input.fire = 1; __slug.step(500); __slug.input.fire = 0; __slug.input.up = 0; });
  let mini = await S(() => __slug.enemies().find(e => e.isMiniBoss));
  (!mini || mini.dead) ? ok('mini-boss kalah') : fail('mini-boss masih hidup hp ' + mini.hp);
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/mini_${W}.png` });
  await S(() => { __slug.step(200); __slug.warp(55); __slug.input.right = 1; __slug.step(120); __slug.input.right = 0; });
  st = await S(() => __slug.state()); st === 'clear' ? ok('misi 1 selesai (clear)') : fail('state setelah finish: ' + st + ' x=' + (await S(() => __slug.P().x)));
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/clear_${W}.png` });
  // misi 2 dan 3
  await S(() => __slug.next()); await p.waitForTimeout(300);
  (await S(() => __slug.mission())) === 1 ? ok('misi 2 dimuat') : fail('misi 2 tidak dimuat');
  await S(() => { __slug.P().invuln = 1e9; __slug.step(30); });
  await S(() => { for (const e of __slug.enemies()) e.hp = 0; __slug.input.fire = 1; __slug.step(5); __slug.input.fire = 0; });
  await S(() => { __slug.warp(50); __slug.P().weapon = 'H'; __slug.P().ammo.H = 999; __slug.input.up = 1; __slug.input.fire = 1; __slug.step(500); __slug.input.fire = 0; __slug.input.up = 0; });
  await S(() => { __slug.step(200); __slug.warp(58); __slug.input.right = 1; __slug.step(120); __slug.input.right = 0; });
  st = await S(() => __slug.state()); st === 'clear' ? ok('misi 2 selesai') : fail('misi 2 state ' + st);
  await S(() => __slug.next()); await p.waitForTimeout(300);
  (await S(() => __slug.mission())) === 2 ? ok('misi 3 dimuat') : fail('misi 3 tidak dimuat');
  await S(() => { __slug.P().invuln = 1e9; __slug.P().weapon = 'R'; __slug.P().ammo.R = 999; __slug.step(10); });
  // bos
  await S(() => { __slug.warp(57); __slug.input.right = 1; __slug.step(90); __slug.input.right = 0; });
  (await S(() => __slug.boss()?.active)) ? ok('bos aktif') : fail('bos tidak aktif');
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/boss_${W}.png` });
  await S(() => { __slug.input.fire = 1; __slug.step(900); __slug.input.fire = 0; });
  const bhp = await S(() => __slug.boss().hp); bhp <= 0 ? ok('bos kalah') : fail('bos hp ' + bhp);
  await S(() => __slug.step(130));
  st = await S(() => __slug.state()); st === 'victory' ? ok('victory') : fail('state ' + st);
  await p.waitForTimeout(400); await p.screenshot({ path: `${OUT}/victory_${W}.png` });
  // performa
  const info = await S(() => new Promise(r => requestAnimationFrame(() => setTimeout(() => r({ calls: __slug.renderer.info.render.calls, tri: __slug.renderer.info.render.triangles, parts: __slug.fx.count() }), 0))));
  console.log('render', JSON.stringify(info));
  info.calls > 0 && info.calls < 400 ? ok('draw calls ' + info.calls) : fail('draw calls ' + info.calls);
  // game over
  await S(() => { __slug.cont(); });
  await p.waitForTimeout(300);
  await S(() => { __slug.P().invuln = 0; __slug.P().hp = 1; __slug.warp(16); __slug.step(600); });
  st = await S(() => __slug.state()); st === 'over' ? ok('game over') : fail('tidak game over: ' + st);
  await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/over_${W}.png` });
  if (errs.length) fail(errs.join('\n')); else ok('tanpa error JS');
  console.log(failed ? `SELESAI: ${failed} gagal` : 'SELESAI: semua OK');
  await b.close();
})();
