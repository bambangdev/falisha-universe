# 🔫 Prompt Google Flow — Falisha Slug 3D (remake Metal Slug 2.5D)

Buat **satu gambar per prompt** di **Google Flow** (mode gambar / Nano Banana di Flow), simpan dengan **nama file persis**
seperti judul bagian, lalu upload ke **`games/falisha-slug-3d/assets/raw/`** (boleh juga ke `assets/Photo/`, nanti Claude yang memindahkan).

Setelah upload, minta Claude menjalankan:
```bash
python3 -I games/falisha-slug-3d/tools/build_sprites.py
```
Tool ini memotong sheet sesuai grid (4×4 / 4×2 / 2×2), menghapus latar magenta, membuat atlas transparan `assets/sprites/*.webp`
dan `atlas.js`. Selama sprite belum ada, game tetap bisa dimainkan dengan **aktor chibi 3D berwajah foto** (grafis sementara).
Kalau Flow menggeser grid, Claude bisa mengganti mode sheet ke `auto` (butuh `scipy`) dan memetakan ulang nomor frame
dengan `--debug` (lembar bernomor).

Game ini dilihat dari **samping** (side-scroller 2.5D). Semua karakter berjalan dan menembak ke **KANAN** (game membalik
sprite sendiri untuk arah kiri). Latar magenta polos supaya mudah dibuang.

---

## Aturan Umum
1. **Gaya: render 3D kartun, bukan pixel art.** Kalimat gaya ini sudah ada di setiap prompt. Jangan dihapus.
   > *3D rendered cartoon, Pixar / modern Metal Slug remake style, chunky stylized proportions, smooth rounded shapes,
   > soft studio lighting, slightly glossy materials, NOT pixel art, NOT flat 2D, no thick outlines.*
2. **Lampirkan 2 gambar** di tiap prompt karakter keluarga: foto dari `assets/Photo/` dan sheet pelari dari Falisha Surfers
   (`games/falisha-surfers/assets/raw/runner_<id>.jpg`) sebagai **kunci gaya & wajah**, supaya wajah konsisten dengan game lain.
3. **Latar magenta polos #FF00FF** untuk semua sprite. Tanpa lantai, tanpa bayangan jatuh, tanpa garis grid.
   Pengecualian: `bg_desert`, `bg_jungle`, `bg_city`, dan `cover` berlatar penuh.
4. **Grid harus persis** sesuai prompt (jumlah kolom × baris dan urutan sel). Setiap pose di tengah selnya, ukuran figur sama di semua sel.
5. **Tanpa** teks, huruf, angka, logo, atau watermark. **Tanpa darah** — game untuk anak 6 tahun.
6. Kalau hasilnya meleset, minta revisi singkat, misalnya *"same sheet, every pose must face RIGHT, side view"* atau
   *"same image, background must be pure flat magenta #FF00FF, exactly 4 columns x 4 rows"*.

**Negatif (tempel di akhir kalau perlu):**
`pixel art, 8-bit, blocky, voxel, flat vector, thick outline, realistic photo, text, letters, numbers, watermark, grid lines, floor, drop shadow, gradient background, extra characters, cropped, blood, gore, realistic weapon`

---

## A–E. Lima Jagoan Keluarga — `hero_<id>.png` (4 kolom × 4 baris)

Satu file per karakter. Ganti `{KARAKTER}` dengan baris tabel di bawah, lampirkan foto + sheet Surfers-nya.

| File | Lampiran | `{KARAKTER}` |
|---|---|---|
| `hero_falisha.png` | `falisaa.jpeg` + `runner_falisha.jpeg` | Falisha, a cheerful 6-year-old Indonesian girl (round face, black bob hair with bangs). Outfit: yellow commando vest over orange shirt, orange cargo shorts, white boots, red small backpack, yellow headband. Weapon: cute chunky yellow toy pistol |
| `hero_arsyad.png` | `arsyad.jpeg` + `runner_arsyad.jpg` | Arsyad, a chubby 3-year-old Indonesian boy with curly black hair and green round glasses. Outfit: cream t-shirt under a blue tactical vest, blue shorts, blue sneakers, green helmet too big for him. Weapon: oversized blue toy bazooka |
| `hero_nono.png` | `babah nono.jpeg` + `runner_nono.jpg` | Babah Nono, a smiling Indonesian grandfather with a big grin, black peci cap, mustache. Outfit: green-black-white striped shirt under a green army vest, dark trousers, white sneakers. Weapon: chunky green toy rifle and a giant coffee cup on his belt |
| `hero_pupu.png` | `pupu.jpeg` + `runner_pupu.jpg` | Ibu Pupu, a kind Indonesian mother wearing a black hijab. Outfit: black long-sleeve shirt under a pink tactical vest, dark trousers, pink sneakers. Weapon: pink toy pistol and a big soup ladle holstered on her back |
| `hero_baymax.png` | `baymax.jpeg` + `runner_baymax.jpg` | Baymax, a tall relaxed Indonesian man with messy black hair and a mustache. Outfit: black t-shirt under a red tactical vest, blue jeans, red sneakers, red bandana. Weapon: big red toy rocket fist on his right arm |

```
Sprite sheet for a side-scrolling run-and-gun game like Metal Slug.
3D rendered cartoon, Pixar / modern Metal Slug remake style, chunky stylized proportions, smooth rounded shapes,
soft studio lighting, slightly glossy materials, NOT pixel art, NOT flat 2D, no thick outlines.

Character: {KARAKTER}. Keep the face recognizable from the attached photo and the same character design as the
attached reference sheet. Kid-friendly cartoon toy weapon, no blood.

Layout: exactly 4 columns x 4 rows of equal square cells on a pure flat magenta #FF00FF background. Full body in every
cell, feet at the same height, SIDE VIEW, every pose faces RIGHT. Same character size in all cells.
Row 1: run cycle, 4 frames (contact, down, pass, up).
Row 2: idle standing with gun ready / jumping with knees tucked / shooting forward, gun recoil / aiming and shooting straight UP.
Row 3: crouching low and shooting forward / hurt, knocked back with arms up / throwing a grenade overhead / cheering with both arms raised.
Row 4: tied up as a hostage, sitting on the floor with rope around the body, sad / upper body only, peeking out of a tank hatch and waving / casting the special move with glowing hands / front-facing head and shoulders portrait, smiling.
No text, no numbers, no grid lines, no floor, no shadows.
```

## F. Pasukan Yanto — `soldier.png` (4 kolom × 2 baris)
```
Sprite sheet for a side-scrolling run-and-gun game like Metal Slug.
3D rendered cartoon, Pixar / modern Metal Slug remake style, chunky stylized proportions, smooth rounded shapes,
soft studio lighting, slightly glossy materials, NOT pixel art, NOT flat 2D, no thick outlines.

Character: a goofy cartoon enemy soldier, Indonesian man with a comical face, green uniform, green helmet with a chin
strap, brown boots, carrying a chunky green toy rifle. Funny, not scary, kid-friendly.

Layout: exactly 4 columns x 2 rows of equal square cells on a pure flat magenta #FF00FF background. Full body, feet at
the same height, SIDE VIEW, every pose faces LEFT (he faces the player). Same size in all cells.
Row 1: idle standing guard / running frame 1 / running frame 2 / shooting the rifle forward with muzzle flash.
Row 2: panicking and running away with both arms up, frame 1 / panicking, frame 2, scared face / surrendering with white flag / front-facing portrait.
No text, no grid lines, no floor, no shadows, no blood.
```

## G. Robot Mainan — `robot.png` (4 kolom × 2 baris)
```
Sprite sheet for a side-scrolling run-and-gun game like Metal Slug.
3D rendered cartoon, Pixar / modern Metal Slug remake style, chunky stylized proportions, smooth rounded shapes,
soft studio lighting, slightly glossy materials, NOT pixel art, NOT flat 2D, no thick outlines.

Character: a cute boxy silver toy robot enemy with one red visor eye, a red antenna ball on top, short stubby arms and
a single wide wheel instead of legs. Wind-up key on its back. Purple accents (Yanto's army colors).

Layout: exactly 4 columns x 2 rows of equal square cells on a pure flat magenta #FF00FF background. SIDE VIEW, every
pose faces LEFT. Same size in all cells.
Row 1: idle / rolling forward frame 1 / rolling forward frame 2 / throwing a bouncing rubber ball.
Row 2: hit, sparks and dented / broken, smoking, eye flickering, frame 1 / broken frame 2, parts popping off / front-facing portrait.
No text, no grid lines, no floor, no shadows.
```

## H. Item — `items.png` (4 kolom × 2 baris)
```
Item icons for a side-scrolling run-and-gun game like Metal Slug, kid-friendly.
3D rendered cartoon, Pixar style, smooth rounded shapes, soft studio lighting, glossy materials, NOT pixel art.

Layout: exactly 4 columns x 2 rows of equal square cells on a pure flat magenta #FF00FF background, one object centered
per cell, same scale.
Row 1: orange ammo crate with a big yellow letter "H" embossed (heavy machine gun) / red ammo crate with a big yellow
letter "R" embossed (rocket launcher) / green cartoon grenade / roasted chicken drumstick on a plate.
Row 2: glowing yellow lightning bolt orb (special charge) / blue shield badge (armor) / gold star / gold trophy cup.
No other text, no grid lines, no floor, no shadows.
```
(Huruf **H** dan **R** di peti boleh, karena itu bagian ikon item seperti di Metal Slug.)

## I. Pilot Yanto — `boss.png` (2 kolom × 2 baris)
Yanto adalah bos lucu yang mengemudikan mech dari dalam kokpit kaca. Mech-nya dibuat 3D di game, jadi hanya **badan
bagian atas Yanto** yang perlu digambar.
```
Character sheet for a kid-friendly side-scrolling run-and-gun game.
3D rendered cartoon, Pixar / modern Metal Slug remake style, chunky stylized proportions, smooth rounded shapes,
soft studio lighting, NOT pixel art, no thick outlines.

Character: "Boss Yanto", a comical grumpy Indonesian man, chubby, with slicked black hair, round goggles on his forehead,
small mustache, purple pilot jumpsuit with gold buttons, sitting in a cockpit seat (upper body only, waist up).

Layout: exactly 2 columns x 2 rows of equal square cells on a pure flat magenta #FF00FF background, front 3/4 view,
same size in all cells.
Row 1: grumpy idle, gripping two joysticks / angry shouting with mouth wide open, pointing forward.
Row 2: crying with big cartoon tears, defeated / waving a white flag, embarrassed smile.
No text, no grid lines, no shadows.
```

## J–L. Latar Jauh — `bg_desert.png`, `bg_jungle.png`, `bg_city.png` (lanskap 21:9, menyambung)
Satu gambar per tema. Gambar ini ditempel sebagai lapisan paling jauh (parallax), di depannya game menambah siluet
dan props 3D sendiri. **Tanpa magenta**, latar penuh.
```
Wide seamless side-scrolling game backdrop, aspect ratio 21:9, {TEMA}.
3D rendered cartoon, Pixar / modern Metal Slug remake style, soft lighting, rich colors, NOT pixel art.
Composition: sky takes the top 55%, distant scenery in the middle, the bottom 25% is a simple flat ground strip in a
single color so it can be hidden behind the 3D floor. No characters, no vehicles, no text. The left and right edges
must tile seamlessly (same height and colors at both edges).
```
| File | `{TEMA}` |
|---|---|
| `bg_desert.png` | sunny tropical beach meets desert: golden sand dunes, a few palm trees far away, turquoise sea on the horizon, blue sky with fluffy clouds |
| `bg_jungle.png` | lush tropical jungle: layered green hills, giant leaves, waterfalls, misty blue mountains, bright sky |
| `bg_city.png` | Indonesian city at dusk, "Kota Kilat": tall buildings with glowing windows, purple-orange sunset sky, distant Monas-like tower and a mosque dome, lightning in the clouds |

## M. Sampul Portal — `cover.png` (16:9)
```
Key art for a kid-friendly 3D cartoon run-and-gun game called Falisha Slug 3D, aspect ratio 16:9.
3D rendered cartoon, Pixar / modern Metal Slug remake style, dynamic action pose, dramatic lighting, NOT pixel art.
Scene: Falisha (6-year-old Indonesian girl, yellow vest, orange shorts, from the attached photo) rides a chunky green
cartoon tank SV-001 firing a glowing yellow shot, with Arsyad (chubby boy with green glasses), Babah Nono (grandfather
with peci), Ibu Pupu (mother in black hijab) and Baymax (tall man with mustache) charging beside her with toy weapons.
Behind them a giant purple mech robot with a glass cockpit piloted by grumpy Boss Yanto, and comical green soldiers
running away in panic. Tropical beach and desert dunes, blue sky, explosions as colorful cartoon rings. Leave the
top-left area less busy for the title. No text, no logo, no blood.
```
Lampirkan 5 foto dari `assets/Photo/`. Hasilnya otomatis dipasang ke `portal/cover_game11.jpg` (960×540) oleh `build_sprites.py`.

---

## Checklist Upload ke `games/falisha-slug-3d/assets/raw/`
- [ ] `hero_falisha.png`
- [ ] `hero_arsyad.png`
- [ ] `hero_nono.png`
- [ ] `hero_pupu.png`
- [ ] `hero_baymax.png`
- [ ] `soldier.png`
- [ ] `robot.png`
- [ ] `items.png`
- [ ] `boss.png`
- [ ] `bg_desert.png`
- [ ] `bg_jungle.png`
- [ ] `bg_city.png`
- [ ] `cover.png`

**Urutan yang disarankan** (yang paling terlihat dulu): `hero_falisha` → `soldier` → `items` → `bg_desert` → `hero_arsyad`,
`hero_nono`, `hero_pupu`, `hero_baymax` → `robot` → `bg_jungle`, `bg_city` → `boss` → `cover`.
Setelah tiap batch upload, jalankan `build_sprites.py` lagi; sheet yang belum ada otomatis dilewati dan game memakai
grafis sementara untuk bagian itu.
