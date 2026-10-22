/* Data karakter. Warna/tinggi dipakai aktor chibi 3D sementara (sebelum sprite Google Flow di-upload). */
export const CHARS = [
  { id: 'falisha', name: 'Falisha', tag: 'Si Kilat', h: 1.45, skin: '#d9a07a', hair: 'bob', hairC: '#17110e',
    shirt: '#ffd23a', dress: '#ff7a1a', pants: '#ff8a2a', shoe: '#ffffff', pack: '#e23a3a', maxHp: 100,
    special: { id: 'kilat', name: 'KILAT DASH', emoji: '⚡', desc: '3 petir menyebar' } },
  { id: 'arsyad', name: 'Arsyad', tag: 'Teriak Sonic', h: 1.2, skin: '#e0aa85', hair: 'curly', hairC: '#1a1310',
    shirt: '#f3ead2', pants: '#3a6fd8', shoe: '#3a6fd8', maxHp: 100,
    special: { id: 'teriak', name: 'TERIAAAK!', emoji: '📢', desc: 'gelombang suara' } },
  { id: 'nono', name: 'Babah Nono', tag: 'Kopi Tubruk', h: 1.72, skin: '#c98d68', hair: 'peci', hairC: '#111111',
    shirt: '#2f6b3a', stripe: ['#2f6b3a', '#111111', '#f2f2f2'], pants: '#2a2a30', shoe: '#ffffff', maxHp: 100,
    special: { id: 'kopi', name: 'KOPI TUBRUK', emoji: '☕', desc: 'cangkir menggelinding' } },
  { id: 'pupu', name: 'Ibu Pupu', tag: 'Suruh Makan', h: 1.65, skin: '#e8b996', hair: 'hijab', hairC: '#151517',
    shirt: '#1d1d22', pants: '#3a3a44', shoe: '#ff7fb0', maxHp: 100,
    special: { id: 'makan', name: 'SURUH MAKAN!', emoji: '🍲', desc: '+40 HP & bakso homing' } },
  { id: 'baymax', name: 'Baymax', tag: 'Tinju Roket', h: 1.8, skin: '#c48a63', hair: 'messy', hairC: '#161210',
    shirt: '#1c1c1c', pants: '#3557a0', shoe: '#e23a3a', maxHp: 125,
    special: { id: 'tinju', name: 'TINJU ROKET', emoji: '👊', desc: 'kepalan tembus' } }
];

/* Musuh & bos (wajah kartun, tanpa foto) */
export const SOLDIER = { id: 'soldier', face: 'cartoon', h: 1.6, skin: '#d9a07a', hair: 'helmet', hairC: '#4b6b2a',
  shirt: '#5f8a3c', pants: '#3c5a28', shoe: '#222222' };
export const YANTO = { id: 'yanto', face: 'cartoon', h: 1.6, skin: '#c9926a', hair: 'goggles', hairC: '#2a2a2a',
  shirt: '#6b2d8f', pants: '#2a1a3a', shoe: '#111111' };
