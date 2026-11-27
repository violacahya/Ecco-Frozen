import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Inventaris & Stok — Ecco Frozen",
  description:
    "Pantau stok freezer, atur harga jual, catat barang masuk beserta harga beli, dan audit restock.",
};

export default function InventoryLayout({ children }: { children: ReactNode }) {
  return children;
}
