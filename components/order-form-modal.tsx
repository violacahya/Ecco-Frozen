"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Modal } from "./ui";
import { useApp } from "@/lib/app-context";

const EMPTY = {
  product: "",
  quantity: "",
  notes: "",
};

type FormState = typeof EMPTY;
type Errors = Partial<Record<keyof FormState, string>>;

export function OrderFormModal({
  open,
  customerId,
  onClose,
  onSaved,
}: {
  open: boolean;
  customerId: string;
  onClose: () => void;
  onSaved: (product: string) => void;
}) {
  const { addOrder, products } = useApp();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  /**
   * Pilihan produk ditarik langsung dari katalog Inventaris, sehingga produk
   * baru yang ditambahkan admin langsung bisa dipesan mitra tanpa ubah kode.
   */
  const productOptions = useMemo(
    () => products.map((product) => product.name),
    [products],
  );

  useEffect(() => {
    if (!open) return;
    setForm({ ...EMPTY, product: productOptions[0] ?? "" });
    setErrors({});
  }, [open, productOptions]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const next: Errors = {};
    const quantity = Number(form.quantity);
    if (!form.product.trim()) next.product = "Pilih produk yang ingin dipesan.";
    if (!form.quantity.trim() || Number.isNaN(quantity)) {
      next.quantity = "Jumlah pesanan wajib diisi.";
    } else if (quantity <= 0) {
      next.quantity = "Jumlah pesanan harus lebih dari 0 kg.";
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    addOrder(customerId, {
      product: form.product,
      quantity,
      notes: form.notes.trim(),
    });
    onSaved(form.product);
  };

  return (
    <Modal
      open={open}
      title="Ajukan Pesanan Baru"
      description="Pesanan akan diteruskan ke tim penjualan Ecco Frozen untuk dikonfirmasi."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="order-form"
            className="btn btn-primary"
            disabled={productOptions.length === 0}
          >
            Kirim Pesanan
          </button>
        </>
      }
    >
      <form id="order-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field field-full">
          <label htmlFor="of-product">Produk *</label>
          <select
            id="of-product"
            value={form.product}
            onChange={(event) => setField("product", event.target.value)}
            className={errors.product ? "input-error" : ""}
            disabled={productOptions.length === 0}
          >
            {productOptions.length === 0 ? (
              <option value="">Belum ada produk di katalog</option>
            ) : (
              productOptions.map((product) => (
                <option key={product} value={product}>
                  {product}
                </option>
              ))
            )}
          </select>
          {errors.product ? (
            <span className="field-error">{errors.product}</span>
          ) : productOptions.length === 0 ? (
            <span className="field-hint">
              Tambahkan produk lebih dulu di menu Inventaris &amp; Stok.
            </span>
          ) : (
            <span className="field-hint">
              Pilihan produk mengikuti katalog Inventaris &amp; Stok.
            </span>
          )}
        </div>

        <div className="field">
          <label htmlFor="of-quantity">Jumlah (kg) *</label>
          <input
            id="of-quantity"
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 250"
            value={form.quantity}
            onChange={(event) => setField("quantity", event.target.value.replace(/[^\d]/g, ""))}
            className={errors.quantity ? "input-error" : ""}
          />
          {errors.quantity ? (
            <span className="field-error">{errors.quantity}</span>
          ) : (
            <span className="field-hint">Masukkan berat total dalam kilogram.</span>
          )}
        </div>

        <div className="field field-full">
          <label htmlFor="of-notes">Catatan</label>
          <textarea
            id="of-notes"
            rows={3}
            placeholder="Alamat pengiriman, jadwal, atau kebutuhan khusus…"
            value={form.notes}
            onChange={(event) => setField("notes", event.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
