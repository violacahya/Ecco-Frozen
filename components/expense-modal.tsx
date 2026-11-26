"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useApp } from "@/lib/app-context";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABEL,
  type ExpenseCategory,
  type ExpenseRecord,
} from "@/lib/types";
import { formatIDR } from "@/lib/utils";
import { WalletIcon } from "./icons";
import { Modal } from "./ui";

export function ExpenseModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (expense: ExpenseRecord) => void;
}) {
  const { addExpense } = useApp();
  const [category, setCategory] = useState<ExpenseCategory>("operasional");
  const [amountText, setAmountText] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!open) return;
    setCategory("operasional");
    setAmountText("");
    setDescription("");
  }, [open]);

  const amount = Number(amountText || 0);
  const amountInvalid =
    amountText.trim() === "" || !Number.isFinite(amount) || amount <= 0;
  const descriptionInvalid = description.trim() === "";
  const invalid = amountInvalid || descriptionInvalid;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (invalid) return;
    const expense = addExpense({ category, amount, description });
    onSaved(expense);
  };

  return (
    <Modal
      open={open}
      title="Catat Pengeluaran Baru"
      description="Catat biaya operasional toko agar laba bersih selalu terhitung otomatis."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button
            type="submit"
            form="expense-form"
            className="btn btn-primary"
            disabled={invalid}
          >
            Simpan Pengeluaran
          </button>
        </>
      }
    >
      <form id="expense-form" className="inv-form" onSubmit={handleSubmit} noValidate>
        <div className="inv-summary">
          <span className="inv-summary-icon" aria-hidden="true">
            <WalletIcon size={20} />
          </span>
          <span className="inv-summary-text">
            <strong>Pengeluaran Operasional</strong>
            <span>Pemasukan kasir otomatis masuk ke laporan keuangan.</span>
          </span>
        </div>

        <div className="field">
          <label htmlFor="expense-category">Kategori pengeluaran *</label>
          <select
            id="expense-category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ExpenseCategory)}
          >
            {EXPENSE_CATEGORIES.map((value) => (
              <option key={value} value={value}>
                {EXPENSE_CATEGORY_LABEL[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="expense-amount">Nominal (Rp) *</label>
          <input
            id="expense-amount"
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 1200000"
            value={amountText}
            onChange={(event) =>
              setAmountText(event.target.value.replace(/[^\d]/g, ""))
            }
            className={amountText !== "" && amountInvalid ? "input-error" : ""}
            autoFocus
          />
          <span className="field-hint">
            {amount > 0
              ? `Nominal: ${formatIDR(amount)}`
              : "Masukkan nominal tanpa titik atau koma."}
          </span>
          {amountText !== "" && amountInvalid && (
            <span className="field-error">Nominal pengeluaran harus lebih dari 0.</span>
          )}
        </div>

        <div className="field">
          <label htmlFor="expense-description">Keterangan / Catatan *</label>
          <textarea
            id="expense-description"
            rows={2}
            placeholder="Contoh: Token listrik cold storage bulan ini"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className={description !== "" && descriptionInvalid ? "input-error" : ""}
          />
          {description !== "" && descriptionInvalid && (
            <span className="field-error">Keterangan pengeluaran wajib diisi.</span>
          )}
        </div>

        <div className="inv-preview">
          <div>
            <span>Total pengeluaran dicatat</span>
            <small>{EXPENSE_CATEGORY_LABEL[category]}</small>
          </div>
          <strong>{formatIDR(amountInvalid ? 0 : amount)}</strong>
        </div>
      </form>
    </Modal>
  );
}
