# 🏫 Spesifikasi Game ke-8: PETUALANGAN FALISHA DI MIMHa

RPG top-down (dilihat dari atas, ala Pokémon / Stardew Valley) tentang **satu hari sekolah Falisha** di **MIMHa – Madrasah Interaktif Miftahul Huda**, Jl. Cikadut, Mandalajati, Bandung Timur. Game ini ramah anak 6 tahun: tidak bisa kalah, tidak ada hitungan waktu yang menghukum, dan setiap misi memberi stiker atau bintang.

Alur kerja sama seperti Falisha Kart Turbo:
1. **Claude** menulis spesifikasi ini, [prompt sprite](08-falisha-sekolah-mimha-sprite-prompts.md), dan [rencana implementasi](../superpowers/plans/2026-10-09-falisha-sekolah-mimha.md).
2. **User** membuat sprite satu per satu lewat Gemini, lalu meng-upload hasilnya ke `games/falisha-sekolah/assets/raw/`.
3. **Claude** mengolah sprite dan menulis kode game.

## 1. Tokoh
| Tokoh | Sumber | Peran |
|---|---|---|
| **Falisha** | foto `assets/Photo/falisha.jpeg` | Pemain. Seragam madrasah: kemeja putih, rok panjang hijau tua, kerudung putih, tas ransel merah. |
| **Ibu Pupu** | foto `pupu.jpeg` | Di rumah, memberi bekal dan menerima salam pamit. |
| **Baymax** | foto `baymax.jpeg` | Mengantar Falisha jalan ke sekolah. |
| **Babah Nono** + **Arsyad** | foto `babah nono.jpeg`, `arsyad.jpeg` | Menjemput di gerbang saat pulang. |
| **Bu Guru Aisyah** | fiktif | Wali kelas, memberi misi Iqro, berhitung, dan doa. |
| **Pak Ustadz Hasan** | fiktif | Imam shalat dhuha di musala dan pengajar wudhu. |
| **Pak Satpam Dadang** | fiktif | Penjaga gerbang. |
| **Bu Kantin Euis** | fiktif | Penjual di kantin, mini-game uang. |
| **Teman: Rafi, Nisa, Zahra, Fikri** | fiktif | Teman sekelas. Rafi kehilangan pensil warna, Nisa dan Zahra mengajak lompat tali, Fikri teman piket. |

Guru dan teman **sengaja fiktif**, tidak memakai foto orang asli.

## 2. Peta (7 adegan, masing-masing satu layar 16:9 tanpa scroll)
| id | Adegan | Jalan keluar |
|---|---|---|
| `rumah` | Kamar dan ruang tengah rumah Falisha | Pintu bawah → `jalan` |
| `jalan` | Jalan Cikadut pagi hari: trotoar, warung, pohon | Kiri → `rumah`, kanan → `gerbang` |
| `gerbang` | Gerbang dan halaman depan MIMHa, tiang bendera | Kiri → `jalan`, pintu gedung atas-kiri → `kelas`, atas-kanan → `musala`, kanan → `lapangan` |
| `lapangan` | Lapangan bermain dan kebun kecil | Kiri → `gerbang`, pintu atas → `kantin` |
| `kelas` | Ruang kelas: papan tulis, meja-kursi, rak buku, tempat sampah | Pintu bawah → `gerbang` |
| `musala` | Musala dan tempat wudhu (keran di sisi kiri) | Pintu bawah → `gerbang` |
| `kantin` | Kantin dengan etalase jajanan, meja makan | Pintu bawah → `lapangan` |

Tembok dan objek yang tidak bisa dilewati ditulis sebagai daftar persegi di `js/world/maps.js`. Datanya diukur dari gambar latar yang sudah jadi, dibantu mode `?debug=1` yang menggambar kotak tabrakan di atas peta.

## 3. Alur Satu Hari (14 langkah berurutan)
Objektif aktif selalu tampil di HUD, misalnya "🎒 Ambil tas & botol minum".
| # | id | Objektif | Tempat | Selesai jika |
|---|---|---|---|---|
| 1 | `siap` | Ambil tas & botol minum | rumah | Kedua barang dipungut |
| 2 | `pamit` | Salam pamit ke Ibu Pupu | rumah | Bicara dengan Ibu Pupu → dialog "Assalamu'alaikum" |
| 3 | `berangkat` | Jalan ke sekolah bersama Baymax | jalan → gerbang | Masuk peta `gerbang` (Baymax berjalan mengikuti) |
| 4 | `salam_guru` | Salam ke Bu Guru Aisyah | gerbang | Bicara dengan Bu Guru |
| 5 | `wudhu` | Wudhu di musala | musala | Mini-game **Wudhu** selesai |
| 6 | `dhuha` | Shalat dhuha berjamaah | musala | Mini-game **Dhuha** selesai |
| 7 | `iqro` | Belajar huruf hijaiyah | kelas | Mini-game **Hijaiyah** selesai |
| 8 | `hitung` | Berhitung bersama Bu Guru | kelas | Mini-game **Berhitung** selesai |
| 9 | `doa` | Hafalan doa sebelum makan | kelas | Mini-game **Susun Doa** selesai |
| 10 | `jajan` | Istirahat: jajan di kantin | kantin | Mini-game **Kantin** selesai |
| 11 | `lompat_tali` | Main lompat tali dengan Nisa & Zahra | lapangan | Mini-game **Lompat Tali** selesai |
| 12 | `pensil` | Cari 5 pensil warna Rafi | semua peta sekolah | 5 pensil dipungut lalu diberikan ke Rafi |
| 13 | `piket` | Piket: buang 8 sampah ke tempat sampah | kelas + gerbang + lapangan | 8 sampah dipungut lalu dibuang ke tempat sampah mana pun |
| 14 | `pulang` | Pulang, dijemput Babah Nono & Arsyad | gerbang | Bicara dengan Babah Nono → layar **Rapor Hari Ini** |

Aturan alur:
* Bicara dengan NPC sebelum gilirannya → NPC memberi **petunjuk** ke objektif aktif, tidak mengubah state.
* Pintu tidak pernah dikunci. Anak bebas menjelajah; HUD menunjuk tujuan dengan ikon panah kecil di tepi layar.
* Mini-game bisa diulang dari peta. Bintang terbaik disimpan.

## 4. Mini-game (7)
Semuanya tanpa kalah. Salah → coba lagi dengan petunjuk. Bintang: 3 = tanpa salah, 2 = 1–2 salah, 1 = >2 salah.
| id | Nama | Cara main | Detail |
|---|---|---|---|
| `wudhu` | Urutan Wudhu | Ketuk kartu gambar langkah wudhu dalam urutan benar | 8 langkah: cuci tangan → kumur → hidung → wajah → tangan sampai siku → kepala → telinga → kaki. Kartu dari sheet `wudhu.png`. |
| `dhuha` | Ikuti Imam | Pak Ustadz menunjukkan gerakan, Falisha menekan gerakan yang sama | Urutan 2 rakaat: berdiri → rukuk → i'tidal (berdiri) → sujud → duduk → sujud → berdiri … → salam. 4 pilihan tombol pose. |
| `iqro` | Huruf Hijaiyah | Dengar/lihat nama huruf, ketuk huruf yang benar dari 4 pilihan | 10 ronde dari 28 huruf (ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن و ه ي), font **Noto Naskh Arabic**. |
| `hitung` | Berhitung Apel | Hitung benda/soal, ketuk jawaban dari 3 pilihan | 10 soal: penjumlahan & pengurangan hasil 0–20, digambar dengan apel. |
| `doa` | Susun Doa | Ketuk potongan kata doa sesuai urutan | Doa sebelum makan: "Allahumma / baarik lanaa / fiimaa razaqtanaa / wa qinaa / 'adzaaban naar". 2 ronde (+ doa keluar rumah: "Bismillaahi / tawakkaltu / 'alallaahi / laa haula / wa laa quwwata / illaa billaah"). |
| `jajan` | Belanja di Kantin | Pilih jajanan, bayar dengan koin pas | Harga: roti 2.000, susu 3.000, pisang 1.000, risol 2.000. Dompet berisi uang 500, 1.000, 2.000 (jumlahnya tak terbatas). 3 pesanan: pisang, roti, susu. Bayar harus **pas**: kurang → "uangnya kurang", lebih → "kembaliannya kebanyakan, coba pas ya". |
| `lompat_tali` | Lompat Tali | Tekan LOMPAT saat tali di bawah kaki | 20 lompatan, tempo naik pelan. Penilaian: pas (±0,18 dtk) / terlalu cepat / terlalu lambat. Tersangkut → tali berhenti sebentar lalu lanjut. |

## 5. Kontrol
* **Tablet:** joystick virtual di kiri (4 arah + diagonal), tombol **A** (bicara/ambil/aksi) dan **☰** (menu) di kanan. Di dalam mini-game cukup ketuk layar.
* **Keyboard:** panah/WASD untuk jalan, Spasi/Enter/J untuk aksi, Esc untuk menu, M untuk suara.

## 6. Tampilan & Suara
* Canvas 960×540, latar peta 16:9 dari Gemini digambar penuh layar. Karakter digambar sekitar 64 px tinggi. Urutan gambar berdasarkan posisi Y supaya bisa lewat di depan atau belakang objek.
* Kotak dialog di bawah layar berisi potret tokoh, nama, dan teks yang muncul huruf demi huruf.
* Musik chiptune pakai `shared/audio.js`: lagu pagi (rumah/jalan), sekolah, mini-game, dan penutup.

## 7. Simpanan
`localStorage` dengan kunci `fsm_save` berisi langkah aktif, barang, bintang per mini-game, dan stiker. Tombol **Main Baru** di menu menghapusnya. Data rusak dianggap simpanan kosong.

## 8. Di Luar Lingkup v1
Banyak hari/minggu, kostum, multi-pemain, suara rekaman.
