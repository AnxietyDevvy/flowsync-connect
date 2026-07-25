import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlayCircle, CheckCircle2, Trash2, Factory } from "lucide-react";
import { store, useFlowSync, type ManufacturingRequest } from "@/lib/flowsync-store";

export function ManufacturingPanel({ userName }: { userName: string }) {
  const { manufacturing } = useFlowSync();
  const pending = manufacturing.filter((m) => m.status === "pending");
  const inProgress = manufacturing.filter((m) => m.status === "in_progress");
  const completed = manufacturing.filter((m) => m.status === "completed");

  return (
    <div className="space-y-6">
      <Column
        title="Pending"
        subtitle="Sent by Office, waiting to start."
        accent
        items={pending}
        empty="No pending requests."
        renderActions={(m) => (
          <>
            <Button size="sm" onClick={() => store.startManufacturing(m.id, userName)}>
              <PlayCircle className="mr-1 h-4 w-4" /> Start
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm(`Delete request for "${m.supplyName}"?`))
                  store.deleteManufacturing(m.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      />
      <Column
        title="In progress"
        subtitle="Currently being remade."
        items={inProgress}
        empty="Nothing in progress."
        renderActions={(m) => (
          <Button
            size="sm"
            onClick={() => store.completeManufacturing(m.id, userName)}
          >
            <CheckCircle2 className="mr-1 h-4 w-4" /> Complete
          </Button>
        )}
      />
      <Column
        title="Completed"
        subtitle="Finished manufacturing requests."
        items={completed.slice(0, 20)}
        empty="No completed requests yet."
      />
    </div>
  );
}

function Column({
  title,
  subtitle,
  items,
  empty,
  accent,
  renderActions,
}: {
  title: string;
  subtitle: string;
  items: ManufacturingRequest[];
  empty: string;
  accent?: boolean;
  renderActions?: (m: ManufacturingRequest) => React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
          <Factory className="h-4 w-4" /> {title}
          <Badge variant={accent ? "destructive" : "outline"}>{items.length}</Badge>
        </h3>
        <span className="text-xs text-muted-foreground">{subtitle}</span>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-2">
          {items.map((m) => (
            <Card key={m.id} className={accent ? "border-primary/40" : ""}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{m.supplyName}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {m.requestedBy && <>requested by {m.requestedBy} · </>}
                    {formatWhen(m.requestedAt)}
                    {m.startedBy && <> · started by {m.startedBy}</>}
                    {m.completedBy && <> · completed by {m.completedBy}</>}
                    {m.notes && <> · {m.notes}</>}
                  </div>
                </div>
                {renderActions && (
                  <div className="flex gap-2">{renderActions(m)}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function formatWhen(when: number) {
  const diff = Date.now() - when;
  const m = Math.round(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(when).toLocaleDateString();
}