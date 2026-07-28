import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { unlockSite } from "@/lib/site-gate.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FlowSyncLogo, BptLogo } from "@/components/flowsync/Logos";

type UnlockSearch = { redirect?: string };

export const Route = createFileRoute("/unlock")({
  validateSearch: (search: Record<string, unknown>): UnlockSearch => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  component: UnlockPage,
});

function UnlockPage() {
  const navigate = useNavigate();
  const { redirect } = useSearch({ from: "/unlock" });
  const unlock = useServerFn(unlockSite);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await unlock({ data: { password } });
      if (!res.ok) {
        if (res.retryAfterSeconds) {
          const mins = Math.ceil(res.retryAfterSeconds / 60);
          setError(`Too many attempts. Try again in about ${mins} min.`);
        } else {
          setError("Incorrect password");
        }
        setPassword("");
        return;
      }
      const target =
        redirect && redirect.startsWith("/") && !redirect.startsWith("/unlock")
          ? redirect
          : "/";
      window.location.assign(target);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center justify-between">
          <FlowSyncLogo />
          <BptLogo />
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-foreground">Enter site password</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This is an internal BPT tool. Enter the site password to continue.
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="site-password" className="mb-1 block text-sm font-medium">
                Password
              </label>
              <Input
                id="site-password"
                type="password"
                autoComplete="current-password"
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && (
                <p className="mt-2 text-sm text-destructive">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={busy || !password}>
              {busy ? "Checking…" : "Enter"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}