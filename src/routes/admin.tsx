import { createFileRoute, Navigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Lock, Trash2, ShieldAlert, Package, ClipboardList, Boxes, Users, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FlowSyncLogo, BptLogo } from "@/components/flowsync/Logos";
import { SuppliersManager } from "@/components/flowsync/SuppliersManager";
import {
  ADMIN_PASSWORD,
  ADMIN_UNLOCK_KEY,
  store,
  useFlowSync,
  type Order,
  type OrderStatus,
  type Supply,
  type CatalogProduct,
  type Supplier,
} from "@/lib/flowsync-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — FlowSync" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(
      typeof window !== "undefined" &&
        sessionStorage.getItem(ADMIN_UNLOCK_KEY) === "1",
    );
  }, []);

  if (unlocked === null) return null;
  if (!unlocked) return <AdminGate onUnlock={() => setUnlocked(true)} />;
  return (
    <AdminApp
      onLock={() => {
        sessionStorage.removeItem(ADMIN_UNLOCK_KEY);
        setUnlocked(false);
      }}
    />
  );
}

function AdminGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [redirect, setRedirect] = useState(false);

  if (redirect) return <Navigate to="/" />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== ADMIN_PASSWORD) {
      setError("Incorrect password");
      return;
    }
    sessionStorage.setItem(ADMIN_UNLOCK_KEY, "1");
    onUnlock();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <FlowSyncLogo />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold">Admin access</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Restricted area. Enter the admin key to continue.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="apw">Admin key</Label>
                <Input
                  id="apw"
                  type="password"
                  autoFocus
                  value={pw}
                  onChange={(e) => {
                    setPw(e.target.value);
                    setError(null);
                  }}
                />
                {error && (
                  <p className="text-xs font-medium text-primary">{error}</p>
                )}
              </div>
              <Button type="submit" className="w-full">
                <Lock className="mr-1 h-4 w-4" /> Unlock Admin
              </Button>
              <button
                type="button"
                onClick={() => setRedirect(true)}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                ← Back to sections
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminApp({ onLock }: { onLock: () => void }) {
  const { orders, supplies, products, suppliers, loaded } = useFlowSync();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Switch section</span>
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <FlowSyncLogo />
            <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary-foreground">
              <ShieldAlert className="h-3 w-3" /> Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onLock}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Sign out
            </button>
            <BptLogo />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Admin dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Full view of every order, supply, and product across FlowSync.
          </p>
        </div>

        {!loaded ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            Loading data…
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="data">Data tables</TabsTrigger>
              <TabsTrigger value="activity">Activity log</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Overview orders={orders} supplies={supplies} products={products} suppliers={suppliers} />
            </TabsContent>
            <TabsContent value="data" className="mt-6">
              <DataTables orders={orders} supplies={supplies} products={products} suppliers={suppliers} />
            </TabsContent>
            <TabsContent value="activity" className="mt-6">
              <ActivityLog orders={orders} supplies={supplies} />
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}

// ============= Overview =============

function Overview({
  orders,
  supplies,
  products,
  suppliers,
}: {
  orders: Order[];
  supplies: Supply[];
  products: CatalogProduct[];
  suppliers: Supplier[];
}) {
  const orderCounts = {
    total: orders.length,
    draft: orders.filter((o) => o.status === "draft").length,
    sent: orders.filter((o) => o.status === "sent").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };
  const supplyCounts = {
    total: supplies.length,
    ok: supplies.filter((s) => s.status === "ok").length,
    low: supplies.filter((s) => s.status === "low").length,
    reorder: supplies.filter((s) => s.status === "reorder").length,
  };
  const customProducts = products.filter((p) => p.isCustom).length;
  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [products]);

  const recent = useMemo(() => {
    type Item = { key: string; when: number; text: string; kind: string };
    const items: Item[] = [];
    for (const o of orders) {
      items.push({
        key: `o-${o.id}`,
        when: o.completedAt ?? o.createdAt,
        text: `${o.status === "completed" ? "Completed" : o.status === "sent" ? "Sent" : "Created"} order ${o.orderNumber}${o.createdBy ? ` — ${o.createdBy}` : ""}`,
        kind: "Order",
      });
    }
    for (const s of supplies) {
      items.push({
        key: `s-${s.id}`,
        when: s.updatedAt,
        text: `Supply "${s.name}" updated${s.noticedBy ? ` — ${s.noticedBy}` : ""}`,
        kind: "Supply",
      });
    }
    return items.sort((a, b) => b.when - a.when).slice(0, 10);
  }, [orders, supplies]);

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Orders" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={orderCounts.total} />
          <StatCard label="Draft" value={orderCounts.draft} />
          <StatCard label="Sent" value={orderCounts.sent} accent />
          <StatCard label="Completed" value={orderCounts.completed} />
        </div>
      </section>

      <section>
        <SectionTitle icon={<Boxes className="h-4 w-4" />} title="Supplies" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={supplyCounts.total} />
          <StatCard label="OK" value={supplyCounts.ok} />
          <StatCard label="Low" value={supplyCounts.low} />
          <StatCard label="Reorder" value={supplyCounts.reorder} accent />
        </div>
      </section>

      <section>
        <SectionTitle icon={<Package className="h-4 w-4" />} title="Products" />
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardContent className="py-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Catalog
                </span>
                <span className="text-2xl font-bold">{products.length}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {customProducts} custom · {products.length - customProducts} seeded
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                By category
              </div>
              <div className="flex flex-wrap gap-1.5">
                {byCategory.length === 0 && (
                  <span className="text-xs text-muted-foreground">No products</span>
                )}
                {byCategory.map(([cat, n]) => (
                  <span
                    key={cat}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-xs"
                  >
                    {cat} <b className="text-foreground">{n}</b>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle icon={<Users className="h-4 w-4" />} title="Suppliers" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="Total" value={suppliers.length} />
          <StatCard
            label="With email"
            value={suppliers.filter((s) => s.email).length}
          />
          <StatCard
            label="With website"
            value={suppliers.filter((s) => s.website).length}
          />
          <StatCard
            label="No contact"
            value={suppliers.filter((s) => !s.email && !s.website).length}
          />
        </div>
      </section>

      <section>
        <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="Recent activity" />
        <Card>
          <CardContent className="py-2">
            {recent.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No activity yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((r) => (
                  <li key={r.key} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{r.kind}</Badge>
                      {r.text}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(r.when)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className={`mt-1 text-3xl font-bold ${accent ? "text-primary" : ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
      {icon}
      {title}
    </h2>
  );
}

// ============= Data tables =============

function DataTables({
  orders,
  supplies,
  products,
}: {
  orders: Order[];
  supplies: Supply[];
  products: CatalogProduct[];
}) {
  return (
    <Tabs defaultValue="orders">
      <TabsList>
        <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
        <TabsTrigger value="supplies">Supplies ({supplies.length})</TabsTrigger>
        <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
      </TabsList>

      <TabsContent value="orders" className="mt-4">
        <OrdersTable orders={orders} />
      </TabsContent>
      <TabsContent value="supplies" className="mt-4">
        <SuppliesTable supplies={supplies} />
      </TabsContent>
      <TabsContent value="products" className="mt-4">
        <ProductsTable products={products} />
      </TabsContent>
    </Tabs>
  );
}

function OrdersTable({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  if (orders.length === 0) return <Empty text="No orders." />;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Order #</th>
            <th className="px-3 py-2">Date</th>
            <th className="px-3 py-2">Created by</th>
            <th className="px-3 py-2">Products</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-muted/30">
              <td className="px-3 py-2 font-mono font-semibold text-primary">
                <button
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  className="hover:underline"
                >
                  {o.orderNumber}
                </button>
                {expanded === o.id && (
                  <div className="mt-2 space-y-2 rounded-md border border-border bg-background p-3 text-xs font-normal font-sans text-foreground">
                    <div className="font-semibold">Products:</div>
                    <ul className="ml-4 list-disc">
                      {o.products.map((p) => (
                        <li key={p.id}>
                          {p.name} <span className="text-muted-foreground">×{p.quantity || "—"}</span>
                        </li>
                      ))}
                    </ul>
                    {o.notes && (
                      <div>
                        <div className="font-semibold">Notes:</div>
                        <div className="whitespace-pre-wrap">{o.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{o.date}</td>
              <td className="px-3 py-2">{o.createdBy || "—"}</td>
              <td className="px-3 py-2">{o.products.length}</td>
              <td className="px-3 py-2">
                <Select
                  value={o.status}
                  onValueChange={(v) => store.updateOrderStatus(o.id, v as OrderStatus)}
                >
                  <SelectTrigger className="h-8 w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete order ${o.orderNumber}?`)) store.deleteOrder(o.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuppliesTable({ supplies }: { supplies: Supply[] }) {
  if (supplies.length === 0) return <Empty text="No supplies." />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Item</th>
            <th className="px-3 py-2">Stock</th>
            <th className="px-3 py-2">Reorder</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Noticed by</th>
            <th className="px-3 py-2">Notes</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {supplies.map((s) => (
            <tr key={s.id} className="hover:bg-muted/30">
              <td className="px-3 py-2 font-semibold">{s.name}</td>
              <td className="px-3 py-2">{s.stock || "—"}</td>
              <td className="px-3 py-2">{s.reorder || "—"}</td>
              <td className="px-3 py-2">
                <StatusChip status={s.status} />
              </td>
              <td className="px-3 py-2">{s.noticedBy || "—"}</td>
              <td className="max-w-xs truncate px-3 py-2 text-muted-foreground">
                {s.notes || "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete supply "${s.name}"?`)) store.deleteSupply(s.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ProductsTable({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) return <Empty text="No products." />;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Category</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-muted/30">
              <td className="px-3 py-2 font-medium">{p.name}</td>
              <td className="px-3 py-2">{p.category}</td>
              <td className="px-3 py-2">
                {p.isCustom ? (
                  <Badge variant="outline">Custom</Badge>
                ) : (
                  <Badge variant="secondary">Seeded</Badge>
                )}
              </td>
              <td className="px-3 py-2 text-right">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Delete product "${p.name}"?`)) store.forceDeleteProduct(p.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusChip({ status }: { status: "ok" | "low" | "reorder" }) {
  const map = {
    ok: { label: "OK", cls: "bg-emerald-100 text-emerald-800" },
    low: { label: "Low", cls: "bg-amber-100 text-amber-800" },
    reorder: { label: "Reorder", cls: "bg-primary text-primary-foreground" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

// ============= Activity log =============

function ActivityLog({ orders, supplies }: { orders: Order[]; supplies: Supply[] }) {
  const [filter, setFilter] = useState("");

  type Event = { when: number; user: string; kind: string; text: string };
  const events = useMemo<Event[]>(() => {
    const list: Event[] = [];
    for (const o of orders) {
      if (o.createdBy) {
        list.push({
          when: o.createdAt,
          user: o.createdBy,
          kind: "Created order",
          text: o.orderNumber,
        });
      }
      if (o.completedAt) {
        list.push({
          when: o.completedAt,
          user: "Production",
          kind: "Completed order",
          text: o.orderNumber,
        });
      }
    }
    for (const s of supplies) {
      if (s.noticedBy && s.noticedByOffice) {
        list.push({
          when: s.updatedAt,
          user: s.noticedBy,
          kind: "Noticed supply",
          text: s.name,
        });
      }
    }
    return list.sort((a, b) => b.when - a.when);
  }, [orders, supplies]);

  const byUser = useMemo(() => {
    const map = new Map<string, { orders: number; supplies: number; completed: number; last: number }>();
    for (const e of events) {
      const entry = map.get(e.user) ?? { orders: 0, supplies: 0, completed: 0, last: 0 };
      if (e.kind === "Created order") entry.orders++;
      else if (e.kind === "Completed order") entry.completed++;
      else if (e.kind === "Noticed supply") entry.supplies++;
      entry.last = Math.max(entry.last, e.when);
      map.set(e.user, entry);
    }
    return Array.from(map.entries()).sort((a, b) => b[1].last - a[1].last);
  }, [events]);

  const q = filter.trim().toLowerCase();
  const filtered = q
    ? events.filter((e) => e.user.toLowerCase().includes(q) || e.text.toLowerCase().includes(q))
    : events;

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle icon={<Users className="h-4 w-4" />} title="By user" />
        {byUser.length === 0 ? (
          <Empty text="No user activity recorded yet." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {byUser.map(([user, s]) => (
              <Card key={user}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{user}</span>
                    <span className="text-xs text-muted-foreground">{formatRelative(s.last)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <Chip>{s.orders} orders created</Chip>
                    <Chip>{s.completed} completed</Chip>
                    <Chip>{s.supplies} supplies noticed</Chip>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <SectionTitle icon={<ClipboardList className="h-4 w-4" />} title="All events" />
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by user or item…"
            className="h-8 w-56"
          />
        </div>
        {filtered.length === 0 ? (
          <Empty text="No matching events." />
        ) : (
          <Card>
            <CardContent className="py-2">
              <ul className="divide-y divide-border">
                {filtered.map((e, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">{e.kind}</Badge>
                      <b>{e.user}</b>
                      <span className="text-muted-foreground">— {e.text}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatRelative(e.when)}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5">
      {children}
    </span>
  );
}

function formatRelative(when: number): string {
  const diff = Date.now() - when;
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(when).toLocaleDateString();
}