"use client";

import { useEffect, useState } from "react";
import { PAYMENT_METHOD_LABEL, type PaymentMethod } from "@/lib/types";
import { cn, formatIDR } from "@/lib/utils";
import { Modal } from "./ui";
import { BuildingIcon, SparkIcon, WalletIcon } from "./icons";

const METHODS: Array<{
  value: PaymentMethod;
  description: string;
  icon: typeof WalletIcon;
}> = [
  { value: "tunai", description: "Uang tunai di kasir", icon: WalletIcon },
  { value: "qris", description: "Scan QRIS di mesin EDC", icon: SparkIcon },
  { value: "transfer", description: "Transfer bank / virtual account", icon: BuildingIcon },
];

export function PosPaymentModal({
  open,
  total,
  itemCount,
  onClose,
  onConfirm,
}: {
  open: boolean;
  total: number;
  itemCount: number;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, cashPaid: number, change: number) => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("tunai");
  const [cashInput, setCashInput] = useState("");

  useEffect(() => {
    if (!open) return;
    setMethod("tunai");
    setCashInput("");
  }, [open]);

  const cash = Number(cashInput || 0);
  const isCash = method === "tunai";
  const insufficient = isCash && cash < total;
  const change = isCash ? Math.max(cash - total, 0) : 0;

  const quickAdd = (amount: number) => {
    setCashInput(String(cash + amount));
  };

  const handleConfirm = () => {
    if (insufficient) return;
    const paid = isCash ? cash : total;
    onConfirm(method, paid, isCash ? paid - total : 0);
  };

  return (
    <Modal
      open={open}
      title="Pembayaran"
      description={`${itemCount} item · Total ${formatIDR(total)}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleConfirm}
            disabled={insufficient || itemCount === 0}
          >
            Selesaikan Transaksi
          </button>
        </>
      }
    >
      <div className="pay-methods" role="radiogroup" aria-label="Metode pembayaran">
        {METHODS.map((option) => {
          const Icon = option.icon;
          const active = method === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              className={cn("pay-method", active && "pay-method-active")}
              onClick={() => setMethod(option.value)}
            >
              <span className="pay-method-icon">
                <Icon size={19} />
              </span>
              <span className="pay-method-text">
                <strong>{PAYMENT_METHOD_LABEL[option.value]}</strong>
                <small>{option.description}</small>
              </span>
            </button>
          );
        })}
      </div>

      {isCash ? (
        <div className="pay-cash">
          <div className="field">
            <label htmlFor="pos-cash">Uang diterima</label>
            <input
              id="pos-cash"
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={cashInput}
              onChange={(event) => setCashInput(event.target.value.replace(/[^\d]/g, ""))}
              className={insufficient ? "input-error" : ""}
            />
            <span className="field-hint">Diterima: {formatIDR(cash)}</span>
          </div>

          <div className="pay-quick">
            <button type="button" className="pay-quick-btn" onClick={() => quickAdd(50000)}>
              +Rp50.000
            </button>
            <button type="button" className="pay-quick-btn" onClick={() => quickAdd(100000)}>
              +Rp100.000
            </button>
            <button
              type="button"
              className="pay-quick-btn pay-quick-exact"
              onClick={() => setCashInput(String(total))}
            >
              Pas
            </button>
            {cashInput !== "" && (
              <button
                type="button"
                className="pay-quick-btn pay-quick-reset"
                onClick={() => setCashInput("")}
              >
                Hapus
              </button>
            )}
          </div>

          <div className="pay-summary">
            <div>
              <span>Total tagihan</span>
              <strong>{formatIDR(total)}</strong>
            </div>
            <div>
              <span>Kembalian</span>
              <strong className={cn(insufficient && "pay-change-error")}>
                {formatIDR(change)}
              </strong>
            </div>
          </div>

          {insufficient && (
            <p className="field-error">
              Uang tunai kurang {formatIDR(total - cash)} dari total tagihan.
            </p>
          )}
        </div>
      ) : (
        <div className="pay-note">
          <span className="pay-note-icon">
            <SparkIcon size={18} />
          </span>
          <p>
            Pembayaran <strong>{PAYMENT_METHOD_LABEL[method]}</strong> sebesar{" "}
            <strong>{formatIDR(total)}</strong>. Pastikan dana sudah diterima sebelum menutup
            transaksi.
          </p>
        </div>
      )}
    </Modal>
  );
}
