# Rancangan — Harga Khusus (Harga Borong) per Pelanggan

**Status:** ✅ Sudah diimplementasikan dan diuji
**Branch asal:** `b156433` (feature/dashboard-erp)
**Tanggal:** 27 November 2026

---

## 1. Ringkasan aturan

| Aturan | Perilaku |
| --- | --- |
| Walk-in | Selalu harga normal |
| Pelanggan di list | Pakai harga khusus jika di-set; kalau tidak → harga normal |
| Harga khusus | Angka tetap, diisi manual, **tanpa diskon/persen** |
| Siapa yang boleh ubah | **Admin dan Staff** |
| Ubah harga di Inventaris | Hanya mengubah harga normal. Harga khusus pelanggan **tidak tersentuh** |
| Restock dengan harga beli berbeda | Hanya menambah stok + catat harga beli. Harga jual normal & harga khusus **tidak tersentuh** |
| Transaksi lama | Tetap pakai harga saat transaksi |
| Pelanggan prioritas | ❌ Tidak dibuat |
| Label "Borong/Normal" di keranjang | ❌ Tidak dibuat |
| Perubahan harga langsung terlihat | ✅ Di kartu produk katalog kasir **dan** di keranjang |

---

## 2. Data

### Tabel baru `CustomerPrice`

localStorage key: `ecco_crm_customer_prices_v1`

```ts
export interface CustomerPrice {
  id: string;          // cpr_xxxxx
  customerId: string;
  productId: string;
  price: number;       // harga khusus, angka tetap
  updatedAt: string;
}
```

- Satu baris = satu harga khusus.
- **Tidak ada baris = ikut harga normal.** Tidak perlu mengisi semua produk.
- Unik per pasangan `customerId + productId`.
- Harga kosong / `0` = hapus baris (balik ke normal). Harga khusus minimal Rp 1.

### Perubahan tipe lain

```ts
export interface StockMovement {
  // ...field lama
  unitCost?: number;   // BARU: harga beli per unit, catatan HPP saja
}

export interface PosCartLine {
  product: FrozenProduct;
  qty: number;
  price: number;       // BARU: harga hasil resolve, snapshot di keranjang
}
```

`FrozenProduct` **tidak berubah**. `price` tetap satu-satunya harga normal.

---

## 3. Resolver harga (inti sistem)

Fungsi pusat di `lib/app-context.tsx`:

```ts
resolvePrice(product, customerId?)  // harga khusus ?? harga normal
saveCustomerPrices(customerId, entries)  // entries: Record<productId, number | null>
```

Di halaman kasir dipakai versi cepat (Map, O(1)):

```ts
const priceMap = useMemo(() => {
  const map = new Map<string, number>();
  if (!customerId) return map;              // Walk-in → harga normal
  customerPrices
    .filter((e) => e.customerId === customerId)
    .forEach((e) => map.set(e.productId, e.price));
  return map;
}, [customerPrices, customerId]);

const priceOf = (product) => priceMap.get(product.id) ?? product.price;
```

---

## 4. Perilaku Kasir (POS)

### Alur

1. Buka kasir → dropdown default **"Pelanggan Umum (Walk-in)"** → semua kartu produk tampil **harga normal**.
2. Pilih pelanggan → **saat itu juga**:
   - harga di **kartu produk katalog** berubah,
   - item yang sudah di keranjang **dihitung ulang**,
   - total tagihan menyesuaikan.
3. Ganti ke pelanggan lain → harga langsung ikut pelanggan baru.
4. Ganti balik ke Walk-in → semua kembali harga normal.

### Teknis

- `ProductCard` menerima `price` sebagai prop (tidak baca `product.price` langsung).
- Saat pelanggan berubah, seluruh baris keranjang di-resolve ulang:

```ts
useEffect(() => {
  setCart((prev) =>
    prev.map((line) => {
      const nextPrice = priceMap.get(line.product.id) ?? line.product.price;
      return nextPrice === line.price ? line : { ...line, price: nextPrice };
    }),
  );
}, [priceMap]);
```

- `pos-cart.tsx` memakai `line.price` untuk harga satuan dan subtotal.
- `createPosTransaction` menyimpan `items[].price = line.price` → struk & riwayat aman.

---

## 5. Tempat edit harga khusus

**Halaman Pelanggan → kolom Aksi → ikon harga (🏷)**

Posisi ikon: di antara pensil (edit) dan tempat sampah (hapus).
Ikon berwarna aksen bila pelanggan sudah punya harga khusus, dan tooltip menampilkan jumlahnya.

```
DL  Dewi Lestari    dewi@...   Jakarta   Distributor  Aktif   🏷  ✎  🗑
```

Klik ikon → modal **"Daftar Harga Khusus"**:

```
┌─ Daftar Harga Khusus ─────────────────────────────────────┐
│ Dewi Lestari · PT Sumber Beku Nusantara                   │
│ Harga ini hanya berlaku untuk pelanggan ini.              │
│ Kosongkan kolom = ikut harga normal.                      │
├───────────────────────────────────────────────────────────┤
│ [Cari produk atau SKU…]            [2 harga khusus]       │
│ ☐ Hanya yang punya harga khusus                           │
├───────────────────────────────────────────────────────────┤
│ Produk                  Normal       Harga Khusus         │
│ Fillet Ikan Dori        Rp 85.000    [ 78000        ]     │
│ Udang Kupas Beku        Rp 145.000   [ Normal       ]     │
│ Nugget Ayam Premium     Rp 32.000    [ 30000        ]     │
├───────────────────────────────────────────────────────────┤
│ [Kosongkan Semua]                    [Batal] [Simpan]     │
└───────────────────────────────────────────────────────────┘
```

Detail:

- Daftar semua produk dari katalog (nama, SKU, satuan, kategori, harga normal, input harga khusus).
- Hanya baris yang diisi yang disimpan. Baris kosong = hapus harga khusus produk itu.
- Input hanya angka, minimal Rp 1.
- Peringatan kecil bila harga khusus **di atas** harga normal.
- Tombol **Kosongkan Semua** untuk mengembalikan seluruh produk ke harga normal.
- Simpan hanya menyentuh `CustomerPrice` — tidak menyentuh `FrozenProduct.price`.
- Modal lebar (`size="lg"`), header tabel sticky, area tabel bisa di-scroll.

### Walk-in

Tidak muncul di halaman Pelanggan, jadi **tidak** diatur di modal ini.
Harga walk-in = harga normal, diubah di **Inventaris & Stok → Edit Produk → Harga Jual**.

---

## 6. Inventaris & Restock

### Edit produk (Inventaris)

- Hanya mengubah `FrozenProduct.price`.
- Tidak ada kode yang menyentuh `CustomerPrice`.
- Hasil: walk-in & pelanggan tanpa harga khusus pakai harga baru; pelanggan yang punya harga khusus tetap harga lamanya.

### Restock

Field baru di `restock-modal.tsx`:

```
Jumlah barang masuk *   [ 12 ]
Harga Beli / Unit (Rp)  [ 65000 ]   ← BARU, opsional
Catatan / Surat Jalan   [ SJ-2026-0098 ]
```

- Disimpan ke `StockMovement.unitCost`.
- Hanya menambah stok + catat riwayat. **Tidak** mengubah `product.price` dan **tidak** mengubah `CustomerPrice`.
- Riwayat Barang Masuk di Inventaris dapat kolom baru **"Harga Beli"**. Data lama tanpa `unitCost` tampil "—".

---

## 7. Penanganan kasus tepi

| Kasus | Perilaku |
| --- | --- |
| Pelanggan dihapus | Harga khusus pelanggan itu ikut terhapus (cascade) |
| Reset data demo | `CustomerPrice` dikosongkan |
| Data lama di browser | Key baru dibuat sebagai array kosong otomatis |
| Harga khusus > harga normal | Diizinkan, dengan peringatan "Di atas harga normal" |
| Produk baru ditambahkan | Otomatis muncul di modal harga khusus dengan input kosong |
| Pelanggan tanpa harga khusus | Semua produk pakai harga normal |

---

## 8. File yang tersentuh

| File | Perubahan |
| --- | --- |
| `lib/types.ts` | `CustomerPrice`, `unitCost` di `StockMovement`, `price` di `PosCartLine` |
| `lib/app-context.tsx` | key baru, state, persist, `resolvePrice`, `saveCustomerPrices`, cascade hapus, reset |
| `components/customer-prices-modal.tsx` | **file baru** — editor harga per pelanggan |
| `components/icons.tsx` | ikon `PriceTagIcon` |
| `app/customers/page.tsx` | ikon harga + state modal + jumlah harga khusus per pelanggan |
| `app/pos/page.tsx` | `priceMap`, `priceOf`, re-resolve keranjang saat ganti pelanggan |
| `components/pos-cart.tsx` | pakai `line.price` |
| `components/restock-modal.tsx` | input harga beli |
| `app/inventory/page.tsx` | kolom harga beli di riwayat |
| `components/ui.tsx` | varian modal `size="lg"` |
| `app/globals.css` | styling modal harga + responsif mobile |

Tidak ada dependency baru. `package.json` tidak berubah.

---

## 9. Hasil pengujian

| Skenario | Hasil |
| --- | --- |
| Walk-in, Fillet Dori | Rp 85.000 (normal) ✅ |
| Pilih Dewi (harga khusus 78.000) | Kartu produk & keranjang langsung Rp 78.000 ✅ |
| Ganti ke Andi (tanpa harga khusus) | Kembali Rp 85.000 ✅ |
| Ganti balik ke Walk-in | Rp 85.000 ✅ |
| Transaksi sebagai Dewi | Struk & riwayat menyimpan Rp 78.000 ✅ |
| Ubah harga katalog jadi 90.000 | Walk-in Rp 90.000, harga khusus Dewi tetap Rp 78.000 ✅ |
| Restock dengan harga beli 65.000 | Stok naik, riwayat mencatat 65.000, harga jual tidak berubah ✅ |
| Login sebagai Staff | Ikon harga tetap bisa dipakai ✅ |
| Kosongkan semua harga | Kembali ke harga normal ✅ |
| Hapus pelanggan | Harga khususnya ikut terhapus ✅ |
| Reset data demo | Harga khusus kosong, harga katalog pulih ✅ |
| Build & type check | `tsc --noEmit` bersih, `npm run build` sukses ✅ |

---

## 10. Yang sengaja tidak dibuat

- Pelanggan prioritas / filter pelanggan di kasir.
- Diskon persen atau tier harga.
- Riwayat perubahan harga (log harga naik/turun).
- Harga khusus untuk walk-in.
- Perubahan pada alur pesanan B2B.
