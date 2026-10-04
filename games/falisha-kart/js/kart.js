/* Falisha Kart – karakter, fisika kart pemain, dan gambar kart prosedural */
const KartDB = (() => {
  const MAX_BASE = Mode7.SEG_LEN * 60; // 12000 = kecepatan penuh

  const CHARACTERS = [
    { id: 'falisha', name: 'Falisha', title: 'Si Kilat ⚡', color: '#ffdd33', dark: '#c79a00', accent: '#ff3333',
      maxSpeed: 1.00, accel: 0.92, handling: 0.92, emoji: '⚡', desc: 'Seimbang dan cepat!' },
    { id: 'arshad', name: 'Arshad', title: 'Si Berat 💪', color: '#37b24d', dark: '#1e6b2e', accent: '#8b5a2b',
      maxSpeed: 1.06, accel: 0.72, handling: 0.70, emoji: '💪', desc: 'Top speed tertinggi!' },
    { id: 'nono', name: 'Babah Nono', title: 'Si Teknik 🧵', color: '#ffe9b0', dark: '#c9a95e', accent: '#ffcc33',
      maxSpeed: 0.95, accel: 0.90, handling: 1.00, emoji: '🧵', desc: 'Tikungan paling stabil!' },
    { id: 'pupu', name: 'Ibu Pupu', title: 'Si Power 🍳', color: '#ff6b9d', dark: '#b83a6b', accent: '#ffe55c',
      maxSpeed: 0.97, accel: 1.00, handling: 0.85, emoji: '🍳', desc: 'Start paling galak!' },
    { id: 'baymax', name: 'Baymax', title: 'Si Raksasa 🤖', color: '#f2f2f2', dark: '#a8a8a8', accent: '#ff3333',
      maxSpeed: 1.03, accel: 0.75, handling: 0.80, emoji: '🤖', desc: 'Tahan banting!' },
  ];

  function createPlayer(char) {
    return {
      char, isPlayer: true,
      z: 0, x: 0, speed: 0, lap: 1, finished: false, finishTime: 0,
      item: null,                       // id item yang dipegang
      drift: { on: false, dir: 0, charge: 0 },
      boostT: 0, boostPow: 0,           // turbo sementara
      spinT: 0,                         // kena item -> spin
      starT: 0,                         // bintang: kebal + cepat
      offroad: false,
      progress: 0,                      // total jarak tempuh (untuk ranking)
      lastItemBox: -1,
    };
  }

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // input: {left,right,gas,brake,drift}
  function updatePlayer(p, input, dt, road) {
    const C = p.char, MAX = MAX_BASE * C.maxSpeed;
    if (p.finished) { p.speed = Math.max(0, p.speed - MAX * dt); p.z += p.speed * dt; p.progress += p.speed * dt; return; }
    if (p.spinT > 0) {
      p.spinT -= dt;
      p.speed = Math.max(0, p.speed - MAX * 2.5 * dt);
      p.z += p.speed * dt; p.progress += p.speed * dt;
      return;
    }

    // --- gas / rem ---
    const accelRate = MAX * 0.55 * C.accel;
    if (input.gas) p.speed += accelRate * dt;
    else if (input.brake) p.speed -= MAX * 1.1 * dt;
    else p.speed -= MAX * 0.18 * dt;

    // --- boost (mini-turbo / sambal petir / bintang) ---
    if (p.boostT > 0) {
      p.boostT -= dt;
      p.speed += MAX * 1.6 * p.boostPow * dt;
    }
    if (p.starT > 0) { p.starT -= dt; p.speed += MAX * 0.5 * dt; }

    // --- offroad: deselerasi kuat hanya sampai batas kecepatan offroad (biar tidak stuck total) ---
    p.offroad = Math.abs(p.x) > 1.08;
    const offLimit = MAX * 0.38;
    const limit = p.offroad ? offLimit : (p.boostT > 0 || p.starT > 0 ? MAX * 1.45 : MAX);
    if (p.offroad && p.starT <= 0 && p.speed > offLimit) p.speed -= MAX * 1.6 * dt;
    p.speed = clamp(p.speed, 0, limit);

    // --- belok + drift ---
    const spdPct = p.speed / MAX;
    const steer = (input.left ? -1 : 0) + (input.right ? 1 : 0);
    const wantDrift = input.drift && steer !== 0 && spdPct > 0.35;
    if (wantDrift) {
      if (!p.drift.on) { p.drift.on = true; p.drift.dir = steer; p.drift.charge = 0; }
      p.drift.charge += dt;
      p.x += steer * dt * 2.6 * C.handling * (0.6 + 0.4 * spdPct);
    } else {
      if (p.drift.on) { // lepas drift -> mini-turbo
        const ch = p.drift.charge;
        if (ch > 1.4) { p.boostT = 1.2; p.boostPow = 1; }
        else if (ch > 0.6) { p.boostT = 0.7; p.boostPow = 0.8; }
        p.drift.on = false; p.drift.charge = 0;
      }
      p.x += steer * dt * 2.1 * C.handling * (0.35 + 0.65 * spdPct);
    }

    // --- gaya sentrifugal di tikungan ---
    const seg = Mode7.findSegment(road, p.z + Mode7.PLAYER_Z);
    p.x -= dt * spdPct * spdPct * seg.curve * 0.32 * (p.drift.on ? 0.55 : 1);
    p.x = clamp(p.x, -2.2, 2.2);

    // --- maju ---
    p.z += p.speed * dt;
    p.progress += p.speed * dt;
    const tl = road.trackLength;
    if (p.z >= tl) { p.z -= tl; p.lap++; }
  }

  /* ---------- gambar kart prosedural (tampak belakang) ---------- */
  // x,y = tengah bawah kart; w = lebar px
  function drawKart(ctx, x, y, w, char, opts = {}) {
    const s = w / 100; // skala
    ctx.save();
    ctx.translate(x, y);
    if (opts.tilt) ctx.rotate(opts.tilt);
    // bayangan
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(0, -4 * s, 44 * s, 10 * s, 0, 0, 7); ctx.fill();
    // roda (4)
    ctx.fillStyle = '#222';
    const wy = -16 * s, ww = 14 * s, wh = 22 * s;
    ctx.fillRect(-46 * s, wy - wh / 2, ww, wh); ctx.fillRect(32 * s, wy - wh / 2, ww, wh);
    ctx.fillRect(-40 * s, -34 * s, ww * 0.85, wh * 0.8); ctx.fillRect(26 * s, -34 * s, ww * 0.85, wh * 0.8);
    ctx.fillStyle = '#888';
    ctx.fillRect(-46 * s, wy - 5 * s, ww, 10 * s); ctx.fillRect(32 * s, wy - 5 * s, ww, 10 * s);
    // bodi kart
    ctx.fillStyle = char.dark;
    ctx.beginPath(); ctx.roundRect(-38 * s, -44 * s, 76 * s, 34 * s, 8 * s); ctx.fill();
    ctx.fillStyle = char.color;
    ctx.beginPath(); ctx.roundRect(-34 * s, -42 * s, 68 * s, 26 * s, 7 * s); ctx.fill();
    // moncong depan
    ctx.fillStyle = char.accent;
    ctx.beginPath(); ctx.moveTo(-20 * s, -44 * s); ctx.lineTo(20 * s, -44 * s); ctx.lineTo(0, -58 * s); ctx.closePath(); ctx.fill();
    // pengemudi: badan + helm
    ctx.fillStyle = char.dark; ctx.fillRect(-14 * s, -70 * s, 28 * s, 30 * s);
    ctx.fillStyle = char.color;
    ctx.beginPath(); ctx.arc(0, -72 * s, 17 * s, 0, 7); ctx.fill();
    // visor helm
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.ellipse(0, -72 * s, 11 * s, 7 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.ellipse(-3 * s, -74 * s, 5 * s, 3 * s, -0.3, 0, 7); ctx.fill();
    // efek bintang (kebal)
    if (opts.star) {
      ctx.fillStyle = '#ffe55c';
      for (let i = 0; i < 6; i++) {
        const a = (Date.now() / 200 + i / 6 * Math.PI * 2);
        ctx.beginPath(); ctx.arc(Math.cos(a) * 46 * s, -40 * s + Math.sin(a) * 30 * s, 4 * s, 0, 7); ctx.fill();
      }
    }
    // asap drift
    if (opts.driftSmoke) {
      ctx.fillStyle = opts.driftSmoke;
      ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(-30 * s, -8 * s, 9 * s, 0, 7); ctx.arc(-38 * s, -4 * s, 7 * s, 0, 7); ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  return { CHARACTERS, MAX_BASE, createPlayer, updatePlayer, drawKart };
})();
