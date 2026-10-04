/* Falisha Kart – AI pembalap CPU (rubber-banding, racing line sederhana) */
const KartAI = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function createCPU(char, gridIdx, road) {
    const tl = road.trackLength;
    return {
      char, isPlayer: false,
      z: tl - (gridIdx + 1) * 900, // start berjejer di belakang garis
      x: gridIdx % 2 === 0 ? -0.45 : 0.45,
      speed: 0, lap: 1, finished: false, finishTime: 0, finishPos: 0,
      item: null, boostT: 0, boostPow: 0, spinT: 0, starT: 0,
      offroad: false, progress: -(gridIdx + 1) * 900,
      itemT: 3 + Math.random() * 5, wob: Math.random() * 10,
    };
  }

  function update(cpu, player, dt, track, itemSt, racers, onCpuItem) {
    const road = track.road, tl = track.trackLength;
    const MAX = KartDB.MAX_BASE * cpu.char.maxSpeed;
    if (cpu.finished) {
      cpu.speed = Math.max(0, cpu.speed - MAX * dt);
      cpu.z += cpu.speed * dt; cpu.progress += cpu.speed * dt;
      return;
    }
    if (cpu.spinT > 0) {
      cpu.spinT -= dt;
      cpu.speed = Math.max(0, cpu.speed - MAX * 2.5 * dt);
      cpu.z += cpu.speed * dt; cpu.progress += cpu.speed * dt;
      return;
    }

    // --- rubber-banding: kejar pemain kalau tertinggal, melambat kalau di depan ---
    let diff = player.progress - cpu.progress;
    const band = clamp(diff / (tl * 1.5), -0.07, 0.10);
    const target = MAX * (0.90 + band);

    if (cpu.boostT > 0) { cpu.boostT -= dt; cpu.speed += MAX * 1.6 * cpu.boostPow * dt; }
    if (cpu.starT > 0) cpu.starT -= dt;
    if (cpu.speed < target) cpu.speed += MAX * 0.5 * cpu.char.accel * dt;
    else cpu.speed -= MAX * 0.8 * dt;
    cpu.offroad = Math.abs(cpu.x) > 1.08;
    if (cpu.offroad && cpu.speed > MAX * 0.38) cpu.speed -= MAX * 1.6 * dt;
    cpu.speed = clamp(cpu.speed, 0, cpu.boostT > 0 || cpu.starT > 0 ? MAX * 1.45 : MAX);

    // --- setir: ikuti racing line (tengah, antisipasi tikungan) ---
    const ahead = Mode7.findSegment(road, cpu.z + Mode7.SEG_LEN * 12);
    let wantX = -ahead.curve * 0.16 + Math.sin(cpu.wob += dt * 0.7) * 0.12;
    wantX = clamp(wantX, -0.85, 0.85);
    const dx = wantX - cpu.x;
    cpu.x += clamp(dx, -1, 1) * dt * 2.4 * cpu.char.handling;
    cpu.x = clamp(cpu.x, -2.2, 2.2);

    // --- maju + lap ---
    cpu.z += cpu.speed * dt;
    cpu.progress += cpu.speed * dt;
    if (cpu.z >= tl) { cpu.z -= tl; cpu.lap++; }

    // --- ambil & pakai item ---
    ItemSys.pickup(cpu, track, 8, null); // pos dummy: CPU jarang dapat item kuat
    cpu.itemT -= dt;
    if (cpu.item && cpu.itemT <= 0) {
      cpu.itemT = 4 + Math.random() * 6;
      const fx = ItemSys.cpuUseItem(cpu, itemSt, racers, track);
      if (onCpuItem && fx) onCpuItem(cpu, fx);
    }
  }

  // urutan balapan berdasarkan progress
  function rank(racers) {
    return racers.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished) return -1;
      if (b.finished) return 1;
      return b.progress - a.progress;
    });
  }

  return { createCPU, update, rank };
})();
