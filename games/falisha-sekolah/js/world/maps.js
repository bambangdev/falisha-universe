/* Petualangan Falisha di MIMHa – data 7 peta (koordinat canvas 960×540).
   Diukur dari gambar mentah; tiap peta ditulis dalam koordinat gambarnya lalu diskalakan.
   Posisi NPC/objek/spawn = titik kaki (tengah-bawah). Tembok = sel di luar poligon `walk` + rintangan. */
const MAPS = (() => {
  const CELL = 12;
  const inPoly = (x, y, pts) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  /* def dalam koordinat gambar sumber; k = 960 / lebar gambar */
  function build(k, def) {
    const S = v => Math.round(v * k);
    const R = ([x, y, w, h]) => ({ x: S(x), y: S(y), w: S(w), h: S(h) });
    const P = (x, y) => ({ x: S(x), y: S(y) });
    const walk = def.walk.map(poly => poly.map(([x, y]) => [x * k, y * k]));
    const walls = [];
    for (let y = 0; y < 540; y += CELL) {
      let run = null;
      for (let x = 0; x < 960; x += CELL) {
        const out = !walk.some(p => inPoly(x + CELL / 2, y + CELL / 2, p));
        if (out) { if (run) run.w += CELL; else { run = { x, y, w: CELL, h: CELL }; walls.push(run); } } else run = null;
      }
    }
    walls.push(...def.block.map(R));
    const spawns = {};
    for (const [key, v] of Object.entries(def.spawns)) spawns[key] = { ...P(v[0], v[1]), face: v[2] || 'down' };
    return {
      bg: def.bg, walls, spawns, charH: def.charH || 76,
      warps: def.warps.map(w => ({ ...R(w.r), to: w.to, at: w.at })),
      npcs: def.npcs.map(([id, x, y, face, when]) => ({ id, ...P(x, y), face: face || 'down', when: when || null })),
      objects: def.objects.map(([id, sprite, item, x, y, step]) => ({ id, sprite, item, ...P(x, y), step })),
      spots: def.spots.map(([id, r, sprite]) => ({ id, ...R(r), sprite: sprite || null }))
    };
  }
  const M = {};
  /* rumah: map_rumah 1376×768 */
  M.rumah = build(960 / 1376, {
    bg: 'map_rumah',
    walk: [[[130, 135], [600, 135], [600, 50], [965, 50], [965, 270], [1250, 270], [1250, 660], [765, 660], [765, 768], [610, 768], [610, 660], [130, 660]]],
    block: [[130, 135, 200, 320], [345, 135, 175, 155], [520, 135, 80, 360], [600, 250, 92, 232], [700, 50, 270, 105],
      [115, 455, 120, 205], [930, 345, 115, 185], [1115, 270, 140, 295], [850, 540, 280, 125], [1150, 515, 110, 150]],
    spawns: { default: [440, 600, 'down'], pintu: [687, 630, 'up'] },
    warps: [{ r: [610, 715, 155, 53], to: 'jalan', at: 'rumah' }],
    npcs: [['pupu', 790, 360, 'down']],
    objects: [['tas', 'tas', 'tas', 290, 615, 'siap'], ['botol', 'botol', 'botol', 430, 340, 'siap']],
    spots: []
  });
  /* jalan: map_jalan 1376×768 */
  M.jalan = build(960 / 1376, {
    bg: 'map_jalan', charH: 70,
    walk: [[[0, 335], [1376, 335], [1376, 650], [130, 650], [130, 430], [0, 430]]],
    block: [],
    spawns: { default: [160, 400, 'right'], rumah: [160, 400, 'right'], gerbang: [1260, 470, 'left'] },
    warps: [{ r: [0, 340, 40, 85], to: 'rumah', at: 'pintu' }, { r: [1336, 340, 40, 305], to: 'gerbang', at: 'jalan' }],
    npcs: [['baymax', 240, 400, 'right']],
    objects: [],
    spots: []
  });
  /* gerbang (halaman MIMHa): map_sekolah 2752×1536, diukur pada tampilan 2000×1116 */
  M.gerbang = build(960 / 2000, {
    bg: 'map_gerbang', charH: 62,
    walk: [[[880, 640], [1830, 885], [1830, 930], [1330, 1116], [0, 1116], [0, 1010], [300, 985]]],
    block: [[860, 560, 60, 80], [690, 700, 30, 70], [1365, 960, 45, 90]],
    spawns: { default: [1640, 960, 'left'], jalan: [1640, 960, 'left'], kelas: [605, 915, 'down'], musala: [1240, 835, 'down'], lapangan: [170, 1070, 'right'] },
    warps: [{ r: [1730, 870, 100, 60], to: 'jalan', at: 'gerbang' }, { r: [555, 825, 100, 40], to: 'kelas', at: 'gerbang' },
      { r: [1195, 750, 90, 40], to: 'musala', at: 'gerbang' }, { r: [0, 1030, 60, 86], to: 'lapangan', at: 'gerbang' }],
    npcs: [['satpam', 1560, 1000, 'left'], ['guru', 1000, 800, 'down'], ['nono', 1460, 1010, 'left', 'pulang'], ['arsyad', 1290, 1065, 'left', 'pulang']],
    objects: [['pensil1', 'pensil_merah', 'pensil', 420, 1050, 'pensil'], ['sampah1', 'kertas', 'sampah', 800, 980, 'piket'],
      ['sampah2', 'bungkus', 'sampah', 1120, 900, 'piket'], ['sampah3', 'botol_plastik', 'sampah', 560, 1080, 'piket']],
    spots: [['tong', [1180, 980, 60, 60], 'tong']]
  });
  /* lapangan: map_lapangan 1376×768 */
  M.lapangan = build(960 / 1376, {
    bg: 'map_lapangan',
    walk: [[[300, 500], [400, 300], [420, 235], [665, 235], [665, 190], [725, 190], [725, 235], [1376, 235], [1376, 768], [0, 768], [0, 500]]],
    block: [[285, 250, 25, 160], [80, 470, 60, 90], [995, 190, 190, 190], [1185, 270, 170, 250], [1035, 555, 341, 213],
      [0, 590, 90, 178], [740, 680, 100, 88], [915, 165, 95, 80]],
    spawns: { default: [60, 545, 'right'], gerbang: [60, 545, 'right'], kantin: [695, 300, 'down'] },
    warps: [{ r: [0, 505, 30, 80], to: 'gerbang', at: 'lapangan' }, { r: [665, 190, 60, 40], to: 'kantin', at: 'lapangan' }],
    npcs: [['anasya', 560, 430, 'right'], ['ayana', 700, 430, 'left']],
    objects: [['pensil2', 'pensil_kuning', 'pensil', 880, 470, 'pensil'], ['sampah4', 'kertas', 'sampah', 420, 640, 'piket'], ['sampah5', 'bungkus', 'sampah', 680, 560, 'piket']],
    spots: [['tong', [925, 545, 50, 60], null]]
  });
  /* kelas: map_kelas 1376×768 */
  M.kelas = build(960 / 1376, {
    bg: 'map_kelas',
    walk: [[[320, 295], [1055, 295], [1350, 745], [30, 745]], [[630, 700], [745, 700], [745, 768], [630, 768]]],
    block: [[20, 230, 275, 510], [605, 255, 165, 78],
      [375, 330, 115, 70], [555, 330, 100, 70], [720, 330, 100, 70], [885, 330, 115, 70],
      [335, 400, 125, 70], [535, 400, 110, 70], [730, 400, 110, 70], [915, 400, 125, 70],
      [295, 465, 130, 120], [515, 465, 125, 120], [735, 465, 125, 120], [950, 465, 130, 120],
      [1210, 590, 90, 130]],
    spawns: { default: [687, 690, 'up'], gerbang: [687, 690, 'up'] },
    warps: [{ r: [630, 745, 115, 23], to: 'gerbang', at: 'kelas' }],
    npcs: [['guru', 530, 320, 'down'], ['putra', 1130, 470, 'left'], ['seyan', 1130, 650, 'left']],
    objects: [['pensil3', 'pensil_hijau', 'pensil', 505, 620, 'pensil'], ['sampah6', 'kertas', 'sampah', 870, 640, 'piket'],
      ['sampah7', 'botol_plastik', 'sampah', 470, 700, 'piket'], ['sampah8', 'bungkus', 'sampah', 1040, 330, 'piket']],
    spots: [['tong', [1150, 590, 60, 110], null]]
  });
  /* musala: map_musala 1376×768 */
  M.musala = build(960 / 1376, {
    bg: 'map_musala',
    walk: [[[245, 200], [450, 200], [450, 440], [490, 440], [490, 225], [1185, 225], [1185, 768], [245, 768]]],
    block: [[1025, 135, 100, 145], [455, 440, 185, 20], [725, 440, 80, 20], [780, 440, 25, 328], [458, 560, 170, 110], [245, 215, 45, 90], [245, 680, 50, 50]],
    spawns: { default: [560, 720, 'up'], gerbang: [560, 720, 'up'] },
    warps: [{ r: [490, 745, 290, 23], to: 'gerbang', at: 'musala' }],
    npcs: [['ustadz', 900, 330, 'down']],
    objects: [['pensil4', 'pensil_biru', 'pensil', 1100, 700, 'pensil']],
    spots: [['keran', [250, 380, 45, 80], null]]
  });
  /* kantin: map_kantin 1376×768 */
  M.kantin = build(960 / 1376, {
    bg: 'map_kantin',
    walk: [[[160, 275], [1310, 275], [1310, 690], [750, 690], [750, 768], [625, 768], [625, 690], [65, 690], [65, 420], [160, 420]]],
    block: [[65, 420, 95, 240], [275, 330, 300, 170], [280, 525, 285, 165], [725, 335, 240, 165], [1040, 335, 240, 165], [905, 525, 315, 165]],
    spawns: { default: [687, 650, 'up'], lapangan: [687, 650, 'up'] },
    warps: [{ r: [625, 720, 125, 48], to: 'lapangan', at: 'kantin' }],
    npcs: [['kantin', 620, 305, 'down']],
    objects: [['pensil5', 'pensil_ungu', 'pensil', 1200, 310, 'pensil']],
    spots: []
  });
  /* kotak kaki 28×18 untuk titik kaki (x, y) — non-enumerable supaya Object.keys(MAPS) hanya id peta */
  Object.defineProperty(M, 'footBox', { value: (x, y) => ({ x: x - 14, y: y - 18, w: 28, h: 18 }), enumerable: false });
  return M;
})();
if (typeof module === 'object' && module.exports) module.exports = MAPS;
