import { initialsFor, pickAvatarColor, useProfile, type AvatarColor } from "@/lib/flowsync-store";

const COLOR_CLASSES: Record<AvatarColor, string> = {
  red: "bg-red-500/20 text-red-500 ring-red-500/40",
  amber: "bg-amber-500/20 text-amber-600 ring-amber-500/40 dark:text-amber-400",
  emerald: "bg-emerald-500/20 text-emerald-600 ring-emerald-500/40 dark:text-emerald-400",
  sky: "bg-sky-500/20 text-sky-600 ring-sky-500/40 dark:text-sky-400",
  indigo: "bg-indigo-500/20 text-indigo-600 ring-indigo-500/40 dark:text-indigo-400",
  violet: "bg-violet-500/20 text-violet-600 ring-violet-500/40 dark:text-violet-400",
  pink: "bg-pink-500/20 text-pink-600 ring-pink-500/40 dark:text-pink-400",
  slate: "bg-slate-500/20 text-slate-700 ring-slate-500/40 dark:text-slate-300",
};

const SIZE_CLASSES = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-base",
} as const;

export type AvatarSize = keyof typeof SIZE_CLASSES;

/** Avatar-only bubble (initials + color, or uploaded image). */
export function Avatar({
  name,
  color,
  imageUrl,
  size = "md",
  className = "",
}: {
  name: string;
  color?: AvatarColor;
  imageUrl?: string;
  size?: AvatarSize;
  className?: string;
}) {
  const profile = useProfile(name);
  const effColor = color ?? profile?.avatarColor ?? pickAvatarColor(name || "?");
  const effImg = imageUrl ?? profile?.avatarUrl ?? "";
  const initials = initialsFor(name || "?");
  const base = `inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ring-inset ${SIZE_CLASSES[size]} ${className}`;
  if (effImg) {
    return (
      <span className={`${base} overflow-hidden bg-muted ring-border`}>
        <img
          src={effImg}
          alt={name}
          className="h-full w-full object-cover"
          draggable={false}
        />
      </span>
    );
  }
  return <span className={`${base} ${COLOR_CLASSES[effColor]}`}>{initials}</span>;
}

/** Avatar + name (+ role) as a compact inline badge. */
export function PersonBadge({
  name,
  size = "sm",
  showRole = false,
  className = "",
}: {
  name: string;
  size?: AvatarSize;
  showRole?: boolean;
  className?: string;
}) {
  const profile = useProfile(name);
  if (!name) return null;
  const display = profile?.displayName || name;
  const role = profile?.role;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <Avatar name={display} size={size} />
      <span className="min-w-0 truncate text-xs font-medium text-foreground">
        {display}
        {showRole && role && (
          <span className="ml-1 text-[10px] font-normal text-muted-foreground">· {role}</span>
        )}
      </span>
    </span>
  );
}