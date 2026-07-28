// Persistent outbox for offline-first Supabase writes.
// Each op is a single-table statement understood by supabase-js.
import { supabase } from "@/integrations/supabase/client";

export type OutboxOp = {
  id: string;
  table: string;
  action: "insert" | "update" | "delete" | "upsert";
  values?: Record<string, unknown>;
  match?: { col: string; val: string | number };
  createdAt: number;
};

const KEY = "flowsync-outbox-v1";
const listeners = new Set<() => void>();
let flushing = false;

function read(): OutboxOp[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
function write(ops: OutboxOp[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ops));
  } catch {
    /* quota */
  }
  listeners.forEach((l) => l());
}

export function outboxSize(): number {
  return read().length;
}

export function subscribeOutbox(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function enqueue(op: OutboxOp) {
  const ops = read();
  ops.push(op);
  write(ops);
}

async function runOp(op: OutboxOp): Promise<{ error: unknown }> {
  const q = supabase.from(op.table as never);
  let builder: unknown;
  if (op.action === "insert") builder = (q as never as { insert: (v: unknown) => unknown }).insert(op.values);
  else if (op.action === "upsert") builder = (q as never as { upsert: (v: unknown) => unknown }).upsert(op.values);
  else if (op.action === "update") {
    const u = (q as never as { update: (v: unknown) => { eq: (c: string, v: unknown) => unknown } }).update(op.values);
    builder = op.match ? u.eq(op.match.col, op.match.val) : u;
  } else if (op.action === "delete") {
    const d = (q as never as { delete: () => { eq: (c: string, v: unknown) => unknown; not: (c: string, o: string, v: unknown) => unknown } }).delete();
    builder = op.match ? d.eq(op.match.col, op.match.val) : d.not("id", "is", null);
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await (builder as any);
    return { error: res?.error ?? null };
  } catch (e) {
    return { error: e };
  }
}

/** Attempt op immediately; on network/error, persist to outbox. */
export async function submit(op: Omit<OutboxOp, "id" | "createdAt">) {
  const full: OutboxOp = {
    ...op,
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    createdAt: Date.now(),
  };
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    enqueue(full);
    return { queued: true as const };
  }
  const { error } = await runOp(full);
  if (error) {
    enqueue(full);
    return { queued: true as const };
  }
  return { queued: false as const };
}

/** Flush queued ops in FIFO order. Stops at first error. */
export async function flush(): Promise<{ done: number; remaining: number }> {
  if (flushing) return { done: 0, remaining: read().length };
  flushing = true;
  let done = 0;
  try {
    while (true) {
      const ops = read();
      if (ops.length === 0) break;
      const head = ops[0];
      const { error } = await runOp(head);
      if (error) {
        console.warn("[outbox] op failed, will retry", head, error);
        break;
      }
      write(ops.slice(1));
      done += 1;
    }
  } finally {
    flushing = false;
  }
  return { done, remaining: read().length };
}

/** Install flushers: online event + interval + initial. */
export function startOutboxFlusher(onAfterFlush?: () => void) {
  if (typeof window === "undefined") return () => {};
  const tick = async () => {
    if (!navigator.onLine) return;
    const before = read().length;
    if (before === 0) return;
    const r = await flush();
    if (r.done > 0) onAfterFlush?.();
  };
  const onOnline = () => void tick();
  window.addEventListener("online", onOnline);
  const iv = window.setInterval(() => void tick(), 15000);
  void tick();
  return () => {
    window.removeEventListener("online", onOnline);
    window.clearInterval(iv);
  };
}