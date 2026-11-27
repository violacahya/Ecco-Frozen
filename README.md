# Ecco Frozen — CRM, Portal Mitra & ERP Toko

Aplikasi **CRM + Portal Mitra + operasional toko** untuk bisnis distribusi **frozen food**, dibangun
dengan **Next.js (App Router) + TypeScript**. Data disimpan di **localStorage** browser sehingga
aplikasi dapat langsung dijalankan tanpa database atau server tambahan.

Tema studi kasus: **Ecco Frozen**, mitra bisnis distribusi makanan beku.

---

## ✨ Fitur

### CRM & Portal Mitra

| Fitur | Keterangan |
| --- | --- |
| **Login multi-user** | Autentikasi email + kata sandi dengan sesi tersimpan di browser. |
| **Hak akses berbasis peran** | `Admin` akses penuh; `Staff` kelola operasional tanpa hapus pelanggan & tanpa menu pengguna; `Pelanggan` hanya portal mitra. |
| **Portal mitra** | Pelanggan melihat ringkasan kemitraan, data perusahaan, dan riwayat pesanan sendiri. |
| **Pengajuan pesanan** | Pelanggan mengajukan pesanan pasokan; produk diambil langsung dari katalog Inventaris. |
| **Manajemen pesanan** | Cari, filter, dan ubah status pesanan (baru → diproses → dikirim → selesai). |
| **Manajemen pelanggan (CRUD)** | Tambah, cari, filter status/segmen, urutkan, edit, hapus, dan ekspor CSV. |
| **Harga khusus per pelanggan** | Harga borong per pelanggan yang diisi manual. Walk-in selalu harga normal. |

### Operasional Toko (ERP)

| Fitur | Keterangan |
| --- | --- |
| **Dashboard ERP** | Ringkasan omset hari ini, total omset, laba bersih, peringatan stok, pesanan mitra aktif, dan grafik penjualan 7 hari. |
| **Kasir (POS)** | Katalog produk, keranjang, pembayaran tunai/QRIS/transfer, kembalian, dan struk siap cetak. |
| **Inventaris & Stok** | CRUD produk, status stok (aman/menipis/habis), restock dengan harga beli, dan riwayat barang masuk. |
| **Pemasok (SCM)** | Data pemasok, kategori suplai, dan pesan restock langsung ke PIC via WhatsApp. |
| **Keuangan & Laba** | Pemasukan kasir, pengeluaran operasional, arus kas terpadu, dan laba bersih otomatis. |
| **Desain responsif** | Desktop, tablet, dan mobile dengan sidebar drawer. |

---

## 💰 Aturan Harga

| Sumber harga | Berlaku untuk | Diatur di |
| --- | --- | --- |
| **Harga normal** | Walk-in & pelanggan yang belum punya harga khusus | Inventaris → Edit Produk → Harga Jual |
| **Harga khusus** | Hanya pelanggan yang di-set | Pelanggan → ikon harga (🏷) |

Aturan penting:

- Harga khusus adalah **angka tetap** yang diisi manual, **tanpa diskon/persen**.
- Mengubah harga di **Inventaris** tidak mengubah harga khusus pelanggan.
- **Restock** dengan harga beli berbeda hanya menambah stok dan mencatat HPP; harga jual tidak berubah.
- Transaksi lama tetap memakai harga saat transaksi terjadi.
- Di kasir, memilih pelanggan langsung mengubah harga di kartu produk dan keranjang.
- Admin dan Staff sama-sama boleh mengatur harga khusus.

Detail rancangan: [`RANCANGAN-HARGA-KHUSUS-PELANGGAN.md`](./RANCANGAN-HARGA-KHUSUS-PELANGGAN.md)

---

## 🔑 Akun Demo

| Peran | Email | Kata Sandi | Hak Akses |
| --- | --- | --- | --- |
| Admin | `admin@eccocrm.id` | `admin123` | Akses penuh, kelola pengguna, pelanggan, pesanan |
| Staff | `staff@eccocrm.id` | `staff123` | Operasional toko (tanpa hapus pelanggan & menu pengguna) |
| Staff | `budi@eccocrm.id` | `budi123` | Sama seperti Staff |
| Pelanggan | `pelanggan@eccofrozen.id` | `pelanggan123` | Portal mitra — PT Sumber Beku Nusantara (distributor) |
| Pelanggan | `mitra@eccofrozen.id` | `mitra123` | Portal mitra — Resto Laut Nusantara (HoReCa) |

> Di halaman login tersedia tombol **Gunakan** pada kartu akun demo untuk mengisi kredensial otomatis.
> Akun pelanggan diarahkan ke `/portal`, akun tim ke dashboard.

---

## 🚀 Cara Menjalankan

Prasyarat: **Node.js 18.18+** (disarankan Node.js 20 atau 22).

```bash
# 1. Install dependensi
npm install

# 2. Jalankan server pengembangan
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Versi produksi:

```bash
npm run build
npm start
```

---

## 🗂️ Struktur Proyek

```
ecco-frozen/
├── app/
│   ├── layout.tsx                 # Root layout + provider (auth, data, toast)
│   ├── globals.css                # Seluruh styling aplikasi (design system)
│   ├── page.tsx                   # Dashboard ERP
│   ├── login/page.tsx             # Halaman login
│   ├── customers/page.tsx         # Manajemen pelanggan + harga khusus
│   ├── orders/page.tsx            # Manajemen pesanan & riwayat POS
│   ├── pos/page.tsx               # Kasir (POS)
│   ├── inventory/page.tsx         # Inventaris & stok
│   ├── suppliers/page.tsx         # Manajemen pemasok (SCM)
│   ├── finance/page.tsx           # Keuangan & laba
│   ├── users/page.tsx             # Manajemen pengguna (admin)
│   ├── portal/page.tsx            # Beranda portal mitra
│   ├── portal/orders/page.tsx     # Pesanan milik pelanggan
│   ├── not-found.tsx              # Halaman 404
│   └── icon.svg                   # Favicon
├── components/
│   ├── app-shell.tsx              # Sidebar, topbar, proteksi halaman
│   ├── customer-form-modal.tsx    # Form tambah/edit pelanggan
│   ├── customer-prices-modal.tsx  # Editor harga khusus pelanggan
│   ├── order-form-modal.tsx       # Form pengajuan pesanan mitra
│   ├── product-form-modal.tsx     # Form tambah/edit produk
│   ├── restock-modal.tsx          # Form barang masuk + harga beli
│   ├── expense-modal.tsx          # Form catat pengeluaran
│   ├── supplier-form-modal.tsx    # Form tambah/edit pemasok
│   ├── supplier-whatsapp-modal.tsx# Pesan restock via WhatsApp
│   ├── pos-cart.tsx               # Keranjang kasir
│   ├── pos-payment-modal.tsx      # Modal pembayaran
│   ├── pos-receipt-modal.tsx      # Struk transaksi
│   ├── ui.tsx                     # Modal, badge, avatar, empty state
│   ├── toast.tsx                  # Notifikasi
│   └── icons.tsx                  # Ikon SVG
├── lib/
│   ├── app-context.tsx            # State global + persistensi localStorage
│   ├── types.ts                   # Tipe & konstanta data
│   ├── seed.ts                    # Data demo awal
│   └── utils.ts                   # Format Rupiah, tanggal, WhatsApp, dll.
└── package.json
```

---

## 💾 Model Data & Penyimpanan

Data disimpan di `localStorage`:

| Kunci | Isi |
| --- | --- |
| `ecco_crm_users_v1` | Pengguna (`id`, `name`, `email`, `password`, `role`, `title`, `customerId?`, `createdAt`) |
| `ecco_crm_customers_v1` | Pelanggan (`id`, `name`, `company`, `email`, `phone`, `city`, `segment`, `status`, `value`, `notes`, `createdAt`, `updatedAt`) |
| `ecco_crm_customer_prices_v1` | Harga khusus (`id`, `customerId`, `productId`, `price`, `updatedAt`) |
| `ecco_crm_orders_v1` | Pesanan mitra (`id`, `customerId`, `product`, `quantity`, `notes`, `status`, `createdAt`, `updatedAt`) |
| `ecco_crm_products_v1` | Katalog produk (`id`, `sku`, `name`, `category`, `unit`, `price`, `minOrder`, `storageTemp`, `stock`, `badge`, `description`) |
| `ecco_crm_pos_orders_v1` | Transaksi kasir (`orderNumber`, `items[]`, `totalAmount`, `paymentMethod`, `cashPaid`, `change`, `cashierName`, …) |
| `ecco_crm_restock_log_v1` | Riwayat barang masuk (`productId`, `quantity`, `unitCost?`, `note`, `createdBy`, `createdAt`) |
| `ecco_crm_expenses_v1` | Pengeluaran (`category`, `amount`, `description`, `date`, `createdBy`) |
| `ecco_crm_suppliers_v1` | Pemasok (`name`, `contactPerson`, `phone`, `email?`, `address`, `suppliedCategories[]`, `notes?`) |
| `ecco_crm_session_v1` | Sesi login aktif (`userId`, `loginAt`) |
| `ecco_crm_demo_accounts_merged_v1` | Penanda bahwa akun demo pelanggan sudah pernah digabungkan (sekali saja) |

- Data demo awal otomatis dimuat saat aplikasi pertama kali dibuka.
- Akun demo pelanggan hanya ditambahkan **sekali** untuk data lama, sehingga penghapusan tetap tersimpan.
- Perubahan langsung tersimpan dan tetap ada setelah refresh.
- Data bersifat **per-browser/per-perangkat** (tidak tersinkron antar perangkat).

### Catatan keamanan

Aplikasi ini ditujukan untuk **demo akademik**. Kata sandi disimpan apa adanya di localStorage dan
autentikasi berjalan di sisi klien. Untuk produksi, gunakan backend, database, hashing kata sandi
(bcrypt/argon2), serta sesi berbasis server.

---

## 🧪 Skenario Pengujian

1. Buka `/login`, klik **Gunakan** pada akun Admin → **Masuk ke Dashboard**.
2. Tambahkan pelanggan lewat **Tambah Pelanggan** (kolom bertanda `*` wajib diisi).
3. Uji pencarian, filter status/segmen, dan ekspor CSV.
4. Buka **Pelanggan → ikon 🏷**, isi harga khusus beberapa produk, lalu simpan.
5. Buka **Kasir (POS)**: pilih pelanggan tersebut → harga di kartu produk dan keranjang langsung berubah.
6. Ganti ke **Walk-in** → harga kembali normal.
7. Ubah harga produk di **Inventaris** → harga walk-in berubah, harga khusus pelanggan tetap.
8. Catat **Restock** dengan harga beli → stok bertambah, harga jual tidak berubah.
9. Selesaikan transaksi kasir → struk menampilkan harga yang dipakai.
10. Masuk sebagai Staff → menu **Pengguna** hilang dan tombol hapus pelanggan nonaktif.
11. Masuk sebagai Pelanggan → ajukan pesanan di **Pesanan Saya**.
12. Masuk sebagai Admin → ubah status pesanan → cek perubahannya di portal pelanggan.
13. Klik **Atur Ulang Data** di halaman Pengguna untuk memulihkan data demo.

---

## 🛠️ Teknologi

- **Next.js 15** (App Router, React 19, TypeScript)
- **CSS murni** dengan design token (tanpa framework UI)
- **SVG native** untuk grafik (tanpa library chart)
- **localStorage** sebagai lapisan penyimpanan data

---

Dibuat untuk memenuhi tugas mata kuliah Sistem Informasi / Pengembangan Web.
