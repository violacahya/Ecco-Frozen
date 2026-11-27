import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pengguna — Ecco Frozen",
  description:
    "Kelola akun anggota tim, akun portal mitra, hak akses peran, dan data demo Ecco Frozen.",
};

export default function UsersLayout({ children }: { children: ReactNode }) {
  return children;
}
