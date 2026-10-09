/* Petualangan Falisha di MIMHa – simpanan localStorage (data rusak = mulai baru) */
const Save = (() => {
  const KEY = 'fsm_save';
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  function valid(s) {
    return isObj(s) && s.v === 1 && Number.isInteger(s.step) && s.step >= 0 && s.step <= Quests.STEPS.length
      && isObj(s.items) && isObj(s.stars) && Number.isInteger(s.stickers) && Array.isArray(s.picked);
  }
  function load(storage) {
    try { const s = JSON.parse(storage.getItem(KEY)); if (valid(s)) return s; } catch (e) {}
    return Quests.create();
  }
  function store(storage, s) { try { storage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }
  function clear(storage) { try { storage.removeItem(KEY); } catch (e) {} }
  return { KEY, load, store, clear };
})();
if (typeof module === 'object' && module.exports) module.exports = Save;
