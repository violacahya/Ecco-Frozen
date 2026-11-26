"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import { cn, formatDate, formatIDR, relativeTime } from "@/lib/utils";
import {
  AlertIcon,
  BoxIcon,
  CartIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  PackageIcon,
  SparkIcon,
  TrendUpIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";

/** Ambang batas stok aman, selaras dengan halaman Inventaris & Stok. */
const LOW_STOCK_THRESHOLD = 10;

type StockLevel = "low" | "out";

const STOCK_LABEL: Record<StockLevel, string> = {
  low: "Menipis",
  out: "Habis",
};

function stockLevel(stock: number): StockLevel {
  return stock <= 0 ? "out" : "low";
}

function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function greetingForHour(hour: number): string {
  if (hour < 11) return "Pagi";
  if (hour < 15) return "Siang";
  if (hour < 19) return "Sore";
  return "Malam";
}

/** Waktu relatif ringkas untuk aktivitas hari ini (menit/jam), lalu fallback ke hari. */
function formatRelativeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return "Baru saja";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} menit lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return relativeTime(iso);
}

/** Membulatkan nilai maksimum chart ke angka "cantik" agar label sumbu rapi. */
function niceCeil(value: number): number {
  if (value <= 0) return 0;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const steps = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
  const step = steps.find((candidate) => normalized <= candidate) ?? 10;
  return step * magnitude;
}

/** Label sumbu Y yang ringkas agar nominal Rupiah tetap terbaca di chart. */
function formatAxisValue(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (value >= 1_000_000) {
    const digits = value >= 10_000_000 ? 0 : 1;
    return `${(value / 1_000_000).toFixed(digits).replace(".", ",")} jt`;
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return String(Math.round(value));
}

function SalesBarChart({
  data,
}: {
  data: Array<{ label: string; fullLabel: string; value: number }>;
}) {
  const width = 560;
  const height = 240;
  const padding = { top: 18, right: 14, bottom: 36, left: 54 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;
  const peak = Math.max(...data.map((item) => item.value));
  const max = niceCeil(peak);
  const ticks = 4;
  const slot = innerW / Math.max(data.length, 1);
  const barWidth = Math.min(40, slot * 0.5);
  const scaleMax = max || 1;

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        role="img"
        aria-label="Grafik penjualan kasir 7 hari terakhir"
      >
        <defs>
          <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dcf68a" />
            <stop offset="100%" stopColor="#a9d63f" />
          </linearGradient>
        </defs>

        {Array.from({ length: ticks + 1 }).map((_, index) => {
          const value = (max / ticks) * index;
          const y = padding.top + innerH - (value / scaleMax) * innerH;
          return (
            <g key={index}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#f4ecf2"
                strokeDasharray={index === 0 ? "0" : "4 5"}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="chart-tick"
              >
                {max === 0 ? "0" : formatAxisValue(value)}
              </text>
            </g>
          );
        })}

        {data.map((item, index) => {
          const barH = (item.value / scaleMax) * innerH;
          const x = padding.left + slot * index + (slot - barWidth) / 2;
          const y = padding.top + innerH - barH;
          return (
            <g key={`${item.label}-${index}`}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barH, 2)}
                rx={Math.min(barWidth / 2.4, 10)}
                fill="url(#salesBarGradient)"
                className="chart-bar"
              >
                <title>{`${item.fullLabel}: ${formatIDR(item.value)}`}</title>
              </rect>
              <text
                x={x + barWidth / 2}
                y={padding.top + innerH + 22}
                textAnchor="middle"
                className="chart-label"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {peak === 0 && (
          <text
            x={padding.left + innerW / 2}
            y={padding.top + innerH / 2 - 4}
            textAnchor="middle"
            className="chart-empty-note"
          >
            Belum ada penjualan kasir dalam 7 hari terakhir
          </text>
        )}
      </svg>
    </div>
  );
}

export default function DashboardPage() {
  const { customers, orders, products, posOrders, expenses, currentUser } = useApp();
  const [todayLabel, setTodayLabel] = useState("");
  const [greeting, setGreeting] = useState("Pagi");

  useEffect(() => {
    const now = new Date();
    setGreeting(greetingForHour(now.getHours()));
    setTodayLabel(
      now.toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const completedPos = useMemo(
    () => posOrders.filter((order) => order.status === "selesai"),
    [posOrders],
  );

  const metrics = useMemo(() => {
    const today = dayKey(new Date());
    const todayOrders = completedPos.filter(
      (order) => dayKey(new Date(order.createdAt)) === today,
    );

    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalRevenue = completedPos.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const netProfit = totalRevenue - totalExpense;

    const lowStock = products.filter(
      (product) => product.stock > 0 && product.stock < LOW_STOCK_THRESHOLD,
    );
    const outOfStock = products.filter((product) => product.stock === 0);
    const activePartnerOrders = orders.filter((order) => order.status !== "selesai");
    const activeCustomers = customers.filter((customer) => customer.status === "aktif");

    return {
      todayCount: todayOrders.length,
      todayRevenue,
      totalRevenue,
      totalExpense,
      netProfit,
      completedCount: completedPos.length,
      lowStock,
      outOfStock,
      stockAlertCount: lowStock.length + outOfStock.length,
      activePartnerOrders,
      activeCustomers,
    };
  }, [completedPos, expenses, products, orders, customers]);

  const salesSeries = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - (6 - index),
      );
      const key = dayKey(date);
      const value = completedPos
        .filter((order) => dayKey(new Date(order.createdAt)) === key)
        .reduce((sum, order) => sum + order.totalAmount, 0);

      return {
        label: date.toLocaleDateString("id-ID", { weekday: "short" }),
        fullLabel: date.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "short",
        }),
        value,
      };
    });
  }, [completedPos]);

  const weekRevenue = useMemo(
    () => salesSeries.reduce((sum, item) => sum + item.value, 0),
    [salesSeries],
  );

  const recentTransactions = useMemo(
    () =>
      [...completedPos]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [completedPos],
  );

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((product) => product.stock < LOW_STOCK_THRESHOLD)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 5),
    [products],
  );

  const firstName = currentUser?.name.split(" ")[0] ?? "Tim";
  const profitable = metrics.netProfit >= 0;
  const activeShare = customers.length
    ? Math.round((metrics.activeCustomers.length / customers.length) * 100)
    : 0;

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Ringkasan operasional Ecco Frozen, ${todayLabel || "hari ini"}.`}
      actions={
        <Link href="/pos" className="btn btn-primary">
          <CartIcon size={18} />
          Buka Kasir
        </Link>
      }
    >
      {/* A. Greeting */}
      <section className="welcome-banner">
        <div>
          <p className="welcome-eyebrow">
            <SparkIcon size={15} />
            {todayLabel || "Hari ini"}
          </p>
          <h2 className="welcome-title">
            Selamat {greeting}, {firstName}! 👋
          </h2>
          <p className="welcome-text">
            Hari ini tercatat <strong>{metrics.todayCount} transaksi kasir</strong> dengan omset{" "}
            <strong>{formatIDR(metrics.todayRevenue)}</strong>. Ada{" "}
            <strong>{metrics.activePartnerOrders.length} pesanan mitra</strong> yang belum selesai
            dan <strong>{metrics.stockAlertCount} produk</strong> yang perlu perhatian stok.
          </p>
        </div>
        <div className="welcome-stats">
          <div>
            <span>Omset hari ini</span>
            <strong>{formatIDR(metrics.todayRevenue)}</strong>
          </div>
          <div>
            <span>Laba bersih</span>
            <strong>{formatIDR(metrics.netProfit)}</strong>
          </div>
        </div>
      </section>

      {/* B. Enam kartu metrik utama */}
      <section className="dashboard-stat-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <CartIcon size={20} />
            </span>
            <span className="stat-chip">{metrics.todayCount} transaksi</span>
          </div>
          <p className="stat-label">Penjualan Hari Ini</p>
          <p className="stat-value stat-value-sm">{formatIDR(metrics.todayRevenue)}</p>
          <p className="stat-foot">Nota kasir selesai hari ini</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <TrendUpIcon size={20} />
            </span>
            <span className="stat-chip">Kasir POS</span>
          </div>
          <p className="stat-label">Total Omset Keseluruhan</p>
          <p className="stat-value stat-value-sm">{formatIDR(metrics.totalRevenue)}</p>
          <p className="stat-foot">{metrics.completedCount} transaksi selesai</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-purple">
              <WalletIcon size={20} />
            </span>
            <span className={cn("stat-chip", !profitable && "stat-chip-red")}>
              {profitable ? "Surplus" : "Defisit"}
            </span>
          </div>
          <p className="stat-label">Laba Bersih</p>
          <p
            className={cn(
              "stat-value stat-value-sm",
              profitable ? "finance-profit-positive" : "finance-profit-negative",
            )}
          >
            {formatIDR(metrics.netProfit)}
          </p>
          <p className="stat-foot">Omset kasir dikurangi pengeluaran</p>
        </article>

        <Link
          href="/inventory"
          className="stat-card stat-card-link"
          aria-label="Lihat peringatan stok di halaman inventaris"
        >
          <div className="stat-top">
            <span className="stat-icon stat-icon-orange">
              <AlertIcon size={20} />
            </span>
            <span
              className={cn(
                "stat-chip",
                metrics.stockAlertCount === 0
                  ? "stat-chip-muted"
                  : metrics.outOfStock.length > 0
                    ? "stat-chip-red"
                    : "stat-chip-warm",
              )}
            >
              {metrics.stockAlertCount === 0 ? "Stok aman" : "Perlu restock"}
            </span>
          </div>
          <p className="stat-label">Peringatan Stok</p>
          <p
            className={cn(
              "stat-value",
              metrics.stockAlertCount > 0 &&
                (metrics.outOfStock.length > 0 ? "inv-stock-out" : "inv-stock-low"),
            )}
          >
            {metrics.stockAlertCount}
          </p>
          <p className="stat-foot">
            {metrics.lowStock.length} menipis · {metrics.outOfStock.length} habis
          </p>
        </Link>

        <Link
          href="/orders"
          className="stat-card stat-card-link"
          aria-label="Lihat pesanan mitra di halaman pesanan"
        >
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <BoxIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">Portal mitra</span>
          </div>
          <p className="stat-label">Pesanan Mitra Aktif</p>
          <p className="stat-value">{metrics.activePartnerOrders.length}</p>
          <p className="stat-foot">Belum berstatus selesai</p>
        </Link>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <UsersIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">{activeShare}% dari total</span>
          </div>
          <p className="stat-label">Total Pelanggan Aktif</p>
          <p className="stat-value">{metrics.activeCustomers.length}</p>
          <p className="stat-foot">Dari {customers.length} pelanggan terdaftar</p>
        </article>
      </section>

      {/* C. Grafik penjualan dan daftar operasional */}
      <section className="dashboard-main-grid">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Penjualan 7 Hari Terakhir</h3>
              <p className="panel-subtitle">Total omset kasir per hari</p>
            </div>
            <span className="panel-badge">7 hari · {formatIDR(weekRevenue)}</span>
          </div>
          <SalesBarChart data={salesSeries} />
        </article>

        <div className="dashboard-side-stack">
          <article className="panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">5 Transaksi Kasir Terakhir</h3>
                <p className="panel-subtitle">Nota terbaru dari meja kasir</p>
              </div>
              <Link href="/orders" className="text-link">
                Lihat semua
                <ChevronRightIcon size={16} />
              </Link>
            </div>

            {recentTransactions.length === 0 ? (
              <EmptyState
                icon={<CartIcon size={26} />}
                title="Belum ada transaksi"
                description="Transaksi yang diselesaikan di halaman Kasir (POS) akan muncul di sini."
              />
            ) : (
              <ul className="order-list">
                {recentTransactions.map((order) => {
                  const customerLabel =
                    order.customerId === "walk-in"
                      ? "Umum"
                      : order.customerName?.trim() || "Umum";
                  return (
                    <li key={order.id} className="order-list-item">
                      <span className="order-list-icon">
                        <CartIcon size={18} />
                      </span>
                      <div className="order-list-main">
                        <strong>{order.orderNumber}</strong>
                        <small>
                          {customerLabel} · {formatRelativeShort(order.createdAt)}
                        </small>
                      </div>
                      <span className="dashboard-list-amount">
                        {formatIDR(order.totalAmount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>

          <article className="panel">
            <div className="panel-head">
              <div>
                <h3 className="panel-title">Produk Stok Menipis</h3>
                <p className="panel-subtitle">Butuh restock segera</p>
              </div>
              <Link href="/inventory" className="text-link">
                Lihat inventaris
                <ChevronRightIcon size={16} />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <EmptyState
                icon={<CheckCircleIcon size={26} />}
                title="Stok aman"
                description="Semua produk memiliki stok di atas ambang batas restock."
              />
            ) : (
              <ul className="order-list">
                {lowStockProducts.map((product) => {
                  const level = stockLevel(product.stock);
                  return (
                    <li key={product.id} className="order-list-item">
                      <span className="order-list-icon">
                        <PackageIcon size={18} />
                      </span>
                      <div className="order-list-main">
                        <strong>{product.name}</strong>
                        <small>
                          Sisa {product.stock} {product.unit} · {product.sku}
                        </small>
                      </div>
                      <span className={cn("badge", `stock-badge-${level}`)}>
                        {STOCK_LABEL[level]}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </article>
        </div>
      </section>

      <p className="page-footnote">
        Data terakhir diperbarui pada {todayLabel || formatDate(new Date().toISOString())} · Ecco
        Frozen ERP v1.2
      </p>
    </AppShell>
  );
}
