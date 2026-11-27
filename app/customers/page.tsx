"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { CustomerFormModal } from "@/components/customer-form-modal";
import { CustomerPricesModal } from "@/components/customer-prices-modal";
import { Avatar, EmptyState, Modal, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import {
  SEGMENT_LABEL,
  STATUS_LABEL,
  type Customer,
  type CustomerSegment,
  type CustomerStatus,
} from "@/lib/types";
import { cn, compactIDR, formatDate, formatIDR } from "@/lib/utils";
import {
  AlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  EditIcon,
  FilterIcon,
  MailIcon,
  PhoneIcon,
  PlusIcon,
  PriceTagIcon,
  SearchIcon,
  TrashIcon,
  UsersIcon,
} from "@/components/icons";

const PAGE_SIZE = 8;

type SortKey = "recent" | "name" | "value";

export default function CustomersPage() {
  const { customers, customerPrices, deleteCustomer, isAdmin } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"semua" | CustomerStatus>("semua");
  const [segment, setSegment] = useState<"semua" | CustomerSegment>("semua");
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [pricingCustomer, setPricingCustomer] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);

  const priceCountByCustomer = useMemo(() => {
    const map = new Map<string, number>();
    customerPrices.forEach((entry) => {
      map.set(entry.customerId, (map.get(entry.customerId) ?? 0) + 1);
    });
    return map;
  }, [customerPrices]);

  useEffect(() => {
    setPage(1);
  }, [search, status, segment, sort]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = customers.filter((customer) => {
      const matchesQuery =
        !query ||
        [customer.name, customer.company, customer.email, customer.city, customer.phone]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = status === "semua" || customer.status === status;
      const matchesSegment = segment === "semua" || customer.segment === segment;
      return matchesQuery && matchesStatus && matchesSegment;
    });

    return list.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "value") return b.value - a.value;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [customers, search, status, segment, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const summary = useMemo(
    () => ({
      count: filtered.length,
      value: filtered.reduce((sum, c) => sum + c.value, 0),
      aktif: filtered.filter((c) => c.status === "aktif").length,
    }),
    [filtered],
  );

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditing(customer);
    setFormOpen(true);
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteCustomer(deleting.id);
    toast(`Pelanggan "${deleting.name}" telah dihapus.`, "info");
    setDeleting(null);
  };

  const exportCsv = () => {
    const header = ["Nama", "Perusahaan", "Email", "Telepon", "Kota", "Segmen", "Status", "Nilai", "Catatan"];
    const lines = filtered.map((c) =>
      [
        c.name,
        c.company,
        c.email,
        c.phone,
        c.city,
        SEGMENT_LABEL[c.segment],
        STATUS_LABEL[c.status],
        String(c.value),
        c.notes.replace(/\n/g, " "),
      ]
        .map((value) => `"${value.replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([`\uFEFF${[header.join(","), ...lines].join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ecco-frozen-pelanggan-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`${filtered.length} data pelanggan diekspor ke CSV.`);
  };

  return (
    <AppShell
      title="Pelanggan"
      subtitle="Kelola data pelanggan, status kerja sama, dan nilai kontrak dalam satu tempat."
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={exportCsv}>
            <DownloadIcon size={18} />
            Ekspor CSV
          </button>
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <PlusIcon size={18} />
            Tambah Pelanggan
          </button>
        </>
      }
    >
      <section className="mini-stats">
        <div className="mini-stat">
          <span className="mini-stat-label">Hasil filter</span>
          <strong>{summary.count} pelanggan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Pelanggan aktif</span>
          <strong>{summary.aktif} pelanggan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Total nilai</span>
          <strong>{formatIDR(summary.value)}</strong>
        </div>
      </section>

      <section className="panel panel-table">
        <div className="table-toolbar">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="search"
              placeholder="Cari nama, perusahaan, email, atau kota…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari pelanggan"
            />
          </div>

          <div className="toolbar-filters">
            <span className="filter-icon" aria-hidden="true">
              <FilterIcon size={16} />
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              aria-label="Filter status"
            >
              <option value="semua">Semua status</option>
              {Object.entries(STATUS_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={segment}
              onChange={(event) => setSegment(event.target.value as typeof segment)}
              aria-label="Filter segmen"
            >
              <option value="semua">Semua segmen</option>
              {Object.entries(SEGMENT_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              aria-label="Urutkan"
            >
              <option value="recent">Terbaru diperbarui</option>
              <option value="name">Nama A–Z</option>
              <option value="value">Nilai tertinggi</option>
            </select>
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<UsersIcon size={26} />}
            title="Pelanggan tidak ditemukan"
            description="Coba ubah kata kunci pencarian atau filter yang digunakan, atau tambahkan pelanggan baru."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table data-table-lg">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>Kontak</th>
                    <th>Kota</th>
                    <th>Segmen</th>
                    <th>Status</th>
                    <th className="cell-right">Nilai</th>
                    <th>Diperbarui</th>
                    <th className="cell-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((customer) => (
                    <tr key={customer.id}>
                      <td>
                        <div className="person-cell">
                          <Avatar name={customer.name} id={customer.id} size="md" />
                          <div>
                            <span className="person-name">{customer.name}</span>
                            <span className="person-sub">{customer.company}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="contact-cell">
                          <span>
                            <MailIcon size={14} />
                            {customer.email}
                          </span>
                          <span>
                            <PhoneIcon size={14} />
                            {customer.phone}
                          </span>
                        </div>
                      </td>
                      <td className="cell-muted">{customer.city}</td>
                      <td>
                        <span className={cn("segment-pill", `segment-${customer.segment}`)}>
                          {SEGMENT_LABEL[customer.segment]}
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={customer.status} />
                      </td>
                      <td className="cell-right cell-strong">{compactIDR(customer.value)}</td>
                      <td className="cell-muted">{formatDate(customer.updatedAt)}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className={cn(
                              "icon-button",
                              (priceCountByCustomer.get(customer.id) ?? 0) > 0 &&
                                "icon-button-accent",
                            )}
                            title={
                              (priceCountByCustomer.get(customer.id) ?? 0) > 0
                                ? `${priceCountByCustomer.get(customer.id)} harga khusus`
                                : "Atur harga khusus"
                            }
                            aria-label={`Atur harga khusus ${customer.name}`}
                            onClick={() => setPricingCustomer(customer)}
                          >
                            <PriceTagIcon size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            title="Edit pelanggan"
                            aria-label={`Edit ${customer.name}`}
                            onClick={() => openEdit(customer)}
                          >
                            <EditIcon size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button-danger"
                            title={isAdmin ? "Hapus pelanggan" : "Hanya admin dapat menghapus"}
                            aria-label={`Hapus ${customer.name}`}
                            disabled={!isAdmin}
                            onClick={() => setDeleting(customer)}
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p className="table-info">
                Menampilkan {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} dari {filtered.length} pelanggan
              </p>
              <div className="pagination">
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Halaman sebelumnya"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon size={17} />
                </button>
                {Array.from({ length: totalPages }).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn("page-number", currentPage === index + 1 && "page-number-active")}
                    onClick={() => setPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  type="button"
                  className="icon-button"
                  aria-label="Halaman berikutnya"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRightIcon size={17} />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <CustomerFormModal
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={(name, isEdit) => {
          setFormOpen(false);
          toast(
            isEdit
              ? `Data pelanggan "${name}" berhasil diperbarui.`
              : `Pelanggan "${name}" berhasil ditambahkan.`,
          );
        }}
      />

      <CustomerPricesModal
        open={Boolean(pricingCustomer)}
        customer={pricingCustomer}
        onClose={() => setPricingCustomer(null)}
        onSaved={(count) => {
          toast(
            count > 0
              ? `${count} harga khusus untuk "${pricingCustomer?.name}" berhasil disimpan.`
              : `Harga khusus "${pricingCustomer?.name}" dikosongkan — kembali ke harga normal.`,
          );
          setPricingCustomer(null);
        }}
      />

      <Modal
        open={Boolean(deleting)}
        size="sm"
        title="Hapus pelanggan?"
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
              Data <strong>{deleting.name}</strong> dari <strong>{deleting.company}</strong> akan
              dihapus permanen dari perangkat ini. Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
