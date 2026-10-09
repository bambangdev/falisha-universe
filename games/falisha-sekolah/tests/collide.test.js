const test = require('node:test');
const assert = require('node:assert/strict');
const Collide = require('../js/core/collide.js');

test('overlaps: tepi bersentuhan bukan tumpang tindih', () => {
  assert.equal(Collide.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 5, h: 5 }), false);
  assert.equal(Collide.overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 5, h: 5 }), true);
});
test('moveBox berhenti rapat di tembok', () => {
  assert.deepEqual(Collide.moveBox({ x: 0, y: 0, w: 10, h: 10 }, 15, 0, [{ x: 20, y: 0, w: 10, h: 10 }]), { x: 10, y: 0 });
});
test('moveBox meluncur sepanjang tembok', () => {
  assert.deepEqual(Collide.moveBox({ x: 0, y: 0, w: 10, h: 10 }, 15, 5, [{ x: 20, y: -50, w: 10, h: 100 }]), { x: 10, y: 5 });
});
test('moveBox tidak menembus tembok tipis saat langkah besar', () => {
  assert.equal(Collide.moveBox({ x: 0, y: 0, w: 10, h: 10 }, 100, 0, [{ x: 20, y: 0, w: 4, h: 10 }]).x, 10);
});
test('insideAny', () => {
  assert.equal(Collide.insideAny({ x: 5, y: 5, w: 2, h: 2 }, [{ x: 0, y: 0, w: 10, h: 10 }]), true);
});
