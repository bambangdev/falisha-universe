/* Petualangan Falisha di MIMHa – logika murni 7 mini-game (tanpa kalah) */
const MGLogic = (() => {
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const stars = mistakes => (mistakes === 0 ? 3 : mistakes <= 2 ? 2 : 1);

  const WUDHU = ['tangan', 'kumur', 'hidung', 'wajah', 'lengan', 'kepala', 'telinga', 'kaki'];
  const wudhuOk = (idx, tapped) => WUDHU[idx] === tapped;

  const RAKAAT = ['qiyam', 'rukuk', 'qiyam', 'sujud', 'duduk', 'sujud'];
  const DHUHA = [...RAKAAT, ...RAKAAT, 'duduk'];

  const HIJAIYAH = [['ا', 'Alif'], ['ب', 'Ba'], ['ت', 'Ta'], ['ث', 'Tsa'], ['ج', 'Jim'], ['ح', 'Ḥa'], ['خ', 'Kho'], ['د', 'Dal'], ['ذ', 'Dzal'], ['ر', 'Ro'],
    ['ز', 'Zai'], ['س', 'Sin'], ['ش', 'Syin'], ['ص', 'Shod'], ['ض', 'Dhod'], ['ط', 'Tho'], ['ظ', 'Zho'], ['ع', "'Ain"], ['غ', 'Ghoin'], ['ف', 'Fa'],
    ['ق', 'Qof'], ['ك', 'Kaf'], ['ل', 'Lam'], ['م', 'Mim'], ['ن', 'Nun'], ['و', 'Wau'], ['ه', 'Ha'], ['ي', 'Ya']].map(([ch, name]) => ({ ch, name }));
  function shuffle(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function pickUnique(r, n, lo, hi, must) {
    const set = new Set([must]);
    while (set.size < n) set.add(int(r, lo, hi));
    return shuffle([...set], r);
  }
  function hijaiyahRound(r) { const answer = int(r, 0, 27); return { answer, options: pickUnique(r, 4, 0, 27, answer) }; }
  function hitung(r) {
    let a, b, op;
    if (r() < 0.5) { op = '+'; a = int(r, 0, 10); b = int(r, 0, 10); } else { op = '-'; a = int(r, 1, 20); b = int(r, 0, a); }
    const answer = op === '+' ? a + b : a - b;
    const set = new Set([answer]);
    while (set.size < 3) set.add(Math.max(0, Math.min(20, answer + int(r, -3, 3))));
    return { a, b, op, answer, choices: shuffle([...set], r) };
  }
  const DOA = [
    { id: 'makan', parts: ['Allahumma', 'baarik lanaa', 'fiimaa razaqtanaa', 'wa qinaa', "'adzaaban naar"] },
    { id: 'keluar', parts: ['Bismillaahi', 'tawakkaltu', "'alallaahi", 'laa haula', 'wa laa quwwata', 'illaa billaah'] }
  ];
  function shuffled(parts, r) {
    if (parts.length < 2) return parts.slice();
    let s;
    do s = shuffle(parts, r); while (s.every((p, i) => p === parts[i]));
    return s;
  }
  const doaOk = (parts, idx, tapped) => parts[idx] === tapped;
  const HARGA = { roti: 2000, susu: 3000, pisang: 1000, risol: 2000 };
  const UANG = [500, 1000, 2000];
  const PESANAN = ['pisang', 'roti', 'susu'];
  function bayar(uang, harga) { const t = uang.reduce((a, b) => a + b, 0); return t < harga ? 'kurang' : t === harga ? 'pas' : 'lebih'; }
  const talPeriod = i => Math.max(0.8, +(1.2 - 0.02 * i).toFixed(4));
  function talJudge(tPress, tBeat, win = 0.18) { const d = tPress - tBeat; return Math.abs(d) <= win ? 'pas' : d < 0 ? 'cepat' : 'lambat'; }
  return { rng, stars, WUDHU, wudhuOk, DHUHA, HIJAIYAH, hijaiyahRound, hitung, DOA, shuffled, doaOk, HARGA, UANG, PESANAN, bayar, talPeriod, talJudge, shuffle };
})();
if (typeof module === 'object' && module.exports) module.exports = MGLogic;
