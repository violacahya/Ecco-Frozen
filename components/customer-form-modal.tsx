"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "./ui";
import { useApp } from "@/lib/app-context";
import {
  SEGMENT_LABEL,
  STATUS_LABEL,
  type Customer,
  type CustomerSegment,
  type CustomerStatus,
} from "@/lib/types";
import type { CustomerInput } from "@/lib/types";
import { formatIDR } from "@/lib/utils";

const EMPTY = {
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
  segment: "retail" as CustomerSegment,
  status: "prospek" as CustomerStatus,
  value: 0,
  notes: "",
};

type FormState = typeof EMPTY;
type Errors = Partial<Record<keyof FormState, string>>;

export function CustomerFormModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: Customer | null;
  onSaved: (name: string, isEdit: boolean) => void;
}) {
  const { addCustomer, updateCustomer } = useApp();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [valueText, setValueText] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setForm({
        name: initial.name,
        company: initial.company,
        email: initial.email,
        phone: initial.phone,
        city: initial.city,
        segment: initial.segment,
        status: initial.status,
        value: initial.value,
        notes: initial.notes,
      });
      setValueText(String(initial.value));
    } else {
      setForm(EMPTY);
      setValueText("");
    }
    setErrors({});
  }, [open, initial]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.name.trim()) next.name = "Nama pelanggan wajib diisi.";
    if (!form.company.trim()) next.company = "Nama perusahaan wajib diisi.";
    if (!form.email.trim()) {
      next.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Format email tidak valid.";
    }
    if (!form.phone.trim()) next.phone = "Nomor telepon wajib diisi.";
    if (!form.city.trim()) next.city = "Kota wajib diisi.";
    if (form.value < 0) next.value = "Nilai tidak boleh negatif.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    const payload: CustomerInput = {
      ...form,
      name: form.name.trim(),
      company: form.company.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      notes: form.notes.trim(),
    };
    if (initial) {
      updateCustomer(initial.id, payload);
      onSaved(payload.name, true);
    } else {
      addCustomer(payload);
      onSaved(payload.name, false);
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
      description={
        initial
          ? "Perbarui informasi pelanggan agar data tim tetap akurat."
          : "Lengkapi informasi pelanggan untuk memulai hubungan kerja sama."
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Batal
          </button>
          <button type="submit" form="customer-form" className="btn btn-primary">
            {initial ? "Simpan Perubahan" : "Tambah Pelanggan"}
          </button>
        </>
      }
    >
      <form id="customer-form" className="form-grid" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="cf-name">Nama Pelanggan *</label>
          <input
            id="cf-name"
            type="text"
            placeholder="Contoh: Dewi Lestari"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            className={errors.name ? "input-error" : ""}
          />
          {errors.name && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="cf-company">Perusahaan *</label>
          <input
            id="cf-company"
            type="text"
            placeholder="Contoh: PT Sumber Beku Nusantara"
            value={form.company}
            onChange={(e) => setField("company", e.target.value)}
            className={errors.company ? "input-error" : ""}
          />
          {errors.company && <span className="field-error">{errors.company}</span>}
        </div>

        <div className="field">
          <label htmlFor="cf-email">Email *</label>
          <input
            id="cf-email"
            type="email"
            placeholder="nama@perusahaan.co.id"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            className={errors.email ? "input-error" : ""}
          />
          {errors.email && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="cf-phone">Nomor Telepon *</label>
          <input
            id="cf-phone"
            type="tel"
            placeholder="0812-3456-7890"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
            className={errors.phone ? "input-error" : ""}
          />
          {errors.phone && <span className="field-error">{errors.phone}</span>}
        </div>

        <div className="field">
          <label htmlFor="cf-city">Kota *</label>
          <input
            id="cf-city"
            type="text"
            placeholder="Contoh: Jakarta"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
            className={errors.city ? "input-error" : ""}
          />
          {errors.city && <span className="field-error">{errors.city}</span>}
        </div>

        <div className="field">
          <label htmlFor="cf-value">Nilai Kerja Sama (Rp)</label>
          <input
            id="cf-value"
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 50000000"
            value={valueText}
            onChange={(e) => {
              const raw = e.target.value.replace(/[^\d]/g, "");
              setValueText(raw);
              setField("value", raw ? Number(raw) : 0);
            }}
            className={errors.value ? "input-error" : ""}
          />
          <span className="field-hint">
            {form.value > 0 ? formatIDR(form.value) : "Masukkan angka tanpa titik atau koma."}
          </span>
        </div>

        <div className="field">
          <label htmlFor="cf-segment">Segmen</label>
          <select
            id="cf-segment"
            value={form.segment}
            onChange={(e) => setField("segment", e.target.value as CustomerSegment)}
          >
            {Object.entries(SEGMENT_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cf-status">Status</label>
          <select
            id="cf-status"
            value={form.status}
            onChange={(e) => setField("status", e.target.value as CustomerStatus)}
          >
            {Object.entries(STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="field field-full">
          <label htmlFor="cf-notes">Catatan</label>
          <textarea
            id="cf-notes"
            rows={3}
            placeholder="Informasi tambahan, kebutuhan produk, atau rencana follow-up…"
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
}
