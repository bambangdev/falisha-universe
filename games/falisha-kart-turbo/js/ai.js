/* Falisha Kart Turbo – AI CPU: racing line, hindari pisang, rubber-band, pakai item */
const AI = (() => {
  const SKILL = [0.86, 0.93, 0.99];          // Mudah, Sedang, Susah
  function input(k, T, player, diff, dt) {
    const a = k.ai, i0 = Math.floor(k.z / Road.SEG);
    // racing line: lihat tikungan di depan, ambil sisi dalam
    let look = 0;
    for (let n = 3; n < 16; n++) look += T.segs[(i0 + n) % T.segs.length].curve;
    a.lineT -= dt;
    if (a.lineT <= 0) { a.line = (Math.random() - 0.5) * 0.7; a.lineT = 2 + Math.random() * 3; }
    let target = Math.max(-0.75, Math.min(0.75, look * 0.035)) + a.line;
    // hindari pisang & kart di depan
    for (const o of Items.list) {
      if (o.type !== 'pisang') continue;
      let dz = o.z - k.z; if (dz < 0) dz += T.length;
      if (dz < 1800 && Math.abs(o.x - target) < 0.35) target += o.x > target ? -0.5 : 0.5;
    }
    target = Math.max(-0.85, Math.min(0.85, target));
    const steer = Math.max(-1, Math.min(1, (target - k.x) * 3));
    // rubber-band ringan supaya tetap seru
    let f = SKILL[diff] * (0.97 + (k.st.top - 0.94) * 0.5);
    if (player) {
      const gap = (player.dist - k.dist) / T.length;
      if (gap > 0.04) f *= 1 + Math.min(0.13, gap * 0.7);
      else if (gap < -0.04) f *= 1 - Math.min(0.12, -gap * 0.6);
    }
    k.cpuF = f;
    // item
    let use = false;
    if (k.item && k.roll <= 0) {
      a.itemT -= dt;
      if (a.itemT <= 0) { use = true; a.itemT = 2 + Math.random() * 4 * (1.5 - diff * 0.4); }
    }
    return { gas: true, brake: false, steer, drift: false, use };
  }
  return { input, SKILL };
})();
