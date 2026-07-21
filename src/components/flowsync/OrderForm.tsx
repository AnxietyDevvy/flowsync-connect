import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { store, nextOrderNumber, type Order, type Product } from "@/lib/flowsync-store";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function OrderForm({
  orders,
  onDone,
}: {
  orders: Order[];
  onDone: () => void;
}) {
  const [orderNumber, setOrderNumber] = useState(() => nextOrderNumber(orders));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<Product[]>([
    { id: uid(), name: "", quantity: "" },
  ]);

  const update = (id: string, patch: Partial<Product>) =>
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const remove = (id: string) =>
    setProducts((p) => (p.length > 1 ? p.filter((x) => x.id !== id) : p));
  const add = () =>
    setProducts((p) => [...p, { id: uid(), name: "", quantity: "" }]);

  const handleCreate = (send: boolean) => {
    const cleaned = products.filter((p) => p.name.trim());
    if (!orderNumber.trim() || cleaned.length === 0) return;
    store.addOrder({ orderNumber, date, notes, products: cleaned });
    if (send) {
      try {
        const raw = JSON.parse(localStorage.getItem("flowsync-state-v1") || "{}");
        const match = (raw.orders || []).find((o: Order) => o.orderNumber === orderNumber);
        if (match) store.sendOrder(match.id);
      } catch {}
    }
    onDone();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="ordernum">Order number</Label>
          <Input
            id="ordernum"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Products</Label>
          <Button type="button" variant="outline" size="sm" onClick={add}>
            <Plus className="mr-1 h-4 w-4" /> Add product
          </Button>
        </div>
        <div className="space-y-2">
          {products.map((p, i) => (
            <div key={p.id} className="flex gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                {i + 1}
              </div>
              <Input
                placeholder="Product name"
                value={p.name}
                onChange={(e) => update(p.id, { name: e.target.value })}
                className="flex-1"
              />
              <Input
                placeholder="Qty"
                value={p.quantity}
                onChange={(e) => update(p.id, { quantity: e.target.value })}
                className="w-24"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(p.id)}
                disabled={products.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special instructions, delivery info, etc."
        />
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
        <Button variant="secondary" onClick={() => handleCreate(false)}>
          Save as draft
        </Button>
        <Button onClick={() => handleCreate(true)}>Send to production</Button>
      </div>
    </div>
  );
}