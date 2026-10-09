const test = require('node:test');
const assert = require('node:assert/strict');
global.Quests = require('../js/story/quests.js');
const Save = require('../js/core/save.js');
const fake = val => { const m = { v: val }; return { getItem: () => m.v, setItem: (k, v) => { m.v = v; }, removeItem: () => { m.v = null; } }; };

test('roundtrip store → load', () => {
  const st = fake(null), s = Quests.create();
  Quests.complete(s, 'siap'); Quests.addItem(s, 'tas'); Quests.setStars(s, 'wudhu', 2); Quests.markPicked(s, 'rumah:tas');
  Save.store(st, s);
  assert.deepEqual(Save.load(st), s);
});
for (const bad of ['{rusak', '{"v":0}', '{"v":1,"step":99}', '{"v":1,"step":2,"items":[],"stars":{},"stickers":0,"picked":[]}']) {
  test('simpanan rusak → state baru: ' + bad, () => assert.deepEqual(Save.load(fake(bad)), Quests.create()));
}
test('kosong → state baru', () => assert.deepEqual(Save.load(fake(null)), Quests.create()));
test('getItem melempar → state baru', () => {
  assert.deepEqual(Save.load({ getItem() { throw new Error('blocked'); } }), Quests.create());
});
test('clear menghapus', () => { const st = fake('{}'); Save.clear(st); assert.equal(st.getItem(), null); });
