import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DEV_PASSWORD,
  DEV_UNLOCK_KEY,
  getEffectivePassword,
  store,
  useFlowSync,
} from "@/lib/flowsync-store";
import { SectionHeader } from "@/components/flowsync/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { AlertTriangle, Download, Upload, Lock, Trash2 } from "lucide-react";
import { Overview, DataTables, ActivityLog } from "./admin";

export const Route = createFileRoute("/dev")({
  component: DevPage,
});

function DevPage() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    setUnlocked(sessionStorage.getItem(DEV_UNLOCK_KEY) === "1");
  }, []);
  if (!unlocked) return <DevGate onUnlock={() => setUnlocked(true)} />;
  return <DevApp onLock={() => { sessionStorage.removeItem(DEV_UNLOCK_KEY); setUnlocked(false); }} />;
}

function DevGate({ onUnlock }: { onUnlock: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw !== getEffectivePassword("dev") && pw !== DEV_PASSWORD) {
      setError("Incorrect key");
      return;
    }
    sessionStorage.setItem(DEV_UNLOCK_KEY, "1");
    onUnlock();
  };
  return (
    <div className="min-h-screen bg-background">
      <SectionHeader label="Dev" />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-6 py-16">
        <div className="flex items-center gap-3">
          <Lock className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Developer access</h1>
            <p className="text-sm text-muted-foreground">Enter the dev key to continue.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            value={pw}
            onChange={(e) => { setPw(e.target.value); setError(""); }}
            placeholder="Dev key"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full">Unlock</Button>
        </form>
      </main>
    </div>
  );
}

function DevApp({ onLock }: { onLock: () => void }) {
  const { orders, supplies, products, suppliers, manufacturing } = useFlowSync();
  return (
    <div className="min-h-screen bg-background">
      <SectionHeader label="Dev" onLock={onLock} />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="data">Data tables</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="danger" className="text-destructive">Danger zone</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="mt-6">
            <Overview
              orders={orders}
              supplies={supplies}
              products={products}
              suppliers={suppliers}
              manufacturing={manufacturing}
            />
          </TabsContent>
          <TabsContent value="data" className="mt-6">
            <DataTables
              orders={orders}
              supplies={supplies}
              products={products}
              suppliers={suppliers}
              manufacturing={manufacturing}
            />
          </TabsContent>
          <TabsContent value="activity" className="mt-6">
            <ActivityLog orders={orders} supplies={supplies} />
          </TabsContent>
          <TabsContent value="settings" className="mt-6">
            <DevSettings />
          </TabsContent>
          <TabsContent value="danger" className="mt-6">
            <DevDangerZone />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function DevSettings() {
  const { settings } = useFlowSync();
  const flags = useMemo(
    () => [
      { key: "feature_manufacturing", label: "Manufacturing tab (Production)" },
      { key: "feature_suppliers", label: "Suppliers tab (Office)" },
      { key: "feature_send_to_manufacturing", label: "Send-to-Manufacturing button" },
    ],
    [],
  );
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardContent className="space-y-3 py-4">
          <h3 className="text-lg font-semibold">Passwords</h3>
          <p className="text-sm text-muted-foreground">
            Section passwords are compiled into the app and are no longer stored in the
            database. To change them, update the constants in
            <code className="mx-1 rounded bg-muted px-1">src/lib/flowsync-store.ts</code>
            (<code>OFFICE_PASSWORD</code>, <code>ADMIN_PASSWORD</code>, <code>DEV_PASSWORD</code>).
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="space-y-4 py-4">
          <h3 className="text-lg font-semibold">Feature flags</h3>
          {flags.map((f) => (
            <div key={f.key} className="flex items-center justify-between">
              <Label htmlFor={f.key}>{f.label}</Label>
              <Switch
                id={f.key}
                checked={settings[f.key] !== false}
                onCheckedChange={async (v) => {
                  await store.setSetting(f.key, v);
                  toast.success("Setting updated");
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function DevDangerZone() {
  const [busy, setBusy] = useState(false);

  const wrap = async (label: string, fn: () => Promise<void>) => {
    if (!confirm(`${label}\n\nThis cannot be undone. Continue?`)) return;
    setBusy(true);
    try {
      await fn();
      toast.success(`${label} done`);
    } catch (e) {
      toast.error(`${label} failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  const doExport = async () => {
    const snap = await store.exportSnapshot();
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flowsync-snapshot-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    if (!confirm("This will WIPE all current data and replace it with the snapshot. Continue?")) return;
    setBusy(true);
    try {
      await store.importSnapshot(parsed);
      toast.success("Snapshot imported");
    } catch (e) {
      toast.error(`Import failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/40">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Wipe by status</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="destructive" size="sm" disabled={busy}
              onClick={() => wrap("Delete all DRAFT orders", () => store.wipeOrdersByStatus("draft"))}>
              <Trash2 className="mr-1 h-4 w-4" /> Draft orders
            </Button>
            <Button variant="destructive" size="sm" disabled={busy}
              onClick={() => wrap("Delete all SENT orders", () => store.wipeOrdersByStatus("sent"))}>
              <Trash2 className="mr-1 h-4 w-4" /> Sent orders
            </Button>
            <Button variant="destructive" size="sm" disabled={busy}
              onClick={() => wrap("Delete all COMPLETED orders", () => store.wipeOrdersByStatus("completed"))}>
              <Trash2 className="mr-1 h-4 w-4" /> Completed orders
            </Button>
            <Button variant="destructive" size="sm" disabled={busy}
              onClick={() => wrap("Delete completed manufacturing requests", () => store.wipeCompletedManufacturing())}>
              <Trash2 className="mr-1 h-4 w-4" /> Completed manufacturing
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardContent className="space-y-3 py-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Reset entire tables</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(["orders", "supplies", "products", "suppliers", "manufacturing_requests"] as const).map((t) => (
              <Button key={t} variant="destructive" size="sm" disabled={busy}
                onClick={() => wrap(`Reset table: ${t}`, () => store.resetTable(t))}>
                <Trash2 className="mr-1 h-4 w-4" /> {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 py-4">
          <h3 className="text-lg font-semibold">Backup & restore</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={doExport} disabled={busy}>
              <Download className="mr-1 h-4 w-4" /> Export snapshot (.json)
            </Button>
            <label className="inline-flex">
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void doImport(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" asChild disabled={busy}>
                <span><Upload className="mr-1 h-4 w-4" /> Import snapshot</span>
              </Button>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Snapshot includes orders, supplies, products, suppliers, manufacturing requests, and settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}