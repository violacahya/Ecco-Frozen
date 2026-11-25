"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SEED_CUSTOMERS, SEED_ORDERS, SEED_USERS } from "./seed";
import type {
  Customer,
  CustomerInput,
  Order,
  OrderInput,
  OrderStatus,
  Session,
  User,
  UserInput,
} from "./types";
import { uid } from "./utils";

const KEYS = {
  users: "ecco_crm_users_v1",
  customers: "ecco_crm_customers_v1",
  orders: "ecco_crm_orders_v1",
  session: "ecco_crm_session_v1",
};

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage penuh atau diblokir: abaikan agar UI tetap berjalan.
  }
}

/**
 * Memastikan akun demo pelanggan (dan data pelanggan yang terhubung) selalu
 * tersedia, termasuk untuk pengguna yang sudah memiliki data lama di browser.
 */
function mergeDemoCustomerAccounts(users: User[], customers: Customer[]) {
  const nextUsers = [...users];
  const nextCustomers = [...customers];

  SEED_USERS.filter((user) => user.role === "customer").forEach((seedUser) => {
    if (!nextUsers.some((u) => u.email.toLowerCase() === seedUser.email.toLowerCase())) {
      nextUsers.push(seedUser);
    }
    if (seedUser.customerId && !nextCustomers.some((c) => c.id === seedUser.customerId)) {
      const seedCustomer = SEED_CUSTOMERS.find((c) => c.id === seedUser.customerId);
      if (seedCustomer) nextCustomers.push(seedCustomer);
    }
  });

  return { users: nextUsers, customers: nextCustomers };
}

interface LoginResult {
  ok: boolean;
  error?: string;
  user?: User;
}

interface AppContextValue {
  ready: boolean;
  users: User[];
  customers: Customer[];
  orders: Order[];
  currentUser: User | null;
  currentCustomer: Customer | null;
  isAdmin: boolean;
  isStaff: boolean;
  isCustomer: boolean;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, input: CustomerInput) => void;
  deleteCustomer: (id: string) => void;
  addOrder: (customerId: string, input: OrderInput) => Order;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
  addUser: (input: UserInput) => LoginResult;
  deleteUser: (id: string) => LoginResult;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUsers = readJSON<User[] | null>(KEYS.users, null);
    const storedCustomers = readJSON<Customer[] | null>(KEYS.customers, null);
    const storedOrders = readJSON<Order[] | null>(KEYS.orders, null);
    const session = readJSON<Session | null>(KEYS.session, null);

    const merged = mergeDemoCustomerAccounts(
      storedUsers ?? SEED_USERS,
      storedCustomers ?? SEED_CUSTOMERS,
    );
    const nextUsers = merged.users;
    const nextCustomers = merged.customers;
    const nextOrders = storedOrders ?? SEED_ORDERS;

    if (!storedUsers || nextUsers.length !== storedUsers.length) writeJSON(KEYS.users, nextUsers);
    if (!storedCustomers || nextCustomers.length !== storedCustomers.length) {
      writeJSON(KEYS.customers, nextCustomers);
    }
    if (!storedOrders) writeJSON(KEYS.orders, nextOrders);

    setUsers(nextUsers);
    setCustomers(nextCustomers);
    setOrders(nextOrders);
    if (session && nextUsers.some((u) => u.id === session.userId)) {
      setCurrentUserId(session.userId);
    }
    setReady(true);
  }, []);

  const persistUsers = useCallback((next: User[]) => {
    setUsers(next);
    writeJSON(KEYS.users, next);
  }, []);

  const persistCustomers = useCallback((next: Customer[]) => {
    setCustomers(next);
    writeJSON(KEYS.customers, next);
  }, []);

  const persistOrders = useCallback((next: Order[]) => {
    setOrders(next);
    writeJSON(KEYS.orders, next);
  }, []);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const currentCustomer = useMemo(() => {
    if (!currentUser || currentUser.role !== "customer") return null;
    return customers.find((c) => c.id === currentUser.customerId) ?? null;
  }, [customers, currentUser]);

  const login = useCallback(
    (email: string, password: string): LoginResult => {
      const normalized = email.trim().toLowerCase();
      const found = users.find(
        (u) => u.email.toLowerCase() === normalized && u.password === password,
      );
      if (!found) {
        return { ok: false, error: "Email atau kata sandi tidak sesuai." };
      }
      const session: Session = { userId: found.id, loginAt: new Date().toISOString() };
      writeJSON(KEYS.session, session);
      setCurrentUserId(found.id);
      return { ok: true, user: found };
    },
    [users],
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(KEYS.session);
    setCurrentUserId(null);
  }, []);

  const addCustomer = useCallback(
    (input: CustomerInput) => {
      const stamp = new Date().toISOString();
      const customer: Customer = {
        ...input,
        id: uid("cst"),
        createdAt: stamp,
        updatedAt: stamp,
      };
      persistCustomers([customer, ...customers]);
      return customer;
    },
    [customers, persistCustomers],
  );

  const updateCustomer = useCallback(
    (id: string, input: CustomerInput) => {
      persistCustomers(
        customers.map((c) =>
          c.id === id ? { ...c, ...input, updatedAt: new Date().toISOString() } : c,
        ),
      );
    },
    [customers, persistCustomers],
  );

  const deleteCustomer = useCallback(
    (id: string) => {
      persistCustomers(customers.filter((c) => c.id !== id));
      persistOrders(orders.filter((o) => o.customerId !== id));
      // Akun portal yang terhubung ke pelanggan ini ikut dihapus.
      const linked = users.filter((u) => u.customerId === id);
      if (linked.length > 0) {
        persistUsers(users.filter((u) => u.customerId !== id));
      }
    },
    [customers, orders, users, persistCustomers, persistOrders, persistUsers],
  );

  const addOrder = useCallback(
    (customerId: string, input: OrderInput) => {
      const stamp = new Date().toISOString();
      const order: Order = {
        ...input,
        id: uid("ord"),
        customerId,
        status: "baru",
        createdAt: stamp,
        updatedAt: stamp,
      };
      persistOrders([order, ...orders]);
      return order;
    },
    [orders, persistOrders],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: OrderStatus) => {
      persistOrders(
        orders.map((order) =>
          order.id === id
            ? { ...order, status, updatedAt: new Date().toISOString() }
            : order,
        ),
      );
    },
    [orders, persistOrders],
  );

  const deleteOrder = useCallback(
    (id: string) => {
      persistOrders(orders.filter((order) => order.id !== id));
    },
    [orders, persistOrders],
  );

  const addUser = useCallback(
    (input: UserInput): LoginResult => {
      const email = input.email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: "Email sudah digunakan oleh pengguna lain." };
      }
      if (input.role === "customer" && !input.customerId) {
        return { ok: false, error: "Pilih data pelanggan untuk akun portal." };
      }
      const user: User = {
        ...input,
        email,
        id: uid("usr"),
        customerId: input.role === "customer" ? input.customerId : undefined,
        createdAt: new Date().toISOString(),
      };
      persistUsers([...users, user]);
      return { ok: true };
    },
    [users, persistUsers],
  );

  const deleteUser = useCallback(
    (id: string): LoginResult => {
      if (id === currentUserId) {
        return { ok: false, error: "Anda tidak dapat menghapus akun yang sedang digunakan." };
      }
      persistUsers(users.filter((u) => u.id !== id));
      return { ok: true };
    },
    [users, currentUserId, persistUsers],
  );

  const resetDemoData = useCallback(() => {
    persistUsers(SEED_USERS);
    persistCustomers(SEED_CUSTOMERS);
    persistOrders(SEED_ORDERS);
    window.localStorage.removeItem(KEYS.session);
    setCurrentUserId(null);
  }, [persistUsers, persistCustomers, persistOrders]);

  const value: AppContextValue = {
    ready,
    users,
    customers,
    orders,
    currentUser,
    currentCustomer,
    isAdmin: currentUser?.role === "admin",
    isStaff: currentUser?.role === "staff",
    isCustomer: currentUser?.role === "customer",
    login,
    logout,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addOrder,
    updateOrderStatus,
    deleteOrder,
    addUser,
    deleteUser,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp harus dipakai di dalam AppProvider");
  return ctx;
}
