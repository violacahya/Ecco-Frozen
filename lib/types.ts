export type Role = "admin" | "staff" | "customer";
export type CustomerStatus = "aktif" | "prospek" | "nonaktif";
export type CustomerSegment = "distributor" | "retail" | "horeca" | "industri";
export type OrderStatus = "baru" | "diproses" | "dikirim" | "selesai";

/* ---------- Katalog produk & kasir (POS) ---------- */

export type ProductCategory = "Seafood" | "Daging" | "Olahan" | "Sayur";
/** Satuan jual bebas, mis. "pack", "kg", "Pack 500g", atau "Karton 10 kg". */
export type ProductUnit = string;
export type PaymentMethod = "tunai" | "qris" | "transfer";

export interface FrozenProduct {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: ProductUnit;
  price: number;
  minOrder: number;
  storageTemp: string;
  stock: number;
  badge: string;
  description: string;
}

/** Catatan barang masuk dari supplier untuk audit stok freezer. */
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  note: string;
  createdAt: string;
  createdBy: string;
}

/* ---------- Keuangan & arus kas ---------- */

export type ExpenseCategory =
  | "listrik_air"
  | "operasional"
  | "perlengkapan"
  | "gaji"
  | "lainnya";

/** Catatan pengeluaran operasional toko untuk laporan laba bersih. */
export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description: string;
  date: string;
  createdBy: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  unit: string;
  qty: number;
  price: number;
}

/**
 * Transaksi penjualan langsung (kasir). Terpisah dari `Order` yang dipakai
 * untuk permintaan pasokan B2B agar alur pesanan mitra tidak berubah.
 */
export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  company: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  deliveryDate: string;
  deliveryAddress: string;
  notes: string;
  coldChainTemp: string;
  createdAt: string;
  updatedAt: string;
  paymentMethod?: PaymentMethod;
  cashPaid?: number;
  change?: number;
  cashierName?: string;
}

export interface PosCartLine {
  product: FrozenProduct;
  qty: number;
}

export interface PosTransactionInput {
  customerId?: string;
  customerName?: string;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  cashPaid?: number;
  change?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  title: string;
  /** Untuk peran customer: id data pelanggan yang terhubung dengan akun. */
  customerId?: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  segment: CustomerSegment;
  status: CustomerStatus;
  value: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  userId: string;
  loginAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  product: string;
  quantity: number;
  notes: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt">;
export type UserInput = Omit<User, "id" | "createdAt">;
export type OrderInput = Pick<Order, "product" | "quantity" | "notes">;
export type ProductInput = Omit<FrozenProduct, "id">;

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  aktif: "Aktif",
  prospek: "Prospek",
  nonaktif: "Nonaktif",
};

export const SEGMENT_LABEL: Record<CustomerSegment, string> = {
  distributor: "Distributor",
  retail: "Retail",
  horeca: "HoReCa",
  industri: "Industri",
};

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  staff: "Staff",
  customer: "Pelanggan",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  baru: "Pesanan Baru",
  diproses: "Diproses",
  dikirim: "Dikirim",
  selesai: "Selesai",
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  "Seafood",
  "Daging",
  "Olahan",
  "Sayur",
];

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  tunai: "Tunai",
  qris: "QRIS",
  transfer: "Transfer Bank",
};

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  listrik_air: "Listrik & Air Freezer",
  operasional: "Operasional Toko",
  perlengkapan: "Perlengkapan & Kemasan",
  gaji: "Gaji Karyawan",
  lainnya: "Lain-lain",
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "listrik_air",
  "operasional",
  "perlengkapan",
  "gaji",
  "lainnya",
];

export const PRODUCT_OPTIONS = [
  "Nugget Ayam Premium",
  "Kentang Goreng Shoestring",
  "Daging Sapi Giling Beku",
  "Fillet Ikan Dori",
  "Sosis Ayam Beku",
  "Bakso Sapi Beku",
  "Udang Kupas Beku",
  "Mixed Vegetables Beku",
];
