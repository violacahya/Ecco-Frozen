"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Avatar, EmptyState, Modal } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import {
  ORDER_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  type Order,
  type OrderStatus,
} from "@/lib/types";
import { formatDate, formatIDR, relativeTime } from "@/lib/utils";
import {
  AlertIcon,
  BoxIcon,
  CartIcon,
  FilterIcon,
  SearchIcon,
  TrashIcon,
} from "@/components/icons";

export default function OrdersPage() {
  const { orders, posOrders, customers, isAdmin, updateOrderStatus, deleteOrder } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"semua" | OrderStatus>("semua");
  const [deleting, setDeleting] = useState<Order | null>(null);

  const customerMap = useMemo(
    () => new Map(customers.map((customer) => [customer.id, customer])),
    [customers],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return orders
      .filter((order) => {
        const customer = customerMap.get(order.customerId);
        const matchesQuery =
          !query ||
          [order.product, order.notes, customer?.name, customer?.company]
            .join(" ")
            .toLowerCase()
            .includes(query);
        const matchesStatus = status === "semua" || order.status === status;
        return matchesQuery && matchesStatus;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [orders, customerMap, search, status]);

  const summary = useMemo(
    () => ({
      total: orders.length,
      baru: orders.filter((order) => order.status === "baru").length,
      proses: orders.filter((order) => order.status === "diproses" || order.status === "dikirim")
        .length,
      selesai: orders.filter((order) => order.status === "selesai").length,
    }),
    [orders],
  );

  const changeStatus = (order: Order, next: OrderStatus) => {
    updateOrderStatus(order.id, next);
    toast(`Status pesanan "${order.product}" diubah ke ${ORDER_STATUS_LABEL[next]}.`, "info");
  };

  const handleDelete = () => {
    if (!deleting) return;
    deleteOrder(deleting.id);
    toast(`Pesanan "${deleting.product}" telah dihapus.`, "info");
    setDeleting(null);
  };

  return (
    <AppShell
      title="Pesanan"
      subtitle="Kelola permintaan pasokan dari mitra dan perbarui status pengirimannya."
    >
      <section className="mini-stats mini-stats-4">
        <div className="mini-stat">
          <span className="mini-stat-label">Total pesanan</span>
          <strong>{summary.total} pesanan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Pesanan baru</span>
          <strong>{summary.baru} pesanan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Sedang diproses</span>
          <strong>{summary.proses} pesanan</strong>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Selesai</span>
          <strong>{summary.selesai} pesanan</strong>
        </div>
      </section>

      <section className="panel panel-table">
        <div className="table-toolbar">
          <div className="search-box">
            <SearchIcon size={18} />
            <input
              type="search"
              placeholder="Cari produk, catatan, atau nama mitra…"
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
            title="Pesanan tidak ditemukan"
            description="Coba ubah kata kunci pencarian atau filter status yang digunakan."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table data-table-lg">
              <thead>
                <tr>
                  <th>Mitra</th>
                  <th>Produk</th>
                  <th className="cell-right">Jumlah</th>
                  <th>Status</th>
                  <th>Diajukan</th>
                  <th>Diperbarui</th>
                  {isAdmin && <th className="cell-right">Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => {
                  const customer = customerMap.get(order.customerId);
                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="person-cell">
                          <Avatar
                            name={customer?.name ?? "Mitra"}
                            id={order.customerId}
                            size="sm"
                          />
                          <div>
                            <span className="person-name">{customer?.name ?? "Mitra"}</span>
                            <span className="person-sub">{customer?.company ?? "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="order-product-cell">
                          <span>{order.product}</span>
                          {order.notes && <small>{order.notes}</small>}
                        </div>
                      </td>
                      <td className="cell-right cell-strong">
                        {order.quantity.toLocaleString("id-ID")} kg
                      </td>
                      <td>
                        <select
                          className={`status-select status-${order.status}`}
                          value={order.status}
                          onChange={(event) =>
                            changeStatus(order, event.target.value as OrderStatus)
                          }
                          aria-label={`Status pesanan ${order.product}`}
                        >
                          {Object.entries(ORDER_STATUS_LABEL).map(([key, label]) => (
                            <option key={key} value={key}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="cell-muted">{formatDate(order.createdAt)}</td>
                      <td className="cell-muted">{relativeTime(order.updatedAt)}</td>
                      {isAdmin && (
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="icon-button icon-button-danger"
                              title="Hapus pesanan"
                              aria-label={`Hapus pesanan ${order.product}`}
                              onClick={() => setDeleting(order)}
                            >
                              <TrashIcon size={16} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel panel-table pos-history-panel">
        <div className="panel-head pos-history-head">
          <div>
            <h3 className="panel-title">Transaksi Kasir (POS)</h3>
            <p className="panel-subtitle">
              Penjualan langsung yang diselesaikan melalui halaman kasir
            </p>
          </div>
          <span className="panel-badge">{posOrders.length} transaksi</span>
        </div>

        {posOrders.length === 0 ? (
          <EmptyState
            icon={<CartIcon size={26} />}
            title="Belum ada transaksi kasir"
            description="Transaksi yang diselesaikan di halaman Kasir (POS) akan muncul di sini."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>No. Transaksi</th>
                  <th>Pelanggan</th>
                  <th>Item</th>
                  <th className="cell-right">Total</th>
                  <th>Metode</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {posOrders.slice(0, 8).map((order) => {
                  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);
                  return (
                    <tr key={order.id}>
                      <td className="cell-strong">{order.orderNumber}</td>
                      <td>
                        <div className="pos-history-customer">
                          <span className="person-name">{order.customerName}</span>
                          <span className="person-sub">{order.company}</span>
                        </div>
                      </td>
                      <td className="cell-muted">
                        {order.items.length} produk · {itemCount} item
                      </td>
                      <td className="cell-right cell-strong">
                        {formatIDR(order.totalAmount)}
                      </td>
                      <td>
                        {order.paymentMethod
                          ? PAYMENT_METHOD_LABEL[order.paymentMethod]
                          : "—"}
                      </td>
                      <td className="cell-muted">{relativeTime(order.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="page-footnote">
        Perubahan status langsung terlihat di portal mitra pelanggan terkait.
      </p>

      <Modal
        open={Boolean(deleting)}
        size="sm"
        title="Hapus pesanan?"
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
              Pesanan <strong>{deleting.product}</strong> sebanyak{" "}
              <strong>{deleting.quantity.toLocaleString("id-ID")} kg</strong> akan dihapus permanen.
            </p>
          </div>
        )}
      </Modal>
    </AppShell>
  );
}
