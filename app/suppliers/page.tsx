"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { SupplierFormModal } from "@/components/supplier-form-modal";
import { SupplierWhatsAppModal } from "@/components/supplier-whatsapp-modal";
import { useToast } from "@/components/toast";
import { EmptyState, Modal } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { PRODUCT_CATEGORIES, type Supplier } from "@/lib/types";
import { cn, formatDate, formatPhoneDisplay, normalizeWhatsAppNumber } from "@/lib/utils";
import {
  AlertIcon,
  BoxIcon,
  BuildingIcon,
  EditIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  WhatsAppIcon,
} from "@/components/icons";

export default function SuppliersPage() {
  const { suppliers, deleteSupplier } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [waTarget, setWaTarget] = useState<Supplier | null>(null);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const stats = useMemo(() => {
    const categories = new Set(suppliers.flatMap((supplier) => supplier.suppliedCategories));
    const ordered = PRODUCT_CATEGORIES.filter((category) => categories.has(category));
    const waReady = suppliers.filter((supplier) =>
      /^62\d{8,13}$/.test(normalizeWhatsAppNumber(supplier.phone)),
    ).length;

    return { total: suppliers.length, categories: ordered, waReady };
  }, [suppliers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return suppliers;

    return suppliers.filter((supplier) =>
      [
        supplier.name,
        supplier.contactPerson,
        supplier.address,
        supplier.phone,
        supplier.email ?? "",
        supplier.suppliedCategories.join(" "),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [suppliers, search]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditing(supplier);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteSupplier(deleting.id);
    toast(`Pemasok "${deleting.name}" telah dihapus dari daftar SCM.`, "info");
    setDeleting(null);
  };

  return (
    <AppShell
      title="Manajemen Pemasok (SCM)"
      subtitle="Kelola mitra rantai pasok frozen food dan pesan restock langsung ke PIC pemasok via WhatsApp."
      actions={
        <button type="button" className="btn btn-primary" onClick={openAdd}>
          <PlusIcon size={18} />
          Tambah Pemasok Baru
        </button>
      }
    >
      <section className="stat-grid stat-grid-3">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <BuildingIcon size={20} />
            </span>
            <span className="stat-chip">Pilar SCM</span>
          </div>
          <p className="stat-label">Total Pemasok Terdaftar</p>
          <p className="stat-value">{stats.total}</p>
          <p className="stat-foot">Mitra pemasok makanan beku Ecco Frozen</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <BoxIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">
              {stats.categories.length} kategori
            </span>
          </div>
          <p className="stat-label">Mitra Kategori Suplai</p>
          <p className="stat-value">{stats.categories.length}</p>
          <p className="stat-foot">
            {stats.categories.length > 0
              ? stats.categories.join(" · ")
              : "Belum ada kategori terdaftar"}
          </p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-purple">
              <WhatsAppIcon size={20} />
            </span>
            <span className="stat-chip">Respon cepat</span>
          </div>
          <p className="stat-label">Pemesanan Langsung via WhatsApp</p>
          <p className="stat-value stat-value-sm">1-Klik WA</p>
          <p className="stat-foot">
            {stats.waReady} pemasok siap dihubungi tanpa aplikasi tambahan
          </p>
        </article>
      </section>

      <section className="panel panel-table">
        <div className="supplier-toolbar">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="search"
              placeholder="Cari nama perusahaan, PIC, atau kategori suplai…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari pemasok berdasarkan nama perusahaan, PIC, atau kategori"
            />
          </div>
          <span className="panel-badge">{filtered.length} pemasok</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BuildingIcon size={26} />}
            title="Pemasok tidak ditemukan"
            description="Coba kata kunci lain, atau daftarkan pemasok baru untuk melengkapi rantai pasok Ecco Frozen."
          />
        ) : (
          <div className="supplier-grid-wrap">
            <div className="supplier-grid">
              {filtered.map((supplier) => (
                <article key={supplier.id} className="supplier-card">
                  <div className="supplier-card-head">
                    <span className="supplier-logo" aria-hidden="true">
                      <BuildingIcon size={22} />
                    </span>
                    <div className="supplier-head-text">
                      <h3 className="supplier-name">{supplier.name}</h3>
                      <p className="supplier-pic">PIC: {supplier.contactPerson}</p>
                    </div>
                  </div>

                  <div className="supplier-tags">
                    {supplier.suppliedCategories.map((category) => (
                      <span
                        key={category}
                        className={cn("inv-cat", `inv-cat-${category.toLowerCase()}`)}
                      >
                        {category}
                      </span>
                    ))}
                  </div>

                  <ul className="supplier-meta">
                    <li>
                      <PhoneIcon size={15} />
                      <span>{formatPhoneDisplay(supplier.phone)}</span>
                    </li>
                    <li>
                      <MapPinIcon size={15} />
                      <span>{supplier.address}</span>
                    </li>
                    {supplier.email && (
                      <li>
                        <MailIcon size={15} />
                        <span>{supplier.email}</span>
                      </li>
                    )}
                  </ul>

                  {supplier.notes && <p className="supplier-note">{supplier.notes}</p>}

                  <div className="supplier-actions">
                    <button
                      type="button"
                      className="btn btn-whatsapp supplier-wa-btn"
                      onClick={() => setWaTarget(supplier)}
                    >
                      <WhatsAppIcon size={17} />
                      Pesan / Hubungi via WhatsApp
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      title="Edit pemasok"
                      aria-label={`Edit ${supplier.name}`}
                      onClick={() => openEdit(supplier)}
                    >
                      <EditIcon size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-button icon-button-danger"
                      title="Hapus pemasok"
                      aria-label={`Hapus ${supplier.name}`}
                      onClick={() => setDeleting(supplier)}
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>

                  <p className="supplier-since">
                    Mitra sejak {formatDate(supplier.createdAt)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <SupplierFormModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(name, isEdit) => {
          setFormOpen(false);
          toast(
            isEdit
              ? `Data pemasok "${name}" berhasil diperbarui.`
              : `Pemasok "${name}" berhasil ditambahkan.`,
          );
        }}
      />

      <SupplierWhatsAppModal
        open={Boolean(waTarget)}
        supplier={waTarget}
        onClose={() => setWaTarget(null)}
      />

      <Modal
        open={Boolean(deleting)}
        size="sm"
        title="Hapus pemasok?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setDeleting(null)}>
              Batal
            </button>
            <button type="button" className="btn btn-danger" onClick={handleDelete}>
              Ya, Hapus
            </button>
          </>
        }
      >
        {deleting && (
          <div className="confirm-body">
            <span className="confirm-icon">
              <AlertIcon size={22} />
            </span>
            <p>
              Pemasok <strong>{deleting.name}</strong> (PIC: {deleting.contactPerson}) akan
              dihapus permanen dari daftar SCM. Riwayat stok dan transaksi kasir tidak
              terpengaruh.
            </p>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
