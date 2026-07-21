export function BptLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary font-black text-primary-foreground shadow-sm">
        BPT
      </div>
    </div>
  );
}

export function FlowSyncLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div className="relative h-8 w-8">
        <div className="absolute inset-0 rounded-md bg-secondary" />
        <div className="absolute inset-[3px] rounded-[4px] border-2 border-primary" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-tight text-secondary">
          Flow<span className="text-primary">Sync</span>
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          BPT Workflow
        </span>
      </div>
    </div>
  );
}