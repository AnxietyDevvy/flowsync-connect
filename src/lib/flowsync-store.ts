import { useSyncExternalStore } from "react";

export type OrderStatus = "draft" | "sent" | "completed";
export type Product = { id: string; name: string; quantity: string };
export type Order = {
  id: string;
  orderNumber: string;
  date: string;
  products: Product[];
  notes: string;
  status: OrderStatus;
  createdAt: number;
  completedAt?: number;
};

export type SupplyStatus = "ok" | "low" | "reorder";
export type Supply = {
  id: string;
  name: string;
  stock: string;
  reorder: string;
  notes: string;
  status: SupplyStatus;
  noticedByOffice: boolean;
  updatedAt: number;
};

type State = { orders: Order[]; supplies: Supply[] };

const KEY = "flowsync-state-v1";
const listeners = new Set<() => void>();

function load(): State {
  if (typeof window === "undefined") return { orders: [], supplies: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { orders: [], supplies: [] };
}

let state: State = load();

function persist() {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// Cross-tab sync
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

export function useFlowSync() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => ({ orders: [], supplies: [] }),
  );
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export const store = {
  addOrder(o: Omit<Order, "id" | "createdAt" | "status">) {
    state = {
      ...state,
      orders: [
        { ...o, id: uid(), createdAt: Date.now(), status: "draft" },
        ...state.orders,
      ],
    };
    persist();
  },
  updateOrder(id: string, patch: Partial<Order>) {
    state = {
      ...state,
      orders: state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    };
    persist();
  },
  deleteOrder(id: string) {
    state = { ...state, orders: state.orders.filter((o) => o.id !== id) };
    persist();
  },
  sendOrder(id: string) {
    this.updateOrder(id, { status: "sent" });
  },
  completeOrder(id: string) {
    this.updateOrder(id, { status: "completed", completedAt: Date.now() });
  },
  addSupply(s: Omit<Supply, "id" | "updatedAt" | "noticedByOffice">) {
    state = {
      ...state,
      supplies: [
        { ...s, id: uid(), updatedAt: Date.now(), noticedByOffice: false },
        ...state.supplies,
      ],
    };
    persist();
  },
  updateSupply(id: string, patch: Partial<Supply>) {
    state = {
      ...state,
      supplies: state.supplies.map((s) =>
        s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
      ),
    };
    persist();
  },
  deleteSupply(id: string) {
    state = { ...state, supplies: state.supplies.filter((s) => s.id !== id) };
    persist();
  },
  noticeSupply(id: string) {
    this.updateSupply(id, { noticedByOffice: true });
  },
};

export function nextOrderNumber(orders: Order[]) {
  const year = new Date().getFullYear();
  const nums = orders
    .map((o) => {
      const m = o.orderNumber.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => !isNaN(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `PO-${year}-${String(next).padStart(4, "0")}`;
}

export const OFFICE_PASSWORD = "bpt-office";
export const OFFICE_UNLOCK_KEY = "flowsync-office-unlocked";