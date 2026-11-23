export type Role = "admin" | "staff";
export type CustomerStatus = "aktif" | "prospek" | "nonaktif";
export type CustomerSegment = "distributor" | "retail" | "horeca" | "industri";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: Role;
  title: string;
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

export type CustomerInput = Omit<Customer, "id" | "createdAt" | "updatedAt">;
export type UserInput = Omit<User, "id" | "createdAt">;

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
};
