import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Settings, Palette, Check } from "lucide-react";
import { FlowSyncLogo, BptLogo } from "./Logos";
import { setTheme, useTheme, type Theme } from "@/lib/theme";
import { SyncStatus } from "./SyncStatus";
import { Avatar } from "./PersonBadge";
import { ProfileEditor } from "./ProfileEditor";
import { useProfile } from "@/lib/flowsync-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SectionHeader({
  label,
  userName,
  onLock,
}: {
  label: string;
  userName?: string;
  onLock?: () => void;
}) {
  const theme = useTheme();
  const profile = useProfile(userName ?? "");
  const [editing, setEditing] = useState(false);
  const themes: { value: Theme; label: string }[] = [
    { value: "red", label: "Red" },
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];
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
          <SyncStatus />
          {userName && (
            <>
              <button
                type="button"
                onClick={() => setEditing(true)}
                title="Edit your profile"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1 text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <Avatar name={profile?.displayName ?? userName} size="sm" />
                <span className="flex flex-col items-start leading-tight">
                  <span>{profile?.displayName ?? userName}</span>
                  {profile?.role && (
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {profile.role}
                    </span>
                  )}
                </span>
              </button>
              <ProfileEditor name={userName} open={editing} onOpenChange={setEditing} />
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground"
                title="Theme"
                aria-label="Change theme"
              >
                <Palette className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              {themes.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className="flex items-center justify-between"
                >
                  {t.label}
                  {theme === t.value && <Check className="h-4 w-4 text-primary" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" search={{ prefs: "1" }} className="flex items-center gap-2">
                  <Settings className="h-4 w-4" /> Preferences
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {onLock && (
            <button
              onClick={onLock}
              className="text-xs font-medium text-muted-foreground hover:text-primary"
              title="Sign out of Office"
            >
              Sign out
            </button>
          )}
          <BptLogo />
        </div>
      </div>
    </header>
  );
}