const test = require('node:test');
const assert = require('node:assert/strict');
global.Collide = require('../js/core/collide.js');
const Player = require('../js/world/player.js');

test('jalan ke kanan 0.5 dtk = 80 px dan menghadap kanan', () => {
  const p = Player.create(100, 100);
  Player.update(p, { dx: 1, dy: 0 }, 0.5, []);
  assert.equal(p.x, 180); assert.equal(p.face, 'right');
});
test('diagonal dinormalisasi: jarak 160 per detik', () => {
  const p = Player.create(0, 0);
  Player.update(p, { dx: 1, dy: 1 }, 1, []);
  assert.ok(Math.abs(Math.hypot(p.x, p.y) - 160) < 0.01);
});
test('berhenti: frame berdiri dan tidak bergerak', () => {
  const p = Player.create(0, 0);
  Player.update(p, { dx: 1, dy: 0 }, 0.1, []);
  Player.update(p, { dx: 0, dy: 0 }, 0.1, []);
  assert.equal(p.frame, 1); assert.equal(p.moving, false);
});
test('animasi jalan siklus [0,1,2,1] @ 8 fps', () => {
  const p = Player.create(0, 0);
  Player.update(p, { dx: 0, dy: 1 }, 0.25, []);
  assert.equal(p.frame, 2);
});
test('tembok di kanan menahan pemain', () => {
  const p = Player.create(0, 0);
  Player.update(p, { dx: 1, dy: 0 }, 1, [{ x: 50, y: -100, w: 20, h: 300 }]);
  assert.equal(p.x, 50 - p.w);
});
test('frontRect saat menghadap atas berada di atas kotak kaki', () => {
  const p = Player.create(100, 100, 'up');
  const r = Player.frontRect(p);
  assert.ok(r.y + r.h <= p.y);
  assert.deepEqual([r.w, r.h], [28, 28]);
});
