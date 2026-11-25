# Ecco Frozen — CRM & Portal Mitra

Aplikasi **CRM (Customer Relationship Management) + Portal Mitra** untuk tugas kuliah, dibangun
dengan **Next.js (App Router) + TypeScript**. Data pelanggan, pengguna, dan pesanan disimpan di
**localStorage** browser sehingga aplikasi dapat langsung dijalankan tanpa konfigurasi database atau
server tambahan.

Tema studi kasus: **Ecco Frozen**, mitra bisnis distribusi makanan beku (frozen food).

---

## ✨ Fitur

| Fitur | Keterangan |
| --- | --- |
| **Login multi-user** | Autentikasi email + kata sandi dengan sesi tersimpan di browser. |
| **Hak akses berbasis peran** | `Admin` mengelola pengguna, pelanggan, dan pesanan; `Staff` mengelola pelanggan & pesanan; `Pelanggan` mengakses portal mitra. |
| **Portal mitra (pelanggan)** | Pelanggan dapat melihat ringkasan kemitraan, data perusahaan, serta riwayat pesanan mereka sendiri. |
| **Pengajuan pesanan** | Pelanggan mengajukan pesanan pasokan (produk + jumlah kg), lalu memantau statusnya. |
| **Manajemen pesanan tim** | Admin/staff melihat seluruh pesanan, mencari, memfilter, dan memperbarui status (baru → diproses → dikirim → selesai). |
| **Dashboard & statistik** | Kartu ringkasan, grafik batang pelanggan baru 6 bulan, donut distribusi status, nilai per segmen, dan daftar pelanggan terbaru. |
| **Manajemen pelanggan (CRUD)** | Tambah, lihat, cari, filter, urutkan, edit, dan hapus data pelanggan. |
| **Pencarian & filter** | Cari berdasarkan nama/perusahaan/email/kota; filter status dan segmen; urutkan berdasarkan pembaruan, nama, atau nilai. |
| **Paginasi** | Daftar pelanggan dibagi 8 baris per halaman. |
| **Ekspor CSV** | Unduh hasil filter pelanggan ke file CSV (kompatibel dengan Excel). |
| **Manajemen pengguna** | Admin dapat menambah & menghapus akun tim maupun akun portal pelanggan, serta menautkannya ke data pelanggan. |
| **Reset data demo** | Mengembalikan seluruh data ke kondisi awal melalui menu **Pengguna → Keamanan & Data**. |
| **Desain responsif** | Tampilan desktop, tablet, dan mobile dengan sidebar drawer. |

---

## 🔑 Akun Demo

| Peran | Email | Kata Sandi | Hak Akses |
| --- | --- | --- | --- |
| Admin | `admin@eccocrm.id` | `admin123` | Akses penuh, kelola pengguna, pelanggan, dan pesanan |
| Staff | `staff@eccocrm.id` | `staff123` | Kelola data pelanggan & pesanan (tanpa hapus pelanggan & tanpa menu pengguna) |
| Staff | `budi@eccocrm.id` | `budi123` | Sama seperti Staff |
| Pelanggan | `pelanggan@eccofrozen.id` | `pelanggan123` | Portal mitra — PT Sumber Beku Nusantara (distributor) |
| Pelanggan | `mitra@eccofrozen.id` | `mitra123` | Portal mitra — Resto Laut Nusantara (HoReCa) |

> Di halaman login tersedia tombol **Gunakan** pada kartu akun demo untuk mengisi kredensial otomatis.
> Akun pelanggan akan diarahkan ke `/portal`, sedangkan akun tim diarahkan ke dashboard.

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
ecco-frozen/
├── app/
│   ├── layout.tsx              # Root layout + provider (auth, data, toast)
│   ├── globals.css             # Seluruh styling aplikasi (design system)
│   ├── page.tsx                # Dashboard
│   ├── login/page.tsx          # Halaman login
│   ├── customers/page.tsx      # Manajemen pelanggan
│   ├── orders/page.tsx         # Manajemen pesanan (admin & staff)
│   ├── users/page.tsx          # Manajemen pengguna (admin)
│   ├── portal/page.tsx         # Beranda portal mitra (pelanggan)
│   ├── portal/orders/page.tsx  # Pesanan milik pelanggan
│   └── icon.svg                # Favicon
├── components/
│   ├── app-shell.tsx           # Sidebar, topbar, proteksi halaman
│   ├── customer-form-modal.tsx # Form tambah/edit pelanggan
│   ├── order-form-modal.tsx    # Form pengajuan pesanan mitra
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

Data disimpan di `localStorage` dengan empat kunci:

| Kunci | Isi |
| --- | --- |
| `ecco_crm_users_v1` | Daftar pengguna (`id`, `name`, `email`, `password`, `role`, `title`, `customerId?`, `createdAt`) |
| `ecco_crm_customers_v1` | Daftar pelanggan (`id`, `name`, `company`, `email`, `phone`, `city`, `segment`, `status`, `value`, `notes`, `createdAt`, `updatedAt`) |
| `ecco_crm_orders_v1` | Daftar pesanan (`id`, `customerId`, `product`, `quantity`, `notes`, `status`, `createdAt`, `updatedAt`) |
| `ecco_crm_session_v1` | Sesi login aktif (`userId`, `loginAt`) |

- Data demo awal otomatis dimuat saat aplikasi pertama kali dibuka.
- Akun demo pelanggan otomatis ditambahkan ke data lama yang sudah tersimpan di browser.
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
7. Masuk sebagai Pelanggan (`pelanggan@eccofrozen.id`) → buka **Pesanan Saya**, ajukan pesanan baru.
8. Masuk kembali sebagai Admin/Staff → buka **Pesanan**, ubah status pesanan, lalu cek perubahannya di portal pelanggan.
9. Klik **Atur Ulang Data** di halaman Pengguna untuk memulihkan data demo.

---

## 🛠️ Teknologi

- **Next.js 15** (App Router, React 19, TypeScript)
- **CSS murni** dengan design token (tanpa framework UI)
- **SVG native** untuk grafik (tanpa library chart)
- **localStorage** sebagai lapisan penyimpanan data

---

Dibuat untuk memenuhi tugas mata kuliah Sistem Informasi / Pengembangan Web.
