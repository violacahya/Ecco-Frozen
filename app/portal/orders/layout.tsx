import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pesanan Saya — Ecco Frozen",
  description: "Riwayat dan status pesanan pasokan frozen food milik mitra Ecco Frozen.",
};

export default function PortalOrdersLayout({ children }: { children: ReactNode }) {
  return children;
}
