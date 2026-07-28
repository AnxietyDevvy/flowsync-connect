import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import { saveCache, readCache } from "@/lib/offline/cache";
import { submit, startOutboxFlusher } from "@/lib/offline/outbox";

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Optimistic local mutators (in-memory state only).
function upsertOrder(o: Order) {
  const list = state.orders.filter((x) => x.id !== o.id);
  setState({ orders: [o, ...list] });
  saveCache("orders", state.orders);
}
function patchOrder(id: string, patch: Partial<Order>) {
  const orders = state.orders.map((o) => (o.id === id ? { ...o, ...patch } : o));
  setState({ orders });
  saveCache("orders", orders);
}
function removeOrder(id: string) {
  const orders = state.orders.filter((o) => o.id !== id);
  setState({ orders });
  saveCache("orders", orders);
}
function upsertSupply(s: Supply) {
  const list = state.supplies.filter((x) => x.id !== s.id);
  const supplies = [s, ...list];
  setState({ supplies });
  saveCache("supplies", supplies);
}
function patchSupply(id: string, patch: Partial<Supply>) {
  const supplies = state.supplies.map((s) =>
    s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
  );
  setState({ supplies });
  saveCache("supplies", supplies);
}
function removeSupply(id: string) {
  const supplies = state.supplies.filter((s) => s.id !== id);
  setState({ supplies });
  saveCache("supplies", supplies);
}
function upsertProduct(p: CatalogProduct) {
  const list = state.products.filter((x) => x.id !== p.id);
  const products = [...list, p].sort((a, b) =>
    a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category),
  );
  setState({ products });
  saveCache("products", products);
}
function patchProduct(id: string, patch: Partial<CatalogProduct>) {
  const products = state.products.map((p) => (p.id === id ? { ...p, ...patch } : p));
  setState({ products });
  saveCache("products", products);
}
function removeProduct(id: string) {
  const products = state.products.filter((p) => p.id !== id);
  setState({ products });
  saveCache("products", products);
}
function upsertSupplier(s: Supplier) {
  const list = state.suppliers.filter((x) => x.id !== s.id);
  const suppliers = [...list, s].sort((a, b) => a.name.localeCompare(b.name));
  setState({ suppliers });
  saveCache("suppliers", suppliers);
}
function patchSupplier(id: string, patch: Partial<Supplier>) {
  const suppliers = state.suppliers.map((s) =>
    s.id === id ? { ...s, ...patch, updatedAt: Date.now() } : s,
  );
  setState({ suppliers });
  saveCache("suppliers", suppliers);
}
function removeSupplier(id: string) {
  const suppliers = state.suppliers.filter((s) => s.id !== id);
  setState({ suppliers });
  saveCache("suppliers", suppliers);
}
function upsertManufacturing(m: ManufacturingRequest) {
  const list = state.manufacturing.filter((x) => x.id !== m.id);
  const manufacturing = [m, ...list];
  setState({ manufacturing });
  saveCache("manufacturing", manufacturing);
}
function patchManufacturing(id: string, patch: Partial<ManufacturingRequest>) {
  const manufacturing = state.manufacturing.map((m) =>
    m.id === id ? { ...m, ...patch } : m,
  );
  setState({ manufacturing });
  saveCache("manufacturing", manufacturing);
}
function removeManufacturing(id: string) {
  const manufacturing = state.manufacturing.filter((m) => m.id !== id);
  setState({ manufacturing });
  saveCache("manufacturing", manufacturing);
}

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

export const AVATAR_COLORS = [
  "red", "amber", "emerald", "sky", "indigo", "violet", "pink", "slate",
] as const;
export type AvatarColor = typeof AVATAR_COLORS[number];

export type Profile = {
  nameKey: string;
  displayName: string;
  role: string;
  avatarColor: AvatarColor;
  avatarUrl: string;
  updatedAt: number;
};

export function nameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function pickAvatarColor(name: string): AvatarColor {
  const k = nameKey(name);
  let h = 0;
  for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type State = {
  orders: Order[];
  supplies: Supply[];
  products: CatalogProduct[];
  suppliers: Supplier[];
  manufacturing: ManufacturingRequest[];
  profiles: Profile[];
  settings: Record<string, unknown>;
  loaded: boolean;
};

let state: State = {
  orders: [],
  supplies: [],
  products: [],
  suppliers: [],
  manufacturing: [],
  profiles: [],
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
  // Hydrate from cache first so the UI works offline before any network call.
  setState({
    orders: readCache<Order[]>("orders", []),
    supplies: readCache<Supply[]>("supplies", []),
    products: readCache<CatalogProduct[]>("products", []),
    suppliers: readCache<Supplier[]>("suppliers", []),
    manufacturing: readCache<ManufacturingRequest[]>("manufacturing", []),
    settings: readCache<Record<string, unknown>>("settings", {}),
    loaded: true,
  });
  // Start outbox flusher; when a flush drains pending writes, reload from network.
  startOutboxFlusher(() => {
    void loadAll();
  });
  void (async () => {
    await ensureAnonSession();
    await loadAll();
  })();
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

// Suppliers and app_settings require an authenticated session (RLS).
// Sign the visitor in anonymously so their JWT carries the `authenticated`
// role; this replaces the raw `anon` API role without adding a login UX.
async function ensureAnonSession() {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session) return;
    const { error } = await supabase.auth.signInAnonymously();
    if (error) console.error("anon sign-in", error);
  } catch (e) {
    console.error("ensureAnonSession", e);
  }
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
  const orders = (data as OrderRow[]).map(mapOrder);
  setState({ orders });
  saveCache("orders", orders);
}
async function refreshSupplies() {
  const { data, error } = await supabase
    .from("supplies")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) return console.error("supplies load", error);
  const supplies = (data as SupplyRow[]).map(mapSupply);
  setState({ supplies });
  saveCache("supplies", supplies);
}
async function refreshProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("category")
    .order("name");
  if (error) return console.error("products load", error);
  const products = (data as ProductRow[]).map(mapProduct);
  setState({ products });
  saveCache("products", products);
}

async function refreshSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name");
  if (error) return console.error("suppliers load", error);
  const suppliers = (data as SupplierRow[]).map(mapSupplier);
  setState({ suppliers });
  saveCache("suppliers", suppliers);
}

async function refreshManufacturing() {
  const { data, error } = await supabase
    .from("manufacturing_requests" as never)
    .select("*")
    .order("requested_at", { ascending: false });
  if (error) return console.error("manufacturing load", error);
  const manufacturing = (data as unknown as ManufacturingRow[]).map(mapManufacturing);
  setState({ manufacturing });
  saveCache("manufacturing", manufacturing);
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
  saveCache("settings", map);
}

// Decrement product stock levels for an order's line items.
// Matches by product name (catalog is small; safe client-side).
function decrementStockForOrder(orderId: string) {
  const order = state.orders.find((o) => o.id === orderId);
  if (!order) return;
  const byName = new Map(state.products.map((p) => [p.name, p]));
  for (const line of order.products) {
    const prod = byName.get(line.name);
    if (!prod) continue;
    const qty = parseInt(line.quantity, 10);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const newStock = (prod.stock ?? 0) - qty;
    patchProduct(prod.id, { stock: newStock });
    void submit({ table: "products", action: "update", values: { stock: newStock }, match: { col: "id", val: prod.id } });
  }
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
    const id = newId();
    upsertOrder({
      id,
      orderNumber: o.orderNumber,
      date: o.date,
      products: o.products,
      notes: o.notes,
      status: "draft",
      createdBy: o.createdBy,
      assignedTo: o.assignedTo ?? "",
      createdAt: Date.now(),
    });
    await submit({ table: "orders", action: "insert", values: {
      id,
      order_number: o.orderNumber,
      order_date: o.date,
      products: o.products,
      notes: o.notes,
      status: "draft",
      created_by: o.createdBy,
      assigned_to: o.assignedTo ?? "",
    } });
  },
  async deleteOrder(id: string) {
    removeOrder(id);
    await submit({ table: "orders", action: "delete", match: { col: "id", val: id } });
  },
  async sendOrder(id: string) {
    patchOrder(id, { status: "sent" });
    decrementStockForOrder(id);
    await submit({ table: "orders", action: "update",
      values: { status: "sent", sent_at: new Date().toISOString() },
      match: { col: "id", val: id } });
  },
  async assignOrder(id: string, assignedTo: string) {
    patchOrder(id, { assignedTo });
    await submit({ table: "orders", action: "update",
      values: { assigned_to: assignedTo }, match: { col: "id", val: id } });
  },
  async completeOrder(id: string) {
    patchOrder(id, { status: "completed", completedAt: Date.now() });
    await submit({ table: "orders", action: "update",
      values: { status: "completed", completed_at: new Date().toISOString() },
      match: { col: "id", val: id } });
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
    patchOrder(id, { status, completedAt: status === "completed" ? Date.now() : undefined });
    await submit({ table: "orders", action: "update", values: patch, match: { col: "id", val: id } });
  },

  async addSupply(s: {
    name: string;
    stock: string;
    reorder: string;
    notes: string;
    status: SupplyStatus;
  }) {
    const id = newId();
    upsertSupply({
      id, name: s.name, stock: s.stock, reorder: s.reorder, notes: s.notes,
      status: s.status, noticedByOffice: false, noticedBy: "", updatedAt: Date.now(),
    });
    await submit({ table: "supplies", action: "insert", values: {
      id, name: s.name, stock: s.stock, reorder: s.reorder, notes: s.notes,
      status: s.status, noticed_by_office: false,
    } });
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
    patchSupply(id, patch);
    await submit({ table: "supplies", action: "update", values: row, match: { col: "id", val: id } });
  },
  async deleteSupply(id: string) {
    removeSupply(id);
    await submit({ table: "supplies", action: "delete", match: { col: "id", val: id } });
  },
  async noticeSupply(id: string, by: string) {
    await this.updateSupply(id, { noticedByOffice: true, noticedBy: by });
  },

  async addProduct(name: string, category: string) {
    const trimmed = name.trim();
    const cat = category.trim() || "Uncategorized";
    if (!trimmed) return;
    const id = newId();
    upsertProduct({ id, name: trimmed, category: cat, isCustom: true, stock: 0, lowStock: 0, materials: [] });
    await submit({ table: "products", action: "insert",
      values: { id, name: trimmed, category: cat, is_custom: true } });
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
    patchProduct(id, patch);
    await submit({ table: "products", action: "update", values: row, match: { col: "id", val: id } });
  },
  async deleteProduct(id: string) {
    // Server allows any delete; guard client-side to only remove custom entries.
    const target = state.products.find((p) => p.id === id);
    if (!target || !target.isCustom) return;
    removeProduct(id);
    await submit({ table: "products", action: "delete", match: { col: "id", val: id } });
  },
  async forceDeleteProduct(id: string) {
    removeProduct(id);
    await submit({ table: "products", action: "delete", match: { col: "id", val: id } });
  },

  async addSupplier(s: {
    name: string;
    email: string;
    website: string;
    notes: string;
    createdBy: string;
  }) {
    const id = newId();
    upsertSupplier({ id, ...s, updatedAt: Date.now() });
    await submit({ table: "suppliers", action: "insert", values: {
      id, name: s.name, email: s.email, website: s.website, notes: s.notes, created_by: s.createdBy,
    } });
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
    patchSupplier(id, patch);
    await submit({ table: "suppliers", action: "update", values: row, match: { col: "id", val: id } });
  },
  async deleteSupplier(id: string) {
    removeSupplier(id);
    await submit({ table: "suppliers", action: "delete", match: { col: "id", val: id } });
  },

  async sendToManufacturing(
    supply: { id: string; name: string; notes?: string },
    requestedBy: string,
  ) {
    const id = newId();
    upsertManufacturing({
      id, supplyId: supply.id, supplyName: supply.name, notes: supply.notes ?? "",
      status: "pending", requestedBy, requestedAt: Date.now(),
      startedBy: "", completedBy: "",
    });
    await submit({ table: "manufacturing_requests", action: "insert", values: {
      id, supply_id: supply.id, supply_name: supply.name, notes: supply.notes ?? "",
      status: "pending", requested_by: requestedBy,
    } });
  },
  async startManufacturing(id: string, by: string) {
    patchManufacturing(id, { status: "in_progress", startedBy: by, startedAt: Date.now() });
    await submit({ table: "manufacturing_requests", action: "update", values: {
      status: "in_progress", started_by: by,
      started_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, match: { col: "id", val: id } });
  },
  async completeManufacturing(id: string, by: string) {
    patchManufacturing(id, { status: "completed", completedBy: by, completedAt: Date.now() });
    await submit({ table: "manufacturing_requests", action: "update", values: {
      status: "completed", completed_by: by,
      completed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, match: { col: "id", val: id } });
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
    patchManufacturing(id, { status });
    await submit({ table: "manufacturing_requests", action: "update", values: patch, match: { col: "id", val: id } });
  },
  async deleteManufacturing(id: string) {
    removeManufacturing(id);
    await submit({ table: "manufacturing_requests", action: "delete", match: { col: "id", val: id } });
  },

  // --- Settings ---
  async setSetting(key: string, value: unknown) {
    const map = { ...state.settings, [key]: value };
    setState({ settings: map });
    saveCache("settings", map);
    await submit({ table: "app_settings", action: "upsert", values: {
      key, value, updated_at: new Date().toISOString(),
    } });
  },

  // --- Danger zone ---
  async wipeOrdersByStatus(status: OrderStatus) {
    const { error } = await supabase.from("orders").delete().eq("status", status);
    if (error) console.error("wipeOrdersByStatus", error);
    await refreshOrders();
  },
  async wipeCompletedManufacturing() {
    const { error } = await supabase
      .from("manufacturing_requests" as never)
      .delete()
      .eq("status", "completed");
    if (error) console.error("wipeCompletedManufacturing", error);
    await refreshManufacturing();
  },
  async resetTable(
    table: "orders" | "supplies" | "products" | "suppliers" | "manufacturing_requests",
  ) {
    const { error } = await supabase
      .from(table as never)
      .delete()
      .not("id", "is", null);
    if (error) console.error("resetTable " + table, error);
    await loadAll();
  },
  async exportSnapshot() {
    const [o, s, p, sup, m, set] = await Promise.all([
      supabase.from("orders").select("*"),
      supabase.from("supplies").select("*"),
      supabase.from("products").select("*"),
      supabase.from("suppliers").select("*"),
      supabase.from("manufacturing_requests" as never).select("*"),
      supabase.from("app_settings" as never).select("*"),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      orders: o.data ?? [],
      supplies: s.data ?? [],
      products: p.data ?? [],
      suppliers: sup.data ?? [],
      manufacturing_requests: m.data ?? [],
      app_settings: set.data ?? [],
    };
  },
  async importSnapshot(snapshot: {
    orders?: unknown[];
    supplies?: unknown[];
    products?: unknown[];
    suppliers?: unknown[];
    manufacturing_requests?: unknown[];
    app_settings?: unknown[];
  }) {
    // Wipe then insert. Any error is logged but we continue for a best-effort restore.
    const tables: Array<[string, unknown[] | undefined]> = [
      ["manufacturing_requests", snapshot.manufacturing_requests],
      ["orders", snapshot.orders],
      ["supplies", snapshot.supplies],
      ["products", snapshot.products],
      ["suppliers", snapshot.suppliers],
      ["app_settings", snapshot.app_settings],
    ];
    for (const [t] of tables) {
      const { error } = await supabase.from(t as never).delete().not("id", "is", null);
      if (error && t !== "app_settings") console.error("import wipe " + t, error);
    }
    // app_settings uses `key` PK, wipe separately
    await supabase.from("app_settings" as never).delete().not("key", "is", null);
    for (const [t, rows] of tables) {
      if (!rows || rows.length === 0) continue;
      const { error } = await supabase.from(t as never).insert(rows as never);
      if (error) console.error("import insert " + t, error);
    }
    await loadAll();
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

export const DEV_PASSWORD = "bpt-dev";
export const DEV_UNLOCK_KEY = "flowsync-dev-unlocked";

/** Read a setting synchronously from the current store state. */
export function getSetting<T = unknown>(key: string, fallback: T): T {
  const v = state.settings[key];
  return (v === undefined || v === null ? fallback : v) as T;
}

export function getEffectivePassword(kind: "office" | "admin" | "dev"): string {
  const fallback =
    kind === "office" ? OFFICE_PASSWORD : kind === "admin" ? ADMIN_PASSWORD : DEV_PASSWORD;
  const v = state.settings[`${kind}_password`];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function getSavedOfficeName(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(OFFICE_USERNAME_KEY) ?? "";
}
export function setSavedOfficeName(name: string) {
  if (typeof window === "undefined") return;
  if (name) localStorage.setItem(OFFICE_USERNAME_KEY, name);
  else localStorage.removeItem(OFFICE_USERNAME_KEY);
}