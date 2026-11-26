"use client";

import { PAYMENT_METHOD_LABEL, type CustomerOrder } from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { Modal } from "./ui";
import { CheckCircleIcon, PrinterIcon, SnowflakeIcon } from "./icons";

export function PosReceiptModal({
  order,
  open,
  onClose,
  onNewTransaction,
}: {
  order: CustomerOrder | null;
  open: boolean;
  onClose: () => void;
  onNewTransaction: () => void;
}) {
  const method = order?.paymentMethod ?? "tunai";
  const cashPaid = order?.cashPaid ?? order?.totalAmount ?? 0;
  const change = order?.change ?? 0;
  const dateTime = order
    ? new Date(order.createdAt).toLocaleString("id-ID", {
        dateStyle: "long",
        timeStyle: "short",
      })
    : "";

  return (
    <Modal
      open={open && Boolean(order)}
      title="Transaksi Berhasil"
      description="Struk siap dicetak dan stok produk sudah diperbarui."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
            <PrinterIcon size={17} />
            Cetak Struk
          </button>
          <button type="button" className="btn btn-primary" onClick={onNewTransaction}>
            Transaksi Baru
          </button>
        </>
      }
    >
      {order && (
        <>
          <div className="receipt-success">
            <span className="receipt-success-icon">
              <CheckCircleIcon size={20} />
            </span>
            <p>
              Pembayaran <strong>{formatIDR(order.totalAmount)}</strong> berhasil diterima.
            </p>
          </div>

          <div className="receipt-sheet">
            <div className="receipt-brand">
              <span className="receipt-brand-mark">
                <SnowflakeIcon size={20} />
              </span>
              <h3>ECCO FROZEN</h3>
              <p>Frozen Food Partner</p>
              <p>Jl. Raya Beku No. 18, Jakarta · (021) 555-0123</p>
            </div>

            <div className="receipt-divider" />

            <div className="receipt-meta">
              <div>
                <span>No. Transaksi</span>
                <strong>{order.orderNumber}</strong>
              </div>
              <div>
                <span>Tanggal</span>
                <strong>{dateTime}</strong>
              </div>
              <div>
                <span>Kasir</span>
                <strong>{order.cashierName ?? "Kasir"}</strong>
              </div>
              <div>
                <span>Pelanggan</span>
                <strong>{order.customerName}</strong>
              </div>
            </div>

            <div className="receipt-divider" />

            <ul className="receipt-items">
              {order.items.map((item) => (
                <li key={item.productId}>
                  <div>
                    <strong>{item.productName}</strong>
                    <small>
                      {item.qty} {item.unit} × {formatIDR(item.price)}
                    </small>
                  </div>
                  <span>{formatIDR(item.qty * item.price)}</span>
                </li>
              ))}
            </ul>

            <div className="receipt-divider" />

            <div className="receipt-totals">
              <div className="receipt-total-row">
                <span>Total</span>
                <strong>{formatIDR(order.totalAmount)}</strong>
              </div>
              {method === "tunai" ? (
                <>
                  <div>
                    <span>Tunai</span>
                    <span>{formatIDR(cashPaid)}</span>
                  </div>
                  <div>
                    <span>Kembalian</span>
                    <span>{formatIDR(change)}</span>
                  </div>
                </>
              ) : (
                <div>
                  <span>Metode</span>
                  <span>{PAYMENT_METHOD_LABEL[method]}</span>
                </div>
              )}
            </div>

            <p className="receipt-thanks">Terima kasih telah berbelanja di Ecco Frozen ❄</p>
            <p className="receipt-note">
              Simpan struk ini sebagai bukti pembayaran yang sah.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
