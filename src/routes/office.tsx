import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Send, Eye, Trash2, CheckCircle2 } from "lucide-react";
import { SectionHeader } from "@/components/flowsync/SectionHeader";
import { FlowSyncLogo } from "@/components/flowsync/Logos";
import { OrderForm } from "@/components/flowsync/OrderForm";
import { ProductsManager } from "@/components/flowsync/ProductsManager";
import {
  OFFICE_PASSWORD,
  OFFICE_UNLOCK_KEY,
  store,
  useFlowSync,
  type Order,
} from "@/lib/flowsync-store";

export const Route = createFileRoute("/office")({
  component: OfficePage,
});

function OfficePage() {
  const [unlocked, setUnlocked] = useState<boolean | null>(null);

  useEffect(() => {
    setUnlocked(
      typeof window !== "undefined" &&
        sessionStorage.getItem(OFFICE_UNLOCK_KEY) === "1",
    );
  }, []);

  if (unlocked === null) return null;
  if (!unlocked) return <OfficeGate onUnlock={() => setUnlocked(true)} />;
  return (
    <OfficeApp
      onLock={() => {
        sessionStorage.removeItem(OFFICE_UNLOCK_KEY);
        setUnlocked(false);
      }}
    />
  );
}

function OfficeGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);
  const [redirect, setRedirect] = useState(false);

  if (redirect) return <Navigate to="/" />;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === OFFICE_PASSWORD) {
      sessionStorage.setItem(OFFICE_UNLOCK_KEY, "1");
      onUnlock();
    } else {
      setError(true);
    }
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
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-xl font-bold">Office access</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the office password to continue.
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="pw">Password</Label>
                <Input
                  id="pw"
                  type="password"
                  value={pw}
                  autoFocus
                  onChange={(e) => {
                    setPw(e.target.value);
                    setError(false);
                  }}
                />
                {error && (
                  <p className="text-xs font-medium text-primary">
                    Incorrect password
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full">
                Unlock Office
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

function OfficeApp({ onLock }: { onLock: () => void }) {
  const { orders, supplies } = useFlowSync();
  const [creating, setCreating] = useState(false);
  const [viewing, setViewing] = useState<Order | null>(null);

  const newSupplies = supplies.filter((s) => !s.noticedByOffice).length;

  return (
    <div className="min-h-screen bg-background">
      <SectionHeader label="Office" onLock={onLock} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders">Package orders</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="supplies" className="gap-2">
              Supplies
              {newSupplies > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                  {newSupplies}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Package orders</h2>
                <p className="text-sm text-muted-foreground">
                  Create orders and send them to production.
                </p>
              </div>
              <Dialog open={creating} onOpenChange={setCreating}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-1 h-4 w-4" /> New order
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>New package order</DialogTitle>
                  </DialogHeader>
                  <OrderForm orders={orders} onDone={() => setCreating(false)} />
                </DialogContent>
              </Dialog>
            </div>

            {orders.length === 0 ? (
              <EmptyState
                title="No orders yet"
                description="Create your first package order to get started."
              />
            ) : (
              <div className="grid gap-3">
                {orders.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onView={() => setViewing(o)}
                    onSend={() => store.sendOrder(o.id)}
                    onDelete={() => store.deleteOrder(o.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Product catalog</h2>
              <p className="text-sm text-muted-foreground">
                Manage the list of products available when creating orders.
              </p>
            </div>
            <ProductsManager />
          </TabsContent>

          <TabsContent value="supplies" className="mt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Supplies</h2>
              <p className="text-sm text-muted-foreground">
                Read-only view. Mark items as noticed to clear alerts.
              </p>
            </div>
            {supplies.length === 0 ? (
              <EmptyState
                title="No supplies yet"
                description="Production hasn't added any supplies."
              />
            ) : (
              <div className="grid gap-3">
                {supplies.map((s) => (
                  <Card key={s.id} className={!s.noticedByOffice ? "border-primary/40" : ""}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{s.name}</span>
                          <SupplyBadge status={s.status} />
                          {!s.noticedByOffice && (
                            <Badge variant="destructive">New</Badge>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Stock: <b className="text-foreground">{s.stock || "—"}</b></span>
                          <span>Reorder at: <b className="text-foreground">{s.reorder || "—"}</b></span>
                          {s.notes && <span>Notes: {s.notes}</span>}
                        </div>
                      </div>
                      {!s.noticedByOffice && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => store.noticeSupply(s.id)}
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" /> Mark noticed
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-lg">
          {viewing && <OrderView order={viewing} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OrderCard({
  order,
  onView,
  onSend,
  onDelete,
}: {
  order: Order;
  onView: () => void;
  onSend: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {order.date} · {order.products.length} product
            {order.products.length !== 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onView}>
            <Eye className="mr-1 h-4 w-4" /> View
          </Button>
          {order.status === "draft" && (
            <>
              <Button size="sm" onClick={onSend}>
                <Send className="mr-1 h-4 w-4" /> Send
              </Button>
              <Button variant="ghost" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function OrderView({ order }: { order: Order }) {
  return (
    <div>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="font-mono">{order.orderNumber}</span>
          <OrderStatusBadge status={order.status} />
        </DialogTitle>
      </DialogHeader>
      <div className="mt-4 space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date" value={order.date} />
          <Field label="Products" value={String(order.products.length)} />
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Products
          </div>
          <div className="divide-y divide-border rounded-md border border-border">
            {order.products.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2">
                <span>
                  <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                  {p.name}
                </span>
                <span className="font-mono text-muted-foreground">
                  ×{p.quantity || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
        {order.notes && (
          <Field label="Notes" value={order.notes} multiline />
        )}
      </div>
    </div>
  );
}

function Field({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className={multiline ? "mt-1 whitespace-pre-wrap" : "mt-1"}>{value}</div>
    </div>
  );
}

function OrderStatusBadge({ status }: { status: Order["status"] }) {
  const map = {
    draft: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    sent: { label: "Sent", cls: "bg-primary text-primary-foreground" },
    completed: { label: "Completed", cls: "bg-secondary text-secondary-foreground" },
  };
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}>
      {label}
    </span>
  );
}

function SupplyBadge({ status }: { status: "ok" | "low" | "reorder" }) {
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

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-12 text-center">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export { OrderStatusBadge, SupplyBadge, EmptyState, Field, OrderView };