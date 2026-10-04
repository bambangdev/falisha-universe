/* Portal Dunia Falisha – daftar game: cukup tambah satu entri di GAMES */
const GAMES = [
  { id: 'falisha-vs-yanto', title: 'Falisha vs Yanto', href: 'games/falisha-vs-yanto/index.html', cover: 'portal/cover_game1.jpg',
    desc: 'Lari secepat kilat, kumpulkan cincin petir, lalu kalahkan bos Yanto di 3 stage seru!',
    tags: ['Platformer', '3 Stage + Bos', 'Powerup'] },
  { id: 'warisan-combat', title: 'Warisan Combat', href: 'games/warisan-combat/index.html', cover: 'portal/cover_game2.jpg',
    desc: 'Game fighting keluarga! Pilih jagoan, keluarkan jurus dan ultimate epic. Mode Arcade vs CPU.',
    tags: ['Fighting', 'Arcade vs CPU', 'Ultimate'] },
  { id: 'soon', title: 'Segera Hadir', locked: true, desc: 'Game berikutnya sedang dibuat...', tags: ['???'] }
];
const grid = document.getElementById('grid');
GAMES.forEach(g => {
  const a = document.createElement(g.locked ? 'div' : 'a');
  a.className = 'card' + (g.locked ? ' locked' : '');
  if (!g.locked) a.href = g.href;
  a.innerHTML = (g.locked ? '<div class="lockcover">🔒</div>' : `<img class="cover" src="${g.cover}" alt="Sampul ${g.title}" loading="lazy">`) +
    '<div class="shine"></div>' + `<span class="play">${g.locked ? 'SOON' : '▶ MAIN'}</span>` +
    `<div class="info"><h2>${g.title}</h2><p>${g.desc}</p><div class="chips">${g.tags.map(t => `<span class="chip">${t}</span>`).join('')}</div></div>`;
  grid.appendChild(a);
});
document.getElementById('btn-full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
};
/* bintang berkelap-kelip + kilat */
const cv = document.getElementById('stars'), c = cv.getContext('2d');
let w, h, stars = [];
function resize() { w = cv.width = innerWidth; h = cv.height = innerHeight; stars = Array.from({ length: 90 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: 1 + Math.random() * 2.5, p: Math.random() * 6 })); }
addEventListener('resize', resize); resize();
let t = 0;
(function loop() {
  t++; c.clearRect(0, 0, w, h);
  for (const s of stars) { c.globalAlpha = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.02 + s.p)); c.fillStyle = s.p > 3 ? '#ffe55c' : '#fff'; c.fillRect(s.x, (s.y + t * 0.1 * s.s) % h, s.s, s.s); }
  c.globalAlpha = 1; requestAnimationFrame(loop);
})();
