# Ecco CRM — Frozen Food Division

Aplikasi **CRM (Customer Relationship Management)** sederhana untuk tugas kuliah, dibangun dengan
**Next.js (App Router) + TypeScript**. Data pelanggan dan pengguna disimpan di **localStorage**
browser sehingga aplikasi dapat langsung dijalankan tanpa konfigurasi database atau server tambahan.

Tema studi kasus: **Ecco-Frozen**, bisnis distribusi makanan beku (frozen food).

---

## ✨ Fitur

| Fitur | Keterangan |
| --- | --- |
| **Login multi-user** | Autentikasi email + kata sandi dengan sesi tersimpan di browser. |
| **Hak akses berbasis peran** | `Admin` dapat mengelola pengguna dan menghapus pelanggan; `Staff` hanya dapat mengelola pelanggan. |
| **Dashboard & statistik** | Kartu ringkasan, grafik batang pelanggan baru 6 bulan, donut distribusi status, nilai per segmen, dan daftar pelanggan terbaru. |
| **Manajemen pelanggan (CRUD)** | Tambah, lihat, cari, filter, urutkan, edit, dan hapus data pelanggan. |
| **Pencarian & filter** | Cari berdasarkan nama/perusahaan/email/kota; filter status dan segmen; urutkan berdasarkan pembaruan, nama, atau nilai. |
| **Paginasi** | Daftar pelanggan dibagi 8 baris per halaman. |
| **Ekspor CSV** | Unduh hasil filter pelanggan ke file CSV (kompatibel dengan Excel). |
| **Manajemen pengguna** | Admin dapat menambah dan menghapus akun tim, serta melihat peran masing-masing. |
| **Reset data demo** | Mengembalikan seluruh data ke kondisi awal melalui menu **Pengguna → Keamanan & Data**. |
| **Desain responsif** | Tampilan desktop, tablet, dan mobile dengan sidebar drawer. |

---

## 🔑 Akun Demo

| Peran | Email | Kata Sandi | Hak Akses |
| --- | --- | --- | --- |
| Admin | `admin@eccocrm.id` | `admin123` | Akses penuh, kelola pengguna, hapus pelanggan |
| Staff | `staff@eccocrm.id` | `staff123` | Kelola data pelanggan (tanpa hapus & tanpa menu pengguna) |
| Staff | `budi@eccocrm.id` | `budi123` | Sama seperti Staff |

> Di halaman login tersedia tombol **Gunakan** pada kartu akun demo untuk mengisi kredensial otomatis.

---

## 🚀 Cara Menjalankan

Prasyarat: **Node.js 18.18+** (disarankan Node.js 20 atau 22).

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

Untuk membuat versi produksi:

```bash
npm run build
npm start
```

---

## 🗂️ Struktur Proyek

```
ecco-crm/
├── app/
│   ├── layout.tsx              # Root layout + provider (auth, data, toast)
│   ├── globals.css             # Seluruh styling aplikasi (design system)
│   ├── page.tsx                # Dashboard
│   ├── login/page.tsx          # Halaman login
│   ├── customers/page.tsx      # Manajemen pelanggan
│   ├── users/page.tsx          # Manajemen pengguna (admin)
│   └── icon.svg                # Favicon
├── components/
│   ├── app-shell.tsx           # Sidebar, topbar, proteksi halaman
│   ├── customer-form-modal.tsx # Form tambah/edit pelanggan
│   ├── charts.tsx              # Grafik batang & donut (SVG murni)
│   ├── ui.tsx                  # Modal, badge, avatar, empty state
│   ├── toast.tsx               # Notifikasi
│   └── icons.tsx               # Ikon SVG
├── lib/
│   ├── app-context.tsx         # State global + persistensi localStorage
│   ├── types.ts                # Tipe & konstanta data
│   ├── seed.ts                 # Data demo awal
│   └── utils.ts                # Format Rupiah, tanggal, inisial, dll.
└── package.json
```

---

## 💾 Model Data & Penyimpanan

Data disimpan di `localStorage` dengan tiga kunci:

| Kunci | Isi |
| --- | --- |
| `ecco_crm_users_v1` | Daftar pengguna (`id`, `name`, `email`, `password`, `role`, `title`, `createdAt`) |
| `ecco_crm_customers_v1` | Daftar pelanggan (`id`, `name`, `company`, `email`, `phone`, `city`, `segment`, `status`, `value`, `notes`, `createdAt`, `updatedAt`) |
| `ecco_crm_session_v1` | Sesi login aktif (`userId`, `loginAt`) |

- Data demo awal otomatis dimuat saat aplikasi pertama kali dibuka.
- Perubahan langsung tersimpan dan tetap ada setelah halaman di-refresh.
- Data bersifat **per-browser/per-perangkat** (tidak tersinkron antar perangkat).

### Catatan keamanan

Aplikasi ini ditujukan untuk **demo akademik**. Kata sandi disimpan apa adanya di localStorage dan
autentikasi berjalan di sisi klien. Untuk produksi, gunakan backend, database, hashing kata sandi
(bcrypt/argon2), serta sesi berbasis server.

---

## 🧪 Skenario Pengujian

1. Buka `/login`, klik **Gunakan** pada akun Admin → **Masuk ke Dashboard**.
2. Tambahkan pelanggan lewat tombol **Tambah Pelanggan** (semua kolom bertanda `*` wajib diisi).
3. Gunakan kolom pencarian dan filter status/segmen untuk menguji penyaringan data.
4. Edit data lewat ikon pensil, hapus lewat ikon tempat sampah (admin).
5. Coba **Ekspor CSV** dan buka hasilnya di Excel/Google Sheets.
6. Masuk sebagai Staff → menu **Pengguna** hilang dan tombol hapus pelanggan nonaktif.
7. Klik **Atur Ulang Data** di halaman Pengguna untuk memulihkan data demo.

---

## 🛠️ Teknologi

- **Next.js 15** (App Router, React 19, TypeScript)
- **CSS murni** dengan design token (tanpa framework UI)
- **SVG native** untuk grafik (tanpa library chart)
- **localStorage** sebagai lapisan penyimpanan data

---

Dibuat untuk memenuhi tugas mata kuliah Sistem Informasi / Pengembangan Web.
