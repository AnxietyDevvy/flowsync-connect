import { useState } from "react";
import { toast } from "sonner";
import { Building2, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { store, useFlowSync } from "@/lib/flowsync-store";

export type CompanyEntry = { id: string; name: string; url: string };

function newId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CompaniesManager() {
  const { settings } = useFlowSync();
  const companies: CompanyEntry[] = Array.isArray(settings.companies)
    ? (settings.companies as CompanyEntry[])
    : [];
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const persist = async (next: CompanyEntry[]) => {
    await store.setSetting("companies", next);
    toast.success("Companies updated");
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const u = url.trim().replace(/\/+$/, "");
    if (!n || !u) {
      toast.error("Enter both a company name and its link");
      return;
    }
    await persist([...companies, { id: newId(), name: n, url: u }]);
    setName("");
    setUrl("");
  };

  const remove = (id: string) => persist(companies.filter((c) => c.id !== id));

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Companies</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Every company runs its own private copy of FlowSync. Add each company's
            link here so you can jump to any of them from one place. Clicking a
            company opens its dev section (append <code className="rounded bg-muted px-1">/dev</code>).
          </p>
          {companies.length === 0 ? (
            <p className="rounded border border-dashed p-4 text-sm text-muted-foreground">
              No companies yet. Add the first one below.
            </p>
          ) : (
            <ul className="space-y-2">
              {companies.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.url}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <a
                      href={`${c.url}/dev`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-md border border-input bg-background px-2 py-1 text-xs hover:bg-accent"
                    >
                      <ExternalLink className="h-3 w-3" /> Open
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={() => remove(c.id)}
                      aria-label={`Remove ${c.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <h3 className="mb-1 text-lg font-semibold">Add a company</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Record a company's live link (for example{" "}
            <code className="rounded bg-muted px-1">https://acme.lovable.app</code>).
            The link is saved in this instance's settings.
          </p>
          <form onSubmit={add} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="company-name">Company name</Label>
              <Input
                id="company-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Ltd"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="company-url">Link</Label>
              <Input
                id="company-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://acme.lovable.app"
              />
            </div>
            <Button type="submit" className="w-full">
              <Plus className="mr-1 h-4 w-4" /> Add company
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
