import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Building2, Factory } from "lucide-react";
import { useEffect, useState } from "react";
import { FlowSyncLogo, BptLogo } from "@/components/flowsync/Logos";
import { WelcomeForm } from "@/components/flowsync/WelcomeForm";
import { getUserPrefs, hasCompletedWelcome } from "@/lib/user-prefs";

type IndexSearch = { prefs?: string };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): IndexSearch => ({
    prefs: typeof search.prefs === "string" ? search.prefs : undefined,
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();
  const { prefs } = useSearch({ from: "/" });
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<"welcome" | "chooser">("chooser");

  useEffect(() => {
    const editRequested = prefs === "1";
    if (editRequested) {
      setMode("welcome");
      setReady(true);
      return;
    }
    if (!hasCompletedWelcome()) {
      setMode("welcome");
      setReady(true);
      return;
    }
    const p = getUserPrefs();
    if (p.section === "office") {
      navigate({ to: "/office" });
    } else if (p.section === "production") {
      navigate({ to: "/production" });
    } else {
      setMode("chooser");
      setReady(true);
    }
  }, [prefs, navigate]);

  if (!ready) return null;

  if (mode === "welcome") {
    const p = getUserPrefs();
    return (
      <WelcomeForm
        initialName={p.name}
        initialSection={p.section}
        title={prefs === "1" ? "Update your preferences" : "Welcome to FlowSync"}
        subtitle={
          prefs === "1"
            ? "Change your name, section, or theme."
            : "Set up your workspace to get started."
        }
        onDone={({ section }) => {
          navigate({ to: section === "office" ? "/office" : "/production" });
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <FlowSyncLogo />
          <BptLogo />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Choose your section
          </h1>
          <p className="mt-3 text-muted-foreground">
            Internal workflow for package orders and supplies.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href="/office"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
          >
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
            <div className="relative">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                <Building2 className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Office</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Create and send package orders. View supplies.
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">
                Password required →
              </p>
            </div>
          </a>

          <a
            href="/production"
            className="group relative overflow-hidden rounded-xl border border-border bg-card p-8 shadow-sm transition-all hover:-translate-y-1 hover:border-primary hover:shadow-lg"
          >
            <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/5 transition-transform group-hover:scale-125" />
            <div className="relative">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Factory className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-foreground">Production</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Receive orders, complete them, print sheets, manage supplies.
              </p>
              <p className="mt-4 text-xs font-medium uppercase tracking-wider text-primary">
                Open section →
              </p>
            </div>
          </a>
        </div>
      </main>
    </div>
  );
}