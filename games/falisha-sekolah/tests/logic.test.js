const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/minigames/logic.js');

test('stars dari jumlah salah', () => { assert.equal(M.stars(0), 3); assert.equal(M.stars(2), 2); assert.equal(M.stars(3), 1); });
test('rng deterministik dalam [0,1)', () => {
  const a = M.rng(5), b = M.rng(5);
  for (let i = 0; i < 50; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
});
test('urutan wudhu 8 langkah', () => {
  assert.deepEqual(M.WUDHU, ['tangan', 'kumur', 'hidung', 'wajah', 'lengan', 'kepala', 'telinga', 'kaki']);
  assert.equal(M.wudhuOk(0, 'tangan'), true); assert.equal(M.wudhuOk(1, 'wajah'), false);
});
test('dhuha 13 gerakan, diawali qiyam dan diakhiri duduk', () => {
  assert.equal(M.DHUHA.length, 13); assert.equal(M.DHUHA[0], 'qiyam'); assert.equal(M.DHUHA[12], 'duduk');
});
test('28 huruf hijaiyah', () => {
  assert.equal(M.HIJAIYAH.length, 28);
  assert.equal(M.HIJAIYAH[0].ch, 'ا'); assert.equal(M.HIJAIYAH[0].name, 'Alif'); assert.equal(M.HIJAIYAH[27].name, 'Ya');
});
test('hijaiyahRound: 4 pilihan unik berisi jawaban (200 ronde)', () => {
  const r = M.rng(1);
  for (let i = 0; i < 200; i++) {
    const q = M.hijaiyahRound(r);
    assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4);
    assert.ok(q.options.includes(q.answer)); assert.ok(q.options.every(o => o >= 0 && o < 28));
  }
});
test('hitung: batas angka & 3 pilihan unik (200 soal)', () => {
  const r = M.rng(1);
  for (let i = 0; i < 200; i++) {
    const q = M.hitung(r);
    if (q.op === '+') { assert.ok(q.a >= 0 && q.a <= 10 && q.b >= 0 && q.b <= 10); assert.equal(q.answer, q.a + q.b); }
    else { assert.equal(q.op, '-'); assert.ok(q.a >= 1 && q.a <= 20 && q.b <= q.a && q.b >= 0); assert.equal(q.answer, q.a - q.b); }
    assert.ok(q.answer >= 0 && q.answer <= 20);
    assert.equal(q.choices.length, 3); assert.equal(new Set(q.choices).size, 3);
    assert.ok(q.choices.includes(q.answer)); assert.ok(q.choices.every(c => c >= 0 && c <= 20));
  }
});
test('doa: dua doa dengan potongan persis', () => {
  assert.deepEqual(M.DOA[0], { id: 'makan', parts: ['Allahumma', 'baarik lanaa', 'fiimaa razaqtanaa', 'wa qinaa', "'adzaaban naar"] });
  assert.equal(M.DOA[1].id, 'keluar'); assert.equal(M.DOA[1].parts.length, 6);
  assert.equal(M.doaOk(M.DOA[0].parts, 0, 'Allahumma'), true); assert.equal(M.doaOk(M.DOA[0].parts, 1, 'wa qinaa'), false);
});
test('shuffled selalu permutasi berbeda dari asli', () => {
  const r = M.rng(9), p = M.DOA[0].parts;
  for (let i = 0; i < 100; i++) {
    const s = M.shuffled(p, r);
    assert.deepEqual([...s].sort(), [...p].sort()); assert.notDeepEqual(s, p);
  }
});
test('bayar: kurang / pas / lebih', () => {
  assert.equal(M.bayar([1000, 1000], 2000), 'pas');
  assert.equal(M.bayar([500], 1000), 'kurang');
  assert.equal(M.bayar([2000, 2000], 3000), 'lebih');
  assert.deepEqual(M.HARGA, { roti: 2000, susu: 3000, pisang: 1000, risol: 2000 });
  assert.deepEqual(M.UANG, [500, 1000, 2000]); assert.deepEqual(M.PESANAN, ['pisang', 'roti', 'susu']);
});
test('lompat tali: tempo & penilaian', () => {
  assert.equal(M.talPeriod(0), 1.2); assert.equal(M.talPeriod(30), 0.8);
  assert.equal(M.talJudge(1.0, 1.1), 'pas'); assert.equal(M.talJudge(0.8, 1.1), 'cepat'); assert.equal(M.talJudge(1.4, 1.1), 'lambat');
});
