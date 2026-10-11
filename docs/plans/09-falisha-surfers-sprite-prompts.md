# 🎨 Prompt Nano Banana — Falisha Surfers (remake Subway Surfers)

Buat **satu gambar per prompt** di Gemini (Nano Banana), simpan dengan **nama file persis** seperti judul bagian, lalu upload ke
**`games/falisha-surfers/assets/raw/`** (GitHub → *Add file → Upload files*).

Game **membaca file ini langsung**. Latar magenta dihapus otomatis di browser, jadi tidak perlu build atau script. Selama file
belum ada, game memakai karakter 3D sementara yang wajahnya diambil dari foto. Upload sebagian dulu juga boleh, misalnya hanya
`runner_falisha.png`.

Format **PNG** paling bagus. JPG juga bisa dibaca, tapi pinggiran sprite jadi kurang bersih.

---

## Aturan Umum
1. **Gaya: render 3D kartun, bukan pixel art.** Setiap prompt sudah memuat kalimat gaya di bawah. Jangan dihapus.
   > *3D rendered cartoon character, Pixar / Subway Surfers mobile game style, smooth rounded shapes, soft studio lighting, gentle ambient occlusion, slightly glossy materials. NOT pixel art, NOT flat 2D, no thick outlines.*
2. **Lampirkan foto referensi** dari `assets/Photo/` untuk sheet karakter. Wajah harus mudah dikenali.
3. **Kunci gaya.** Setelah `runner_falisha.png` jadi dan bagus, lampirkan file itu di prompt berikutnya dan tambahkan:
   *"Match the exact 3D render style, lighting, proportions and scale of the attached sprite sheet."*
4. **Latar magenta polos #FF00FF** untuk semua sprite. Tidak boleh ada lantai, bayangan jatuh, gradasi, atau garis grid.
   Pengecualian: `train_front.png`, `train_side.png`, `bg_city.png`, dan `cover.png` berlatar penuh.
5. **Jumlah baris × kolom dan urutan sel wajib sama** dengan prompt, karena game memotong sel berdasarkan posisinya.
   Ukuran piksel persisnya bebas.
6. **Tanpa** teks, huruf, angka, logo, atau watermark.
7. Kalau hasilnya meleset, minta revisi singkat, misalnya:
   *"same sheet, but every character must be seen from behind"*, *"same image, make the background pure flat magenta #FF00FF"*,
   atau *"same sheet, keep exactly 4 columns and 4 rows"*.

**Negatif (tempel di akhir prompt kalau Gemini bandel):**
`pixel art, 8-bit, 16-bit, blocky, voxel, flat vector, thick black outline, realistic photo, text, watermark, grid lines, floor, drop shadow, gradient background, extra people, cropped`

---

## A. Pelari (5 file, satu per karakter)

Nama file: `runner_falisha.png`, `runner_arsyad.png`, `runner_nono.png`, `runner_pupu.png`, `runner_baymax.png`.

### Template prompt (lampirkan foto karakternya)
```
Sprite sheet for an endless-runner mobile game like Subway Surfers.
3D rendered cartoon character, Pixar / Subway Surfers mobile game style, smooth rounded shapes,
soft studio lighting, gentle ambient occlusion, slightly glossy materials.
NOT pixel art, NOT flat 2D, no thick outlines.

Character based on the attached photo (keep the face clearly recognizable): {KARAKTER}.
Chibi-ish proportions (head about 1/4 of body height), sneakers, full body visible.

Layout: exactly 4 columns x 4 rows of equal square cells on a flat solid magenta #FF00FF background.
No grid lines, no floor, no shadows, no text. Same character, same outfit, same colors and same scale in every cell.
Each figure centered horizontally with the feet near the bottom of its cell, nothing touching the cell edges.

Row 1 (seen from BEHIND, back view, running away from the camera): 4 frames of a running cycle
  (left foot forward, passing, right foot forward, passing).
Row 2 (seen from BEHIND): jump take-off with arms up; mid-air with knees tucked;
  rolling low into a ball / sliding on the ground; tripping forward with arms flailing.
Row 3 (seen from BEHIND): leaning to dodge LEFT; leaning to dodge RIGHT;
  riding a colorful hoverboard skateboard with no wheels; flying with a small red jetpack with flames.
Row 4 (seen from the FRONT, facing camera): standing and waving hello; cheering with both arms up;
  sad caught pose looking down; head-and-shoulders portrait smiling.
```

### Isi `{KARAKTER}`
| File | Foto yang dilampirkan | `{KARAKTER}` |
|---|---|---|
| `runner_falisha.png` | `assets/Photo/falisaa.jpeg` | `Falisha, a cheerful 6-year-old Indonesian girl with straight black shoulder-length hair and bangs, round face, playful smile. She wears a yellow long-sleeve shirt with a round collar under an orange pinafore dress, orange leggings and white-pink sneakers, a small red backpack` |
| `runner_arsyad.png` | `assets/Photo/arsyad.jpeg` | `Arsyad, a 2-year-old Indonesian toddler boy with big fluffy curly black hair, rimless green-tinted sunglasses, a serious-funny pout. He wears a cream short-sleeve shirt with small cartoon prints and blue trim, blue shorts, little blue sneakers` |
| `runner_nono.png` | `assets/Photo/babah nono.jpeg` | `Babah Nono, a friendly Indonesian grandfather with a black velvet peci cap, very big toothy smile and squinting happy eyes. He wears a dark-green, black and white horizontally striped polo shirt, dark trousers, white sneakers` |
| `runner_pupu.png` | `assets/Photo/pupu.jpeg` | `Ibu Pupu, a young Indonesian mother wearing a black hijab framing her face, gentle smile, kind eyes. She wears a black knit sweater, a black wristwatch, long dark-grey trousers and pink sneakers` |
| `runner_baymax.png` | `assets/Photo/baymax.jpeg` | `Baymax, an Indonesian man with messy wavy black hair, thin mustache and goatee, relaxed calm face. He wears a black t-shirt, blue jeans and red sneakers, sturdy build` |

Tips:
* Kalau 16 pose sekaligus sulit, buat **dua kali**: baris 1–2, lalu baris 3–4 dengan melampirkan hasil pertama. Gabungkan di
  editor gambar menjadi satu sheet 4×4, atau simpan sebagai `runner_<id>_a.png` (baris 1–2, grid 4×2) dan
  `runner_<id>_b.png` (baris 3–4, grid 4×2). Game bisa membaca kedua cara.
* Baris 1 paling penting karena dipakai terus selama berlari. Pastikan ukurannya sama di keempat frame.

---

## B. Pengejar — `chaser.png`
Lampirkan `runner_falisha.png` yang sudah jadi sebagai acuan gaya.
```
Sprite sheet for an endless-runner game like Subway Surfers, same 3D render style as the attached sheet.
3D rendered cartoon, Pixar / Subway Surfers style, smooth rounded shapes, soft studio lighting, NOT pixel art.
Characters: "Pak Satpam", a chubby funny Indonesian train-station security guard with a navy-blue uniform,
black peaked cap, thick mustache, a silver whistle in his mouth; and his fat fluffy orange cat.
Layout: exactly 4 columns x 2 rows of equal square cells, flat solid magenta #FF00FF background,
no grid lines, no floor, no shadows, no text. Same scale in every cell, feet near the bottom of each cell.
Row 1 (seen from BEHIND, running away from camera): Pak Satpam running cycle, 4 frames.
Row 2: (1) the orange cat running, seen from behind; (2) the orange cat running, other leg frame;
  (3) Pak Satpam seen from behind reaching both arms forward to grab; (4) Pak Satpam head-and-shoulders portrait
  facing camera, angry-funny face blowing the whistle.
```

---

## C. Item & Power-up — `items.png`
```
Game item icons for an endless-runner game like Subway Surfers.
3D rendered cartoon objects, glossy, soft studio lighting, rounded shapes, NOT pixel art, no outlines.
Layout: exactly 4 columns x 2 rows of equal square cells, flat solid magenta #FF00FF background,
no grid lines, no text, no shadows. Each object centered in its cell, similar size.
Row 1: shiny gold coin with a lightning bolt emblem (front view); red horseshoe magnet;
  small red jetpack with two thrusters; pair of green super sneakers with little wings.
Row 2: golden star with sparkles (score multiplier); colorful hoverboard with a lightning stripe;
  wooden mystery box with a question-mark shape made of light (no letters); shiny gold trophy cup.
```

---

## D. Rintangan & Dekor — `obstacles.png`
```
Obstacle and decoration sprites for an endless-runner game set in an Indonesian commuter-train station (KRL),
seen from slightly above and behind, as in Subway Surfers.
3D rendered cartoon objects, glossy, soft studio lighting, rounded shapes, NOT pixel art, no outlines.
Layout: exactly 4 columns x 2 rows of equal square cells, flat solid magenta #FF00FF background,
no grid lines, no text, no shadows, no floor. Each object standing centered at the bottom of its cell, front view.
Row 1: (1) LOW red-and-white striped road barrier, short and wide (players jump over it);
  (2) HIGH overhead barrier: a wide yellow-and-black striped bar on two thin poles with a big EMPTY gap underneath
      (players slide under it), the gap must be clearly open;
  (3) a wooden Indonesian bakso street cart (gerobak) seen from the front;
  (4) a stack of three cardboard boxes.
Row 2 (roadside decoration): (1) green station lamp post; (2) potted tropical plant;
  (3) a red-and-white station bench; (4) a small banana tree.
```

---

## E. Tekstur Kereta KRL (latar penuh, tanpa magenta)

### `train_front.png` — rasio 1:1
```
Front face of an Indonesian KRL Commuter Line electric train, seen straight on, perfectly flat orthographic view,
filling the entire square image edge to edge, no background visible.
3D rendered cartoon style like Subway Surfers, glossy, clean, bright: white body, red and yellow stripes,
big dark windshield, two round headlights, black rubber bumper. No text, no logos, no numbers.
```

### `train_side.png` — rasio 16:9 (atau 21:9)
```
Side view of one Indonesian KRL Commuter Line train car, perfectly flat orthographic side view, filling the entire
image edge to edge, no background, no wheels area visible below the body.
3D rendered cartoon style like Subway Surfers, glossy and bright: white body, a red stripe and a yellow stripe along
the length, a row of dark rounded windows, two sliding doors. No text, no logos, no numbers.
```

---

## F. Latar Kota — `bg_city.png` — rasio 21:9 (atau 16:9)
```
Seamless wide panorama background for a mobile runner game, 3D rendered cartoon style like Subway Surfers.
Sunny Bandung city skyline in Indonesia: colorful low-rise buildings, a few towers, green hills and mountains
far away, bright blue sky with fluffy clouds. Left and right edges must tile seamlessly.
The bottom quarter is the city horizon. No text, no logos.
```

---

## G. Cover portal — `cover.png` — rasio 16:9
Lampirkan kelima foto, atau sheet pelari yang sudah jadi supaya konsisten. Untuk dipakai di portal, simpan (JPG, ±960×540)
sebagai **`portal/cover_game9.jpg`** menggantikan sampul sementara hasil screenshot.
```
Key art for a kids' endless-runner mobile game (do NOT render any text), 3D rendered Pixar / Subway Surfers style.
Five chibi family members from the attached images running and jumping along KRL train tracks toward the camera,
Falisha in the front center on a hoverboard, gold coins flying, a red-and-white commuter train on one side,
a funny security guard with a whistle and an orange cat chasing behind, sunny Bandung city and mountains
in the background. Bright, energetic, kid-friendly.
```

---

## Checklist upload
- [ ] runner_falisha.png
- [ ] runner_arsyad.png
- [ ] runner_nono.png
- [ ] runner_pupu.png
- [ ] runner_baymax.png
- [ ] chaser.png
- [ ] items.png
- [ ] obstacles.png
- [ ] train_front.png
- [ ] train_side.png
- [ ] bg_city.png
- [ ] cover.png

Urutan paling berguna: **runner_falisha → items → chaser → obstacles → kereta → latar → pelari lain → cover.**
