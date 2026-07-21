import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FlowSyncLogo, BptLogo } from "./Logos";

export function SectionHeader({
  label,
  onLock,
}: {
  label: string;
  onLock?: () => void;
}) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Switch section</span>
          </Link>
          <div className="hidden h-6 w-px bg-border sm:block" />
          <FlowSyncLogo />
          <span className="ml-2 inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {onLock && (
            <button
              onClick={onLock}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
            >
              Lock
            </button>
          )}
          <BptLogo />
        </div>
      </div>
    </header>
  );
}