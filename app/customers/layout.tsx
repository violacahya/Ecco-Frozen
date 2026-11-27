import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pelanggan — Ecco Frozen",
  description:
    "Kelola data pelanggan, status kerja sama, segmen, dan harga khusus per pelanggan Ecco Frozen.",
};

export default function CustomersLayout({ children }: { children: ReactNode }) {
  return children;
}
