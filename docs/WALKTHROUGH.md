# Walkthrough – Falisha Universe

Catatan perjalanan pengembangan dari awal sampai akhir. Plan detail tiap game ada di [`docs/plans/`](plans/).

## Ringkasan Game

| # | Game | Genre | Path | Plan |
|---|------|-------|------|------|
| 1 | Falisha the Flash vs Boss Yanto | Action runner / boss fight | `/games/falisha-vs-yanto/` | [plan](plans/01-falisha-vs-yanto-plan.md) |
| 2 | Warisan Combat | 2D fighting vs CPU (5 karakter) | `/games/warisan-combat/` | [plan](plans/02-warisan-combat-plan.md) |
| 3 | Falisha Slug | Run-and-gun (remake Metal Slug) | `/games/falisha-slug/` | [plan](plans/03-falisha-slug-plan.md) |
| 4 | Falisha Pac | Arcade maze (remake Pac-Man) | `/games/falisha-pac/` | [plan](plans/04-falisha-pac-plan.md) |

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

## Cara Menjalankan
```bash
python3 -m http.server 8000
```
Buka `http://localhost:8000`. Live: https://falisha-universe.vercel.app

## Catatan
- Folder `.vercel/` bersifat lokal dan jangan di-commit.
- Verifikasi browser otomatis tidak tersedia saat sesi terakhir (driver Playwright gagal diunduh), jadi pengujian kontrol Pac dilakukan lewat simulasi Node. Disarankan tes manual di tablet.
