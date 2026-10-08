# 🎨 Brief Sprite untuk Antigravity (Nano Banana) — Falisha Kart Turbo

Dokumen ini untuk **fase 2**. Generate semua gambar di bawah dengan Nano Banana, simpan sesuai nama file, lalu push. Setelah itu Claude yang memotong sprite dan menulis kode game. Desain lengkapnya ada di [07-falisha-kart-turbo-plan.md](07-falisha-kart-turbo-plan.md).

---

## 1. Aturan Umum (berlaku untuk SEMUA gambar)
1. **Format:** PNG.
2. **Latar:** magenta polos **#FF00FF** (kecuali panorama langit dan cover). Tanpa gradasi, tanpa bayangan di latar, tanpa lantai.
3. **Gaya:** pixel-art 16-bit, chibi (kepala besar ±1/3 tinggi badan), outline gelap 2–3 px, warna cerah, shading sederhana 2–3 tingkat. Gaya ini sama dengan sprite Warisan Combat dan Falisha Kart.
4. **Tanpa** teks, angka, logo, watermark, atau garis grid yang tergambar.
5. **Grid 4×4:** kanvas 1024×1024, 16 sel @ 256×256. Objek berada di **tengah-bawah sel**, menyisakan ±16 px dari tepi, dan **ukurannya sama di setiap sel**. Tidak ada bagian yang menembus ke sel tetangga.
6. **Kart** dilihat dari kamera agak di atas (±20°), seperti Mario Kart 64.
7. **Foto referensi wajib dilampirkan** setiap kali generate sheet pembalap, ambil dari `assets/Photo/`. Wajah harus mudah dikenali dari foto aslinya.
8. Kalau grid 4×4 sulit konsisten, **boleh dipecah per baris**: 4 file strip 1024×256 (1×4 sel) bernama `racer_<id>_row1.png` … `racer_<id>_row4.png`. Claude bisa memproses kedua format.

## 2. Folder & Nama File
Semua file ditaruh di **`games/falisha-kart-turbo/assets/raw/`**:
```
racer_falisha.png  racer_arsyad.png  racer_nono.png  racer_pupu.png  racer_baymax.png
items.png
decor_kuta.png  decor_jakarta.png  decor_bromo.png  decor_permen.png
sky_kuta.png    sky_jakarta.png    sky_bromo.png    sky_permen.png
cover.png
```
Push ke branch **`claude/determined-ptolemy-nm8ml4`** di `bambangdev/falisha-universe`. Commit-nya cukup gambar ini ditambah centang checklist di bagian 8.

## 3. Karakter (kunci warna — jangan berubah antar sel)
| id | Foto | Deskripsi wajah/rambut (dari foto) | Pakaian balap | Kart |
|---|---|---|---|---|
| `falisha` | `falisha.jpeg` | Anak perempuan ±6 tahun, rambut hitam lurus sebahu berponi, senyum lebar ceria (suka menjulurkan lidah) | Jaket balap merah, kerah kuning, kacamata balap di dahi (rambut tetap terlihat, **tanpa helm**) | Merah + aksen kuning, simbol petir kuning di depan |
| `arsyad` | `arsyad.jpeg` | Balita laki-laki, rambut hitam ikal mengembang, kacamata hitam kehijauan tanpa bingkai, wajah serius-lucu | Baju krem bermotif titik-titik, list biru | Kart mini ungu, antena berbentuk sedotan ungu |
| `nono` | `babah nono.jpeg` | Pria lanjut usia, peci beludru hitam, senyum sangat lebar memperlihatkan gigi, mata menyipit karena tersenyum | Polo bergaris hijau tua-hitam-putih | Hijau tua bergaris putih |
| `pupu` | `pupu.jpeg` | Wanita muda berhijab hitam, senyum lembut, mata ramah | Sweater rajut hitam, jam tangan | Pink + hitam, pita pink di belakang |
| `baymax` | `baymax.jpeg` | Pria dewasa, rambut hitam acak-acakan bergelombang, kumis dan janggut tipis, wajah datar-santai | Kaos hitam | Hitam besar dan kokoh, aksen merah, bumper tebal |

## 4. Prompt Sheet Pembalap (×5)
Pakai template ini, lalu isi `{…}` dari tabel di atas. Lampirkan foto referensinya.

```
Pixel-art 16-bit sprite sheet of a chibi go-kart racer, based on the attached photo
(keep the face clearly recognizable: {DESKRIPSI WAJAH/RAMBUT}).
Outfit: {PAKAIAN}. Kart: {KART}. No helmet.
Canvas 1024x1024, a 4x4 grid of 256x256 cells, flat solid magenta #FF00FF background,
no grid lines, no text, no shadows on the background. Same character, same kart,
same size and same colors in every cell; each sprite centered at the bottom of its cell.
Camera slightly above (about 20 degrees), Mario Kart 64 style.
Row 1: kart seen from behind (0°), rear-right 45°, right side 90°, front-right 135°.
Row 2: front 180°, front-left 225°, left side 270°, rear-left 315°.
Row 3: (from behind) hard left turn leaning, hard right turn leaning,
       drifting left with blue sparks at the rear wheels, spinning out with dizzy stars.
Row 4: jumping in the air off a ramp, celebrating with both arms up (standing in the kart),
       sad/crying lost pose, close-up face portrait (head and shoulders) for the HUD.
Dark 2-3px outlines, bright colors, simple shading, kid-friendly.
```
**Negatif / hindari:** `realistic photo, 3D render, blurry, gradient background, text, watermark, helmet covering face, extra people, cropped sprites`.

Tips konsistensi:
* Generate dulu **baris 1–2** (8 sudut). Kalau sudah bagus, minta baris 3–4 dengan melampirkan hasil sebelumnya sebagai referensi gaya.
* Urutan sudut **harus persis** seperti di prompt, karena Claude memetakan sel → sudut berdasarkan posisi.
* Sel nomor 16 (potret) boleh berupa kepala dan bahu saja, tanpa kart.

## 5. Prompt Item & Efek — `items.png`
```
Pixel-art 16-bit icon sheet, canvas 1024x1024, 4x4 grid of 256x256 cells,
flat solid magenta #FF00FF background, no text, no grid lines, each object centered.
Row 1: red chili pepper with lightning sparks; thick orange workbook; small flying grand piano;
       banana peel.
Row 2: golden lightning star; small grey rain cloud with drops; red balloon with a string;
       rainbow question-mark gift box (item box, cube).
Row 3: shiny gold coin; wooden jump ramp with yellow-black stripes; orange traffic cone;
       white drift smoke puff.
Row 4: blue spark burst; orange spark burst; comic "POW" explosion cloud (no letters);
       small yellow sparkle star.
Dark outlines, bright colors, kid-friendly.
```

## 6. Prompt Dekor per Trek — `decor_<trek>.png`
Template:
```
Pixel-art 16-bit roadside scenery sprites for a kart racing game, theme: {TEMA}.
Canvas 1024x1024, 4x4 grid of 256x256 cells, flat solid magenta #FF00FF background,
no text, no grid lines, each object standing centered at the bottom of its cell,
seen from the front at road level. 16 different objects: {DAFTAR}.
Dark outlines, bright colors.
```
| File | {TEMA} | {DAFTAR} (16 objek) |
|---|---|---|
| `decor_kuta.png` | Bali beach, sunny | 4 variasi pohon kelapa, payung pantai, papan selancar berdiri, gapura Bali (candi bentar), perahu jukung, istana pasir, batu karang, semak tropis, pura kecil, tiang bendera merah-putih, penjual es kelapa (kios), pelampung, papan petunjuk tanpa tulisan |
| `decor_jakarta.png` | Jakarta at night, neon city | 4 gedung tinggi berjendela menyala, lampu jalan, Monas kecil, bajaj, gerobak nasi goreng, pohon kota, halte bus, papan reklame neon tanpa tulisan, lampu lalu lintas, pagar pembatas, pot tanaman, tiang listrik, kucing di kardus |
| `decor_bromo.png` | Mount Bromo, misty volcanic highland | 4 variasi pohon cemara, batu vulkanik besar, kuda dengan pelana, jip off-road, tenda, pagar kayu, semak edelweiss, papan petunjuk tanpa tulisan, tumpukan batu, pura kecil, gubuk kayu, gulungan kabut |
| `decor_permen.png` | candy palace, pastel sweets | 4 lolipop raksasa, permen tongkat, kue cupcake, donat, cokelat batang, menara es krim, permen jeli beruang, pohon gulali, kastil kue kecil, marshmallow, biskuit, jamur permen |

## 7. Panorama Langit & Cover
**Panorama** `sky_<trek>.png`: 2048×512, **tanpa magenta** (latar penuh). Sisi kiri dan kanan harus menyambung (seamless) karena gambar diulang horizontal. Bagian bawah 1/4 berupa siluet horizon yang menyatu dengan jalan.
```
Pixel-art 16-bit seamless horizontal panorama background for a racing game, 2048x512,
left and right edges must tile seamlessly, no text. Theme: {TEMA PANORAMA}.
```
| File | {TEMA PANORAMA} |
|---|---|
| `sky_kuta.png` | bright blue sky, fluffy clouds, ocean horizon, distant Bali temple silhouettes and hills |
| `sky_jakarta.png` | dark blue night sky with stars, glowing city skyline, Monas tower silhouette, warm window lights |
| `sky_bromo.png` | dawn sky orange-pink, smoking Mount Bromo volcano, misty mountains, sea of sand |
| `sky_permen.png` | pastel pink-purple sky, cotton-candy clouds, distant candy castle and lollipop hills |

**Cover** `cover.png`: 1920×1080, latar penuh.
```
Pixel-art 16-bit key art for a kids' kart racing game "Falisha Kart Turbo" (do NOT render any text),
five chibi racers from the attached photos in their karts racing toward the camera on a curvy road
with hills, Falisha in front center, sparks and boost flames, bright and exciting, Mario Kart 64 vibe.
```
Lampirkan kelima foto, atau sheet pembalap yang sudah jadi supaya konsisten.

## 8. Checklist Serah-terima (centang saat push)
- [x] racer_falisha.png
- [x] racer_arsyad.png
- [x] racer_nono.png
- [x] racer_pupu.png
- [x] racer_baymax.png
- [x] items.png
- [x] decor_kuta.png · [x] decor_jakarta.png · [x] decor_bromo.png · [x] decor_permen.png
- [x] sky_kuta.jpg · [x] sky_jakarta.jpg · [x] sky_bromo.jpg · [x] sky_permen.jpg
- [x] cover.jpg

**Catatan dari Antigravity** (sel yang kurang pas, perubahan nama file, format per-baris, dll.):
> 1. **10 Sheet Berhasil Dibuat (1024x1024, PNG):**
>    - `racer_falisha.png`, `racer_arsyad.png`, `racer_nono.png`, `racer_pupu.png`, `racer_baymax.png` (semua 4x4 grid 256x256, gaya chibi pixel-art 16-bit, latar magenta #FF00FF, wajah mengikuti foto referensi masing-masing).
>    - `items.png` (sudah dibersihkan teks "POW" menjadi ledakan komik tanpa teks, ikon lengkap 4x4).
>    - `decor_kuta.png`, `decor_jakarta.png`, `decor_bromo.png`, `decor_permen.png` (dekor 4 trek, masing-masing 16 objek berlatar magenta).
> 2. **Kendala Quota Gambar (sky_* dan cover.png):**
>    - Saat masuk ke generasi panorama (`sky_kuta.png`, `sky_jakarta.png`, `sky_bromo.png`, `sky_permen.png`) dan `cover.png`, API image generation terkena limit kuota model (HTTP 429 Resource Exhausted: reset delay ~4 jam 54 menit).
>    - 10 sheet penting yang memuat semua gameplay sprites (pembalap, items, dekor trek) telah disimpan lengkap dan valid di `games/falisha-kart-turbo/assets/raw/`. File `sky_*` dan `cover.png` dapat digenerate setelah kuota reset atau dibuat fallback procedural/SVG bila fase 3 ingin segera dimulai.

> 3. **sky_* & cover dibuat manual lewat Gemini/ChatGPT** (Antigravity kehabisan kuota), format JPG:
>    - sky_kuta/jakarta 3168x1344, sky_bromo/permen 1584x672, cover 2752x1536 — ukuran & rasio dirapikan di fase 3.
>    - sky_kuta belum seamless kiri-kanan → di fase 3 dibuat tile cermin; sky lain hanya beda tipis (crossfade).
>    - Cover tanpa teks; judul ditambahkan lewat kode.

Setelah semua di-push, kembali ke Claude dengan pesan: **"sprite Falisha Kart Turbo sudah di-push, lanjut fase 3"**.
