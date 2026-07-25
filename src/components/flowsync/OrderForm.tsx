import { useMemo, useState } from "react";
import { Plus, Trash2, Search, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [assignedTo, setAssignedTo] = useState("");

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
    await store.addOrder({
      orderNumber,
      date,
      notes,
      products: cleaned,
      createdBy,
      assignedTo,
    });
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

  const catalogByName = useMemo(
    () => new Map(catalog.map((p) => [p.name, p])),
    [catalog],
  );

  const stockWarnings = products
    .map((p) => {
      const cat = catalogByName.get(p.name);
      const qty = parseInt(p.quantity, 10);
      if (!cat || !Number.isFinite(qty) || qty <= 0) return null;
      if (qty > (cat.stock ?? 0)) return `${p.name}: only ${cat.stock} in stock`;
      return null;
    })
    .filter((x): x is string => x !== null);

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

      <div className="space-y-1.5">
        <Label htmlFor="assign">Assign to worker (optional)</Label>
        <Input
          id="assign"
          value={assignedTo}
          onChange={(e) => setAssignedTo(e.target.value)}
          placeholder="e.g. Mark"
        />
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
                        <span className="min-w-0 flex-1 truncate pr-2">{p.name}</span>
                        <span
                          className={`mr-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            p.stock <= 0
                              ? "bg-primary/15 text-primary"
                              : p.stock <= (p.lowStock ?? 0)
                                ? "bg-amber-100 text-amber-800"
                                : "bg-muted text-muted-foreground"
                          }`}
                          title="Current stock"
                        >
                          {p.stock}
                        </span>
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
              products.map((p, i) => {
                const cat = catalogByName.get(p.name);
                const materials = cat?.materials ?? [];
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 border-b border-border px-2 py-2 last:border-b-0"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-muted text-xs font-semibold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div className="min-w-0 flex-1 text-sm">
                      {p.name}
                      {cat && (
                        <span className="ml-2 text-[10px] text-muted-foreground">
                          stock {cat.stock}
                        </span>
                      )}
                    </div>
                    {materials.length > 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="View materials"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 text-sm">
                          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Materials
                          </div>
                          <ul className="space-y-1">
                            {materials.map((m, mi) => (
                              <li key={mi} className="flex justify-between gap-2">
                                <span className="truncate">{m.name}</span>
                                <span className="shrink-0 font-mono text-muted-foreground">
                                  {m.quantity}
                                  {m.unit && ` ${m.unit}`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </PopoverContent>
                      </Popover>
                    )}
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
                );
              })
            )}
          </div>
        </div>
      </div>

      {stockWarnings.length > 0 && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          <div className="mb-1 font-semibold text-amber-800 dark:text-amber-200">
            Stock warning (order can still be sent):
          </div>
          <ul className="ml-4 list-disc text-amber-900 dark:text-amber-100">
            {stockWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

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