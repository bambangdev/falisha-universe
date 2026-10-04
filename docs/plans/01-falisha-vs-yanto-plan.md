# Plan Game: "Falisha the Flash"

## Konsep
Game platformer 2D side-scrolling berkecepatan tinggi (ala Sonic) dengan tokoh **Falisha**, anak perempuan bersuara petir ala The Flash. Falisha berlari super cepat, mengumpulkan **cincin petir**, dan mengalahkan robot-robot nakal.

## Teknologi
- **HTML5 Canvas + JavaScript (vanilla)**, tanpa instalasi, bisa dimainkan di browser (laptop/tablet/HP).
- Fisika dan loop game ditulis sendiri (ringan, mudah diubah).
- Audio: efek suara sederhana dengan Web Audio API.
- Kontrol: keyboard (←/→, Spasi = lompat, Shift = Turbo) + tombol sentuh di layar.

## Mekanik Utama
| Fitur | Deskripsi |
|---|---|
| Lari & momentum | Makin lama lari, makin cepat (efek Sonic) |
| Lompat & spin | Lompat sambil berputar untuk menyerang musuh |
| Turbo Flash | Tahan tombol, Falisha berlari super cepat dengan jejak petir kuning |
| Cincin petir | Dikumpulkan sebagai skor/nyawa pelindung |
| Loop & pegas | Bidang miring, pegas, dan lintasan loop |
| Musuh | Robot kecil yang dilompati/diserang |
| Bos | Robot raksasa di akhir level |

## Level (3 dunia, awal)
1. **Taman Hijau**: tutorial, mudah.
2. **Kota Kilat**: gedung, kecepatan lebih tinggi.
3. **Lab Petir**: bos akhir "Dr. Robo".

## Sprite (dibuat oleh saya, gaya pixel art cerah)
Dibuat dengan alat generate gambar, lalu dipotong menjadi sprite sheet.
- **Falisha**: diam, lari, lari cepat (jejak petir), lompat/spin, terluka, menang.
  Kostum merah-kuning bertema Flash, rambut dan gaya yang bisa disesuaikan.
- **Musuh**: 2 jenis robot + bos.
- **Item**: cincin petir, pegas, checkpoint, bendera finish.
- **Latar**: langit, bukit, kota, lab (efek parallax).
- **Tile**: tanah, platform, rintangan.
- **UI**: ikon nyawa, cincin, judul game.

## Tahapan Pengerjaan
1. **Fondasi**: struktur proyek, game loop, kamera, kontrol.
2. **Sprite**: generate karakter dan animasi, lalu buat sprite sheet.
3. **Fisika karakter**: lari, momentum, lompat, tabrakan tanah.
4. **Level pertama**: tile map, cincin, musuh, pegas.
5. **Efek**: jejak petir, partikel, parallax, suara.
6. **UI & menu**: layar judul, skor, game over, menang.
7. **Level 2, 3 dan bos**.
8. **Polish & uji**: uji di HP/tablet, atur tingkat kesulitan sesuai usia Falisha.

## Struktur Folder
```
Falisha the Flash/
├── index.html
├── css/style.css
├── js/ (game.js, player.js, level.js, enemies.js, audio.js)
└── assets/ (sprites/, backgrounds/, ui/)
```

## Pertanyaan untuk Anda
1. **Usia Falisha?** (menentukan tingkat kesulitan dan kontrol)
2. **Perangkat utama:** laptop (keyboard) atau tablet/HP (sentuh)?
3. **Tampilan Falisha:** warna rambut, kostum favorit, atau ciri khas lain?
4. **Gaya visual:** pixel art retro (disarankan) atau kartun halus?
5. **Ada nama teman/hewan peliharaan** yang ingin dimasukkan sebagai karakter?
