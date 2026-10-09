/* Petualangan Falisha di MIMHa – kotak dialog: potret, nama, teks mengetik 40 huruf/detik */
const Dialog = (() => {
  const NAMES = { falisha: 'Falisha', pupu: 'Ibu Pupu', baymax: 'Baymax', nono: 'Babah Nono', arsyad: 'Arsyad', guru: 'Bu Guru Aisyah',
    ustadz: 'Pak Ustadz Hasan', satpam: 'Pak Satpam Dadang', kantin: 'Bu Kantin Euis', putra: 'Putra', anasya: 'Anasya', ayana: 'Ayana', seyan: 'Seyan' };
  const CPS = 40;
  let lines = [], idx = 0, shown = 0, done = null, t = 0;
  function open(ls, onDone) { lines = ls; idx = 0; shown = 0; done = onDone || null; }
  const active = () => idx < lines.length;
  function update(dt, action) {
    if (!active()) return;
    t += dt;
    const full = lines[idx].text.length;
    shown = Math.min(full, shown + CPS * dt);
    if (!action) return;
    if (shown < full) { shown = full; return; }
    idx++; shown = 0;
    if (!active()) { const f = done; done = null; lines = []; idx = 0; if (f) f(); }
  }
  function wrap(ctx, text, maxW) {
    const out = []; let cur = '';
    for (const w of text.split(' ')) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; } else cur = test;
    }
    if (cur) out.push(cur);
    return out;
  }
  function draw(ctx) {
    if (!active()) return;
    const L = lines[idx], x = 20, y = 362, w = 920, h = 160;
    {
      // bingkai digambar ulang (sprite dialog_box 2:1 akan gepeng di kotak 6:1): kertas krem + bingkai hijau + bintang
      ctx.fillStyle = '#fbf1d6'; ctx.strokeStyle = '#2f6b3f'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, 14) : ctx.rect(x, y, w, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd23f'; for (const [cx, cy] of [[x + 10, y + 10], [x + w - 10, y + 10], [x + 10, y + h - 10], [x + w - 10, y + h - 10]]) { ctx.beginPath(); ctx.arc(cx, cy, 5, 0, 7); ctx.fill(); }
    }
    const pk = L.who === 'falisha' ? 'falisha.senang' : L.who;
    Spr.fit(ctx, 'portrait', pk, x + 16, y + 16, 128, 128);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '13px "Press Start 2P", monospace'; ctx.fillStyle = '#2f6b3f';
    ctx.fillText(NAMES[L.who] || L.who, x + 160, y + 20);
    ctx.font = '12px "Press Start 2P", monospace'; ctx.fillStyle = '#2b2b2b';
    wrap(ctx, L.text.slice(0, Math.floor(shown)), w - 190).slice(0, 5).forEach((s, i) => ctx.fillText(s, x + 160, y + 48 + i * 20));
    if (shown >= L.text.length && Math.floor(t * 3) % 2) { ctx.fillStyle = '#2f6b3f'; ctx.font = '9px "Press Start 2P", monospace'; ctx.textAlign = 'right'; ctx.fillText('Ketuk / A untuk lanjut ▼', x + w - 24, y + h - 26); }
  }
  return { open, active, update, draw, NAMES };
})();
