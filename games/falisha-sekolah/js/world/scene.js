/* Petualangan Falisha di MIMHa – peta aktif: gerak, tabrakan, warp, interaksi, gambar urut-Y */
const Scene = (() => {
  const W = 960, H = 540;
  const FAM = { pupu: 1, baymax: 1, nono: 1, arsyad: 1 };
  let map = null, mapId = '', P = null, follower = null, target = null, t = 0, banner = 0;
  const S = { debug: false };
  const key = o => mapId + ':' + o.id;
  const stepId = st => (Quests.current(st) || {}).id;
  const npcVisible = (n, st) => {
    if (n.id === 'baymax') return stepId(st) === 'berangkat';
    return !n.when || n.when === stepId(st);
  };
  const activeObjects = st => map.objects.filter(o => o.step === stepId(st) && !Quests.isPicked(st, key(o)));
  const npcBox = n => ({ x: n.x - 16, y: n.y - 40, w: 32, h: 40 });
  function enter(id, spawnKey, st) {
    map = MAPS[id]; mapId = id;
    const sp = map.spawns[spawnKey] || map.spawns.default;
    const b = MAPS.footBox(sp.x, sp.y);
    P = Player.create(b.x, b.y, sp.face);
    follower = null;
    const bay = map.npcs.find(n => n.id === 'baymax');
    if (bay && npcVisible(bay, st)) follower = { x: sp.x - 40, y: sp.y, face: sp.face, moving: false, t: 0, trail: [] };
    target = null; banner = 2.4;
  }
  function walls(st) {
    const solid = map.npcs.filter(n => n.id !== 'baymax' && npcVisible(n, st)).map(n => MAPS.footBox(n.x, n.y));
    return map.walls.concat(solid);
  }
  function findTarget(st) {
    const f = Player.frontRect(P), body = { x: P.x - 6, y: P.y - 6, w: P.w + 12, h: P.h + 12 };
    for (const n of map.npcs) if (n.id !== 'baymax' && npcVisible(n, st) && Collide.overlaps(f, npcBox(n))) return { type: 'talk', npc: n.id, x: n.x, y: n.y - map.charH };
    for (const o of activeObjects(st)) {
      const ob = { x: o.x - 18, y: o.y - 26, w: 36, h: 30 };
      if (Collide.overlaps(f, ob) || Collide.overlaps(body, ob)) return { type: 'pick', key: key(o), item: o.item, obj: o, x: o.x, y: o.y - 40 };
    }
    for (const s of map.spots) if (Collide.overlaps(f, s) || Collide.overlaps(body, s)) return { type: 'spot', id: s.id, x: s.x + s.w / 2, y: s.y - 10 };
    return null;
  }
  function update(dt, axis, action, st) {
    t += dt; banner = Math.max(0, banner - dt);
    Player.update(P, axis, dt, walls(st));
    if (follower) {
      const fx = P.x + P.w / 2, fy = P.y + P.h;
      follower.trail.push([fx, fy, P.face]);
      if (follower.trail.length > 14) { const [x, y, face] = follower.trail.shift(); follower.moving = Math.hypot(x - follower.x, y - follower.y) > 0.5; follower.x = x; follower.y = y; follower.face = face; }
      else follower.moving = false;
      follower.t += dt;
    }
    for (const w of map.warps) if (Collide.overlaps(P, w)) return { type: 'warp', to: w.to, at: w.at };
    target = findTarget(st);
    if (action && target) {
      const { type, npc, key: k, item, id } = target;
      return type === 'talk' ? { type, npc } : type === 'pick' ? { type, key: k, item } : { type, id };
    }
    return null;
  }
  function drawPerson(ctx, id, x, y, face, moving, tt, h) {
    if (FAM[id]) {
      const side = face === 'left' || face === 'right';
      const fr = side ? (moving && Math.floor(tt * 8) % 2 ? 'walk0' : 'walk1') : 'down';
      Spr.draw(ctx, 'keluarga', `${id}.${fr}`, x, y, h * 1.05, face === 'left');
    } else Spr.draw(ctx, 'sekolah', id, x, y, h * 1.1);
  }
  function shadow(ctx, x, y, w) { ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(x, y - 2, w, w * 0.32, 0, 0, 7); ctx.fill(); }
  function draw(ctx, st) {
    const bg = Spr.img(map.bg);
    if (bg) ctx.drawImage(bg, 0, 0, W, H); else { ctx.fillStyle = '#5a8a4a'; ctx.fillRect(0, 0, W, H); }
    const h = map.charH, list = [];
    for (const n of map.npcs) if (n.id !== 'baymax' && npcVisible(n, st)) list.push({ y: n.y, d: () => { shadow(ctx, n.x, n.y, 14); drawPerson(ctx, n.id, n.x, n.y, n.face, false, t, h); } });
    if (follower) list.push({ y: follower.y, d: () => { shadow(ctx, follower.x, follower.y, 14); drawPerson(ctx, 'baymax', follower.x, follower.y, follower.face, follower.moving, follower.t, h); } });
    for (const o of activeObjects(st)) list.push({ y: o.y, d: () => { const b = Math.sin(t * 4 + o.x) * 3; shadow(ctx, o.x, o.y, 10); Spr.fit(ctx, 'items', o.sprite, o.x - 16, o.y - 34 + b, 32, 32); } });
    for (const s of map.spots) if (s.sprite) list.push({ y: s.y + s.h, d: () => Spr.fit(ctx, 'items', s.sprite, s.x, s.y, s.w, s.h) });
    const px = P.x + P.w / 2, py = P.y + P.h;
    list.push({ y: py, d: () => {
      shadow(ctx, px, py, 13);
      const face = P.face === 'left' ? 'right' : P.face;
      Spr.draw(ctx, 'falisha', `walk.${face}.${P.frame}`, px, py + 2, h, P.face === 'left');
    } });
    list.sort((a, b) => a.y - b.y).forEach(e => e.d());
    drawGuide(ctx, st);
    if (target) {
      const y = target.y - 8 + Math.sin(t * 6) * 3;
      ctx.fillStyle = '#ffe14d'; ctx.strokeStyle = '#1d4d2b'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(target.x, y, 13, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#1d4d2b'; ctx.font = '12px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', target.x, y + 1);
    }
    if (S.debug) {
      ctx.fillStyle = 'rgba(255,0,0,0.3)'; for (const w of map.walls) ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = 'rgba(0,80,255,0.45)'; for (const w of map.warps) ctx.fillRect(w.x, w.y, w.w, w.h);
      ctx.fillStyle = 'rgba(0,255,0,0.4)'; for (const s of map.spots) ctx.fillRect(s.x, s.y, s.w, s.h);
      ctx.strokeStyle = '#ff0'; ctx.lineWidth = 1; ctx.strokeRect(P.x, P.y, P.w, P.h);
    }
  }
  /* ---------- papan nama pintu, panah tujuan, banner nama area ---------- */
  const ROT = { up: -Math.PI / 2, down: Math.PI / 2, left: Math.PI, right: 0 };
  function arrow(ctx, x, y, dir, size, fill, stroke) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ROT[dir]);
    ctx.beginPath(); ctx.moveTo(size, 0); ctx.lineTo(0, -size * 0.75); ctx.lineTo(0, -size * 0.32); ctx.lineTo(-size, -size * 0.32);
    ctx.lineTo(-size, size * 0.32); ctx.lineTo(0, size * 0.32); ctx.lineTo(0, size * 0.75); ctx.closePath();
    ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = stroke; ctx.stroke(); ctx.restore();
  }
  function label(ctx, text, x, y, hot) {
    ctx.font = '10px "Press Start 2P", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(text).width + 44, h = 26;
    ctx.fillStyle = hot ? '#ffe14d' : 'rgba(92,58,30,0.9)'; ctx.strokeStyle = hot ? '#c0392b' : '#f4dfb0'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - w / 2, y - h / 2, w, h, 8) : ctx.rect(x - w / 2, y - h / 2, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = hot ? '#5a2a10' : '#fff'; ctx.fillText(text, x + 10, y + 1);
    return w;
  }
  function drawGuide(ctx, st) {
    const g = typeof Guide !== 'undefined' ? Guide.next(st, mapId) : null;
    for (const w of map.warps) {
      const sg = Guide.sign(w), hot = g && g.type === 'warp' && g.warp === w;
      const lw = label(ctx, sg.name, sg.x, sg.y, hot);
      arrow(ctx, sg.x - lw / 2 + 16, sg.y, sg.dir, 9, hot ? '#c0392b' : '#ffe14d', hot ? '#fff' : '#5a2a10');
      if (hot) {
        const b = Math.sin(t * 6) * 8, cx = w.x + w.w / 2, cy = w.y + w.h / 2;
        const off = { up: [0, 30], down: [0, -30], left: [30, 0], right: [-30, 0] }[sg.dir];
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 6); ctx.fillStyle = '#ffe14d'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.globalAlpha = 1;
        const k = sg.dir === 'up' || sg.dir === 'down' ? [0, b] : [b, 0];
        arrow(ctx, cx + off[0] + k[0] * (sg.dir === 'left' ? -1 : 1), cy + off[1] + k[1] * (sg.dir === 'up' ? -1 : 1), sg.dir, 20, '#ffe14d', '#c0392b');
      }
    }
    if (g && g.type === 'point' && !(target && Math.hypot(target.x - g.x, target.y - (g.y - map.charH)) < 30)) {
      const b = Math.abs(Math.sin(t * 5)) * 10, top = g.id === 'tong' ? g.y - 70 : g.y - (map.npcs.some(n => n.id === g.id) ? map.charH * 1.15 + 18 : 52);
      arrow(ctx, g.x, top - b, 'down', 16, '#ffe14d', '#c0392b');
    }
    if (banner > 0) {
      ctx.globalAlpha = Math.min(1, banner * 2);
      const name = Guide.PLACE[mapId];
      ctx.font = '18px "Press Start 2P", monospace'; const w = ctx.measureText(name).width + 70;
      ctx.fillStyle = 'rgba(18,48,28,0.88)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(480 - w / 2, 110, w, 50, 14) : ctx.rect(480 - w / 2, 110, w, 50); ctx.fill();
      ctx.strokeStyle = '#ffe14d'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(480 - w / 2 + 26, 130, 8, Math.PI, 0); ctx.lineTo(480 - w / 2 + 26, 147); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(name, 480 + 14, 136);
      ctx.globalAlpha = 1;
    }
  }
  return Object.assign(S, { enter, update, draw, player: () => P, mapId: () => mapId, target: () => target, activeObjects });
})();
