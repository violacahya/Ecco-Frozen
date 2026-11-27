"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import type { Customer } from "@/lib/types";
import { cn, formatIDR } from "@/lib/utils";
import { PriceTagIcon, SearchIcon } from "./icons";
import { Modal } from "./ui";

/**
 * Editor harga khusus (harga borong) satu pelanggan.
 *
 * Harga di sini adalah angka tetap yang diisi manual: tidak terpengaruh
 * perubahan harga katalog di Inventaris maupun harga beli saat restock.
 * Kolom kosong berarti produk memakai harga normal.
 */
export function CustomerPricesModal({
  open,
  customer,
  onClose,
  onSaved,
}: {
  open: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSaved: (count: number) => void;
}) {
  const { products, customerPrices, saveCustomerPrices } = useApp();
  const [values, setValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [onlyOverrides, setOnlyOverrides] = useState(false);

  useEffect(() => {
    if (!open || !customer) return;
    const initial: Record<string, string> = {};
    customerPrices
      .filter((entry) => entry.customerId === customer.id)
      .forEach((entry) => {
        initial[entry.productId] = String(entry.price);
      });
    setValues(initial);
    setSearch("");
    setOnlyOverrides(false);
  }, [open, customer, customerPrices]);

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !query ||
        `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query);
      const hasOverride = Boolean(values[product.id]);
      return matchesQuery && (!onlyOverrides || hasOverride);
    });
  }, [products, search, onlyOverrides, values]);

  const overrideCount = useMemo(
    () => Object.values(values).filter((value) => value !== "").length,
    [values],
  );

  const setValue = (productId: string, raw: string) => {
    const digits = raw.replace(/[^\d]/g, "");
    setValues((prev) => ({ ...prev, [productId]: digits }));
  };

  const handleSubmit = () => {
    if (!customer) return;
    const entries: Record<string, number | null> = {};
    Object.entries(values).forEach(([productId, value]) => {
      entries[productId] = value === "" ? null : Number(value);
    });
    saveCustomerPrices(customer.id, entries);
    onSaved(overrideCount);
  };

  return (
    <Modal
      open={open}
      size="lg"
      title="Daftar Harga Khusus"
      description={
        customer
          ? `${customer.name} · ${customer.company}. Harga di sini hanya berlaku untuk pelanggan ini.`
          : undefined
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Simpan Harga
          </button>
        </>
      }
    >
      {customer && (
        <div className="price-editor">
          <div className="price-editor-note">
            <span className="price-editor-note-icon">
              <PriceTagIcon size={17} />
            </span>
            <p>
              Kosongkan kolom untuk memakai <strong>harga normal</strong>. Mengubah harga di
              Inventaris atau mencatat restock tidak akan mengubah harga khusus di sini.
            </p>
          </div>

          <div className="price-editor-toolbar">
            <div className="search-box">
              <SearchIcon size={17} />
              <input
                type="search"
                placeholder="Cari produk atau SKU…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Cari produk untuk harga khusus"
              />
            </div>
            <label className="price-editor-filter">
              <input
                type="checkbox"
                checked={onlyOverrides}
                onChange={(event) => setOnlyOverrides(event.target.checked)}
              />
              Hanya yang punya harga khusus
            </label>
            <span className="panel-badge">{overrideCount} harga khusus</span>
          </div>

          {visibleProducts.length === 0 ? (
            <p className="price-editor-empty">
              Tidak ada produk yang cocok dengan pencarian Anda.
            </p>
          ) : (
            <div className="table-wrap price-editor-table">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th className="cell-right">Harga Normal</th>
                    <th className="cell-right">Harga Khusus</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProducts.map((product) => {
                    const value = values[product.id] ?? "";
                    const parsed = value === "" ? null : Number(value);
                    const belowNormal = parsed !== null && parsed > 0 && parsed > product.price;
                    return (
                      <tr key={product.id}>
                        <td>
                          <div className="inv-product-cell">
                            <strong>{product.name}</strong>
                            <small>
                              {product.sku} · per {product.unit}
                            </small>
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
                        <td className="cell-right cell-muted">
                          {formatIDR(product.price)}
                        </td>
                        <td className="cell-right">
                          <input
                            type="text"
                            inputMode="numeric"
                            className={cn(
                              "price-input",
                              parsed !== null && parsed > 0 && "price-input-active",
                              belowNormal && "price-input-warn",
                            )}
                            placeholder="Normal"
                            value={value}
                            onChange={(event) => setValue(product.id, event.target.value)}
                            aria-label={`Harga khusus ${product.name}`}
                          />
                          {belowNormal && (
                            <span className="price-input-hint">
                              Di atas harga normal
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="price-editor-foot">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setValues({})}
              disabled={overrideCount === 0}
            >
              Kosongkan Semua
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
