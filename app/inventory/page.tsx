"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ProductFormModal } from "@/components/product-form-modal";
import { RestockModal } from "@/components/restock-modal";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import {
  PRODUCT_CATEGORIES,
  type FrozenProduct,
  type ProductCategory,
} from "@/lib/types";
import { cn, formatIDR } from "@/lib/utils";
import {
  AlertIcon,
  BoxIcon,
  CheckCircleIcon,
  EditIcon,
  PackageIcon,
  PlusIcon,
  SearchIcon,
  SnowflakeIcon,
} from "@/components/icons";

/** Ambang batas stok aman: di bawah ini produk dianggap perlu restock. */
const LOW_STOCK_THRESHOLD = 10;

type StockFilter = "Semua" | "Menipis" | "Habis" | ProductCategory;

const FILTERS: StockFilter[] = [
  "Semua",
  "Menipis",
  "Habis",
  ...PRODUCT_CATEGORIES,
];

const FILTER_LABEL: Record<StockFilter, string> = {
  Semua: "Semua",
  Menipis: "Stok Menipis",
  Habis: "Habis",
  Seafood: "Seafood",
  Daging: "Daging",
  Olahan: "Olahan",
  Sayur: "Sayur",
};

type StockLevel = "ok" | "low" | "out";

const STOCK_LABEL: Record<StockLevel, string> = {
  ok: "Aman",
  low: "Menipis",
  out: "Habis",
};

function stockLevel(stock: number): StockLevel {
  if (stock <= 0) return "out";
  if (stock < LOW_STOCK_THRESHOLD) return "low";
  return "ok";
}

function formatMovementTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InventoryPage() {
  const { products, restockLog } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StockFilter>("Semua");
  const [restockTarget, setRestockTarget] = useState<FrozenProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FrozenProduct | null>(null);

  const stats = useMemo(() => {
    const total = products.length;
    const totalUnits = products.reduce((sum, product) => sum + product.stock, 0);
    const safe = products.filter(
      (product) => product.stock >= LOW_STOCK_THRESHOLD,
    ).length;
    const low = products.filter(
      (product) => product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD,
    ).length;
    const out = products.filter((product) => product.stock === 0).length;
    return { total, totalUnits, safe, low, out };
  }, [products]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !query || `${product.name} ${product.sku}`.toLowerCase().includes(query);
      const matchesFilter =
        filter === "Semua"
          ? true
          : filter === "Menipis"
            ? product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD
            : filter === "Habis"
              ? product.stock === 0
              : product.category === filter;

      return matchesQuery && matchesFilter;
    });
  }, [products, search, filter]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (product: FrozenProduct) => {
    setEditing(product);
    setFormOpen(true);
  };

  return (
    <AppShell
      title="Inventaris & Stok"
      subtitle="Pantau stok freezer, catat barang masuk, dan pastikan stok kasir selalu akurat."
      actions={
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <PlusIcon size={18} />
          Tambah Produk Baru
        </button>
      }
    >
      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <PackageIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">Katalog aktif</span>
          </div>
          <p className="stat-label">Total Varian Produk</p>
          <p className="stat-value">{stats.total}</p>
          <p className="stat-foot">
            {stats.totalUnits} unit tersimpan di freezer
          </p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <CheckCircleIcon size={20} />
            </span>
            <span className="stat-chip">≥ {LOW_STOCK_THRESHOLD} unit</span>
          </div>
          <p className="stat-label">Stok Aman</p>
          <p className="stat-value">{stats.safe}</p>
          <p className="stat-foot">Tidak perlu restock dalam waktu dekat</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-orange">
              <AlertIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-warm">Perlu restock</span>
          </div>
          <p className="stat-label">Stok Menipis</p>
          <p className="stat-value">{stats.low}</p>
          <p className="stat-foot">Sisa 1–{LOW_STOCK_THRESHOLD - 1} unit</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-purple">
              <BoxIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-red">Segera isi ulang</span>
          </div>
          <p className="stat-label">Stok Habis</p>
          <p className="stat-value">{stats.out}</p>
          <p className="stat-foot">Tidak bisa dijual di kasir</p>
        </article>
      </section>

      <section className="panel panel-table">
        <div className="inv-toolbar">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="search"
              placeholder="Cari nama produk atau SKU…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari produk berdasarkan nama atau SKU"
            />
          </div>

          <div className="pos-tabs" role="tablist" aria-label="Filter stok produk">
            {FILTERS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={filter === tab}
                className={cn("pos-tab", filter === tab && "pos-tab-active")}
                onClick={() => setFilter(tab)}
              >
                {FILTER_LABEL[tab]}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BoxIcon size={26} />}
            title="Produk tidak ditemukan"
            description="Coba kata kunci lain atau pilih filter stok/kategori yang berbeda."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table data-table-lg">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Nama Produk</th>
                    <th>Kategori</th>
                    <th>Suhu Simpan</th>
                    <th className="cell-right">Harga Jual</th>
                    <th className="cell-right">Stok Fisik</th>
                    <th>Status</th>
                    <th className="cell-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((product) => {
                    const level = stockLevel(product.stock);
                    return (
                      <tr key={product.id}>
                        <td>
                          <span className="inv-sku">{product.sku}</span>
                        </td>
                        <td>
                          <div className="inv-product-cell">
                            <strong>{product.name}</strong>
                            <small>{product.description || "Tanpa deskripsi"}</small>
                          </div>
                        </td>
                        <td>
                          <span
                            className={cn(
                              "inv-cat",
                              `inv-cat-${product.category.toLowerCase()}`,
                            )}
                          >
                            {product.category}
                          </span>
                        </td>
                        <td>
                          <span className="inv-temp">
                            <SnowflakeIcon size={12} />
                            {product.storageTemp}
                          </span>
                        </td>
                        <td className="cell-right cell-strong">
                          {formatIDR(product.price)}
                        </td>
                        <td className="cell-right">
                          <span className={cn("inv-stock", `inv-stock-${level}`)}>
                            {product.stock} <small>{product.unit}</small>
                          </span>
                        </td>
                        <td>
                          <span className={cn("badge", `stock-badge-${level}`)}>
                            {STOCK_LABEL[level]}
                          </span>
                        </td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="inv-restock-btn"
                              title={`Catat barang masuk untuk ${product.name}`}
                              onClick={() => setRestockTarget(product)}
                            >
                              <PlusIcon size={14} />
                              Restock
                            </button>
                            <button
                              type="button"
                              className="icon-button"
                              title="Edit produk"
                              aria-label={`Edit ${product.name}`}
                              onClick={() => openEdit(product)}
                            >
                              <EditIcon size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p className="table-info">
                Menampilkan {filtered.length} dari {products.length} produk
              </p>
            </div>
          </>
        )}
      </section>

      {restockLog.length > 0 && (
        <section className="panel inv-history">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Riwayat Barang Masuk</h3>
              <p className="panel-subtitle">
                Catatan restock terakhir agar stok freezer mudah diaudit.
              </p>
            </div>
            <span className="panel-badge">{restockLog.length} catatan</span>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Produk</th>
                  <th className="cell-right">Jumlah</th>
                  <th className="cell-right">Harga Beli</th>
                  <th>Catatan / Surat Jalan</th>
                  <th>Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody>
                {restockLog.slice(0, 6).map((movement) => (
                  <tr key={movement.id}>
                    <td className="cell-muted">
                      {formatMovementTime(movement.createdAt)}
                    </td>
                    <td>
                      <div className="inv-product-cell">
                        <strong>{movement.productName}</strong>
                        <small>{movement.sku}</small>
                      </div>
                    </td>
                    <td className="cell-right cell-strong">+{movement.quantity}</td>
                    <td className="cell-right cell-muted">
                      {movement.unitCost ? formatIDR(movement.unitCost) : "—"}
                    </td>
                    <td className="inv-history-note">{movement.note || "—"}</td>
                    <td className="cell-muted">{movement.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <RestockModal
        open={Boolean(restockTarget)}
        product={restockTarget}
        onClose={() => setRestockTarget(null)}
        onSaved={(product, quantity, newStock) => {
          setRestockTarget(null);
          toast(
            `${quantity} ${product.unit} ${product.name} berhasil ditambahkan. Stok kini ${newStock} ${product.unit}.`,
          );
        }}
      />

      <ProductFormModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(name, isEdit) => {
          setFormOpen(false);
          toast(
            isEdit
              ? `Produk "${name}" berhasil diperbarui.`
              : `Produk "${name}" berhasil ditambahkan.`,
          );
        }}
      />
    </AppShell>
  );
}
