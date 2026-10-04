# 🎖️ Plan: Game #3 – Remake "Metal Slug" (Falisha Slug: Super Vehicle)

## 1. Konsep & Nuansa
- **Genre:** 2D Run-and-Gun Arcade Platformer (gaya klasik *Metal Slug* ala Neo Geo).
- **Nuansa:** Kartun retro penuh aksi, warna cerah, efek ledakan balon/komik seru tanpa darah (100% ramah anak usia 6 tahun).
- **Target Platform:** Layar sentuh Samsung Galaxy Tab S8 (D-pad/analog, tombol Tembak, Lompat, Bom) & Keyboard Desktop (WASD / Panah + J, K, L).

---

## 2. Karakter & Roster

### Karakter Utama (Pilihan Pemain):
1. **Falisha (Commando Kilat):** Cepat lincah, tembakan laser/peluru kilat.
2. **Arshad (Heavy Gunner):** Tahan banting, membawa bazooka / peluncur roket mini.

### NPC & Fitur Spesial:
- **Tawanan (Hostage) yang Diselamatkan:**
  - **Babah Nono:** Diikat dengan tali lucu, saat diselamatkan memberi senjata baru (*"HEAVY MACHINE GUN!"*).
  - **Ibu Pupu:** Memberi bekal makanan (tambah poin & HP).
- **Super Vehicle ("Metal Slug"):**
  - **Slug Tank / Baymax Mech:** Tank mini lucu yang bisa dinaiki pemain dengan meriam vulcan ganda dan tembakan meriam meriam bom raksasa!

---

## 3. Senjata & Power-Up (Ikonik Metal Slug)
- 🔫 **Handgun:** Senjata dasar peluru tak terbatas.
- 💥 **H - Heavy Machine Gun:** Suara ikonik *"HEAVY MACHINE GUN!"*, tembakan peluru cepat menyebar.
- 🚀 **R - Rocket Launcher:** Roket kendali yang mengejar musuh.
- 💣 **Granat / Bom Kaleng:** Dilempar parabolik menghasilkan ledakan kartun besar.
- 🛡️ **Shield / Barrier:** Pelindung sementara.

---

## 4. Musuh & Stage Progression
- **Musuh Reguler:** Robot mainan nakal, tentara kartun kocak yang kabur ketakutan saat ditembak.
- **Rintangan:** Helikopter baling-baling, menara pengawas, ranjau balon.
- **Boss Stage:**
  - **Boss Yanto Robo-Tank:** Tank raksasa dengan senjata cerobong "KERJAIN KUMON!" dan roket mainan!

---

## 5. Kontrol Khusus Tablet (Samsung Tab S8)
- **Kiri:** Virtual D-pad / Joystick (kiri, kanan, tembak ke atas, jongkok).
- **Kanan:**
  - 🔴 **FIRE (J):** Menembak (bisa tembak lurus atau ke atas).
  - 🟢 **JUMP (K):** Melompat ke platform.
  - 💣 **BOMB (L):** Melempar granat.
  - 🚗 **SLUG IN/OUT:** Masuk atau keluar dari tank tempur mini saat tersedia.

---

## 6. Tahapan Pengembangan
1. **Aset & Sprite Pixel Art:**
   - Karakter Falisha/Arshad commando dengan animasi lari, tembak 8 arah, lompat, lempar bom.
   - Tank Metal Slug mini bergaya pixel art retro.
   - Latar panggung hutan/pabrik militer retro bertingkat (multi-layer parallax scrolling).
2. **Core Engine:**
   - Fisika platformer (gravitasi, lompatan, pijakan platform, lereng).
   - Sistem proyektil senjata (handgun, heavy machine gun, rocket launcher).
   - Sistem kendaraan (naik tank Slug, tembakan kanon tank).
3. **Audio & Ikonik Voiceline Synth:**
   - Suara penyiar sintetis: *"MISSION 1... START!"*, *"HEAVY MACHINE GUN!"*, *"ROCKET LAUNCHER!"*, *"OK!"*, *"MISSION COMPLETE!"*.
4. **Integrasi Portal & Vercel:**
   - Tambahkan game ke daftar portal di `index.html` dan `portal/games.json`.
   - Push ke GitHub `bambangdev/falisha-universe` untuk auto-deploy di Vercel.
