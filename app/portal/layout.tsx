import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Portal Mitra — Ecco Frozen",
  description:
    "Pantau status kemitraan, nilai kerja sama, dan ajukan pesanan pasokan frozen food.",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return children;
}
