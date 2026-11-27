import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Masuk — Ecco Frozen",
  description:
    "Masuk ke Ecco Frozen CRM dan Portal Mitra untuk mengelola pelanggan, pesanan, stok, dan keuangan.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
