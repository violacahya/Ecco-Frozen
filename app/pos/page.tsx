"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/ui";
import { PosCart } from "@/components/pos-cart";
import { PosPaymentModal } from "@/components/pos-payment-modal";
import { PosReceiptModal } from "@/components/pos-receipt-modal";
import { useToast } from "@/components/toast";
import { useApp } from "@/lib/app-context";
import {
  PRODUCT_CATEGORIES,
  type CustomerOrder,
  type FrozenProduct,
  type OrderItem,
  type PaymentMethod,
  type PosCartLine,
  type ProductCategory,
} from "@/lib/types";
import { cn, formatIDR } from "@/lib/utils";
import { BoxIcon, SearchIcon } from "@/components/icons";

type CategoryFilter = "Semua" | ProductCategory;

const CATEGORY_TABS: CategoryFilter[] = ["Semua", ...PRODUCT_CATEGORIES];

function ProductCard({
  product,
  inCart,
  onAdd,
}: {
  product: FrozenProduct;
  inCart: number;
  onAdd: () => void;
}) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock < 5;

  return (
    <button
      type="button"
      className={cn(
        "pos-product",
        outOfStock && "pos-product-out",
        inCart > 0 && "pos-product-active",
      )}
      onClick={onAdd}
      disabled={outOfStock}
      aria-label={
        outOfStock ? `${product.name} habis` : `Tambahkan ${product.name} ke keranjang`
      }
    >
      <span className="pos-product-top">
        {product.badge ? (
          <span className="pos-product-badge">{product.badge}</span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span
          className={cn(
            "pos-stock",
            outOfStock ? "pos-stock-out" : lowStock ? "pos-stock-low" : "pos-stock-ok",
          )}
          title={`Sisa stok ${product.stock} ${product.unit}`}
        >
          {outOfStock ? "Habis" : lowStock ? "Stok Menipis" : `Stok ${product.stock}`}
        </span>
      </span>

      <span className="pos-product-name">{product.name}</span>
      <span className="pos-product-desc">{product.description}</span>

      <span className="pos-product-foot">
        <span className="pos-price">
          {formatIDR(product.price)}
          <small>/{product.unit}</small>
        </span>
        {inCart > 0 ? (
          <span className="pos-in-cart">×{inCart}</span>
        ) : (
          <span className="pos-sku">{product.sku}</span>
        )}
      </span>
    </button>
  );
}

export default function PosPage() {
  const { products, customers, createPosTransaction } = useApp();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("Semua");
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [receipt, setReceipt] = useState<CustomerOrder | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = category === "Semua" || product.category === category;
      const matchesQuery =
        !query ||
        `${product.name} ${product.sku} ${product.description}`.toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, search, category]);

  const cartQty = useMemo(
    () => new Map(cart.map((line) => [line.product.id, line.qty])),
    [cart],
  );

  const totalQty = useMemo(() => cart.reduce((sum, line) => sum + line.qty, 0), [cart]);

  const total = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty * line.product.price, 0),
    [cart],
  );

  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === customerId) ?? null,
    [customers, customerId],
  );

  const addToCart = (product: FrozenProduct) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map((line) =>
          line.product.id === product.id ? { ...line, qty: line.qty + 1 } : line,
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const increase = (productId: string) => {
    setCart((prev) =>
      prev.map((line) => {
        if (line.product.id !== productId) return line;
        if (line.qty >= line.product.stock) return line;
        return { ...line, qty: line.qty + 1 };
      }),
    );
  };

  const decrease = (productId: string) => {
    setCart((prev) =>
      prev
        .map((line) =>
          line.product.id === productId ? { ...line, qty: line.qty - 1 } : line,
        )
        .filter((line) => line.qty > 0),
    );
  };

  const remove = (productId: string) => {
    setCart((prev) => prev.filter((line) => line.product.id !== productId));
  };

  const handleConfirm = (method: PaymentMethod, cashPaid: number, change: number) => {
    if (cart.length === 0) return;

    const items: OrderItem[] = cart.map((line) => ({
      productId: line.product.id,
      productName: line.product.name,
      unit: line.product.unit,
      qty: line.qty,
      price: line.product.price,
    }));

    const order = createPosTransaction({
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name,
      items,
      paymentMethod: method,
      cashPaid,
      change,
    });

    setPaymentOpen(false);
    setReceipt(order);
    setCart([]);
    setCustomerId("");
    toast(`Transaksi ${order.orderNumber} berhasil disimpan.`);
  };

  return (
    <AppShell
      title="Kasir (POS)"
      subtitle="Catat penjualan langsung, kelola keranjang, dan cetak struk pelanggan."
    >
      <div className="pos-layout">
        <section className="pos-catalog" aria-label="Katalog produk">
          <div className="pos-toolbar">
            <div className="search-box pos-search">
              <SearchIcon size={18} />
              <input
                type="search"
                placeholder="Cari nama produk atau SKU…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Cari produk"
              />
            </div>

            <div className="pos-tabs" role="tablist" aria-label="Filter kategori produk">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={category === tab}
                  className={cn("pos-tab", category === tab && "pos-tab-active")}
                  onClick={() => setCategory(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="panel">
              <EmptyState
                icon={<BoxIcon size={26} />}
                title="Produk tidak ditemukan"
                description="Coba kata kunci lain atau pilih kategori produk yang berbeda."
              />
            </div>
          ) : (
            <div className="pos-grid">
              {filtered.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  inCart={cartQty.get(product.id) ?? 0}
                  onAdd={() => addToCart(product)}
                />
              ))}
            </div>
          )}
        </section>

        <PosCart
          lines={cart}
          customers={customers}
          customerId={customerId}
          total={total}
          totalQty={totalQty}
          onCustomerChange={setCustomerId}
          onIncrease={increase}
          onDecrease={decrease}
          onRemove={remove}
          onCheckout={() => setPaymentOpen(true)}
        />
      </div>

      <PosPaymentModal
        open={paymentOpen}
        total={total}
        itemCount={totalQty}
        onClose={() => setPaymentOpen(false)}
        onConfirm={handleConfirm}
      />

      <PosReceiptModal
        order={receipt}
        open={Boolean(receipt)}
        onClose={() => setReceipt(null)}
        onNewTransaction={() => setReceipt(null)}
      />
    </AppShell>
  );
}
