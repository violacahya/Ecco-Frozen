import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Keuangan & Laba — Ecco Frozen",
  description:
    "Laporan arus kas, pemasukan kasir, pengeluaran operasional, dan laba bersih Ecco Frozen.",
};

export default function FinanceLayout({ children }: { children: ReactNode }) {
  return children;
}
