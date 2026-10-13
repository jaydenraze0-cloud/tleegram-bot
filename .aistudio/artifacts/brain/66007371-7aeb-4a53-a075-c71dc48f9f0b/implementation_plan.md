# Rencana Implementasi: Penyederhanaan Antarmuka & Mode Bertahap (Clean Step-by-Step Flow)

Pengguna menyampaikan bahwa antarmuka saat ini membuat pusing karena terlalu banyak tombol kontrol, indikator hitung mundur yang bertumpuk, dan tampilan 3-kolom yang terlalu padat. Berdasarkan jawaban klarifikasi pengguna, aplikasi akan disederhanakan secara menyeluruh.

---

## 1. Analisis & Masalah Saat Ini
* **Overcrowded UI & Button Clutter:** Terdapat terlalu banyak tombol kecil (Stop Sync, Pause, Resume, Segarkan, Autopilot Jeda, Website RSS, dll.) yang tersebar di header, bilah perintah, dan radar, sehingga membingungkan pengguna.
* **Tampilan 3-Kolom Bersamaan:** Memaksa pengguna memproses Radar Berita, Canvas 1080p, dan AI Captions sekaligus dalam satu layar sempit.
* **Kebutuhan Pengguna:** 
  1. Menghilangkan tumpukan tombol & indikator timer yang berlebihan.
  2. Mengubah antarmuka menjadi **Mode Bertahap Sederhana: [1. Pilih Berita] → [2. Edit Desain] → [3. Siarkan]**.
  3. Menyediakan **Satu Saklar Master ON/OFF Utama** di bagian atas untuk mengendalikan seluruh sistem.

---

## 2. Solusi Desain & Alur Pengguna (User Flow)

### A. Navigasi Bertahap (3-Step Guided Wizard)
Layar utama akan berfokus pada satu tahapan aktif secara bergantian dengan bilah progres yang bersih di bagian atas:
1. **Langkah 1: Radar Berita (Intel Feed)**
   - Daftar 15 berita perang terbaru (Ukraina, Timur Tengah, Yaman, Trump, Putin, Iran) yang lapang, mudah dibaca, dan tidak berdesakan.
   - Tombol klik langsung pada berita dengan aksi jelas: **"Pilih Berita & Lanjut Desain →"**.
   - Kolom pencarian Google News & filter kategori tetap tersedia namun disajikan bersih tanpa tombol-tombol timer kecil.
2. **Langkah 2: Studio Kartu Grafis (1080x1080 Canvas)**
   - Fokus penuh pada pratinjau kartu gambar taktis.
   - Pilihan headline alternatif & foto resolusi tinggi dengan tombol sederhana: **"Ganti Foto"** dan **"Lanjut ke Siaran →"**.
3. **Langkah 3: Tinjauan Siaran & Telegram**
   - Tinjauan narasi caption dan tombol utama: **"Kirim ke Channel Telegram Sekarang"**.
   - Indikator status channel (@Channel ID) dan log siaran terakhir.
*(Opsional: Pengguna tetap dapat beralih ke "Mode 3-Kolom Studio" melalui opsi tata letak jika diinginkan).*

### B. Satu Saklar Master ON / OFF Tunggal (Zero Clutter)
* Menghapus semua tombol stop terpisah (Stop Sync di banner, tombol badge, dsb.).
* Menyediakan **Satu Saklar Master Tunggal** di pojok kanan Header:
  * **[ 🟢 SISTEM BERJALAN (1 Menit) ]**: Seluruh proses refresh berita otomatis dan autopilot berjalan tenang setiap 1 menit di latar belakang.
  * **[ ⏸ SISTEM DIHENTIKAN (OFF) ]**: Seluruh proses refresh dan siaran berhenti seketika. Tidak ada angka hitung mundur yang berkedip-kedip membuat pusing.
* Menampilkan status sistem secara tenang dan elegan (misal: `"Pembaruan berikutnya dalam 45s"` atau `"Sistem dihentikan"`).

---

## 3. Rencana Perubahan Teknis

### 1. Komponen `src/components/Header.tsx`
* Sederhanakan header:
  * Hapus tombol-tombol kecil yang menumpuk.
  * Pasang **Master Switch ON/OFF** yang tegas dan elegan.
  * Pasang indikator langkah: `1. Pilih Berita` · `2. Edit Desain` · `3. Siaran Telegram`.
  * Simpan tombol konfigurasi Bot & Website RSS dalam menu pengaturan/modal yang rapi.

### 2. Komponen `src/App.tsx`
* Ubah tata letak default `activeView` menjadi alur bertahap:
  * `step === 'radar'` (Langkah 1: Radar Berita)
  * `step === 'editor'` (Langkah 2: Desain Kartu)
  * `step === 'broadcast'` (Langkah 3: Siaran Telegram)
* Sediakan tombol aksi transisi antar-langkah di bagian bawah:
  * Dari Radar: Klik berita langsung berpindah ke Editor.
  * Dari Editor: Tombol **"Lanjut ke Siaran →"** dan tombol **"← Ganti Berita"**.
  * Dari Siaran: Tombol **"Kirim ke Telegram"** dan tombol **"Selesai / Berita Berikutnya"**.
* Hilangkan *Command Banner* ganda yang memenuhi layar.

### 3. Komponen `src/components/IntelligenceRadar.tsx`
* Hapus banner hitung mundur yang penuh dengan teks merah/kuning dan tombol tumpukan.
* Tampilkan kartu berita dengan tipografi bersih, spasi yang lega, dan tombol aksi satu-klik: **"Pilih & Buat Kartu"**.

---

## 4. Kriteria Keberhasilan (Verification & Acceptance)
1. Antarmuka tidak lagi membingungkan atau membuat pusing; pengguna dapat menyelesaikan tugas dari berita hingga siaran dalam 3 langkah mudah.
2. Hanya ada **Satu Saklar ON/OFF Utama** yang mengendalikan seluruh sistem.
3. Siklus refresh 1 menit tetap berjalan di latar belakang tanpa mengganggu kenyamanan pengguna.
4. Kompilasi TypeScript sukses (`npm run build`) tanpa error.
