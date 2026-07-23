import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = "draft" | "sent" | "completed";
export type Product = { id: string; name: string; quantity: string };
export type Order = {
  id: string;
  orderNumber: string;
  date: string;
  products: Product[];
  notes: string;
  status: OrderStatus;
  createdBy: string;
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
  noticedBy: string;
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
  loaded: boolean;
};

let state: State = { orders: [], supplies: [], products: [], loaded: false };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}
function setState(patch: Partial<State>) {
  state = { ...state, ...patch };
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  ensureBootstrap();
  return () => listeners.delete(l);
}

export function useFlowSync() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => ({ orders: [], supplies: [], products: [], loaded: false }),
  );
}

// --- Row mapping ---

type OrderRow = {
  id: string;
  order_number: string;
  order_date: string;
  products: Product[] | null;
  notes: string | null;
  status: OrderStatus;
  created_by: string | null;
  created_at: string;
  completed_at: string | null;
};
function mapOrder(r: OrderRow): Order {
  return {
    id: r.id,
    orderNumber: r.order_number,
    date: r.order_date,
    products: Array.isArray(r.products) ? r.products : [],
    notes: r.notes ?? "",
    status: r.status,
    createdBy: r.created_by ?? "",
    createdAt: new Date(r.created_at).getTime(),
    completedAt: r.completed_at ? new Date(r.completed_at).getTime() : undefined,
  };
}

type SupplyRow = {
  id: string;
  name: string;
  stock: string | null;
  reorder: string | null;
  notes: string | null;
  status: SupplyStatus;
  noticed_by_office: boolean;
  noticed_by: string | null;
  updated_at: string;
};
function mapSupply(r: SupplyRow): Supply {
  return {
    id: r.id,
    name: r.name,
    stock: r.stock ?? "",
    reorder: r.reorder ?? "",
    notes: r.notes ?? "",
    status: r.status,
    noticedByOffice: r.noticed_by_office,
    noticedBy: r.noticed_by ?? "",
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

type ProductRow = {
  id: string;
  name: string;
  category: string;
  is_custom: boolean;
};
function mapProduct(r: ProductRow): CatalogProduct {
  return { id: r.id, name: r.name, category: r.category, isCustom: r.is_custom };
}

// --- Bootstrap: initial fetch + realtime ---

let bootstrapped = false;
function ensureBootstrap() {
  if (bootstrapped || typeof window === "undefined") return;
  bootstrapped = true;
  void loadAll();
  const channel = supabase
    .channel("flowsync")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "orders" },
      () => refreshOrders(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "supplies" },
      () => refreshSupplies(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "products" },
      () => refreshProducts(),
    )
    .subscribe();
  // Channel intentionally lives for app lifetime.
  void channel;
}

async function loadAll() {
  await Promise.all([refreshOrders(), refreshSupplies(), refreshProducts()]);
  setState({ loaded: true });
}

async function refreshOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return console.error("orders load", error);
  setState({ orders: (data as OrderRow[]).map(mapOrder) });
}
async function refreshSupplies() {
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return console.error("supplies load", error);
  setState({ supplies: (data as SupplyRow[]).map(mapSupply) });
}
async function refreshProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category")
    .order("name");
  if (error) return console.error("products load", error);
  setState({ products: (data as ProductRow[]).map(mapProduct) });
}

// --- Mutations (fire-and-forget; realtime brings truth back) ---

export const store = {
  async addOrder(o: {
    orderNumber: string;
    date: string;
    products: Product[];
    notes: string;
    createdBy: string;
  }) {
    const { error } = await supabase.from("orders").insert({
      order_number: o.orderNumber,
      order_date: o.date,
      products: o.products,
      notes: o.notes,
      status: "draft",
      created_by: o.createdBy,
    });
    if (error) console.error("addOrder", error);
    await refreshOrders();
  },
  async deleteOrder(id: string) {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) console.error("deleteOrder", error);
    await refreshOrders();
  },
  async sendOrder(id: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("sendOrder", error);
    await refreshOrders();
  },
  async completeOrder(id: string) {
    const { error } = await supabase
      .from("orders")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) console.error("completeOrder", error);
    await refreshOrders();
  },
  async updateOrderStatus(id: string, status: OrderStatus) {
    const patch: {
      status: OrderStatus;
      sent_at?: string | null;
      completed_at?: string | null;
    } = { status };
    if (status === "draft") {
      patch.sent_at = null;
      patch.completed_at = null;
    } else if (status === "sent") {
      patch.sent_at = new Date().toISOString();
      patch.completed_at = null;
    } else if (status === "completed") {
      patch.completed_at = new Date().toISOString();
    }
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) console.error("updateOrderStatus", error);
    await refreshOrders();
  },

  async addSupply(s: {
    name: string;
    stock: string;
    reorder: string;
    notes: string;
    status: SupplyStatus;
  }) {
    const { error } = await supabase.from("supplies").insert({
      name: s.name,
      stock: s.stock,
      reorder: s.reorder,
      notes: s.notes,
      status: s.status,
      noticed_by_office: false,
    });
    if (error) console.error("addSupply", error);
    await refreshSupplies();
  },
  async updateSupply(
    id: string,
    patch: Partial<Omit<Supply, "id" | "updatedAt">>,
  ) {
    const row: {
      updated_at: string;
      name?: string;
      stock?: string;
      reorder?: string;
      notes?: string;
      status?: SupplyStatus;
      noticed_by_office?: boolean;
      noticed_by?: string;
    } = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.stock !== undefined) row.stock = patch.stock;
    if (patch.reorder !== undefined) row.reorder = patch.reorder;
    if (patch.notes !== undefined) row.notes = patch.notes;
    if (patch.status !== undefined) row.status = patch.status;
    if (patch.noticedByOffice !== undefined) row.noticed_by_office = patch.noticedByOffice;
    if (patch.noticedBy !== undefined) row.noticed_by = patch.noticedBy;
    const { error } = await supabase.from("supplies").update(row).eq("id", id);
    if (error) console.error("updateSupply", error);
    await refreshSupplies();
  },
  async deleteSupply(id: string) {
    const { error } = await supabase.from("supplies").delete().eq("id", id);
    if (error) console.error("deleteSupply", error);
    await refreshSupplies();
  },
  async noticeSupply(id: string, by: string) {
    await this.updateSupply(id, { noticedByOffice: true, noticedBy: by });
  },

  async addProduct(name: string, category: string) {
    const trimmed = name.trim();
    const cat = category.trim() || "Uncategorized";
    if (!trimmed) return;
    const { error } = await supabase
      .from("products")
      .insert({ name: trimmed, category: cat, is_custom: true });
    if (error) console.error("addProduct", error);
    await refreshProducts();
  },
  async deleteProduct(id: string) {
    // Server allows any delete; guard client-side to only remove custom entries.
    const target = state.products.find((p) => p.id === id);
    if (!target || !target.isCustom) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) console.error("deleteProduct", error);
    await refreshProducts();
  },
  async forceDeleteProduct(id: string) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) console.error("forceDeleteProduct", error);
    await refreshProducts();
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
export const OFFICE_USERNAME_KEY = "flowsync-office-username";

export const ADMIN_PASSWORD = "bpt-admin";
export const ADMIN_UNLOCK_KEY = "flowsync-admin-unlocked";

export function getSavedOfficeName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OFFICE_USERNAME_KEY) ?? "";
}
export function setSavedOfficeName(name: string) {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem(OFFICE_USERNAME_KEY, name);
  else localStorage.removeItem(OFFICE_USERNAME_KEY);
}