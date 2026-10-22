/* Data misi dalam satuan dunia 3D: 1 unit = 40 px game 2D (Falisha Slug). y = tinggi dari tanah (0). */
export const MISSIONS = [
  {
    num: 1, title: 'MISI 1: PANTAI GURUN', bg: 'desert', len: 57.5, ground: 'sand', music: 1,
    platforms: [
      { x0: 9, x1: 16, y: 2.4, type: 'wood' }, { x0: 19, x1: 26.5, y: 4.1, type: 'wood' },
      { x0: 29.5, x1: 36.25, y: 2.1, type: 'sandbag' }, { x0: 39, x1: 46.5, y: 3.6, type: 'wood' }
    ],
    hostages: [{ x: 12.5, y: 2.4, gift: 'H' }, { x: 32.5, y: 2.1, gift: 'food' }],
    enemies: [
      { type: 'soldier', x: 11.25, y: 2.4, hp: 2 }, { type: 'soldier', x: 18, y: 0, hp: 2 },
      { type: 'soldier', x: 23, y: 4.1, hp: 2 }, { type: 'chopper', x: 28, y: 6.4, hp: 6 },
      { type: 'soldier', x: 34.5, y: 0, hp: 2 }, { type: 'soldier', x: 42, y: 3.6, hp: 2 },
      { type: 'chopper', x: 50.5, y: 6.6, hp: 16, isMiniBoss: true }
    ],
    props: [{ k: 'palm', x: 4 }, { k: 'sandbag', x: 17 }, { k: 'palm', x: 27 }, { k: 'crate', x: 38 }, { k: 'palm', x: 47.5 }, { k: 'sandbag', x: 53 }],
    tankX: 8.5
  },
  {
    num: 2, title: 'MISI 2: HUTAN TROPIK', bg: 'jungle', len: 60, ground: 'grass', music: 1,
    platforms: [
      { x0: 8.5, x1: 15.5, y: 2.4, type: 'wood' }, { x0: 18, x1: 25, y: 4.4, type: 'wood' },
      { x0: 27.5, x1: 34.5, y: 2.6, type: 'wood' }, { x0: 37.5, x1: 45.5, y: 4.1, type: 'wood' }
    ],
    hostages: [{ x: 12, y: 2.4, gift: 'R' }, { x: 31, y: 2.6, gift: 'H' }, { x: 41.5, y: 4.1, gift: 'food' }],
    enemies: [
      { type: 'soldier', x: 12.5, y: 2.4, hp: 2 }, { type: 'robot', x: 19.5, y: 4.4, hp: 5 },
      { type: 'chopper', x: 23.75, y: 6.6, hp: 6 }, { type: 'soldier', x: 30, y: 0, hp: 2 },
      { type: 'robot', x: 36, y: 0, hp: 5 }, { type: 'soldier', x: 40, y: 4.1, hp: 2 },
      { type: 'chopper', x: 52.5, y: 6.6, hp: 20, isMiniBoss: true }
    ],
    props: [{ k: 'tree', x: 3 }, { k: 'tree', x: 16.5 }, { k: 'crate', x: 26 }, { k: 'tree', x: 35.5 }, { k: 'tree', x: 47 }, { k: 'sandbag', x: 55 }],
    tankX: 9.5
  },
  {
    num: 3, title: 'MISI 3: KOTA KILAT', bg: 'city', len: 70, ground: 'steel', music: 2,
    platforms: [
      { x0: 8.75, x1: 17, y: 2.4, type: 'steel' }, { x0: 19.5, x1: 27.5, y: 4.1, type: 'steel' },
      { x0: 30.5, x1: 38.5, y: 2.6, type: 'steel' }, { x0: 41.5, x1: 45, y: 4.4, type: 'steel' },
      { x0: 59, x1: 63, y: 2.6, type: 'steel' }
    ],
    hostages: [{ x: 13, y: 2.4, gift: 'H' }, { x: 34.5, y: 2.6, gift: 'R' }, { x: 60.5, y: 2.6, gift: 'food' }],
    enemies: [
      { type: 'soldier', x: 12.5, y: 2.4, hp: 3 }, { type: 'soldier', x: 20.5, y: 4.1, hp: 3 },
      { type: 'chopper', x: 26.25, y: 6.4, hp: 6 }, { type: 'robot', x: 37, y: 2.6, hp: 5 },
      { type: 'soldier', x: 43, y: 4.4, hp: 3 }, { type: 'robot', x: 45, y: 0, hp: 5 },
      { type: 'chopper', x: 48, y: 6.6, hp: 20, isMiniBoss: true },
      { type: 'soldier', x: 61, y: 0, hp: 3 }
    ],
    props: [{ k: 'lamp', x: 5 }, { k: 'crate', x: 18 }, { k: 'lamp', x: 29 }, { k: 'crate', x: 40 }, { k: 'lamp', x: 51 }, { k: 'gate', x: 55 }],
    tankX: 10.5, tank2X: 57,
    isFinalBoss: true, bossX: 66, arenaX: 56, musicAt: { x: 52, track: 3 }
  }
];

/* Permukaan pijakan di x: tanah (0) atau platform yang didarati dari atas. */
export function groundAt(m, x, curY, prevY) {
  let top = 0;
  for (const p of m.platforms) {
    if (x >= p.x0 - 0.5 && x <= p.x1 + 0.5 && prevY >= p.y - 0.15 && curY <= p.y + 0.1 && p.y > top) top = p.y;
  }
  return top;
}
