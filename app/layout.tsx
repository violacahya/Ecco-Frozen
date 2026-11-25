import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppProvider } from "@/lib/app-context";
import { ToastProvider } from "@/components/toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ecco Frozen — CRM & Portal Mitra",
  description:
    "CRM dan portal mitra Ecco Frozen untuk mengelola pelanggan, pesanan, dan kerja sama distribusi frozen food.",
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
