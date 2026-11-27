import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Kasir (POS) — Ecco Frozen",
  description:
    "Catat penjualan langsung, kelola keranjang, terapkan harga khusus pelanggan, dan cetak struk.",
};

export default function PosLayout({ children }: { children: ReactNode }) {
  return children;
}
