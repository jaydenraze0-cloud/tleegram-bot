# Sistem Autopilot Penuh: Siaran Otomatis Template Grafis Berita ke Telegram Tanpa Klik

Rencana implementasi ini dirancang khusus untuk mewujudkan sistem **Autopilot 100% Tanpa Klik (Zero-Click Automation)**. Begitu aplikasi dibuka, sistem langsung aktif bekerja di latar belakang: memantau berita terbaru Google News, mencari foto relevan dari internet/Google secara otomatis, merender kartu grafis berita sesuai template taktis (1080x1080), menyusun narasi, menyiarkannya langsung ke Telegram, dan menandai artikel agar tidak pernah terjadi *double post*.

---

### Ringkasan Pilihan & Kebutuhan Pengguna
- **Format Siaran Telegram**: **Gambar grafis template taktis** (kartu visual 1080x1080 lengkap dengan foto latar, judul taktis 2 baris dengan sorotan kontras, badge urgensi, watermark kanal) disertai narasi ringkasan dan tagar.
- **Pencarian Foto Otomatis**: Analisis otomatis entitas dan kata kunci berita (wilayah, alutsista, aktor) untuk memilih foto taktis beresolusi tinggi dari internet/Google secara instan tanpa perlu pemilihan manual.
- **Mode Operasi Autopilot**: **Langsung aktif otomatis di latar belakang saat aplikasi dibuka (Zero-Click)**, mengeksekusi siklus pengecekan dan siaran berita baru secara berkala tanpa membutuhkan klik manual dari pengguna.
- **Proteksi Anti-Double Post**: Deduplikasi permanen berbasis *hash* normalisasi; artikel yang sudah pernah diposting akan dilewati otomatis selamanya.

---

## 1. Arsitektur Alur Kerja Autopilot Penuh (Zero-Click Engine)

```
┌────────────────────────────────────────────────────────────────────────┐
│                   ALUR AUTOPILOT OTOMATIS (ZERO-CLICK)                 │
│                                                                        │
│  [Aplikasi Dibuka] ──► [Autopilot Engine Langsung Aktif Otomatis]      │
│                                     │                                  │
│                                     ▼                                  │
│                 [Penyegaran Berita Google News Realtime]               │
│                                     │                                  │
│                                     ▼                                  │
│           [Filter Anti-Double Post: Cek Hash Riwayat Siaran]           │
│             ├── Sudah Diposting? ──► LEWATI OTOMATIS                   │
│             └── Belum Diposting? ──► PROSES ARTIKEL BARU               │
│                                     │                                  │
│                                     ▼                                  │
│          [Pencarian Foto Google/Internet Relevan Sesuai Berita]        │
│          (Ekstraksi entitas alutsista, lokasi geografis & peristiwa)   │
│                                     │                                  │
│                                     ▼                                  │
│          [Render Otomatis Kartu Grafis Template Taktis (1080x1080)]    │
│          - Foto latar beresolusi tinggi                                │
│          - Judul taktis 2 baris seimbang + highlight box               │
│          - Badge tingkat urgensi & cap waktu                           │
│                                     │                                  │
│                                     ▼                                  │
│          [Sintesis Teks Caption & Tagar (Fallback Anti-Quota)]         │
│                                     │                                  │
│                                     ▼                                  │
│          [Eksekusi Kirim ke Bot API Telegram Secara Otomatis]          │
│          (Upload Foto Grafis Template + Caption Ringkasan)             │
│                                     │                                  │
│                                     ▼                                  │
│          [Tandai "POSTED" Permanen & Catat ke Broadcast Audit Log]     │
│                                     │                                  │
│                                     ▼                                  │
│          [Tidur Selama Interval (5 Menit) & Ulangi Otomatis]           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Perubahan dan Modifikasi yang Akan Diimplementasikan

### A. Autopilot Runtime Engine di Frontend (`src/App.tsx` & `src/components/AutopilotBar.tsx`)
- **Aktivasi Otomatis Saat Start**: Saat aplikasi dimuat, state `autopilotActive` otomatis bernilai `true` (tidak perlu menekan tombol apa pun).
- **Orkestrasi Tanpa Klik**:
  - Loop internal mengecek artikel teratas yang belum berstatus `isPosted`.
  - Otomatis memuat data artikel ke kanvas template taktis.
  - Otomatis memanggil resolver foto Google/internet untuk menyematkan gambar latar paling akurat.
  - Otomatis melakukan snapshot kanvas beresolusi 1080x1080 (`exportCanvasToPng`).
  - Mengirim foto grafis hasil render bersama teks caption ke endpoint `/api/telegram/post-photo`.
  - Menandai artikel sebagai `POSTED` di state lokal dan database server.
- **Indikator Visual Autopilot**: Banner status modern di bagian atas layar yang menunjukkan status:
  - *🟢 AUTOPILOT ACTIVE (Zero-Click Mode)*
  - Hitung mundur siklus berikutnya (misal: *Siaran berikutnya dalam 04:32*).
  - Status pemrosesan langsung (*Mencari foto... -> Merender template grafis... -> Menyiarkan ke Telegram...*).
  - Tombol darurat Jeda/Lanjutkan (*Pause/Resume*) jika pengguna ingin melakukan pratinjau manual.

### B. Otomatisasi Pencarian Foto Google/Internet Berbasis Entitas Berita (`server.ts`)
- Memperluas endpoint `/api/news/resolve-photos`:
  - Menganalisis kata kunci penting dalam judul & ringkasan (misal: *Israel, Iran, Ukraine, Russia, Red Sea, Taiwan, Houthi, F-35, Patriot missile, drone attack, warship, air defense*).
  - Mengambil foto berkualitas tinggi dari media enclosure RSS / OpenGraph gambar berita asli atau koleksi foto taktis beresolusi tinggi yang terverifikasi dan sesuai dengan entitas berita secara spesifik.
  - Menjamin foto selalu tersedia tanpa pernah menghasilkan kanvas kosong.

### C. Backend Automation Engine & Template Card Delivery (`server.ts`)
- Menyesuaikan `automationConfig` di backend:
  - Nilai default `autoPostEnabled: true` dan interval default `5` menit.
  - Memastikan endpoint `/api/telegram/post-photo` menangani pengiriman foto kartu grafis (data URL base64 atau binary PNG) ke Telegram Bot API (`sendPhoto`).
  - Melindungi sistem dari batas kuota Gemini (429): jika panggilan AI Gemini mencapai kuota, sistem beralih otomatis ke *High-Precision Local Tactical Synthesizer* tanpa error, sehingga proses pengiriman otomatis tetap berjalan lancar 100%.

### D. Pencegahan Posting Ganda Permanen (*Permanent Anti-Double Post*)
- Verifikasi ketat *hash* artikel (`getArticleHash`) sebelum memproses artikel mana pun.
- Artikel yang sudah dikirim ke Telegram otomatis diberi status `POSTED` dan dilewati pada seluruh siklus berikutnya.
- Riwayat siaran tersimpan secara persisten di server (`posted_hashes.json` dan `broadcast_logs.json`) agar status tetap terjaga meskipun aplikasi dimuat ulang (*refresh*).

---

## 3. Rencana Pengujian dan Verifikasi (Verification Plan)

1. **Uji Validasi Kode & Build**:
   - Jalankan `compile_applet` untuk memastikan seluruh komponen TypeScript, modul React, dan backend server bebas dari error build.
   - Jalankan `lint_applet` untuk memverifikasi kepatuhan sintaksis.
2. **Uji Alur Kerja Autopilot (Zero-Click Verification)**:
   - Pastikan saat halaman aplikasi dibuka, sistem langsung menampilkan status *Autopilot Aktif* tanpa interaksi pengguna.
   - Verifikasi penarikan artikel baru dari Google News secara otomatis.
   - Verifikasi pencocokan foto internet/Google berdasarkan topik berita.
   - Verifikasi perenderan grafis kartu template 1080x1080 dan proses pengiriman ke Telegram (atau mode simulasi jika token bot belum diisi).
   - Verifikasi bahwa artikel yang telah disiarkan langsung berstatus `POSTED` dan tidak pernah diposting ulang (Anti-Double Post).
3. **Uji Penanganan Error & Ketahanan Quota**:
   - Memastikan fallback lokal aktif mulus tanpa memicu error 429 atau menghentikan jadwal siaran.
