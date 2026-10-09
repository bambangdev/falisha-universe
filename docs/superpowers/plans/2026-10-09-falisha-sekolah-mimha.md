# Petualangan Falisha di MIMHa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Game ke-8 portal Dunia Falisha: RPG top-down satu hari sekolah Falisha di MIMHa, dengan 14 langkah cerita dan 7 mini-game edukasi, memakai sprite Gemini dari `games/falisha-sekolah/assets/raw/`.

**Architecture:** Halaman statis (Canvas 2D 960×540, vanilla JS tanpa build step). Ada modul logika murni (`Collide`, `Player`, `Quests`, `Save`, `MGLogic`, `Script`, `MAPS`) yang diuji dengan `node --test`. Di atasnya ada lapisan tampilan (`Spr`, `Scene`, `Dialog`, `Minigames`, `Game`) yang diuji lewat smoke test Playwright memakai API debug `?debug=1`. Sprite mentah diolah oleh `tools/build_assets.py` menjadi atlas + `atlas.js`.

**Tech Stack:** HTML5 Canvas, vanilla JS (classic `<script>`), `shared/audio.js` (`Chip`), Node 22 `node:test`, Python 3 + Pillow, Playwright global (`$(npm root -g)/playwright`, Chromium `/opt/pw-browsers/chromium`).

**Spec:** `docs/plans/08-falisha-sekolah-mimha-plan.md` (+ daftar sprite: `docs/plans/08-falisha-sekolah-mimha-sprite-prompts.md`)

## Global Constraints
- Folder game: `games/falisha-sekolah/`; id portal `falisha-sekolah`; judul "Petualangan Falisha di MIMHa".
- Canvas logis 960×540, `object-fit: contain`. Font UI `Press Start 2P`, huruf hijaiyah `Noto Naskh Arabic` (Google Fonts).
- Tanpa dependensi runtime dan tanpa build step. Script dimuat berurutan di `index.html` seperti game lain.
- **Setiap file JS mendeklarasikan tepat SATU global** bernama sama dengan modulnya (`const Collide = (() => {...})();`). Tidak boleh ada deklarasi top-level lain, karena bentrok `const S` pernah merusak Falisha Kart Turbo. Modul logika ditutup dengan `if (typeof module === 'object' && module.exports) module.exports = Nama;`.
- Semua teks UI dalam Bahasa Indonesia, sesuai spesifikasi. Ramah anak: tidak ada game over, tidak ada timer yang menghukum.
- Simpanan: `localStorage` kunci `fsm_save`; opsi suara memakai `Chip.setMuted` bawaan.
- Kontrol: joystick virtual + tombol A + ☰ (tablet); panah/WASD, Spasi/Enter/J, Esc, M (keyboard).
- Tes logika: `node --test games/falisha-sekolah/tests/`. Smoke: `PW=$(npm root -g)/playwright node games/falisha-sekolah/tools/smoke.js` (server `python3 -m http.server 8765` dari root repo).
- Prasyarat eksekusi: 20 file wajib di checklist prompt sudah ada di `assets/raw/`. `iqro_cards.png` opsional; tanpa file itu, huruf digambar dengan font.

## Review Focus
1. **Spawn/warp menaruh Falisha di dalam tembok**, sehingga dia macet setelah pindah peta. Harapan: setiap titik spawn & objek bebas tembok (Task 6, `maps.test.js`).
2. **Jari lepas dari joystick di luar tombol** (`pointercancel`/`lostpointercapture`), sehingga Falisha jalan terus. Harapan: `Input.reset()` dipanggil dan karakter berhenti (Task 3, `input.test.js` + smoke).
3. **Simpanan lama/rusak di localStorage** (JSON rusak, `v` beda, `step` di luar rentang), sehingga game crash di judul. Harapan: kembali ke simpanan baru (Task 4, `save.test.js`).
4. **Anak bicara ke NPC di luar urutan cerita** atau mengulang mini-game yang sudah selesai, sehingga state lompat atau mundur. Harapan: NPC memberi petunjuk tanpa mengubah state, dan bintang tidak turun (Task 4 + Task 7 tests).
5. **Barang koleksi dipungut dua kali** setelah keluar-masuk peta atau setelah load, sehingga hitungan pensil/sampah > target. Harapan: id `peta:objek` tercatat di `picked` dan tidak muncul lagi (Task 4, `quests.test.js`).

---

### Task 1: Kerangka game, harness tes, dan `Collide`

**Files:**
- Create: `games/falisha-sekolah/index.html`, `games/falisha-sekolah/css/style.css`, `games/falisha-sekolah/js/core/collide.js`
- Test: `games/falisha-sekolah/tests/collide.test.js`

**Interfaces:**
- Produces: `Collide.overlaps(a, b) -> boolean` (rect `{x,y,w,h}`; bersentuhan tepi = `false`); `Collide.moveBox(box, dx, dy, walls) -> {x, y}` (gerak sumbu X lalu Y, sub-langkah ≤ 8 px, berhenti rapat di tembok); `Collide.insideAny(box, walls) -> boolean`.

- [ ] **Step 1: Tulis tes yang gagal** — `collide.test.js` (pakai `node:test` + `node:assert/strict`, `require('../js/core/collide.js')`):
  - `overlaps({x:0,y:0,w:10,h:10},{x:10,y:0,w:5,h:5}) === false`; `overlaps(...,{x:9,y:9,w:5,h:5}) === true`.
  - `moveBox({x:0,y:0,w:10,h:10}, 15, 0, [{x:20,y:0,w:10,h:10}])` → `{x:10, y:0}`.
  - meluncur: `moveBox({x:0,y:0,w:10,h:10}, 15, 5, [{x:20,y:-50,w:10,h:100}])` → `{x:10, y:5}`.
  - tidak menembus: `moveBox({x:0,y:0,w:10,h:10}, 100, 0, [{x:20,y:0,w:4,h:10}])` → `x === 10`.
  - `insideAny({x:5,y:5,w:2,h:2}, [{x:0,y:0,w:10,h:10}]) === true`.
- [ ] **Step 2: Jalankan** `node --test games/falisha-sekolah/tests/` → FAIL (`Cannot find module`).
- [ ] **Step 3: Implementasi `collide.js`** sesuai Interfaces.
- [ ] **Step 4: Buat `index.html` + `style.css`**. Pola diambil dari `games/falisha-spidey/index.html` dan `css/style.css`: canvas `#game` 960×540, `#sys` (🏠 `../../index.html`, ⏸ `#btn-menu`, 🔊 `#btn-mute`, ⛶ `#btn-full`), `#touch.hidden` berisi `#joy` (div joystick 150 px dengan `#joy-knob`) di kiri serta `.tbtn[data-k=action]` "A" dan `.tbtn[data-k=menu]` "☰" di kanan. Muat font `Press Start 2P` dan `Noto Naskh Arabic`. Urutan script: `../../shared/audio.js`, `assets/sprites/atlas.js`, `js/core/collide.js`, `js/core/input.js`, `js/core/sprites.js`, `js/core/save.js`, `js/world/maps.js`, `js/world/player.js`, `js/world/scene.js`, `js/story/quests.js`, `js/story/script.js`, `js/story/dialog.js`, `js/minigames/logic.js`, `js/minigames/screens.js`, `js/game.js`.
- [ ] **Step 5: Jalankan** `node --test games/falisha-sekolah/tests/` → PASS 5 tes.
- [ ] **Step 6: Commit** `feat(falisha-sekolah): kerangka halaman + Collide`.

### Task 2: Pipeline aset (`tools/build_assets.py`) dan loader `Spr`

**Files:**
- Create: `games/falisha-sekolah/tools/build_assets.py`, `games/falisha-sekolah/js/core/sprites.js`
- Output (di-commit): `games/falisha-sekolah/assets/sprites/*.png`, `assets/sprites/maps/*.jpg`, `assets/sprites/atlas.js`

**Interfaces:**
- Consumes: file mentah di `assets/raw/` (nama persis dari checklist prompt, `.png`/`.jpg`/`.jpeg`).
- Produces:
  - `window.ATLAS = { <sheet>: { cell: <lebar sel px>, frames: { <nama>: [x,y,w,h,ox,oy] } } }`. `ox` = offset kiri dari tengah sel, `oy` = offset bawah dari dasar sel (≤ 0). Format ini sama dengan `games/falisha-kart-turbo/assets/sprites/atlas.js`.
  - `Spr.load() -> Promise`, `Spr.progress() -> 0..1`, `Spr.draw(ctx, sheet, name, cx, by, heightPx, flip=false) -> boolean` (anchor tengah-bawah, skala dari **tinggi sel**), `Spr.img(key) -> HTMLImageElement|undefined` untuk gambar penuh (`map_*`, `cover`, `rapor_bg`), `Spr.has(sheet, name) -> boolean`.
  - Nama frame:

| sheet | grid | nama frame |
|---|---|---|
| `falisha` (walk 3×4 + poses 4×2) | | `walk.{down,left,right,up}.{0,1,2}`, `pose.{lompat,baca,makan,tali,qiyam,rukuk,sujud,duduk}` |
| `keluarga` 4×4 | kolom = pupu, baymax, nono, arsyad | `<id>.{down,wave,walk0,walk1}` |
| `sekolah` 4×2 | | `guru, ustadz, satpam, kantin, rafi, nisa, zahra, fikri` |
| `portrait` (utama 4×2 + sekolah 4×2) | tanpa chroma-key | `falisha.{senang,kaget,sedih,bangga}`, `pupu, baymax, nono, arsyad, guru, ustadz, satpam, kantin, rafi, nisa, zahra, fikri` |
| `items` 4×4 | | `tas, botol, iqro, bekal, pensil_merah, pensil_kuning, pensil_hijau, pensil_biru, pensil_ungu, kertas, botol_plastik, bungkus, tong, bintang, hati, panah` |
| `jajan` 4×2 | | `roti, susu, pisang, risol, uang500, uang1000, uang2000, dompet` |
| `wudhu` 4×2 | tanpa chroma-key | `tangan, kumur, hidung, wajah, lengan, kepala, telinga, kaki` |
| `iqro` 7×4 (opsional) | tanpa chroma-key | `0`…`27` |
| `props` 4×2 | | `apel, tali, bedug, hati_bubble, keran, sajadah, bel, piala` |
| `ui` | | `dialog` (dari `dialog_box.png`, chroma-key, tanpa grid) |

- [ ] **Step 1:** Salin fungsi `key()` (flood fill magenta dari tepi + lubang magenta murni < 75) dan `pack()` dari `games/falisha-kart-turbo/tools/build_atlas.py`. Tambahkan `grid(path, cols, rows, inset=6, keyed=True)`. Peta: crop/resize ke 1280×720, JPG q85 → `assets/sprites/maps/<id>.jpg`. `cover` 1280×720, `rapor_bg` 1280×720. Semua sheet berpiksel 0.5× sel asli, maksimal tinggi sel 160 px. File opsional yang tidak ada dilewati dengan pesan `LEWATI <nama>`.
- [ ] **Step 2: Jalankan** `python3 -I games/falisha-sekolah/tools/build_assets.py games/falisha-sekolah/assets/raw games/falisha-sekolah/assets/sprites`. Expected: tercetak jumlah frame `falisha 20, keluarga 16, sekolah 8, portrait 16, items 16, jajan 8, wudhu 8, props 8, ui 1` (+ `iqro 28` bila ada) dan 7 file `maps/*.jpg`.
- [ ] **Step 3: Verifikasi visual.** Render tiap atlas di atas latar hijau ke scratchpad, lalu lihat dengan Read: tidak ada sisa magenta, tidak ada objek yang bolong (cek warna pink pada kerudung/kostum), urutan frame cocok dengan nama. Sel yang cacat → catat untuk minta generate ulang ke user. Untuk sel yang hanya sedikit cacat, sesuaikan `inset`/`crop` per sheet.
- [ ] **Step 4:** Buat `js/core/sprites.js` sesuai Interfaces (pola `games/falisha-kart-turbo/js/sprites.js`).
- [ ] **Step 5: Commit** `assets(falisha-sekolah): olah sprite Gemini jadi atlas + loader`.

### Task 3: `Input` dan `Player`

**Files:**
- Create: `games/falisha-sekolah/js/core/input.js`, `games/falisha-sekolah/js/world/player.js`
- Test: `games/falisha-sekolah/tests/input.test.js`, `games/falisha-sekolah/tests/player.test.js`

**Interfaces:**
- Consumes: `Collide.moveBox`.
- Produces:
  - `Input.keyDown(key)`, `Input.keyUp(key)`: peta kunci → `left/right/up/down/action/menu/mute`.
  - `Input.setJoystick(dx, dy)` (-1..1, deadzone 0.25 → 0).
  - `Input.axis() -> {dx, dy}` (gabungan keyboard + joystick, masing-masing di-clamp -1..1).
  - `Input.pressed(name) -> boolean` (edge, sekali per frame).
  - `Input.endFrame()`, `Input.reset()`.
  - `Input.attach(win, joyEl, btnEls)`: listener DOM; `pointerup/pointercancel/lostpointercapture` dan `blur` → `reset()`.
  - `Player.SPEED = 160`.
  - `Player.create(x, y, face = 'down') -> {x, y, w: 28, h: 18, face, frame: 1, t: 0, moving: false}`. Kotak = kaki; anchor gambar = `(x + w/2, y + h)`.
  - `Player.update(p, axis, dt, walls)`.
  - `Player.frontRect(p) -> {x, y, w: 28, h: 28}` (area interaksi di depan wajah).

- [ ] **Step 1: Tulis tes gagal** — `input.test.js`:
  - `keyDown('ArrowLeft')` → `axis().dx === -1`.
  - `keyDown(' ')` → `pressed('action') === true`, lalu setelah `endFrame()` → `false`, padahal tombol masih ditahan.
  - `setJoystick(0.1, 0.9)` → `{dx: 0, dy: 0.9}`.
  - `reset()` → `axis()` = `{dx: 0, dy: 0}` dan joystick nol.

  `player.test.js`:
  - `update(p, {dx: 1, dy: 0}, 0.5, [])` → `x` bertambah 80, `face === 'right'`.
  - diagonal `{dx: 1, dy: 1}` dt 1 → jarak tempuh 160 ± 0.01.
  - berhenti → `frame === 1`, `moving === false`.
  - berjalan 0.25 dtk → frame mengikuti siklus `[0,1,2,1]` @ 8 fps (frame `2`).
  - tembok di kanan → `x` tidak melewati tembok.
  - `frontRect` saat `face: 'up'` berada di atas kotak kaki.
- [ ] **Step 2: Jalankan** `node --test games/falisha-sekolah/tests/` → FAIL.
- [ ] **Step 3: Implementasi** `input.js` dan `player.js` sesuai Interfaces. Arah hadap dari sumbu dominan, hanya saat bergerak.
- [ ] **Step 4: Jalankan** → PASS.
- [ ] **Step 5: Commit** `feat(falisha-sekolah): input keyboard+joystick dan gerak Player`.

### Task 4: `Quests` dan `Save`

**Files:**
- Create: `games/falisha-sekolah/js/story/quests.js`, `games/falisha-sekolah/js/core/save.js`
- Test: `games/falisha-sekolah/tests/quests.test.js`, `games/falisha-sekolah/tests/save.test.js`

**Interfaces:**
- Produces:
  - `Quests.STEPS`: array 14 objek `{id, text, map}` dengan urutan & teks persis tabel §3 spesifikasi. Contoh: `{id:'siap', text:'Ambil tas & botol minum', map:'rumah'}`, …, `{id:'pulang', text:'Pulang, dijemput Babah Nono & Arsyad', map:'gerbang'}`.
  - `Quests.create() -> {v: 1, step: 0, items: {}, stars: {}, stickers: 0, picked: []}`.
  - `Quests.current(s) -> step | null` (`null` jika selesai) dan `Quests.finished(s)`.
  - `Quests.complete(s, id) -> boolean`: hanya jika `id` = langkah aktif; menaikkan `step` dan `stickers += 1`.
  - `Quests.addItem(s, item, n = 1)`, `Quests.count(s, item) -> number`, `Quests.takeItem(s, item, n) -> boolean`.
  - `Quests.markPicked(s, key) -> boolean` (`false` jika sudah ada) dan `Quests.isPicked(s, key)`.
  - `Quests.setStars(s, gameId, n)` (menyimpan nilai maksimum, rentang 1..3).
  - `Save.KEY = 'fsm_save'`, `Save.load(storage) -> state`, `Save.store(storage, s)`, `Save.clear(storage)`.

- [ ] **Step 1: Tulis tes gagal.** `quests.test.js`:
  - `STEPS.length === 14`, `STEPS[0].id === 'siap'`, `STEPS[13].id === 'pulang'`.
  - `complete(s, 'pamit')` saat langkah `siap` → `false` dan state tidak berubah.
  - `complete(s, 'siap')` → `true`, `current(s).id === 'pamit'`, `stickers === 1`.
  - menyelesaikan 14 langkah → `finished(s) === true`, `current(s) === null`.
  - `setStars(s, 'iqro', 3)` lalu `setStars(s, 'iqro', 1)` → tetap `3`.
  - `markPicked(s, 'kelas:pensil1')` dua kali → `true` lalu `false`.

  `save.test.js` (memakai storage palsu `{getItem, setItem, removeItem}`):
  - roundtrip `store` → `load` sama dengan `deepEqual`.
  - `getItem` mengembalikan `'{rusak'`, `'{"v":0}'`, atau `'{"v":1,"step":99}'` → hasilnya `deepEqual(Quests.create())`.
  - `getItem` melempar error → default.
- [ ] **Step 2: Jalankan** → FAIL.
- [ ] **Step 3: Implementasi** sesuai Interfaces. `Save.load` memvalidasi `v === 1`, `0 ≤ step ≤ 14`, dan tipe `items`/`stars`/`picked`.
- [ ] **Step 4: Jalankan** → PASS.
- [ ] **Step 5: Commit** `feat(falisha-sekolah): state cerita 14 langkah + simpanan`.

### Task 5: Logika mini-game `MGLogic`

**Files:**
- Create: `games/falisha-sekolah/js/minigames/logic.js`
- Test: `games/falisha-sekolah/tests/logic.test.js`

**Interfaces:**
- Produces:
  - `MGLogic.rng(seed) -> () => [0, 1)` (mulberry32).
  - `MGLogic.stars(mistakes) -> 3|2|1` (0 → 3, 1–2 → 2, >2 → 1).
  - `MGLogic.WUDHU = ['tangan','kumur','hidung','wajah','lengan','kepala','telinga','kaki']`; `MGLogic.wudhuOk(idx, tapped) -> boolean`.
  - `MGLogic.DHUHA`: 13 pose, yaitu `['qiyam','rukuk','qiyam','sujud','duduk','sujud']` ×2 + `['duduk']`.
  - `MGLogic.HIJAIYAH`: 28 `{ch, name}` dengan urutan dan nama: Alif, Ba, Ta, Tsa, Jim, Ḥa, Kho, Dal, Dzal, Ro, Zai, Sin, Syin, Shod, Dhod, Tho, Zho, 'Ain, Ghoin, Fa, Qof, Kaf, Lam, Mim, Nun, Wau, Ha, Ya. `MGLogic.hijaiyahRound(rand) -> {answer, options}` (4 indeks unik, berisi `answer`).
  - `MGLogic.hitung(rand) -> {a, b, op, answer, choices}`:
    - `op` `'+'`: `a, b ∈ 0..10`.
    - `op` `'-'`: `a ∈ 1..20`, `b ≤ a`.
    - `answer ∈ 0..20`; `choices` berisi 3 nilai unik dalam 0..20, termasuk `answer`.
  - `MGLogic.DOA = [{id:'makan', parts:['Allahumma','baarik lanaa','fiimaa razaqtanaa','wa qinaa',"'adzaaban naar"]}, {id:'keluar', parts:['Bismillaahi','tawakkaltu',"'alallaahi",'laa haula','wa laa quwwata','illaa billaah']}]`.
    - `MGLogic.shuffled(parts, rand) -> string[]` (permutasi, tidak sama dengan urutan asli jika panjang > 1).
    - `MGLogic.doaOk(parts, idx, tapped) -> boolean`.
  - `MGLogic.HARGA = {roti: 2000, susu: 3000, pisang: 1000, risol: 2000}`, `MGLogic.UANG = [500, 1000, 2000]`, `MGLogic.PESANAN = ['pisang', 'roti', 'susu']`, `MGLogic.bayar(uang[], harga) -> 'kurang'|'pas'|'lebih'`.
  - `MGLogic.talPeriod(i) -> max(0.8, 1.2 - 0.02*i)` dan `MGLogic.talJudge(tPress, tBeat, win = 0.18) -> 'pas'|'cepat'|'lambat'`.

- [ ] **Step 1: Tulis tes gagal** — satu `test()` per fungsi, dengan nilai persis dari Interfaces:
  - `stars(0)=3, stars(2)=2, stars(3)=1`.
  - `HIJAIYAH.length === 28`, `HIJAIYAH[0].ch === 'ا'`, `HIJAIYAH[27].name === 'Ya'`.
  - 200 ronde `hijaiyahRound`/`hitung` dengan `rng(1)` memenuhi semua batas.
  - `shuffled` 100× ≠ asli.
  - `bayar([1000, 1000], 2000) === 'pas'`, `bayar([500], 1000) === 'kurang'`, `bayar([2000, 2000], 3000) === 'lebih'`.
  - `talJudge(1.0, 1.1) === 'pas'`, `talJudge(0.8, 1.1) === 'cepat'`, `talJudge(1.4, 1.1) === 'lambat'`.
  - `talPeriod(30) === 0.8`.
  - `DHUHA.length === 13`.
- [ ] **Step 2: Jalankan** → FAIL.
- [ ] **Step 3: Implementasi** sesuai Interfaces.
- [ ] **Step 4: Jalankan** → PASS.
- [ ] **Step 5: Commit** `feat(falisha-sekolah): logika 7 mini-game`.

### Task 6: Data peta `MAPS` dan `Scene`

**Files:**
- Create: `games/falisha-sekolah/js/world/maps.js`, `games/falisha-sekolah/js/world/scene.js`
- Test: `games/falisha-sekolah/tests/maps.test.js`

**Interfaces:**
- Consumes: `Collide`, `Player`, `Spr`, `Quests.isPicked`.
- Produces:
  - `MAPS[id] = {bg, walls: rect[], spawns: {[key]: {x, y, face}}, warps: [{x, y, w, h, to, at}], npcs: [{id, x, y, face}], objects: [{id, sprite, item, x, y, step}], spots: [{id, x, y, w, h}]}` untuk 7 id spesifikasi.
    - Koordinat dalam ruang canvas 960×540; `spawns.default` wajib ada.
    - `objects`: `tas` dan `botol` (rumah, step `siap`, `item` = nama yang sama); 5 pensil dengan `sprite` `pensil_merah|kuning|hijau|biru|ungu` dan `item: 'pensil'`, tersebar di gerbang/kelas/lapangan/musala/kantin (step `pensil`); 8 sampah dengan `sprite` `kertas|botol_plastik|bungkus` dan `item: 'sampah'`, di kelas (3), gerbang (3), dan lapangan (2) (step `piket`).
    - `spots`: `tong` di kelas, gerbang, dan lapangan; `keran` di musala.
    - NPC: `pupu` (rumah); `baymax` (jalan, pengikut); `satpam` dan `guru` (gerbang); `nono` dan `arsyad` (gerbang, hanya saat langkah `pulang`); `ustadz` (musala); `guru`, `rafi`, dan `fikri` (kelas); `kantin` (kantin); `nisa` dan `zahra` (lapangan).
  - `Scene.enter(mapId, spawnKey, state)`.
  - `Scene.update(dt, axis, actionPressed, state) -> event | null`, dengan `event`:
    - `{type: 'warp', to, at}`
    - `{type: 'talk', npc}`
    - `{type: 'pick', key, item}`
    - `{type: 'spot', id}`
  - `Scene.draw(ctx, state)` (latar → entitas diurutkan Y → indikator "A" di atas target interaksi), `Scene.player()`.
  - `Scene.debug = true` → menggambar `walls` (merah transparan), `warps` (biru), dan `spots` (hijau).

- [ ] **Step 1: Tulis tes gagal** — `maps.test.js`:
  - 7 id ada.
  - Untuk setiap peta & spawn: `Player.create(x, y)` tidak `insideAny(walls)`.
  - Setiap warp: `MAPS[to]` dan `MAPS[to].spawns[at]` ada.
  - Setiap NPC/objek (kotak 28×18 di posisinya) tidak di dalam tembok.
  - Total objek `item === 'pensil'` = 5; `item === 'sampah'` = 8.
  - Setiap warp bisa dicapai: kotak 28×18 yang digeser 20 px ke dalam warp tidak `insideAny(walls)`.
- [ ] **Step 2: Jalankan** → FAIL.
- [ ] **Step 3: Tulis data `maps.js`.**
  - Ukur dari `assets/sprites/maps/*.jpg` dengan cara melihat tiap gambar.
  - Tembok = tepi peta + furnitur besar.
  - Pintu dan tepi keluar mengikuti tabel §2 spesifikasi.
  - Skala koordinat: gambar 1280×720 → canvas 960×540 (×0,75).
- [ ] **Step 4: Implementasi `scene.js`.**
  - Interaksi = `Player.frontRect` overlap NPC/objek/spot, lalu `actionPressed`.
  - Warp terpicu saat kotak kaki masuk area warp.
  - Objek hanya digambar dan bisa diambil jika `step` = langkah aktif dan kuncinya (`<peta>:<id>`) belum `isPicked`.
  - Pengikut `baymax` berjalan 40 px di belakang Falisha selama langkah `berangkat`.
- [ ] **Step 5: Jalankan** `node --test` → PASS.
- [ ] **Step 6: Verifikasi overlay.** Smoke sementara membuka `?debug=1` untuk tiap peta, ambil screenshot, lalu lihat: kotak merah menutupi tembok/furnitur dan pintu bebas. Perbaiki data sampai pas.
- [ ] **Step 7: Commit** `feat(falisha-sekolah): 7 peta + Scene (tabrakan, warp, interaksi)`.

### Task 7: `Script` (dialog NPC per langkah) dan `Dialog`

**Files:**
- Create: `games/falisha-sekolah/js/story/script.js`, `games/falisha-sekolah/js/story/dialog.js`
- Test: `games/falisha-sekolah/tests/script.test.js`

**Interfaces:**
- Consumes: `Quests`.
- Produces:
  - `Script.talk(npc, state) -> {lines: [{who, text}], action: null | {type: 'complete', id} | {type: 'minigame', id} | {type: 'give', item, n, then: 'complete'}}`. Fungsi ini murni dan tidak mengubah state.
    - `who` ∈ `falisha, pupu, baymax, nono, arsyad, guru, ustadz, satpam, kantin, rafi, nisa, zahra, fikri`.
    - Pemetaan aksi:
      - `pupu@pamit` → complete.
      - `guru@salam_guru` (di gerbang) → complete.
      - `ustadz@wudhu` → minigame `wudhu`; `ustadz@dhuha` → minigame `dhuha`.
      - `guru@iqro|hitung|doa` (di kelas) → minigame dengan id yang sama.
      - `kantin@jajan` → minigame `jajan`.
      - `nisa|zahra@lompat_tali` → minigame `lompat_tali`.
      - `rafi@pensil`: jika jumlah pensil `=== 5` → give 5 `pensil` lalu complete; jika kurang → petunjuk `"Pensilnya masih kurang N"`.
      - `nono|arsyad@pulang` → complete.
      - Di luar giliran: satu baris petunjuk yang memuat `Quests.current(state).text`.
  - `Dialog.open(lines, onDone)`, `Dialog.active()`, `Dialog.update(dt, actionPressed)` (mengetik 40 karakter/dtk; aksi pertama = tampilkan penuh, aksi berikut = baris berikutnya), `Dialog.draw(ctx)` (bingkai `ui.dialog`, potret `portrait.<who>`, nama, teks yang dibungkus ±40 karakter per baris).

- [ ] **Step 1: Tulis tes gagal** — `script.test.js`, satu tes per baris pemetaan di Interfaces:
  - state di langkah `iqro` + `talk('guru')` → `action` `deepEqual` `{type: 'minigame', id: 'iqro'}`.
  - state di `siap` + `talk('pupu')` → `action === null` dan teks memuat `'Ambil tas & botol minum'`.
  - `rafi` dengan 3 pensil → `action === null`, teks memuat `'kurang 2'`.
  - `talk` tidak mengubah state (bandingkan `JSON.stringify` sebelum/sesudah).
- [ ] **Step 2: Jalankan** → FAIL.
- [ ] **Step 3: Implementasi** `script.js`. Teks dialog ditulis singkat, hangat, Bahasa Indonesia untuk anak 6 tahun, dengan salam Islami di tempat yang wajar.
- [ ] **Step 4: Implementasi** `dialog.js`.
- [ ] **Step 5: Jalankan** → PASS.
- [ ] **Step 6: Commit** `feat(falisha-sekolah): naskah dialog NPC + kotak dialog`.

### Task 8: Layar mini-game `Minigames`

**Files:**
- Create: `games/falisha-sekolah/js/minigames/screens.js`
- Create: `games/falisha-sekolah/tools/smoke.js` (dipakai juga di Task 9), `games/falisha-sekolah/tools/mg.html` (halaman uji: memuat skrip yang sama seperti `index.html` kecuali `game.js`, plus loop kecil yang hanya menjalankan `Minigames`)

**Interfaces:**
- Consumes: `MGLogic`, `Spr`, `Chip`.
- Produces:
  - `Minigames.start(id, onDone(stars))`, `Minigames.active() -> boolean`, `Minigames.update(dt, tap: {x, y} | null, actionPressed)`, `Minigames.draw(ctx)`.
  - `Minigames.debugFinish(stars)`: memanggil `onDone(stars)`. `Minigames.debugSolveStep()`: melakukan satu jawaban benar di mini-game aktif. Keduanya hanya untuk smoke.
  - Tiap mini-game memakai ketukan (`tap`, dalam koordinat canvas). Tombol keyboard: ←/→ memindah fokus, aksi = pilih. Setelah selesai tampil layar "⭐⭐⭐ Hebat!" 1,5 dtk lalu `onDone`. Tata letaknya:
    - **wudhu**: 8 kartu `wudhu.*` diacak dalam 2 baris. Kartu benar tetap tampil di slot urutan atas; salah → kartu bergetar + petunjuk.
    - **dhuha**: Pak Ustadz memperagakan pose (`falisha.pose.*` sebagai siluet hijau), lalu 4 tombol pose.
    - **iqro**: nama huruf besar + `Chip.beep` sebagai ketukan, lalu 4 kartu huruf (`iqro.n` atau teks font Naskh 72 px).
    - **hitung**: apel `props.apel` sebanyak `a`, operator, apel sebanyak `b`, lalu 3 tombol angka.
    - **doa**: potongan kata acak dijadikan baris kalimat dari kiri ke kanan.
    - **jajan**: kartu pesanan dan harga, dompet berisi 3 jenis uang, nampan bayar, tombol BAYAR dan ↺.
    - **lompat_tali**: Falisha `pose.tali` dengan tali berputar (busur), tombol LOMPAT besar, dan teks penilaian.

- [ ] **Step 1: Tulis `tools/smoke.js` mode `minigames`.**
  - Buka `http://localhost:8765/games/falisha-sekolah/tools/mg.html` (layar mini-game ini belum butuh `Game`).
  - Untuk tiap id, panggil `Minigames.start(id, s => window.__done = s)`, tunggu 600 ms, lalu screenshot ke `$SMOKE_OUT/mg_<id>.png`.
  - Panggil `Minigames.debugSolveStep()` berulang sampai `Minigames.active() === false`.
  - Pastikan `onDone` terpanggil dengan bintang 3 dan tidak ada `pageerror`. Smoke keluar dengan kode 1 jika gagal.
- [ ] **Step 2: Jalankan smoke** → gagal (`Minigames` belum ada).
- [ ] **Step 3: Implementasi `screens.js` + `tools/mg.html`** sesuai Interfaces, termasuk `solve()` per game untuk `debugSolveStep()`.
- [ ] **Step 4: Jalankan smoke** → `OK minigames 7/7`. Lihat ketujuh screenshot: tata letak tidak bertabrakan dengan tombol `#touch`, huruf Arab tampil (bukan kotak kosong).
- [ ] **Step 5: Commit** `feat(falisha-sekolah): 7 layar mini-game + smoke test`.

### Task 9: `Game`: judul, dunia, HUD, rapor, audio, alur penuh

**Files:**
- Create: `games/falisha-sekolah/js/game.js`
- Modify: `games/falisha-sekolah/tools/smoke.js` (tambah mode `day`)

**Interfaces:**
- Consumes: semua modul di atas.
- Produces: `Game.debug` (hanya jika `?debug=1`):
  - `state()`, `teleport(map, at)`, `talk(npc)`, `pickAll(item)` (mengambil semua objek `item` itu yang aktif di semua peta), `useSpot(id)`, `minigame(id)`, `solveStep()` (= `Minigames.debugSolveStep`), `finishMinigame(stars)`, `screen() -> 'title'|'world'|'minigame'|'rapor'|'menu'`.
  - State layar:
    - `title`: cover + judul + tombol **MULAI / LANJUTKAN**, **MAIN BARU**.
    - `world`: Scene + Dialog + HUD (objektif aktif dengan ikon, jumlah stiker ⭐, panah ke `Quests.current(s).map` bila berbeda dengan peta sekarang, penghitung `pensil n/5` / `sampah n/8` saat relevan).
    - `minigame`.
    - `menu`: ⏸ berisi Lanjut, Suara, Main Baru (konfirmasi), Portal.
    - `rapor`: `rapor_bg` + daftar 7 mini-game dengan bintang + total stiker + Falisha `pose.lompat` + tombol **Main Lagi**.
  - Aturan:
    - `pick` menambah `item` dan `markPicked`.
    - Aksi `give` dari `Script.talk` → `takeItem(item, n)` lalu `complete`; aksi `complete` → `complete(id)`; aksi `minigame` → layar mini-game.
    - `siap` selesai otomatis saat `count(tas) && count(botol)`.
    - `berangkat` selesai saat masuk `gerbang`.
    - `spot tong` dengan sampah di tangan → semua sampah dibuang, dan jika total 8 → `complete('piket')`.
    - Hasil mini-game → `setStars` + `complete(id)` jika itu langkah aktif.
    - `Save.store` setiap kali state berubah.
    - `pulang` selesai → layar `rapor`.
  - Musik `Chip.play(TRACKS, i)`: 0 = pagi (rumah, jalan), 1 = sekolah, 2 = mini-game, 3 = rapor. SFX: ambil, langkah selesai, salah, benar.

- [ ] **Step 1: Tulis smoke mode `day`.**
  - Mulai Main Baru, lalu jalani ke-14 langkah hanya lewat `Game.debug` (teleport + talk + pickAll + useSpot + solveStep).
  - Assert `screen() === 'rapor'`, `state().stickers === 14`, semua `stars` 3, dan tidak ada `pageerror`.
  - Screenshot judul, satu tangkapan per peta, HUD dengan dialog, serta rapor.
  - Muat ulang halaman di tengah langkah 8 → `state().step === 7` (simpanan bekerja).
  - Simulasikan joystick ditekan lalu `pointercancel` → posisi Falisha tidak berubah selama 1 dtk berikutnya (Review Focus #2).
- [ ] **Step 2: Jalankan smoke** → gagal.
- [ ] **Step 3: Implementasi `game.js`** sesuai Interfaces. Loop `requestAnimationFrame`, `dt` dibatasi maksimal 0,05. `#touch` hanya tampil di layar `world`.
- [ ] **Step 4: Jalankan** `node --test games/falisha-sekolah/tests/` (PASS semua) lalu smoke `minigames` + `day` → `OK`.
- [ ] **Step 5: Lihat screenshot.** Periksa skala karakter vs peta, ikon "A" saat dekat NPC, HUD tidak tertutup tombol `#sys`, dan teks rapor terbaca. Perbaiki yang meleset, lalu ulangi Step 4.
- [ ] **Step 6: Commit** `feat(falisha-sekolah): alur satu hari penuh, HUD, rapor, audio`.

### Task 10: Integrasi portal, dokumentasi, PR

**Files:**
- Modify: `portal/portal.js` (entri baru sebelum `soon`), `README.md` (bagian "### 8."), `docs/WALKTHROUGH.md` (bagian "### 8."), `docs/plans/08-falisha-sekolah-mimha-sprite-prompts.md` (centang checklist)
- Create: `portal/cover_game8.jpg` (960 px dari `assets/raw/cover.*`)

- [ ] **Step 1:** Tambah entri portal:
  - `{id: 'falisha-sekolah', title: 'Petualangan Falisha di MIMHa', href: 'games/falisha-sekolah/', cover: 'portal/cover_game8.jpg', tags: ['RPG Sekolah', '7 Mini-game', 'Edukasi']}`.
  - `desc` satu kalimat tentang satu hari sekolah di MIMHa.
- [ ] **Step 2: Verifikasi.** `node --check portal/portal.js`; smoke membuka `http://localhost:8765/` dan memastikan `a[href="games/falisha-sekolah/"]` ada; `node --test` + smoke `day` sekali lagi → semuanya OK.
- [ ] **Step 3: Commit** `feat(portal): tambah Petualangan Falisha di MIMHa`, push ke branch kerja, lalu buka PR ke `main` (merge hanya bila user meminta).
