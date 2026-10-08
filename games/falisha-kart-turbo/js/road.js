/* Falisha Kart Turbo – jalan pseudo-3D berbasis segmen (tikungan, bukit, terowongan, ramp)
   Digambar dari jauh ke dekat (painter's algorithm) supaya bukit & dinding terowongan menutupi objek di belakangnya. */
const Road = (() => {
  const W = 960, H = 540;
  const SEG = 200;              // panjang segmen (unit dunia)
  const ROADW = 2000;           // setengah lebar jalan
  const RUMBLE = 3;             // segmen per warna strip pinggir
  const CAM_H = 1150;           // tinggi kamera
  const DEPTH = 1 / Math.tan((100 / 2) * Math.PI / 180);
  const PLAYER_Z = CAM_H * DEPTH * 1.35;   // jarak kamera ke kart pemain
  const DRAW = 230;             // jumlah segmen yang digambar
  const TUNNEL_H = 2600;

  const easeIn = (a, b, p) => a + (b - a) * Math.pow(p, 2);
  const easeInOut = (a, b, p) => a + (b - a) * ((-Math.cos(p * Math.PI) / 2) + 0.5);

  /* ---- Pembangun trek ---- */
  function build(def) {
    const segs = [];
    const lastY = () => segs.length ? segs[segs.length - 1].p2.world.y : 0;
    function add(curve, y, flags) {
      const n = segs.length;
      segs.push({
        index: n, curve, flags: { ...flags }, sprites: [], boxes: null,
        p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} },
        p2: { world: { y, z: (n + 1) * SEG }, camera: {}, screen: {} },
        alt: Math.floor(n / RUMBLE) % 2
      });
    }
    function road(enter, hold, leave, curve, hill, flags) {
      const y0 = lastY(), y1 = y0 + hill * SEG, total = enter + hold + leave || 1;
      for (let i = 0; i < enter; i++) add(easeIn(0, curve, i / enter), easeInOut(y0, y1, i / total), flags);
      for (let i = 0; i < hold; i++) add(curve, easeInOut(y0, y1, (enter + i) / total), flags);
      for (let i = 0; i < leave; i++) add(easeInOut(curve, 0, i / leave), easeInOut(y0, y1, (enter + hold + i) / total), flags);
    }
    road(0, 30, 0, 0, 0, {});                        // lurus awal (grid start)
    const marks = [];
    for (const p of def.pieces) {
      const [e, h, l] = p.n;
      const s = segs.length;
      road(e, h, l, p.c || 0, p.h || 0, { tunnel: !!p.tunnel });
      marks.push({ p, s, e: segs.length });
    }
    road(10, 20, 20, 0, -lastY() / SEG, {});          // kembali ke ketinggian 0 supaya lap menyambung
    road(0, 20, 0, 0, 0, {});
    // ramp, kotak item, gerbang terowongan
    for (const { p, s, e } of marks) {
      if (p.ramp) { const r = Math.max(s, e - 4); for (let i = r; i < r + 3; i++) segs[i].flags.ramp = true; }
      if (p.box) { const m = Math.floor((s + e) / 2); segs[m].boxes = [-0.55, -0.18, 0.18, 0.55].map(x => ({ x, t: 0 })); }
      if (p.tunnel) segs[s].flags.portal = true;
    }
    const startSeg = 14;
    // dekor pinggir jalan (seeded supaya selalu sama)
    let seed = def.seed || 1;
    const R = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const wsum = def.decor.reduce((a, d) => a + d[2], 0);
    const pick = () => { let r = R() * wsum; for (const d of def.decor) { r -= d[2]; if (r <= 0) return d; } return def.decor[0]; };
    for (let i = 4; i < segs.length; i += 1) {
      const sg = segs[i];
      if (sg.flags.tunnel) { if (i % 6 === 0) for (const sd of [-1, 1]) sg.sprites.push({ name: '__lamp', x: sd * 1.12, w: 0 }); continue; }
      if (R() > def.density) continue;
      const d = pick(), side = R() < 0.5 ? -1 : 1;
      sg.sprites.push({ name: d[0], x: side * (def.sideMin + R() * (def.sideMax - def.sideMin)), w: d[1] * (0.85 + R() * 0.3) });
    }
    for (let i = startSeg - 1; i <= startSeg + 1; i += 2) for (const sd of [-1, 1]) segs[i].sprites.push({ name: '__flag', x: sd * 1.7, w: 0 });
    return { segs, length: segs.length * SEG, startZ: startSeg * SEG, startSeg };
  }

  const find = (T, z) => T.segs[Math.floor(z / SEG) % T.segs.length];
  function project(p, cx, cy, cz) {
    p.camera.x = -cx; p.camera.y = p.world.y - cy; p.camera.z = p.world.z - cz;
    const s = p.screen.scale = DEPTH / p.camera.z;
    p.screen.x = W / 2 + s * p.camera.x * W / 2;
    p.screen.y = H / 2 - s * p.camera.y * H / 2;
    p.screen.w = s * ROADW * W / 2;
  }
  function poly(c, x1, y1, x2, y2, x3, y3, x4, y4, col) {
    c.fillStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.lineTo(x3, y3); c.lineTo(x4, y4); c.closePath(); c.fill();
  }

  /* Gambar langit panorama (bergulir sesuai tikungan) */
  function sky(c, img, offset, th, inTunnel) {
    if (inTunnel) { c.fillStyle = th.tunnelCeil; c.fillRect(0, 0, W, H); return; }
    c.fillStyle = th.skyFill; c.fillRect(0, 0, W, H);
    if (img && img.naturalWidth) {
      const h = 330, w = img.naturalWidth * h / img.naturalHeight, y = H / 2 + 34 - h;
      let x = -((offset * w) % w); if (x > 0) x -= w;
      for (; x < W; x += w) c.drawImage(img, x, y, w, h);
    }
  }

  /* Render jalan. cam = {x, y, z}. hook(seg, scale-info) dipanggil per segmen (jauh→dekat) untuk menggambar sprite. */
  function render(c, T, cam, th, hook) {
    const base = find(T, cam.z), basePct = (cam.z % SEG) / SEG;
    let x = 0, dx = -(base.curve * basePct);
    const list = [];
    for (let n = 0; n < DRAW; n++) {
      const sg = T.segs[(base.index + n) % T.segs.length];
      const looped = sg.index < base.index ? T.length : 0;
      project(sg.p1, cam.x - x, cam.y, cam.z - looped);
      project(sg.p2, cam.x - x - dx, cam.y, cam.z - looped);
      x += dx; dx += sg.curve;
      sg.fog = th.fog ? Math.min(0.92, Math.pow(n / DRAW, 1.6) * th.fog) : 0;
      if (sg.p1.camera.z <= DEPTH) continue;
      sg.vis = sg.p2.screen.y < sg.p1.screen.y + 0.5;      // sisi belakang bukit tidak digambar (tertutup puncak)
      list.push(sg);
    }
    for (let i = list.length - 1; i >= 0; i--) {
      const sg = list[i], p1 = sg.p1.screen, p2 = sg.p2.screen;
      if (sg.vis) drawSeg(c, sg, p1, p2, th, T);
      if (sg.flags.tunnel) drawTunnel(c, sg, p1, p2, th);
      if (sg.fog > 0.02 && sg.vis) { c.globalAlpha = sg.fog; c.fillStyle = th.fogColor; c.fillRect(0, p2.y, W, p1.y - p2.y + 1); c.globalAlpha = 1; }
      hook(sg);
    }
  }
  function drawSeg(c, sg, p1, p2, th, T) {
    const a = sg.alt, tun = sg.flags.tunnel;
    c.fillStyle = tun ? th.tunnelFloor : th.grass[a]; c.fillRect(0, p2.y, W, p1.y - p2.y + 1);
    const r1 = p1.w * 1.12, r2 = p2.w * 1.12;
    poly(c, p1.x - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - r2, p2.y, th.rumble[a]);
    poly(c, p1.x + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + r2, p2.y, th.rumble[a]);
    let road = th.road[a];
    if (sg.flags.ramp) road = a ? '#ffd23f' : '#222';
    poly(c, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, road);
    if (sg.index === T.startSeg || sg.index === T.startSeg + 1) {           // garis start kotak-kotak
      const n = 12;
      for (let k = 0; k < n; k++) {
        const t1 = -1 + 2 * k / n, t2 = -1 + 2 * (k + 1) / n;
        poly(c, p1.x + p1.w * t1, p1.y, p1.x + p1.w * t2, p1.y, p2.x + p2.w * t2, p2.y, p2.x + p2.w * t1, p2.y, (k + sg.index) % 2 ? '#fff' : '#111');
      }
    } else if (!a && !sg.flags.ramp) {
      const l1 = p1.w / 40, l2 = p2.w / 40;
      for (const t of [-1 / 3, 1 / 3]) poly(c, p1.x + p1.w * t - l1, p1.y, p1.x + p1.w * t + l1, p1.y, p2.x + p2.w * t + l2, p2.y, p2.x + p2.w * t - l2, p2.y, th.lane);
    }
  }
  function drawTunnel(c, sg, p1, p2, th) {
    const h1 = sg.p1.screen.scale * TUNNEL_H * H / 2, h2 = sg.p2.screen.scale * TUNNEL_H * H / 2;
    const w1 = p1.w * 1.25, w2 = p2.w * 1.25;
    const L1 = p1.x - w1, R1 = p1.x + w1, L2 = p2.x - w2, R2 = p2.x + w2;
    const col = sg.alt ? th.tunnelWall[0] : th.tunnelWall[1];
    poly(c, L1, p1.y, L1, p1.y - h1, L2, p2.y - h2, L2, p2.y, col);
    poly(c, R1, p1.y, R1, p1.y - h1, R2, p2.y - h2, R2, p2.y, col);
    poly(c, L1, p1.y - h1, R1, p1.y - h1, R2, p2.y - h2, L2, p2.y - h2, th.tunnelCeil);
    if (sg.index % 6 === 0) poly(c, p1.x - w1 * 0.3, p1.y - h1 + 2, p1.x + w1 * 0.3, p1.y - h1 + 2, p2.x + w2 * 0.3, p2.y - h2 + 2, p2.x - w2 * 0.3, p2.y - h2 + 2, '#ffe9a0');
    if (sg.flags.portal) {   // muka gerbang terowongan
      c.fillStyle = th.portal;
      c.fillRect(L1 - w1 * 3, p1.y - h1 * 1.5, w1 * 3, h1 * 1.5);
      c.fillRect(R1, p1.y - h1 * 1.5, w1 * 3, h1 * 1.5);
      c.fillRect(L1, p1.y - h1 * 1.5, R1 - L1, h1 * 0.5);
      c.fillStyle = '#ffd23f'; c.fillRect(L1, p1.y - h1 - Math.max(2, h1 * 0.06), R1 - L1, Math.max(2, h1 * 0.06));
    }
  }
  /* Posisi layar objek di segmen sg pada persentase pct (0..1) & offset lateral x (satuan lebar jalan), tinggi yWorld */
  function screenAt(sg, pct, x, yWorld = 0) {
    const a = sg.p1, b = sg.p2;
    const s = a.screen.scale + (b.screen.scale - a.screen.scale) * pct;
    const sx = a.screen.x + (b.screen.x - a.screen.x) * pct + s * x * ROADW * W / 2;
    const sy = a.screen.y + (b.screen.y - a.screen.y) * pct - s * yWorld * H / 2;
    return { x: sx, y: sy, s, k: s * W / 2 };   // k: pengali unit dunia -> piksel
  }
  return { W, H, SEG, ROADW, CAM_H, DEPTH, PLAYER_Z, DRAW, build, find, render, sky, screenAt };
})();
