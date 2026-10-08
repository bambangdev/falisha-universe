# 🏁 Plan Game ke-7: FALISHA KART TURBO (remake Mario Kart, gaya pseudo-3D baru)

Game kart kedua di **Dunia Falisha**, terpisah dari **Falisha Kart** (game ke-5, Mode 7 ala SNES) yang tetap ada. Kalau Falisha Kart terasa seperti Super Mario Kart, game ini dibuat terasa seperti **Mario Kart 64**. Jalannya punya tanjakan dan turunan, tikungan bertingkat, terowongan, dan loncatan ramp. Sprite pembalap punya 8 sudut dan dibuat dari foto keluarga.

## 0. Alur Kerja (3 fase)
| Fase | Siapa | Hasil |
|---|---|---|
| 1 | **Claude** | Dokumen ini + [brief sprite](07-falisha-kart-turbo-sprite-brief.md) |
| 2 | **Antigravity** (Nano Banana) | Semua PNG di `games/falisha-kart-turbo/assets/raw/` sesuai brief, di-push ke branch yang sama |
| 3 | **Claude** | Olah sprite (chroma-key, potong, atlas), tulis kode game, uji, integrasi portal, PR |

## 1. Konsep
* **Genre:** arcade kart racing, kamera di belakang kart.
* **Renderer:** jalan pseudo-3D berbasis segmen (gaya "Super Scaler"). Setiap segmen punya `curve` (belokan) dan `y` (ketinggian), sehingga bisa membuat bukit, lembah, dan terowongan. Panorama langit dibuat parallax.
* **Teknologi:** Canvas 2D + vanilla JS + `shared/audio.js`, tanpa dependensi (sama dengan game lain).
* **Target:** Samsung Galaxy Tab S8 (sentuh, 60 fps) + browser desktop. Ramah anak 6 tahun: tanpa kekerasan, ada opsi gas otomatis.

## 2. Roster Pembalap (foto `assets/Photo/`)
| Pembalap | Kelas | Top speed | Akselerasi | Handling | Berat | Kart |
|---|---|---|---|---|---|---|
| **Falisha** | Kilat | ★★★★★ | ★★★ | ★★★ | ★★ | Kart petir merah-kuning |
| **Arsyad** | Ringan | ★★★ | ★★★★★ | ★★★★ | ★ | Kart mini ungu (sedotan) |
| **Babah Nono** | Teknik | ★★★ | ★★★ | ★★★★★ | ★★★ | Kart hijau bergaris + peci |
| **Ibu Pupu** | Seimbang | ★★★★ | ★★★★ | ★★★ | ★★★ | Kart pink-hitam |
| **Baymax** | Berat | ★★★★ | ★★ | ★★ | ★★★★★ | Kart hitam besar, tahan tabrak |

## 3. Sirkuit — Piala Nusantara (4 trek × 3 lap)
1. **Pantai Kuta:** jalan pinggir pantai, pasir sebagai off-road, pohon kelapa, dan ramp ombak.
2. **Jakarta Malam:** jalan kota dengan lampu neon, terowongan panjang, dan tikungan tajam di bundaran.
3. **Gunung Bromo:** tanjakan dan turunan curam, kabut (jarak pandang pendek), dan jurang di pinggir jalan dengan pagar.
4. **Istana Permen:** trek finale yang paling berliku, dengan banyak loncatan dan lantai licin cokelat.

Data trek ada di `js/tracks.js`. Setiap trek berupa daftar potongan `[panjang, curve, hill]` ditambah posisi dekor, kotak item, dan ramp.

## 4. Item
| Item | Efek |
|---|---|
| 🌶️ **Sambal Turbo** | Boost 1,5 detik |
| 📚 **Buku Kumon** | Ditembakkan lurus dan memantul, membuat yang kena berputar |
| 🎹 **Piano Pengejar** | Mengejar pembalap tepat di depan |
| 🍌 **Kulit Pisang** | Ditaruh di belakang, membuat yang menginjak tergelincir |
| ⭐ **Bintang Petir** | Kebal + cepat selama 6 detik |
| 🌧️ **Awan Hujan** | Memperlambat pembalap posisi 1 |
| 🎈 **Balon Lompat** | Lompatan tinggi, bisa melewati rintangan |
| 🎁 **Kotak Kejutan** | Memberi item acak. Pembalap di posisi belakang mendapat item yang lebih kuat |

## 5. Mekanik
* **Drift + mini-turbo:** dua tingkat. Percikan biru memberi boost kecil, percikan oranye memberi boost besar.
* **Start boost:** tekan gas tepat saat lampu hijau.
* **Slipstream:** menempel di belakang lawan memberi boost kecil.
* **Ramp:** saat melayang, tekan DRIFT untuk melakukan trik dan dapat boost kecil saat mendarat.
* **Off-road:** memperlambat, kecuali saat boost atau Bintang.
* **Tabrakan antar kart:** kart yang lebih berat mendorong yang lebih ringan.
* **AI CPU:**
  * Mengikuti racing line, dengan sedikit variasi per pembalap.
  * Rubber-band ringan supaya balapan tetap seru.
  * Bisa memakai item.
  * Tingkat kesulitan Mudah, Sedang, atau Susah (default Mudah).

## 6. Mode
1. **Grand Prix:** 4 trek berturut-turut melawan 4 CPU. Poin per posisi 10-7-5-3-1, lalu podium dengan sprite menang/kalah.
2. **Time Trial:** rekor dan ghost lap terbaik disimpan di `localStorage`.
3. **Latihan:** pilih trek bebas tanpa CPU.

## 7. Kontrol
* **Tablet:**
  * Kiri: ◀ ▶.
  * Kanan: GAS, REM/MUNDUR, DRIFT, ITEM.
  * Opsi **Gas Otomatis** (default ON untuk anak).
* **Keyboard:**
  * ↑/W gas, ↓/S rem, ←/→ atau A/D belok.
  * Shift/K drift, Spasi/J item.
  * P pause, M suara.

## 8. Audio
Memakai `shared/audio.js`: `Chip.play` untuk 1 lagu per trek plus versi lebih cepat di lap terakhir, `Chip.beep`/`Chip.hit` untuk SFX countdown, drift, mini-turbo, item, tabrakan, dan fanfare podium.

## 9. Arsitektur Kode
```
games/falisha-kart-turbo/
├── index.html            # pola dari games/falisha-spidey/index.html (canvas 960x540, #sys, #touch)
├── css/style.css
├── assets/
│   ├── raw/              # hasil Nano Banana (fase 2) — sumber, tidak dimuat game
│   └── sprites/          # atlas hasil olahan (fase 3): racers.png, items.png, decor_*.png, sky_*.png + atlas.json
└── js/
    ├── road.js           # segmen, proyeksi kamera, hills/curves, render jalan + sprite terurut jarak
    ├── sprites.js        # loader atlas, pilih sudut 8 arah dari selisih arah kamera vs kart
    ├── tracks.js         # data 4 trek
    ├── kart.js           # fisika, drift/mini-turbo, tabrakan, ramp
    ├── ai.js             # racing line, rubber-band, pemakaian item
    ├── items.js          # kotak item, 8 item, proyektil
    └── game.js           # state (judul → pilih pembalap → pilih mode/trek → countdown → balap → hasil → podium), HUD, input
```
Integrasi portal: entri di `portal/portal.js` (sebelum entri `soon`), cover `portal/cover_game7.jpg` dari `assets/raw/cover.png`. Dokumentasi juga diperbarui di README dan `docs/WALKTHROUGH.md`.

## 10. Tahapan Fase 3 (Claude)
1. **Olah sprite:** script PIL untuk chroma-key magenta, potong grid 4×4, trim, samakan anchor tengah-bawah, lalu buat atlas + `atlas.json`. Sel yang cacat dilaporkan untuk di-generate ulang.
2. **Road renderer** dan kamera, lalu satu trek uji.
3. **Kart:** fisika, drift, ramp.
4. **Konten:** 4 trek dengan dekor.
5. **AI**, lalu **item**.
6. **Menu, mode, dan HUD**, lalu podium.
7. **Audio** dan polish.
8. **Uji Playwright:**
   * Screenshot setiap layar.
   * Bot AI menyelesaikan 3 lap di setiap trek.
   * Console tanpa error.
9. **Integrasi portal**, dokumentasi, dan PR.

## 11. Definisi Selesai
* Ke-4 trek bisa diselesaikan, dan Grand Prix berjalan sampai podium.
* 60 fps di tablet (diuji manual oleh keluarga).
* Wajah kelima pembalap mudah dikenali dari foto aslinya.
