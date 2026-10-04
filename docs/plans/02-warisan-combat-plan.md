# Plan: Portal Game + Game #2 "Fighting"

## Bagian A – Portal Game (Home)

**Tujuan:** halaman utama berisi kumpulan game buatan kita. Game pertama sudah ada, game kedua menyusul, dan game berikutnya tinggal ditambah.

**Struktur folder (target):**
```
Falisha the Flash/            (root = portal)
├── index.html                ← HOME portal (kartu pilihan game)
├── portal/ (css, js, covers) ← gaya & data daftar game
├── shared/                   ← kode bersama (audio, input sentuh, loader sprite)
├── games/
│   ├── falisha-vs-yanto/     ← game 1 (dipindah, isi tidak berubah)
│   └── arena-keluarga/       ← game 2 (fighting)  *nama sementara
└── assets/Photo/             ← foto asli (sudah ada)
```

**Fitur portal:**
- Kartu game dengan gambar sampul pixel art yang saya buat, judul, dan deskripsi singkat.
- Animasi hover dan sentuh, serta musik menu pendek.
- Daftar game ada di satu file `games.json`, jadi menambah game baru cukup tambah satu entri.
- Tombol "Kembali ke Home" di dalam setiap game.
- Layar penuh dan landscape untuk tablet (Tab S8), konsisten dengan game 1.
- Skor tertinggi disimpan di perangkat dengan localStorage.

---

## Bagian B – Game #2: Fighting 2D

### Roster dan jurus
| # | Karakter | Jurus Khusus 1 | Jurus Khusus 2 | **Ultimate** |
|---|---|---|---|---|
| 1 | **Falisha** (kilat, cepat) | **Kilat Dash**: meluncur secepat petir | **Petir Panah**: lemparan petir lurus | **Piano Sambil Nangis**: piano muncul, nada menghujani lawan, air mata jadi serangan area |
| 2 | **Arshad** (lari, makan) | **Lari Tabrak**: lari menyeruduk | **Makan Banyak**: makan untuk pulih HP dan naik tenaga | **TERIAK**: gelombang suara besar ke seluruh layar, lawan pusing |
| 3 | **Babah Nono** (doa, jahit) | **Doa Cahaya**: bola doa jarak jauh | **Jahit Baju**: benang menjerat dan menarik lawan | **Doa Ampuh**: sinar suci dari langit |
| 4 | **Ibu Pupu** (kuat, cerewet) | **Suruh Makan**: melempar makanan | **Kerjain Kumon**: lembar kumon memperlambat lawan | **Singa Marah**: berubah jadi singa dan mengamuk beberapa detik |
| 5 | **Baymax** (hadiah, tidur) | **Kasih Hadiah**: kotak hadiah dengan efek acak (bonus atau jebakan lucu) | **Tidur**: tidur sebentar untuk pulih HP dan menahan serangan | **Robot Baymax**: berubah jadi robot raksasa |

### Sistem pertarungan
- **Format:** satu lawan satu, best of 3 ronde, ada HP bar dan timer 60 detik.
- **Gerakan:** jalan, lompat, jongkok, dan tangkis.
- **Serangan:** Ringan, Berat, Spesial 1, Spesial 2, dan Ultimate.
- **Meter ultimate:** terisi saat menyerang dan terkena serangan. Saat penuh, tombol Ultimate menyala.
- **Efek visual:** hit-stop, getar layar, partikel, dan teks "COMBO!".
- **Mode:**
  1. **Arcade vs CPU:** 4 lawan berurutan dan karakter terakhir jadi bos.
  2. **VS 2 Pemain:** satu perangkat (keyboard) atau dua jari di tablet.
  3. **Latihan:** boneka latihan.
- **AI CPU:** 3 tingkat kesulitan (Mudah, Sedang, Susah), default **Mudah** supaya ramah anak.

### Kontrol Tab S8
- **Kiri:** D-pad geser (kiri, kanan, lompat, jongkok).
- **Kanan:** tombol Ringan, Berat, Spesial 1, Spesial 2, dan Ultimate (besar, berkilau saat siap).
- Multi-touch, sama seperti game 1.

### Arena (5 latar pixel art)
Taman, ruang piano keluarga, dapur, kamar tidur, dan stadion petir.

### Pipeline sprite (berdasarkan foto asli)
1. Baca foto dari `assets/Photo/` (falisha, arsyad, babah nono, pupu, baymax).
2. Untuk tiap karakter saya buat **sprite sheet pixel art karikatur** dengan ciri khas wajah dan pakaiannya.
3. Kostum disesuaikan dengan kekuatan, misalnya jubah petir untuk Falisha dan kain jahit untuk Babah Nono.
4. Pose per karakter: diam, jalan (2 frame), lompat, jongkok, tangkis, ringan, berat, spesial 1, spesial 2, ultimate, kena pukul, kalah, menang.
5. Ultimate Ibu Pupu (singa) dan Baymax (robot) memakai sprite transformasi tersendiri.
6. Potret karakter untuk layar pilih karakter dan HUD.
7. Efek: petir, doa, benang, piano, nada, dan makanan.
8. Hasilnya dipotong otomatis dengan chroma key seperti game 1.

### Musik dan suara
- Musik chiptune: menu, pilih karakter, pertarungan (satu lagu per arena), dan kemenangan.
- SFX pukulan, ultimate, dan suara khas jurus (misalnya teriakan Arshad dan denting piano).

---

---

## Status Pengerjaan (Semua Selesai! 🎉)
- [x] **Portal Game:** Root portal aktif di `http://localhost:8000/` dengan sampul dan navigasi ke Game 1 & Game 2.
- [x] **5 Karakter Lengkap (dari foto asli):**
  1. **Falisha:** Kilat Dash, Petir Panah, Ultimate: Piano Sambil Nangis 🎹💧⚡
  2. **Arshad:** Lari Tabrak, Makan Banyak (HP heal 🍔), Ultimate: TERIAAAAK !!! 📢💥
  3. **Babah Nono:** Jahit Baju (jarum emas), Doa Cahaya (bola doa ✨), Ultimate: DOA AMPUH ! (pilar cahaya suci ☀️🏛️)
  4. **Ibu Pupu:** Suruh Makan (sendok lezat 🥄), Kerjain Kumon (lembaran kumon pusing 📝), Ultimate: SINGA MARAH ! (cakar singa api 🦁🔥)
  5. **Baymax:** Kasih Hadiah (kotak kado 🎁), Tidur Pulas (HP heal 💤), Ultimate: ROBOT BAYMAX ! (roket booster 🚀💥)
- [x] **Layar Pilih Karakter (Character Select):** 5 kartu lengkap dengan nama, idle stance asli, dan deskripsi jurus + tombol MULAI.
- [x] **Mode Arcade vs CPU Dinamis:** Lawan dipilih otomatis dari anggota keluarga lainnya secara bertahap hingga babak final.
- [x] **Kontrol Tablet Samsung Tab S8:** Touch D-pad, tombol Jump, Jurus 1 & 2, Serang Ringan/Berat, dan tombol Ultimate menyala saat meter 100%.
- [x] **Keyboard PC / Laptop:** Tombol panah/WASD, J (ringan), K (berat), U (jurus 1), I (jurus 2), O (ultimate), Spasi (lompat).

