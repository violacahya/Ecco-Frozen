"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { ExpenseModal } from "@/components/expense-modal";
import { useToast } from "@/components/toast";
import { EmptyState } from "@/components/ui";
import { useApp } from "@/lib/app-context";
import {
  EXPENSE_CATEGORY_LABEL,
  PAYMENT_METHOD_LABEL,
  type CustomerOrder,
  type ExpenseRecord,
} from "@/lib/types";
import { cn, formatIDR } from "@/lib/utils";
import {
  CheckCircleIcon,
  MinusIcon,
  PlusIcon,
  SparkIcon,
  TrendUpIcon,
  WalletIcon,
} from "@/components/icons";

type FlowFilter = "all" | "in" | "out";

const FLOW_TABS: Array<{ value: FlowFilter; label: string }> = [
  { value: "all", label: "Semua Arus Kas" },
  { value: "in", label: "Hanya Pemasukan" },
  { value: "out", label: "Hanya Pengeluaran" },
];

interface FlowRow {
  id: string;
  date: string;
  direction: "in" | "out";
  typeLabel: string;
  category: string;
  title: string;
  reference: string;
  amount: number;
  staff: string;
}

function formatFlowTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function share(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

function orderToFlow(order: CustomerOrder): FlowRow {
  return {
    id: order.id,
    date: order.createdAt,
    direction: "in",
    typeLabel: "Pemasukan Kasir",
    category: order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] : "Tunai",
    title: order.customerName || "Pelanggan Umum (Walk-in)",
    reference: order.orderNumber,
    amount: order.totalAmount,
    staff: order.cashierName ?? "Kasir",
  };
}

function expenseToFlow(expense: ExpenseRecord): FlowRow {
  return {
    id: expense.id,
    date: expense.date,
    direction: "out",
    typeLabel: "Pengeluaran Toko",
    category: EXPENSE_CATEGORY_LABEL[expense.category],
    title: expense.description,
    reference: "—",
    amount: expense.amount,
    staff: expense.createdBy,
  };
}

export default function FinancePage() {
  const { posOrders, expenses } = useApp();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FlowFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);

  const completedPos = useMemo(
    () => posOrders.filter((order) => order.status === "selesai"),
    [posOrders],
  );

  const metrics = useMemo(() => {
    const totalIncome = completedPos.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const cashTotal = completedPos
      .filter((order) => order.paymentMethod === "tunai")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const qrisTotal = completedPos
      .filter((order) => order.paymentMethod === "qris")
      .reduce((sum, order) => sum + order.totalAmount, 0);
    const transferTotal = completedPos
      .filter((order) => order.paymentMethod === "transfer")
      .reduce((sum, order) => sum + order.totalAmount, 0);

    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      transactionCount: completedPos.length,
      cashTotal,
      qrisTotal,
      transferTotal,
      digitalTotal: qrisTotal + transferTotal,
      cashCount: completedPos.filter((order) => order.paymentMethod === "tunai").length,
      digitalCount: completedPos.filter(
        (order) => order.paymentMethod === "qris" || order.paymentMethod === "transfer",
      ).length,
    };
  }, [completedPos, expenses]);

  const flowRows = useMemo(() => {
    const rows: FlowRow[] = [
      ...completedPos.map(orderToFlow),
      ...expenses.map(expenseToFlow),
    ];
    return rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [completedPos, expenses]);

  const visibleRows = useMemo(
    () => flowRows.filter((row) => filter === "all" || row.direction === filter),
    [flowRows, filter],
  );

  const profitable = metrics.netProfit >= 0;
  const cashShare = share(metrics.cashTotal, metrics.totalIncome);
  const digitalShare = share(metrics.digitalTotal, metrics.totalIncome);

  return (
    <AppShell
      title="Laporan Keuangan & Arus Kas"
      subtitle="Pemasukan kasir dan pengeluaran operasional terhitung otomatis dalam satu laporan laba bersih."
      actions={
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setModalOpen(true)}
        >
          <PlusIcon size={18} />
          Catat Pengeluaran Baru
        </button>
      }
    >
      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <TrendUpIcon size={20} />
            </span>
            <span className="stat-chip">Kasir POS</span>
          </div>
          <p className="stat-label">Total Pemasukan (Omset)</p>
          <p className="stat-value stat-value-sm">{formatIDR(metrics.totalIncome)}</p>
          <p className="stat-foot">Akumulasi nota kasir berstatus selesai</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-orange">
              <WalletIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-warm">{expenses.length} catatan</span>
          </div>
          <p className="stat-label">Total Pengeluaran</p>
          <p className="stat-value stat-value-sm">{formatIDR(metrics.totalExpense)}</p>
          <p className="stat-foot">Listrik, operasional, perlengkapan, dan gaji</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <SparkIcon size={20} />
            </span>
            <span
              className={cn(
                "stat-chip",
                profitable ? undefined : "stat-chip-red",
              )}
            >
              {profitable ? "Surplus" : "Defisit"}
            </span>
          </div>
          <p className="stat-label">Laba Bersih (Net Profit)</p>
          <p
            className={cn(
              "stat-value stat-value-sm",
              profitable ? "finance-profit-positive" : "finance-profit-negative",
            )}
          >
            {formatIDR(metrics.netProfit)}
          </p>
          <p className="stat-foot">Total pemasukan dikurangi pengeluaran</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-purple">
              <CheckCircleIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">Nota selesai</span>
          </div>
          <p className="stat-label">Transaksi Sukses</p>
          <p className="stat-value">{metrics.transactionCount}</p>
          <p className="stat-foot">Nota kasir yang berhasil diproses</p>
        </article>
      </section>

      <section className="panel finance-payment-panel">
        <div className="panel-head">
          <div>
            <h3 className="panel-title">Ringkasan Metode Pembayaran</h3>
            <p className="panel-subtitle">
              Pemasukan kasir berdasarkan metode pembayaran yang digunakan.
            </p>
          </div>
          <span className="panel-badge">{metrics.transactionCount} nota</span>
        </div>

        <div className="finance-payment-grid">
          <article className="finance-payment-card">
            <div className="finance-payment-head">
              <span className="finance-payment-icon finance-payment-icon-cash">
                <WalletIcon size={18} />
              </span>
              <div className="finance-payment-meta">
                <p className="finance-payment-label">Total Tunai</p>
                <p className="finance-payment-sub">Cash di laci kasir</p>
              </div>
              <span className="finance-payment-share">{cashShare}%</span>
            </div>
            <p className="finance-payment-value">{formatIDR(metrics.cashTotal)}</p>
            <div className="finance-payment-bar">
              <span
                className="finance-payment-fill finance-payment-fill-cash"
                style={{ width: `${cashShare}%` }}
              />
            </div>
            <p className="finance-payment-foot">{metrics.cashCount} transaksi tunai</p>
          </article>

          <article className="finance-payment-card">
            <div className="finance-payment-head">
              <span className="finance-payment-icon finance-payment-icon-digital">
                <TrendUpIcon size={18} />
              </span>
              <div className="finance-payment-meta">
                <p className="finance-payment-label">QRIS &amp; Transfer Bank</p>
                <p className="finance-payment-sub">Pemasukan non-tunai</p>
              </div>
              <span className="finance-payment-share">{digitalShare}%</span>
            </div>
            <p className="finance-payment-value">{formatIDR(metrics.digitalTotal)}</p>
            <div className="finance-payment-bar">
              <span
                className="finance-payment-fill finance-payment-fill-digital"
                style={{ width: `${digitalShare}%` }}
              />
            </div>
            <p className="finance-payment-foot">
              QRIS {formatIDR(metrics.qrisTotal)} · Transfer{" "}
              {formatIDR(metrics.transferTotal)} · {metrics.digitalCount} transaksi
            </p>
          </article>
        </div>
      </section>

      <section className="panel panel-table finance-flow-panel">
        <div className="finance-flow-head">
          <div>
            <h3 className="panel-title">Riwayat Arus Kas</h3>
            <p className="panel-subtitle">
              Pemasukan kasir dan pengeluaran toko digabung dalam satu catatan terpadu.
            </p>
          </div>
          <div className="pos-tabs" role="tablist" aria-label="Filter arus kas">
            {FLOW_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={filter === tab.value}
                className={cn("pos-tab", filter === tab.value && "pos-tab-active")}
                onClick={() => setFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {visibleRows.length === 0 ? (
          <EmptyState
            icon={<WalletIcon size={26} />}
            title="Belum ada arus kas"
            description="Transaksi kasir dan pengeluaran yang Anda catat akan muncul di sini."
          />
        ) : (
          <>
            <div className="table-wrap">
              <table className="data-table finance-flow-table">
                <thead>
                  <tr>
                    <th>Tanggal / Waktu</th>
                    <th>Jenis</th>
                    <th>Kategori / Metode</th>
                    <th>Keterangan / No. Nota</th>
                    <th className="cell-right">Jumlah</th>
                    <th>Petugas</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row) => {
                    const incoming = row.direction === "in";
                    return (
                      <tr key={row.id}>
                        <td className="cell-muted">{formatFlowTime(row.date)}</td>
                        <td>
                          <span
                            className={cn(
                              "finance-flow-type",
                              incoming ? "finance-flow-in" : "finance-flow-out",
                            )}
                          >
                            {incoming ? (
                              <TrendUpIcon size={14} />
                            ) : (
                              <MinusIcon size={14} />
                            )}
                            {row.typeLabel}
                          </span>
                        </td>
                        <td>
                          <span className="finance-flow-category">{row.category}</span>
                        </td>
                        <td>
                          <div className="finance-flow-desc">
                            <strong>{row.title}</strong>
                            <small>{row.reference}</small>
                          </div>
                        </td>
                        <td
                          className={cn(
                            "cell-right finance-amount",
                            incoming ? "finance-amount-in" : "finance-amount-out",
                          )}
                        >
                          {incoming ? "+" : "-"}
                          {formatIDR(row.amount)}
                        </td>
                        <td className="cell-muted">{row.staff}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p className="table-info">
                Menampilkan {visibleRows.length} dari {flowRows.length} transaksi
              </p>
            </div>
          </>
        )}
      </section>

      <ExpenseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(expense) => {
          setModalOpen(false);
          toast(
            `Pengeluaran "${expense.description}" sebesar ${formatIDR(
              expense.amount,
            )} berhasil dicatat.`,
          );
        }}
      />
    </AppShell>
  );
}
