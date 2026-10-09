const test = require('node:test');
const assert = require('node:assert/strict');
global.Collide = require('../js/core/collide.js');
global.MAPS = require('../js/world/maps.js');
global.Quests = require('../js/story/quests.js');
const Guide = require('../js/story/guide.js');
const IDS = Object.keys(MAPS);
const at = id => { const s = Quests.create(); s.step = Quests.STEPS.findIndex(x => x.id === id); return s; };

test('route: dari setiap peta ke setiap peta sampai dalam ≤ 6 langkah', () => {
  for (const a of IDS) for (const b of IDS) {
    let cur = a, hops = 0;
    while (cur !== b) { const w = Guide.route(cur, b); assert.ok(w, `${a}->${b} buntu di ${cur}`); cur = w.to; assert.ok(++hops <= 6, `${a}->${b}`); }
    if (a === b) assert.equal(Guide.route(a, b), null);
  }
});
test('siap di rumah → menunjuk tas/botol', () => {
  const g = Guide.next(at('siap'), 'rumah');
  assert.equal(g.type, 'point'); assert.ok(['tas', 'botol'].includes(g.id));
});
test('berangkat di rumah → pintu ke jalan; di jalan → ke halaman', () => {
  assert.equal(Guide.next(at('berangkat'), 'rumah').warp.to, 'jalan');
  assert.equal(Guide.next(at('berangkat'), 'jalan').warp.to, 'gerbang');
});
test('wudhu dari halaman → pintu musala; di musala → Pak Ustadz', () => {
  assert.equal(Guide.next(at('wudhu'), 'gerbang').warp.to, 'musala');
  const g = Guide.next(at('wudhu'), 'musala'); assert.equal(g.type, 'point'); assert.equal(g.id, 'ustadz');
});
test('jajan dari kelas → keluar ke halaman dulu', () => assert.equal(Guide.next(at('jajan'), 'kelas').warp.to, 'gerbang'));
test('pensil: tunjuk pensil di peta ini, lalu ke peta yang masih ada pensil, lalu ke Putra', () => {
  const s = at('pensil');
  assert.equal(Guide.next(s, 'kelas').id, 'pensil3');
  Quests.markPicked(s, 'kelas:pensil3'); Quests.addItem(s, 'pensil');
  assert.equal(Guide.next(s, 'kelas').type, 'warp');
  for (const id of IDS) for (const o of MAPS[id].objects) if (o.item === 'pensil' && Quests.markPicked(s, id + ':' + o.id)) Quests.addItem(s, 'pensil');
  assert.equal(Guide.next(s, 'kelas').id, 'putra');
  assert.equal(Guide.next(s, 'kantin').warp.to, 'lapangan');
});
test('piket: semua sampah dipungut → tunjuk tempat sampah di peta ini', () => {
  const s = at('piket');
  for (const id of IDS) for (const o of MAPS[id].objects) if (o.item === 'sampah') { Quests.markPicked(s, id + ':' + o.id); Quests.addItem(s, 'sampah'); }
  const g = Guide.next(s, 'lapangan'); assert.equal(g.type, 'point'); assert.equal(g.id, 'tong');
  assert.equal(Guide.next(s, 'kantin').type, 'warp');
});
test('pulang di kelas → ke halaman; di halaman → Babah Nono', () => {
  assert.equal(Guide.next(at('pulang'), 'kelas').warp.to, 'gerbang');
  assert.equal(Guide.next(at('pulang'), 'gerbang').id, 'nono');
});
test('selesai → tidak ada penunjuk', () => { const s = Quests.create(); s.step = 14; assert.equal(Guide.next(s, 'gerbang'), null); });
test('label & arah untuk setiap warp', () => {
  for (const id of IDS) for (const w of MAPS[id].warps) {
    const l = Guide.sign(w);
    assert.ok(['up', 'down', 'left', 'right'].includes(l.dir), id + w.to);
    assert.ok(l.x >= 0 && l.x <= 960 && l.y >= 0 && l.y <= 540, `${id}->${w.to} label di luar layar`);
    assert.equal(l.name, Guide.PLACE[w.to]);
  }
});
