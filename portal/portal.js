/* Portal Dunia Falisha – daftar game: cukup tambah satu entri di GAMES */
const GAMES = [
  { id: 'falisha-vs-yanto', title: 'Falisha vs Yanto', href: 'games/falisha-vs-yanto/', cover: 'portal/cover_game1.jpg',
    desc: 'Lari secepat kilat, kumpulkan cincin petir, lalu kalahkan bos Yanto di 3 stage seru!',
    tags: ['Platformer', '3 Stage + Bos', 'Powerup'] },
  { id: 'warisan-combat', title: 'Warisan Combat', href: 'games/warisan-combat/', cover: 'portal/cover_game2.jpg',
    desc: 'Game fighting keluarga! 5 karakter lengkap dengan jurus dan ultimate epic. Mode Arcade vs CPU.',
    tags: ['Fighting', '5 Karakter', 'Arcade vs CPU'] },
  { id: 'falisha-slug', title: 'Falisha Slug', href: 'games/falisha-slug/', cover: 'portal/cover_game3.jpg',
    desc: 'Remake Metal Slug 5 Misi Lengkap! Pijakan platform nyata, kendarai Tank SV-001, sandera Babah Nono, raih Heavy Machine Gun, dan kalahkan Mech Yanto!',
    tags: ['5 Misi', 'Super Tank', 'Metal Slug'] },
  { id: 'falisha-pac', title: 'Falisha Pac', href: 'games/falisha-pac/', cover: 'portal/cover_game4.jpg',
    desc: 'Remake Arcade Pac-Man 4 Labirin Neon! Lahap titik petir waka-waka, ambil Mega Kumon, mangsa 4 hantu keluarga, dan gunakan Flash Dash!',
    tags: ['Pac-Man', '4 Labirin', 'Arcade Neon'] },
  { id: 'falisha-kart', title: 'Falisha Kart', href: 'games/falisha-kart/', cover: 'portal/cover_game5.svg',
    desc: 'Remake Mario Kart ala SNES! Balapan kart Mode 7: 5 pembalap keluarga, 4 sirkuit Piala Keluarga, 7 item keluarga, dan Grand Prix seru!',
    tags: ['Kart Racing', '5 Karakter', 'Grand Prix'] },
  { id: 'falisha-spidey', title: 'Falisha Spidey & Sahabat', href: 'games/falisha-spidey/', cover: 'portal/cover_game6.svg',
    desc: 'Ala Spidey and His Amazing Friends! Ayun jaring keliling kota bersama Ibu Pupu & Baymax, selamatkan warga, dan jaring Goblin Kacamata & Badak Peci!',
    tags: ['Superhero', 'Ayun Jaring', '3 Sahabat'] },
  { id: 'falisha-kart-turbo', title: 'Falisha Kart Turbo', href: 'games/falisha-kart-turbo/', cover: 'portal/cover_game7.jpg',
    desc: 'Balapan kart pseudo-3D ala Mario Kart 64! Tanjakan, terowongan & ramp di 4 sirkuit Piala Nusantara, drift mini-turbo, item keluarga, dan Time Trial dengan ghost.',
    tags: ['Kart Racing', 'Piala Nusantara', 'Time Trial'] },
  { id: 'falisha-sekolah', title: 'Petualangan Falisha di MIMHa', href: 'games/falisha-sekolah/', cover: 'portal/cover_game8.jpg',
    desc: 'Satu hari sekolah di Madrasah Interaktif Miftahul Huda! Wudhu, shalat dhuha, belajar Iqro & berhitung, jajan di kantin, lompat tali, dan bantu teman.',
    tags: ['RPG Sekolah', '7 Mini-game', 'Edukasi'] },
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
