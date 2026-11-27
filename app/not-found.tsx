import Link from "next/link";
import type { Metadata } from "next";
import { SnowflakeIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan — Ecco Frozen",
  description: "Halaman yang Anda cari tidak tersedia di Ecco Frozen.",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="not-found">
      <div className="not-found-card">
        <span className="not-found-mark">
          <SnowflakeIcon size={26} />
        </span>
        <p className="not-found-code">404</p>
        <h1 className="not-found-title">Halaman tidak ditemukan</h1>
        <p className="not-found-text">
          Alamat yang Anda buka tidak tersedia atau sudah dipindahkan. Kembali ke dashboard
          untuk melanjutkan.
        </p>
        <div className="not-found-actions">
          <Link href="/" className="btn btn-primary">
            Ke Dashboard
          </Link>
          <Link href="/login" className="btn btn-ghost">
            Halaman Masuk
          </Link>
        </div>
      </div>
    </main>
  );
}
