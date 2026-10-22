/* Bos akhir: YANTO-01 MECH — mesh 3D prosedural, pilot Yanto (sprite Flow atau chibi) di kokpit. */
import * as THREE from '../../../shared/vendor/three.module.min.js';
import { mat, canvas } from './actors.js';

const rnd = (a, b) => a + Math.random() * (b - a);

export function makeMech() {
  const g = new THREE.Group(); const purple = mat('#5b2a86', { roughness: 0.5, metalness: 0.2 }), dark = mat('#2a2235', { roughness: 0.7 }), metal = mat('#9aa3b2', { metalness: 0.7, roughness: 0.35 });
  const legs = [-1, 1].map(s => {
    const lg = new THREE.Group(); lg.position.set(s * 1.4, 0, 0); g.add(lg);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 2.2, 12), dark); thigh.position.y = 2.1; lg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 12), purple); shin.position.y = 0.9; lg.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 1.4), metal); foot.position.set(-0.2, 0.25, 0); lg.add(foot);
    return lg;
  });
  const body = new THREE.Group(); body.position.y = 3.3; g.add(body); g.userData.body = body; g.userData.legs = legs;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 3.0), purple); hull.position.y = 1.3; body.add(hull);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.2, 0.4), dark); chest.position.set(0, 1.0, 1.6); body.add(chest);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: canvas(256, 64, (c, w, h) => { c.fillStyle = '#ffd23f'; c.fillRect(0, 0, w, h); c.fillStyle = '#3a0d1a'; c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('YANTO-01', w / 2, 46); }), toneMapped: false }));
  label.position.set(0, 1.0, 1.81); body.add(label);
  // kokpit kaca di atas, tempat Yanto
  const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1.15, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), new THREE.MeshStandardMaterial({ color: '#8fd3ff', transparent: true, opacity: 0.35, roughness: 0.1, metalness: 0.3, side: THREE.DoubleSide }));
  cockpit.position.set(0, 2.6, 0.2); body.add(cockpit); g.userData.seat = new THREE.Group(); g.userData.seat.position.set(0, 2.55, 0.2); body.add(g.userData.seat);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.12, 8, 28), metal); rim.rotation.x = Math.PI / 2; rim.position.set(0, 2.6, 0.2); body.add(rim);
  // meriam roket di sisi kiri (menghadap pemain yang datang dari kiri)
  const arm = new THREE.Group(); arm.position.set(-2.3, 1.6, 0.3); body.add(arm); g.userData.arm = arm;
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), dark); arm.add(shoulder);
  const pod = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.2), metal); pod.position.set(-1.0, -0.2, 0); arm.add(pod);
  for (let i = 0; i < 4; i++) { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 10), dark); tube.rotation.z = Math.PI / 2; tube.position.set(-1.8, 0.15 - (i >> 1) * 0.5, -0.3 + (i & 1) * 0.6); arm.add(tube); }
  // lengan kanan cakar
  const arm2 = new THREE.Group(); arm2.position.set(2.3, 1.6, 0.3); body.add(arm2);
  arm2.add(new THREE.Mesh(new THREE.SphereGeometry(0.7, 14, 10), dark));
  const claw = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.6, 6), metal); claw.rotation.z = -Math.PI / 2; claw.position.set(1.2, -0.4, 0); arm2.add(claw);
  // mata
  [-1, 1].forEach(s => { const eye = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff3b3b', emissive: '#ff2020', emissiveIntensity: 1.5 })); eye.position.set(s * 0.8, 1.9, 1.52); body.add(eye); });
  g.userData.mats = { purple, dark, metal };
  return g;
}

export function animateMech(g, t, boss) {
  const b = g.userData.body, [l1, l2] = g.userData.legs;
  if (boss.wreck) { g.rotation.z += (0.35 - g.rotation.z) * 0.05; b.position.y += (2.4 - b.position.y) * 0.05; return; }
  const s = Math.sin(t * 0.06);
  b.position.y = 3.3 + Math.abs(s) * 0.12; b.rotation.z = s * 0.02;
  l1.rotation.x = s * 0.08; l2.rotation.x = -s * 0.08;
  g.userData.arm.rotation.z = boss.shootCd < 20 ? -0.35 + rnd(-0.03, 0.03) : -0.1;
}

export function wreckMech(g) {
  g.traverse(o => { if (o.isMesh && o.material && !o.material.transparent) o.material = mat('#3a3a3a', { roughness: 1 }); });
}

/* Logika bos per frame. ctx: { P, t, spawnEnemyBullet, pop, spark, sfx, speak } */
export function updateBoss(boss, ctx) {
  if (boss.hp <= 0 || !boss.active) return;
  if (--boss.shootCd <= 0) {
    boss.shootCd = 110; ctx.sfx.rocket();
    boss.queue = [0, 8, 16, 24].map(d => ctx.t + d);
    ctx.pop(boss.x - 1, boss.y + 7.2, 'KERJAIN KUMON!', '#ff4d5a', 18);
    ctx.speak('Kerjain Kumon!');
  }
  if (boss.queue && boss.queue.length && ctx.t >= boss.queue[0]) {
    boss.queue.shift();
    ctx.spawnEnemyBullet({ x: boss.x - 3.8, y: boss.y + 4.9, vx: -0.1375 - rnd(0, 0.05), vy: rnd(-0.04, 0.04), dmg: 18, life: 100, kind: 'bossR', isRocket: true, r: 0.3 });
    ctx.spark(boss.x - 3.8, boss.y + 4.9, '#ff4d5a', 8);
  }
}
