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
import { SEED_CUSTOMERS, SEED_EXPENSES, SEED_ORDERS, SEED_PRODUCTS, SEED_SUPPLIERS, SEED_USERS } from "./seed";
import type {
  Customer,
  CustomerInput,
  CustomerOrder,
  ExpenseCategory,
  ExpenseRecord,
  FrozenProduct,
  Order,
  OrderInput,
  OrderStatus,
  PosTransactionInput,
  Session,
  StockMovement,
  Supplier,
  SupplierInput,
  User,
  UserInput,
} from "./types";
import { uid } from "./utils";

const KEYS = {
  users: "ecco_crm_users_v1",
  customers: "ecco_crm_customers_v1",
  orders: "ecco_crm_orders_v1",
  products: "ecco_crm_products_v1",
  posOrders: "ecco_crm_pos_orders_v1",
  restockLog: "ecco_crm_restock_log_v1",
  expenses: "ecco_crm_expenses_v1",
  suppliers: "ecco_crm_suppliers_v1",
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
  products: FrozenProduct[];
  posOrders: CustomerOrder[];
  restockLog: StockMovement[];
  expenses: ExpenseRecord[];
  suppliers: Supplier[];
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
  createPosTransaction: (input: PosTransactionInput) => CustomerOrder;
  restockProduct: (productId: string, quantityAdded: number, note?: string) => void;
  addExpense: (input: {
    category: ExpenseCategory;
    amount: number;
    description: string;
  }) => ExpenseRecord;
  addProduct: (input: Omit<FrozenProduct, "id">) => FrozenProduct;
  updateProduct: (id: string, updates: Partial<FrozenProduct>) => void;
  addSupplier: (input: SupplierInput) => Supplier;
  updateSupplier: (id: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
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
  const [products, setProducts] = useState<FrozenProduct[]>([]);
  const [posOrders, setPosOrders] = useState<CustomerOrder[]>([]);
  const [restockLog, setRestockLog] = useState<StockMovement[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUsers = readJSON<User[] | null>(KEYS.users, null);
    const storedCustomers = readJSON<Customer[] | null>(KEYS.customers, null);
    const storedOrders = readJSON<Order[] | null>(KEYS.orders, null);
    const storedProducts = readJSON<FrozenProduct[] | null>(KEYS.products, null);
    const storedPosOrders = readJSON<CustomerOrder[] | null>(KEYS.posOrders, null);
    const storedRestockLog = readJSON<StockMovement[] | null>(KEYS.restockLog, null);
    const storedExpenses = readJSON<ExpenseRecord[] | null>(KEYS.expenses, null);
    const storedSuppliers = readJSON<Supplier[] | null>(KEYS.suppliers, null);
    const session = readJSON<Session | null>(KEYS.session, null);

    const merged = mergeDemoCustomerAccounts(
      storedUsers ?? SEED_USERS,
      storedCustomers ?? SEED_CUSTOMERS,
    );
    const nextUsers = merged.users;
    const nextCustomers = merged.customers;
    const nextOrders = storedOrders ?? SEED_ORDERS;
    const nextProducts = storedProducts ?? SEED_PRODUCTS;
    const nextPosOrders = storedPosOrders ?? [];
    const nextRestockLog = storedRestockLog ?? [];
    const nextExpenses = storedExpenses ?? SEED_EXPENSES;
    const nextSuppliers = storedSuppliers ?? SEED_SUPPLIERS;

    if (!storedUsers || nextUsers.length !== storedUsers.length) writeJSON(KEYS.users, nextUsers);
    if (!storedCustomers || nextCustomers.length !== storedCustomers.length) {
      writeJSON(KEYS.customers, nextCustomers);
    }
    if (!storedOrders) writeJSON(KEYS.orders, nextOrders);
    if (!storedProducts) writeJSON(KEYS.products, nextProducts);
    if (!storedPosOrders) writeJSON(KEYS.posOrders, nextPosOrders);
    if (!storedRestockLog) writeJSON(KEYS.restockLog, nextRestockLog);
    if (!storedExpenses) writeJSON(KEYS.expenses, nextExpenses);
    if (!storedSuppliers) writeJSON(KEYS.suppliers, nextSuppliers);

    setUsers(nextUsers);
    setCustomers(nextCustomers);
    setOrders(nextOrders);
    setProducts(nextProducts);
    setPosOrders(nextPosOrders);
    setRestockLog(nextRestockLog);
    setExpenses(nextExpenses);
    setSuppliers(nextSuppliers);
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

  const persistProducts = useCallback((next: FrozenProduct[]) => {
    setProducts(next);
    writeJSON(KEYS.products, next);
  }, []);

  const persistPosOrders = useCallback((next: CustomerOrder[]) => {
    setPosOrders(next);
    writeJSON(KEYS.posOrders, next);
  }, []);

  const persistRestockLog = useCallback((next: StockMovement[]) => {
    setRestockLog(next);
    writeJSON(KEYS.restockLog, next);
  }, []);

  const persistExpenses = useCallback((next: ExpenseRecord[]) => {
    setExpenses(next);
    writeJSON(KEYS.expenses, next);
  }, []);

  const persistSuppliers = useCallback((next: Supplier[]) => {
    setSuppliers(next);
    writeJSON(KEYS.suppliers, next);
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

  const createPosTransaction = useCallback(
    (input: PosTransactionInput): CustomerOrder => {
      const stamp = new Date().toISOString();
      const items = input.items.filter((item) => item.qty > 0);
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const customer = input.customerId
        ? customers.find((c) => c.id === input.customerId)
        : undefined;

      const dayKey = stamp.slice(0, 10);
      const sequence =
        posOrders.filter((order) => order.createdAt.slice(0, 10) === dayKey).length + 1;
      const orderNumber = `INV-${dayKey.replace(/-/g, "")}-${String(sequence).padStart(3, "0")}`;

      const order: CustomerOrder = {
        id: uid("pos"),
        orderNumber,
        customerId: customer?.id ?? "walk-in",
        customerName:
          input.customerName?.trim() || customer?.name || "Pelanggan Umum (Walk-in)",
        company: customer?.company ?? "Walk-in",
        items,
        totalAmount,
        status: "selesai",
        deliveryDate: stamp,
        deliveryAddress: customer?.city
          ? `Ambil di toko · ${customer.city}`
          : "Ambil di toko (walk-in)",
        notes: "",
        coldChainTemp: "-18 °C",
        createdAt: stamp,
        updatedAt: stamp,
        paymentMethod: input.paymentMethod,
        cashPaid: input.paymentMethod === "tunai" ? input.cashPaid ?? totalAmount : totalAmount,
        change: input.paymentMethod === "tunai" ? input.change ?? 0 : 0,
        cashierName: currentUser?.name ?? "Kasir",
      };

      const sold = new Map(items.map((item) => [item.productId, item.qty]));
      persistProducts(
        products.map((product) => {
          const qty = sold.get(product.id);
          if (!qty) return product;
          return { ...product, stock: Math.max(0, product.stock - qty) };
        }),
      );
      persistPosOrders([order, ...posOrders]);
      return order;
    },
    [products, posOrders, customers, currentUser, persistProducts, persistPosOrders],
  );

  const restockProduct = useCallback(
    (productId: string, quantityAdded: number, note?: string) => {
      const quantity = Math.floor(quantityAdded);
      if (!Number.isFinite(quantity) || quantity <= 0) return;

      const target = products.find((product) => product.id === productId);
      if (!target) return;

      persistProducts(
        products.map((product) =>
          product.id === productId
            ? { ...product, stock: product.stock + quantity }
            : product,
        ),
      );

      const movement: StockMovement = {
        id: uid("rst"),
        productId: target.id,
        productName: target.name,
        sku: target.sku,
        quantity,
        note: note?.trim() ?? "",
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name ?? "Staf",
      };
      persistRestockLog([movement, ...restockLog]);
    },
    [products, restockLog, currentUser, persistProducts, persistRestockLog],
  );

  const addExpense = useCallback(
    (input: { category: ExpenseCategory; amount: number; description: string }): ExpenseRecord => {
      const expense: ExpenseRecord = {
        id: uid("exp"),
        category: input.category,
        amount: Math.max(0, Math.round(input.amount)),
        description: input.description.trim(),
        date: new Date().toISOString(),
        createdBy: currentUser?.name ?? "Admin",
      };
      persistExpenses([expense, ...expenses]);
      return expense;
    },
    [expenses, currentUser, persistExpenses],
  );

  const addProduct = useCallback(
    (input: Omit<FrozenProduct, "id">): FrozenProduct => {
      const product: FrozenProduct = { ...input, id: uid("prd") };
      persistProducts([product, ...products]);
      return product;
    },
    [products, persistProducts],
  );

  const updateProduct = useCallback(
    (id: string, updates: Partial<FrozenProduct>) => {
      persistProducts(
        products.map((product) =>
          product.id === id ? { ...product, ...updates, id: product.id } : product,
        ),
      );
    },
    [products, persistProducts],
  );

  const addSupplier = useCallback(
    (input: SupplierInput): Supplier => {
      const supplier: Supplier = {
        ...input,
        id: uid("sup"),
        createdAt: new Date().toISOString(),
      };
      persistSuppliers([supplier, ...suppliers]);
      return supplier;
    },
    [suppliers, persistSuppliers],
  );

  const updateSupplier = useCallback(
    (id: string, updates: Partial<Supplier>) => {
      persistSuppliers(
        suppliers.map((supplier) =>
          supplier.id === id ? { ...supplier, ...updates, id: supplier.id } : supplier,
        ),
      );
    },
    [suppliers, persistSuppliers],
  );

  const deleteSupplier = useCallback(
    (id: string) => {
      persistSuppliers(suppliers.filter((supplier) => supplier.id !== id));
    },
    [suppliers, persistSuppliers],
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
    persistProducts(SEED_PRODUCTS);
    persistPosOrders([]);
    persistRestockLog([]);
    persistExpenses(SEED_EXPENSES);
    persistSuppliers(SEED_SUPPLIERS);
    window.localStorage.removeItem(KEYS.session);
    setCurrentUserId(null);
  }, [
    persistUsers,
    persistCustomers,
    persistOrders,
    persistProducts,
    persistPosOrders,
    persistRestockLog,
    persistExpenses,
    persistSuppliers,
  ]);

  const value: AppContextValue = {
    ready,
    users,
    customers,
    orders,
    products,
    posOrders,
    restockLog,
    expenses,
    suppliers,
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
    createPosTransaction,
    restockProduct,
    addExpense,
    addProduct,
    updateProduct,
    addSupplier,
    updateSupplier,
    deleteSupplier,
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
