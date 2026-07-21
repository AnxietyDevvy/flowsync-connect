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

export type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  isCustom: boolean;
};

type State = {
  orders: Order[];
  supplies: Supply[];
  products: CatalogProduct[];
};

const KEY = "flowsync-state-v1";
const listeners = new Set<() => void>();

const SEED_PRODUCTS: Array<{ name: string; category: string }> = [
  { name: "ICW1 Level III +++ ULTRA LIGHT", category: "ICW / SA Plates" },
  { name: "ICW2 Level III ++ SUPA LIGHT", category: "ICW / SA Plates" },
  { name: "ICW3 Level III S A Mix", category: "ICW / SA Plates" },
  { name: "ICW4 Level III S A Mix Ladies Front", category: "ICW / SA Plates" },
  { name: "ICW5 Level IV", category: "ICW / SA Plates" },
  { name: "ICW6 Level IV", category: "ICW / SA Plates" },
  { name: "SA1 Level III ++ ULTRA LIGHT- SA", category: "ICW / SA Plates" },
  { name: "SA2 Level III +++ SUPA LIGHT- SA", category: "ICW / SA Plates" },
  { name: "SA3 Level III +++ ULTRA STEEL- SA", category: "ICW / SA Plates" },
  { name: "SA4 Level III S A Mix- SA", category: "ICW / SA Plates" },
  { name: "SA5 Level IV- SA", category: "ICW / SA Plates" },
  { name: "SA6 Level III ++ ULTRA LIGHT- SA (side plate)", category: "ICW / SA Plates" },
  { name: "SA7 Level III +++ ULTRA LIGHT- SA (side plate)", category: "ICW / SA Plates" },
  { name: "SA8 Level IV- SA (side plate)", category: "ICW / SA Plates" },
  { name: "SA9 Level III +++ ULTRA STEEL- SA (Large)", category: "ICW / SA Plates" },
  { name: "ARAMID B4 (ARAB4)", category: "Vehicle Armor" },
  { name: "UHMWPE Level B4 (UHMWPE5)", category: "Vehicle Armor" },
  { name: "UHMWPE Level B6 (UHMWPE15)", category: "Vehicle Armor" },
  { name: "UHMWPE Level B6 (UHMWPE18)", category: "Vehicle Armor" },
  { name: "Vikashield Glass Reinforced Matrix", category: "Vehicle Armor" },
  { name: "STANAG Level 2", category: "Military Vehicle Armor" },
  { name: "STANAG Level 3(-)", category: "Military Vehicle Armor" },
  { name: "STANAG Level 3 Full", category: "Military Vehicle Armor" },
  { name: "STANAG Level 4", category: "Military Vehicle Armor" },
  { name: "Vikashield", category: "Military Vehicle Armor" },
  { name: "Aramid", category: "Military Vehicle Armor" },
  { name: "UHMWPE", category: "Military Vehicle Armor" },
  { name: "Level IIIA Shield", category: "Ballistic Shield" },
];

function seededProducts(): CatalogProduct[] {
  return SEED_PRODUCTS.map((p, i) => ({
    id: `seed-${i}`,
    name: p.name,
    category: p.category,
    isCustom: false,
  }));
}

function load(): State {
  const empty: State = { orders: [], supplies: [], products: seededProducts() };
  if (typeof window === "undefined") return empty;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return {
        orders: parsed.orders ?? [],
        supplies: parsed.supplies ?? [],
        products:
          parsed.products && parsed.products.length > 0
            ? parsed.products
            : seededProducts(),
      };
    }
  } catch {}
  return empty;
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
    () => ({ orders: [], supplies: [], products: seededProducts() }),
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
  addProduct(name: string, category: string) {
    const trimmed = name.trim();
    const cat = category.trim() || "Uncategorized";
    if (!trimmed) return;
    state = {
      ...state,
      products: [
        ...state.products,
        { id: uid(), name: trimmed, category: cat, isCustom: true },
      ],
    };
    persist();
  },
  deleteProduct(id: string) {
    state = {
      ...state,
      products: state.products.filter((p) => !(p.id === id && p.isCustom)),
    };
    persist();
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