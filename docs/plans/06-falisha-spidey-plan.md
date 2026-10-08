# Rencana Desain Game ke-6: FALISHA SPIDEY & SAHABAT

Game ke-6 seri **Dunia Falisha**, terinspirasi kartun *Spidey and His Amazing Friends*: platformer side-scroll ayun jaring di kota, ramah anak 6 tahun (tanpa darah — musuh "dijaring" lalu jadi baik lagi).

## 1. Karakter (berbasis foto `assets/Photo/`)
* **Tim hero** (tukar kapan saja):
  * **Falisha – Spidey-Kilat** (merah-biru): jangkauan ayun jaring paling jauh, tembakan jaring cepat.
  * **Ibu Pupu – Ghost-Spider Pink** (putih-pink): lompat ganda, jaring menyebar 3 arah.
  * **Baymax – Spin Robot** (hitam-merah): jaring besar (2× damage), hanya menerima ½ damage.
* **Musuh lucu:**
  * **Arsyad – Goblin Kacamata**: terbang di hoverboard sedotan ungu, lempar bom permen, sesekali menukik.
  * **Babah Nono – Badak Peci**: ancang-ancang lalu menyeruduk; menabrak dinding → pusing (damage 2×); lompat-hentak membuat gelombang kejut (lompati!).
  * Minion: Bot Nakal (darat) & Drone (udara, menjatuhkan permen).
* **Aset:** wajah asli dipotong dari foto, di-pixelate ringan, dimasker oval (`js/faces.js`, base64). Kostum, badan, musuh, dan latar digambar prosedural di canvas (`js/art.js`).

## 2. Mekanik
* Jalan, lompat (lompat pendek bila tombol dilepas cepat), **tembak jaring**, **ayun jaring** (tahan tombol di udara → tali ke jangkar terdekat, fisika pendulum; lepas/lompat = terlempar).
* Musuh kecil 2 tembakan → kepompong jaring. Injak dari atas juga menjaring.
* **Selamatkan warga** (kucing, anak dengan balon) → ★ + 500 poin.
* **Meteran Team-Up** (token, musuh, warga) → **GO WEBS GO!**: semua musuh di layar terjaring, bos kena 8 damage.
* 3 hati per hero; pingsan → otomatis ganti teman; semua pingsan → bangkit di checkpoint. Jatuh ke jurang yang sama 2× → teman membantu menyeberang.

## 3. Stage
1. **Kota Siang** – bos Goblin Kacamata.
2. **Pelabuhan Senja** – bos Badak Peci.
3. **Atap Gedung Malam** – duo bos.
Level dibangkitkan dari seed (`js/level.js`): jurang selalu punya jangkar di atasnya, platform maksimal setinggi lompatan, checkpoint tiap 2 segmen. Progres stage tersimpan di `localStorage` (`fsp_unlocked`).

## 4. Kontrol
* **PC:** ←/→ (A/D) jalan, ↑/W/Spasi lompat, J tembak, K ayun (tahan), L tukar hero, U Team-Up, M suara.
* **Tablet:** tombol ◀ ▶ di kiri; ⤒ lompat, 🕸️ tembak, 🪢 ayun (tahan), 🔄 tukar, ⭐ Team-Up di kanan.

## 5. Struktur File
```
games/falisha-spidey/
├── index.html
├── css/style.css
└── js/ faces.js · art.js · level.js · game.js
portal/cover_game6.svg
```
