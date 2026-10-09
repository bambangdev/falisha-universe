/* Petualangan Falisha di MIMHa – tabrakan kotak (AABB) */
const Collide = (() => {
  const overlaps = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const insideAny = (box, walls) => walls.some(w => overlaps(box, w));
  /* gerak sumbu X lalu Y dalam sub-langkah ≤ 8 px; berhenti rapat di tembok */
  function moveBox(box, dx, dy, walls) {
    const b = { x: box.x, y: box.y, w: box.w, h: box.h };
    for (const axis of ['x', 'y']) {
      const d = axis === 'x' ? dx : dy, n = Math.max(1, Math.ceil(Math.abs(d) / 8)), step = d / n;
      for (let i = 0; i < n; i++) {
        b[axis] += step;
        const hit = walls.find(w => overlaps(b, w));
        if (hit) {
          b[axis] = step > 0 ? hit[axis] - (axis === 'x' ? b.w : b.h) : hit[axis] + (axis === 'x' ? hit.w : hit.h);
          break;
        }
      }
    }
    return { x: b.x, y: b.y };
  }
  return { overlaps, insideAny, moveBox };
})();
if (typeof module === 'object' && module.exports) module.exports = Collide;
