const test = require('node:test');
const assert = require('node:assert/strict');
const Quests = require('../js/story/quests.js');

test('14 langkah dari siap sampai pulang', () => {
  assert.equal(Quests.STEPS.length, 14);
  assert.equal(Quests.STEPS[0].id, 'siap');
  assert.equal(Quests.STEPS[0].text, 'Ambil tas & botol minum');
  assert.equal(Quests.STEPS[13].id, 'pulang');
});
test('complete di luar giliran ditolak tanpa mengubah state', () => {
  const s = Quests.create(), before = JSON.stringify(s);
  assert.equal(Quests.complete(s, 'pamit'), false);
  assert.equal(JSON.stringify(s), before);
});
test('complete langkah aktif maju + stiker', () => {
  const s = Quests.create();
  assert.equal(Quests.complete(s, 'siap'), true);
  assert.equal(Quests.current(s).id, 'pamit');
  assert.equal(s.stickers, 1);
});
test('menyelesaikan 14 langkah = finished', () => {
  const s = Quests.create();
  for (const st of Quests.STEPS) Quests.complete(s, st.id);
  assert.equal(Quests.finished(s), true);
  assert.equal(Quests.current(s), null);
});
test('bintang menyimpan nilai terbaik', () => {
  const s = Quests.create();
  Quests.setStars(s, 'iqro', 3); Quests.setStars(s, 'iqro', 1);
  assert.equal(s.stars.iqro, 3);
});
test('markPicked hanya sekali', () => {
  const s = Quests.create();
  assert.equal(Quests.markPicked(s, 'kelas:pensil1'), true);
  assert.equal(Quests.markPicked(s, 'kelas:pensil1'), false);
  assert.equal(Quests.isPicked(s, 'kelas:pensil1'), true);
});
test('item: tambah, hitung, ambil', () => {
  const s = Quests.create();
  Quests.addItem(s, 'pensil', 3);
  assert.equal(Quests.count(s, 'pensil'), 3);
  assert.equal(Quests.takeItem(s, 'pensil', 5), false);
  assert.equal(Quests.takeItem(s, 'pensil', 3), true);
  assert.equal(Quests.count(s, 'pensil'), 0);
});
