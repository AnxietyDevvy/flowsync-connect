import { useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  store,
  nextOrderNumber,
  useFlowSync,
  type Order,
  type Product,
} from "@/lib/flowsync-store";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function OrderForm({
  orders,
  createdBy,
  onDone,
}: {
  orders: Order[];
  createdBy: string;
  onDone: () => void;
}) {
  const { products: catalog } = useFlowSync();
  const [orderNumber, setOrderNumber] = useState(() => nextOrderNumber(orders));
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState("");

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? catalog.filter((p) => p.name.toLowerCase().includes(q))
      : catalog;
    const map = new Map<string, typeof catalog>();
    for (const p of filtered) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return Array.from(map.entries());
  }, [catalog, query]);

  const setQty = (id: string, quantity: string) =>
    setProducts((p) => p.map((x) => (x.id === id ? { ...x, quantity } : x)));
  const remove = (id: string) =>
    setProducts((p) => p.filter((x) => x.id !== id));
  const addFromCatalog = (name: string) => {
    if (products.some((p) => p.name === name)) return;
    setProducts((p) => [...p, { id: uid(), name, quantity: "1" }]);
  };

  const handleCreate = async (send: boolean) => {
    const cleaned = products.filter((p) => p.name.trim() && p.quantity.trim());
    if (!orderNumber.trim() || cleaned.length === 0) return;
    await store.addOrder({ orderNumber, date, notes, products: cleaned, createdBy });
    if (send) {
      // After insert + refresh, find the row by its unique order number.
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("orders")
        .select("id")
        .eq("order_number", orderNumber)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.id) await store.sendOrder(data.id);
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Product catalog</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="h-72 overflow-y-auto rounded-md border border-border">
            {grouped.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                No products match "{query}"
              </div>
            ) : (
              grouped.map(([category, items]) => (
                <div key={category}>
                  <div className="sticky top-0 border-b border-border bg-muted px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {category}
                  </div>
                  {items.map((p) => {
                    const added = products.some((x) => x.name === p.name);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addFromCatalog(p.name)}
                        disabled={added}
                        className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted disabled:opacity-50"
                      >
                        <span className="truncate pr-2">{p.name}</span>
                        {added ? (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Added
                          </span>
                        ) : (
                          <Plus className="h-4 w-4 shrink-0 text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>
            Selected products{" "}
            <span className="text-muted-foreground">({products.length})</span>
          </Label>
          <div className="h-72 overflow-y-auto rounded-md border border-border">
            {products.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-center text-xs text-muted-foreground">
                Pick products from the catalog to add them to this order.
              </div>
            ) : (
              products.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 border-b border-border px-2 py-2 last:border-b-0"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1 text-sm">{p.name}</div>
                  <Input
                    aria-label="Quantity"
                    value={p.quantity}
                    onChange={(e) => setQty(p.id, e.target.value)}
                    className="h-8 w-16 text-center"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => remove(p.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
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