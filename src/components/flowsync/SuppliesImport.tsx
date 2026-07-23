import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { store, useFlowSync } from "@/lib/flowsync-store";
import {
  buildImportPlan,
  parseSuppliesFile,
  type ImportPlan,
  type ImportRow,
} from "@/lib/supplies-import";

export function SuppliesImport({ importedBy }: { importedBy: string }) {
  const { supplies } = useFlowSync();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [parseProblems, setParseProblems] = useState<
    { rowIndex: number; reason: string }[]
  >([]);
  const [headers, setHeaders] = useState<Record<string, string | null> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = () => inputRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    try {
      const { rows, problems, headersFound } = await parseSuppliesFile(file);
      setParseProblems(problems);
      setHeaders(headersFound);
      setPlan(buildImportPlan(rows, supplies));
      setOpen(true);
    } catch (err) {
      console.error(err);
      setError("Could not read this file. Make sure it's .xlsx or .csv.");
      setOpen(true);
    }
  };

  const confirm = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      for (const row of plan.toInsert) {
        await store.addSupply({
          name: row.name,
          stock: row.stock,
          reorder: row.reorder,
          notes: row.notes,
          status: row.status,
        });
      }
      for (const { id, row } of plan.toUpdate) {
        await store.updateSupply(id, {
          stock: row.stock,
          reorder: row.reorder,
          notes: row.notes,
          status: row.status,
          noticedByOffice: false,
          noticedBy: `imported by ${importedBy}`,
        });
      }
      setOpen(false);
      setPlan(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={onFile}
      />
      <Button variant="outline" onClick={pick}>
        <Upload className="mr-1 h-4 w-4" /> Import Excel
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" /> Import supplies
            </DialogTitle>
          </DialogHeader>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {plan && (
            <div className="space-y-4 text-sm">
              {headers && !headers.name && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    No <b>Item name</b> column detected. Add a header row with
                    columns like <code>Item name</code>, <code>Stock</code>,
                    <code>Reorder</code>, <code>Notes</code>.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 text-center">
                <Stat label="Will add" value={plan.toInsert.length} />
                <Stat label="Will update" value={plan.toUpdate.length} />
                <Stat label="Problems" value={parseProblems.length} tone="warn" />
              </div>

              {headers && (
                <div className="rounded-md border border-border p-3 text-xs text-muted-foreground">
                  <div className="mb-1 font-semibold text-foreground">Detected columns</div>
                  <div>Item name: <b className="text-foreground">{headers.name ?? "not found"}</b></div>
                  <div>Stock: <b className="text-foreground">{headers.stock ?? "not found"}</b></div>
                  <div>Reorder: <b className="text-foreground">{headers.reorder ?? "not found"}</b></div>
                  <div>Notes: <b className="text-foreground">{headers.notes ?? "not found"}</b></div>
                </div>
              )}

              {parseProblems.length > 0 && (
                <div className="max-h-32 overflow-auto rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                  {parseProblems.slice(0, 20).map((p, i) => (
                    <div key={i}>Row {p.rowIndex}: {p.reason}</div>
                  ))}
                  {parseProblems.length > 20 && (
                    <div>…and {parseProblems.length - 20} more</div>
                  )}
                </div>
              )}

              <Preview rows={plan.toInsert.slice(0, 5)} label="New items (first 5)" />
              <Preview
                rows={plan.toUpdate.slice(0, 5).map((u) => u.row)}
                label="Updates (first 5)"
              />

              <p className="text-xs text-muted-foreground">
                Status is auto-calculated: <b>Reorder</b> if stock ≤ 0, <b>Low</b>{" "}
                if stock ≤ reorder, otherwise <b>OK</b>. Items in the app but not
                in the file are left alone.
              </p>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
                  Cancel
                </Button>
                <Button
                  onClick={confirm}
                  disabled={busy || (plan.toInsert.length + plan.toUpdate.length === 0)}
                >
                  {busy ? "Importing…" : `Import ${plan.toInsert.length + plan.toUpdate.length} rows`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "warn" }) {
  return (
    <div
      className={`rounded-md border p-3 ${
        tone === "warn" && value > 0
          ? "border-amber-300 bg-amber-50"
          : "border-border"
      }`}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Preview({ rows, label }: { rows: ImportRow[]; label: string }) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="divide-y divide-border rounded-md border border-border text-xs">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center justify-between px-2 py-1.5">
            <span className="truncate">{r.name}</span>
            <span className="text-muted-foreground">
              stock {r.stock || "—"} / reorder {r.reorder || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}