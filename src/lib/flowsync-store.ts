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
  assignedTo: string;
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
  stock: number;
  lowStock: number;
  materials: Material[];
};

export type Material = { name: string; quantity: string; unit: string };

export type Supplier = {
  id: string;
  name: string;
  email: string;
  website: string;
  notes: string;
  createdBy: string;
  updatedAt: number;
};

export type ManufacturingStatus = "pending" | "in_progress" | "completed";
export type ManufacturingRequest = {
  id: string;
  supplyId: string | null;
  supplyName: string;
  notes: string;
  status: ManufacturingStatus;
  requestedBy: string;
  requestedAt: number;
  startedBy: string;
  startedAt?: number;
  completedBy: string;
  completedAt?: number;
};

type State = {
  orders: Order[];
  supplies: Supply[];
  products: CatalogProduct[];
  suppliers: Supplier[];
  manufacturing: ManufacturingRequest[];
  settings: Record<string, unknown>;
  loaded: boolean;
};

let state: State = {
  orders: [],
  supplies: [],
  products: [],
  suppliers: [],
  manufacturing: [],
  settings: {},
  loaded: false,
};
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
    () => ({
      orders: [],
      supplies: [],
      products: [],
      suppliers: [],
      manufacturing: [],
      settings: {},
      loaded: false,
    }),
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
  assigned_to: string | null;
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
    assignedTo: r.assigned_to ?? "",
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
  stock: number | null;
  low_stock: number | null;
  materials: Material[] | null;
};
function mapProduct(r: ProductRow): CatalogProduct {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    isCustom: r.is_custom,
    stock: r.stock ?? 0,
    lowStock: r.low_stock ?? 0,
    materials: Array.isArray(r.materials) ? r.materials : [],
  };
}

type SupplierRow = {
  id: string;
  name: string;
  email: string | null;
  website: string | null;
  notes: string | null;
  created_by: string | null;
  updated_at: string;
};
function mapSupplier(r: SupplierRow): Supplier {
  return {
    id: r.id,
    name: r.name,
    email: r.email ?? "",
    website: r.website ?? "",
    notes: r.notes ?? "",
    createdBy: r.created_by ?? "",
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

type ManufacturingRow = {
  id: string;
  supply_id: string | null;
  supply_name: string;
  notes: string | null;
  status: ManufacturingStatus;
  requested_by: string | null;
  requested_at: string;
  started_by: string | null;
  started_at: string | null;
  completed_by: string | null;
  completed_at: string | null;
};
function mapManufacturing(r: ManufacturingRow): ManufacturingRequest {
  return {
    id: r.id,
    supplyId: r.supply_id,
    supplyName: r.supply_name,
    notes: r.notes ?? "",
    status: r.status,
    requestedBy: r.requested_by ?? "",
    requestedAt: new Date(r.requested_at).getTime(),
    startedBy: r.started_by ?? "",
    startedAt: r.started_at ? new Date(r.started_at).getTime() : undefined,
    completedBy: r.completed_by ?? "",
    completedAt: r.completed_at ? new Date(r.completed_at).getTime() : undefined,
  };
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
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "suppliers" },
      () => refreshSuppliers(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "manufacturing_requests" },
      () => refreshManufacturing(),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "app_settings" },
      () => refreshSettings(),
    )
    .subscribe();
  // Channel intentionally lives for app lifetime.
  void channel;
}

async function loadAll() {
  await Promise.all([
    refreshOrders(),
    refreshSupplies(),
    refreshProducts(),
    refreshSuppliers(),
    refreshManufacturing(),
    refreshSettings(),
  ]);
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

async function refreshSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");
  if (error) return console.error("suppliers load", error);
  setState({ suppliers: (data as SupplierRow[]).map(mapSupplier) });
}

async function refreshManufacturing() {
  const { data, error } = await supabase
    .from("manufacturing_requests" as never)
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) return console.error("manufacturing load", error);
  setState({
    manufacturing: (data as unknown as ManufacturingRow[]).map(mapManufacturing),
  });
}

async function refreshSettings() {
  const { data, error } = await supabase
    .from("app_settings" as never)
    .select("*");
  if (error) return console.error("settings load", error);
  const map: Record<string, unknown> = {};
  for (const row of (data as unknown as { key: string; value: unknown }[]) ?? []) {
    map[row.key] = row.value;
  }
  setState({ settings: map });
}

// Decrement product stock levels for an order's line items.
// Matches by product name (catalog is small; safe client-side).
async function decrementStockForOrder(orderId: string) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  const byName = new Map(state.products.map((p) => [p.name, p]));
  await Promise.all(
    order.products.map(async (line) => {
      const prod = byName.get(line.name);
      if (!prod) return;
      const qty = parseInt(line.quantity, 10);
      if (!Number.isFinite(qty) || qty <= 0) return;
      const newStock = (prod.stock ?? 0) - qty;
      const { error } = await supabase
        .from("products")
        .update({ stock: newStock })
        .eq("id", prod.id);
      if (error) console.error("decrement stock", error);
    }),
  );
}

// --- Mutations (fire-and-forget; realtime brings truth back) ---

export const store = {
  async addOrder(o: {
    orderNumber: string;
    date: string;
    products: Product[];
    notes: string;
    createdBy: string;
    assignedTo?: string;
  }) {
    const { error } = await supabase.from("orders").insert({
      order_number: o.orderNumber,
      order_date: o.date,
      products: o.products,
      notes: o.notes,
      status: "draft",
      created_by: o.createdBy,
      assigned_to: o.assignedTo ?? "",
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
    await decrementStockForOrder(id);
    await refreshOrders();
    await refreshProducts();
  },
  async assignOrder(id: string, assignedTo: string) {
    const { error } = await supabase
      .from("orders")
      .update({ assigned_to: assignedTo })
      .eq("id", id);
    if (error) console.error("assignOrder", error);
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
  async updateProduct(
    id: string,
    patch: Partial<Pick<CatalogProduct, "stock" | "lowStock" | "materials" | "name" | "category">>,
  ) {
    const row: {
      stock?: number;
      low_stock?: number;
      materials?: Material[];
      name?: string;
      category?: string;
    } = {};
    if (patch.stock !== undefined) row.stock = patch.stock;
    if (patch.lowStock !== undefined) row.low_stock = patch.lowStock;
    if (patch.materials !== undefined) row.materials = patch.materials;
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.category !== undefined) row.category = patch.category;
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) console.error("updateProduct", error);
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

  async addSupplier(s: {
    name: string;
    email: string;
    website: string;
    notes: string;
    createdBy: string;
  }) {
    const { error } = await supabase.from("suppliers").insert({
      name: s.name,
      email: s.email,
      website: s.website,
      notes: s.notes,
      created_by: s.createdBy,
    });
    if (error) console.error("addSupplier", error);
    await refreshSuppliers();
  },
  async updateSupplier(
    id: string,
    patch: Partial<Omit<Supplier, "id" | "updatedAt" | "createdBy">>,
  ) {
    const row: {
      updated_at: string;
      name?: string;
      email?: string;
      website?: string;
      notes?: string;
    } = { updated_at: new Date().toISOString() };
    if (patch.name !== undefined) row.name = patch.name;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.website !== undefined) row.website = patch.website;
    if (patch.notes !== undefined) row.notes = patch.notes;
    const { error } = await supabase.from("suppliers").update(row).eq("id", id);
    if (error) console.error("updateSupplier", error);
    await refreshSuppliers();
  },
  async deleteSupplier(id: string) {
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) console.error("deleteSupplier", error);
    await refreshSuppliers();
  },

  async sendToManufacturing(
    supply: { id: string; name: string; notes?: string },
    requestedBy: string,
  ) {
    const { error } = await supabase.from("manufacturing_requests" as never).insert({
      supply_id: supply.id,
      supply_name: supply.name,
      notes: supply.notes ?? "",
      status: "pending",
      requested_by: requestedBy,
    } as never);
    if (error) console.error("sendToManufacturing", error);
    await refreshManufacturing();
  },
  async startManufacturing(id: string, by: string) {
    const { error } = await supabase
      .from("manufacturing_requests" as never)
      .update({
        status: "in_progress",
        started_by: by,
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id);
    if (error) console.error("startManufacturing", error);
    await refreshManufacturing();
  },
  async completeManufacturing(id: string, by: string) {
    const { error } = await supabase
      .from("manufacturing_requests" as never)
      .update({
        status: "completed",
        completed_by: by,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", id);
    if (error) console.error("completeManufacturing", error);
    await refreshManufacturing();
  },
  async updateManufacturingStatus(id: string, status: ManufacturingStatus) {
    const patch: {
      status: ManufacturingStatus;
      started_at?: string | null;
      completed_at?: string | null;
      updated_at: string;
    } = { status, updated_at: new Date().toISOString() };
    if (status === "pending") {
      patch.started_at = null;
      patch.completed_at = null;
    } else if (status === "in_progress") {
      patch.started_at = new Date().toISOString();
      patch.completed_at = null;
    } else if (status === "completed") {
      patch.completed_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from("manufacturing_requests" as never)
      .update(patch as never)
      .eq("id", id);
    if (error) console.error("updateManufacturingStatus", error);
    await refreshManufacturing();
  },
  async deleteManufacturing(id: string) {
    const { error } = await supabase
      .from("manufacturing_requests" as never)
      .delete()
      .eq("id", id);
    if (error) console.error("deleteManufacturing", error);
    await refreshManufacturing();
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