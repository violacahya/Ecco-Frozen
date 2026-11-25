"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { OrderFormModal } from "@/components/order-form-modal";
import { EmptyState, OrderStatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/types";
import { formatDate, relativeTime } from "@/lib/utils";
import {
  BoxIcon,
  FilterIcon,
  PlusIcon,
  SearchIcon,
  StoreIcon,
} from "@/components/icons";

export default function PortalOrdersPage() {
  const { currentCustomer, orders } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"semua" | OrderStatus>("semua");
  const [formOpen, setFormOpen] = useState(false);

  const myOrders = useMemo(
    () => orders.filter((order) => order.customerId === currentCustomer?.id),
    [orders, currentCustomer],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return myOrders
      .filter((order) => {
        const matchesQuery =
          !query || [order.product, order.notes].join(" ").toLowerCase().includes(query);
        const matchesStatus = status === "semua" || order.status === status;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [myOrders, search, status]);

  const summary = useMemo(
    () => ({
      total: myOrders.length,
      active: myOrders.filter((order) => order.status !== "selesai").length,
      done: myOrders.filter((order) => order.status === "selesai").length,
    }),
    [myOrders],
  );

  if (!currentCustomer) {
    return (
      <AppShell title="Pesanan Saya" subtitle="Riwayat pesanan mitra Ecco Frozen.">
        <div className="panel">
          <EmptyState
            icon={<StoreIcon size={26} />}
            title="Data mitra belum terhubung"
            description="Akun Anda belum terhubung dengan data pelanggan. Silakan hubungi tim Ecco Frozen."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Pesanan Saya"
      subtitle="Ajukan dan pantau status pesanan pasokan frozen food Anda."
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <PlusIcon size={18} />
          Ajukan Pesanan
        </button>
      }
    >
      <section className="mini-stats">
        <div className="mini-stat">
          <span className="mini-stat-label">Total pesanan</span>
          <strong>{summary.total} pesanan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Sedang berjalan</span>
          <strong>{summary.active} pesanan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Selesai</span>
          <strong>{summary.done} pesanan</strong>
        </div>
      </section>

      <section className="panel panel-table">
        <div className="table-toolbar">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="search"
              placeholder="Cari produk atau catatan pesanan…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Cari pesanan"
            />
          </div>
          <div className="toolbar-filters">
            <span className="filter-icon" aria-hidden="true">
              <FilterIcon size={16} />
            </span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              aria-label="Filter status pesanan"
            >
              <option value="semua">Semua status</option>
              {Object.entries(ORDER_STATUS_LABEL).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BoxIcon size={26} />}
            title="Belum ada pesanan"
            description="Tidak ada pesanan yang cocok dengan pencarian Anda. Ajukan pesanan baru untuk memulai."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table-lg">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th className="cell-right">Jumlah</th>
                  <th>Catatan</th>
                  <th>Status</th>
                  <th>Diajukan</th>
                  <th>Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div className="person-cell">
                        <span className="order-cell-icon">
                          <BoxIcon size={17} />
                        </span>
                        <div>
                          <span className="person-name">{order.product}</span>
                          <span className="person-sub">ID {order.id.toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="cell-right cell-strong">
                      {order.quantity.toLocaleString("id-ID")} kg
                    </td>
                    <td className="cell-muted order-note-cell">{order.notes || "—"}</td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="cell-muted">{formatDate(order.createdAt)}</td>
                    <td className="cell-muted">{relativeTime(order.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="page-footnote">
        Pesanan baru akan dikonfirmasi oleh tim Ecco Frozen maksimal 1×24 jam kerja.
      </p>

      <OrderFormModal
        open={formOpen}
        customerId={currentCustomer.id}
        onClose={() => setFormOpen(false)}
        onSaved={(product) => {
          setFormOpen(false);
          toast(`Pesanan "${product}" berhasil dikirim.`);
        }}
      />
    </AppShell>
  );
}
