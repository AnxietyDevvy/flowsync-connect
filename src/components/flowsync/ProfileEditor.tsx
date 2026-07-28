import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar } from "./PersonBadge";
import {
  AVATAR_COLORS,
  pickAvatarColor,
  store,
  useProfile,
  type AvatarColor,
} from "@/lib/flowsync-store";

export function ProfileEditor({
  name,
  open,
  onOpenChange,
}: {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const profile = useProfile(name);
  const [displayName, setDisplayName] = useState(profile?.displayName ?? name);
  const [role, setRole] = useState(profile?.role ?? "");
  const [color, setColor] = useState<AvatarColor>(profile?.avatarColor ?? pickAvatarColor(name));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDisplayName(profile?.displayName ?? name);
    setRole(profile?.role ?? "");
    setColor(profile?.avatarColor ?? pickAvatarColor(name));
  }, [open, profile, name]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await store.upsertProfile({
        displayName: trimmed,
        role: role.trim(),
        avatarColor: color,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4">
            <Avatar name={displayName || name} color={color} size="xl" />
            <div className="min-w-0">
              <div className="truncate font-semibold">{displayName || "—"}</div>
              {role && <div className="truncate text-xs text-muted-foreground">{role}</div>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-name">Display name</Label>
            <Input
              id="p-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="p-role">Role / title</Label>
            <Input
              id="p-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Office Lead, Production Tech"
            />
          </div>

          <div className="space-y-2">
            <Label>Avatar color</Label>
            <div className="flex flex-wrap gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  aria-label={`Choose ${c}`}
                  aria-pressed={color === c}
                  className={`rounded-full ring-2 ring-offset-2 ring-offset-background transition-colors ${
                    color === c ? "ring-primary" : "ring-transparent"
                  }`}
                >
                  <Avatar name={displayName || name} color={c} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-1 h-4 w-4" /> Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              <Check className="mr-1 h-4 w-4" /> Save profile
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}