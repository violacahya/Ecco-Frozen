"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/lib/app-context";
import {
  PRODUCT_CATEGORIES,
  type FrozenProduct,
  type ProductCategory,
  type ProductInput,
} from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { Modal } from "./ui";

const EMPTY = {
  sku: "",
  name: "",
  category: "Olahan" as ProductCategory,
  unit: "pack",
  price: 0,
  minOrder: 1,
  storageTemp: "-18 °C",
  stock: 0,
  badge: "",
  description: "",
};

type FormState = typeof EMPTY;
type Errors = Partial<Record<keyof FormState, string>>;

export function ProductFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: FrozenProduct | null;
  onClose: () => void;
  onSaved: (name: string, isEdit: boolean) => void;
}) {
  const { products, addProduct, updateProduct } = useApp();
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<Errors>({});
  const [priceText, setPriceText] = useState("");
  const [stockText, setStockText] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        sku: initial.sku,
        name: initial.name,
        category: initial.category,
        unit: initial.unit,
        price: initial.price,
        minOrder: initial.minOrder,
        storageTemp: initial.storageTemp,
        stock: initial.stock,
        badge: initial.badge,
        description: initial.description,
      });
      setPriceText(String(initial.price));
      setStockText(String(initial.stock));
    } else {
      setForm({ ...EMPTY });
      setPriceText("");
      setStockText("");
    }
    setErrors({});
  }, [open, initial]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    const sku = form.sku.trim();
    const name = form.name.trim();

    if (!sku) {
      next.sku = "SKU wajib diisi.";
    } else if (
      products.some(
        (product) =>
          product.sku.toLowerCase() === sku.toLowerCase() && product.id !== initial?.id,
      )
    ) {
      next.sku = "SKU ini sudah dipakai produk lain.";
    }
    if (!name) next.name = "Nama produk wajib diisi.";
    if (!form.unit.trim()) next.unit = "Satuan wajib diisi.";
    if (!form.storageTemp.trim()) next.storageTemp = "Suhu simpan wajib diisi.";
    if (form.price <= 0) next.price = "Harga jual harus lebih dari 0.";
    if (form.stock < 0) next.stock = "Stok tidak boleh negatif.";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: ProductInput = {
      ...form,
      sku: form.sku.trim(),
      name: form.name.trim(),
      unit: form.unit.trim(),
      storageTemp: form.storageTemp.trim(),
      badge: form.badge.trim(),
      description: form.description.trim(),
    };

    if (initial) {
      updateProduct(initial.id, payload);
      onSaved(payload.name, true);
    } else {
      addProduct(payload);
      onSaved(payload.name, false);
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit Produk" : "Tambah Produk Baru"}
      description={
        initial
          ? "Perbarui harga jual, nama, atau informasi produk lainnya."
          : "Daftarkan varian frozen food baru agar bisa dijual di kasir."
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="product-form" className="btn btn-primary">
            {initial ? "Simpan Perubahan" : "Tambah Produk"}
          </button>
        </>
      }
    >
      <form id="product-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="pf-sku">SKU *</label>
          <input
            id="pf-sku"
            type="text"
            placeholder="Contoh: OLH-NGT-01"
            value={form.sku}
            onChange={(event) => setField("sku", event.target.value)}
            className={errors.sku ? "input-error" : ""}
          />
          {errors.sku && <span className="field-error">{errors.sku}</span>}
        </div>

        <div className="field">
          <label htmlFor="pf-name">Nama Produk *</label>
          <input
            id="pf-name"
            type="text"
            placeholder="Contoh: Nugget Ayam Premium"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="pf-category">Kategori *</label>
          <select
            id="pf-category"
            value={form.category}
            onChange={(event) => setField("category", event.target.value as ProductCategory)}
          >
            {PRODUCT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="pf-unit">Satuan *</label>
          <input
            id="pf-unit"
            type="text"
            placeholder="Contoh: Pack 500g atau Karton 10 kg"
            value={form.unit}
            onChange={(event) => setField("unit", event.target.value)}
            className={errors.unit ? "input-error" : ""}
          />
          {errors.unit && <span className="field-error">{errors.unit}</span>}
        </div>

        <div className="field">
          <label htmlFor="pf-price">Harga Jual (Rp) *</label>
          <input
            id="pf-price"
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 45000"
            value={priceText}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d]/g, "");
              setPriceText(raw);
              setField("price", raw ? Number(raw) : 0);
            }}
            className={errors.price ? "input-error" : ""}
          />
          <span className="field-hint">
            {form.price > 0 ? formatIDR(form.price) : "Masukkan angka tanpa titik atau koma."}
          </span>
          {errors.price && <span className="field-error">{errors.price}</span>}
        </div>

        <div className="field">
          <label htmlFor="pf-temp">Suhu Simpan *</label>
          <input
            id="pf-temp"
            type="text"
            placeholder='Contoh: -18 °C'
            value={form.storageTemp}
            onChange={(event) => setField("storageTemp", event.target.value)}
            className={errors.storageTemp ? "input-error" : ""}
          />
          {errors.storageTemp && <span className="field-error">{errors.storageTemp}</span>}
        </div>

        <div className="field">
          <label htmlFor="pf-stock">
            {initial ? "Stok Fisik (koreksi)" : "Stok Awal"} *
          </label>
          <input
            id="pf-stock"
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 20"
            value={stockText}
            onChange={(event) => {
              const raw = event.target.value.replace(/[^\d]/g, "");
              setStockText(raw);
              setField("stock", raw ? Number(raw) : 0);
            }}
            className={errors.stock ? "input-error" : ""}
          />
          <span className="field-hint">
            {initial
              ? "Untuk barang masuk dari supplier, gunakan tombol Restock agar tercatat."
              : "Jumlah stok yang tersedia saat produk pertama kali didaftarkan."}
          </span>
          {errors.stock && <span className="field-error">{errors.stock}</span>}
        </div>

        <div className="field field-full">
          <label htmlFor="pf-description">Deskripsi</label>
          <textarea
            id="pf-description"
            rows={2}
            placeholder="Keterangan singkat produk yang tampil di katalog kasir…"
            value={form.description}
            onChange={(event) => setField("description", event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
