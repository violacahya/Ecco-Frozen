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
import { SEED_CUSTOMERS, SEED_USERS } from "./seed";
import type { Customer, CustomerInput, Session, User, UserInput } from "./types";
import { uid } from "./utils";

const KEYS = {
  users: "ecco_crm_users_v1",
  customers: "ecco_crm_customers_v1",
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

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface AppContextValue {
  ready: boolean;
  users: User[];
  customers: Customer[];
  currentUser: User | null;
  isAdmin: boolean;
  login: (email: string, password: string) => LoginResult;
  logout: () => void;
  addCustomer: (input: CustomerInput) => Customer;
  updateCustomer: (id: string, input: CustomerInput) => void;
  deleteCustomer: (id: string) => void;
  addUser: (input: UserInput) => LoginResult;
  deleteUser: (id: string) => LoginResult;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUsers = readJSON<User[] | null>(KEYS.users, null);
    const storedCustomers = readJSON<Customer[] | null>(KEYS.customers, null);
    const session = readJSON<Session | null>(KEYS.session, null);

    const nextUsers = storedUsers ?? SEED_USERS;
    const nextCustomers = storedCustomers ?? SEED_CUSTOMERS;

    if (!storedUsers) writeJSON(KEYS.users, nextUsers);
    if (!storedCustomers) writeJSON(KEYS.customers, nextCustomers);

    setUsers(nextUsers);
    setCustomers(nextCustomers);
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

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

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
      return { ok: true };
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
    },
    [customers, persistCustomers],
  );

  const addUser = useCallback(
    (input: UserInput): LoginResult => {
      const email = input.email.trim().toLowerCase();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return { ok: false, error: "Email sudah digunakan oleh pengguna lain." };
      }
      const user: User = {
        ...input,
        email,
        id: uid("usr"),
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
    window.localStorage.removeItem(KEYS.session);
    setCurrentUserId(null);
  }, [persistUsers, persistCustomers]);

  const value: AppContextValue = {
    ready,
    users,
    customers,
    currentUser,
    isAdmin: currentUser?.role === "admin",
    login,
    logout,
    addCustomer,
    updateCustomer,
    deleteCustomer,
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
