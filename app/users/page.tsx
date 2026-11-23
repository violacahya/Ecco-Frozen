"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar, EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import { ROLE_LABEL, type Role, type UserInput } from "@/lib/types";
import { cn, formatDate, initials, avatarColor } from "@/lib/utils";
import {
  AlertIcon,
  MailIcon,
  PlusIcon,
  ShieldIcon,
  TrashIcon,
  UserPlusIcon,
  UsersIcon,
} from "@/components/icons";

const EMPTY: UserInput = {
  name: "",
  email: "",
  password: "",
  role: "staff",
  title: "",
};

export default function UsersPage() {
  const { users, currentUser, isAdmin, addUser, deleteUser, resetDemoData } = useApp();
  const { toast } = useToast();
  const router = useRouter();

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<UserInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof UserInput, string>>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const targetUser = users.find((user) => user.id === deletingId) ?? null;

  const summary = useMemo(
    () => ({
      total: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      staff: users.filter((u) => u.role === "staff").length,
    }),
    [users],
  );

  if (!isAdmin) {
    return (
      <AppShell title="Pengguna" subtitle="Kelola akses anggota tim ke aplikasi CRM.">
        <div className="panel">
          <EmptyState
            icon={<ShieldIcon size={26} />}
            title="Akses terbatas"
            description="Hanya pengguna dengan peran Admin yang dapat membuka halaman pengelolaan pengguna. Silakan hubungi admin tim Anda."
          />
        </div>
      </AppShell>
    );
  }

  const openForm = () => {
    setForm(EMPTY);
    setErrors({});
    setFormOpen(true);
  };

  const setField = <K extends keyof UserInput>(key: K, value: UserInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!form.name.trim()) next.name = "Nama wajib diisi.";
    if (!form.email.trim()) next.email = "Email wajib diisi.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = "Format email tidak valid.";
    if (!form.title.trim()) next.title = "Jabatan wajib diisi.";
    if (form.password.length < 6) next.password = "Kata sandi minimal 6 karakter.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = addUser({
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
    });
    if (!result.ok) {
      setErrors({ email: result.error });
      return;
    }
    setFormOpen(false);
    toast(`Pengguna "${form.name.trim()}" berhasil ditambahkan.`);
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    const result = deleteUser(deletingId);
    if (!result.ok) {
      toast(result.error ?? "Gagal menghapus pengguna.", "error");
    } else {
      toast("Pengguna berhasil dihapus.", "info");
    }
    setDeletingId(null);
  };

  const confirmReset = () => {
    resetDemoData();
    setResetOpen(false);
    toast("Data demo berhasil dikembalikan ke kondisi awal.", "info");
    router.push("/login");
  };

  return (
    <AppShell
      title="Pengguna"
      subtitle="Kelola akun anggota tim beserta hak aksesnya."
      actions={
        <button type="button" className="btn btn-primary" onClick={openForm}>
          <PlusIcon size={18} />
          Tambah Pengguna
        </button>
      }
    >
      <section className="stat-grid stat-grid-3">
        <article className="stat-card stat-card-row">
          <span className="stat-icon stat-icon-blue">
            <UsersIcon size={20} />
          </span>
          <div>
            <p className="stat-label">Total Pengguna</p>
            <p className="stat-value">{summary.total}</p>
          </div>
        </article>
        <article className="stat-card stat-card-row">
          <span className="stat-icon stat-icon-purple">
            <ShieldIcon size={20} />
          </span>
          <div>
            <p className="stat-label">Admin</p>
            <p className="stat-value">{summary.admin}</p>
          </div>
        </article>
        <article className="stat-card stat-card-row">
          <span className="stat-icon stat-icon-green">
            <UserPlusIcon size={20} />
          </span>
          <div>
            <p className="stat-label">Staff</p>
            <p className="stat-value">{summary.staff}</p>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Daftar Pengguna</h3>
            <p className="panel-subtitle">Akun yang memiliki akses ke Ecco CRM</p>
          </div>
          <span className="panel-badge">{users.length} akun</span>
        </div>

        <div className="user-list">
          {users.map((user) => {
            const isSelf = user.id === currentUser?.id;
            return (
              <div key={user.id} className="user-row">
                <span
                  className="avatar avatar-md"
                  style={{ background: avatarColor(user.id) }}
                  aria-hidden="true"
                >
                  {initials(user.name)}
                </span>
                <div className="user-main">
                  <div className="user-name-line">
                    <strong>{user.name}</strong>
                    {isSelf && <span className="tag-self">Anda</span>}
                  </div>
                  <span className="user-title">
                    {user.title} · Bergabung {formatDate(user.createdAt)}
                  </span>
                </div>
                <span className="user-email">
                  <MailIcon size={14} />
                  {user.email}
                </span>
                <span className={cn("role-badge", `role-${user.role}`)}>
                  {user.role === "admin" ? <ShieldIcon size={13} /> : null}
                  {ROLE_LABEL[user.role]}
                </span>
                <button
                  type="button"
                  className="icon-button icon-button-danger"
                  aria-label={`Hapus ${user.name}`}
                  title={isSelf ? "Tidak dapat menghapus akun sendiri" : "Hapus pengguna"}
                  disabled={isSelf}
                  onClick={() => setDeletingId(user.id)}
                >
                  <TrashIcon size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel panel-danger-zone">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Keamanan & Data</h3>
            <p className="panel-subtitle">Pengaturan penyimpanan data demo</p>
          </div>
        </div>
        <div className="danger-row">
          <div>
            <strong>Atur ulang data demo</strong>
            <p>
              Kembalikan seluruh data pelanggan dan pengguna ke kondisi awal. Semua perubahan akan
              hilang dan Anda akan keluar dari sesi saat ini.
            </p>
          </div>
          <button type="button" className="btn btn-danger-ghost" onClick={() => setResetOpen(true)}>
            Atur Ulang Data
          </button>
        </div>
      </section>

      <Modal
        open={formOpen}
        title="Tambah Pengguna Baru"
        description="Akun baru dapat langsung masuk menggunakan email dan kata sandi yang dibuat."
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Batal
            </button>
            <button type="submit" form="user-form" className="btn btn-primary">
              Simpan Pengguna
            </button>
          </>
        }
      >
        <form id="user-form" className="form-grid" onSubmit={submit} noValidate>
          <div className="field">
            <label htmlFor="uf-name">Nama Lengkap *</label>
            <input
              id="uf-name"
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder="Contoh: Nadia Putri"
              className={errors.name ? "input-error" : ""}
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>
          <div className="field">
            <label htmlFor="uf-email">Email *</label>
            <input
              id="uf-email"
              type="email"
              value={form.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="nama@eccocrm.id"
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>
          <div className="field">
            <label htmlFor="uf-title">Jabatan *</label>
            <input
              id="uf-title"
              value={form.title}
              onChange={(event) => setField("title", event.target.value)}
              placeholder="Contoh: Account Executive"
              className={errors.title ? "input-error" : ""}
            />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </div>
          <div className="field">
            <label htmlFor="uf-role">Peran</label>
            <select
              id="uf-role"
              value={form.role}
              onChange={(event) => setField("role", event.target.value as Role)}
            >
              <option value="staff">Staff — kelola pelanggan</option>
              <option value="admin">Admin — akses penuh</option>
            </select>
          </div>
          <div className="field field-full">
            <label htmlFor="uf-password">Kata Sandi *</label>
            <input
              id="uf-password"
              type="text"
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              placeholder="Minimal 6 karakter"
              className={errors.password ? "input-error" : ""}
            />
            {errors.password ? (
              <span className="field-error">{errors.password}</span>
            ) : (
              <span className="field-hint">
                Kata sandi ditampilkan agar mudah dibagikan ke anggota tim (khusus demo).
              </span>
            )}
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(targetUser)}
        size="sm"
        title="Hapus pengguna?"
        onClose={() => setDeletingId(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeletingId(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmDelete}>
              Ya, Hapus
            </button>
          </>
        }
      >
        {targetUser && (
          <div className="confirm-body">
            <span className="confirm-icon">
              <AlertIcon size={22} />
            </span>
            <p>
              Akun <strong>{targetUser.name}</strong> ({targetUser.email}) akan dihapus dan tidak
              dapat mengakses CRM lagi.
            </p>
          </div>
        )}
      </Modal>

      <Modal
        open={resetOpen}
        size="sm"
        title="Atur ulang data demo?"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setResetOpen(false)}>
              Batal
            </button>
            <button type="button" className="btn btn-danger" onClick={confirmReset}>
              Ya, Atur Ulang
            </button>
          </>
        }
      >
        <div className="confirm-body">
          <span className="confirm-icon">
            <AlertIcon size={22} />
          </span>
          <p>
            Semua pelanggan dan pengguna yang Anda tambahkan akan dihapus, lalu data awal demo
            dipulihkan. Anda akan diarahkan kembali ke halaman masuk.
          </p>
        </div>
      </Modal>
    </AppShell>
  );
}
