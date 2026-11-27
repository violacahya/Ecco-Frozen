import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pemasok (SCM) — Ecco Frozen",
  description:
    "Kelola mitra pemasok frozen food, kategori suplai, dan pesan restock langsung via WhatsApp.",
};

export default function SuppliersLayout({ children }: { children: ReactNode }) {
  return children;
}
