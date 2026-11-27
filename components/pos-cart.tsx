"use client";

import type { Customer, PosCartLine } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { CartIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";

export function PosCart({
  lines,
  customers,
  customerId,
  total,
  totalQty,
  onCustomerChange,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: {
  lines: PosCartLine[];
  customers: Customer[];
  customerId: string;
  total: number;
  totalQty: number;
  onCustomerChange: (customerId: string) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onCheckout: () => void;
}) {
  return (
    <aside className="pos-cart" aria-label="Keranjang kasir">
      <div className="pos-cart-head">
        <div>
          <h3 className="panel-title">Keranjang Kasir</h3>
          <p className="panel-subtitle">
            {lines.length} jenis produk · {totalQty} item
          </p>
        </div>
        <span className="panel-badge">{formatIDR(total)}</span>
      </div>

      <div className="field pos-customer-field">
        <label htmlFor="pos-customer">Pelanggan</label>
        <select
          id="pos-customer"
          value={customerId}
          onChange={(event) => onCustomerChange(event.target.value)}
        >
          <option value="">Pelanggan Umum (Walk-in)</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name} — {customer.company}
            </option>
          ))}
        </select>
      </div>

      <div className="pos-cart-body">
        {lines.length === 0 ? (
          <div className="pos-cart-empty">
            <span className="pos-cart-empty-icon">
              <CartIcon size={26} />
            </span>
            <p>Keranjang masih kosong</p>
            <small>Klik produk di katalog untuk menambahkan.</small>
          </div>
        ) : (
          <ul className="pos-cart-items">
            {lines.map((line) => {
              const maxed = line.qty >= line.product.stock;
              return (
                <li key={line.product.id} className="pos-cart-item">
                  <div className="pos-cart-item-main">
                    <strong>{line.product.name}</strong>
                    <small>
                      {formatIDR(line.price)} / {line.product.unit}
                    </small>
                  </div>

                  <div className="pos-qty">
                    <button
                      type="button"
                      onClick={() => onDecrease(line.product.id)}
                      aria-label={`Kurangi ${line.product.name}`}
                    >
                      <MinusIcon size={14} />
                    </button>
                    <span>{line.qty}</span>
                    <button
                      type="button"
                      onClick={() => onIncrease(line.product.id)}
                      disabled={maxed}
                      aria-label={`Tambah ${line.product.name}`}
                      title={maxed ? `Stok tersisa ${line.product.stock} ${line.product.unit}` : undefined}
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>

                  <span className="pos-cart-line-total">
                    {formatIDR(line.qty * line.price)}
                  </span>

                  <button
                    type="button"
                    className="icon-button icon-button-danger pos-cart-remove"
                    onClick={() => onRemove(line.product.id)}
                    aria-label={`Hapus ${line.product.name}`}
                  >
                    <TrashIcon size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="pos-cart-summary">
        <div className="pos-summary-row">
          <span>Total item</span>
          <strong>{totalQty} item</strong>
        </div>
        <div className="pos-summary-row pos-summary-total">
          <span>Total tagihan</span>
          <strong>{formatIDR(total)}</strong>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block pos-checkout"
        disabled={lines.length === 0}
        onClick={onCheckout}
      >
        <CartIcon size={17} />
        Lanjut ke Pembayaran
      </button>
    </aside>
  );
}
