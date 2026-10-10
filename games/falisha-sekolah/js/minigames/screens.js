/* Petualangan Falisha di MIMHa – layar 7 mini-game (ketuk / keyboard). Tanpa kalah: salah = petunjuk + coba lagi. */
const Minigames = (() => {
  const W = 960, H = 540, M = MGLogic;
  const TITLE = { wudhu: 'Urutan Wudhu', dhuha: 'Shalat Dhuha: Ikuti Imam', iqro: 'Huruf Hijaiyah', hitung: 'Berhitung Apel',
    doa: 'Susun Doa', jajan: 'Belanja di Kantin', lompat_tali: 'Lompat Tali' };
  const POSE = { qiyam: 'Berdiri', rukuk: 'Rukuk', sujud: 'Sujud', duduk: 'Duduk' };
  const NAMA = { roti: 'Roti', susu: 'Susu', pisang: 'Pisang', risol: 'Risol' };
  const rp = n => 'Rp ' + n.toLocaleString('id-ID');
  let G = null, btns = [], focus = 0;
  const beep = (f, d, type) => { if (typeof Chip !== 'undefined') Chip.beep(f, d || 0.1, type || 'square', 0.05); };
  const good = () => { beep(880, 0.08); setTimeout(() => beep(1320, 0.1), 70); };
  const bad = () => beep(220, 0.18, 'triangle');
  function say(text, t = 1.6) { G.msg = { text, t }; }
  function wrong(text, key) { G.mistakes++; bad(); say(text); G.shake = { key, t: 0.35 }; }

  /* ---------- inisialisasi per game ---------- */
  const INIT = {
    wudhu: r => ({ cards: M.shuffle(M.WUDHU, r), idx: 0 }),
    dhuha: () => ({ idx: 0 }),
    iqro: r => ({ round: 0, q: M.hijaiyahRound(r) }),
    hitung: r => ({ round: 0, q: M.hitung(r) }),
    doa: r => ({ d: 0, idx: 0, parts: M.shuffled(M.DOA[0].parts, r) }),
    jajan: () => ({ order: 0, tray: [] }),
    lompat_tali: () => ({ count: 0, t: 0, beat: 1.6, prev: 0.4, pause: 0, jump: 0 })
  };
  function start(id, onDone) {
    const seed = (Date.now() & 0xffff) ^ id.length;
    G = { id, onDone, r: M.rng(seed), mistakes: 0, t: 0, msg: null, shake: null, end: 0, s: null };
    G.s = INIT[id](G.r);
    focus = 0; btns = [];
    if (id === 'lompat_tali') say('Tekan LOMPAT saat tali di bawah kaki!', 2.5);
  }
  const active = () => !!G;
  function finish() { G.end = 1.5; G.msg = null; good(); }

  /* ---------- aksi benar/salah per game ---------- */
  const PICK = {
    wudhu(name) {
      const s = G.s;
      if (M.wudhuOk(s.idx, name)) { s.idx++; good(); if (s.idx === 8) finish(); }
      else wrong('Hmm, belum. Langkah ke-' + (s.idx + 1) + ' dulu ya!', name);
    },
    dhuha(pose) {
      const s = G.s;
      if (M.DHUHA[s.idx] === pose) { s.idx++; good(); if (s.idx === M.DHUHA.length) finish(); }
      else wrong('Lihat gerakan Pak Gungun, ya!', pose);
    },
    iqro(i) {
      const s = G.s;
      if (i === s.q.answer) {
        good(); s.round++;
        if (s.round === 10) return finish();
        s.q = M.hijaiyahRound(G.r);
      } else wrong('Itu huruf ' + M.HIJAIYAH[i].name + '. Coba lagi!', i);
    },
    hitung(n) {
      const s = G.s;
      if (n === s.q.answer) { good(); s.round++; if (s.round === 10) finish(); else s.q = M.hitung(G.r); }
      else wrong('Coba hitung apelnya pelan-pelan, ya!', n);
    },
    doa(part) {
      const s = G.s, parts = M.DOA[s.d].parts;
      if (M.doaOk(parts, s.idx, part)) {
        s.idx++; good();
        if (s.idx === parts.length) {
          if (s.d === M.DOA.length - 1) return finish();
          s.d++; s.idx = 0; s.parts = M.shuffled(M.DOA[s.d].parts, G.r); say('Sekarang doa keluar rumah!', 2);
        }
      } else wrong('Bukan itu. Kata berikutnya apa ya?', part);
    },
    jajan(cmd) {
      const s = G.s, item = M.PESANAN[s.order], harga = M.HARGA[item];
      if (typeof cmd === 'number') { s.tray.push(cmd); beep(660, 0.05); return; }
      if (cmd === 'reset') { s.tray = []; return; }
      const res = M.bayar(s.tray, harga);
      if (res === 'pas') { good(); s.tray = []; s.order++; say('Terima kasih! Uangnya pas.', 1.4); if (s.order === M.PESANAN.length) finish(); }
      else { wrong(res === 'kurang' ? 'Uangnya kurang, tambah lagi ya.' : 'Kembaliannya kebanyakan, coba pas ya!', 'bayar'); s.tray = []; }
    },
    lompat_tali() {
      const s = G.s;
      if (s.pause > 0 || s.jump > 0) return;
      const j = M.talJudge(s.t, s.beat);
      if (j === 'pas') {
        s.count++; s.jump = 0.35; beep(520 + s.count * 20, 0.06);
        s.prev = s.beat; s.beat += M.talPeriod(s.count);
        if (s.count === 20) finish();
      } else { G.mistakes++; bad(); say(j === 'cepat' ? 'Terlalu cepat!' : 'Terlalu lambat!', 1); s.pause = 0.8; }
    }
  };
  function tali(dt) {
    const s = G.s;
    s.jump = Math.max(0, s.jump - dt);
    if (s.pause > 0) { s.pause -= dt; if (s.pause <= 0) { s.prev = s.t; s.beat = s.t + M.talPeriod(s.count); } return; }
    s.t += dt;
    if (s.t > s.beat + 0.18) { G.mistakes++; bad(); say('Tersangkut! Ayo lagi.', 1); s.pause = 0.8; }
  }

  /* ---------- update ---------- */
  function update(dt, tap, action, nav = 0) {
    if (!G) return;
    G.t += dt;
    if (G.msg && (G.msg.t -= dt) <= 0) G.msg = null;
    if (G.shake && (G.shake.t -= dt) <= 0) G.shake = null;
    if (G.end > 0) {
      G.end -= dt;
      if (G.end <= 0) { const f = G.onDone, st = M.stars(G.mistakes); G = null; if (f) f(st); }
      return;
    }
    if (G.id === 'lompat_tali') tali(dt);
    if (nav && btns.length) focus = (focus + nav + btns.length) % btns.length;
    let hit = null;
    if (tap) hit = btns.find(b => tap.x >= b.x && tap.x <= b.x + b.w && tap.y >= b.y && tap.y <= b.y + b.h);
    else if (action && btns.length) hit = btns[Math.min(focus, btns.length - 1)];
    if (hit) hit.act();
  }
  /* jawaban benar satu langkah (untuk smoke test) */
  function debugSolveStep() {
    if (!G || G.end > 0) return;
    const s = G.s, id = G.id;
    if (id === 'wudhu') PICK.wudhu(M.WUDHU[s.idx]);
    else if (id === 'dhuha') PICK.dhuha(M.DHUHA[s.idx]);
    else if (id === 'iqro') PICK.iqro(s.q.answer);
    else if (id === 'hitung') PICK.hitung(s.q.answer);
    else if (id === 'doa') PICK.doa(M.DOA[s.d].parts[s.idx]);
    else if (id === 'jajan') { const h = M.HARGA[M.PESANAN[s.order]]; s.tray = []; let left = h; for (const u of [2000, 1000, 500]) while (left >= u) { s.tray.push(u); left -= u; } PICK.jajan('bayar'); }
    else if (id === 'lompat_tali') { if (s.pause > 0) { s.pause = 0.0001; return; } s.t = s.beat; PICK.lompat_tali(); }
  }
  function debugFinish(stars) { if (G) { const f = G.onDone; G = null; if (f) f(stars); } }

  /* ---------- gambar ---------- */
  function txt(ctx, s, x, y, size, col = '#2b2b2b', align = 'center', font = '"Press Start 2P", monospace') {
    ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col; ctx.fillText(s, x, y);
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function button(ctx, x, y, w, h, act, drawInner, key, opt = {}) {
    const i = btns.length, f = i === focus;
    let dx = 0;
    if (G.shake && G.shake.key === key) dx = Math.sin(G.shake.t * 60) * 6;
    btns.push({ x, y, w, h, act });
    ctx.fillStyle = opt.bg || '#fffaf0'; rr(ctx, x + dx, y, w, h, 14); ctx.fill();
    ctx.lineWidth = f ? 5 : 3; ctx.strokeStyle = f ? '#ff9a3b' : '#2f6b3f'; ctx.stroke();
    drawInner(x + dx, y, w, h);
  }
  function frame(ctx) {
    ctx.fillStyle = '#e8f5e0'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2f6b3f'; ctx.fillRect(0, 0, W, 56);
    txt(ctx, TITLE[G.id], 24, 30, 16, '#fff', 'left');
  }
  function progress(ctx, n, total) { txt(ctx, `${n}/${total}`, W - 210, 30, 13, '#ffe14d', 'right'); }

  const DRAW = {
    wudhu(ctx) {
      const s = G.s; progress(ctx, s.idx, 8);
      for (let i = 0; i < 8; i++) {
        const x = 26 + i * 114, y = 70;
        ctx.fillStyle = i < s.idx ? '#fffaf0' : '#cfe3c6'; rr(ctx, x, y, 104, 104, 10); ctx.fill(); ctx.strokeStyle = '#2f6b3f'; ctx.lineWidth = 2; ctx.stroke();
        if (i < s.idx) Spr.fit(ctx, 'wudhu', M.WUDHU[i], x + 4, y + 4, 96, 96); else txt(ctx, String(i + 1), x + 52, y + 52, 20, '#2f6b3f');
      }
      const left = s.cards.filter(c => M.WUDHU.indexOf(c) >= s.idx);
      left.forEach((c, i) => {
        const x = 40 + (i % 4) * 225, y = 200 + Math.floor(i / 4) * 165;
        button(ctx, x, y, 205, 150, () => PICK.wudhu(c), (bx, by, bw, bh) => Spr.fit(ctx, 'wudhu', c, bx + 30, by + 6, bw - 60, bh - 12), c);
      });
    },
    dhuha(ctx) {
      const s = G.s, pose = M.DHUHA[s.idx]; progress(ctx, s.idx, M.DHUHA.length);
      Spr.draw(ctx, 'sekolah', 'ustadz', 150, 300, 200);
      ctx.fillStyle = '#fffaf0'; rr(ctx, 270, 80, 280, 220, 18); ctx.fill(); ctx.strokeStyle = '#2f6b3f'; ctx.lineWidth = 3; ctx.stroke();
      if (pose) { Spr.draw(ctx, 'falisha', 'pose.' + pose, 410, 262, 165); txt(ctx, 'Allahu Akbar', 410, 284, 11, '#2f6b3f'); }
      Spr.draw(ctx, 'falisha', 'pose.' + (M.DHUHA[s.idx - 1] || 'qiyam'), 760, 300, 190);
      txt(ctx, 'Falisha', 760, 320, 10, '#2f6b3f');
      Object.keys(POSE).forEach((p, i) => {
        button(ctx, 40 + i * 225, 350, 205, 170, () => PICK.dhuha(p), (bx, by, bw, bh) => {
          Spr.draw(ctx, 'falisha', 'pose.' + p, bx + bw / 2, by + bh - 34, 120); txt(ctx, POSE[p], bx + bw / 2, by + bh - 16, 11);
        }, p);
      });
    },
    iqro(ctx) {
      const s = G.s; progress(ctx, s.round, 10);
      txt(ctx, 'Mana huruf ' + M.HIJAIYAH[s.q.answer].name + '?', W / 2, 150, 22, '#2f6b3f');
      s.q.options.forEach((o, i) => {
        button(ctx, 50 + i * 225, 200, 195, 220, () => PICK.iqro(o), (bx, by, bw, bh) => {
          if (!Spr.fit(ctx, 'iqro', String(o), bx + 12, by + 12, bw - 24, bh - 24)) txt(ctx, M.HIJAIYAH[o].ch, bx + bw / 2, by + bh / 2, 96, '#111', 'center', '"Noto Naskh Arabic", serif');
        }, o);
      });
    },
    hitung(ctx) {
      const s = G.s, q = s.q; progress(ctx, s.round, 10);
      const apples = (n, x0, cross) => { for (let i = 0; i < n; i++) { const x = x0 + (i % 5) * 46, y = 90 + Math.floor(i / 5) * 46; Spr.fit(ctx, 'props', 'apel', x, y, 40, 40); if (cross && i >= n - cross) { ctx.strokeStyle = '#d02020'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x + 4, y + 4); ctx.lineTo(x + 36, y + 36); ctx.moveTo(x + 36, y + 4); ctx.lineTo(x + 4, y + 36); ctx.stroke(); } } };
      if (q.op === '+') { apples(q.a, 120, 0); txt(ctx, '+', 480, 150, 40, '#2f6b3f'); apples(q.b, 600, 0); }
      else apples(q.a, 360 - Math.min(q.a, 5) * 23 + 120, q.b);
      txt(ctx, `${q.a} ${q.op} ${q.b} = ?`, W / 2, 330, 28, '#2b2b2b');
      q.choices.forEach((c, i) => button(ctx, 150 + i * 230, 390, 200, 120, () => PICK.hitung(c), (bx, by, bw, bh) => txt(ctx, String(c), bx + bw / 2, by + bh / 2, 40, '#2f6b3f'), c));
    },
    doa(ctx) {
      const s = G.s, parts = M.DOA[s.d].parts; progress(ctx, s.d + 1, 2);
      txt(ctx, s.d === 0 ? 'Doa sebelum makan' : 'Doa keluar rumah', W / 2, 90, 14, '#2f6b3f');
      ctx.fillStyle = '#fffaf0'; rr(ctx, 30, 115, 900, 110, 14); ctx.fill(); ctx.strokeStyle = '#2f6b3f'; ctx.lineWidth = 3; ctx.stroke();
      const built = parts.slice(0, s.idx).join(' ');
      const lines = built.length > 44 ? [parts.slice(0, Math.ceil(s.idx / 2)).join(' '), parts.slice(Math.ceil(s.idx / 2), s.idx).join(' ')] : [built];
      lines.forEach((l, i) => txt(ctx, l || '...', W / 2, 150 + i * 36, 15, '#2b2b2b'));
      s.parts.filter(p => parts.indexOf(p) >= s.idx).forEach((p, i) => {
        const x = 30 + (i % 3) * 305, y = 250 + Math.floor(i / 3) * 135;
        button(ctx, x, y, 290, 115, () => PICK.doa(p), (bx, by, bw, bh) => txt(ctx, p, bx + bw / 2, by + bh / 2, p.length > 15 ? 12 : 15, '#2f6b3f'), p);
      });
    },
    jajan(ctx) {
      const s = G.s, item = M.PESANAN[s.order]; progress(ctx, s.order, M.PESANAN.length);
      if (!item) return;
      Spr.draw(ctx, 'sekolah', 'kantin', 110, 300, 200);
      ctx.fillStyle = '#fffaf0'; rr(ctx, 230, 80, 320, 200, 16); ctx.fill(); ctx.strokeStyle = '#2f6b3f'; ctx.lineWidth = 3; ctx.stroke();
      Spr.fit(ctx, 'jajan', item, 250, 95, 120, 120);
      txt(ctx, NAMA[item], 460, 130, 16); txt(ctx, rp(M.HARGA[item]), 460, 180, 16, '#c0392b');
      txt(ctx, 'Uang di nampan:', 760, 90, 11, '#2f6b3f');
      ctx.fillStyle = '#d9b98a'; rr(ctx, 600, 105, 330, 170, 16); ctx.fill();
      s.tray.forEach((u, i) => Spr.fit(ctx, 'jajan', 'uang' + u, 610 + (i % 5) * 62, 115 + Math.floor(i / 5) * 60, 56, 52));
      txt(ctx, rp(s.tray.reduce((a, b) => a + b, 0)), 765, 262, 12, '#2b2b2b');
      M.UANG.forEach((u, i) => button(ctx, 40 + i * 175, 330, 160, 180, () => PICK.jajan(u), (bx, by, bw, bh) => {
        Spr.fit(ctx, 'jajan', 'uang' + u, bx + 15, by + 15, bw - 30, bh - 70); txt(ctx, rp(u), bx + bw / 2, by + bh - 28, 12);
      }, u));
      button(ctx, 580, 330, 170, 180, () => PICK.jajan('bayar'), (bx, by, bw, bh) => txt(ctx, 'BAYAR', bx + bw / 2, by + bh / 2, 18, '#fff'), 'bayar', { bg: '#2e8c46' });
      button(ctx, 770, 330, 160, 180, () => PICK.jajan('reset'), (bx, by, bw, bh) => txt(ctx, 'ULANG', bx + bw / 2, by + bh / 2, 13), 'reset');
    },
    lompat_tali(ctx) {
      const s = G.s; progress(ctx, s.count, 20);
      const ph = s.pause > 0 ? 0.5 : Math.max(0, Math.min(1, (s.t - s.prev) / (s.beat - s.prev)));
      const ang = ph * Math.PI * 2, cx = 480, ry = 150 * Math.cos(ang);
      Spr.draw(ctx, 'sekolah', 'anasya', 200, 400, 200); Spr.draw(ctx, 'sekolah', 'ayana', 760, 400, 200);
      const ropeBack = Math.cos(ang) < 0;
      const rope = () => { ctx.strokeStyle = '#8b4513'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(250, 300); ctx.quadraticCurveTo(cx, 300 + ry * 1.4, 710, 300); ctx.stroke(); };
      if (ropeBack) rope();
      Spr.draw(ctx, 'falisha', s.jump > 0 ? 'pose.lompat' : 'walk.down.1', cx, 410 - Math.sin(Math.min(1, s.jump / 0.35) * Math.PI) * 50, 170);
      if (!ropeBack) rope();
      button(ctx, 330, 440, 300, 84, () => PICK.lompat_tali(), (bx, by, bw, bh) => txt(ctx, 'LOMPAT!', bx + bw / 2, by + bh / 2, 22, '#fff'), 'jump', { bg: '#2e8c46' });
    }
  };
  function draw(ctx) {
    if (!G) return;
    btns = [];
    frame(ctx);
    if (G.end > 0) {
      const st = M.stars(G.mistakes);
      txt(ctx, '★'.repeat(st) + '☆'.repeat(3 - st), W / 2, 220, 64, '#f4b400', 'center', 'serif');
      txt(ctx, st === 3 ? 'Hebat!' : st === 2 ? 'Bagus!' : 'Sudah selesai!', W / 2, 320, 28, '#2f6b3f');
      return;
    }
    DRAW[G.id](ctx);
    if (G.msg) {
      ctx.fillStyle = 'rgba(47,107,63,0.92)'; rr(ctx, 200, 62, 560, 40, 12); ctx.fill();
      txt(ctx, G.msg.text, W / 2, 83, G.msg.text.length > 34 ? 10 : 12, '#fff');
    }
  }
  return { start, active, update, draw, debugSolveStep, debugFinish, TITLE };
})();
