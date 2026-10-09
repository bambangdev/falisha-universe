const test = require('node:test');
const assert = require('node:assert/strict');
const Input = require('../js/core/input.js');

test('panah kiri memberi dx -1', () => {
  Input.reset(); Input.keyDown('ArrowLeft');
  assert.deepEqual(Input.axis(), { dx: -1, dy: 0 });
});
test('pressed hanya sekali per frame walau tombol ditahan', () => {
  Input.reset(); Input.keyDown(' ');
  assert.equal(Input.pressed('action'), true);
  Input.endFrame();
  assert.equal(Input.pressed('action'), false);
});
test('joystick punya deadzone 0.25', () => {
  Input.reset(); Input.setJoystick(0.1, 0.9);
  assert.deepEqual(Input.axis(), { dx: 0, dy: 0.9 });
});
test('reset mengosongkan keyboard dan joystick', () => {
  Input.keyDown('ArrowRight'); Input.setJoystick(1, 1); Input.reset();
  assert.deepEqual(Input.axis(), { dx: 0, dy: 0 });
});
test('gabungan keyboard + joystick di-clamp -1..1', () => {
  Input.reset(); Input.keyDown('d'); Input.setJoystick(0.8, 0);
  assert.equal(Input.axis().dx, 1);
});
