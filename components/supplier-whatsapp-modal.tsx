"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/lib/app-context";
import { PRODUCT_CATEGORIES, type Supplier } from "@/lib/types";
import { formatPhoneDisplay, normalizeWhatsAppNumber } from "@/lib/utils";
import { BuildingIcon, PhoneIcon, WhatsAppIcon } from "./icons";
import { useToast } from "./toast";
import { Modal } from "./ui";

const DEFAULT_NOTE = "Mohon info ketersediaan stok, harga, dan jadwal pengiriman.";

export function SupplierWhatsAppModal({
  open,
  supplier,
  onClose,
}: {
  open: boolean;
  supplier: Supplier | null;
  onClose: () => void;
}) {
  const { products } = useApp();
  const { toast } = useToast();

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open || !supplier) return;

    const preferred =
      products.find((product) => supplier.suppliedCategories.includes(product.category)) ??
      products[0];

    setProductId(preferred?.id ?? "");
    setQuantity("");
    setNote("");
  }, [open, supplier, products]);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [products, productId],
  );

  const message = useMemo(() => {
    if (!supplier) return "";

    const lines = [
      `Halo ${supplier.name} (PIC: ${supplier.contactPerson}), kami dari Toko Ecco Frozen ingin melakukan pemesanan ulang (restock) produk:`,
      `- ${selectedProduct?.name ?? "(pilih produk)"}: ${quantity.trim() || "-"}`,
    ];

    const extraNote = note.trim();
    if (extraNote) {
      lines.push(`Catatan: ${extraNote}`, "Terima kasih!");
    } else {
      lines.push(`Catatan: ${DEFAULT_NOTE} Terima kasih!`);
    }

    return lines.join("\n");
  }, [supplier, selectedProduct, quantity, note]);

  const canSend = Boolean(supplier && selectedProduct && quantity.trim());

  const handleSend = () => {
    if (!supplier || !canSend) return;

    const number = normalizeWhatsAppNumber(supplier.phone);
    if (!number) {
      toast("Nomor WhatsApp pemasok tidak valid. Perbarui data pemasok terlebih dahulu.", "error");
      return;
    }

    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    toast(`Membuka WhatsApp untuk ${supplier.contactPerson} (${supplier.name}).`, "info");
    onClose();
  };

  return (
    <Modal
      open={open}
      title="Pesan Restock via WhatsApp"
      description="Susun pesanan restock, lalu kirim langsung ke PIC pemasok melalui WhatsApp."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-whatsapp"
            disabled={!canSend}
            onClick={handleSend}
          >
            <WhatsAppIcon size={18} />
            Buka WhatsApp &amp; Kirim
          </button>
        </>
      }
    >
      {supplier && (
        <div className="wa-form">
          <div className="wa-supplier">
            <span className="wa-supplier-icon" aria-hidden="true">
              <BuildingIcon size={20} />
            </span>
            <div className="wa-supplier-meta">
              <strong>{supplier.name}</strong>
              <span>PIC: {supplier.contactPerson}</span>
            </div>
            <span className="wa-supplier-phone">
              <PhoneIcon size={14} />
              {formatPhoneDisplay(supplier.phone)}
            </span>
          </div>

          {products.length === 0 ? (
            <p className="wa-empty">
              Belum ada produk di katalog. Tambahkan produk di menu Inventaris &amp; Stok
              terlebih dahulu.
            </p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="wa-product">Produk yang ingin dipesan *</label>
                <select
                  id="wa-product"
                  value={productId}
                  onChange={(event) => setProductId(event.target.value)}
                >
                  {PRODUCT_CATEGORIES.map((category) => {
                    const items = products.filter(
                      (product) => product.category === category,
                    );
                    if (items.length === 0) return null;
                    return (
                      <optgroup key={category} label={category}>
                        {items.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name} · stok {product.stock} {product.unit}
                          </option>
                        ))}
                      </optgroup>
                    );
                  })}
                </select>
                <span className="field-hint">
                  Opsi produk ditarik dari katalog Ecco Frozen
                  {supplier.suppliedCategories.length > 0
                    ? ` (pemasok ini memasok ${supplier.suppliedCategories.join(", ")})`
                    : ""}
                  .
                </span>
              </div>

              <div className="field">
                <label htmlFor="wa-quantity">Jumlah Pesanan *</label>
                <input
                  id="wa-quantity"
                  type="text"
                  placeholder={
                    selectedProduct
                      ? `Contoh: 20 ${selectedProduct.unit} atau 5 karton`
                      : "Contoh: 20 pack atau 5 karton"
                  }
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
                <span className="field-hint">
                  Tulis jumlah beserta satuannya agar pesanan tidak ambigu.
                </span>
              </div>

              <div className="field">
                <label htmlFor="wa-note">Catatan Tambahan (opsional)</label>
                <textarea
                  id="wa-note"
                  rows={2}
                  placeholder="Contoh: Mohon kirim sebelum hari Jumat."
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </div>

              <div className="wa-preview">
                <div className="wa-preview-head">
                  <span>Pratinjau Pesan WhatsApp</span>
                  <span className="wa-preview-live">
                    <span className="wa-preview-dot" aria-hidden="true" />
                    Live
                  </span>
                </div>
                <p className="wa-preview-text">{message}</p>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
