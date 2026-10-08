/* Falisha Kart Turbo – loader atlas & gambar sprite (anchor tengah-bawah) */
const Spr = (() => {
  const A = window.ATLAS || {};
  const CELL = 122;                 // lebar sel atlas (px) setelah diperkecil 0.5×
  const FILES = {
    racers: 'racers.png', items: 'items.png',
    decor_kuta: 'decor_kuta.png', decor_jakarta: 'decor_jakarta.png', decor_bromo: 'decor_bromo.png', decor_permen: 'decor_permen.png',
    sky_kuta: 'sky_kuta.jpg', sky_jakarta: 'sky_jakarta.jpg', sky_bromo: 'sky_bromo.jpg', sky_permen: 'sky_permen.jpg', cover: 'cover.jpg'
  };
  const img = {};
  let done = 0;
  const total = Object.keys(FILES).length;
  function load() {
    return Promise.all(Object.entries(FILES).map(([k, f]) => new Promise(res => {
      const im = new Image();
      im.onload = im.onerror = () => { done++; res(); };
      im.src = 'assets/sprites/' + f; img[k] = im;
    })));
  }
  const ok = im => im && im.complete && im.naturalWidth > 0;
  /* gambar frame `name` dari atlas: cx = tengah, by = bawah, cellW = lebar sel di layar */
  function draw(c, atlas, name, cx, by, cellW, flip) {
    const m = A[atlas] && A[atlas][name], im = img[atlas];
    if (!m || !ok(im)) return false;
    const k = cellW / CELL, w = m[2] * k, h = m[3] * k, top = by + m[5] * k - h;
    if (w < 0.5 || h < 0.5) return true;
    if (flip) { c.save(); c.translate(cx, 0); c.scale(-1, 1); c.drawImage(im, m[0], m[1], m[2], m[3], m[4] * k, top, w, h); c.restore(); }
    else c.drawImage(im, m[0], m[1], m[2], m[3], cx + m[4] * k, top, w, h);
    return true;
  }
  function size(atlas, name, cellW) { const m = A[atlas] && A[atlas][name], k = cellW / CELL; return m ? { w: m[2] * k, h: m[3] * k } : { w: 0, h: 0 }; }
  return { load, draw, size, img, ok, progress: () => done / total };
})();
