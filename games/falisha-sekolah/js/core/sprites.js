/* Petualangan Falisha di MIMHa – loader atlas & gambar penuh; gambar sprite dengan anchor tengah-bawah */
const Spr = (() => {
  const A = (typeof window !== 'undefined' && window.ATLAS) || {};
  const SHEETS = Object.keys(A);
  const FULL = { cover: 'cover.jpg', rapor_bg: 'rapor_bg.jpg' };
  for (const m of ['rumah', 'jalan', 'gerbang', 'lapangan', 'kelas', 'musala', 'kantin']) FULL['map_' + m] = 'maps/' + m + '.jpg';
  const imgs = {};
  let done = 0;
  const total = SHEETS.length + Object.keys(FULL).length;
  const ok = im => !!(im && im.complete && im.naturalWidth > 0);
  function load() {
    const jobs = [];
    const add = (k, src) => jobs.push(new Promise(res => {
      const im = new Image();
      im.onload = im.onerror = () => { done++; res(); };
      im.src = 'assets/sprites/' + src; imgs[k] = im;
    }));
    for (const s of SHEETS) add(s, s + '.png');
    for (const k in FULL) add(k, FULL[k]);
    return Promise.all(jobs);
  }
  const has = (sheet, name) => !!(A[sheet] && A[sheet].frames[name]);
  /* cx = tengah, by = bawah, heightPx = tinggi SEL di layar (skala sama untuk semua frame satu sheet) */
  function draw(ctx, sheet, name, cx, by, heightPx, flip = false) {
    const S = A[sheet], m = S && S.frames[name], im = imgs[sheet];
    if (!m || !ok(im)) return false;
    const k = heightPx / S.cell, w = m[2] * k, h = m[3] * k, top = by + m[5] * k - h;
    if (flip) { ctx.save(); ctx.translate(cx, 0); ctx.scale(-1, 1); ctx.drawImage(im, m[0], m[1], m[2], m[3], m[4] * k, top, w, h); ctx.restore(); }
    else ctx.drawImage(im, m[0], m[1], m[2], m[3], cx + m[4] * k, top, w, h);
    return true;
  }
  /* gambar frame pas di dalam kotak (untuk ikon & kartu), menjaga rasio */
  function fit(ctx, sheet, name, x, y, w, h) {
    const S = A[sheet], m = S && S.frames[name], im = imgs[sheet];
    if (!m || !ok(im)) return false;
    const k = Math.min(w / m[2], h / m[3]), dw = m[2] * k, dh = m[3] * k;
    ctx.drawImage(im, m[0], m[1], m[2], m[3], x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    return true;
  }
  return { load, draw, fit, has, img: k => ok(imgs[k]) ? imgs[k] : undefined, progress: () => total ? done / total : 1 };
})();
