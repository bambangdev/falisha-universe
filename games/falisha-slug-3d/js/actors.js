/* Aktor: sprite Google Flow (billboard menghadap kamera) atau chibi 3D sementara berwajah foto. */
import * as THREE from '../../../shared/vendor/three.module.min.js';

const mats = new Map();
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0, ...o }));
  return mats.get(k);
}
export function canvas(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
export function imgTexture(img) {
  const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.needsUpdate = true; return t;
}
export function cellTexture(cell) {
  if (!cell) return null;
  if (!cell.tex) { cell.tex = new THREE.CanvasTexture(cell.cv); cell.tex.colorSpace = THREE.SRGBColorSpace; }
  return cell.tex;
}
const rnd = (a, b) => a + Math.random() * (b - a);

/* Semua billboard didaftarkan agar menghadap kamera tiap frame (kompensasi tilt kamera). */
const billboards = new Set();
export function faceCamera(camera) { for (const m of billboards) m.quaternion.copy(camera.quaternion); }

/* ---------- wajah dari foto, ditempel di bagian depan bola kepala ---------- */
const faceImgs = {};
function faceImage(id) {
  if (!faceImgs[id]) { const i = new Image(); i.src = `assets/faces/${id}.jpg`; faceImgs[id] = i; }
  return faceImgs[id];
}
function headTexture(c) {
  const tex = canvas(512, 256, () => {});
  const cv = tex.image, g = cv.getContext('2d');
  const paint = () => {
    g.fillStyle = c.skin; g.fillRect(0, 0, 512, 256);
    const img = c.face === 'cartoon' ? null : faceImage(c.id);
    if (img && img.complete && img.naturalWidth) {
      const fw = 168, fh = 184, off = document.createElement('canvas'); off.width = fw; off.height = fh;
      const o = off.getContext('2d');
      o.drawImage(img, 0, 0, fw, fh);
      o.globalCompositeOperation = 'destination-in';
      o.save(); o.translate(fw / 2, fh / 2); o.scale(1, fh / fw);
      const gr = o.createRadialGradient(0, 0, fw * 0.3, 0, 0, fw / 2);
      gr.addColorStop(0, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      o.fillStyle = gr; o.beginPath(); o.arc(0, 0, fw / 2, 0, 7); o.fill(); o.restore();
      g.drawImage(off, 128 - fw / 2, 50);
    } else { // wajah kartun sederhana (prajurit / Yanto)
      g.fillStyle = '#1b1b1b';
      g.beginPath(); g.ellipse(108, 122, 9, 12, 0, 0, 7); g.ellipse(148, 122, 9, 12, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(111, 118, 3, 0, 7); g.arc(151, 118, 3, 0, 7); g.fill();
      if (c.hair === 'goggles') { g.strokeStyle = '#111'; g.lineWidth = 5; g.beginPath(); g.moveTo(92, 104); g.lineTo(122, 112); g.moveTo(164, 104); g.lineTo(134, 112); g.stroke(); }
      g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(128, 168, c.hair === 'goggles' ? 22 : 30, 9, 0, 0, 7); g.fill();
      g.fillStyle = '#a8603f'; g.beginPath(); g.ellipse(128, 148, 9, 7, 0, 0, 7); g.fill();
    }
    tex.needsUpdate = true;
  };
  paint();
  const img = c.face !== 'cartoon' && faceImage(c.id);
  if (img && !img.complete) img.addEventListener('load', paint, { once: true });
  return tex;
}
function stripeTexture(cols) {
  return canvas(64, 64, (g) => { cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 64 / cols.length, 64, 64 / cols.length); }); });
}
export const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len), 6, 14), m);
export const sphere = (r, m, ...a) => new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18, ...a), m);

/* ---------- aktor chibi 3D sementara ---------- */
export class ChibiActor {
  constructor(c) {
    this.c = c; const h = c.h;
    this.root = new THREE.Group(); this.rig = new THREE.Group(); this.root.add(this.rig);
    const pivotY = h * 0.45; this.rig.position.y = pivotY; this.pivotY = pivotY;
    const body = new THREE.Group(); body.position.y = -pivotY; this.rig.add(body); this.body = body;
    const skin = mat(c.skin), shirt = c.stripe ? new THREE.MeshStandardMaterial({ map: stripeTexture(c.stripe), roughness: 0.7 }) : mat(c.shirt),
      pants = mat(c.pants), shoe = mat(c.shoe, { roughness: 0.4 }), hair = mat(c.hairC, { roughness: 0.8 });
    if (c.stripe) { shirt.map.wrapT = THREE.RepeatWrapping; shirt.map.repeat.set(1, 3); }
    const legL = h * 0.29, footH = h * 0.05, hipY = legL + footH, torsoH = h * 0.3, tr = h * 0.13, headR = h * 0.165;
    this.legL = legL; this.h = h;
    const torso = capsule(tr, torsoH - tr * 1.4, shirt); torso.position.y = hipY + torsoH / 2; torso.scale.z = 0.85; body.add(torso);
    if (c.dress) {
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(tr * 0.95, tr * 1.55, h * 0.24, 22, 1, true), mat(c.dress, { side: THREE.DoubleSide }));
      sk.position.y = hipY + h * 0.06; body.add(sk);
    }
    if (c.pack) {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(tr * 1.5, torsoH * 0.75, tr * 0.8), mat(c.pack, { roughness: 0.5 }));
      bp.position.set(0, hipY + torsoH * 0.55, -tr * 1.05); body.add(bp);
    }
    const head = sphere(headR, new THREE.MeshStandardMaterial({ map: headTexture(c), roughness: 0.65 }));
    head.position.y = hipY + torsoH + headR * 0.8; body.add(head); this.head = head;
    this.addHair(c, head, headR, hair, tr, h);
    const armR = h * 0.045, armL = h * 0.25;
    this.arms = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * (tr + armR * 0.8), hipY + torsoH - tr * 0.55, 0); body.add(p);
      const a = capsule(armR, armL - armR * 2, shirt); a.position.y = -armL / 2; p.add(a);
      const hand = sphere(armR * 1.25, skin); hand.position.y = -armL; p.add(hand);
      p.rotation.z = s * 0.12; return p;
    });
    // senjata kecil di tangan kanan
    const gun = new THREE.Mesh(new THREE.BoxGeometry(armR * 1.6, armR * 1.6, armL * 0.9), mat('#333a40', { metalness: 0.5, roughness: 0.4 }));
    gun.position.set(0, -armL, armL * 0.35); this.arms[1].add(gun); this.gun = gun;
    const legR = h * 0.06;
    this.legs = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * tr * 0.5, hipY, 0); body.add(p);
      const l = capsule(legR, legL - legR * 2, pants); l.position.y = -legL / 2; p.add(l);
      const f = capsule(legR * 1.15, legR * 1.6, shoe); f.rotation.x = Math.PI / 2; f.position.set(0, -legL - footH * 0.2, legR * 0.7); p.add(f);
      return p;
    });
    this.phase = 0; this.face = 1;
  }
  addHair(c, head, r, hair, tr, h) {
    const P = Math.PI, front = (open, th0, th1, rr) => sphere(r * rr, hair, P / 2 + open, 2 * P - open * 2, th0, th1);
    if (c.hair === 'bob') {
      head.add(front(0.85, 0, P * 0.72, 1.07));
      head.add(sphere(r * 1.08, hair, P / 2 - 0.95, 1.9, 0, P * 0.28));
    } else if (c.hair === 'curly') {
      for (let i = 0; i < 34; i++) {
        const th = rnd(0, P * 0.6), ph = rnd(0, 2 * P);
        if (Math.sin(ph) > 0.45 && th > P * 0.26) continue;
        const b = sphere(r * rnd(0.3, 0.42), hair); b.position.setFromSphericalCoords(r * 1.02, th, ph + P / 2); head.add(b);
      }
    } else if (c.hair === 'peci') {
      head.add(front(0.9, P * 0.3, P * 0.32, 1.02));
      const pc = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.94, r * 0.62, 28), mat('#111111', { roughness: 0.9 }));
      pc.position.y = r * 0.62; pc.rotation.x = -0.12; head.add(pc);
    } else if (c.hair === 'hijab') {
      head.add(front(0.95, 0, P * 0.95, 1.12));
      head.add(sphere(r * 1.13, hair, P / 2 - 1.0, 2.0, 0, P * 0.3));
      const dr = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.95, tr * 1.75, h * 0.17, 24, 1, true), mat(c.hairC, { side: THREE.DoubleSide, roughness: 0.85 }));
      dr.position.y = -r * 1.0; head.add(dr);
    } else if (c.hair === 'messy') {
      head.add(front(0.85, 0, P * 0.55, 1.06));
      head.add(sphere(r * 1.07, hair, P / 2 - 0.95, 1.9, 0, P * 0.22));
      for (let i = 0; i < 9; i++) {
        const t = new THREE.Mesh(new THREE.ConeGeometry(r * 0.22, r * 0.5, 8), hair);
        t.position.setFromSphericalCoords(r * 1.05, rnd(0.1, 0.9), rnd(0, 2 * P)); t.lookAt(t.position.clone().multiplyScalar(2)); t.rotateX(P / 2); head.add(t);
      }
    } else if (c.hair === 'helmet') {
      const hm = sphere(r * 1.12, mat(c.hairC, { roughness: 0.9 }), 0, 2 * P, 0, P * 0.5); hm.position.y = r * 0.12; head.add(hm);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.18, r * 1.18, r * 0.12, 24), mat(c.hairC, { roughness: 0.9 })); brim.position.y = r * 0.12; head.add(brim);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(r * 1.0, r * 0.05, 6, 24), mat('#2a2a2a')); strap.rotation.x = P / 2; strap.position.y = -r * 0.2; head.add(strap);
    } else if (c.hair === 'goggles') {
      head.add(front(0.9, 0, P * 0.5, 1.05));
      const band = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, r * 0.08, 8, 28), mat('#222222')); band.rotation.x = P / 2; band.position.y = r * 0.45; head.add(band);
      [-1, 1].forEach(s => { const gl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.26, r * 0.26, r * 0.16, 18), mat('#4cc9f0', { metalness: 0.4, roughness: 0.2 }));
        gl.rotation.x = P / 2; gl.position.set(s * r * 0.36, r * 0.5, r * 0.95); head.add(gl); });
    }
  }
  /* badan menyamping ke arah jalan, kepala menoleh ke kamera supaya wajah foto terlihat */
  setFace(f) { this.face = f; this.root.rotation.y = f * 1.15; this.head.rotation.y = -f * 0.8; }
  /* pose: idle run jump crouch shoot shootUp throw hurt cheer tied panic inTank special */
  update(dt, pose, speed = 0) {
    const r = this.rig, [aL, aR] = this.arms, [lL, lR] = this.legs;
    r.rotation.set(0, 0, 0); r.position.y = this.pivotY; this.body.scale.set(1, 1, 1);
    aL.rotation.set(0, 0, -0.12); aR.rotation.set(0, 0, 0.12); lL.rotation.set(0, 0, 0); lR.rotation.set(0, 0, 0);
    lL.visible = lR.visible = true; this.gun.visible = pose !== 'tied' && pose !== 'cheer' && pose !== 'panic';
    const moving = speed > 0.001;
    const runCycle = (k = 1, rate = 1) => {
      this.phase += dt * (4 + speed * 40) * rate;
      const s = Math.sin(this.phase);
      lL.rotation.x = s * 0.95 * k; lR.rotation.x = -s * 0.95 * k;
      r.position.y = this.pivotY + Math.abs(Math.cos(this.phase)) * 0.05 * this.h * k;
      return s;
    };
    if (pose === 'run' || (pose === 'shoot' && moving)) {
      const s = runCycle(); r.rotation.x = 0.12;
      if (pose === 'shoot') { aR.rotation.x = -1.5 + rnd(-0.08, 0.08); aL.rotation.x = -1.1; }
      else { aL.rotation.x = -s * 0.85; aR.rotation.x = s * 0.85; }
    } else if (pose === 'idle') {
      this.phase += dt * 2; const s = Math.sin(this.phase);
      aL.rotation.x = -s * 0.06; aR.rotation.x = s * 0.06; r.position.y = this.pivotY + s * 0.01 * this.h;
    } else if (pose === 'shoot') {
      aR.rotation.x = -1.5 + rnd(-0.08, 0.08); aL.rotation.x = -1.1; lL.rotation.x = 0.25; lR.rotation.x = -0.25;
    } else if (pose === 'shootUp') {
      aR.rotation.x = -2.95; aL.rotation.x = -0.6; lL.rotation.x = 0.2; lR.rotation.x = -0.2;
    } else if (pose === 'jump') {
      lL.rotation.x = -1.1; lR.rotation.x = 0.5; aL.rotation.x = -2.4; aR.rotation.x = -1.5;
    } else if (pose === 'crouch') {
      this.body.scale.set(1.05, 0.62, 1.05); r.position.y = this.pivotY - this.legL * 0.5;
      lL.rotation.x = -0.9; lR.rotation.x = 0.9; aR.rotation.x = -1.5; aL.rotation.x = -0.6;
    } else if (pose === 'throw') {
      aR.rotation.x = -2.6; aL.rotation.x = -0.8; r.rotation.x = -0.15;
    } else if (pose === 'hurt') {
      r.rotation.x = -0.45; aL.rotation.x = -2.2; aR.rotation.x = -2.0; aL.rotation.z = -0.8; aR.rotation.z = 0.8; lL.rotation.x = 0.5; lR.rotation.x = -0.3;
    } else if (pose === 'cheer') {
      this.phase += dt * 10; const s = Math.sin(this.phase);
      aL.rotation.x = aR.rotation.x = -2.8; aL.rotation.z = -0.5 + s * 0.2; aR.rotation.z = 0.5 - s * 0.2;
      r.position.y = this.pivotY + Math.max(0, s) * 0.12 * this.h; lL.rotation.x = -0.3 * Math.max(0, s); lR.rotation.x = -0.3 * Math.max(0, s);
    } else if (pose === 'tied') {
      r.position.y = this.pivotY - this.legL * 0.85; lL.rotation.x = lR.rotation.x = -1.45;
      aL.rotation.x = aR.rotation.x = 0.9; aL.rotation.z = -0.35; aR.rotation.z = 0.35; r.rotation.x = 0.1;
    } else if (pose === 'panic') {
      runCycle(1, 1.4); r.rotation.x = 0.2; aL.rotation.x = aR.rotation.x = -2.9; aL.rotation.z = -0.4; aR.rotation.z = 0.4;
    } else if (pose === 'inTank') {
      lL.visible = lR.visible = false; r.position.y = this.pivotY - this.h * 0.42; aL.rotation.x = -0.3; aR.rotation.x = -0.3;
    } else if (pose === 'special') {
      aL.rotation.x = aR.rotation.x = -1.55; aL.rotation.z = -0.2; aR.rotation.z = 0.2; lL.rotation.x = 0.4; lR.rotation.x = -0.4; r.rotation.x = 0.1;
    }
  }
}

/* ---------- aktor sprite Google Flow (plane billboard, kaki di y=0) ---------- */
const planeGeo = new THREE.PlaneGeometry(1, 1); planeGeo.translate(0, 0.5, 0);
export class SpriteActor {
  constructor(cells, h, map = cells.map) {
    this.cells = cells; this.map = map; this.h = h;
    const base = map.run ? map.run.map(i => cells[i]) : [cells[map.idle ?? 0]];
    const ref = base.filter(Boolean).length ? base.filter(Boolean) : cells.filter(Boolean);
    const avg = f => ref.reduce((s, c) => s + f(c), 0) / ref.length;
    const figH = avg(c => c.y1 - c.y0), bottom = avg(c => c.y1), cx = avg(c => (c.x0 + c.x1) / 2), c0 = ref[0];
    this.planeH = h * c0.h / figH; this.planeW = this.planeH * c0.w / c0.h;
    this.root = new THREE.Group();
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false });
    this.mesh = new THREE.Mesh(planeGeo, this.mat); this.mesh.scale.set(this.planeW, this.planeH, 1);
    this.mesh.position.set(-(cx - c0.w / 2) / c0.w * this.planeW, -(c0.h - bottom) / c0.h * this.planeH, 0);
    this.root.add(this.mesh); billboards.add(this.mesh);
    this.phase = 0; this.face = 1; this.set(map.idle ?? (map.run ? map.run[0] : 0));
  }
  setFace(f) { this.face = f; this.root.scale.x = f; }
  set(i) {
    const c = this.cells[i] || this.cells[this.map.idle ?? 0] || this.cells.find(Boolean);
    const t = cellTexture(c); if (this.mat.map !== t) { this.mat.map = t; this.mat.needsUpdate = true; }
  }
  update(dt, pose, speed = 0) {
    const m = this.map, cyc = m.run || m.walk;
    if ((pose === 'run' || pose === 'walk' || (pose === 'shoot' && speed > 0.001 && !m.shoot)) && cyc) {
      this.phase += dt * (4 + speed * 40); return this.set(cyc[Math.floor(this.phase) % cyc.length]);
    }
    if (pose === 'panic' && Array.isArray(m.panic)) { this.phase += dt * 10; return this.set(m.panic[Math.floor(this.phase) % m.panic.length]); }
    if (pose === 'broken' && Array.isArray(m.broken)) { this.phase += dt * 6; return this.set(m.broken[Math.floor(this.phase) % m.broken.length]); }
    const v = m[pose]; this.set(Array.isArray(v) ? v[0] : (v ?? m.idle ?? 0));
  }
  dispose() { billboards.delete(this.mesh); }
}

export function billboard(cell, width, height) {
  const s = height ? height / (cell.y1 - cell.y0 + 1) : width / (cell.x1 - cell.x0 + 1), geo = new THREE.PlaneGeometry(cell.w * s, cell.h * s);
  geo.translate(-((cell.x0 + cell.x1) / 2 - cell.w / 2) * s, -(cell.h / 2 - cell.y1) * s, 0);
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: cellTexture(cell), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, toneMapped: false }));
  g.add(m); billboards.add(m); g.userData.bb = m;
  return g;
}
export function disposeActor(a) { if (a?.dispose) a.dispose(); if (a?.userData?.bb) billboards.delete(a.userData.bb); }

/* ---------- pabrik aktor ---------- */
export function makeActor(c, cells, hScale = 1) {
  const a = cells ? new SpriteActor(cells, c.h * hScale, cells.map) : new ChibiActor(c);
  a.setFace(1); return a;
}

/* ---------- item (sprite Flow atau kotak berlabel emoji) ---------- */
const ICON = { H: '🔫', R: '🚀', food: '🍗', bomb: '💣', special: '⚡' };
const iconTex = {};
export function makeItem(kind, cells) {
  const cell = cells && cells[cells.map?.[kind]];
  if (cell) { const b = billboard(cell, 0, 1.0); b.userData.cell = true; return b; }
  if (!iconTex[kind]) iconTex[kind] = canvas(128, 128, (g) => { g.font = '92px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(ICON[kind] || '❔', 64, 70); });
  const g = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), mat(kind === 'food' ? '#ffb703' : kind === 'R' ? '#ff4d5a' : '#4cc9f0', { emissive: kind === 'R' ? '#ff4d5a' : '#1c6fa8', emissiveIntensity: 0.35, roughness: 0.4 }));
  box.position.y = 0.45; g.add(box);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: iconTex[kind], transparent: true, depthTest: false })); s.scale.set(0.8, 0.8, 1); s.position.y = 0.45; g.add(s);
  g.userData.spin = box; return g;
}
