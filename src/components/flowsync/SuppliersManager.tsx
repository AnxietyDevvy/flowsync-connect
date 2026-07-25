import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Mail, Globe, Search, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { store, useFlowSync, type Supplier } from "@/lib/flowsync-store";

function normalizeWebsite(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

export function SuppliersManager({
  createdBy,
  compact,
}: {
  createdBy: string;
  /** In admin mode, allow editing/deleting any supplier without extra confirmation flow tweaks. */
  compact?: boolean;
}) {
  const { suppliers } = useFlowSync();
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.website.toLowerCase().includes(q),
    );
  }, [suppliers, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search suppliers…"
            className="pl-8"
          />
        </div>
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-1 h-4 w-4" /> New supplier
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>New supplier</DialogTitle>
            </DialogHeader>
            <SupplierForm
              onSubmit={async (v) => {
                await store.addSupplier({ ...v, createdBy });
                setAdding(false);
              }}
              onCancel={() => setAdding(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-12 text-center">
          <h3 className="font-semibold">
            {suppliers.length === 0 ? "No suppliers yet" : "No matches"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {suppliers.length === 0
              ? "Add your first supplier to keep contact info in one place."
              : "Try a different search."}
          </p>
        </div>
      ) : (
        <div className={compact ? "grid gap-2" : "grid gap-3 md:grid-cols-2"}>
          {filtered.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{s.name}</div>
                  <div className="mt-1 flex flex-col gap-1 text-xs">
                    {s.email && (
                      <a
                        href={`mailto:${s.email}`}
                        className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"
                      >
                        <Mail className="h-3 w-3" /> {s.email}
                      </a>
                    )}
                    {s.website && (
                      <a
                        href={normalizeWebsite(s.website)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 break-all text-muted-foreground hover:text-primary"
                      >
                        <Globe className="h-3 w-3 shrink-0" /> {s.website}
                      </a>
                    )}
                    {s.notes && (
                      <span className="text-muted-foreground">{s.notes}</span>
                    )}
                    {s.createdBy && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                        Added by {s.createdBy}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(s)}
                    aria-label="Edit supplier"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      if (confirm(`Delete supplier "${s.name}"?`)) {
                        void store.deleteSupplier(s.id);
                      }
                    }}
                    aria-label="Delete supplier"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit supplier</DialogTitle>
          </DialogHeader>
          {editing && (
            <SupplierForm
              initial={editing}
              onSubmit={async (v) => {
                await store.updateSupplier(editing.id, v);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupplierForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Supplier;
  onSubmit: (v: { name: string; email: string; website: string; notes: string }) => void | Promise<void>;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [website, setWebsite] = useState(initial?.website ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const web = website.trim();
    if (!n) return setError("Enter a supplier name.");
    if (!em && !web) return setError("Add an email or a website (at least one).");
    if (em && !isValidEmail(em)) return setError("That email doesn't look right.");
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name: n,
        email: em,
        website: web ? normalizeWebsite(web) : "",
        notes: notes.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="sname">Name</Label>
        <Input
          id="sname"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Ballistics"
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="semail">Email</Label>
        <Input
          id="semail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="sales@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sweb">Website</Label>
        <Input
          id="sweb"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="example.com"
        />
        <p className="text-[11px] text-muted-foreground">
          Add at least an email or a website.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="snotes">Notes (optional)</Label>
        <Textarea
          id="snotes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Point of contact, phone, lead times…"
        />
      </div>
      {error && <p className="text-xs font-medium text-primary">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          <X className="mr-1 h-4 w-4" /> Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          <Check className="mr-1 h-4 w-4" /> {initial ? "Save changes" : "Add supplier"}
        </Button>
      </div>
    </form>
  );
}