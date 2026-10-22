/* Dunia 3D: renderer/kamera, pembangun level dari data misi, kendaraan (tank, chopper, heli) dan gerbang benteng. */
import * as THREE from '../../../shared/vendor/three.module.min.js';
import { mat, canvas, imgTexture } from './actors.js';

const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
const FOV = 40, TAN = Math.tan(FOV / 2 * Math.PI / 180);

/* ---------- renderer, kamera, cahaya ---------- */
export function createScene(cv) {
  const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: (devicePixelRatio || 1) <= 1.5, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 200);
  const hemi = new THREE.HemisphereLight('#eef7ff', '#8a7660', 1.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff0d8', 2.0); sun.position.set(6, 14, 10); scene.add(sun, sun.target);
  const cam = { z: 18 };
  function resize() {
    const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
    cam.z = 18 * Math.min(1.9, Math.max(1, 1.6 / camera.aspect)); camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize); resize();
  const halfW = () => cam.z * TAN * camera.aspect;
  return { renderer, scene, camera, sun, hemi, cam, resize, halfW };
}

/* ---------- tekstur prosedural ---------- */
function groundTex(kind) {
  return canvas(256, 256, (g, w, h) => {
    const base = { sand: '#e2c285', grass: '#6fae4a', steel: '#6c7480' }[kind] || '#888';
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = kind === 'sand' ? `hsl(40,${rnd(30, 55)}%,${rnd(58, 78)}%)` : kind === 'grass' ? `hsl(${rnd(90, 120)},${rnd(40, 60)}%,${rnd(30, 48)}%)` : `hsl(215,${rnd(5, 12)}%,${rnd(38, 56)}%)`;
      g.fillRect(rnd(0, w), rnd(0, h), rnd(2, 7), rnd(2, 5));
    }
    if (kind === 'steel') { g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 3; for (let x = 0; x <= w; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } g.beginPath(); g.moveTo(0, 8); g.lineTo(w, 8); g.stroke();
      g.fillStyle = '#ffd21a'; for (let x = 0; x < w; x += 48) g.fillRect(x, 230, 24, 10); }
  });
}
function platTex(kind) {
  return canvas(256, 64, (g, w, h) => {
    if (kind === 'wood') { g.fillStyle = '#9a6a3c'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.2)'; for (let x = 0; x < w; x += 42) g.fillRect(x, 0, 4, h); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(0, 0, w, 8); }
    else if (kind === 'sandbag') { g.fillStyle = '#b8a070'; g.fillRect(0, 0, w, h); g.fillStyle = '#9b8657'; for (let y = 0; y < h; y += 22) for (let x = (y / 22) % 2 ? 24 : 0; x < w; x += 48) { g.beginPath(); g.roundRect(x + 2, y + 2, 44, 18, 8); g.fill(); } }
    else { g.fillStyle = '#8a94a3'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd21a'; for (let x = 0; x < w; x += 40) g.fillRect(x, 0, 20, 8); g.fillStyle = 'rgba(0,0,0,.25)'; for (let x = 8; x < w; x += 32) { g.beginPath(); g.arc(x, 36, 4, 0, 7); g.fill(); } }
  });
}
function skyGradient(bg) {
  const c = { desert: ['#3fa0ff', '#bfe3ff', '#ffe9b0'], jungle: ['#2d8fe8', '#a8dcff', '#d9f3e0'], city: ['#1b1f5e', '#4b3f9e', '#ff9f6b'] }[bg];
  return canvas(4, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, c[0]); gr.addColorStop(0.6, c[1]); gr.addColorStop(1, c[2]); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
}
function silhouette(bg) {
  return canvas(1024, 256, (g, w, h) => {
    const col = { desert: '#c9975a', jungle: '#2f6d3c', city: '#2a2f58' }[bg];
    g.fillStyle = col;
    if (bg === 'desert') { g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 8) g.lineTo(x, 130 - Math.sin(x / 110) * 45 - Math.sin(x / 37) * 10); g.lineTo(w, h); g.fill(); }
    else if (bg === 'jungle') { for (let x = 0; x < w; x += rnd(26, 50)) { const r = rnd(30, 70); g.beginPath(); g.arc(x, 150, r, 0, 7); g.fill(); g.fillRect(x - 6, 150, 12, h); } }
    else { for (let x = 0; x < w; x += rnd(20, 44)) { const bh = rnd(50, 170), bw = rnd(18, 40); g.fillStyle = pick(['#2a2f58', '#343a6e', '#1f2347']); g.fillRect(x, h - bh, bw, bh);
      g.fillStyle = 'rgba(255,230,120,.7)'; for (let y = h - bh + 8; y < h - 8; y += 14) for (let wx = x + 4; wx < x + bw - 6; wx += 10) if (Math.random() < 0.5) g.fillRect(wx, y, 5, 7); } }
  });
}
function windowTex() {
  return canvas(128, 256, (g, w, h) => { g.fillStyle = pick(['#8fa3b8', '#9fb0c4', '#b0b8c0']); g.fillRect(0, 0, w, h);
    for (let y = 10; y < h; y += 26) for (let x = 10; x < w; x += 26) { g.fillStyle = Math.random() < 0.6 ? '#dff3ff' : '#3b4a5c'; g.fillRect(x, y, 16, 18); } });
}

/* ---------- props ---------- */
function palm(x, z) {
  const g = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.22, 4.2, 10), mat('#8b5a2b', { roughness: 0.9 })); trunk.position.y = 2.1; trunk.rotation.z = rnd(-0.12, 0.12); g.add(trunk);
  for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(new THREE.ConeGeometry(0.35, 2.2, 6), mat('#3fa34d')); l.position.set(0, 4.2, 0); l.rotation.z = Math.PI / 2 + rnd(-0.3, 0.3); l.rotation.y = i * Math.PI / 3; l.geometry.translate(0, -1.1, 0); g.add(l); }
  g.position.set(x, 0, z); return g;
}
function tree(x, z) {
  const g = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 2.6, 10), mat('#6b4a2b', { roughness: 0.9 })); trunk.position.y = 1.3; g.add(trunk);
  [[0, 3.2, 1.5], [-0.8, 2.6, 1.1], [0.8, 2.7, 1.1]].forEach(([dx, y, r]) => { const s = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), mat(pick(['#2f8f3c', '#3aa84a', '#237a32']))); s.position.set(dx, y, 0); g.add(s); });
  g.position.set(x, 0, z); return g;
}
function sandbags(x, z) {
  const g = new THREE.Group(); const m = mat('#b8a070', { roughness: 0.95 });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) { const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 8), m); b.rotation.z = Math.PI / 2; b.position.set((i - (3 - r) / 2) * 0.72, 0.24 + r * 0.42, 0); g.add(b); }
  g.position.set(x, 0, z); return g;
}
function crate(x, z) {
  const g = new THREE.Group(); const m = mat('#a8763e', { roughness: 0.8 });
  [[0, 0.5, 0, 1], [0.9, 0.4, 0.3, 0.8], [0.3, 1.4, 0, 0.8]].forEach(([dx, y, dz, s]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), m); b.position.set(dx, y, dz); g.add(b);
    const e = new THREE.Mesh(new THREE.BoxGeometry(s * 1.02, s * 0.12, s * 1.02), mat('#5a3a1a')); e.position.set(dx, y, dz); g.add(e); });
  g.position.set(x, 0, z); return g;
}
function lamp(x, z) {
  const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 5, 10), mat('#3b4a5c', { metalness: 0.6, roughness: 0.4 })); p.position.y = 2.5; g.add(p);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), new THREE.MeshStandardMaterial({ color: '#fff3b0', emissive: '#ffd36b', emissiveIntensity: 1.2 })); head.position.y = 5.1; g.add(head);
  g.position.set(x, 0, z); return g;
}
function building(x, z, w, h, d) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ map: windowTex(), roughness: 0.8 })); b.material.map.repeat.set(w / 2, h / 4); b.material.map.wrapS = b.material.map.wrapT = THREE.RepeatWrapping;
  b.position.set(x, h / 2, z); return b;
}
export function gate(x) {
  const g = new THREE.Group(); const m = mat('#555d6b', { metalness: 0.5, roughness: 0.5 }), red = mat('#8f1d2c', { roughness: 0.6 });
  [-1, 1].forEach(s => { const t = new THREE.Mesh(new THREE.BoxGeometry(1.6, 7.5, 2.4), m); t.position.set(s * 2.6, 3.75, -1.5); g.add(t);
    const top = new THREE.Mesh(new THREE.ConeGeometry(1.3, 1.4, 4), red); top.position.set(s * 2.6, 8.2, -1.5); top.rotation.y = Math.PI / 4; g.add(top); });
  const arch = new THREE.Mesh(new THREE.BoxGeometry(6.8, 1.4, 2.4), m); arch.position.set(0, 7.0, -1.5); g.add(arch);
  const sign = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.0, 0.2), new THREE.MeshStandardMaterial({ map: canvas(256, 64, (g2, w, h) => { g2.fillStyle = '#ffd23f'; g2.fillRect(0, 0, w, h); g2.fillStyle = '#3a0d1a'; g2.font = 'bold 34px sans-serif'; g2.textAlign = 'center'; g2.fillText('BENTENG YANTO', w / 2, 44); }) })); sign.position.set(0, 7.0, -0.2); g.add(sign);
  g.position.x = x; return g;
}

/* ---------- level ---------- */
export function buildLevel(scene, m, bgImg) {
  const L = new THREE.Group(); L.name = 'level'; scene.add(L);
  const len = m.len;
  // tanah
  const gt = groundTex(m.ground); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set((len + 60) / 4, 2.5);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(len + 60, 1, 10), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.95 }));
  ground.position.set(len / 2, -0.5, -1); L.add(ground);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(len + 60, 0.5, 0.3), mat({ sand: '#c9a86a', grass: '#4f8a36', steel: '#3b4452' }[m.ground] || '#555')); edge.position.set(len / 2, -0.25, 4.1); L.add(edge);
  // platform
  const pm = {};
  for (const p of m.platforms) {
    const w = p.x1 - p.x0, t = pm[p.type] || (pm[p.type] = (() => { const tx = platTex(p.type); tx.wrapS = THREE.RepeatWrapping; return new THREE.MeshStandardMaterial({ map: tx, roughness: 0.85 }); })());
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.45, 3), t); b.position.set((p.x0 + p.x1) / 2, p.y - 0.225, 0); L.add(b);
    const legs = Math.max(2, Math.round(w / 3));
    for (let i = 0; i < legs; i++) { const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, p.y - 0.4, 8), mat(p.type === 'steel' ? '#4a5260' : p.type === 'wood' ? '#6b4a2b' : '#9b8657')); lg.position.set(p.x0 + 0.5 + i * (w - 1) / (legs - 1), (p.y - 0.4) / 2, -1.0); L.add(lg); }
  }
  // props di jalur
  for (const pr of m.props || []) {
    if (pr.k === 'palm') L.add(palm(pr.x, -2.2)); else if (pr.k === 'tree') L.add(tree(pr.x, -2.6)); else if (pr.k === 'sandbag') L.add(sandbags(pr.x, 1.8));
    else if (pr.k === 'crate') L.add(crate(pr.x, -1.6)); else if (pr.k === 'lamp') L.add(lamp(pr.x, 2.6)); else if (pr.k === 'gate') L.add(gate(pr.x));
  }
  // lapisan tengah: dekor acak per tema di z -5..-10
  for (let x = -6; x < len + 20; x += rnd(3, 6)) {
    const z = rnd(-10, -5);
    if (m.bg === 'desert') L.add(Math.random() < 0.5 ? palm(x, z) : sandbags(x, z));
    else if (m.bg === 'jungle') L.add(tree(x, z));
    else L.add(building(x, z - 6, rnd(2.5, 5), rnd(5, 14), rnd(3, 6)));
  }
  // latar siluet (z -12) dan latar jauh (z -40)
  const sil = new THREE.Mesh(new THREE.PlaneGeometry(len + 70, 11), new THREE.MeshBasicMaterial({ map: silhouette(m.bg), transparent: true, fog: false }));
  sil.material.map.wrapS = THREE.MirroredRepeatWrapping; sil.material.map.repeat.x = (len + 70) / 44; sil.position.set(len / 2, 5.5, -12); L.add(sil);
  const far = new THREE.Mesh(new THREE.PlaneGeometry(len + 110, 46), new THREE.MeshBasicMaterial({ fog: false, toneMapped: false }));
  if (bgImg) { const t = imgTexture(bgImg); t.wrapS = THREE.MirroredRepeatWrapping; t.repeat.x = (len + 110) / (46 * bgImg.width / bgImg.height); far.material.map = t; }
  else { far.material.map = skyGradient(m.bg); }
  far.position.set(len / 2, 12, -40); L.add(far);
  scene.background = new THREE.Color({ desert: '#3fa0ff', jungle: '#2d8fe8', city: '#1b1f5e' }[m.bg]);
  scene.fog = new THREE.Fog(scene.background, 45, 95);
  return L;
}
export function disposeLevel(scene, L) {
  if (!L) return; scene.remove(L);
  // material bersama dari mat() tidak punya map, jadi aman: hanya material bertekstur milik level yang dibuang
  L.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); } });
}

/* ---------- tank SV-001 ---------- */
export function makeTank() {
  const g = new THREE.Group(), body = mat('#6b8f3a', { roughness: 0.7 }), dark = mat('#2f3a22', { roughness: 0.8 }), metal = mat('#8a8f98', { metalness: 0.7, roughness: 0.35 });
  const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.0, 1.8), body); hull.position.y = 1.0; g.add(hull);
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 1.6), body); nose.position.set(1.8, 0.9, 0); nose.rotation.z = 0.5; g.add(nose);
  const turret = new THREE.Group(); turret.position.set(-0.2, 1.65, 0); g.add(turret); g.userData.turret = turret;
  const tur = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 1.2), body); tur.position.y = 0.1; turret.add(tur);
  const hatch = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.15, 16), dark); hatch.position.set(-0.1, 0.47, 0); turret.add(hatch);
  const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 2.0, 10), metal); gun.rotation.z = Math.PI / 2; gun.position.set(1.6, 0.15, 0); turret.add(gun);
  const vul = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 8), metal); vul.rotation.z = Math.PI / 2; vul.position.set(1.4, 0.4, 0.35); turret.add(vul);
  [-1, 1].forEach(s => { const tr = new THREE.Mesh(new THREE.BoxGeometry(3.5, 0.75, 0.32), dark); tr.position.set(0, 0.45, s * 0.98); g.add(tr);
    [-1.2, -0.4, 0.4, 1.2].forEach(x => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.36, 14), metal); w.rotation.x = Math.PI / 2; w.position.set(x, 0.4, s * 0.98); g.add(w); g.userData.wheels = (g.userData.wheels || []).concat(w); }); });
  const star = new THREE.Mesh(new THREE.CircleGeometry(0.28, 5), mat('#ffd23f', { emissive: '#ffd23f', emissiveIntensity: 0.3 })); star.position.set(-0.6, 1.0, 0.92); g.add(star);
  g.userData.mats = [body]; return g;
}
export function wreckTank(t) {
  t.traverse(o => { if (o.isMesh) o.material = mat('#3a3a3a', { roughness: 1 }); }); t.rotation.z = 0.12; t.position.y = -0.1;
}

/* ---------- helikopter (musuh, mini-boss, evakuasi) ---------- */
export function makeChopper(kind = 'enemy') {
  const g = new THREE.Group(); const col = kind === 'mini' ? '#b02a37' : kind === 'rescue' ? '#f2f4f7' : '#4a5a3a';
  const body = mat(col, { roughness: 0.5 }), dark = mat('#222', { metalness: 0.4 });
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 1.2, 6, 14), body); hull.rotation.z = Math.PI / 2; g.add(hull);
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10, 0, Math.PI), mat('#8fd3ff', { metalness: 0.3, roughness: 0.15 })); glass.position.set(1.0, 0.05, 0); glass.rotation.y = -Math.PI / 2; g.add(glass);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 2.2, 8), body); tail.rotation.z = Math.PI / 2; tail.position.set(-1.9, 0.15, 0); g.add(tail);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.08), body); fin.position.set(-2.9, 0.5, 0); g.add(fin);
  const rotor = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.05, 0.22), dark); rotor.position.y = 0.85; g.add(rotor); g.userData.rotor = rotor;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), dark); mast.position.y = 0.65; g.add(mast);
  const tr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.7, 0.1), dark); tr.position.set(-2.95, 0.5, 0.12); g.add(tr); g.userData.tailRotor = tr;
  [-1, 1].forEach(s => { const sk = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), dark); sk.rotation.z = Math.PI / 2; sk.position.set(0, -0.75, s * 0.45); g.add(sk); });
  if (kind === 'mini') { [-1, 1].forEach(s => { const gun = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.0, 8), dark); gun.rotation.z = Math.PI / 2; gun.position.set(0.6, -0.45, s * 0.6); g.add(gun); }); g.scale.setScalar(1.8); }
  if (kind === 'rescue') { const cross = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.02), mat('#e63946')); cross.position.set(-0.2, 0.1, 0.56); g.add(cross);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 4, 6), mat('#d9c38a')); rope.position.set(0, -2.7, 0); g.add(rope); g.scale.setScalar(1.5); }
  g.userData.kind = kind; return g;
}

/* ---------- bayangan bulat ---------- */
const shadowTex = canvas(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 2, 32, 32, 30); r.addColorStop(0, 'rgba(0,0,0,.45)'); r.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); });
export function makeShadow(s = 1.3) {
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(s, s * 0.6), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2; sh.position.y = 0.02; return sh;
}
