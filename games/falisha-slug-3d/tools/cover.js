/* Potret key-art game (mode ?cover=1) menjadi sampul portal 960x540 sementara, sebelum cover dari Google Flow ada.
   Server: `python3 -m http.server 8765` dari root repo. Jalankan: PW=/opt/node-tools/node_modules/playwright node games/falisha-slug-3d/tools/cover.js */
const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 960, height: 540 }, deviceScaleFactor: 1 });
  await p.goto('http://localhost:8765/games/falisha-slug-3d/?cover=1');
  await p.waitForFunction(() => window.__slug && __slug.state() === 'cover', null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'portal/cover_game11.jpg', type: 'jpeg', quality: 85 });
  console.log('cover -> portal/cover_game11.jpg');
  await b.close();
})();
