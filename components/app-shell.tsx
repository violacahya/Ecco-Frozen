"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useApp } from "@/lib/app-context";
import { ROLE_LABEL } from "@/lib/types";
import { avatarColor, cn, initials } from "@/lib/utils";
import {
  BoxIcon,
  BuildingIcon,
  CartIcon,
  CloseIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  PackageIcon,
  SnowflakeIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: typeof DashboardIcon;
  adminOnly?: boolean;
};

const TEAM_NAV: NavItem[] = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/customers", label: "Pelanggan", icon: UsersIcon },
  { href: "/orders", label: "Pesanan", icon: BoxIcon },
  { href: "/pos", label: "Kasir (POS)", icon: CartIcon },
  { href: "/inventory", label: "Inventaris & Stok", icon: PackageIcon },
  { href: "/suppliers", label: "Pemasok (SCM)", icon: BuildingIcon },
  { href: "/finance", label: "Keuangan & Laba", icon: WalletIcon },
  { href: "/users", label: "Pengguna", icon: UserPlusIcon, adminOnly: true },
];

const CUSTOMER_NAV: NavItem[] = [
  { href: "/portal", label: "Beranda Mitra", icon: DashboardIcon },
  { href: "/portal/orders", label: "Pesanan Saya", icon: BoxIcon },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { ready, currentUser, isAdmin, logout } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isCustomer = currentUser?.role === "customer";
  const inPortal = pathname.startsWith("/portal");
  const needsRedirect =
    Boolean(currentUser) && (isCustomer ? !inPortal : inPortal);

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (currentUser.role === "customer" && !pathname.startsWith("/portal")) {
      router.replace("/portal");
    } else if (currentUser.role !== "customer" && pathname.startsWith("/portal")) {
      router.replace("/");
    }
  }, [ready, currentUser, pathname, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!ready || !currentUser || needsRedirect) {
    return (
      <div className="app-loading">
        <div className="app-loading-logo">
          <SnowflakeIcon size={28} />
        </div>
        <p>Memuat Ecco Frozen…</p>
      </div>
    );
  }

  const navItems = isCustomer ? CUSTOMER_NAV : TEAM_NAV;

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Tutup menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside className={cn("sidebar", sidebarOpen && "sidebar-open")}>
        <div className="sidebar-brand">
          <span className="brand-mark">
            <SnowflakeIcon size={22} />
          </span>
          <span className="brand-text">
            <strong>Ecco Frozen</strong>
            <small>{isCustomer ? "Portal Mitra" : "Frozen Food Partner"}</small>
          </span>
          <button
            type="button"
            className="sidebar-close"
            aria-label="Tutup menu"
            onClick={() => setSidebarOpen(false)}
          >
            <CloseIcon size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigasi utama">
          <p className="sidebar-label">{isCustomer ? "Portal Mitra" : "Menu Utama"}</p>
          {navItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-link", active && "nav-link-active")}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={19} />
                <span>{item.label}</span>
                {active && <span className="nav-dot" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-card">
          <span className="sidebar-card-icon">
            <SnowflakeIcon size={18} />
          </span>
          <p className="sidebar-card-title">{isCustomer ? "Portal Pelanggan" : "Mode Demo"}</p>
          <p className="sidebar-card-text">
            {isCustomer
              ? "Pantau kerja sama dan ajukan pesanan langsung ke tim Ecco Frozen."
              : "Data tersimpan otomatis di penyimpanan browser perangkat ini."}
          </p>
        </div>

        <div className="sidebar-user">
          <span
            className="avatar avatar-md"
            style={{ background: avatarColor(currentUser.id) }}
            aria-hidden="true"
          >
            {initials(currentUser.name)}
          </span>
          <span className="sidebar-user-meta">
            <strong>{currentUser.name}</strong>
            <small>{ROLE_LABEL[currentUser.role]}</small>
          </span>
          <button
            type="button"
            className="icon-button icon-button-dark"
            title="Keluar"
            aria-label="Keluar"
            onClick={logout}
          >
            <LogoutIcon size={18} />
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-button menu-button"
            aria-label="Buka menu"
            onClick={() => setSidebarOpen(true)}
          >
            <MenuIcon size={20} />
          </button>
          <div className="topbar-context">
            <span className="topbar-eyebrow">Ecco Frozen</span>
            <span className="topbar-title">{title}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span
              className="avatar avatar-sm topbar-avatar"
              style={{ background: avatarColor(currentUser.id) }}
              title={currentUser.name}
            >
              {initials(currentUser.name)}
            </span>
          </div>
        </header>

        <main className="page">
          <div className="page-head">
            <div>
              <h1 className="page-title">{title}</h1>
              {subtitle && <p className="page-subtitle">{subtitle}</p>}
            </div>
            {actions && <div className="page-actions">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
