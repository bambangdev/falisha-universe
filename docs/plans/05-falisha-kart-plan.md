# 🏎️ Plan: Game #5 – Remake "Mario Kart" (Falisha Kart: Balapan Keluarga)

## 1. Konsep & Nuansa
- **Genre:** Arcade Kart Racing ala SNES Mario Kart — **Mode 7 pseudo-3D** (jalan 3D digambar manual per scanline di Canvas 2D, setia dengan gaya retro portal).
- **Nuansa:** Pixel-art cerah, balapan seru tanpa kekerasan — 100% ramah anak usia 6 tahun.
- **Target Platform:** Samsung Galaxy Tab S8 (kontrol sentuh) & keyboard desktop.
- **Teknologi:** HTML5 Canvas 2D + Vanilla JS + Web Audio API, tanpa backend (konsisten dengan 4 game lain).

## 2. Roster Pembalap (dari foto asli keluarga)
| # | Pembalap | Kelas | Ciri khas |
|---|---|---|---|
| 1 | **Falisha (Kilat)** | Ringan / cepat | Top speed tinggi, akselerasi sedang — kart petir kuning-merah |
| 2 | **Arshad (Heavy)** | Berat | Top speed tertinggi, akselerasi lambat, susah belok — kart bazooka |
| 3 | **Babah Nono (Teknik)** | Seimbang | Handling terbaik, stabil di tikungan — kart jahit |
| 4 | **Ibu Pupu (Power)** | Seimbang | Akselerasi terbaik, galak saat start — kart dapur |
| 5 | **Baymax (Raksasa)** | Berat unik | Tahan banting, lambat akselerasi — Baymax Mech Kart |

Sprite kart pixel-art karikatur per karakter (pipeline foto seperti Warisan Combat): pose lurus, belok kiri/kanan, drift, kena item, menang/kalah.

## 3. Item Keluarga (pengganti item Mario Kart)
| Item Mario Kart | Versi Keluarga | Efek |
|---|---|---|
| Mushroom | ⚡ **Sambal Petir** | Boost kecepatan sesaat |
| Green Shell | 📚 **Buku Kumon** | Meluncur lurus, menjatuhkan yang kena |
| Red Shell | 🎹 **Piano Terbang** | Mengejar pembalap di depan |
| Banana | 🍌 **Kulit Pisang** | Licin — yang menginjak spin |
| Star | ⭐ **Bintang Petir** | Kebal + cepat beberapa detik |
| Blue Shell | 🐢 **Tempurung Raksasa** | Mengejar posisi 1 (efek komik, tanpa kekerasan) |
| Item Box | 🎁 **Kotak Kejutan** | Item acak — posisi belakang dapat item lebih kuat |

## 4. Sirkuit (Piala)
### 🏆 Piala Keluarga (mudah)
1. **Taman Rumah Circuit** — pot bunga sebagai rintangan
2. **Dapur GP** — lantai licin, tumpahan minyak
3. **Kamar Tidur Rally** — bantal rintangan, karpet boost
4. **Ruang Piano Sprint** — nada-nada beterbangan

### 🏆 Piala Petir (sulit) — v2
5. **Stadion Petir** — tikungan tajam + tanjakan
6. **Lab Kumon** — soal-soal beterbangan
7. **Hutan Emerald** — lumpur memperlambat
8. **Benteng Yanto** — final, jebakan terbanyak

v1 (keputusan user 4 Okt 2026): **4 sirkuit — Piala Keluarga saja**, tiap sirkuit 3 lap. Piala Petir (4 sirkuit) jadi v2.

## 5. Mode Permainan
1. **Grand Prix:** 4 balapan berurutan vs 7 CPU, sistem poin (15-12-10-8-7-5-4-3), podium di akhir.
2. **Time Trial:** 3 lap tercepat, rekor disimpan di localStorage.
3. **VS 2 Pemain:** split-screen — tablet landscape (dua sisi sentuh) atau keyboard + sentuh.
4. **Battle (v2):** arena balon.

**Keputusan user (4 Okt 2026):** nama "Falisha Kart" OK, roster 5 karakter, Tempurung Raksasa boleh, v1 = 4 sirkuit (Piala Keluarga), mode prioritas Grand Prix.

## 6. Mekanik Balap
- **Drift & Mini-Turbo:** tahan belok saat drift → boost biru/oranye ala Mario Kart.
- **Start Boost:** gas tepat saat lampu hijau = lompatan awal.
- **Slipstream:** menempel di belakang lawan = boost kecil. (v2)
- **Off-road:** rumput/pasir memperlambat (kecuali saat boost).
- **AI CPU:** 3 tingkat kesulitan (Mudah/Sedang/Susah, default **Mudah**), rubber-banding ringan supaya seru.

## 7. Kontrol
- **Tablet Tab S8:** kiri = tombol Belok Kiri/Kanan, kanan = GAS, REM, DRIFT, ITEM. Multi-touch.
- **Keyboard:** Panah/WASD, Spasi = item, Shift = drift.

## 8. Audio (Web Audio synth)
- Musik chiptune per piala + versi ngebut di lap terakhir.
- SFX: countdown, drift, mini-turbo, item, tabrakan komik, fanfare kemenangan.

## 9. Tahapan Pengembangan
1. **Engine Mode 7:** renderer jalan pseudo-3D (lurus, tikungan, tanjakan), kamera chase.
2. **Sprite kart:** 5 karakter + animasi (belok, drift, kena item).
3. **Fisika:** kecepatan, drift, mini-turbo, off-road, tabrakan.
4. **Track builder:** format data sirkuit (4 trek v1).
5. **Item system:** kotak item, 7 item keluarga, efek & balance.
6. **AI CPU:** racing line, rubber-banding, 3 difficulty.
7. **Mode:** Grand Prix, Time Trial, VS 2P.
8. **Audio:** musik chiptune + SFX synth.
9. **Integrasi portal** (`portal/games.json`, cover art) + deploy Vercel.
10. **Polish & uji:** target 60fps di Tab S8, tes manual di tablet.

## 10. Struktur Folder
```
games/falisha-kart/
├── index.html
├── css/style.css
├── js/ (game.js, mode7.js, kart.js, track.js, items.js, ai.js, audio.js)
└── assets/ (sprites/, tracks/)
```

## Pertanyaan untuk Anda
1. **Nama game:** "Falisha Kart" OK? Atau ada ide lain?
2. **Roster:** 5 karakter keluarga ini pas, atau mau tambah/kurangi?
3. **Item "jahat":** Tempurung Raksasa (blue shell) yang menghajar posisi 1 — boleh, atau terlalu kejam buat Falisha? 😄
4. **Jumlah sirkuit v1:** 8 (2 piala) cukup, atau langsung 16?
5. **Mode prioritas:** Grand Prix dulu, atau Time Trial?
