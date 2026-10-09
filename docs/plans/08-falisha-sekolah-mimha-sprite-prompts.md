# 🎨 Prompt Sprite Gemini — Petualangan Falisha di MIMHa

Buat **satu gambar per prompt** di Gemini (atau ChatGPT), lalu simpan dengan nama file persis seperti judul tiap bagian. Upload semuanya ke **`games/falisha-sekolah/assets/raw/`** (GitHub → *Add file → Upload files*). Format PNG atau JPG boleh. Untuk file berlatar magenta, PNG lebih baik.

Ada 21 file: 6 karakter, 7 peta, 5 objek/mini-game, dan 3 lain-lain.

## Aturan Umum
1. **Lampirkan foto referensi** untuk sprite keluarga: `assets/Photo/falisha.jpeg`, `pupu.jpeg`, `baymax.jpeg`, `babah nono.jpeg`, `arsyad.jpeg`. Wajah harus mudah dikenali.
2. **Kunci gaya.** Setelah `char_falisha_walk.png` jadi, lampirkan file itu ke setiap prompt berikutnya dan tambahkan kalimat: *"Match the exact pixel-art style, outline and palette of the attached sprite sheet."*
3. **Latar magenta polos #FF00FF** untuk semua sprite karakter dan objek, kecuali peta, potret, dan cover.
4. **Grid sel** cukup kira-kira. Ukuran persis tidak penting, tapi **jumlah baris × kolom dan urutannya harus sama** dengan prompt, karena sel dipotong berdasarkan posisinya.
5. **Tanpa** teks, huruf, angka, logo, atau watermark. Pengecualian: huruf hijaiyah di sheet `iqro_cards.png`.
6. Kalau hasilnya kurang pas, minta revisi dengan kalimat pendek, misalnya *"same image but remove the text"* atau *"same sheet but keep the white hijab in every cell"*.

> **Gaya dasar** (sudah ada di setiap prompt): *16-bit pixel art, top-down RPG style like Pokémon Emerald and Stardew Valley, chibi proportions, dark 1–2 px outline, bright cheerful colors, kid-friendly.*

---

## A. Karakter

### 1. `char_falisha_walk.png` — lampirkan `falisha.jpeg`
```
16-bit pixel art top-down RPG character sprite sheet, Pokémon Emerald / Stardew Valley style, chibi proportions,
dark outline, bright colors. Character: Falisha, a cheerful 6-year-old Indonesian girl from the attached photo
(keep her face recognizable: round face, big happy smile, dark eyes). She wears an Islamic elementary school
uniform: white long-sleeve shirt, long dark-green skirt, white school hijab (kerudung) framing her face,
black shoes, small red backpack.
Layout: a grid of 3 columns x 4 rows, equal square cells, flat solid magenta #FF00FF background, no grid lines, no text.
Row 1: walking DOWN (facing camera) — left step, standing, right step.
Row 2: walking LEFT — left step, standing, right step.
Row 3: walking RIGHT — left step, standing, right step.
Row 4: walking UP (back view, backpack visible) — left step, standing, right step.
Same size, same colors in every cell, each character centered with feet at the bottom of the cell.
```

### 2. `char_falisha_poses.png` — lampirkan `falisha.jpeg` + `char_falisha_walk.png`
```
16-bit pixel art sprite sheet of the same girl Falisha (match the attached sprite sheet exactly: white hijab,
white shirt, dark-green long skirt). Front/side view poses, chibi, dark outline.
Grid 4 columns x 2 rows, equal square cells, flat solid magenta #FF00FF background, no text, no grid lines.
Row 1: (1) jumping happily with arms up, (2) holding a pencil and reading a small book, (3) eating bread,
       (4) jumping over a skipping rope.
Row 2 (prayer poses, side view facing right, wearing a white prayer mukena): (1) standing with hands folded on chest,
       (2) bowing (ruku'), (3) prostrating (sujud), (4) sitting (tahiyat).
Each pose centered at the bottom of its cell, same scale.
```

### 3. `char_keluarga.png` — lampirkan `pupu.jpeg`, `baymax.jpeg`, `babah nono.jpeg`, `arsyad.jpeg` + `char_falisha_walk.png`
```
16-bit pixel art top-down RPG character sprite sheet, same style as the attached Falisha sprite sheet.
Four family members based on the attached photos (faces recognizable):
- Ibu Pupu: young woman, black hijab, black knit sweater, gentle smile.
- Baymax: man with messy black wavy hair, thin mustache and goatee, black t-shirt, jeans.
- Babah Nono: older man, black velvet peci cap, very big smile, green-black-white striped polo shirt.
- Arsyad: toddler boy, big curly black hair, green-tinted sunglasses, cream polka-dot shirt.
Grid 4 columns x 4 rows, flat solid magenta #FF00FF background, no text, no grid lines.
Each COLUMN is one person in the order above (Ibu Pupu, Baymax, Babah Nono, Arsyad).
Row 1: facing down, standing. Row 2: facing down, waving hello. Row 3: walking right, step pose. Row 4: walking right, standing.
Same scale as Falisha (adults taller, Arsyad smaller), feet at the bottom of each cell.
```

### 4. `char_sekolah.png` — tokoh fiktif, lampirkan `char_falisha_walk.png`
```
16-bit pixel art top-down RPG NPC sprite sheet, same style as the attached sprite sheet, fictional characters
(not real people). Grid 4 columns x 2 rows, flat solid magenta #FF00FF background, no text, no grid lines.
All facing down (toward the camera), standing, centered at the bottom of each cell.
Row 1: (1) Bu Guru Aisyah — kind female teacher, light-blue hijab, long dark-blue dress, holding a book;
       (2) Pak Ustadz Hasan — male religious teacher, white koko shirt, white peci, short beard, sarong;
       (3) Pak Satpam Dadang — friendly school security guard, navy uniform, cap, whistle;
       (4) Bu Kantin Euis — canteen lady, orange hijab, apron.
Row 2: four classmates in the same school uniform as Falisha (white shirt, dark-green bottoms):
       (1) Rafi — boy with black peci, glasses; (2) Nisa — girl with white hijab, pigtail-style hijab tails, cheerful;
       (3) Zahra — girl with white hijab, holding a skipping rope; (4) Fikri — chubby boy with peci, holding a broom.
```

### 5. `portrait_utama.png` — potret dialog, lampirkan foto keluarga + `char_falisha_walk.png`
```
16-bit pixel art dialogue portraits (head and shoulders) for an RPG, same style and colors as the attached sprite sheet,
faces recognizable from the attached photos. Grid 4 columns x 2 rows of square portraits, each with a soft light-blue
rounded-square background, no text.
Row 1: Falisha happy smile, Falisha surprised, Falisha sad/teary, Falisha proud with a star sticker.
Row 2: Ibu Pupu smiling, Baymax smiling, Babah Nono big laugh, Arsyad cute serious face with sunglasses.
```

### 6. `portrait_sekolah.png` — lampirkan `char_sekolah.png`
```
16-bit pixel art dialogue portraits (head and shoulders), same style and the same fictional characters as the attached
NPC sheet. Grid 4 columns x 2 rows of square portraits, each with a soft light-green rounded-square background, no text.
Row 1: Bu Guru Aisyah, Pak Ustadz Hasan, Pak Satpam Dadang, Bu Kantin Euis.
Row 2: Rafi, Nisa, Zahra, Fikri.
```

---

## B. Peta (latar penuh, 16:9, tanpa tokoh)
Untuk semua peta:
* Pilih rasio **16:9** di Gemini.
* Lampirkan `char_falisha_walk.png` supaya skalanya cocok. Satu ubin lantai kira-kira selebar Falisha.
* **Jangan ada orang, teks, atau papan bertulisan.**
* Kalau punya foto gedung MIMHa asli, lampirkan juga dan tambahkan kalimat *"inspired by the attached school photo"*.

Template:
```
16-bit pixel art top-down RPG map background (3/4 top-down view like Pokémon Emerald / Stardew Valley), 16:9,
one single screen, no characters, no people, no text, no signs with letters. Bright morning light, kid-friendly.
Match the pixel style of the attached sprite sheet. Scene: {ADEGAN}
```

| File | {ADEGAN} |
|---|---|
| **7. `map_rumah.png`** | `A cozy Indonesian home interior seen from above: a girl's bedroom area on the left (bed, small desk with a water bottle on it, a red school backpack on a chair), a living room on the right (sofa, low table, carpet, TV cabinet, family photo frame), a dining corner at the top right. The front door is at the bottom center of the map.` |
| **8. `map_jalan.png`** | `A quiet residential street in Cikadut, East Bandung in the morning, horizontal road crossing the middle of the map from left to right, sidewalks on both sides, small houses with tiled roofs at the top, a small warung (food stall) and trees, green hills in the far top. The walking path continues off the left edge and off the right edge.` |
| **9. `map_gerbang.png`** | `The front yard of an Islamic elementary school (madrasah) with green-and-white walls: an open school gate on the left edge, a flagpole with the Indonesian flag in the middle of a paved yard, a two-story school building along the top with two doors (top-left door = classroom, top-right door = prayer room), potted plants, benches, a trash bin, the yard opens to the right edge toward a playground.` |
| **10. `map_lapangan.png`** | `A school playground and small garden behind an Islamic elementary school: open grass field with painted lines in the center, a slide and swing on the right, a small vegetable garden at the bottom right, trees, a trash bin, a canteen building at the top with a door at the top center, the path continues off the left edge.` |
| **11. `map_kelas.png`** | `An Indonesian elementary classroom seen from above: blackboard (blank, no writing) and teacher's desk at the top, four rows of small student desks and chairs in the middle, a bookshelf on the left wall, a trash bin and a broom in the corner on the right, windows on the right wall, the door at the bottom center.` |
| **12. `map_musala.png`** | `A small school prayer room (musala) seen from above: green prayer carpets in rows on the right two-thirds, a small mimbar at the top right, shelves with Qur'ans, an ablution (wudhu) area on the left side with a row of water taps over a tiled trough, a shoe rack near the door, the door at the bottom center.` |
| **13. `map_kantin.png`** | `A cheerful school canteen seen from above: a long display counter with snacks (bread, milk boxes, bananas, fried snacks) along the top, a cash box on the counter, several tables with benches in the middle, a hand-washing sink on the left, the door at the bottom center.` |

---

## C. Objek & Mini-game (latar magenta)

### 14. `items.png`
```
16-bit pixel art item icon sheet for a kids' school RPG, same style as the attached sprite sheet.
Grid 4 columns x 4 rows, equal square cells, flat solid magenta #FF00FF background, no text, no grid lines, each item centered.
Row 1: red school backpack, pink water bottle, Iqro reading book (green cover, no letters), lunch box.
Row 2: red colored pencil, yellow colored pencil, green colored pencil, blue colored pencil.
Row 3: purple colored pencil, crumpled paper trash, plastic bottle trash, snack wrapper trash.
Row 4: green trash bin, golden star sticker, red heart sticker, small floor arrow marker (yellow).
```

### 15. `jajan_uang.png`
```
16-bit pixel art icon sheet, same style as the attached sprite sheet. Grid 4 columns x 2 rows, flat solid magenta #FF00FF
background, no text, no numbers, no grid lines, each item centered.
Row 1: a piece of bread, a small milk carton, a banana, a fried risol snack.
Row 2: a silver 500 rupiah coin, a gold 1000 rupiah coin, a 2000 rupiah banknote (grey-blue, no readable text),
       a small red coin purse.
```

### 16. `wudhu.png` — lampirkan `char_falisha_poses.png`
```
16-bit pixel art illustration cards of the same girl Falisha (match the attached sprite sheet) performing wudhu (ablution)
at a water tap, simple clean steps for kids, sleeves rolled up. Grid 4 columns x 2 rows of square cards with a light
cream background and a dark rounded border, no text, no numbers.
Row 1: (1) washing both hands, (2) rinsing mouth, (3) rinsing nose, (4) washing face.
Row 2: (5) washing arms up to the elbows, (6) wiping the head, (7) wiping the ears, (8) washing the feet.
```

### 17. `iqro_cards.png`
```
Pixel-art style flash-card sheet of Arabic hijaiyah letters for kids. Grid 7 columns x 4 rows (28 cards), each card a
cream rounded square with a dark outline and ONE large, clear, correctly written Arabic letter in black, in this exact
order left-to-right, top-to-bottom: ا ب ت ث ج ح خ / د ذ ر ز س ش ص / ض ط ظ ع غ ف ق / ك ل م ن و ه ي.
No other text, no Latin letters, no numbers.
```
> Kalau Gemini sering salah menulis huruf Arab, **file ini boleh dilewati**. Game akan menggambar huruf dengan font *Noto Naskh Arabic*.

### 18. `minigame_props.png`
```
16-bit pixel art prop sheet, same style as the attached sprite sheet. Grid 4 columns x 2 rows, flat solid magenta #FF00FF
background, no text, no grid lines, each object centered.
Row 1: a red apple, a skipping rope (curved, held by two hands at the ends), a wooden prayer-time drum (bedug),
       a speech bubble with a heart.
Row 2: a water tap with running water, a small green prayer carpet, a school bell, a gold trophy.
```

---

## D. Lain-lain

### 19. `cover.png` — lampirkan `char_falisha_walk.png` + `falisha.jpeg` (+ foto gedung MIMHa bila ada)
```
16-bit pixel art key art for a kids' adventure game, 16:9, NO text or letters anywhere. Cheerful 6-year-old girl Falisha
(from the attached sprite sheet and photo: white school hijab, white shirt, dark-green skirt, red backpack) waving and
walking toward a friendly green-and-white Islamic elementary school (madrasah) building in East Bandung, morning sun,
green hills, classmates waving in the background, flying colorful pencils and golden star stickers. Keep the top quarter
as open sky for a title.
```

### 20. `rapor_bg.png`
```
16-bit pixel art background for a kids' "today's report card" screen, 16:9, no text: a cheerful notebook page on a wooden
school desk, colorful pencils, star stickers around the edges, empty space in the middle for content.
```

### 21. `dialog_box.png`
```
16-bit pixel art UI dialog box frame for an RPG, very wide (about 6:1), cream paper interior, dark-green rounded border
with small golden star corners, empty inside, flat solid magenta #FF00FF background outside the box, no text.
```

---

## Checklist Upload
- [ ] 1 `char_falisha_walk.png`  - [ ] 2 `char_falisha_poses.png`  - [ ] 3 `char_keluarga.png`  - [ ] 4 `char_sekolah.png`
- [ ] 5 `portrait_utama.png`  - [ ] 6 `portrait_sekolah.png`
- [ ] 7 `map_rumah.png`  - [ ] 8 `map_jalan.png`  - [ ] 9 `map_gerbang.png`  - [ ] 10 `map_lapangan.png`
- [ ] 11 `map_kelas.png`  - [ ] 12 `map_musala.png`  - [ ] 13 `map_kantin.png`
- [ ] 14 `items.png`  - [ ] 15 `jajan_uang.png`  - [ ] 16 `wudhu.png`  - [ ] 17 `iqro_cards.png` (opsional)  - [ ] 18 `minigame_props.png`
- [ ] 19 `cover.png`  - [ ] 20 `rapor_bg.png`  - [ ] 21 `dialog_box.png`

Setelah semua di-upload, kirim ke Claude: **"sprite MIMHa sudah di-upload, lanjut eksekusi plan"**.
