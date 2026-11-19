import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ecco CRM — Manajemen Pelanggan",
  description:
    "Aplikasi CRM sederhana untuk mengelola data pelanggan, memantau statistik penjualan, dan kolaborasi tim.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <ToastProvider>
          <AppProvider>{children}</AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
