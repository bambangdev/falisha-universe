/* Efek & proyektil: pool InstancedMesh untuk peluru dan partikel, pool mesh untuk roket/bom/bola, ring ledakan, teks pop DOM. */
import * as THREE from '../../../shared/vendor/three.module.min.js';
import { mat } from './actors.js';

const rnd = (a, b) => a + Math.random() * (b - a);
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _c = new THREE.Color();
const COL = { p: '#ffd23f', H: '#ff9f1c', e: '#ff4d5a', vulcan: '#ffb703', kilat: '#fff36b', bossR: '#ff6b6b' };

function makeRocket() {
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.6, 10), mat('#d8dde6', { metalness: 0.5, roughness: 0.4 })); body.rotation.z = -Math.PI / 2; g.add(body);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.3, 10), mat('#ff4d5a')); tip.rotation.z = -Math.PI / 2; tip.position.x = 0.45; g.add(tip);
  const fl = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 8), new THREE.MeshBasicMaterial({ color: '#ffb020', toneMapped: false })); fl.rotation.z = Math.PI / 2; fl.position.x = -0.45; g.add(fl); g.userData.flame = fl;
  return g;
}
class Pool {
  constructor(scene, n, make) { this.items = Array.from({ length: n }, () => { const o = make(); o.visible = false; scene.add(o); return { o, owner: null }; }); }
  begin() { for (const it of this.items) it.used = false; }
  get(owner) {
    let it = this.items.find(i => i.owner === owner) || this.items.find(i => !i.used && !i.owner) || this.items.find(i => !i.used);
    if (!it) return null; it.owner = owner; it.used = true; it.o.visible = true; return it.o;
  }
  end() { for (const it of this.items) if (!it.used) { it.owner = null; it.o.visible = false; } }
}

export class FX {
  constructor(scene, popsEl) {
    this.scene = scene; this.popsEl = popsEl;
    this.shake = 0;
    // peluru kotak (instanced)
    this.bMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.16, 0.16), new THREE.MeshBasicMaterial({ toneMapped: false }), 160);
    this.bMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.bMesh.frustumCulled = false; scene.add(this.bMesh);
    // partikel (instanced)
    this.pMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), new THREE.MeshBasicMaterial({ toneMapped: false }), 320);
    this.pMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); this.pMesh.frustumCulled = false; scene.add(this.pMesh);
    this.parts = [];
    this.rockets = new Pool(scene, 14, makeRocket);
    this.balls = new Pool(scene, 24, () => new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshStandardMaterial({ color: '#3a5a28', roughness: 0.6 })));
    this.rings = new Pool(scene, 12, () => new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 32), new THREE.MeshBasicMaterial({ color: '#fff', transparent: true, toneMapped: false })));
    this.ringList = [];
    this.pops = []; this.popPool = [];
  }
  /* ---- partikel ---- */
  spark(x, y, color = '#fff', n = 8, z = 1.3) {
    for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), s = rnd(0.05, 0.17); this.parts.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s + 0.02, life: 12 + rnd(0, 10), color, size: 1 }); }
  }
  smoke(x, y, z = 1.3) { this.parts.push({ x, y, z, vx: rnd(-0.02, 0.02), vy: rnd(0.01, 0.03), life: 14, color: '#ced4da', size: 1.2, g: 0 }); }
  explosion(x, y, scale = 1, z = 1.4) {
    this.shake = Math.max(this.shake, 0.15 * scale);
    for (let k = 0; k < 4; k++) this.ringList.push({ x, y, z, r: 0.2 + k * 0.3, vr: 0.15 * scale, life: 24 + k * 4, t: 0, color: k % 2 ? '#ff9f1c' : '#fff' });
    for (let i = 0; i < 18 * scale; i++) { const a = rnd(0, 6.28), s = rnd(0.05, 0.2) * scale; this.parts.push({ x, y, z, vx: Math.cos(a) * s, vy: Math.sin(a) * s + 0.05, life: 20 + rnd(0, 16), color: ['#ff4d5a', '#ffd23f', '#ff9f1c', '#fff'][rnd(0, 4) | 0], size: 1.3 * scale }); }
  }
  /* ---- teks pop (DOM) ---- */
  pop(x, y, text, color = '#fff', size = 16) {
    let el = this.popPool.pop(); if (!el) { el = document.createElement('span'); el.className = 'pop'; this.popsEl.appendChild(el); }
    el.textContent = text; el.style.color = color; el.style.fontSize = size + 'px'; el.style.display = 'block';
    this.pops.push({ x, y, el, life: 40, t: 0 });
  }
  /* ---- langkah logika 60 Hz ---- */
  step() {
    if (this.shake > 0) { this.shake *= 0.85; if (this.shake < 0.008) this.shake = 0; }
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy -= p.g ?? 0.006; p.life--; }
    this.parts = this.parts.filter(p => p.life > 0);
    if (this.parts.length > 320) this.parts.splice(0, this.parts.length - 320);
    for (const r of this.ringList) { r.r += r.vr; r.life--; r.t++; }
    this.ringList = this.ringList.filter(r => r.life > 0);
    for (const p of this.pops) { p.y += 0.02; p.life--; }
    for (const p of this.pops) if (p.life <= 0) { p.el.style.display = 'none'; this.popPool.push(p.el); }
    this.pops = this.pops.filter(p => p.life > 0);
  }
  /* ---- sinkron visual: bullets[] = {x,y,vx,vy,kind,isRocket,size}, bombs[] = {x,y,kind} ---- */
  sync(camera, bullets, bombs, w, h) {
    const bm = this.bMesh; let n = 0;
    this.rockets.begin(); this.balls.begin();
    for (const b of bullets) {
      if (b.isRocket) {
        const r = this.rockets.get(b); if (!r) continue;
        r.position.set(b.x, b.y, 1.2); r.rotation.z = Math.atan2(b.vy, b.vx); r.userData.flame.scale.y = rnd(0.7, 1.3); continue;
      }
      if (b.kind === 'bakso' || b.kind === 'tinju' || b.kind === 'kopi') {
        const s = this.balls.get(b); if (!s) continue;
        s.material.color.set(b.kind === 'bakso' ? '#d9b38c' : b.kind === 'tinju' ? '#ff4d5a' : '#6f4e37');
        s.position.set(b.x, b.y, 1.2); const sc = b.kind === 'tinju' ? 2.6 : b.kind === 'kopi' ? 2.0 : 1.0; s.scale.setScalar(sc); s.rotation.z -= 0.2; continue;
      }
      if (n >= bm.count) continue;
      const len = b.kind === 'kilat' ? 2.2 : b.kind === 'e' ? 0.7 : 1, th = b.kind === 'kilat' ? 1.4 : b.kind === 'e' ? 1.4 : 1;
      _q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(b.vy, b.vx)); _s.set(len, th, th); _p.set(b.x, b.y, 1.2);
      bm.setMatrixAt(n, _m.compose(_p, _q, _s)); bm.setColorAt(n, _c.set(COL[b.kind] || COL.p)); n++;
    }
    bm.count = n; bm.instanceMatrix.needsUpdate = true; if (bm.instanceColor) bm.instanceColor.needsUpdate = true;
    for (const b of bombs) {
      const s = this.balls.get(b); if (!s) continue;
      s.material.color.set(b.isCannon ? '#ffd23f' : b.kind === 'ebomb' ? '#2b2b2b' : '#3a5a28');
      s.position.set(b.x, b.y, 1.2); s.scale.setScalar(b.isCannon ? 1.3 : b.kind === 'ebomb' ? 1.6 : 1); s.rotation.z += 0.15;
    }
    this.rockets.end(); this.balls.end();
    // partikel
    const pm = this.pMesh; let k = 0;
    for (const p of this.parts) { if (k >= pm.count) break; _s.setScalar(p.size * (0.5 + p.life / 30)); _p.set(p.x, p.y, p.z); pm.setMatrixAt(k, _m.compose(_p, _q.identity(), _s)); pm.setColorAt(k, _c.set(p.color)); k++; }
    pm.count = k; pm.instanceMatrix.needsUpdate = true; if (pm.instanceColor) pm.instanceColor.needsUpdate = true;
    // ring
    this.rings.begin();
    for (const r of this.ringList) { const o = this.rings.get(r); if (!o) continue; o.position.set(r.x, r.y, r.z); o.scale.setScalar(r.r); o.material.color.set(r.color); o.material.opacity = Math.max(0, r.life / 28); o.quaternion.copy(camera.quaternion); }
    this.rings.end();
    // pop teks
    for (const p of this.pops) {
      _p.set(p.x, p.y, 1.3).project(camera);
      p.el.style.transform = `translate(${((_p.x + 1) / 2 * w) | 0}px, ${((1 - _p.y) / 2 * h) | 0}px) translate(-50%,-100%)`;
      p.el.style.opacity = Math.min(1, p.life / 12);
    }
  }
  reset() { this.parts = []; this.ringList = []; for (const p of this.pops) { p.el.style.display = 'none'; this.popPool.push(p.el); } this.pops = []; this.shake = 0;
    this.rockets.begin(); this.rockets.end(); this.balls.begin(); this.balls.end(); this.rings.begin(); this.rings.end(); this.bMesh.count = 0; this.pMesh.count = 0; }
  count() { return this.parts.length; }
}
