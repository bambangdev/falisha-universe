/* Petualangan Falisha di MIMHa – penunjuk arah: tujuan objektif aktif, rute antar-peta, papan nama pintu */
const Guide = (() => {
  const PLACE = { rumah: 'Rumah', jalan: 'Jalan Cikadut', gerbang: 'Halaman MIMHa', lapangan: 'Lapangan', kelas: 'Kelas', musala: 'Musala', kantin: 'Kantin' };
  /* BFS antar-peta lewat warp: jarak & warp pertama yang harus dilewati */
  function bfs(from) {
    const dist = { [from]: 0 }, first = {}, q = [from];
    while (q.length) {
      const cur = q.shift();
      for (const w of MAPS[cur].warps) if (!(w.to in dist)) { dist[w.to] = dist[cur] + 1; first[w.to] = cur === from ? w : first[cur]; q.push(w.to); }
    }
    return { dist, first };
  }
  const route = (from, to) => (from === to ? null : bfs(from).first[to] || null);
  const NPC = { pamit: ['rumah', 'pupu'], salam_guru: ['gerbang', 'guru'], wudhu: ['musala', 'ustadz'], dhuha: ['musala', 'ustadz'],
    iqro: ['kelas', 'guru'], hitung: ['kelas', 'guru'], doa: ['kelas', 'guru'], jajan: ['kantin', 'kantin'], lompat_tali: ['lapangan', 'anasya'], pulang: ['gerbang', 'nono'] };
  const npcAt = (map, id) => { const n = MAPS[map].npcs.find(e => e.id === id); return { map, id, x: n.x, y: n.y }; };
  const live = (st, map, item) => MAPS[map].objects.filter(o => o.item === item && !Quests.isPicked(st, map + ':' + o.id));
  /* peta terdekat (jumlah pintu) yang memenuhi syarat, mulai dari peta sekarang */
  function nearest(mapId, ok) {
    const { dist } = bfs(mapId);
    return Object.keys(MAPS).filter(ok).sort((a, b) => dist[a] - dist[b])[0] || null;
  }
  function target(st, mapId) {
    const c = Quests.current(st);
    if (!c) return null;
    if (NPC[c.id]) return npcAt(...NPC[c.id]);
    if (c.id === 'siap') { const o = live(st, 'rumah', 'tas')[0] || live(st, 'rumah', 'botol')[0]; return o ? { map: 'rumah', id: o.id, x: o.x, y: o.y } : null; }
    if (c.id === 'berangkat') return { map: 'gerbang', id: null };
    if (c.id === 'pensil') {
      if (Quests.count(st, 'pensil') >= 5) return npcAt('kelas', 'putra');
      const m = nearest(mapId, id => live(st, id, 'pensil').length > 0);
      if (!m) return npcAt('kelas', 'putra');
      const o = live(st, m, 'pensil')[0]; return { map: m, id: o.id, x: o.x, y: o.y };
    }
    if (c.id === 'piket') {
      const m = nearest(mapId, id => live(st, id, 'sampah').length > 0);
      if (m) { const o = live(st, m, 'sampah')[0]; return { map: m, id: o.id, x: o.x, y: o.y }; }
      const b = nearest(mapId, id => MAPS[id].spots.some(s => s.id === 'tong'));
      const s = MAPS[b].spots.find(x => x.id === 'tong');
      return { map: b, id: 'tong', x: s.x + s.w / 2, y: s.y + s.h };
    }
    return { map: c.map, id: null };
  }
  function next(st, mapId) {
    const t = target(st, mapId);
    if (!t) return null;
    if (t.map !== mapId) { const warp = route(mapId, t.map); return warp ? { type: 'warp', warp, to: t.map } : null; }
    return t.id ? { type: 'point', id: t.id, x: t.x, y: t.y } : null;
  }
  /* papan nama untuk pintu/tepi: arah panah & posisi label (di dalam peta, dekat pintu) */
  function sign(w) {
    const cx = w.x + w.w / 2, cy = w.y + w.h / 2;
    const dir = w.dir || (w.y + w.h >= 520 ? 'down' : w.x <= 10 ? 'left' : w.x + w.w >= 950 ? 'right' : 'up');
    let x = cx, y = cy;
    if (dir === 'down') y = w.y - 34; else if (dir === 'up') y = w.y - 30; else if (dir === 'left') x = w.x + 76; else x = w.x - 70;
    if (dir === 'left' || dir === 'right') y = cy - 34;
    return { dir, name: PLACE[w.to], x: Math.max(70, Math.min(890, x)), y: Math.max(30, Math.min(510, y)) };
  }
  return { PLACE, route, target, next, sign };
})();
if (typeof module === 'object' && module.exports) module.exports = Guide;
