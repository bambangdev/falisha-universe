# Walkthrough – Falisha Universe

Catatan perjalanan pengembangan dari awal sampai akhir. Plan detail tiap game ada di [`docs/plans/`](plans/).

## Ringkasan Game

| # | Game | Genre | Path | Plan |
|---|------|-------|------|------|
| 1 | Falisha the Flash vs Boss Yanto | Action runner / boss fight | `/games/falisha-vs-yanto/` | [plan](plans/01-falisha-vs-yanto-plan.md) |
| 2 | Warisan Combat | 2D fighting vs CPU (5 karakter) | `/games/warisan-combat/` | [plan](plans/02-warisan-combat-plan.md) |
| 3 | Falisha Slug | Run-and-gun (remake Metal Slug) | `/games/falisha-slug/` | [plan](plans/03-falisha-slug-plan.md) |
| 4 | Falisha Pac | Arcade maze (remake Pac-Man) | `/games/falisha-pac/` | [plan](plans/04-falisha-pac-plan.md) |
| 5 | Falisha Kart | Kart racing ala Mario Kart (Mode 7) | `/games/falisha-kart/` | [plan](plans/05-falisha-kart-plan.md) |

Semua game: HTML5 Canvas + Web Audio + Vanilla CSS, tanpa backend, dioptimalkan untuk tablet (Samsung Tab S8) dan desktop. Portal ada di `/` (`index.html`, `portal/`).

## Kronologi

### 1. Portal + Falisha vs Yanto
- Dibuat portal pemilih game dan game pertama: lari, lompat, koin, powerup, boss Yanto.
- Aset visual (sprite, background, boss, ikon powerup, title art) digenerate sebagai gambar.

### 2. Warisan Combat
- Feedback user pada plan: karakter nyata dari foto saja, sisanya siluet menyusul; mode arcade vs CPU dulu; serangan epik tanpa darah; cocok untuk usia 6 tahun.
- Lima fighter: Falisha, Arshad, Babah Nono, Ibu Pupu, Baymax, masing-masing dengan 2 skill + ultimate.

### 3. Deploy GitHub + Vercel
- Repo: `bambangdev/falisha-universe`, hosting Vercel (`vercel.json`, `trailingSlash`).
- Bug: halaman blank di Vercel karena path aset/redirect. Fix: trailing slash redirect + resolusi path relatif.

### 4. Falisha Slug (Metal Slug remake)
- Tank SV-001, sandera Babah, HMG, boss Yanto Mech.
- Masalah dilaporkan user: sprite melayang, level terlalu singkat, sprite tidak muncul, kontrol tablet berantakan, stage pindah tiba-tiba.
- Fix: tileset platform nyata + bayangan tanah, 5 misi penuh, safeguard batas sprite, kontrol tablet responsif, perbaikan progres stage clear.

### 5. Falisha Pac (Pac-Man remake)
- 4 labirin neon, 4 hantu keluarga (Yanto, Pupu, Arshad, Nono), Mega Kumon power pellet, buah bonus, Flash Dash.
- Masalah user: kontrol tidak bisa dimainkan.
- Akar masalah: toleransi belok hanya ~2.7px, kecepatan 2.2 tidak membagi tile 24px, swipe hanya dibaca saat jari diangkat, hantu mengeroyok sejak awal.
- Fix:
  - Kecepatan 2.0 (dash 3.0), cornering assist 11px, putar balik 180° instan, mulai gerak dari posisi diam.
  - Swipe kontinu dan D-pad berbasis `<button>` dengan pointer events.
  - Wave scatter/chase klasik, jadwal keluar rumah hantu, kecepatan hantu diturunkan.
- Diverifikasi dengan simulasi headless (Node) untuk belokan, putar balik, dash, swipe, dan D-pad.

### 6. Falisha Kart (Mario Kart remake) — Selesai v1
- Plan: `docs/plans/05-falisha-kart-plan.md`. Keputusan user (4 Okt 2026): nama "Falisha Kart", roster 5 karakter, Tempurung Raksasa boleh, v1 = 4 sirkuit (Piala Keluarga), mode Grand Prix dulu.
- Build: `games/falisha-kart/` — engine Mode 7 pseudo-3D (Canvas 2D), 5 pembalap keluarga (Falisha/Arshad/Babah Nono/Ibu Pupu/Baymax) dengan stat beda, 4 sirkuit Piala Keluarga (Taman Rumah, Dapur GP, Kamar Tidur Rally, Ruang Piano Sprint), 7 item keluarga (Sambal Petir, Buku Kumon, Piano Terbang, Kulit Pisang, Bintang Petir, Tempurung Raksasa, Kotak Kejutan), drift + mini-turbo, start boost, AI CPU rubber-banding, Grand Prix 4 balapan + podium, musik chiptune via `shared/audio.js`.
- Kontrol: keyboard (Panah/WASD, Spasi=item, Shift=drift) + tombol sentuh multi-touch untuk Tab S8.
- Cover portal: `portal/cover_game5.jpg`, entri baru di `portal/portal.js`.
- Verifikasi: smoke test Node (fisika, AI, item) + render test headless lolos; **tes manual di tablet disarankan** (target 60fps di Tab S8).
- v2 (nanti): Piala Petir (4 sirkuit), Time Trial, VS 2P, slipstream.

## Cara Menjalankan
```bash
python3 -m http.server 8000
```
Buka `http://localhost:8000`. Live: https://falisha-universe.vercel.app

## Catatan
- Folder `.vercel/` bersifat lokal dan jangan di-commit.
- Verifikasi browser otomatis tidak tersedia saat sesi terakhir (driver Playwright gagal diunduh), jadi pengujian kontrol Pac dilakukan lewat simulasi Node. Disarankan tes manual di tablet.

