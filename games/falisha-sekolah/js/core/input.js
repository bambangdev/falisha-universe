/* Petualangan Falisha di MIMHa – input keyboard + joystick virtual + tombol sentuh */
const Input = (() => {
  const KEYS = {
    ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right',
    ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down',
    ' ': 'action', Enter: 'action', j: 'action', J: 'action', Escape: 'menu', m: 'mute', M: 'mute'
  };
  let held = {}, edge = {}, joy = { dx: 0, dy: 0 };
  const clamp = v => Math.max(-1, Math.min(1, v));
  function press(name) { if (!held[name]) edge[name] = true; held[name] = true; }
  function keyDown(key) { const n = KEYS[key]; if (n) press(n); return !!n; }
  function keyUp(key) { const n = KEYS[key]; if (n) held[n] = false; return !!n; }
  function setJoystick(dx, dy) {
    const dz = v => (Math.abs(v) < 0.25 ? 0 : clamp(v));
    joy = { dx: dz(dx), dy: dz(dy) };
  }
  function axis() {
    const kx = (held.right ? 1 : 0) - (held.left ? 1 : 0), ky = (held.down ? 1 : 0) - (held.up ? 1 : 0);
    return { dx: clamp(kx + joy.dx), dy: clamp(ky + joy.dy) };
  }
  const pressed = name => !!edge[name];
  function endFrame() { edge = {}; }
  function reset() { held = {}; edge = {}; joy = { dx: 0, dy: 0 }; }
  /* pasang listener DOM: joystick div (+ knob) dan tombol [data-k] */
  function attach(win, joyEl, btnEls) {
    win.addEventListener('keydown', e => { if (keyDown(e.key)) e.preventDefault(); });
    win.addEventListener('keyup', e => keyUp(e.key));
    win.addEventListener('blur', reset);
    if (joyEl) {
      const knob = joyEl.firstElementChild;
      let id = null;
      const move = e => {
        const r = joyEl.getBoundingClientRect(), R = r.width / 2;
        if (!R) return;
        let dx = (e.clientX - r.left - R) / R, dy = (e.clientY - r.top - R) / R;
        const m = Math.hypot(dx, dy); if (m > 1) { dx /= m; dy /= m; }
        setJoystick(dx, dy);
        if (knob) knob.style.transform = `translate(${dx * R * 0.6}px, ${dy * R * 0.6}px)`;
      };
      const cap = (el, id) => { try { el.setPointerCapture(id); } catch (e) {} };
      const end = e => {
        if (id !== e.pointerId) return;
        id = null; joy = { dx: 0, dy: 0 }; if (knob) knob.style.transform = '';
      };
      joyEl.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; cap(joyEl, id); move(e); });
      joyEl.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) joyEl.addEventListener(ev, end);
    }
    for (const b of btnEls || []) {
      const k = b.dataset.k;
      b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (err) {} b.classList.add('on'); press(k); });
      const off = e => { e.preventDefault(); b.classList.remove('on'); held[k] = false; };
      for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) b.addEventListener(ev, off);
    }
  }
  return { keyDown, keyUp, setJoystick, axis, pressed, endFrame, reset, attach };
})();
if (typeof module === 'object' && module.exports) module.exports = Input;
