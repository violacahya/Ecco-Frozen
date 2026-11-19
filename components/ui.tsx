"use client";

import { useEffect, type ReactNode } from "react";
import { avatarColor, cn, initials } from "@/lib/utils";
import { STATUS_LABEL, type CustomerStatus } from "@/lib/types";
import { CloseIcon } from "./icons";

export function Modal({
  open,
  title,
  description,
  onClose,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className={cn("modal", size === "sm" && "modal-sm")}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {description && <p className="modal-description">{description}</p>}
          </div>
          <button type="button" className="icon-button" aria-label="Tutup" onClick={onClose}>
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

export function Avatar({
  name,
  id,
  size = "md",
}: {
  name: string;
  id: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <span
      className={cn("avatar", `avatar-${size}`)}
      style={{ background: avatarColor(id) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function StatusBadge({ status }: { status: CustomerStatus }) {
  return <span className={cn("badge", `badge-${status}`)}>{STATUS_LABEL[status]}</span>;
}

export function EmptyState({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function Spinner({ label = "Memproses…" }: { label?: string }) {
  return (
    <span className="spinner-wrap">
      <span className="spinner" aria-hidden="true" />
      {label}
    </span>
  );
}
