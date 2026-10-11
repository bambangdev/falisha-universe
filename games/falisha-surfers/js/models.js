/* Model 3D: aktor (sprite Nano Banana atau chibi 3D sementara), kereta, rintangan, koin, item, dekor. */
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
function cellTexture(cell) {
  if (!cell) return null;
  if (!cell.tex) { cell.tex = new THREE.CanvasTexture(cell.cv); cell.tex.colorSpace = THREE.SRGBColorSpace; }
  return cell.tex;
}
const rnd = (a, b) => a + Math.random() * (b - a);

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
    const img = c.id === 'satpam' ? null : faceImage(c.id);
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
    } else { // wajah kartun sederhana (Pak Satpam)
      g.fillStyle = '#1b1b1b';
      g.beginPath(); g.ellipse(108, 122, 9, 12, 0, 0, 7); g.ellipse(148, 122, 9, 12, 0, 0, 7); g.fill();
      g.fillStyle = '#fff'; g.beginPath(); g.arc(111, 118, 3, 0, 7); g.arc(151, 118, 3, 0, 7); g.fill();
      g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(128, 168, 30, 9, 0, 0, 7); g.fill();
      g.fillStyle = '#a8603f'; g.beginPath(); g.ellipse(128, 148, 9, 7, 0, 0, 7); g.fill();
    }
    tex.needsUpdate = true;
  };
  paint();
  const img = c.id !== 'satpam' && faceImage(c.id);
  if (img && !img.complete) img.addEventListener('load', paint, { once: true });
  return tex;
}
function stripeTexture(cols) {
  return canvas(64, 64, (g) => { cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(0, i * 64 / cols.length, 64, 64 / cols.length); }); });
}

const capsule = (r, len, m) => new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.01, len), 6, 14), m);
const sphere = (r, m, ...a) => new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18, ...a), m);

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
    // torso
    const torso = capsule(tr, torsoH - tr * 1.4, shirt); torso.position.y = hipY + torsoH / 2; torso.scale.z = 0.85; body.add(torso);
    if (c.dress) {
      const sk = new THREE.Mesh(new THREE.CylinderGeometry(tr * 0.95, tr * 1.55, h * 0.24, 22, 1, true), mat(c.dress, { side: THREE.DoubleSide }));
      sk.position.y = hipY + h * 0.06; body.add(sk);
      const bib = new THREE.Mesh(new THREE.BoxGeometry(tr * 1.2, torsoH * 0.5, 0.02), mat(c.dress)); bib.position.set(0, hipY + torsoH * 0.45, tr * 0.86); body.add(bib);
    }
    if (c.pack) {
      const bp = new THREE.Mesh(new THREE.BoxGeometry(tr * 1.5, torsoH * 0.75, tr * 0.8), mat(c.pack, { roughness: 0.5 }));
      bp.position.set(0, hipY + torsoH * 0.55, -tr * 1.05); body.add(bp);
    }
    // kepala
    const head = sphere(headR, new THREE.MeshStandardMaterial({ map: headTexture(c), roughness: 0.65 }));
    head.position.y = hipY + torsoH + headR * 0.8; body.add(head); this.head = head;
    this.addHair(c, head, headR, hair, tr, h);
    // lengan & kaki
    const armR = h * 0.045, armL = h * 0.25;
    this.arms = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * (tr + armR * 0.8), hipY + torsoH - tr * 0.55, 0); body.add(p);
      const a = capsule(armR, armL - armR * 2, shirt); a.position.y = -armL / 2; p.add(a);
      const hand = sphere(armR * 1.25, skin); hand.position.y = -armL; p.add(hand);
      p.rotation.z = s * 0.12; return p;
    });
    const legR = h * 0.06;
    this.legs = [-1, 1].map(s => {
      const p = new THREE.Group(); p.position.set(s * tr * 0.5, hipY, 0); body.add(p);
      const l = capsule(legR, legL - legR * 2, pants); l.position.y = -legL / 2; p.add(l);
      const f = capsule(legR * 1.15, legR * 1.6, shoe); f.rotation.x = Math.PI / 2; f.position.set(0, -legL - footH * 0.2, legR * 0.7); p.add(f);
      return p;
    });
    // jetpack & hoverboard
    this.jet = new THREE.Group();
    [-1, 1].forEach(s => {
      const t = capsule(tr * 0.32, torsoH * 0.6, mat('#d32f2f', { metalness: 0.3, roughness: 0.35 })); t.position.set(s * tr * 0.4, 0, 0); this.jet.add(t);
      const fl = new THREE.Mesh(new THREE.ConeGeometry(tr * 0.3, torsoH * 0.7, 12), new THREE.MeshBasicMaterial({ color: 0xffb020, transparent: true, opacity: 0.85 }));
      fl.rotation.x = Math.PI; fl.position.set(s * tr * 0.4, -torsoH * 0.65, 0); this.jet.add(fl);
    });
    this.jet.position.set(0, hipY + torsoH * 0.5, -tr * 1.2); this.jet.visible = false; body.add(this.jet);
    this.board = makeBoard(h); this.board.visible = false; this.root.add(this.board);
    this.root.traverse(o => { if (o.isMesh) o.castShadow = false; });
    this.phase = 0; this.hover = false;
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
    } else if (c.hair === 'cap') {
      head.add(front(0.9, P * 0.25, P * 0.3, 1.02));
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.08, r * 1.0, r * 0.55, 28), mat(c.hairC, { roughness: 0.6 }));
      cap.position.y = r * 0.6; head.add(cap);
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.75, r * 0.75, r * 0.07, 24, 1, false, -P / 2, P), mat('#111111', { roughness: 0.3 }));
      brim.position.set(0, r * 0.38, r * 0.55); head.add(brim);
      const badge = sphere(r * 0.14, mat('#f2c230', { metalness: 0.6, roughness: 0.3 })); badge.position.set(0, r * 0.7, r * 1.02); head.add(badge);
    }
  }
  /* pose: run|jump|fall|roll|stumble|jet|hover|idle|caught ; lean -1..1 */
  update(dt, pose, speed, lean = 0) {
    const r = this.rig, [aL, aR] = this.arms, [lL, lR] = this.legs;
    this.jet.visible = pose === 'jet'; this.board.visible = pose === 'hover' || this.hover;
    if (pose !== 'roll') { r.rotation.x = 0; r.position.y = this.pivotY; this.body.scale.set(1, 1, 1); }
    r.rotation.z += ((-lean * 0.28) - r.rotation.z) * Math.min(1, dt * 12);
    if (pose === 'run' || pose === 'hover' || pose === 'idle') {
      this.phase += dt * (pose === 'idle' ? 2 : 4 + speed * 0.28) * (pose === 'hover' ? 0.15 : 1);
      const s = Math.sin(this.phase), k = pose === 'hover' ? 0.15 : pose === 'idle' ? 0.08 : 1;
      lL.rotation.x = s * 0.95 * k; lR.rotation.x = -s * 0.95 * k;
      aL.rotation.x = -s * 0.85 * k; aR.rotation.x = s * 0.85 * k;
      r.position.y = this.pivotY + Math.abs(Math.cos(this.phase)) * 0.05 * this.c.h * k;
      r.rotation.x = pose === 'run' ? 0.12 : 0;
      if (pose === 'hover') { lL.rotation.x = -0.35; lR.rotation.x = 0.35; aL.rotation.z = -0.9; aR.rotation.z = 0.9; }
      else { aL.rotation.z = -0.12; aR.rotation.z = 0.12; }
    } else if (pose === 'jump' || pose === 'fall') {
      lL.rotation.x = -1.1; lR.rotation.x = 0.5; aL.rotation.x = -2.6; aR.rotation.x = -2.2;
    } else if (pose === 'roll') {
      r.rotation.x += dt * 16; r.position.y = this.pivotY * 0.6; this.body.scale.set(0.9, 0.75, 0.9);
      lL.rotation.x = lR.rotation.x = -1.8; aL.rotation.x = aR.rotation.x = -1.6;
    } else if (pose === 'stumble' || pose === 'caught') {
      this.phase += dt * 20; r.rotation.x = pose === 'caught' ? -0.25 : 0.45;
      aL.rotation.x = -2 + Math.sin(this.phase) * 0.8; aR.rotation.x = -2 - Math.sin(this.phase) * 0.8;
      lL.rotation.x = 0.4; lR.rotation.x = -0.4;
    } else if (pose === 'jet') {
      lL.rotation.x = 0.25; lR.rotation.x = 0.15; aL.rotation.x = aR.rotation.x = -0.5; r.rotation.x = 0.35;
      this.jet.children.forEach(o => { if (o.geometry.type === 'ConeGeometry') o.scale.y = 0.8 + Math.random() * 0.5; });
    }
  }
}

function makeBoard(h) {
  const g = new THREE.Group();
  const deck = capsule(0.22, 0.9, mat('#16c1ff', { roughness: 0.25, metalness: 0.2 })); deck.rotation.x = Math.PI / 2; deck.scale.y = 1; deck.scale.z = 0.25;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.03, 1.1), mat('#ffe14a', { emissive: '#ffb000', emissiveIntensity: 0.5 }));
  stripe.position.y = 0.06; g.add(deck, stripe);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.55, 24), new THREE.MeshBasicMaterial({ color: 0x5ff0ff, transparent: true, opacity: 0.35 }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.08; glow.scale.set(0.6, 1.4, 1); g.add(glow);
  g.position.y = 0.08; return g;
}

/* ---------- aktor sprite Nano Banana (billboard menghadap kamera) ---------- */
const FR = { run: [0, 1, 2, 3], jump: 4, fall: 5, roll: 6, stumble: 7, leanL: 8, leanR: 9, hover: 10, jet: 11, idle: 12, cheer: 13, caught: 14 };
export class SpriteActor {
  constructor(cells, h, map = FR) {
    this.cells = cells; this.map = map; this.h = h;
    const run = map.run.map(i => cells[i]).filter(Boolean), ref = run.length ? run : cells.filter(Boolean);
    const avg = f => ref.reduce((s, c) => s + f(c), 0) / ref.length;
    const figH = avg(c => c.y1 - c.y0), base = avg(c => c.y1), cx = avg(c => (c.x0 + c.x1) / 2), c0 = ref[0];
    this.planeH = h * c0.h / figH; this.planeW = this.planeH * c0.w / c0.h;
    this.root = new THREE.Group();
    const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, 0.5, 0);
    this.mat = new THREE.MeshBasicMaterial({ transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.scale.set(this.planeW, this.planeH, 1);
    this.mesh.position.set(-(cx - c0.w / 2) / c0.w * this.planeW, -(c0.h - base) / c0.h * this.planeH, 0);
    this.root.add(this.mesh); this.phase = 0; this.set(map.run[0]);
  }
  set(i) {
    const c = this.cells[i] || this.cells[this.map.run[0]];
    const t = cellTexture(c); if (this.mat.map !== t) { this.mat.map = t; this.mat.needsUpdate = true; }
  }
  update(dt, pose, speed, lean = 0) {
    const m = this.map;
    if (pose === 'run' || pose === 'idle-run') {
      if (Math.abs(lean) > 0.35 && this.cells[m.leanL]) return this.set(lean < 0 ? m.leanL : m.leanR);
      this.phase += dt * (3 + speed * 0.22); this.set(m.run[Math.floor(this.phase) % m.run.length]);
    } else if (pose === 'hover') this.set(this.cells[m.hover] ? m.hover : m.run[0]);
    else this.set(m[pose] ?? m.run[0]);
    this.mesh.rotation.z = -lean * 0.08;
  }
}

/* ---------- kereta KRL ---------- */
export function trainTextures(assets) {
  const side = assets.trainSide ? imgTexture(assets.trainSide) : canvas(512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d9dde3');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = '#e02424'; g.fillRect(0, h * 0.72, w, h * 0.1); g.fillStyle = '#ffcc1a'; g.fillRect(0, h * 0.83, w, h * 0.05);
    g.fillStyle = '#26303d';
    for (let x = 20; x < w; x += 82) { g.beginPath(); g.roundRect(x, h * 0.2, 56, h * 0.36, 10); g.fill(); }
    g.fillStyle = '#b8c0ca'; [150, 400].forEach(x => g.fillRect(x - 32, h * 0.12, 64, h * 0.6));
    g.fillStyle = '#3a4656'; [150, 400].forEach(x => { g.fillRect(x - 28, h * 0.17, 25, h * 0.3); g.fillRect(x + 3, h * 0.17, 25, h * 0.3); });
  });
  side.wrapS = THREE.RepeatWrapping;
  const front = assets.trainFront ? imgTexture(assets.trainFront) : canvas(256, 256, (g, w, h) => {
    g.fillStyle = '#f4f6f8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1d2733'; g.beginPath(); g.roundRect(26, 30, w - 52, 110, 22); g.fill();
    g.fillStyle = 'rgba(160,210,255,.35)'; g.beginPath(); g.moveTo(40, 40); g.lineTo(110, 40); g.lineTo(60, 128); g.lineTo(40, 128); g.fill();
    g.fillStyle = '#e02424'; g.fillRect(0, 160, w, 26); g.fillStyle = '#ffcc1a'; g.fillRect(0, 188, w, 10);
    g.fillStyle = '#fff6c0'; [60, 196].forEach(x => { g.beginPath(); g.arc(x, 222, 15, 0, 7); g.fill(); });
    g.fillStyle = '#222'; g.fillRect(90, 236, 76, 20);
  });
  return { side, front, aspect: assets.trainSide ? assets.trainSide.width / assets.trainSide.height : 2 };
}
const TRAIN_H = 3.2, TRAIN_W = 2.25;
export function makeTrain(tex, len, moving) {
  const g = new THREE.Group();
  const s = tex.side.clone(); s.needsUpdate = true; s.repeat.x = len / (2.85 * tex.aspect);
  const sideM = new THREE.MeshStandardMaterial({ map: s, roughness: 0.35, metalness: 0.1 });
  const frontM = new THREE.MeshStandardMaterial({ map: tex.front, roughness: 0.35, emissive: moving ? '#332200' : '#000', emissiveIntensity: 0.6 });
  const topM = mat('#8d96a3', { roughness: 0.5, metalness: 0.4 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(TRAIN_W, 2.85, len), [sideM, sideM, topM, topM, frontM, frontM]);
  body.position.y = 0.35 + 2.85 / 2; g.add(body);
  const bog = new THREE.Mesh(new THREE.BoxGeometry(TRAIN_W * 0.8, 0.4, len - 1), mat('#1c1f24'));
  bog.position.y = 0.2; g.add(bog);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(TRAIN_W * 0.5, 0.12, len * 0.8), mat('#5d6672', { metalness: 0.5 }));
  roof.position.y = TRAIN_H + 0.04; g.add(roof);
  if (moving) [-0.6, 0.6].forEach(x => {
    const lamp = sphere(0.16, new THREE.MeshBasicMaterial({ color: 0xfff6b0 })); lamp.position.set(x, 0.75, len / 2 + 0.02); g.add(lamp); });
  return g;
}
export { TRAIN_H, TRAIN_W };

export function makeRamp(len, h) {
  const g = new THREE.Group(), slope = Math.hypot(len, h);
  const tex = canvas(128, 256, (c, w, hh) => { c.fillStyle = '#ffc61a'; c.fillRect(0, 0, w, hh); c.fillStyle = '#222';
    for (let y = -w; y < hh; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + w); c.lineTo(w, y + w + 22); c.lineTo(0, y + 22); c.fill(); } });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(TRAIN_W * 0.95, 0.15, slope), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
  deck.rotation.x = Math.atan2(h, len); deck.position.set(0, h / 2, 0); g.add(deck);
  const leg = mat('#4b5563', { metalness: 0.5 });
  [-1, 1].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, h, 0.12), leg); p.position.set(s * TRAIN_W * 0.42, h / 2, -len / 2 + 0.1); g.add(p); });
  return g;
}

/* ---------- rintangan: low (lompat), high (guling), cart (lompat), boxes (lompat) ---------- */
export const OBST = {
  low: { y0: 0, y1: 1.0, w: 2.0, d: 0.35, cell: 0, sh: 1.05 },
  high: { y0: 1.15, y1: 2.6, w: 2.1, d: 0.35, cell: 1, sh: 2.05 },
  cart: { y0: 0, y1: 1.3, w: 1.7, d: 1.0, cell: 2, sh: 1.65 },
  boxes: { y0: 0, y1: 1.25, w: 1.5, d: 1.0, cell: 3, sh: 1.3 }
};
const stripes = (a, b) => canvas(256, 64, (g, w, h) => { g.fillStyle = a; g.fillRect(0, 0, w, h); g.fillStyle = b;
  for (let x = -h; x < w; x += 56) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + h, 0); g.lineTo(x + h + 26, 0); g.lineTo(x + 26, h); g.fill(); } });
let stripeRW, stripeYB;
export function makeObstacle(type, cells) {
  const o = OBST[type], cell = cells && cells[o.cell];
  if (cell) return billboard(cell, 0, o.sh);
  const g = new THREE.Group(), post = mat('#9aa3ad', { metalness: 0.6, roughness: 0.3 });
  stripeRW ||= stripes('#ffffff', '#e02424'); stripeYB ||= stripes('#ffd21a', '#1e1e1e');
  if (type === 'low') {
    [-0.85, 0.85].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.0, 10), post); p.position.set(x, 0.5, 0); g.add(p);
      const ft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.06, 0.6), post); ft.position.set(x, 0.03, 0); g.add(ft); });
    [0.75, 0.38].forEach(y => { const b = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.3, 0.1), new THREE.MeshStandardMaterial({ map: stripeRW, roughness: 0.4 })); b.position.y = y; g.add(b); });
  } else if (type === 'high') {
    [-1.0, 1.0].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 2.6, 10), post); p.position.set(x, 1.3, 0); g.add(p); });
    const b = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.75, 0.14), new THREE.MeshStandardMaterial({ map: stripeYB, roughness: 0.4 })); b.position.y = 1.95; g.add(b);
    const lamp = sphere(0.1, new THREE.MeshBasicMaterial({ color: 0xff3b30 })); lamp.position.set(0, 2.42, 0); g.add(lamp);
  } else if (type === 'cart') {
    const wood = mat('#a8642d', { roughness: 0.7 });
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.85, 0.9), wood); box.position.y = 0.75; g.add(box);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.6), new THREE.MeshStandardMaterial({ color: '#bfe6ff', transparent: true, opacity: 0.55, roughness: 0.1 }));
    glass.position.y = 1.38; g.add(glass);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.3, 16), mat('#c9ced6', { metalness: 0.8, roughness: 0.25 })); pot.position.set(0.3, 1.33, 0); g.add(pot);
    [-0.55, 0.55].forEach(x => { const w = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 8, 18), mat('#333')); w.rotation.y = Math.PI / 2; w.position.set(x, 0.22, 0.48); g.add(w); });
    const st = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.18, 0.92), mat('#e02424')); st.position.y = 0.9; g.add(st);
  } else {
    const cb = mat('#c8955a', { roughness: 0.85 }), tape = mat('#e8d3a8');
    [[0, 0.3, 0, 0.75], [0.05, 0.85, 0.05, 0.6], [-0.4, 0.3, 0.1, 0.55]].forEach(([x, y, r, s]) => {
      const b = new THREE.Mesh(new THREE.BoxGeometry(s * 1.3, s, s), cb); b.position.set(x + (s < 0.6 ? 0.45 : 0), y * (s < 0.6 && y < 0.5 ? 0.9 : 1), 0); b.rotation.y = r; g.add(b);
      const t = new THREE.Mesh(new THREE.BoxGeometry(s * 1.31, 0.02, s * 0.25), tape); t.position.copy(b.position); t.position.y += s / 2; t.rotation.y = r; g.add(t);
    });
  }
  return g;
}

export function billboard(cell, width, height) {
  const s = height ? height / (cell.y1 - cell.y0 + 1) : width / (cell.x1 - cell.x0 + 1), geo = new THREE.PlaneGeometry(cell.w * s, cell.h * s);
  geo.translate(-((cell.x0 + cell.x1) / 2 - cell.w / 2) * s, -(cell.h / 2 - cell.y1) * s, 0);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: cellTexture(cell), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide })));
  return g;
}

/* ---------- koin & item ---------- */
let coinGeo, coinMat;
export function makeCoin(cells) {
  const g = new THREE.Group();
  if (cells && cells[0]) { const b = billboard(cells[0], 0.75); b.children[0].geometry.translate(0, -0.37, 0); g.add(b); g.userData.flat = true; return g; }
  coinGeo ||= new THREE.CylinderGeometry(0.34, 0.34, 0.08, 26);
  coinMat ||= [mat('#e8a90c', { metalness: 0.75, roughness: 0.25 }), mat('#ffd23a', { metalness: 0.7, roughness: 0.2, emissive: '#7a5200', emissiveIntensity: 0.35 })];
  const c = new THREE.Mesh(coinGeo, [coinMat[0], coinMat[1], coinMat[1]]); c.rotation.x = Math.PI / 2; g.add(c); return g;
}
export const POWER = {
  magnet: { cell: 1, emoji: '🧲', color: '#ff4d4d', dur: 12 },
  jetpack: { cell: 2, emoji: '🚀', color: '#ff8a1a', dur: 8 },
  sneakers: { cell: 3, emoji: '👟', color: '#33d17a', dur: 12 },
  double: { cell: 4, emoji: '⭐', color: '#ffd21a', dur: 15 },
  board: { cell: 5, emoji: '🛹', color: '#22b8ff', dur: 0 },
  box: { cell: 6, emoji: '🎁', color: '#b06cff', dur: 0 }
};
const emojiTex = {};
export const emojiURL = k => iconCanvas(k).toDataURL();
function iconCanvas(k) {
  const p = POWER[k], cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 54, 10, 64, 64, 60); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, p.color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill();
  g.font = '64px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.emoji, 64, 70);
  return cv;
}
export function makePower(k, cells) {
  const g = new THREE.Group(), cell = cells && cells[POWER[k].cell];
  if (cell) { const b = billboard(cell, 1.15); b.children[0].geometry.translate(0, -0.55, 0); g.add(b); }
  else {
    if (!emojiTex[k]) { emojiTex[k] = new THREE.CanvasTexture(iconCanvas(k)); emojiTex[k].colorSpace = THREE.SRGBColorSpace; }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex[k] })); s.scale.set(1.3, 1.3, 1); g.add(s);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color: POWER[k].color, transparent: true, opacity: 0.7 }));
  g.add(ring); g.userData.ring = ring; return g;
}

/* ---------- dekor ---------- */
export function makeCatenary() {
  const g = new THREE.Group(), steel = mat('#7b8794', { metalness: 0.6, roughness: 0.35 });
  [-4.6, 4.6].forEach(x => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.22, 6.6, 0.22), steel); p.position.set(x, 3.3, 0); g.add(p); });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.18, 0.18), steel); bar.position.y = 6.4; g.add(bar);
  return g;
}
export function makeLamp(cells) {
  if (cells && cells[4]) return billboard(cells[4], 0, 3.8);
  const g = new THREE.Group(), m = mat('#2f7d4f', { metalness: 0.4, roughness: 0.4 });
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 4, 10), m); p.position.y = 2; g.add(p);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.08), m); arm.position.set(0.35, 3.95, 0); g.add(arm);
  const lamp = sphere(0.18, mat('#fff6d0', { emissive: '#ffe9a0', emissiveIntensity: 0.8 })); lamp.position.set(0.72, 3.8, 0); g.add(lamp);
  return g;
}
export function makeProp(cells) {
  const pick = Math.floor(Math.random() * 3);
  if (cells && cells[5 + pick]) return billboard(cells[5 + pick], 0, [1.4, 1.1, 2.8][pick]);
  const g = new THREE.Group();
  if (pick === 1) { // bangku merah-putih
    const r = mat('#e02424'), w = mat('#f4f4f4');
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.5), r); seat.position.y = 0.5; g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.08), w); back.position.set(0, 0.8, -0.22); g.add(back);
    [-0.7, 0.7].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.45), mat('#555')); l.position.set(x, 0.25, 0); g.add(l); });
  } else { // pot tanaman / pisang
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.28, 0.5, 16), mat(pick ? '#8a5a3c' : '#d0d6dd')); pot.position.y = 0.25; g.add(pot);
    for (let i = 0; i < 6; i++) {
      const lf = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), mat(i % 2 ? '#2e9e4f' : '#3fbf5f', { roughness: 0.7 }));
      lf.scale.set(0.45, 1.4, 0.2); const a = i / 6 * Math.PI * 2; lf.position.set(Math.cos(a) * 0.25, 0.95, Math.sin(a) * 0.25);
      lf.rotation.set(Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5); g.add(lf);
    }
  }
  return g;
}
const winTex = {};
export function makeBuilding(w, h, d) {
  const cols = ['#f2b880', '#9ad1d4', '#f7e1a6', '#e9a3b6', '#b8d98a', '#c9b6e4', '#f4f1ea'];
  const col = cols[Math.floor(Math.random() * cols.length)];
  if (!winTex[col]) winTex[col] = canvas(128, 128, (g) => {
    g.fillStyle = col; g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(0, 120, 128, 8);
    for (let y = 12; y < 120; y += 38) for (let x = 12; x < 128; x += 38) {
      g.fillStyle = '#5b7ea8'; g.beginPath(); g.roundRect(x, y, 24, 24, 5); g.fill();
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 3, y + 3, 8, 18);
    }
  });
  const t = winTex[col].clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(Math.max(1, Math.round(d / 3.5)), Math.max(1, Math.round(h / 3.5)));
  const sideM = new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }), roofM = mat('#b55239', { roughness: 0.8 });
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [sideM, sideM, mat('#8d8d8d'), sideM, sideM, sideM]); b.position.y = h / 2; g.add(b);
  if (Math.random() < 0.55) { // atap genteng
    const roof = new THREE.Mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, h * 0.25 + 1, 4), roofM); roof.rotation.y = Math.PI / 4; roof.scale.set(w / Math.max(w, d), 1, d / Math.max(w, d));
    roof.position.y = h + (h * 0.25 + 1) / 2; g.add(roof);
  }
  return g;
}
