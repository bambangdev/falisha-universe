/* Falisha Kart – definisi 4 sirkuit Piala Keluarga + dekorasi */
const TrackDB = (() => {
  const { createRoad } = Mode7;
  const LEN = { S: 40, M: 80, L: 160 };
  const CURVE = { NONE: 0, EASY: 2, MED: 4, HARD: 6 };
  const HILL = { NONE: 0, LOW: 15, MED: 30, HIGH: 55 };

  /* ---------- dekorasi pixel-art (digambar prosedural) ---------- */
  function tree(ctx, x, y, s, c1 = '#2e8b3a', c2 = '#7a4a21') {
    ctx.fillStyle = c2; ctx.fillRect(x - s * 0.07, y - s * 0.45, s * 0.14, s * 0.45);
    ctx.fillStyle = c1;
    ctx.beginPath(); ctx.moveTo(x - s * 0.34, y - s * 0.4); ctx.lineTo(x, y - s * 1.0); ctx.lineTo(x + s * 0.34, y - s * 0.4); ctx.closePath(); ctx.fill();
  }
  function flower(ctx, x, y, s, c = '#ff6b9d') {
    ctx.fillStyle = '#3a9e3f'; ctx.fillRect(x - s * 0.04, y - s * 0.4, s * 0.08, s * 0.4);
    ctx.fillStyle = c;
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(x + Math.cos(a) * s * 0.14, y - s * 0.48 + Math.sin(a) * s * 0.14, s * 0.1, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#ffe55c'; ctx.beginPath(); ctx.arc(x, y - s * 0.48, s * 0.09, 0, 7); ctx.fill();
  }
  function bush(ctx, x, y, s, c = '#3fa34d') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.arc(x - s * 0.2, y - s * 0.15, s * 0.2, 0, 7); ctx.arc(x + s * 0.2, y - s * 0.15, s * 0.2, 0, 7); ctx.arc(x, y - s * 0.28, s * 0.24, 0, 7); ctx.fill();
  }
  function house(ctx, x, y, s, wall = '#ffd9a0', roof = '#d94f3d') {
    ctx.fillStyle = wall; ctx.fillRect(x - s * 0.3, y - s * 0.5, s * 0.6, s * 0.5);
    ctx.fillStyle = roof;
    ctx.beginPath(); ctx.moveTo(x - s * 0.38, y - s * 0.5); ctx.lineTo(x, y - s * 0.85); ctx.lineTo(x + s * 0.38, y - s * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a4a21'; ctx.fillRect(x - s * 0.08, y - s * 0.3, s * 0.16, s * 0.3);
  }
  function piano(ctx, x, y, s) {
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x - s * 0.4, y - s * 0.5, s * 0.8, s * 0.35);
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 7; i++) ctx.fillRect(x - s * 0.36 + i * s * 0.105, y - s * 0.32, s * 0.09, s * 0.17);
    ctx.fillStyle = '#1a1a1a';
    for (let i = 0; i < 5; i++) ctx.fillRect(x - s * 0.3 + i * s * 0.105, y - s * 0.32, s * 0.06, s * 0.1);
  }
  function book(ctx, x, y, s, c = '#3388ff') {
    ctx.fillStyle = c; ctx.fillRect(x - s * 0.25, y - s * 0.35, s * 0.5, s * 0.35);
    ctx.fillStyle = '#fff'; ctx.fillRect(x - s * 0.25, y - s * 0.35, s * 0.06, s * 0.35);
    ctx.fillStyle = '#ffffffaa';
    for (let i = 0; i < 3; i++) ctx.fillRect(x - s * 0.12, y - s * 0.28 + i * s * 0.09, s * 0.3, s * 0.04);
  }
  function lamp(ctx, x, y, s) {
    ctx.fillStyle = '#555'; ctx.fillRect(x - s * 0.05, y - s * 0.7, s * 0.1, s * 0.7);
    ctx.fillStyle = '#ffe55c'; ctx.beginPath(); ctx.arc(x, y - s * 0.78, s * 0.14, 0, 7); ctx.fill();
    ctx.fillStyle = '#ff9d2e'; ctx.beginPath(); ctx.arc(x, y - s * 0.78, s * 0.08, 0, 7); ctx.fill();
  }
  function pillow(ctx, x, y, s, c = '#ffb3d9') {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.roundRect(x - s * 0.35, y - s * 0.3, s * 0.7, s * 0.3, s * 0.12); ctx.fill();
  }
  function note(ctx, x, y, s, c = '#ffe55c') {
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.ellipse(x, y - s * 0.12, s * 0.12, s * 0.09, -0.3, 0, 7); ctx.fill();
    ctx.fillRect(x + s * 0.08, y - s * 0.5, s * 0.05, s * 0.42);
  }

  /* ---------- background parallax generik ---------- */
  function bgDecor(hill1, hill2, sunC) {
    return (ctx, W, H, position) => {
      const off = (position * 0.00004) % 1;
      // matahari
      ctx.fillStyle = sunC; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.12, H * 0.05, 0, 7); ctx.fill();
      // awan
      ctx.fillStyle = '#ffffffcc';
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 0.27 + 0.1 - off * 0.15) % 1 + 1) % 1 * W;
        ctx.beginPath(); ctx.ellipse(cx, H * (0.08 + i * 0.04), W * 0.05, H * 0.025, 0, 0, 7); ctx.fill();
      }
      // bukit jauh & dekat
      for (const [col, base, amp, ph] of [[hill1, 0.42, 0.06, 0], [hill2, 0.46, 0.05, 2]]) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H * 0.52);
        for (let x = 0; x <= W; x += 20) {
          const y = H * (base + amp * Math.sin(x / W * Math.PI * 4 + ph + off * 6));
          ctx.lineTo(x, y);
        }
        ctx.lineTo(W, H * 0.52); ctx.closePath(); ctx.fill();
      }
    };
  }

  /* ---------- builder ---------- */
  function build(def) {
    const road = createRoad();
    for (const s of def.sections) road.addRoad(s[0], s[1], s[2], s[3], s[4]);
    // dekorasi pinggir jalan
    const n = road.segments.length;
    for (let i = 20; i < n; i += def.decorGap) {
      const fn = def.decors[(i / def.decorGap | 0) % def.decors.length];
      const side = (i / def.decorGap | 0) % 2 === 0 ? -1 : 1;
      road.addSprite(i, { x: side * (1.6 + Math.random() * 1.6), w: 900 + Math.random() * 900, draw: (ctx, x, y, w) => fn(ctx, x, y, w) });
    }
    // kotak item tiap ~110 segmen
    const boxes = [];
    for (let i = 60; i < n; i += 110) {
      for (const xo of [-0.55, 0, 0.55]) boxes.push({ seg: i, x: xo, taken: false, timer: 0 });
    }
    return { name: def.name, desc: def.desc, road, trackLength: road.trackLength, theme: def.theme, boxes, laps: 3 };
  }

  const TRACKS = [
    build({
      name: 'Taman Rumah Circuit', desc: 'Balapan santai di taman — cocok buat pemanasan! 🌼',
      sections: [
        [LEN.S, LEN.M, LEN.S, CURVE.NONE, HILL.NONE],
        [LEN.S, LEN.S, LEN.S, CURVE.EASY, HILL.LOW],
        [LEN.S, LEN.M, LEN.S, CURVE.NONE, HILL.NONE],
        [LEN.S, LEN.S, LEN.S, -CURVE.EASY, HILL.NONE],
        [LEN.M, LEN.M, LEN.M, CURVE.EASY, HILL.LOW],
        [LEN.S, LEN.S, LEN.S, CURVE.NONE, HILL.NONE],
      ],
      decorGap: 45,
      decors: [(c, x, y, s) => tree(c, x, y, s), (c, x, y, s) => flower(c, x, y, s * 0.7), (c, x, y, s) => bush(c, x, y, s * 0.8), (c, x, y, s) => house(c, x, y, s)],
      theme: {
        sky: ['#4aa8ff', '#c4ecff'],
        light: { road: '#6e7280', grass: '#5cbb4e', rumble: '#e63946' },
        dark: { road: '#646873', grass: '#52a847', rumble: '#f1fa8c' },
        lane: '#f8f8f8', decor: bgDecor('#7ecb6f', '#5aa854', '#ffe55c'),
      },
    }),
    build({
      name: 'Dapur GP', desc: 'Ngebut di atas meja dapur — awas tumpahan minyak! 🍳',
      sections: [
        [LEN.S, LEN.S, LEN.S, CURVE.MED, HILL.NONE],
        [LEN.S, LEN.M, LEN.S, CURVE.NONE, HILL.LOW],
        [LEN.S, LEN.S, LEN.S, -CURVE.MED, HILL.NONE],
        [LEN.M, LEN.S, LEN.M, CURVE.EASY, HILL.MED],
        [LEN.S, LEN.S, LEN.S, CURVE.MED, HILL.NONE],
        [LEN.S, LEN.M, LEN.S, CURVE.NONE, HILL.NONE],
      ],
      decorGap: 50,
      decors: [(c, x, y, s) => house(c, x, y, s, '#e8b04b', '#a85f2e'), (c, x, y, s) => lamp(c, x, y, s), (c, x, y, s) => book(c, x, y, s * 0.9, '#ff9d2e')],
      theme: {
        sky: ['#ff9d5c', '#ffe3b3'],
        light: { road: '#cfc3a8', grass: '#e89b4b', rumble: '#a85f2e' },
        dark: { road: '#c2b498', grass: '#dd8f42', rumble: '#f5f0e1' },
        lane: '#7a4a21', decor: bgDecor('#d98a3d', '#b96f2e', '#fff3c4'),
      },
    }),
    build({
      name: 'Kamar Tidur Rally', desc: 'Rally di kamar — bantal jadi rintangan empuk! 🛏️',
      sections: [
        [LEN.S, LEN.M, LEN.S, -CURVE.MED, HILL.LOW],
        [LEN.S, LEN.S, LEN.S, CURVE.HARD, HILL.NONE],
        [LEN.M, LEN.S, LEN.M, CURVE.NONE, HILL.MED],
        [LEN.S, LEN.S, LEN.S, -CURVE.EASY, HILL.NONE],
        [LEN.S, LEN.M, LEN.S, CURVE.MED, HILL.LOW],
        [LEN.S, LEN.S, LEN.S, CURVE.NONE, HILL.NONE],
      ],
      decorGap: 48,
      decors: [(c, x, y, s) => pillow(c, x, y, s, '#ffb3d9'), (c, x, y, s) => pillow(c, x, y, s, '#9fd8ff'), (c, x, y, s) => lamp(c, x, y, s), (c, x, y, s) => book(c, x, y, s * 0.9)],
      theme: {
        sky: ['#3b2d6e', '#8a6fbf'],
        light: { road: '#8a7bb8', grass: '#5c4d8f', rumble: '#ffb3d9' },
        dark: { road: '#7e6fae', grass: '#544584', rumble: '#f1fa8c' },
        lane: '#ffe55c', decor: bgDecor('#4a3d7a', '#3a2f63', '#fff3c4'),
      },
    }),
    build({
      name: 'Ruang Piano Sprint', desc: 'Sprint di ruang piano — nada-nada beterbangan! 🎹',
      sections: [
        [LEN.S, LEN.S, LEN.S, CURVE.HARD, HILL.MED],
        [LEN.S, LEN.M, LEN.S, -CURVE.HARD, HILL.NONE],
        [LEN.M, LEN.S, LEN.M, CURVE.MED, HILL.HIGH],
        [LEN.S, LEN.S, LEN.S, CURVE.EASY, HILL.NONE],
        [LEN.S, LEN.M, LEN.S, -CURVE.MED, HILL.MED],
        [LEN.S, LEN.S, LEN.S, CURVE.NONE, HILL.LOW],
      ],
      decorGap: 52,
      decors: [(c, x, y, s) => piano(c, x, y, s), (c, x, y, s) => note(c, x, y, s * 0.8), (c, x, y, s) => note(c, x, y, s * 0.8, '#9fd8ff'), (c, x, y, s) => lamp(c, x, y, s)],
      theme: {
        sky: ['#101030', '#3d3d7a'],
        light: { road: '#3f3f66', grass: '#26264a', rumble: '#ffe55c' },
        dark: { road: '#38385e', grass: '#20203f', rumble: '#ff6b9d' },
        lane: '#9fd8ff', decor: bgDecor('#2c2c55', '#1e1e3d', '#ffe55c'),
      },
    }),
  ];

  return { TRACKS };
})();
