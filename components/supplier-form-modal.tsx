"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/lib/app-context";
import {
  PRODUCT_CATEGORIES,
  type ProductCategory,
  type Supplier,
  type SupplierInput,
} from "@/lib/types";
import { cn, normalizeWhatsAppNumber } from "@/lib/utils";
import { Modal } from "./ui";

const EMPTY = {
  name: "",
  contactPerson: "",
  phone: "",
  email: "",
  address: "",
  suppliedCategories: [] as ProductCategory[],
  notes: "",
};

type FormState = typeof EMPTY;
type Errors = Partial<Record<keyof FormState, string>>;

export function SupplierFormModal({
  open,
  initial,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial?: Supplier | null;
  onClose: () => void;
  onSaved: (name: string, isEdit: boolean) => void;
}) {
  const { addSupplier, updateSupplier } = useApp();
  const [form, setForm] = useState<FormState>({ ...EMPTY });
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        contactPerson: initial.contactPerson,
        phone: initial.phone,
        email: initial.email ?? "",
        address: initial.address,
        suppliedCategories: [...initial.suppliedCategories],
        notes: initial.notes ?? "",
      });
    } else {
      setForm({ ...EMPTY, suppliedCategories: [] });
    }
    setErrors({});
  }, [open, initial]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleCategory = (category: ProductCategory) => {
    setForm((prev) => ({
      ...prev,
      suppliedCategories: prev.suppliedCategories.includes(category)
        ? prev.suppliedCategories.filter((item) => item !== category)
        : [...prev.suppliedCategories, category],
    }));
    setErrors((prev) => ({ ...prev, suppliedCategories: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    const phone = normalizeWhatsAppNumber(form.phone);

    if (!form.name.trim()) next.name = "Nama perusahaan wajib diisi.";
    if (!form.contactPerson.trim()) next.contactPerson = "Nama PIC / sales wajib diisi.";
    if (!form.phone.trim()) {
      next.phone = "Nomor WhatsApp wajib diisi.";
    } else if (!/^62\d{8,13}$/.test(phone)) {
      next.phone = "Nomor WhatsApp tidak valid. Contoh: 081234567890.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Format email tidak valid.";
    }
    if (!form.address.trim()) next.address = "Alamat gudang wajib diisi.";
    if (form.suppliedCategories.length === 0) {
      next.suppliedCategories = "Pilih minimal satu kategori produk yang disuplai.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    const payload: SupplierInput = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || undefined,
      address: form.address.trim(),
      suppliedCategories: form.suppliedCategories,
      notes: form.notes.trim() || undefined,
    };

    if (initial) {
      updateSupplier(initial.id, payload);
      onSaved(payload.name, true);
    } else {
      addSupplier(payload);
      onSaved(payload.name, false);
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit Pemasok" : "Tambah Pemasok Baru"}
      description={
        initial
          ? "Perbarui data perusahaan, PIC, atau kategori suplai pemasok."
          : "Daftarkan mitra pemasok frozen food untuk memperkuat rantai pasok Ecco Frozen."
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="supplier-form" className="btn btn-primary">
            {initial ? "Simpan Perubahan" : "Tambah Pemasok"}
          </button>
        </>
      }
    >
      <form id="supplier-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field field-full">
          <label htmlFor="sf-name">Nama Perusahaan / Distributor *</label>
          <input
            id="sf-name"
            type="text"
            placeholder="Contoh: PT Sumber Primafood (Fiesta & Champ)"
            value={form.name}
            onChange={(event) => setField("name", event.target.value)}
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="sf-pic">Nama PIC / Sales *</label>
          <input
            id="sf-pic"
            type="text"
            placeholder="Contoh: Bpk. Gunawan"
            value={form.contactPerson}
            onChange={(event) => setField("contactPerson", event.target.value)}
            className={errors.contactPerson ? "input-error" : ""}
          />
          {errors.contactPerson && (
            <span className="field-error">{errors.contactPerson}</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="sf-phone">Nomor WhatsApp *</label>
          <input
            id="sf-phone"
            type="tel"
            placeholder="Contoh: 081288990011"
            value={form.phone}
            onChange={(event) => setField("phone", event.target.value)}
            className={errors.phone ? "input-error" : ""}
          />
          <span className="field-hint">
            Boleh diawali 0, 62, atau +62 — otomatis dirapikan saat menghubungi.
          </span>
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="field">
          <label htmlFor="sf-email">Email (opsional)</label>
          <input
            id="sf-email"
            type="email"
            placeholder="sales@pemasok.co.id"
            value={form.email}
            onChange={(event) => setField("email", event.target.value)}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="sf-address">Alamat Gudang *</label>
          <input
            id="sf-address"
            type="text"
            placeholder="Contoh: Kawasan Industri Pulogadung Blok C-7, Jakarta"
            value={form.address}
            onChange={(event) => setField("address", event.target.value)}
            className={errors.address ? "input-error" : ""}
          />
          {errors.address && <span className="field-error">{errors.address}</span>}
        </div>

        <div className="field field-full">
          <label>Kategori Produk yang Disuplai *</label>
          <div className="category-picker">
            {PRODUCT_CATEGORIES.map((category) => {
              const active = form.suppliedCategories.includes(category);
              return (
                <label
                  key={category}
                  className={cn("category-option", active && "category-option-active")}
                >
                  <input
                    type="checkbox"
                    className="category-option-input"
                    checked={active}
                    onChange={() => toggleCategory(category)}
                  />
                  <span className={cn("category-dot", `category-dot-${category.toLowerCase()}`)} />
                  {category}
                </label>
              );
            })}
          </div>
          <span className="field-hint">
            Pilih semua kategori yang biasa dipasok, mis. Daging dan Olahan.
          </span>
          {errors.suppliedCategories && (
            <span className="field-error">{errors.suppliedCategories}</span>
          )}
        </div>

        <div className="field field-full">
          <label htmlFor="sf-notes">Catatan (opsional)</label>
          <textarea
            id="sf-notes"
            rows={3}
            placeholder="Contoh: Minimal order 1 karton, pengiriman tiap Selasa & Jumat…"
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
