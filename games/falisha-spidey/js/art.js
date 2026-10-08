/* Falisha Spidey – gambar karakter (wajah foto + kostum pixel-art), musuh, latar & efek */
const Art = (() => {
  const faces = {};
  for (const k in (window.FACES || {})) { const im = new Image(); im.src = 'data:image/png;base64,' + window.FACES[k]; faces[k] = im; }
  const ok = im => im && im.complete && im.naturalWidth > 0;

  const HEROES = {
    falisha: { name: 'FALISHA', title: 'Spidey-Kilat', main: '#e0262f', alt: '#2456d8', hood: '#c81d27', line: '#7a0d14', scale: 1 },
    pupu:    { name: 'IBU PUPU', title: 'Ghost-Spider Pink', main: '#f4f2fb', alt: '#ff4fa3', hood: '#ffffff', line: '#c2367d', scale: 1.05 },
    baymax:  { name: 'BAYMAX', title: 'Spin Robot', main: '#1c1c26', alt: '#e3262d', hood: '#22222c', line: '#e3262d', scale: 1.15 }
  };

  function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h); }
  function face(c, id, cx, cy, w, h) {
    const im = faces[id];
    if (ok(im)) c.drawImage(im, cx - w / 2, cy - h / 2, w, h);
    else { c.fillStyle = '#f1c27d'; c.beginPath(); c.ellipse(cx, cy, w / 2, h / 2, 0, 0, 7); c.fill(); }
  }
  function spiderMark(c, x, y, s, col) {
    c.fillStyle = col; c.fillRect(x - s * 0.18, y - s * 0.35, s * 0.36, s * 0.7);
    c.fillRect(x - s * 0.12, y - s * 0.55, s * 0.24, s * 0.22);
    c.strokeStyle = col; c.lineWidth = Math.max(1, s * 0.1); c.beginPath();
    for (const sx of [-1, 1]) for (const k of [-0.3, 0, 0.3]) { c.moveTo(x, y + k * s * 0.5); c.lineTo(x + sx * s * 0.55, y + k * s * 0.9 - s * 0.1); }
    c.stroke();
  }
  function hood(c, cx, cy, w, h, col, line) {
    c.fillStyle = col; c.beginPath(); c.ellipse(cx, cy, w / 2 + 6, h / 2 + 6, 0, 0, 7); c.fill();
    c.strokeStyle = line; c.lineWidth = 1.2; c.globalAlpha = 0.7; c.beginPath();
    for (let a = 0; a < 7; a++) { const an = -Math.PI + a * Math.PI / 6; c.moveTo(cx, cy); c.lineTo(cx + Math.cos(an) * (w / 2 + 6), cy + Math.sin(an) * (h / 2 + 6)); }
    c.stroke(); c.globalAlpha = 1;
    // "mata" topeng laba-laba di dahi
    c.fillStyle = '#fff'; c.strokeStyle = '#111'; c.lineWidth = 1.5;
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(cx + s * w * 0.26, cy - h / 2 - 1, 6, 4, s * 0.35, 0, 7); c.fill(); c.stroke(); }
  }

  /* x = tengah, y = kaki. pose: idle|run|jump|swing|shoot|hurt|down */
  function hero(c, id, x, y, face_, pose, t, sc = 1) {
    const H = HEROES[id], s = H.scale * sc;
    c.save(); c.translate(x, y); c.scale(face_ * s, s);
    const run = pose === 'run' ? Math.sin(t * 16) : 0;
    const air = pose === 'jump' || pose === 'swing';
    // kaki
    c.fillStyle = H.alt;
    const l1 = air ? -5 : run * 6, l2 = air ? 4 : -run * 6;
    rr(c, -9 + l1 * 0.4, -16, 7, 16, 2); c.fill();
    rr(c, 2 + l2 * 0.4, -16, 7, 16, 2); c.fill();
    c.fillStyle = H.main; c.fillRect(-10 + l1 * 0.4, -3, 9, 4); c.fillRect(1 + l2 * 0.4, -3, 9, 4);
    // badan
    c.fillStyle = H.main; rr(c, -11, -34, 22, 20, 5); c.fill();
    c.fillStyle = H.alt; c.fillRect(-11, -20, 22, 5);
    spiderMark(c, 0, -26, 10, id === 'pupu' ? '#ff4fa3' : (id === 'baymax' ? '#e3262d' : '#111'));
    // lengan
    c.strokeStyle = H.main; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
    if (pose === 'shoot') { c.moveTo(6, -30); c.lineTo(20, -30); c.moveTo(-6, -30); c.lineTo(-12, -20 + run * 2); }
    else if (pose === 'swing') { c.moveTo(6, -31); c.lineTo(12, -50); c.moveTo(-6, -30); c.lineTo(-14, -24); }
    else if (pose === 'hurt' || pose === 'down') { c.moveTo(6, -30); c.lineTo(16, -42); c.moveTo(-6, -30); c.lineTo(-16, -42); }
    else { c.moveTo(6, -30); c.lineTo(12 - run * 4, -18); c.moveTo(-6, -30); c.lineTo(-12 + run * 4, -18); }
    c.stroke();
    if (pose === 'shoot') { c.fillStyle = '#fff'; c.beginPath(); c.arc(23, -30, 3, 0, 7); c.fill(); }
    // kepala: tudung kostum + wajah foto (wajah tidak dibalik supaya tetap natural)
    c.scale(face_, 1);
    const fw = 34, fh = 40, fy = -34 - fh / 2 + 4 + (pose === 'run' ? Math.abs(run) * -1.5 : 0);
    hood(c, 0, fy, fw, fh, H.hood, H.line);
    face(c, id, 0, fy, fw, fh);
    if (pose === 'down') { c.fillStyle = '#ffe14d'; for (let i = 0; i < 3; i++) { const a = t * 4 + i * 2.1; c.fillText('★', Math.cos(a) * 18 - 4, fy - 26 + Math.sin(a) * 5); } }
    c.restore();
  }

  /* Bos Arsyad "Goblin Kacamata" di atas hoverboard sedotan */
  function arsyad(c, x, y, face_, t, hurt) {
    c.save(); c.translate(x, y); c.scale(face_ * 1.6, 1.6);
    // hoverboard
    c.fillStyle = '#9b5cff'; rr(c, -26, -6, 52, 8, 4); c.fill();
    c.fillStyle = '#d6b8ff'; c.fillRect(-22, -5, 44, 2);
    c.fillStyle = Math.sin(t * 30) > 0 ? '#ffd23f' : '#ff7a2f';
    c.beginPath(); c.moveTo(-26, -3); c.lineTo(-38 - Math.random() * 6, -1); c.lineTo(-26, 1); c.fill();
    // jubah goblin
    c.fillStyle = '#2f9e44'; c.beginPath(); c.moveTo(-10, -36); c.lineTo(-22 + Math.sin(t * 8) * 3, -6); c.lineTo(10, -8); c.fill();
    // badan piyama snoopy
    c.fillStyle = '#efe6d2'; rr(c, -10, -36, 20, 24, 5); c.fill();
    c.fillStyle = '#3c6fd8'; c.fillRect(-10, -16, 20, 2);
    c.fillStyle = '#222'; for (const [a, b] of [[-5, -30], [4, -26], [-3, -21], [5, -33]]) { c.beginPath(); c.arc(a, b, 1.6, 0, 7); c.fill(); }
    c.fillStyle = '#efe6d2'; c.fillRect(-8, -12, 6, 7); c.fillRect(2, -12, 6, 7);
    // tangan pegang bom permen
    c.strokeStyle = '#efe6d2'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(7, -30); c.lineTo(17, -38 + Math.sin(t * 6) * 3); c.stroke();
    c.fillStyle = '#ff5fa8'; c.beginPath(); c.arc(19, -40 + Math.sin(t * 6) * 3, 4, 0, 7); c.fill();
    c.scale(face_, 1);
    c.fillStyle = '#1e7a35'; c.beginPath(); c.moveTo(-14, -52); c.lineTo(-20, -74); c.lineTo(-6, -64); c.fill(); c.beginPath(); c.moveTo(14, -52); c.lineTo(20, -74); c.lineTo(6, -64); c.fill();
    face(c, 'arsyad', 0, -54, 32, 37);
    if (hurt) { c.globalAlpha = 0.5; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -40, 26, 40, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
    c.restore();
  }

  /* Bos Babah Nono "Badak Peci" */
  function nono(c, x, y, face_, t, mode, hurt) {
    c.save(); c.translate(x, y); c.scale(face_ * 1.9, 1.9);
    const run = mode === 'charge' ? Math.sin(t * 22) : Math.sin(t * 4) * 0.3;
    c.fillStyle = '#5b6170';
    rr(c, -14 + run * 3, -16, 11, 16, 3); c.fill(); rr(c, 3 - run * 3, -16, 11, 16, 3); c.fill();
    // badan baju garis hijau
    c.fillStyle = '#4d5b37'; rr(c, -18, -44, 36, 30, 8); c.fill();
    c.fillStyle = '#f3f3f3'; for (let i = 0; i < 4; i++) c.fillRect(-18, -38 + i * 7, 36, 2);
    // baju zirah badak + cula
    c.fillStyle = '#8d93a3'; rr(c, -22, -46, 14, 12, 5); c.fill(); rr(c, 8, -46, 14, 12, 5); c.fill();
    c.fillStyle = '#d9d2b6'; c.beginPath(); c.moveTo(16, -30); c.lineTo(34, -40); c.lineTo(18, -22); c.fill();
    c.strokeStyle = '#8d93a3'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath();
    if (mode === 'charge') { c.moveTo(12, -36); c.lineTo(26, -26); } else { c.moveTo(14, -36); c.lineTo(20, -20 + run * 4); }
    c.moveTo(-14, -36); c.lineTo(-20, -20 - run * 4); c.stroke();
    c.scale(face_, 1);
    face(c, 'nono', 0, -62, 30, 36);
    if (mode === 'dizzy') { c.fillStyle = '#ffe14d'; c.font = '9px sans-serif'; for (let i = 0; i < 3; i++) { const a = t * 5 + i * 2.1; c.fillText('★', Math.cos(a) * 16 - 4, -84 + Math.sin(a) * 4); } }
    if (hurt) { c.globalAlpha = 0.5; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -44, 30, 44, 0, 0, 7); c.fill(); c.globalAlpha = 1; }
    c.restore();
  }

  function bot(c, x, y, t, face_) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#6c7a89'; rr(c, -14, -28, 28, 22, 8); c.fill();
    c.fillStyle = '#2c3440'; c.fillRect(-10, -24, 20, 9);
    c.fillStyle = Math.sin(t * 8) > 0 ? '#ff3b3b' : '#ff8a3b'; c.fillRect(face_ > 0 ? 1 : -7, -22, 6, 5);
    c.fillStyle = '#444'; const k = Math.sin(t * 14) * 3;
    c.beginPath(); c.arc(-7, -4, 5 + k * 0.1, 0, 7); c.arc(7, -4, 5, 0, 7); c.fill();
    c.strokeStyle = '#6c7a89'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, -28); c.lineTo(0, -36); c.stroke();
    c.fillStyle = '#ffd23f'; c.beginPath(); c.arc(0, -37, 3, 0, 7); c.fill();
    c.restore();
  }
  function drone(c, x, y, t) {
    c.save(); c.translate(x, y);
    c.fillStyle = '#8a4fff'; c.beginPath(); c.ellipse(0, 0, 16, 10, 0, 0, 7); c.fill();
    c.fillStyle = '#ff3b3b'; c.beginPath(); c.arc(0, 2, 4, 0, 7); c.fill();
    c.strokeStyle = '#ddd'; c.lineWidth = 2; const w = Math.abs(Math.sin(t * 40)) * 14 + 4;
    c.beginPath(); c.moveTo(-w, -12); c.lineTo(w, -12); c.moveTo(0, -10); c.lineTo(0, -12); c.stroke();
    c.restore();
  }
  function cocoon(c, x, y, w, h) {
    c.save(); c.fillStyle = '#f4f4f4'; c.strokeStyle = '#9aa'; c.lineWidth = 1.5;
    c.beginPath(); c.ellipse(x, y - h / 2, w / 2, h / 2, 0, 0, 7); c.fill(); c.stroke();
    c.beginPath(); for (let i = 1; i < 5; i++) { const yy = y - h + i * h / 5; c.moveTo(x - w / 2 + 2, yy - 3); c.lineTo(x + w / 2 - 2, yy + 3); } c.stroke();
    c.restore();
  }
  function civilian(c, x, y, kind, t, saved) {
    c.save(); c.translate(x, y);
    if (kind === 'cat') {
      c.fillStyle = '#f39c3d'; rr(c, -12, -14, 24, 12, 6); c.fill();
      c.beginPath(); c.arc(12, -16, 8, 0, 7); c.fill();
      c.beginPath(); c.moveTo(6, -21); c.lineTo(8, -28); c.lineTo(12, -22); c.moveTo(13, -22); c.lineTo(17, -28); c.lineTo(18, -20); c.fill();
      c.strokeStyle = '#f39c3d'; c.lineWidth = 3; c.beginPath(); c.moveTo(-12, -10); c.quadraticCurveTo(-22, -20 + Math.sin(t * 5) * 4, -18, -28); c.stroke();
      c.fillStyle = '#000'; c.fillRect(14, -18, 2, 2);
    } else {
      c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(6, -26); c.lineTo(10, -52 + Math.sin(t * 3) * 2); c.stroke();
      c.fillStyle = '#ff4f6e'; c.beginPath(); c.ellipse(10, -60 + Math.sin(t * 3) * 2, 8, 10, 0, 0, 7); c.fill();
      c.fillStyle = '#2bb3ff'; rr(c, -7, -24, 14, 14, 4); c.fill();
      c.fillStyle = '#333'; c.fillRect(-6, -10, 4, 10); c.fillRect(2, -10, 4, 10);
      c.fillStyle = '#e0ac69'; c.beginPath(); c.arc(0, -30, 8, 0, 7); c.fill();
      c.fillStyle = '#3b2412'; c.beginPath(); c.arc(0, -33, 8, Math.PI, 0); c.fill();
    }
    if (!saved) { c.fillStyle = '#fff'; c.font = '10px "Press Start 2P"'; c.textAlign = 'center'; c.fillText('TOLONG!', 0, kind === 'cat' ? -38 : -76 + Math.sin(t * 6) * 2); }
    c.restore();
  }
  function token(c, x, y, t) {
    const w = Math.abs(Math.cos(t * 3)) * 10 + 2;
    c.fillStyle = '#ffd23f'; c.beginPath(); c.ellipse(x, y, w, 11, 0, 0, 7); c.fill();
    c.strokeStyle = '#b8860b'; c.lineWidth = 2; c.stroke();
    if (w > 6) spiderMark(c, x, y + 1, 9, '#a3121a');
  }
  function anchor(c, x, y, t, near) {
    c.strokeStyle = '#d7dbe8'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y - 600); c.lineTo(x, y - 8); c.stroke();
    c.fillStyle = near ? '#ffe14d' : '#c9d1e6'; c.beginPath(); c.arc(x, y, near ? 8 + Math.sin(t * 10) * 2 : 6, 0, 7); c.fill();
    c.strokeStyle = '#3a3f55'; c.lineWidth = 2; c.stroke();
  }

  /* ---- Latar paralaks (pre-render) ---- */
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function skyline(theme, seed, near) {
    const cv = document.createElement('canvas'); cv.width = 1920; cv.height = 540;
    const c = cv.getContext('2d'), R = mulberry(seed);
    let x = 0;
    while (x < 1920) {
      const w = 70 + R() * (near ? 120 : 90), h = (near ? 160 : 220) + R() * (near ? 170 : 200);
      c.fillStyle = near ? theme.bNear : theme.bFar; c.fillRect(x, 540 - h, w, h);
      if (near && R() < 0.4) { c.fillRect(x + w / 2 - 2, 540 - h - 30, 4, 30); }
      c.fillStyle = theme.win;
      for (let wy = 540 - h + 14; wy < 520; wy += near ? 22 : 16) for (let wx = x + 8; wx < x + w - 10; wx += near ? 18 : 13) if (R() < theme.winP) c.fillRect(wx, wy, near ? 8 : 5, near ? 10 : 7);
      x += w + (near ? 10 + R() * 40 : 2 + R() * 12);
    }
    return cv;
  }
  const THEMES = [
    { sky: ['#4fb3ff', '#bde8ff'], bFar: '#8fb7d9', bNear: '#5a7fb0', win: 'rgba(255,255,255,0.55)', winP: 0.5, ground: '#6b6f7d', top: '#9aa0ad', plat: '#c0563b', sun: '#fff6a8' },
    { sky: ['#5a2d82', '#ff9a5a'], bFar: '#7a4a7a', bNear: '#40284f', win: 'rgba(255,214,120,0.7)', winP: 0.35, ground: '#5a4636', top: '#8a6a4a', plat: '#d07a2a', sun: '#ffcf70', sea: '#2d4f8a' },
    { sky: ['#070b24', '#24306b'], bFar: '#1a2050', bNear: '#10143a', win: 'rgba(255,230,120,0.85)', winP: 0.45, ground: '#2c2f45', top: '#4a4f6e', plat: '#6c3fb0', sun: '#f4f1d0', stars: true }
  ];
  const cache = {};
  function background(c, stage, camX, t) {
    const th = THEMES[stage];
    if (!cache[stage]) cache[stage] = [skyline(th, 11 + stage, false), skyline(th, 77 + stage, true)];
    const g = c.createLinearGradient(0, 0, 0, 540); g.addColorStop(0, th.sky[0]); g.addColorStop(1, th.sky[1]);
    c.fillStyle = g; c.fillRect(0, 0, 960, 540);
    if (th.stars) { c.fillStyle = '#fff'; for (let i = 0; i < 60; i++) { const sx = (i * 157 - camX * 0.02) % 960, sy = (i * 71) % 260; c.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(t + i)); c.fillRect((sx + 960) % 960, sy, 2, 2); } c.globalAlpha = 1; }
    c.fillStyle = th.sun; c.beginPath(); c.arc(780 - camX * 0.01, stage === 1 ? 300 : 90, 46, 0, 7); c.fill();
    if (th.sea) { c.fillStyle = th.sea; c.fillRect(0, 380, 960, 160); }
    for (const [i, f] of [[0, 0.15], [1, 0.4]]) {
      const img = cache[stage][i], off = -((camX * f) % 1920);
      c.drawImage(img, off, i ? 40 : 0); c.drawImage(img, off + 1920, i ? 40 : 0);
    }
  }
  function ground(c, x0, x1, y, stage) {
    const th = THEMES[stage];
    c.fillStyle = th.ground; c.fillRect(x0, y, x1 - x0, 540 - y);
    c.fillStyle = th.top; c.fillRect(x0, y, x1 - x0, 10);
    c.fillStyle = 'rgba(0,0,0,0.18)'; for (let x = x0 + 20; x < x1; x += 60) c.fillRect(x, y + 10, 3, 540 - y);
    c.fillStyle = '#ffd23f'; for (let x = x0 + 10; x < x1 - 30; x += 80) c.fillRect(x, y + 34, 30, 4);
  }
  function platform(c, x, y, w, stage) {
    const th = THEMES[stage];
    c.fillStyle = th.plat; c.fillRect(x, y, w, 14);
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(x, y, w, 3);
    c.fillStyle = 'rgba(0,0,0,0.3)'; for (let i = x + 8; i < x + w - 6; i += 24) c.fillRect(i, y + 6, 12, 3);
    c.fillStyle = '#555'; c.fillRect(x + 8, y + 14, 4, 20); c.fillRect(x + w - 12, y + 14, 4, 20);
  }

  return { HEROES, faces, ok, hero, arsyad, nono, bot, drone, cocoon, civilian, token, anchor, background, ground, platform, spiderMark, face, rr, THEMES };
})();
