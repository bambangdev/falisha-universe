# ⚡ Falisha Universe – Portal Game Keluarga

Portal web game retro pixel art untuk keluarga, dioptimalkan untuk layar tablet (Samsung Galaxy Tab S8 / iPad) dan browser desktop / mobile.

## 🎮 Daftar Game

### 1. Falisha the Flash vs Boss Yanto 🏃‍♀️💨
- **Genre:** Action Runner / Boss Fight
- **Fitur:** Lari, lompat, kumpulkan koin & powerup, kalahkan Boss Yanto dengan jurus-jurus legendarisnya!
- **Path:** `/games/falisha-vs-yanto/`

### 2. Warisan Combat 🥊⚡
- **Genre:** 2D Fighting Arcade vs CPU
- **5 Karakter Keluarga (berdasarkan foto asli):**
  - **Falisha:** Kilat Dash, Petir Panah, Ultimate: Piano Sambil Nangis 🎹
  - **Arshad:** Lari Tabrak, Makan Banyak (HP heal 🍔), Ultimate: TERIAAAAK !!! 📢
  - **Babah Nono:** Jahit Baju, Doa Cahaya, Ultimate: DOA AMPUH ! ☀️
  - **Ibu Pupu:** Suruh Makan 🥄, Kerjain Kumon 📝, Ultimate: SINGA MARAH ! 🦁🔥
  - **Baymax:** Kasih Hadiah 🎁, Tidur Pulas 💤, Ultimate: ROBOT BAYMAX ! 🚀
- **Path:** `/games/warisan-combat/`

### 6. Falisha Spidey & Sahabat 🕷️🕸️
- **Genre:** Platformer ayun jaring (terinspirasi *Spidey and His Amazing Friends*)
- **Tim hero:** Falisha (Spidey-Kilat), Ibu Pupu (Ghost-Spider Pink), Baymax (Spin Robot) — bisa tukar kapan saja
- **Musuh lucu:** Arsyad si Goblin Kacamata & Babah Nono si Badak Peci
- **Fitur:** ayun & tembak jaring, selamatkan warga, Team-Up "GO WEBS GO!", 3 stage + bos. Wajah karakter diambil dari foto `assets/Photo/`.
- **Path:** `/games/falisha-spidey/`

### 7. Falisha Kart Turbo 🏁
- **Genre:** Kart racing pseudo-3D ala Mario Kart 64 (tanjakan, terowongan, ramp)
- **Pembalap:** Falisha, Arsyad, Babah Nono, Ibu Pupu, Baymax — sprite 8 sudut dibuat dengan Nano Banana dari foto `assets/Photo/`
- **Sirkuit Piala Nusantara:** Pantai Kuta, Jakarta Malam, Gunung Bromo, Istana Permen
- **Fitur:** Grand Prix vs CPU (3 tingkat kesulitan), Time Trial + ghost, Latihan, drift mini-turbo, start turbo, slipstream, 7 item keluarga, gas otomatis untuk anak
- **Path:** `/games/falisha-kart-turbo/`

### 8. Petualangan Falisha di MIMHa 🏫
- **Genre:** RPG top-down satu hari sekolah di MIMHa (Madrasah Interaktif Miftahul Huda, Cikadut, Bandung)
- **Tokoh:** Falisha + keluarga (dari foto `assets/Photo/`), Ibu Dewi, Pak Gungun, teman sekelas Putra, Anasya, Ayana, Seyan
- **Alur 14 langkah:** dari siap-siap di rumah, jalan ke sekolah bersama Baymax, sampai dijemput Babah Nono & Arsyad
- **7 mini-game:** urutan wudhu, shalat dhuha, huruf hijaiyah, berhitung apel, susun doa, belanja di kantin (uang pas), lompat tali — tanpa kalah, ada rapor bintang
- **Path:** `/games/falisha-sekolah/`

### 9. Falisha Surfers 🛹🚆
- **Genre:** Endless runner 3D ala *Subway Surfers* (Three.js)
- **Pelari:** Falisha, Arsyad, Babah Nono, Ibu Pupu, Baymax. Dikejar Pak Satpam & kucing oren
- **Fitur:** 3 jalur rel KRL, lompat/guling/geser, naik atap kereta lewat tanjakan, kereta melaju, koin, magnet, jetpack, sepatu super, skor x2, hoverboard, kotak misteri, rekor tersimpan
- **Sprite:** render 3D kartun dari Nano Banana ([prompt](docs/plans/09-falisha-surfers-sprite-prompts.md)). File asli di `games/falisha-surfers/assets/raw/`, diolah jadi atlas transparan dengan `python3 -I games/falisha-surfers/tools/build_sprites.py`
- **Path:** `/games/falisha-surfers/`

### 10. Falisha Jetpack 🚀🪐
- **Genre:** Side-scroller endless ala *Jetpack Joyride*, berlatar luar angkasa
- **Karakter:** Falisha si astronot
- **Fitur:** tahan untuk terbang; zapper listrik (diam & berputar), roket berpemandu dengan peringatan, laser horizontal, asteroid, ranjau, UFO; koin bintang; power-up perisai, magnet, koin x2, turbo, dan nyawa tambahan; rekor tersimpan
- **Sprite:** dibuat dengan Nano Banana memakai [prompt ini](docs/plans/10-falisha-jetpack-sprite-prompts.md), lalu diolah dengan `python3 -I games/falisha-jetpack/tools/build_sprites.py`. Sebelum sprite ada, game memakai grafis sementara dengan wajah dari foto
- **Path:** `/games/falisha-jetpack/`

---

## 🚀 Menjalankan Secara Lokal
```bash
python3 -m http.server 8000
```
Buka `http://localhost:8000` di browser.

## ☁️ Deploy ke Vercel
Game ini adalah aplikasi web statis murni (HTML5, Canvas, Web Audio API, Vanilla CSS) tanpa dependensi backend, sehingga dapat langsung di-deploy gratis di [Vercel](https://vercel.com).

## 📚 Dokumentasi
- [Walkthrough pengembangan](docs/WALKTHROUGH.md)
- Plan tiap game: [docs/plans/](docs/plans/)
