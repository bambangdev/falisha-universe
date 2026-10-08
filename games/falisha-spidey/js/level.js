/* Falisha Spidey – data 3 stage (dibangkitkan dari seed supaya selalu sama) */
const Levels = (() => {
  const GY = 470;          // tinggi tanah
  const ARENA = 960;       // lebar arena bos
  const DEF = [
    { name: 'KOTA SIANG', sub: 'Goblin Kacamata mengacau!', boss: 'arsyad', len: 5600, seed: 3, pitMin: 120, pitMax: 230, bots: 9, drones: 4, music: 0 },
    { name: 'PELABUHAN SENJA', sub: 'Badak Peci menyeruduk!', boss: 'nono', len: 6200, seed: 8, pitMin: 150, pitMax: 290, bots: 10, drones: 7, music: 1 },
    { name: 'ATAP GEDUNG MALAM', sub: 'Duo nakal beraksi!', boss: 'duo', len: 6800, seed: 21, pitMin: 170, pitMax: 330, bots: 12, drones: 9, music: 2 }
  ];
  function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  function build(i) {
    const d = DEF[i], R = mulberry(d.seed), rnd = (a, b) => a + R() * (b - a);
    const L = { ...d, index: i, ground: [], plats: [], anchors: [], enemies: [], civs: [], tokens: [], checkpoints: [0], GY };
    let seg = 0;
    const segs = [];
    // tanah awal aman
    let gx0 = 0, gx1 = 900;
    while (true) {
      segs.push([gx0, gx1]);
      if (gx1 >= d.len) break;
      const pit = rnd(d.pitMin, d.pitMax);
      L.anchors.push({ x: gx1 + pit / 2, y: rnd(110, 140) });   // jangkar pasti ada di atas jurang
      for (let k = 0; k < 4; k++) L.tokens.push({ x: gx1 + pit * (0.2 + k * 0.2), y: GY - 150 - Math.sin((k + 0.5) / 4 * Math.PI) * 60 });
      gx0 = gx1 + pit; gx1 = Math.min(d.len, gx0 + rnd(520, 900));
      if (d.len - gx1 < 300) gx1 = d.len;
    }
    // arena bos: tanah penuh
    segs[segs.length - 1][1] = d.len + ARENA;
    L.ground = segs;
    L.arenaX = d.len;
    for (const [a, b] of segs) {
      seg++;
      if (seg > 1 && seg % 2 === 0 && a < d.len) L.checkpoints.push(a + 40);
      // jangkar biasa
      for (let ax = a + 200; ax < Math.min(b, d.len) - 100; ax += rnd(260, 380)) L.anchors.push({ x: ax, y: rnd(110, 150) });
      // platform
      if (a < d.len) {
        const n = (b - a) > 650 ? 2 : 1;
        for (let k = 0; k < n; k++) {
          const w = rnd(130, 200), px = a + 120 + k * ((b - a) / 2) + rnd(0, 80);
          if (px + w > Math.min(b, d.len) - 40) continue;
          const py = GY - rnd(100, 135);
          L.plats.push({ x: px, y: py, w });
          if (R() < 0.55) L.plats.push({ x: px + w * 0.4, y: py - rnd(100, 125), w: rnd(110, 160) });
          L.tokens.push({ x: px + w / 2 - 20, y: py - 30 }, { x: px + w / 2 + 20, y: py - 30 });
        }
      }
    }
    // musuh: bot di tanah, drone di udara (jauh dari titik awal & arena)
    const groundAt = gx => segs.find(([a, b]) => gx >= a + 60 && gx <= b - 60);
    let tries = 0;
    while (L.enemies.filter(e => e.type === 'bot').length < d.bots && tries++ < 400) {
      const ex = rnd(1000, d.len - 200), s = groundAt(ex);
      if (s) L.enemies.push({ type: 'bot', x: ex, y: GY, min: s[0] + 20, max: Math.min(s[1], d.len) - 20 });
    }
    for (let k = 0; k < d.drones; k++) { const ex = 1300 + (d.len - 1600) * (k + 0.5) / d.drones; L.enemies.push({ type: 'drone', x: ex, y: rnd(190, 290) }); }
    // warga yang perlu ditolong: di platform atau tanah
    const civKinds = ['cat', 'kid', 'cat'];
    for (let k = 0; k < 3; k++) {
      const target = d.len * (0.25 + k * 0.27);
      const p = L.plats.filter(p => p.y < GY - 200).sort((a, b) => Math.abs(a.x - target) - Math.abs(b.x - target))[0];
      if (p) L.civs.push({ x: p.x + p.w / 2, y: p.y, kind: civKinds[k] });
      else { const s = groundAt(target); L.civs.push({ x: s ? target : segs[0][0] + 600, y: GY, kind: civKinds[k] }); }
    }
    // jangkar arena untuk menghindar
    for (let k = 0; k < 3; k++) L.anchors.push({ x: d.len + 200 + k * 280, y: 120 });
    L.anchors.sort((a, b) => a.x - b.x);
    return L;
  }
  return { DEF, build, GY, ARENA };
})();
