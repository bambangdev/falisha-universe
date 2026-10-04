/* Audio chiptune bersama: SFX + sequencer musik (Web Audio, tanpa file) */
window.Chip = (() => {
  let actx = null, noiseBuf = null, muted = localStorage.getItem('ftf_muted') === '1';
  const mus = { tracks: [], track: -1, step: 0, next: 0, timer: null };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function ensure() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      if (!noiseBuf) { noiseBuf = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    } catch (e) {}
    return actx;
  }
  function tone(f, t, d, type = 'square', vol = 0.05, slide = 0) {
    if (!actx || muted) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.02);
  }
  function noise(t, d, vol, hp = 5000) {
    if (!actx || muted || !noiseBuf) return;
    const s = actx.createBufferSource(), g = actx.createGain(), f = actx.createBiquadFilter();
    s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = hp;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(f).connect(g).connect(actx.destination); s.start(t); s.stop(t + d + 0.02);
  }
  const beep = (f, d = 0.1, type = 'square', vol = 0.06, slide = 0) => { if (ensure()) tone(f, actx.currentTime, d, type, vol, slide); };
  const hit = (power = 1) => { if (ensure()) { noise(actx.currentTime, 0.12 * power, 0.12, 900); tone(160, actx.currentTime, 0.12, 'square', 0.08, -90); } };
  function schedule() {
    if (!actx || mus.track < 0) return;
    if (muted) { mus.next = actx.currentTime + 0.1; return; }
    const tr = mus.tracks[mus.track], sd = 60 / tr.bpm / 4;
    while (mus.next < actx.currentTime + 0.25) {
      const s = mus.step, idx = s % 16, t = mus.next;
      const n = tr.lead[s % tr.lead.length]; if (n != null) tone(mtof(n), t, sd * 1.8, tr.wave, 0.03);
      if (idx % 2 === 0) { const root = tr.bass[Math.floor(s / 16) % tr.bass.length]; tone(mtof(idx % 4 === 2 ? root + 7 : root), t, sd * 1.7, 'triangle', 0.09); }
      if (idx % 4 === 0) tone(140, t, 0.1, 'sine', 0.12, -100);
      if (idx === 4 || idx === 12) noise(t, 0.1, 0.07, 1500);
      if (idx % 2 === 0) noise(t, 0.04, 0.025, 7000);
      mus.next += sd; mus.step++;
    }
  }
  function play(tracks, i) {
    if (!ensure()) return;
    if (mus.tracks === tracks && mus.track === i) return;
    mus.tracks = tracks; mus.track = i; mus.step = 0; mus.next = actx.currentTime + 0.1;
    if (!mus.timer) mus.timer = setInterval(schedule, 40);
  }
  function setMuted(m) { muted = m; localStorage.setItem('ftf_muted', m ? '1' : '0'); }
  return { ensure, tone, noise, beep, hit, play, mtof, setMuted, isMuted: () => muted, now: () => actx && actx.currentTime };
})();
