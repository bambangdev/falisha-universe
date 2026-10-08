/* Falisha Kart Turbo – kotak item & 7 item keluarga */
const ITEM_INFO = {
  sambal: { name: 'Sambal Turbo' }, kumon: { name: 'Buku Kumon' }, piano: { name: 'Piano Pengejar' }, pisang: { name: 'Kulit Pisang' },
  bintang: { name: 'Bintang Petir' }, awan: { name: 'Awan Hujan' }, balon: { name: 'Balon Lompat' }
};
const Items = (() => {
  let list = [];
  const TABLE = [   // bobot per kelompok posisi: depan, tengah, belakang
    { pisang: 40, kumon: 32, sambal: 18, balon: 10 },
    { sambal: 25, kumon: 20, piano: 20, pisang: 15, balon: 10, bintang: 10 },
    { sambal: 25, piano: 25, bintang: 22, awan: 18, balon: 10 }
  ];
  function roll(rank, n) {
    const grp = rank === 0 ? 0 : rank >= n - 2 ? 2 : 1, t = TABLE[grp];
    let r = Math.random() * Object.values(t).reduce((a, b) => a + b, 0);
    for (const k in t) { r -= t[k]; if (r <= 0) return k; }
    return 'sambal';
  }
  function reset() { list = []; }
  const wrapDz = (a, b, L) => { let d = a - b; if (d > L / 2) d -= L; if (d < -L / 2) d += L; return d; };

  /* pakai item yang dipegang kart k */
  function use(k, karts, T, fx) {
    const it = k.item; if (!it || k.roll > 0) return;
    if (--k.itemN <= 0) { k.item = null; k.itemN = 0; }
    if (it === 'sambal') { k.boost = Math.max(k.boost, 1.5); fx('sambal', k); }
    else if (it === 'bintang') { k.star = 6; fx('bintang', k); }
    else if (it === 'balon') { k.vy = 3800; k.jy = 1; k.drift = 0; fx('balon', k); }
    else if (it === 'pisang') { list.push({ type: 'pisang', z: (k.z - 380 + T.length) % T.length, x: k.x, jy: 0 }); fx('drop', k); }
    else if (it === 'kumon') { list.push({ type: 'kumon', z: (k.z + 300) % T.length, x: k.x, speed: Math.max(k.speed, MAXS * 0.6) + MAXS * 0.55, owner: k, life: 3.5, vx: 0 }); fx('throw', k); }
    else if (it === 'piano') {
      const ahead = karts.filter(o => o !== k && !o.finished && o.dist > k.dist).sort((a, b) => a.dist - b.dist)[0];
      list.push({ type: 'piano', z: (k.z + 300) % T.length, x: k.x, speed: Math.max(k.speed, MAXS * 0.6) + MAXS * 0.7, owner: k, target: ahead || null, life: 6 });
      fx('throw', k);
    } else if (it === 'awan') {
      const lead = karts.filter(o => o !== k && !o.finished).sort((a, b) => b.dist - a.dist)[0];
      if (lead) { lead.cloud = 3.2; fx('awan', lead); }
    }
  }
  function update(dt, karts, T, fx) {
    for (const o of list) {
      if (o.type === 'kumon' || o.type === 'piano') {
        o.life -= dt; o.z = (o.z + o.speed * dt) % T.length;
        if (o.type === 'piano' && o.target) {
          const dz = wrapDz(o.target.z, o.z, T.length);
          if (dz > -200) o.x += Math.max(-2.5 * dt, Math.min(2.5 * dt, o.target.x - o.x));
        }
        if (Math.abs(o.x) > 1.5) o.life = 0;
        if (o.life <= 0) o.dead = true;
      }
      for (const k of karts) {
        if (k.finished || o.dead) continue;
        if ((o.type !== 'pisang') && k === o.owner && o.life > (o.type === 'piano' ? 5.6 : 3.1)) continue;
        if (Math.abs(wrapDz(k.z, o.z, T.length)) < 230 && Math.abs(k.x - o.x) < 0.22 && k.jy < 200) {
          if (k.star > 0) { o.dead = true; fx('pop', k); continue; }
          if (k.hit()) { o.dead = true; fx('spin', k, o.type); }
        }
      }
    }
    list = list.filter(o => !o.dead);
  }
  /* kotak item di jalan */
  function boxes(dt, karts, T, fx, enabled) {
    for (const k of karts) {
      if (!enabled || k.finished) continue;
      const sg = Road.find(T, k.z);
      if (!sg.boxes) continue;
      for (const b of sg.boxes) {
        if (b.t > 0 || Math.abs(k.x - b.x) > 0.2 || k.jy > 400) continue;
        b.t = 2.5; fx('box', k);
        if (!k.item) { const n = karts.filter(o => !o.finished).length; k.item = roll(k.rank, n); k.itemN = 1; k.roll = k.cpu ? 0 : 1.1; }
      }
    }
    for (const sg of T.segs) if (sg.boxes) for (const b of sg.boxes) b.t = Math.max(0, b.t - dt);
  }
  return { roll, reset, use, update, boxes, get list() { return list; } };
})();
