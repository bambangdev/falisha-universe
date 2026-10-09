const test = require('node:test');
const assert = require('node:assert/strict');
global.Collide = require('../js/core/collide.js');
const MAPS = require('../js/world/maps.js');
const IDS = ['rumah', 'jalan', 'gerbang', 'lapangan', 'kelas', 'musala', 'kantin'];
const box = (x, y) => MAPS.footBox(x, y);

test('7 peta ada, masing-masing punya spawn default', () => {
  for (const id of IDS) { assert.ok(MAPS[id], id); assert.ok(MAPS[id].spawns.default, id); }
  assert.deepEqual(Object.keys(MAPS).sort(), [...IDS].sort());
});
for (const id of IDS) {
  test(`${id}: spawn bebas tembok dan tidak di atas warp`, () => {
    const m = MAPS[id];
    for (const [k, s] of Object.entries(m.spawns)) {
      assert.equal(Collide.insideAny(box(s.x, s.y), m.walls), false, `${id}.${k} di tembok`);
      assert.equal(Collide.insideAny(box(s.x, s.y), m.warps), false, `${id}.${k} di warp`);
      assert.ok(s.x > 0 && s.x < 960 && s.y > 0 && s.y <= 540, `${id}.${k} di luar layar`);
    }
  });
  test(`${id}: warp menuju peta & spawn yang ada, dan bisa dimasuki`, () => {
    for (const w of MAPS[id].warps) {
      assert.ok(MAPS[w.to], `${id} -> ${w.to}`);
      assert.ok(MAPS[w.to].spawns[w.at], `${id} -> ${w.to}@${w.at}`);
      const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
      assert.equal(Collide.insideAny({ x: cx - 14, y: cy - 9, w: 28, h: 18 }, MAPS[id].walls), false, `pusat warp ${id}->${w.to} tertutup tembok`);
    }
  });
  test(`${id}: NPC, objek, dan spot tidak di dalam tembok`, () => {
    const m = MAPS[id];
    for (const e of [...m.npcs, ...m.objects]) assert.equal(Collide.insideAny(box(e.x, e.y), m.walls), false, `${id}.${e.id}`);
    for (const s of m.spots) assert.equal(Collide.insideAny(s, m.walls), false, `${id}.${s.id}`);
  });
}
test('5 pensil dan 8 sampah tersebar, langkahnya benar', () => {
  const all = IDS.flatMap(id => MAPS[id].objects);
  const pensil = all.filter(o => o.item === 'pensil'), sampah = all.filter(o => o.item === 'sampah');
  assert.equal(pensil.length, 5); assert.equal(sampah.length, 8);
  assert.ok(pensil.every(o => o.step === 'pensil')); assert.ok(sampah.every(o => o.step === 'piket'));
  assert.deepEqual(['kelas', 'gerbang', 'lapangan'].map(id => MAPS[id].objects.filter(o => o.item === 'sampah').length), [3, 3, 2]);
  assert.equal(new Set(IDS.flatMap(id => MAPS[id].objects.map(o => id + ':' + o.id))).size, all.length);
});
test('tas & botol di rumah; tong di kelas, gerbang, lapangan; keran di musala', () => {
  assert.deepEqual(MAPS.rumah.objects.filter(o => o.step === 'siap').map(o => o.item).sort(), ['botol', 'tas']);
  for (const id of ['kelas', 'gerbang', 'lapangan']) assert.ok(MAPS[id].spots.some(s => s.id === 'tong'), id);
  assert.ok(MAPS.musala.spots.some(s => s.id === 'keran'));
});
test('NPC wajib ada di petanya', () => {
  const want = { rumah: ['pupu'], jalan: ['baymax'], gerbang: ['satpam', 'guru', 'nono', 'arsyad'], musala: ['ustadz'],
    kelas: ['guru', 'putra', 'seyan'], kantin: ['kantin'], lapangan: ['anasya', 'ayana'] };
  for (const [id, list] of Object.entries(want)) for (const n of list) assert.ok(MAPS[id].npcs.some(e => e.id === n), `${id}.${n}`);
});
