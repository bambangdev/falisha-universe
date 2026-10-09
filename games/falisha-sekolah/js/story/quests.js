/* Petualangan Falisha di MIMHa – 14 langkah cerita satu hari sekolah + barang + bintang */
const Quests = (() => {
  const STEPS = [
    { id: 'siap', text: 'Ambil tas & botol minum', map: 'rumah' },
    { id: 'pamit', text: 'Salam pamit ke Ibu Pupu', map: 'rumah' },
    { id: 'berangkat', text: 'Jalan ke sekolah bersama Baymax', map: 'jalan' },
    { id: 'salam_guru', text: 'Salam ke Bu Guru Aisyah', map: 'gerbang' },
    { id: 'wudhu', text: 'Wudhu di musala', map: 'musala' },
    { id: 'dhuha', text: 'Shalat dhuha berjamaah', map: 'musala' },
    { id: 'iqro', text: 'Belajar huruf hijaiyah', map: 'kelas' },
    { id: 'hitung', text: 'Berhitung bersama Bu Guru', map: 'kelas' },
    { id: 'doa', text: 'Hafalan doa sebelum makan', map: 'kelas' },
    { id: 'jajan', text: 'Istirahat: jajan di kantin', map: 'kantin' },
    { id: 'lompat_tali', text: 'Main lompat tali dengan Anasya & Ayana', map: 'lapangan' },
    { id: 'pensil', text: 'Cari 5 pensil warna Putra', map: 'kelas' },
    { id: 'piket', text: 'Piket: buang 8 sampah ke tempat sampah', map: 'kelas' },
    { id: 'pulang', text: 'Pulang, dijemput Babah Nono & Arsyad', map: 'gerbang' }
  ];
  const create = () => ({ v: 1, step: 0, items: {}, stars: {}, stickers: 0, picked: [] });
  const current = s => STEPS[s.step] || null;
  const finished = s => s.step >= STEPS.length;
  function complete(s, id) {
    const c = current(s);
    if (!c || c.id !== id) return false;
    s.step++; s.stickers++;
    return true;
  }
  function addItem(s, item, n = 1) { s.items[item] = (s.items[item] || 0) + n; }
  const count = (s, item) => s.items[item] || 0;
  function takeItem(s, item, n) {
    if (count(s, item) < n) return false;
    s.items[item] -= n; if (!s.items[item]) delete s.items[item];
    return true;
  }
  const isPicked = (s, key) => s.picked.includes(key);
  function markPicked(s, key) { if (isPicked(s, key)) return false; s.picked.push(key); return true; }
  function setStars(s, gameId, n) { n = Math.max(1, Math.min(3, n | 0)); s.stars[gameId] = Math.max(s.stars[gameId] || 0, n); }
  return { STEPS, create, current, finished, complete, addItem, count, takeItem, isPicked, markPicked, setStars };
})();
if (typeof module === 'object' && module.exports) module.exports = Quests;
