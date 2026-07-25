import { useMemo, useState } from "react";
import { Plus, Trash2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, useFlowSync, type CatalogProduct, type Material } from "@/lib/flowsync-store";

const NEW_CATEGORY = "__new__";

export function ProductsManager() {
  const { products } = useFlowSync();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [lowOnly, setLowOnly] = useState(false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    let filtered = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    if (lowOnly) filtered = filtered.filter((p) => p.stock <= (p.lowStock ?? 0));
    const map = new Map<string, typeof products>();
    for (const p of filtered) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products, query, lowOnly]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory =
      category === NEW_CATEGORY ? newCategory.trim() : category.trim();
    if (!name.trim() || !finalCategory) return;
    store.addProduct(name, finalCategory);
    setName("");
    setNewCategory("");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button
            type="button"
            variant={lowOnly ? "default" : "outline"}
            onClick={() => setLowOnly((v) => !v)}
          >
            Low stock only
          </Button>
        </div>
        {grouped.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            {lowOnly ? "No low-stock products." : `No products match "${query}"`}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(([cat, items]) => (
              <div key={cat}>
                <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {cat}{" "}
                  <span className="text-muted-foreground/60">
                    ({items.length})
                  </span>
                </div>
                <div className="divide-y divide-border rounded-md border border-border">
                  {items.map((p) => (
                    <ProductRow
                      key={p.id}
                      product={p}
                      open={expanded === p.id}
                      onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Card className="h-fit">
        <CardContent className="pt-6">
          <h3 className="mb-4 font-bold">Add product</h3>
          <form onSubmit={handleAdd} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="pname">Product name</Label>
              <Input
                id="pname"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ICW7 Level IV"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pcat">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="pcat">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                  <SelectItem value={NEW_CATEGORY}>+ New category</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {category === NEW_CATEGORY && (
              <div className="space-y-1.5">
                <Label htmlFor="pnewcat">New category name</Label>
                <Input
                  id="pnewcat"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Helmets"
                  required
                />
              </div>
            )}
            <Button type="submit" className="w-full">
              <Plus className="mr-1 h-4 w-4" /> Add to catalog
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function ProductRow({
  product: p,
  open,
  onToggle,
}: {
  product: CatalogProduct;
  open: boolean;
  onToggle: () => void;
}) {
  const low = p.stock <= (p.lowStock ?? 0);
  return (
    <div>
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="min-w-0 truncate">{p.name}</span>
        </button>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
            low ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"
          }`}
          title="Stock"
        >
          {p.stock}
        </span>
        {p.isCustom ? (
          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
            Custom
          </span>
        ) : (
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
            Preset
          </span>
        )}
        {p.isCustom && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0"
            onClick={() => store.deleteProduct(p.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      {open && <ProductEditor product={p} />}
    </div>
  );
}

function ProductEditor({ product: p }: { product: CatalogProduct }) {
  const [stock, setStock] = useState(String(p.stock));
  const [lowStock, setLowStock] = useState(String(p.lowStock));
  const [materials, setMaterials] = useState<Material[]>(p.materials ?? []);

  const saveStock = () => {
    const s = parseInt(stock, 10);
    const l = parseInt(lowStock, 10);
    store.updateProduct(p.id, {
      stock: Number.isFinite(s) ? s : 0,
      lowStock: Number.isFinite(l) ? l : 0,
    });
  };

  const setMat = (i: number, patch: Partial<Material>) =>
    setMaterials((m) => m.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  const addMat = () =>
    setMaterials((m) => [...m, { name: "", quantity: "", unit: "" }]);
  const removeMat = (i: number) =>
    setMaterials((m) => m.filter((_, idx) => idx !== i));
  const saveMaterials = () =>
    store.updateProduct(p.id, {
      materials: materials.filter((m) => m.name.trim()),
    });

  return (
    <div className="space-y-4 border-t border-border bg-muted/30 px-4 py-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Stock
          </Label>
          <Input
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            onBlur={saveStock}
            className="h-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Low-stock threshold
          </Label>
          <Input
            type="number"
            value={lowStock}
            onChange={(e) => setLowStock(e.target.value)}
            onBlur={saveStock}
            className="h-8"
          />
        </div>
      </div>
      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Materials used to produce
          </Label>
          <Button size="sm" variant="ghost" onClick={addMat}>
            <Plus className="mr-1 h-3 w-3" /> Add
          </Button>
        </div>
        {materials.length === 0 ? (
          <p className="text-xs text-muted-foreground">No materials listed.</p>
        ) : (
          <div className="space-y-2">
            {materials.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder="Material"
                  value={m.name}
                  onChange={(e) => setMat(i, { name: e.target.value })}
                  className="h-8 flex-1"
                />
                <Input
                  placeholder="Qty"
                  value={m.quantity}
                  onChange={(e) => setMat(i, { quantity: e.target.value })}
                  className="h-8 w-20"
                />
                <Input
                  placeholder="Unit"
                  value={m.unit}
                  onChange={(e) => setMat(i, { unit: e.target.value })}
                  className="h-8 w-20"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeMat(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <div className="mt-2 flex justify-end">
          <Button size="sm" variant="outline" onClick={saveMaterials}>
            Save materials
          </Button>
        </div>
      </div>
    </div>
  );
}