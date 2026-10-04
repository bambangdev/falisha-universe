/* Falisha Kart – Mode 7 pseudo-3D road renderer (Canvas 2D, ala SNES) */
const Mode7 = (() => {
  const SEG_LEN = 200;          // panjang 1 segmen (world units)
  const RUMBLE = 3;             // panjang rumble strip per segmen
  const ROAD_W = 2200;          // setengah lebar jalan (world units)
  const CAM_H = 1150;           // tinggi kamera
  const DRAW_DIST = 170;        // jumlah segmen digambar
  const FOV = 100;
  const CAM_DEPTH = 1 / Math.tan((FOV / 2) * Math.PI / 180);
  const PLAYER_Z = CAM_H * CAM_DEPTH;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIn = (a, b, t) => a + (b - a) * t * t;
  const pctRem = (n, total) => (n % total) / total;

  function createRoad() {
    const segments = [];
    const road = {
      segments,
      get trackLength() { return segments.length * SEG_LEN; },
      lastY() { return segments.length === 0 ? 0 : segments[segments.length - 1].p2.world.y; },
      addSegment(curve, y) {
        const n = segments.length;
        segments.push({
          index: n, curve, clip: 0, fog: 0,
          p1: { world: { x: 0, y: road.lastY(), z: n * SEG_LEN }, camera: {}, screen: {} },
          p2: { world: { x: 0, y: y, z: (n + 1) * SEG_LEN }, camera: {}, screen: {} },
          color: Math.floor(n / RUMBLE) % 2 ? 'dark' : 'light',
          sprites: [],
        });
      },
      // enter/hold/leave = jumlah segmen; curve = tikungan; y = ketinggian akhir
      addRoad(enter, hold, leave, curve, y) {
        const startY = road.lastY(), endY = startY + y * SEG_LEN;
        const total = enter + hold + leave;
        for (let n = 0; n < enter; n++) road.addSegment(easeIn(0, curve, n / enter), easeIn(startY, endY, n / total));
        for (let n = 0; n < hold; n++) road.addSegment(curve, easeIn(startY, endY, (enter + n) / total));
        for (let n = 0; n < leave; n++) road.addSegment(easeIn(curve, 0, n / leave), easeIn(startY, endY, (enter + hold + n) / total));
      },
      addSprite(segIdx, sprite) {
        const s = segments[((segIdx % segments.length) + segments.length) % segments.length];
        s.sprites.push(sprite);
      },
    };
    return road;
  }

  function findSegment(road, z) {
    const n = road.segments.length;
    return road.segments[Math.floor(z / SEG_LEN) % n];
  }

  function project(p, cameraX, cameraY, cameraZ, width, height) {
    p.camera.x = (p.world.x || 0) - cameraX;
    p.camera.y = (p.world.y || 0) - cameraY;
    p.camera.z = (p.world.z || 0) - cameraZ;
    p.screen.scale = CAM_DEPTH / Math.max(0.0001, p.camera.z);
    p.screen.x = Math.round(width / 2 + p.screen.scale * p.camera.x * width / 2);
    p.screen.y = Math.round(height / 2 - p.screen.scale * p.camera.y * height / 2);
    p.screen.w = Math.round(p.screen.scale * ROAD_W * width / 2);
  }

  function poly(ctx, x1, y1, x2, y2, x3, y3, x4, y4, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineTo(x3, y3); ctx.lineTo(x4, y4);
    ctx.closePath(); ctx.fill();
  }

  // view = { position, playerX, theme, sprites:[{z,x,w,draw}], }
  // theme = { sky:[top,bottom], road:{light,dark}, grass:{light,dark}, rumble:{light,dark}, lane, hill, decor(ctx,W,H,offsetX) }
  function render(ctx, W, H, road, view) {
    const { position, playerX, theme } = view;
    const segments = road.segments, trackLength = road.trackLength;

    // --- langit + background parallax ---
    const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
    sky.addColorStop(0, theme.sky[0]); sky.addColorStop(1, theme.sky[1]);
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H / 2 + 2);
    theme.decor(ctx, W, H, position);

    // --- jalan ---
    const baseSeg = findSegment(road, position);
    const basePct = pctRem(position, SEG_LEN);
    const plSeg = findSegment(road, position + PLAYER_Z);
    const plPct = pctRem(position + PLAYER_Z, SEG_LEN);
    const playerY = lerp(plSeg.p1.world.y, plSeg.p2.world.y, plPct);

    let maxY = H, x = 0, dx = -(baseSeg.curve * basePct);
    for (let n = 0; n < DRAW_DIST; n++) {
      const seg = segments[(baseSeg.index + n) % segments.length];
      seg.looped = seg.index < baseSeg.index;
      seg.clip = maxY;
      const camZ = position - (seg.looped ? trackLength : 0);
      project(seg.p1, playerX * ROAD_W - x, playerY + CAM_H, camZ, W, H);
      project(seg.p2, playerX * ROAD_W - x - dx, playerY + CAM_H, camZ, W, H);
      x += dx; dx += seg.curve;
      if (seg.p1.camera.z <= CAM_DEPTH || seg.p2.screen.y >= seg.p1.screen.y || seg.p2.screen.y >= maxY) continue;

      const c = theme[seg.color]; // {road, grass, rumble}
      const x1 = seg.p1.screen.x, y1 = seg.p1.screen.y, w1 = seg.p1.screen.w;
      const x2 = seg.p2.screen.x, y2 = seg.p2.screen.y, w2 = seg.p2.screen.w;
      const r1 = w1 / 5, r2 = w2 / 5, l1 = w1 / 32, l2 = w2 / 32;
      // rumput
      ctx.fillStyle = c.grass; ctx.fillRect(0, y2, W, y1 - y2);
      // rumble strip
      poly(ctx, x1 - w1 - r1, y1, x1 - w1, y1, x2 - w2, y2, x2 - w2 - r2, y2, c.rumble);
      poly(ctx, x1 + w1 + r1, y1, x1 + w1, y1, x2 + w2, y2, x2 + w2 + r2, y2, c.rumble);
      // jalan
      poly(ctx, x1 - w1, y1, x1 + w1, y1, x2 + w2, y2, x2 - w2, y2, c.road);
      // garis tengah
      if (seg.color === 'light') poly(ctx, x1 - l1, y1, x1 + l1, y1, x2 + l2, y2, x2 - l2, y2, theme.lane);
      maxY = y1;
    }

    // --- sprite (belakang ke depan), dengan clipping ---
    const sprites = (view.sprites || []).slice().sort((a, b) => b.relZ - a.relZ);
    for (const sp of sprites) {
      const seg = findSegment(road, sp.zAbs);
      const scale = seg.p1.screen.scale;
      if (scale <= 0) continue;
      const destX = seg.p1.screen.x + scale * sp.x * ROAD_W * W / 2;
      const destY = seg.p1.screen.y;
      const destW = sp.w * scale * W / 2 * (ROAD_W / 2200);
      const clipY = seg.clip || H;
      if (destY - destW > clipY) continue;
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, clipY); ctx.clip();
      sp.draw(ctx, destX, destY, destW);
      ctx.restore();
    }
  }

  // proyeksi satu titik dunia ke layar (untuk item melayang dkk)
  function projectPoint(road, position, playerX, playerY, zAbs, xOff, W, H) {
    const seg = findSegment(road, zAbs);
    let relZ = zAbs - position;
    if (relZ < 0) relZ += road.trackLength;
    const camZ = relZ;
    const scale = CAM_DEPTH / Math.max(0.0001, camZ);
    // aproksimasi x layar dengan kurva sederhana
    const baseSeg = findSegment(road, position);
    let dxCurve = 0;
    for (let n = 0; n < Math.min(60, Math.floor(relZ / SEG_LEN)); n++) {
      dxCurve += road.segments[(baseSeg.index + n) % road.segments.length].curve * 0.9;
    }
    const x = W / 2 + scale * (xOff * ROAD_W - playerX * ROAD_W - dxCurve * 40) * W / 2;
    const y = H / 2 - scale * (seg.p1.world.y - playerY - CAM_H) * H / 2;
    return { x, y, scale };
  }

  return { SEG_LEN, ROAD_W, CAM_H, DRAW_DIST, CAM_DEPTH, PLAYER_Z, createRoad, findSegment, render, projectPoint };
})();
