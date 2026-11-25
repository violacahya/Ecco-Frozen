export type Role = "admin" | "staff" | "customer";
export type CustomerStatus = "aktif" | "prospek" | "nonaktif";
export type CustomerSegment = "distributor" | "retail" | "horeca" | "industri";
export type OrderStatus = "baru" | "diproses" | "dikirim" | "selesai";

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
