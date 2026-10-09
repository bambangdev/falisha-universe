const test = require('node:test');
const assert = require('node:assert/strict');
global.Quests = require('../js/story/quests.js');
const Script = require('../js/story/script.js');
const at = id => { const s = Quests.create(); s.step = Quests.STEPS.findIndex(x => x.id === id); return s; };
const text = r => r.lines.map(l => l.text).join(' ');

const CASES = [
  ['pupu', 'pamit', { type: 'complete', id: 'pamit' }],
  ['guru', 'salam_guru', { type: 'complete', id: 'salam_guru' }],
  ['ustadz', 'wudhu', { type: 'minigame', id: 'wudhu' }],
  ['ustadz', 'dhuha', { type: 'minigame', id: 'dhuha' }],
  ['guru', 'iqro', { type: 'minigame', id: 'iqro' }],
  ['guru', 'hitung', { type: 'minigame', id: 'hitung' }],
  ['guru', 'doa', { type: 'minigame', id: 'doa' }],
  ['kantin', 'jajan', { type: 'minigame', id: 'jajan' }],
  ['anasya', 'lompat_tali', { type: 'minigame', id: 'lompat_tali' }],
  ['ayana', 'lompat_tali', { type: 'minigame', id: 'lompat_tali' }],
  ['nono', 'pulang', { type: 'complete', id: 'pulang' }],
  ['arsyad', 'pulang', { type: 'complete', id: 'pulang' }]
];
for (const [npc, step, action] of CASES) test(`${npc}@${step} → ${action.type}`, () => assert.deepEqual(Script.talk(npc, at(step)).action, action));

test('Putra dengan 5 pensil → give lalu complete', () => {
  const s = at('pensil'); Quests.addItem(s, 'pensil', 5);
  assert.deepEqual(Script.talk('putra', s).action, { type: 'give', item: 'pensil', n: 5, then: 'complete' });
});
test('Putra dengan 3 pensil → petunjuk "kurang 2"', () => {
  const s = at('pensil'); Quests.addItem(s, 'pensil', 3);
  const r = Script.talk('putra', s);
  assert.equal(r.action, null); assert.match(text(r), /kurang 2/);
});
test('di luar giliran: petunjuk objektif aktif, tanpa aksi', () => {
  const r = Script.talk('pupu', at('siap'));
  assert.equal(r.action, null); assert.match(text(r), /Ambil tas & botol minum/);
});
test('semua NPC punya baris & pembicara valid di setiap langkah', () => {
  const WHO = ['falisha', 'pupu', 'baymax', 'nono', 'arsyad', 'guru', 'ustadz', 'satpam', 'kantin', 'putra', 'anasya', 'ayana', 'seyan'];
  for (const npc of WHO.slice(1)) for (let i = 0; i <= 14; i++) {
    const s = Quests.create(); s.step = i;
    const r = Script.talk(npc, s);
    assert.ok(r.lines.length > 0, npc + i);
    for (const l of r.lines) { assert.ok(WHO.includes(l.who), l.who); assert.ok(l.text.length > 0); }
  }
});
test('talk tidak mengubah state', () => {
  const s = at('pensil'); Quests.addItem(s, 'pensil', 5);
  const before = JSON.stringify(s); Script.talk('putra', s);
  assert.equal(JSON.stringify(s), before);
});
