/* Falisha Kart Turbo – data pembalap & fisika kart (drift + mini-turbo, ramp, off-road, tabrakan) */
const MAXS = 8200;            // kecepatan maksimum dasar (unit dunia / detik)
const GRAV = 9000;
const CENT = 0.17;            // gaya sentrifugal di tikungan

const RACERS = {
  falisha: { name: 'FALISHA', cls: 'Kilat', top: 1.0, acc: 0.84, handle: 0.92, weight: 2, col: '#e0262f' },
  arsyad: { name: 'ARSYAD', cls: 'Ringan', top: 0.94, acc: 1.0, handle: 1.02, weight: 1, col: '#9b5cff' },
  nono: { name: 'BABAH NONO', cls: 'Teknik', top: 0.95, acc: 0.88, handle: 1.14, weight: 3, col: '#2f7d3c' },
  pupu: { name: 'IBU PUPU', cls: 'Seimbang', top: 0.97, acc: 0.93, handle: 0.97, weight: 3, col: '#ff4fa3' },
  baymax: { name: 'BAYMAX', cls: 'Berat', top: 0.98, acc: 0.76, handle: 0.86, weight: 5, col: '#333' }
};
const RACER_IDS = Object.keys(RACERS);

class Kart {
  constructor(id, cpu) {
    this.id = id; this.st = RACERS[id]; this.cpu = cpu;
    this.z = 0; this.x = 0; this.speed = 0; this.dist = 0;
    this.steerVis = 0; this.jy = 0; this.vy = 0;
    this.drift = 0; this.dcharge = 0; this.boost = 0; this.star = 0; this.cloud = 0; this.spin = 0; this.trick = false; this.rampLock = -1;
    this.item = null; this.itemN = 0; this.roll = 0; this.slip = 0; this.cpuF = 1;
    this.finished = false; this.time = 0; this.lap = 1; this.rank = 0; this.ai = { line: 0, lineT: 0, itemT: 2 + Math.random() * 3 };
  }
  get sp() { return this.speed / MAXS; }
  get air() { return this.jy > 0; }
  hit() {
    if (this.star > 0 || this.jy > 250 || this.spin > 0) return false;
    this.spin = 1.15; this.drift = 0; this.dcharge = 0; this.boost = 0; this.speed *= 0.55;
    return true;
  }
  update(dt, inp, T, fx) {
    const seg = Road.find(T, this.z);
    for (const k of ['boost', 'star', 'cloud', 'slip']) this[k] = Math.max(0, this[k] - dt);
    let steer = inp.steer;
    if (this.spin > 0) { this.spin -= dt; steer = 0; this.speed = Math.max(0, this.speed - MAXS * 0.9 * dt); }
    let cap = MAXS * this.st.top * this.cpuF;
    if (this.boost > 0) cap *= 1.3;
    if (this.star > 0) cap *= 1.18;
    if (this.cloud > 0) cap *= 0.62;
    // gas / rem
    if (this.spin <= 0) {
      if (inp.gas) this.speed += MAXS / 4.2 * this.st.acc * dt;
      else if (inp.brake) this.speed -= MAXS * 1.1 * dt;
      else this.speed -= MAXS / 5 * dt;
      if (this.boost > 0 && this.speed < cap) this.speed += MAXS * 1.6 * dt;
    }
    const off = Math.abs(this.x) > 1.06 && !this.air;
    if (off && this.boost <= 0 && this.star <= 0 && this.speed > MAXS * 0.4) this.speed -= MAXS * 1.5 * dt;
    if (this.speed > cap) this.speed = Math.max(cap, this.speed - MAXS * 0.9 * dt);
    this.speed = Math.max(0, this.speed);
    const sp = this.sp;
    // drift & mini-turbo
    if (!this.drift && inp.drift && !this.air && this.spin <= 0 && Math.abs(steer) > 0.3 && sp > 0.45) {
      this.drift = Math.sign(steer); this.dcharge = 0; this.vy = 700; this.jy = 1; fx && fx('hop', this);
    }
    if (this.drift && (!inp.drift || sp < 0.3 || this.spin > 0)) {
      if (this.dcharge > 1.7) { this.boost = 1.1; fx && fx('turbo2', this); }
      else if (this.dcharge > 0.8) { this.boost = 0.6; fx && fx('turbo1', this); }
      this.drift = 0; this.dcharge = 0;
    }
    if (this.drift) this.dcharge += dt * (steer * this.drift > 0 ? 1.25 : 0.65);
    // belok
    const s = this.drift ? this.drift * 0.6 + steer * 0.5 : steer;
    this.steerVis += (s - this.steerVis) * Math.min(1, dt * 10);
    const turn = dt * 2.5 * Math.min(1, sp * 1.5) * this.st.handle * (this.air ? 0.5 : 1);
    this.x += s * turn;
    this.x -= dt * 2 * sp * sp * seg.curve * CENT * (this.drift ? 0.5 : 1) / this.st.handle * (this.cpu ? 0.45 : 1);
    this.x = Math.max(-1.55, Math.min(1.55, this.x));      // pagar pembatas di luar pasir/rumput
    // ramp & lompatan
    if (seg.flags.ramp && !this.air && sp > 0.3 && this.rampLock !== seg.index) {
      this.vy = 2300 + 1300 * sp; this.jy = 1; this.trick = false; this.rampLock = seg.index; fx && fx('ramp', this);
    }
    if (!seg.flags.ramp) this.rampLock = -1;
    if (this.jy > 0) {
      this.vy -= GRAV * dt; this.jy += this.vy * dt;
      if (this.jy <= 0) { this.jy = 0; this.vy = 0; if (this.trick) { this.boost = Math.max(this.boost, 0.5); this.trick = false; fx && fx('trick', this); } }
    }
    // maju
    const d = this.speed * dt;
    this.z = (this.z + d) % T.length; this.dist += d;
    this.lap = Math.max(1, Math.floor(this.dist / T.length) + 1);
  }
}

/* tabrakan antar kart: dorong ke samping sesuai berat */
function collideKarts(karts, T, fx) {
  for (let i = 0; i < karts.length; i++) for (let j = i + 1; j < karts.length; j++) {
    const a = karts[i], b = karts[j];
    if (a.finished || b.finished || Math.abs(a.jy - b.jy) > 300) continue;
    let dz = b.z - a.z; if (dz > T.length / 2) dz -= T.length; if (dz < -T.length / 2) dz += T.length;
    const dx = b.x - a.x;
    if (Math.abs(dz) > 260 || Math.abs(dx) > 0.24) continue;
    if (a.star > 0 && b.hit()) { fx && fx('bump', b); continue; }
    if (b.star > 0 && a.hit()) { fx && fx('bump', a); continue; }
    const wa = a.st.weight, wb = b.st.weight, push = (0.25 - Math.abs(dx)) + 0.02, sg = dx >= 0 ? 1 : -1;
    a.x -= sg * push * wb / (wa + wb); b.x += sg * push * wa / (wa + wb);
    const back = dz > 0 ? a : b; back.speed *= 0.96;
    fx && fx('bump', back);
  }
}
