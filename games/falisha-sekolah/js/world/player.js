/* Petualangan Falisha di MIMHa – gerak Falisha (kotak = kaki; anchor gambar = tengah-bawah kotak) */
const Player = (() => {
  const SPEED = 160, FPS = 8, CYCLE = [0, 1, 2, 1];
  function create(x, y, face = 'down') { return { x, y, w: 28, h: 18, face, frame: 1, t: 0, moving: false }; }
  function update(p, axis, dt, walls) {
    let { dx, dy } = axis;
    const m = Math.hypot(dx, dy);
    p.moving = m > 0;
    if (!p.moving) { p.frame = 1; p.t = 0; return; }
    if (m > 1) { dx /= m; dy /= m; }
    p.face = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const pos = Collide.moveBox(p, dx * SPEED * dt, dy * SPEED * dt, walls);
    p.x = pos.x; p.y = pos.y;
    p.t += dt;
    p.frame = CYCLE[Math.floor(p.t * FPS) % 4];
  }
  function frontRect(p) {
    const cx = p.x + p.w / 2, cy = p.y + p.h / 2, S = 28;
    const o = { up: [0, -(p.h / 2 + S / 2)], down: [0, p.h / 2 + S / 2], left: [-(p.w / 2 + S / 2), 0], right: [p.w / 2 + S / 2, 0] }[p.face];
    return { x: cx + o[0] - S / 2, y: cy + o[1] - S / 2, w: S, h: S };
  }
  return { SPEED, create, update, frontRect };
})();
if (typeof module === 'object' && module.exports) module.exports = Player;
