# 🚀 Prompt Nano Banana — Falisha Jetpack (remake Jetpack Joyride, luar angkasa)

Buat **satu gambar per prompt** di Gemini (Nano Banana), simpan dengan **nama file persis** seperti judul bagian, lalu upload ke
**`games/falisha-jetpack/assets/raw/`** (boleh juga ke `assets/Photo/`, nanti Claude yang memindahkan).

Setelah upload, minta Claude menjalankan `games/falisha-jetpack/tools/build_sprites.py`. Tool ini mendeteksi setiap pose
otomatis, jadi grid dari Gemini **tidak harus persis**, lalu menghapus latar magenta dan membuat atlas transparan. Selama sprite
belum ada, game tetap bisa dimainkan dengan grafis sementara (Falisha astronot dengan wajah dari foto).

Hanya ada **satu karakter: Falisha**. Game ini dilihat dari **samping** (side-scroller), Falisha terbang ke **kanan**.

---

## Aturan Umum
1. **Gaya: render 3D kartun, bukan pixel art.** Kalimat gaya ini sudah ada di setiap prompt. Jangan dihapus.
   > *3D rendered cartoon, Pixar / Jetpack Joyride mobile game style, smooth rounded shapes, soft studio lighting, glossy materials, NOT pixel art, NOT flat 2D, no thick outlines.*
2. **Lampirkan 2 gambar** di prompt karakter: foto `assets/Photo/falisaa.jpeg` dan sheet
   `games/falisha-surfers/assets/raw/runner_falisha.jpeg`. Tujuannya supaya wajah dan gaya Falisha sama dengan game Falisha Surfers.
3. **Latar magenta polos #FF00FF** untuk semua sprite. Tanpa lantai, tanpa bayangan jatuh, tanpa garis grid.
   Pengecualian: `bg_space.png`, `floor.png`, dan `cover.png` berlatar penuh.
4. Usahakan jumlah baris × kolom dan urutan sel sama dengan prompt. Kalau Gemini menggeser sedikit, tidak apa-apa.
5. **Tanpa** teks, huruf, angka, logo, atau watermark.
6. Kalau hasilnya meleset, minta revisi singkat, misalnya *"same sheet, every pose must face RIGHT, side view"* atau
   *"same image, background must be pure flat magenta #FF00FF"*.

**Negatif (tempel di akhir kalau perlu):**
`pixel art, 8-bit, blocky, voxel, flat vector, thick outline, realistic photo, text, letters, watermark, grid lines, floor, drop shadow, gradient background, extra characters, cropped`

---

## A. Falisha Astronot — `falisha_astro.png`
Lampirkan `falisaa.jpeg` + `runner_falisha.jpeg`.
```
Sprite sheet for a side-scrolling jetpack game like Jetpack Joyride, set in outer space.
3D rendered cartoon, Pixar / Jetpack Joyride mobile game style, smooth rounded shapes, soft studio lighting,
glossy materials, NOT pixel art, NOT flat 2D, no thick outlines.

Character: Falisha, the same cheerful 6-year-old Indonesian girl as in the attached images (keep her face
recognizable: round face, black hair with bangs). She wears a cute white-and-orange astronaut suit with yellow
accents, a clear round glass space helmet showing her face and hair, white-orange space boots, and a chunky
red-and-silver jetpack with two nozzles on her back.

Layout: exactly 4 columns x 4 rows of equal square cells on a flat solid magenta #FF00FF background.
No grid lines, no floor, no shadows, no text. Same character, same suit, same colors, same scale in every cell.
Full body visible and centered in each cell, nothing touching the cell edges.

Rows 1-3 are SIDE VIEW, facing RIGHT:
Row 1: running on the floor, 4 frames of a run cycle (jetpack off, no flames).
Row 2: (1) flying up with big orange-blue jetpack flames, (2) flying up, flames flickering differently,
       (3) falling down with flames off, arms raised, (4) landing on her feet, knees bent.
Row 3: (1) electrocuted: glowing blue sparks around her, hair standing up, funny shocked face;
       (2) tumbling in the air after being hit, rotated; (3) tumbling, rotated the other way;
       (4) sitting on the floor dizzy with little stars circling her helmet.
Row 4 (FRONT view, facing camera): (1) waving hello; (2) cheering with both arms up;
       (3) sad looking down; (4) head-and-shoulders portrait inside the helmet, smiling.
```

---

## B. Rintangan — `hazards.png`
Lampirkan `falisha_astro.png` yang sudah jadi sebagai acuan gaya.
```
Hazard sprites for a side-scrolling space jetpack game like Jetpack Joyride, same 3D style as the attached sheet.
3D rendered cartoon objects, glossy, soft studio lighting, rounded shapes, NOT pixel art, no outlines.
Layout: exactly 4 columns x 2 rows of equal square cells, flat solid magenta #FF00FF background,
no grid lines, no text, no shadows. Each object centered in its cell.
Row 1: (1) round metal electric emitter node with a glowing cyan core (front view);
       (2) cartoon homing missile flying to the LEFT, red and white, small flame at the back (side view);
       (3) round red warning alarm light, glowing, like a siren lamp (no letters, no symbols);
       (4) wall-mounted laser cannon pointing RIGHT, metal with a glowing red lens.
Row 2: (1) big grey-brown asteroid with craters; (2) small asteroid, different shape;
       (3) spiky floating space mine, dark metal with red blinking lights; (4) small cute green alien UFO saucer.
```

---

## C. Item & Power-up — `items.png`
```
Game item icons for a space jetpack game like Jetpack Joyride.
3D rendered cartoon objects, glossy, soft studio lighting, rounded shapes, NOT pixel art, no outlines.
Layout: exactly 4 columns x 2 rows of equal square cells, flat solid magenta #FF00FF background,
no grid lines, no text, no shadows. Each object centered in its cell, similar size.
Row 1: (1) shiny gold coin with a star emblem (front view); (2) glowing cyan energy shield bubble;
       (3) red horseshoe magnet with sparkles; (4) golden star with sparkles (double coins).
Row 2: (1) small red rocket with fire (speed boost); (2) big purple crystal gem;
       (3) red heart with a soft glow (extra life); (4) shiny gold trophy cup.
```

---

## D. Latar Angkasa — `bg_space.png` — rasio 21:9 (atau 16:9)
```
Seamless wide panorama background for a side-scrolling space game, 3D rendered cartoon style like Jetpack Joyride.
Deep outer space: dark navy-purple sky full of twinkling stars, colorful pink-blue nebula clouds,
a big ringed orange planet, a small blue planet and a cratered moon far away, a distant galaxy swirl.
Left and right edges must tile seamlessly. Calm, not too busy, so game objects stay readable. No text.
```

---

## E. Lantai Stasiun — `floor.png` — rasio 21:9
```
Seamless horizontal floor strip for a side-scrolling space-station game, side view, 3D rendered cartoon style.
A metal space-station deck seen from the side: the top edge is a flat walkable surface with yellow-black hazard
stripes and small glowing blue lights, below it metal panels, pipes and bolts. It fills the whole image edge to edge,
no background, no sky. Left and right edges must tile seamlessly. No text.
```

---

## F. Dekor Latar — `decor.png`
```
Background decoration sprites for a side-scrolling space game, 3D rendered cartoon style like Jetpack Joyride,
glossy, soft lighting, NOT pixel art, no outlines.
Layout: exactly 4 columns x 2 rows of equal square cells, flat solid magenta #FF00FF background,
no grid lines, no text, no shadows. Each object centered in its cell.
Row 1: (1) satellite with solar panels; (2) small planet with a ring; (3) comet with a glowing tail;
       (4) round space-station module with windows.
Row 2: (1) floating orange cat in a tiny astronaut helmet; (2) cute rocket ship;
       (3) Indonesian red-and-white flag on a small moon rock (no text); (4) friendly little robot floating.
```

---

## G. Cover — `cover.png` — rasio 16:9
Lampirkan `falisha_astro.png`.
```
Key art for a kids' space jetpack game (do NOT render any text), 3D rendered Pixar / Jetpack Joyride style.
Falisha in her white-orange astronaut suit flying to the right with a red jetpack and big flames, gold coins trailing,
electric zappers and a cartoon missile nearby, colorful nebula, ringed planet and stars in the background.
Bright, energetic, kid-friendly.
```

---

## Checklist upload
- [ ] falisha_astro.png
- [ ] hazards.png
- [ ] items.png
- [ ] bg_space.png
- [ ] floor.png
- [ ] decor.png
- [ ] cover.png

Urutan paling berguna: **falisha_astro → hazards → items → bg_space → floor → decor → cover.**
