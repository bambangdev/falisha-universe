/* Falisha Kart – sprite loader: base64 PNG -> Image, siap pakai */
const Sprites = (() => {
  const cache = { racers: {}, decor: {} };
  let _resolve;
  const ready = new Promise(r => { _resolve = r; });
  let _done = false;

  function load() {
    if (_done) return ready;
    _done = true;
    const jobs = [];
    const R = window.SPR_R || {}, D = window.SPR_D || {};
    const mk = b64 => {
      const img = new Image();
      jobs.push(new Promise(res => { img.onload = res; img.onerror = res; }));
      img.src = 'data:image/png;base64,' + b64;
      return img;
    };
    for (const char in R) cache.racers[char] = R[char].map(mk);
    for (const name in D) cache.decor[name] = mk(D[name]);
    if (jobs.length === 0) _resolve(false);
    else Promise.all(jobs).then(() => _resolve(true));
    return ready;
  }

  function imgOk(img) { return img && img.complete && img.naturalWidth > 0; }

  // pose: 0 = lurus, 1 = belok kiri, 2 = belok kanan. x = tengah, y = bawah, w = lebar.
  function drawRacer(ctx, charId, pose, x, y, w) {
    const set = cache.racers[charId];
    const img = set && set[pose | 0];
    if (!imgOk(img)) return false;
    const h = w * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, x - w / 2, y - h, w, h);
    return true;
  }

  function drawDecor(ctx, name, x, yBottom, w) {
    const img = cache.decor[name];
    if (!imgOk(img)) return false;
    const h = w * img.naturalHeight / img.naturalWidth;
    ctx.drawImage(img, x - w / 2, yBottom - h, w, h);
    return true;
  }

  function racerDataURI(charId, pose = 0) {
    const R = window.SPR_R || {};
    const set = R[charId];
    if (!set || !set[pose]) return null;
    return 'data:image/png;base64,' + set[pose];
  }

  return { load, ready, drawRacer, drawDecor, racerDataURI, isOk: imgOk };
})();
