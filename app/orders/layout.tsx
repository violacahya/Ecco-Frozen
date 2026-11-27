import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pesanan — Ecco Frozen",
  description:
    "Kelola permintaan pasokan dari mitra, perbarui status pengiriman, dan pantau transaksi kasir.",
};

export default function OrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
