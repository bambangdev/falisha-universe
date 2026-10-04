/* Falisha Kart – item keluarga: definisi, kotak item, proyektil, jebakan */
const ItemSys = (() => {
  const DEFS = {
    sambal:     { name: 'Sambal Petir',     icon: '⚡', color: '#ffdd33' },
    kumon:      { name: 'Buku Kumon',       icon: '📚', color: '#3388ff' },
    piano:      { name: 'Piano Terbang',    icon: '🎹', color: '#333333' },
    pisang:     { name: 'Kulit Pisang',     icon: '🍌', color: '#ffee55' },
    bintang:    { name: 'Bintang Petir',    icon: '⭐', color: '#ffe55c' },
    tempurung:  { name: 'Tempurung Raksasa',icon: '🐢', color: '#37b24d' },
  };

  // peluang item berdasarkan posisi (1 = terdepan): posisi belakang dapat item kuat
  function rollItem(pos) {
    const r = Math.random();
    if (pos <= 2)      return r < 0.35 ? 'pisang' : r < 0.65 ? 'kumon' : r < 0.9 ? 'sambal' : 'piano';
    if (pos <= 4)      return r < 0.25 ? 'sambal' : r < 0.5 ? 'kumon' : r < 0.7 ? 'piano' : r < 0.9 ? 'pisang' : 'bintang';
    /* pos >= 5 */     return r < 0.25 ? 'bintang' : r < 0.5 ? 'piano' : r < 0.7 ? 'tempurung' : r < 0.9 ? 'sambal' : 'kumon';
  }

  function createState() {
    return { projectiles: [], hazards: [] };
  }

  function resetBoxes(track) {
    for (const b of track.boxes) { b.taken = false; b.timer = 0; }
  }

  // cek ambil kotak item (untuk pemain & CPU)
  function pickup(kart, track, pos, onPickup) {
    if (kart.item) return;
    const tl = track.trackLength;
    for (const b of track.boxes) {
      if (b.taken) continue;
      let dz = b.seg * Mode7.SEG_LEN - kart.z;
      if (dz < -tl / 2) dz += tl; if (dz > tl / 2) dz -= tl;
      if (Math.abs(dz) < Mode7.SEG_LEN * 1.2 && Math.abs(b.x - kart.x) < 0.7) {
        b.taken = true; b.timer = 6;
        kart.item = rollItem(pos);
        if (onPickup) onPickup(kart.item);
        break;
      }
    }
  }

  function updateBoxes(track, dt) {
    for (const b of track.boxes) {
      if (b.taken) { b.timer -= dt; if (b.timer <= 0) b.taken = false; }
    }
  }

  // pakai item (pemain). racers = semua kart untuk targeting. returns efek suara yg diinginkan
  function useItem(kart, st, racers, track) {
    const id = kart.item; if (!id) return null;
    kart.item = null;
    const MAX = KartDB.MAX_BASE * kart.char.maxSpeed;
    if (id === 'sambal') { kart.boostT = 1.6; kart.boostPow = 1; return 'boost'; }
    if (id === 'bintang') { kart.starT = 6; return 'star'; }
    if (id === 'pisang') { st.hazards.push({ type: 'pisang', z: kart.z - 600, x: kart.x }); return 'drop'; }
    if (id === 'kumon') { st.projectiles.push({ type: 'kumon', z: kart.z + 800, x: kart.x, vz: kart.speed + 9000 }); return 'shoot'; }
    if (id === 'piano') {
      const ahead = racers.filter(r => r !== kart && !r.finished)
        .sort((a, b) => b.progress - a.progress)[0];
      if (ahead) st.projectiles.push({ type: 'piano', z: kart.z + 800, x: kart.x, vz: kart.speed + 7000, target: ahead });
      else st.projectiles.push({ type: 'kumon', z: kart.z + 800, x: kart.x, vz: kart.speed + 9000 });
      return 'shoot';
    }
    if (id === 'tempurung') {
      const leader = racers.filter(r => !r.finished).sort((a, b) => b.progress - a.progress)[0];
      if (leader) st.projectiles.push({ type: 'tempurung', z: kart.z + 800, x: kart.x, vz: Math.max(kart.speed + 5000, 16000), target: leader });
      return 'shell';
    }
    return null;
  }

  // CPU pakai item secara sederhana
  function cpuUseItem(cpu, st, racers, track) {
    return useItem(cpu, st, racers, track);
  }

  function hitKart(kart, racers) {
    if (kart.starT > 0 || kart.finished) return;
    kart.spinT = 1.1;
    kart.speed *= 0.45;
    if (kart === racers.player) { /* efek suara di game.js */ }
  }

  function update(st, racers, track, dt, onHit) {
    const tl = track.trackLength;
    // proyektil
    for (let i = st.projectiles.length - 1; i >= 0; i--) {
      const pr = st.projectiles[i];
      pr.z += pr.vz * dt;
      if (pr.z >= tl) pr.z -= tl;
      if (pr.type === 'piano' && pr.target && !pr.target.finished) {
        // homing ringan ke target
        let dz = pr.target.z - pr.z;
        if (dz < -tl / 2) dz += tl; if (dz > tl / 2) dz -= tl;
        pr.x += Math.max(-1, Math.min(1, (pr.target.x - pr.x))) * dt * 2.2;
        if (Math.abs(dz) < 500 && Math.abs(pr.target.x - pr.x) < 0.9) {
          hitKart(pr.target, racers); if (onHit) onHit(pr.target);
          st.projectiles.splice(i, 1); continue;
        }
        if (Math.abs(dz) > tl * 0.6) { st.projectiles.splice(i, 1); continue; }
      } else if (pr.type === 'tempurung' && pr.target && !pr.target.finished) {
        let dz = pr.target.z - pr.z;
        if (dz < -tl / 2) dz += tl; if (dz > tl / 2) dz -= tl;
        pr.x += Math.max(-1, Math.min(1, (pr.target.x - pr.x))) * dt * 3.0;
        if (Math.abs(dz) < 600) {
          // ledakan area: yang dekat leader ikut kena
          for (const r of racers) {
            let d2 = r.z - pr.target.z;
            if (d2 < -tl / 2) d2 += tl; if (d2 > tl / 2) d2 -= tl;
            if (Math.abs(d2) < 2500) { hitKart(r, racers); if (onHit) onHit(r); }
          }
          st.projectiles.splice(i, 1); continue;
        }
      } else {
        // kumon: kena kart pertama yang dilewati
        let hit = false;
        for (const r of racers) {
          let dz = r.z - pr.z;
          if (dz < -tl / 2) dz += tl; if (dz > tl / 2) dz -= tl;
          if (Math.abs(dz) < 420 && Math.abs(r.x - pr.x) < 0.55) {
            hitKart(r, racers); if (onHit) onHit(r); hit = true; break;
          }
        }
        if (hit) { st.projectiles.splice(i, 1); continue; }
      }
      pr.life = (pr.life || 0) + dt;
      if (pr.life > 6) st.projectiles.splice(i, 1);
    }
    // jebakan pisang: tahan 25 detik
    for (let i = st.hazards.length - 1; i >= 0; i--) {
      const hz = st.hazards[i];
      hz.life = (hz.life || 0) + dt;
      if (hz.life > 25) { st.hazards.splice(i, 1); continue; }
      for (const r of racers) {
        let dz = r.z - hz.z;
        if (dz < -tl / 2) dz += tl; if (dz > tl / 2) dz -= tl;
        if (Math.abs(dz) < 380 && Math.abs(r.x - hz.x) < 0.5 && r.speed > 500) {
          hitKart(r, racers); if (onHit) onHit(r);
          st.hazards.splice(i, 1); break;
        }
      }
    }
  }

  /* ---------- gambar item ---------- */
  function drawBox(ctx, x, y, w, t) {
    const bob = Math.sin(t * 4) * w * 0.05;
    if (typeof Sprites !== 'undefined' && Sprites.drawDecor(ctx, 'giftbox', x, y + bob, w * 0.85)) return;
    const s = w / 60, bob2 = Math.sin(t * 4) * 4 * s;
    ctx.save(); ctx.translate(x, y + bob2);
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(0, 2 * s - bob2, 26 * s, 7 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#c0392b'; ctx.fillRect(-24 * s, -48 * s, 48 * s, 40 * s);
    ctx.fillStyle = '#e74c3c'; ctx.fillRect(-24 * s, -48 * s, 48 * s, 12 * s);
    ctx.fillStyle = '#ffe55c'; ctx.fillRect(-5 * s, -48 * s, 10 * s, 40 * s); ctx.fillRect(-24 * s, -32 * s, 48 * s, 10 * s);
    ctx.fillStyle = '#fff'; ctx.font = `${22 * s}px serif`; ctx.textAlign = 'center';
    ctx.fillText('?', 0, -16 * s);
    ctx.restore();
  }
  function drawProjectile(ctx, x, y, w, type) {
    const name = type === 'kumon' ? 'book' : type === 'piano' ? 'piano' : 'shell';
    if (typeof Sprites !== 'undefined' && Sprites.drawDecor(ctx, name, x, y, w * 0.8)) return;
    const s = w / 50;
    ctx.save(); ctx.translate(x, y);
    const em = type === 'kumon' ? '📚' : type === 'piano' ? '🎹' : '🐢';
    ctx.font = `${34 * s}px serif`; ctx.textAlign = 'center'; ctx.fillText(em, 0, -6 * s);
    ctx.restore();
  }
  function drawBanana(ctx, x, y, w) {
    if (typeof Sprites !== 'undefined' && Sprites.drawDecor(ctx, 'banana', x, y, w * 0.7)) return;
    const s = w / 40;
    ctx.save(); ctx.translate(x, y);
    ctx.font = `${30 * s}px serif`; ctx.textAlign = 'center'; ctx.fillText('🍌', 0, -4 * s);
    ctx.restore();
  }

  return { DEFS, rollItem, createState, resetBoxes, pickup, updateBoxes, useItem, cpuUseItem, update, drawBox, drawProjectile, drawBanana };
})();
