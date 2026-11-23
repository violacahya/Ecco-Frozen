"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { SnowflakeIcon, MailIcon, ShieldIcon, SparkIcon, TrendUpIcon, UsersIcon } from "@/components/icons";
import { Spinner } from "@/components/ui";

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    name: "Rangga Pratama",
    email: "admin@eccocrm.id",
    password: "admin123",
    icon: ShieldIcon,
    description: "Akses penuh & kelola pengguna",
  },
  {
    label: "Staff",
    name: "Nadia Putri",
    email: "staff@eccocrm.id",
    password: "staff123",
    icon: UsersIcon,
    description: "Kelola data pelanggan",
  },
];

export default function LoginPage() {
  const { ready, currentUser, login } = useApp();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && currentUser) router.replace("/");
  }, [ready, currentUser, router]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Email dan kata sandi wajib diisi.");
      return;
    }
    setSubmitting(true);
    const result = login(email, password);
    if (result.ok) {
      router.push("/");
    } else {
      setError(result.error ?? "Gagal masuk. Silakan coba lagi.");
      setSubmitting(false);
    }
  };

  const fillDemo = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError("");
  };

  return (
    <div className="login-page">
      <section className="login-visual">
        <div className="login-visual-inner">
          <div className="login-brand">
            <span className="brand-mark brand-mark-lg">
              <SnowflakeIcon size={26} />
            </span>
            <div>
              <strong>Ecco CRM</strong>
              <small>Frozen Food Division</small>
            </div>
          </div>

          <div className="login-hero">
            <p className="login-eyebrow">
              <SparkIcon size={15} />
              Customer Relationship Management
            </p>
            <h1>
              Kelola pelanggan beku Anda dengan <span>lebih hangat.</span>
            </h1>
            <p className="login-lead">
              Satu tempat untuk memantau data pelanggan, status kerja sama, dan performa penjualan
              tim. Dirancang untuk bisnis frozen food yang bergerak cepat.
            </p>
          </div>

          <div className="login-features">
            <div>
              <span className="login-feature-icon">
                <UsersIcon size={18} />
              </span>
              <div>
                <strong>Data pelanggan terpusat</strong>
                <p>Riwayat kontak, segmen, dan nilai kontrak tersimpan rapi.</p>
              </div>
            </div>
            <div>
              <span className="login-feature-icon">
                <TrendUpIcon size={18} />
              </span>
              <div>
                <strong>Statistik real-time</strong>
                <p>Pantau pertumbuhan pelanggan dan pipeline penjualan.</p>
              </div>
            </div>
            <div>
              <span className="login-feature-icon">
                <ShieldIcon size={18} />
              </span>
              <div>
                <strong>Akses berbasis peran</strong>
                <p>Admin dan staff memiliki hak akses yang berbeda.</p>
              </div>
            </div>
          </div>

          <div className="login-visual-foot">
            <div className="login-mini-card">
              <span className="login-mini-icon">
                <TrendUpIcon size={18} />
              </span>
              <div>
                <span>Contoh performa</span>
                <strong>+18% pelanggan aktif</strong>
              </div>
            </div>
            <p>© {new Date().getFullYear()} Ecco CRM · Tugas Akhir Mata Kuliah Sistem Informasi</p>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-box">
          <div className="login-heading">
            <span className="login-mobile-brand">
              <SnowflakeIcon size={18} />
              Ecco CRM
            </span>
            <h2>Masuk ke akun Anda</h2>
            <p>Gunakan email dan kata sandi yang terdaftar untuk melanjutkan.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form" noValidate>
            <div className="field">
              <label htmlFor="login-email">Email</label>
              <div className="input-icon-wrap">
                <MailIcon size={17} />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="username"
                  placeholder="nama@eccocrm.id"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setError("");
                  }}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="login-password">Kata Sandi</label>
              <div className="input-icon-wrap">
                <ShieldIcon size={17} />
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Masukkan kata sandi"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setError("");
                  }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Sembunyikan" : "Lihat"}
                </button>
              </div>
            </div>

            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? <Spinner label="Memeriksa akun…" /> : "Masuk ke Dashboard"}
            </button>
          </form>

          <div className="login-divider">
            <span>Akun demo untuk pengujian</span>
          </div>

          <div className="demo-accounts">
            {DEMO_ACCOUNTS.map((account) => {
              const Icon = account.icon;
              return (
                <button
                  key={account.email}
                  type="button"
                  className="demo-account"
                  onClick={() => fillDemo(account)}
                >
                  <span className="demo-icon">
                    <Icon size={18} />
                  </span>
                  <span className="demo-body">
                    <strong>
                      {account.label} <span>· {account.name}</span>
                    </strong>
                    <small>{account.description}</small>
                  </span>
                  <span className="demo-fill">Gunakan</span>
                </button>
              );
            })}
          </div>

          <p className="login-note">
            <ShieldIcon size={14} />
            Data disimpan lokal di browser Anda. Ini adalah aplikasi demo untuk keperluan tugas
            kuliah.
          </p>
        </div>
      </section>
    </div>
  );
}
