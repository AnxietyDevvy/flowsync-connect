import { useMemo, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
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
import { store, useFlowSync } from "@/lib/flowsync-store";

const NEW_CATEGORY = "__new__";

export function ProductsManager() {
  const { products } = useFlowSync();
  const [query, setQuery] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return Array.from(set).sort();
  }, [products]);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? products.filter((p) => p.name.toLowerCase().includes(q))
      : products;
    const map = new Map<string, typeof products>();
    for (const p of filtered) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [products, query]);

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
        <div className="mb-3 relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {grouped.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No products match "{query}"
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
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
                    >
                      <span className="min-w-0 truncate">{p.name}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        {p.isCustom ? (
                          <>
                            <span className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase text-secondary-foreground">
                              Custom
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => store.deleteProduct(p.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                            Preset
                          </span>
                        )}
                      </div>
                    </div>
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