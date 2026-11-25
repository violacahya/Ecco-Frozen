"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OrderFormModal } from "@/components/order-form-modal";
import { EmptyState, OrderStatusBadge, StatusBadge } from "@/components/ui";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import { SEGMENT_LABEL, STATUS_LABEL } from "@/lib/types";
import { compactIDR, formatDate, formatIDR, relativeTime } from "@/lib/utils";
import {
  BoxIcon,
  ChevronRightIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  PlusIcon,
  SparkIcon,
  StoreIcon,
  TrendUpIcon,
  WalletIcon,
} from "@/components/icons";

export default function PortalPage() {
  const { currentUser, currentCustomer, orders } = useApp();
  const { toast } = useToast();
  const [formOpen, setFormOpen] = useState(false);

  const myOrders = useMemo(
    () =>
      orders
        .filter((order) => order.customerId === currentCustomer?.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, currentCustomer],
  );

  const stats = useMemo(() => {
    const active = myOrders.filter((order) => order.status !== "selesai");
    const volume = myOrders.reduce((sum, order) => sum + order.quantity, 0);
    return {
      total: myOrders.length,
      active: active.length,
      volume,
      lastOrder: myOrders[0]?.createdAt ?? null,
    };
  }, [myOrders]);

  const firstName = currentUser?.name.split(" ")[0] ?? "Mitra";

  if (!currentCustomer) {
    return (
      <AppShell title="Beranda Mitra" subtitle="Portal pelanggan Ecco Frozen.">
        <div className="panel">
          <EmptyState
            icon={<StoreIcon size={26} />}
            title="Data mitra belum terhubung"
            description="Akun Anda belum terhubung dengan data pelanggan. Silakan hubungi tim Ecco Frozen untuk melengkapi data kemitraan."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Beranda Mitra"
      subtitle={`Selamat datang di portal pelanggan Ecco Frozen, ${currentCustomer.company}.`}
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
          <PlusIcon size={18} />
          Ajukan Pesanan
        </button>
      }
    >
      <section className="welcome-banner welcome-banner-partner">
        <div>
          <p className="welcome-eyebrow">
            <SparkIcon size={15} />
            Portal Mitra Ecco Frozen
          </p>
          <h2 className="welcome-title">Halo, {firstName} 👋</h2>
          <p className="welcome-text">
            Status kemitraan Anda saat ini <strong>{STATUS_LABEL[currentCustomer.status]}</strong>{" "}
            dengan nilai
            kerja sama <strong>{compactIDR(currentCustomer.value)}</strong>. Ada{" "}
            <strong>{stats.active} pesanan aktif</strong> yang sedang diproses tim kami.
          </p>
        </div>
        <div className="welcome-stats">
          <div>
            <span>Status kemitraan</span>
            <strong>{STATUS_LABEL[currentCustomer.status]}</strong>
          </div>
          <div>
            <span>Total pesanan</span>
            <strong>{stats.total} pesanan</strong>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-blue">
              <BoxIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">Semua waktu</span>
          </div>
          <p className="stat-label">Total Pesanan</p>
          <p className="stat-value">{stats.total}</p>
          <p className="stat-foot">Pesanan yang pernah diajukan</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-orange">
              <TrendUpIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-warm">Sedang berjalan</span>
          </div>
          <p className="stat-label">Pesanan Aktif</p>
          <p className="stat-value">{stats.active}</p>
          <p className="stat-foot">Baru, diproses, atau dikirim</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-green">
              <StoreIcon size={20} />
            </span>
            <span className="stat-chip">{SEGMENT_LABEL[currentCustomer.segment]}</span>
          </div>
          <p className="stat-label">Total Volume</p>
          <p className="stat-value">
            {stats.volume.toLocaleString("id-ID")} <small className="stat-unit">kg</small>
          </p>
          <p className="stat-foot">Akumulasi seluruh pesanan</p>
        </article>

        <article className="stat-card">
          <div className="stat-top">
            <span className="stat-icon stat-icon-purple">
              <WalletIcon size={20} />
            </span>
            <span className="stat-chip stat-chip-muted">Kemitraan</span>
          </div>
          <p className="stat-label">Nilai Kerja Sama</p>
          <p className="stat-value stat-value-sm">{compactIDR(currentCustomer.value)}</p>
          <p className="stat-foot">Estimasi kontrak berjalan</p>
        </article>
      </section>

      <section className="grid-bottom">
        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Pesanan Terbaru</h3>
              <p className="panel-subtitle">Pantau status permintaan pasokan Anda</p>
            </div>
            <Link href="/portal/orders" className="text-link">
              Lihat semua
              <ChevronRightIcon size={16} />
            </Link>
          </div>

          {myOrders.length === 0 ? (
            <EmptyState
              icon={<BoxIcon size={26} />}
              title="Belum ada pesanan"
              description="Ajukan pesanan pertama Anda dan tim Ecco Frozen akan segera menghubungi Anda."
            />
          ) : (
            <ul className="order-list">
              {myOrders.slice(0, 4).map((order) => (
                <li key={order.id} className="order-list-item">
                  <span className="order-list-icon">
                    <BoxIcon size={18} />
                  </span>
                  <div className="order-list-main">
                    <strong>{order.product}</strong>
                    <small>
                      {order.quantity.toLocaleString("id-ID")} kg · {relativeTime(order.createdAt)}
                    </small>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <div className="panel-head">
            <div>
              <h3 className="panel-title">Informasi Mitra</h3>
              <p className="panel-subtitle">Data kemitraan Anda di Ecco Frozen</p>
            </div>
            <StatusBadge status={currentCustomer.status} />
          </div>
          <ul className="info-list">
            <li>
              <span className="info-icon">
                <StoreIcon size={16} />
              </span>
              <div>
                <span>Perusahaan</span>
                <strong>{currentCustomer.company}</strong>
              </div>
            </li>
            <li>
              <span className="info-icon">
                <MapPinIcon size={16} />
              </span>
              <div>
                <span>Kota</span>
                <strong>{currentCustomer.city}</strong>
              </div>
            </li>
            <li>
              <span className="info-icon">
                <MailIcon size={16} />
              </span>
              <div>
                <span>Email</span>
                <strong>{currentCustomer.email}</strong>
              </div>
            </li>
            <li>
              <span className="info-icon">
                <PhoneIcon size={16} />
              </span>
              <div>
                <span>Telepon</span>
                <strong>{currentCustomer.phone}</strong>
              </div>
            </li>
          </ul>
          <div className="panel-note">
            <span className="panel-note-icon">
              <SparkIcon size={16} />
            </span>
            <p>
              Mitra sejak <strong>{formatDate(currentCustomer.createdAt)}</strong>. Hubungi tim
              kami jika ada perubahan data atau kebutuhan pasokan mendesak.
            </p>
          </div>
        </article>
      </section>

      <section className="panel support-panel">
        <div>
          <span className="support-icon">
            <MailIcon size={20} />
          </span>
          <div>
            <h3 className="panel-title">Butuh bantuan?</h3>
            <p className="panel-subtitle">
              Tim mitra Ecco Frozen siap membantu setiap hari kerja, 08.00–17.00 WIB.
            </p>
          </div>
        </div>
        <div className="support-actions">
          <a href="mailto:mitra@eccofrozen.id" className="btn btn-ghost">
            <MailIcon size={16} />
            mitra@eccofrozen.id
          </a>
          <a href="tel:+622155550123" className="btn btn-ghost">
            <PhoneIcon size={16} />
            (021) 555-0123
          </a>
        </div>
      </section>

      <p className="page-footnote">
        Data terakhir diperbarui pada {formatDate(new Date().toISOString())} · Ecco Frozen Portal
        Mitra
      </p>

      <OrderFormModal
        open={formOpen}
        customerId={currentCustomer.id}
        onClose={() => setFormOpen(false)}
        onSaved={(product) => {
          setFormOpen(false);
          toast(`Pesanan "${product}" berhasil dikirim ke tim Ecco Frozen.`);
        }}
      />
    </AppShell>
  );
}
