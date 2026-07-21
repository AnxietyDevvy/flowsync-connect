import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Printer, CheckCircle2, Pencil, Trash2, Inbox } from "lucide-react";
import { SectionHeader } from "@/components/flowsync/SectionHeader";
import { SupplyForm } from "@/components/flowsync/SupplyForm";
import { store, useFlowSync, type Order, type Supply } from "@/lib/flowsync-store";
import { OrderStatusBadge, SupplyBadge, EmptyState, OrderView } from "./office";

export const Route = createFileRoute("/production")({
  component: ProductionPage,
});

function ProductionPage() {
  const { orders, supplies } = useFlowSync();
  const [viewing, setViewing] = useState<Order | null>(null);
  const [supplyDialog, setSupplyDialog] = useState<{ open: boolean; edit?: Supply }>({
    open: false,
  });

  const incoming = orders.filter((o) => o.status !== "draft");
  const pending = incoming.filter((o) => o.status === "sent").length;

  return (
    <div className="min-h-screen bg-background">
      <SectionHeader label="Production" />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="orders">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              Incoming orders
              {pending > 0 && (
                <Badge variant="destructive" className="h-5 min-w-5 px-1.5">
                  {pending}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="supplies">Supplies</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Package orders</h2>
              <p className="text-sm text-muted-foreground">
                Review, complete, and print orders from the office.
              </p>
            </div>
            {incoming.length === 0 ? (
              <EmptyState
                title="No incoming orders"
                description="Orders sent by the office will appear here."
              />
            ) : (
              <div className="grid gap-3">
                {incoming.map((o) => (
                  <ProdOrderCard
                    key={o.id}
                    order={o}
                    onView={() => setViewing(o)}
                    onComplete={() => store.completeOrder(o.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="supplies" className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Supplies</h2>
                <p className="text-sm text-muted-foreground">
                  Track stock levels. Office will be notified of new entries.
                </p>
              </div>
              <Button onClick={() => setSupplyDialog({ open: true })}>
                <Plus className="mr-1 h-4 w-4" /> Add supply
              </Button>
            </div>
            {supplies.length === 0 ? (
              <EmptyState
                title="No supplies yet"
                description="Add your first supply record."
              />
            ) : (
              <div className="grid gap-3">
                {supplies.map((s) => (
                  <Card key={s.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{s.name}</span>
                          <SupplyBadge status={s.status} />
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>Stock: <b className="text-foreground">{s.stock || "—"}</b></span>
                          <span>Reorder at: <b className="text-foreground">{s.reorder || "—"}</b></span>
                          {s.notes && <span>Notes: {s.notes}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSupplyDialog({ open: true, edit: s })}
                        >
                          <Pencil className="mr-1 h-4 w-4" /> Update
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => store.deleteSupply(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
          {viewing && (
            <>
              <OrderView order={viewing} />
              <div className="mt-4 flex justify-end gap-2 border-t border-border pt-4">
                {viewing.status === "sent" && (
                  <Button
                    onClick={() => {
                      store.completeOrder(viewing.id);
                      setViewing(null);
                    }}
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Mark complete
                  </Button>
                )}
                {viewing.status === "completed" && (
                  <Button asChild>
                    <Link to="/production/print/$id" params={{ id: viewing.id }} target="_blank">
                      <Printer className="mr-1 h-4 w-4" /> Print
                    </Link>
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={supplyDialog.open}
        onOpenChange={(o) => setSupplyDialog({ open: o })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{supplyDialog.edit ? "Update supply" : "Add supply"}</DialogTitle>
          </DialogHeader>
          <SupplyForm
            initial={supplyDialog.edit}
            onDone={() => setSupplyDialog({ open: false })}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProdOrderCard({
  order,
  onView,
  onComplete,
}: {
  order: Order;
  onView: () => void;
  onComplete: () => void;
}) {
  return (
    <Card className={order.status === "sent" ? "border-primary/40" : ""}>
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {order.status === "sent" && (
              <Inbox className="h-4 w-4 text-primary" />
            )}
            <span className="font-mono font-bold text-primary">{order.orderNumber}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {order.date} · {order.products.length} product
            {order.products.length !== 1 ? "s" : ""}
            {order.notes && ` · ${order.notes.slice(0, 60)}${order.notes.length > 60 ? "…" : ""}`}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onView}>
            View
          </Button>
          {order.status === "sent" && (
            <Button size="sm" onClick={onComplete}>
              <CheckCircle2 className="mr-1 h-4 w-4" /> Complete
            </Button>
          )}
          {order.status === "completed" && (
            <Button size="sm" asChild>
              <Link to="/production/print/$id" params={{ id: order.id }} target="_blank">
                <Printer className="mr-1 h-4 w-4" /> Print
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}