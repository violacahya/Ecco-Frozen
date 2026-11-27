"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/lib/app-context";
import type { FrozenProduct } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { PackageIcon } from "./icons";
import { Modal } from "./ui";

export function RestockModal({
  open,
  product,
  onClose,
  onSaved,
}: {
  open: boolean;
  product: FrozenProduct | null;
  onClose: () => void;
  onSaved: (
    product: FrozenProduct,
    quantity: number,
    newStock: number,
    unitCost?: number,
  ) => void;
}) {
  const { restockProduct } = useApp();
  const [quantityText, setQuantityText] = useState("");
  const [costText, setCostText] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setQuantityText("");
    setCostText("");
    setNote("");
  }, [open, product?.id]);

  const quantity = Number(quantityText || 0);
  const invalid = quantityText.trim() === "" || !Number.isFinite(quantity) || quantity <= 0;
  const currentStock = product?.stock ?? 0;
  const added = invalid ? 0 : quantity;
  const newStock = currentStock + added;
  const unitCost = costText === "" ? undefined : Number(costText);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!product || invalid) return;
    restockProduct(product.id, quantity, note, unitCost);
    onSaved(product, quantity, newStock, unitCost);
  };

  return (
    <Modal
      open={open}
      title="Catat Barang Masuk (Restock)"
      description="Catat kiriman dari supplier agar stok di kasir otomatis bertambah."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="restock-form"
            className="btn btn-primary"
            disabled={!product || invalid}
          >
            Simpan Barang Masuk
          </button>
        </>
      }
    >
      {product && (
        <form id="restock-form" className="inv-form" onSubmit={handleSubmit} noValidate>
          <div className="inv-summary">
            <span className="inv-summary-icon" aria-hidden="true">
              <PackageIcon size={20} />
            </span>
            <span className="inv-summary-text">
              <strong>{product.name}</strong>
              <span>
                SKU {product.sku} · Stok saat ini <strong>{product.stock}</strong>{" "}
                {product.unit}
              </span>
            </span>
          </div>

          <div className="field">
            <label htmlFor="restock-qty">Jumlah barang masuk *</label>
            <input
              id="restock-qty"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 12"
              value={quantityText}
              onChange={(event) =>
                setQuantityText(event.target.value.replace(/[^\d]/g, ""))
              }
              className={quantityText !== "" && invalid ? "input-error" : ""}
              autoFocus
            />
            <span className="field-hint">
              Masukkan jumlah dalam {product.unit} (angka positif).
            </span>
            {quantityText !== "" && invalid && (
              <span className="field-error">Jumlah barang masuk harus lebih dari 0.</span>
            )}
          </div>

          <div className="field">
            <label htmlFor="restock-cost">Harga Beli / Unit (Rp, opsional)</label>
            <input
              id="restock-cost"
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 65000"
              value={costText}
              onChange={(event) => setCostText(event.target.value.replace(/[^\d]/g, ""))}
            />
            <span className="field-hint">
              {unitCost && unitCost > 0
                ? `Harga beli ${product.unit}: ${formatIDR(unitCost)}`
                : "Hanya untuk catatan HPP. Tidak mengubah harga jual di katalog."}
            </span>
          </div>

          <div className="field">
            <label htmlFor="restock-note">Catatan / No. Surat Jalan (opsional)</label>
            <textarea
              id="restock-note"
              rows={2}
              placeholder="Contoh: SJ-2026-0098 dari PT Sumber Beku Nusantara"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </div>

          <div className="inv-preview">
            <div>
              <span>Stok setelah barang masuk</span>
              <small>
                {currentStock} + {added} {product.unit}
              </small>
            </div>
            <strong>
              {newStock} <small>{product.unit}</small>
            </strong>
          </div>
        </form>
      )}
    </Modal>
  );
}
