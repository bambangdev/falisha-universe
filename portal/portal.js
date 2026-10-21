/* Portal Dunia Falisha – home ala konsol (PS5 / Switch). Daftar game: cukup tambah satu entri di GAMES */
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
  { id: 'falisha-surfers', title: 'Falisha Surfers', href: 'games/falisha-surfers/', cover: 'portal/cover_game9.jpg',
    desc: 'Remake Subway Surfers 3D! Lari di rel KRL, lompat, guling, naik atap kereta, kumpulkan koin, pakai jetpack & hoverboard, dan kabur dari Pak Satpam!',
    tags: ['Endless Runner', '3D', '5 Karakter'] },
  { id: 'falisha-jetpack', title: 'Falisha Jetpack', href: 'games/falisha-jetpack/', cover: 'portal/cover_game10.jpg',
    desc: 'Remake Jetpack Joyride di luar angkasa! Tahan untuk terbang, hindari zapper listrik, roket, laser & asteroid, kumpulkan koin bintang dan power-up.',
    tags: ['Jetpack', 'Luar Angkasa', 'Endless'] },
  { id: 'soon', title: 'Segera Hadir', locked: true, desc: 'Game berikutnya sedang dibuat...', tags: ['???'] }
];

const $ = id => document.getElementById(id);
const rail = $('rail'), hero = $('hero'), flash = $('flash');
const bgs = [$('bg-a'), $('bg-b')]; let bgIdx = 0;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LAST_KEY = 'portal_last';
let cur = -1, launching = false, hoverLock = 0;

/* ---- ubin ---- */
const tiles = GAMES.map((g, i) => {
  const el = document.createElement(g.locked ? 'div' : 'a');
  el.className = 'tile' + (g.locked ? ' locked' : '');
  el.setAttribute('role', 'option'); el.dataset.i = i;
  if (!g.locked) el.href = g.href; else el.setAttribute('aria-disabled', 'true');
  el.innerHTML = (g.locked ? '<div class="lockcover">🔒</div>' : `<img src="${g.cover}" alt="" loading="${i < 6 ? 'eager' : 'lazy'}" draggable="false">`) +
    `<span class="label">${g.title}</span>`;
  el.addEventListener('click', e => { e.preventDefault(); if (i === cur) launch(); else select(i); });
  el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && i !== cur && performance.now() > hoverLock) select(i); });
  rail.appendChild(el);
  return el;
});

/* ---- suara (Chip dari shared/audio.js, mute tersimpan bersama game) ---- */
const snd = {
  tick() { try { window.Chip?.beep(1046, 0.035, 'square', 0.025); } catch (e) {} },
  ok() { try { window.Chip?.beep(660, 0.07, 'square', 0.05); setTimeout(() => window.Chip?.beep(990, 0.16, 'square', 0.05), 70); } catch (e) {} },
  deny() { try { window.Chip?.beep(220, 0.12, 'sawtooth', 0.04, -80); } catch (e) {} }
};
const btnSnd = $('btn-snd');
function renderSnd() { const m = !!window.Chip?.isMuted(); btnSnd.textContent = m ? '🔇' : '🔊'; btnSnd.classList.toggle('off', m); btnSnd.setAttribute('aria-pressed', String(!m)); }
btnSnd.onclick = () => { if (!window.Chip) return; Chip.setMuted(!Chip.isMuted()); renderSnd(); if (!Chip.isMuted()) snd.tick(); };
renderSnd();

/* ---- pilih game ---- */
function setBg(src) {
  const next = bgs[bgIdx ^ 1], prev = bgs[bgIdx];
  next.style.backgroundImage = src ? `url("${src}")` : 'none';
  next.classList.add('show'); prev.classList.remove('show'); bgIdx ^= 1;
}
function select(i, { silent = false } = {}) {
  i = (i + GAMES.length) % GAMES.length;
  if (i === cur) return;
  cur = i; const g = GAMES[i]; hoverLock = performance.now() + 450;
  tiles.forEach((t, k) => { t.classList.toggle('sel', k === i); t.setAttribute('aria-selected', String(k === i)); });
  rail.setAttribute('aria-activedescendant', tiles[i].id || (tiles[i].id = 'tile-' + g.id));
  tiles[i].scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
  $('hero-count').textContent = `${i + 1} / ${GAMES.length}`;
  $('hero-title').textContent = g.title;
  $('hero-desc').textContent = g.desc;
  $('hero-tags').innerHTML = g.tags.map(t => `<span class="chip">${t}</span>`).join('');
  const play = $('hero-play');
  play.href = g.locked ? '#' : g.href; play.innerHTML = g.locked ? '🔒 SEGERA' : '<span class="playicon">▶</span> MAIN';
  hero.classList.toggle('locked', !!g.locked);
  for (const el of [$('hero-title'), $('hero-desc'), $('hero-tags')]) { el.classList.remove('anim'); void el.offsetWidth; el.classList.add('anim'); }
  setBg(g.locked ? '' : g.cover);
  try { localStorage.setItem(LAST_KEY, g.id); } catch (e) {}
  if (!silent) snd.tick();
}
function launch() {
  const g = GAMES[cur];
  if (!g || launching) return;
  if (g.locked) { snd.deny(); return; }
  launching = true; snd.ok();
  if (reduced) { location.href = g.href; return; }
  document.body.classList.add('launching');
  setTimeout(() => { location.href = g.href; }, 480);
}
$('hero-play').addEventListener('click', e => { e.preventDefault(); launch(); });

/* ---- navigasi: keyboard ---- */
addEventListener('keydown', e => {
  if (e.target.tagName === 'BUTTON' && (e.key === 'Enter' || e.key === ' ')) return;
  const k = e.key;
  if (k === 'ArrowRight' || k === 'd' || k === 'D') { select(cur + 1); e.preventDefault(); }
  else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { select(cur - 1); e.preventDefault(); }
  else if (k === 'Home') { select(0); e.preventDefault(); }
  else if (k === 'End') { select(GAMES.length - 1); e.preventDefault(); }
  else if (k === 'Enter' || k === ' ') { launch(); e.preventDefault(); }
  else if (k === 'f' || k === 'F') toggleFull();
  else if (k === 'm' || k === 'M') btnSnd.click();
});
/* roda mouse / trackpad di mana pun → geser pilihan */
let wheelLock = 0;
addEventListener('wheel', e => {
  const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
  if (Math.abs(d) < 8 || performance.now() < wheelLock) return;
  wheelLock = performance.now() + 180; select(cur + (d > 0 ? 1 : -1));
  e.preventDefault();
}, { passive: false });
/* sentuh: geser rel secara alami, lalu ubin terdekat di tengah jadi terpilih */
let scrollT = 0, touchUntil = 0;
rail.addEventListener('touchstart', () => { touchUntil = Infinity; }, { passive: true });
rail.addEventListener('touchend', () => { touchUntil = performance.now() + 700; }, { passive: true });
rail.addEventListener('scroll', () => {
  if (performance.now() > touchUntil) return;
  clearTimeout(scrollT);
  scrollT = setTimeout(() => {
    const r = rail.getBoundingClientRect(), mid = r.left + r.width / 2;
    let best = cur, bd = Infinity;
    tiles.forEach((t, k) => { const b = t.getBoundingClientRect(); const d = Math.abs(b.left + b.width / 2 - mid); if (d < bd) { bd = d; best = k; } });
    if (best !== cur) select(best);
  }, 90);
}, { passive: true });

/* ---- navigasi: gamepad (D-pad / stik kiri, tombol A) ---- */
const pad = { lastX: 0, lastA: false, next: 0 };
function pollPad() {
  const gps = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of gps) {
    if (!gp) continue;
    const ax = gp.axes[0] || 0, b = gp.buttons;
    const x = ax > .5 || b[15]?.pressed ? 1 : ax < -.5 || b[14]?.pressed ? -1 : 0;
    const now = performance.now();
    if (x && (x !== pad.lastX || now > pad.next)) { select(cur + x); pad.next = now + (x !== pad.lastX ? 380 : 140); }
    pad.lastX = x;
    const a = !!(b[0]?.pressed || b[9]?.pressed);
    if (a && !pad.lastA) launch();
    pad.lastA = a;
  }
}

/* ---- layar penuh ---- */
function toggleFull() {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape').catch(() => {})).catch(() => {});
}
$('btn-full').onclick = toggleFull;

/* ---- jam ---- */
function clock() { $('clock').textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':'); }
clock(); setInterval(clock, 10000);

/* ---- bintang berkelap-kelip ---- */
const cv = $('stars'), c = cv.getContext('2d');
let w, h, stars = [];
function resize() { w = cv.width = innerWidth; h = cv.height = innerHeight; stars = Array.from({ length: 70 }, () => ({ x: Math.random() * w, y: Math.random() * h, s: 1 + Math.random() * 2, p: Math.random() * 6 })); }
addEventListener('resize', resize); resize();
let t = 0;
(function loop() {
  t++; c.clearRect(0, 0, w, h);
  for (const s of stars) { c.globalAlpha = 0.25 + 0.6 * Math.abs(Math.sin(t * 0.02 + s.p)); c.fillStyle = s.p > 3 ? '#ffe55c' : '#fff'; c.fillRect(s.x, (s.y + t * 0.08 * s.s) % h, s.s, s.s); }
  c.globalAlpha = 1; pollPad(); requestAnimationFrame(loop);
})();

/* ---- mulai: kembali ke game terakhir yang dipilih ---- */
let start = 0;
try { const k = GAMES.findIndex(g => g.id === localStorage.getItem(LAST_KEY)); if (k >= 0) start = k; } catch (e) {}
select(start, { silent: true });
addEventListener('load', () => { tiles[cur]?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' }); });
GAMES.forEach(g => { if (g.cover) { const im = new Image(); im.src = g.cover; } });
