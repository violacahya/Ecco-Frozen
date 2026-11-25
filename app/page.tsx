"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BarChart, DonutChart } from "@/components/charts";
import { Avatar, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import { SEGMENT_LABEL, type Customer, type CustomerSegment } from "@/lib/types";
import { compactIDR, cn, formatDate, formatIDR, relativeTime } from "@/lib/utils";
import {
  BuildingIcon,
  ChevronRightIcon,
  PlusIcon,
  SparkIcon,
  TrendUpIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/icons";
import { CustomerFormModal } from "@/components/customer-form-modal";

const STATUS_COLORS = {
  aktif: "#a9d63f",
  prospek: "#dbb0cf",
  nonaktif: "#c9c0d8",
};

export default function DashboardPage() {
  const { customers, currentUser } = useApp();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setTodayLabel(
      new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    );
  }, []);

  const stats = useMemo(() => {
    const total = customers.length;
    const aktif = customers.filter((c) => c.status === "aktif");
    const prospek = customers.filter((c) => c.status === "prospek");
    const nonaktif = customers.filter((c) => c.status === "nonaktif");
    const activeValue = aktif.reduce((sum, c) => sum + c.value, 0);
    const pipelineValue = prospek.reduce((sum, c) => sum + c.value, 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    const newThisMonth = customers.filter((c) => new Date(c.createdAt).getTime() >= monthStart).length;
    const newPrevMonth = customers.filter((c) => {
      const t = new Date(c.createdAt).getTime();
      return t >= prevMonthStart && t < monthStart;
    }).length;

    const months = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const next = new Date(now.getFullYear(), now.getMonth() - (4 - index), 1);
      const value = customers.filter((c) => {
        const t = new Date(c.createdAt).getTime();
        return t >= date.getTime() && t < next.getTime();
      }).length;
      return {
        label: date.toLocaleDateString("id-ID", { month: "short" }),
        value,
      };
    });

    return {
      total,
      aktif: aktif.length,
      prospek: prospek.length,
      nonaktif: nonaktif.length,
      activeValue,
      pipelineValue,
      newThisMonth,
      newPrevMonth,
      months,
    };
  }, [customers]);

  const segments = useMemo(() => {
    const order: CustomerSegment[] = ["distributor", "retail", "horeca", "industri"];
    return order.map((segment) => {
      const list = customers.filter((c) => c.segment === segment);
      return {
        segment,
        count: list.length,
        value: list.reduce((sum, c) => sum + c.value, 0),
      };
    });
  }, [customers]);

  const recent = useMemo(
    () =>
      [...customers]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5),
    [customers],
  );

  const maxSegment = Math.max(...segments.map((s) => s.value), 1);
  const growth =
    stats.newPrevMonth === 0
      ? stats.newThisMonth > 0
        ? 100
        : 0
      : Math.round(((stats.newThisMonth - stats.newPrevMonth) / stats.newPrevMonth) * 100);

  const firstName = currentUser?.name.split(" ")[0] ?? "";

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Ringkasan performa pelanggan, ${todayLabel || "hari ini"}.`}
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <PlusIcon size={18} />
          Tambah Pelanggan
        </button>
      }
    >
      <section className="welcome-banner">
        <div>
          <p className="welcome-eyebrow">
            <SparkIcon size={15} />
            Selamat datang kembali
          </p>
          <h2 className="welcome-title">Halo, {firstName} 👋</h2>
          <p className="welcome-text">
            Ada <strong>{stats.prospek} prospek</strong> yang menunggu tindak lanjut dengan potensi
            nilai <strong>{compactIDR(stats.pipelineValue)}</strong>. Yuk, jaga momentum penjualan
            minggu ini.
          </p>
        </div>
        <div className="welcome-stats">
          <div>
            <span>Pipeline aktif</span>
            <strong>{formatIDR(stats.pipelineValue)}</strong>
          </div>
          <div>
            <span>Pelanggan baru bulan ini</span>
            <strong>{stats.newThisMonth} pelanggan</strong>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <UsersIcon size={20} />
            </span>
            <span className={cn("stat-chip", growth < 0 && "stat-chip-red")}>
              <TrendUpIcon size={14} />
              {growth >= 0 ? "+" : ""}
              {growth}%
            </span>
          </div>
          <p className="stat-label">Total Pelanggan</p>
          <p className="stat-value">{stats.total}</p>
          <p className="stat-foot">{stats.newThisMonth} baru bulan ini</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <BuildingIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">
              {stats.total ? Math.round((stats.aktif / stats.total) * 100) : 0}% dari total
            </span>
          </div>
          <p className="stat-label">Pelanggan Aktif</p>
          <p className="stat-value">{stats.aktif}</p>
          <p className="stat-foot">{stats.nonaktif} pelanggan nonaktif</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-orange">
              <SparkIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-warm">Perlu follow-up</span>
          </div>
          <p className="stat-label">Prospek Berjalan</p>
          <p className="stat-value">{stats.prospek}</p>
          <p className="stat-foot">Potensi {compactIDR(stats.pipelineValue)}</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-purple">
              <WalletIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">Kontrak aktif</span>
          </div>
          <p className="stat-label">Nilai Pelanggan Aktif</p>
          <p className="stat-value stat-value-sm">{compactIDR(stats.activeValue)}</p>
          <p className="stat-foot">Total nilai kerja sama berjalan</p>
        </article>
      </section>

      <section className="grid-charts">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Pelanggan Baru</h3>
              <p className="panel-subtitle">6 bulan terakhir</p>
            </div>
            <span className="panel-badge">Total {stats.months.reduce((s, m) => s + m.value, 0)}</span>
          </div>
          <BarChart data={stats.months} />
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Distribusi Status</h3>
              <p className="panel-subtitle">Berdasarkan seluruh pelanggan</p>
            </div>
          </div>
          <DonutChart
            centerValue={String(stats.total)}
            centerLabel="Pelanggan"
            data={[
              { label: "Aktif", value: stats.aktif, color: STATUS_COLORS.aktif },
              { label: "Prospek", value: stats.prospek, color: STATUS_COLORS.prospek },
              { label: "Nonaktif", value: stats.nonaktif, color: STATUS_COLORS.nonaktif },
            ]}
          />
        </article>
      </section>

      <section className="grid-bottom">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Pelanggan Terbaru</h3>
              <p className="panel-subtitle">Aktivitas pembaruan terakhir</p>
            </div>
            <Link href="/customers" className="text-link">
              Lihat semua
              <ChevronRightIcon size={16} />
            </Link>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Segmen</th>
                  <th>Status</th>
                  <th>Nilai</th>
                  <th>Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((customer: Customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="person-cell">
                        <Avatar name={customer.name} id={customer.id} size="sm" />
                        <div>
                          <span className="person-name">{customer.name}</span>
                          <span className="person-sub">{customer.company}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="segment-text">{SEGMENT_LABEL[customer.segment]}</span>
                    </td>
                    <td>
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="cell-strong">{compactIDR(customer.value)}</td>
                    <td className="cell-muted">{relativeTime(customer.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Nilai per Segmen</h3>
              <p className="panel-subtitle">Total kontrak seluruh pelanggan</p>
            </div>
          </div>
          <ul className="segment-list">
            {segments.map((item) => (
              <li key={item.segment}>
                <div className="segment-row">
                  <span>{SEGMENT_LABEL[item.segment]}</span>
                  <strong>{compactIDR(item.value)}</strong>
                </div>
                <div className="progress">
                  <span
                    className={`progress-bar progress-${item.segment}`}
                    style={{ width: `${Math.max((item.value / maxSegment) * 100, item.value ? 4 : 0)}%` }}
                  />
                </div>
                <span className="segment-count">{item.count} pelanggan</span>
              </li>
            ))}
          </ul>
          <div className="panel-note">
            <span className="panel-note-icon">
              <TrendUpIcon size={16} />
            </span>
            <p>
              Segmen <strong>distributor</strong> menyumbang kontribusi nilai terbesar. Fokuskan
              upaya retensi pada segmen ini.
            </p>
          </div>
        </article>
      </section>

      <p className="page-footnote">
        Data terakhir diperbarui pada {formatDate(new Date().toISOString())} · Ecco Frozen CRM v1.1
      </p>

      <CustomerFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={(name) => {
          setFormOpen(false);
          toast(`Pelanggan "${name}" berhasil ditambahkan.`);
        }}
      />
    </AppShell>
  );
}
