import { useEffect, useState } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useOnline } from "@/hooks/use-online";
import { flush, outboxSize, subscribeOutbox } from "@/lib/offline/outbox";

export function SyncStatus() {
  const online = useOnline();
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setPending(outboxSize());
    const un = subscribeOutbox(() => setPending(outboxSize()));
    return () => {
      un();
    };
  }, []);

  async function syncNow() {
    if (!online || busy) return;
    setBusy(true);
    try {
      await flush();
      setPending(outboxSize());
    } finally {
      setBusy(false);
    }
  }

  let label = "Online";
  let tone = "border-border text-muted-foreground";
  let Icon = Cloud;
  if (!online) {
    label = pending > 0 ? `Offline · ${pending} queued` : "Offline";
    tone = "border-primary/40 bg-primary/10 text-primary";
    Icon = CloudOff;
  } else if (pending > 0 || busy) {
    label = busy ? "Syncing…" : `Syncing ${pending}`;
    tone = "border-primary/40 bg-primary/10 text-primary";
    Icon = RefreshCw;
  }

  return (
    <button
      type="button"
      onClick={syncNow}
      disabled={!online || busy || pending === 0}
      title={
        online
          ? pending > 0
            ? "Click to sync now"
            : "All changes synced"
          : "You're offline — changes will sync automatically when you reconnect"
      }
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${tone} ${
        online && pending > 0 ? "hover:bg-primary/20" : ""
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${busy ? "animate-spin" : ""}`} />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}