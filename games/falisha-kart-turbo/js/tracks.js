/* Falisha Kart Turbo – data 4 sirkuit Piala Nusantara
   Potongan: n = [masuk, tahan, keluar] segmen, c = tikungan (+kanan / -kiri), h = naik/turun (× panjang segmen),
   box = baris kotak item, ramp = loncatan di ujung potongan, tunnel = terowongan. */
const TS = (n, o = {}) => ({ n: [0, n, 0], ...o });
const TC = (e, h, l, c, hill = 0, o = {}) => ({ n: [e, h, l], c, h: hill, ...o });

const TRACKS = [
  {
    id: 'kuta', name: 'PANTAI KUTA', sub: 'Pasir pantai & ombak', sky: 'sky_kuta', decorAtlas: 'decor_kuta', music: 0, seed: 11,
    theme: { skyFill: '#3aa8f0', grass: ['#f0d999', '#e6cc86'], rumble: ['#ffffff', '#e0262f'], road: ['#80848f', '#7a7e89'], lane: '#ffffff', fog: 0 },
    density: 0.42, sideMin: 2.0, sideMax: 3.6,
    decor: [['palm1', 1500, 4], ['palm2', 1500, 4], ['palm3', 1500, 3], ['palm4', 1600, 3], ['payung', 900, 2], ['selancar', 700, 1], ['gapuraL', 1500, 1], ['gapuraR', 1500, 1],
      ['jukung', 1300, 1], ['istanapasir', 900, 1], ['karang', 900, 1], ['semak', 900, 3], ['pura', 1700, 1], ['bendera', 900, 1], ['kios', 1100, 1], ['pelampung', 600, 1]],
    pieces: [TS(50), TC(30, 50, 30, 2, 0, { box: true }), TS(40), TC(25, 40, 25, -2.5, 20), TS(40, { ramp: true }), TC(30, 60, 30, 3, -20, { box: true }), TS(60),
      TC(20, 30, 20, -3), TC(20, 30, 20, 3), TS(50, { box: true }), TC(30, 70, 30, -2, 10), TS(60, { ramp: true }), TC(30, 50, 30, 2.5, -10), TS(60, { box: true }), TC(25, 60, 25, -2), TS(40)]
  },
  {
    id: 'jakarta', name: 'JAKARTA MALAM', sub: 'Lampu kota & terowongan', sky: 'sky_jakarta', decorAtlas: 'decor_jakarta', music: 1, seed: 23,
    theme: { skyFill: '#0e1638', grass: ['#2a2e3d', '#262a38'], rumble: ['#ffd23f', '#222'], road: ['#4a4e5c', '#454957'], lane: '#ffe9a0', fog: 0,
      tunnelWall: ['#6a5a48', '#5e503f'], tunnelCeil: '#2a2420', tunnelFloor: '#33302c', portal: '#8a7a68' },
    density: 0.5, sideMin: 2.0, sideMax: 3.6,
    decor: [['gedung1', 2600, 3], ['gedung2', 2600, 3], ['gedung3', 2600, 3], ['gedung4', 2600, 2], ['lampu', 1100, 5], ['monas', 2200, 1], ['bajaj', 1100, 1], ['nasgor', 1100, 1],
      ['pohon', 1400, 2], ['halte', 1300, 1], ['reklame', 1300, 2], ['lalin', 900, 1], ['barrier', 900, 1], ['pot', 600, 1], ['tiang', 1300, 1], ['kucing', 500, 1]],
    pieces: [TS(50), TC(20, 30, 20, 4, 0, { box: true }), TS(60), TC(15, 25, 15, -5), TS(30),
      TS(90, { tunnel: true }), TC(20, 40, 20, 2.5, 0, { tunnel: true }), TS(40, { tunnel: true, box: true }), TS(40),
      TC(20, 40, 20, -4, 15), TS(50, { box: true }), TC(15, 30, 15, 5, -15), TC(15, 30, 15, -5), TS(60, { ramp: true }), TC(30, 60, 30, 3, 0, { box: true }), TS(40), TC(20, 30, 20, -3.5)]
  },
  {
    id: 'bromo', name: 'GUNUNG BROMO', sub: 'Tanjakan curam & kabut', sky: 'sky_bromo', decorAtlas: 'decor_bromo', music: 2, seed: 37,
    theme: { skyFill: '#e89a6a', grass: ['#8b8576', '#827c6e'], rumble: ['#ffffff', '#5a4a3a'], road: ['#6e6a62', '#68645c'], lane: '#f4f1d0', fog: 0.95, fogColor: '#d9c8c8' },
    density: 0.38, sideMin: 2.0, sideMax: 3.6,
    decor: [['cemara1', 1500, 4], ['cemara2', 1600, 3], ['cemara3', 1600, 2], ['cemara4', 1600, 2], ['batu', 1000, 3], ['kuda', 1000, 1], ['jip', 1200, 1], ['tenda', 1000, 1],
      ['pagar', 900, 2], ['edelweiss', 700, 2], ['papan', 800, 1], ['tumpukbatu', 700, 2], ['pura', 1600, 1], ['gubuk', 1300, 1], ['kabut1', 1600, 1], ['kabut2', 2400, 1]],
    pieces: [TS(40), TC(30, 40, 30, 0, 50, { box: true }), TC(25, 40, 25, 3, 0), TC(30, 30, 30, 0, -50), TS(30, { ramp: true }), TC(30, 60, 30, -3, 40, { box: true }),
      TC(20, 30, 20, 4, -20), TC(25, 50, 25, 0, 60), TC(20, 30, 20, -4.5, 0, { box: true }), TC(40, 40, 40, 0, -70), TS(40, { ramp: true }), TC(30, 50, 30, 3, 20), TC(20, 40, 20, -3, -20, { box: true }), TS(40)]
  },
  {
    id: 'permen', name: 'ISTANA PERMEN', sub: 'Jalur berliku & loncatan', sky: 'sky_permen', decorAtlas: 'decor_permen', music: 3, seed: 51,
    theme: { skyFill: '#e7b8f0', grass: ['#9fe3c0', '#8fd8b2'], rumble: ['#ff7ab8', '#ffffff'], road: ['#b07a5a', '#a87253'], lane: '#fff3f8', fog: 0 },
    density: 0.48, sideMin: 2.0, sideMax: 3.6,
    decor: [['lolipop1', 1100, 3], ['tongkat', 1000, 2], ['cupcake', 900, 2], ['donat', 900, 2], ['cokelat', 900, 1], ['eskrim', 1000, 2], ['jeli', 800, 2], ['gulali', 1000, 2],
      ['kastil', 1900, 1], ['marshmallow', 600, 1], ['biskuit', 800, 1], ['jamur', 800, 2], ['lolipop2', 1000, 2], ['lolipop3', 1000, 2], ['lolipop4', 1000, 2], ['lolihati', 1000, 2]],
    pieces: [TS(40), TC(15, 25, 15, 4, 0, { box: true }), TC(15, 25, 15, -4), TC(15, 25, 15, 4, 15), TS(30, { ramp: true }), TC(20, 30, 20, -5, -15, { box: true }), TC(15, 20, 15, 5),
      TS(40, { ramp: true }), TC(20, 40, 20, -3, 20), TC(15, 25, 15, 4.5, -20, { box: true }), TC(15, 25, 15, -4.5), TS(30, { ramp: true }), TC(20, 50, 20, 3, 0), TC(15, 25, 15, -4, 0, { box: true }),
      TC(15, 25, 15, 4), TS(40)]
  }
];
