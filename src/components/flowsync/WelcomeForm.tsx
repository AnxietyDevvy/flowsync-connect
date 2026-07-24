import { useState } from "react";
import { Building2, Factory, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { FlowSyncLogo, BptLogo } from "@/components/flowsync/Logos";
import { saveUserPrefs, type WorkSection } from "@/lib/user-prefs";
import { setTheme, useTheme, type Theme } from "@/lib/theme";

export function WelcomeForm({
  initialName = "",
  initialSection = null,
  onDone,
  title = "Welcome to FlowSync",
  subtitle = "Set up your workspace to get started.",
}: {
  initialName?: string;
  initialSection?: WorkSection | null;
  onDone: (result: { name: string; section: WorkSection }) => void;
  title?: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [section, setSection] = useState<WorkSection | null>(initialSection);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter your name");
    if (!section) return setError("Choose your work section");
    saveUserPrefs({ name: trimmed, section });
    onDone({ name: trimmed, section });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <FlowSyncLogo />
          <BptLogo />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            </div>

            <form onSubmit={submit} className="space-y-6">
              <div className="space-y-1.5">
                <Label htmlFor="wname">Your name</Label>
                <Input
                  id="wname"
                  autoFocus
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError(null);
                  }}
                  placeholder="e.g. Sarah"
                />
              </div>

              <div className="space-y-2">
                <Label>Work section</Label>
                <div className="grid grid-cols-2 gap-3">
                  <SectionCard
                    label="Office"
                    description="Create & send orders"
                    icon={<Building2 className="h-5 w-5" />}
                    selected={section === "office"}
                    onClick={() => {
                      setSection("office");
                      setError(null);
                    }}
                  />
                  <SectionCard
                    label="Production"
                    description="Receive & complete"
                    icon={<Factory className="h-5 w-5" />}
                    selected={section === "production"}
                    onClick={() => {
                      setSection("production");
                      setError(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>App theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  <ThemeSwatch
                    label="Red"
                    theme="red"
                    selected={theme === "red"}
                    onSelect={setTheme}
                    swatches={["#0a0a0a", "#dc1f2e", "#2a2a2a"]}
                  />
                  <ThemeSwatch
                    label="Light"
                    theme="light"
                    selected={theme === "light"}
                    onSelect={setTheme}
                    swatches={["#ffffff", "#dc1f2e", "#e5e5e5"]}
                  />
                  <ThemeSwatch
                    label="Dark"
                    theme="dark"
                    selected={theme === "dark"}
                    onSelect={setTheme}
                    swatches={["#1a1a1a", "#dc1f2e", "#3a3a3a"]}
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs font-medium text-primary">{error}</p>
              )}

              <Button type="submit" className="w-full">
                Continue
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SectionCard({
  label,
  description,
  icon,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-all ${
        selected
          ? "border-primary bg-primary/5 ring-2 ring-primary/30"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div
        className={`inline-flex h-9 w-9 items-center justify-center rounded-md ${
          selected
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="font-semibold">{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </button>
  );
}

function ThemeSwatch({
  label,
  theme,
  selected,
  onSelect,
  swatches,
}: {
  label: string;
  theme: Theme;
  selected: boolean;
  onSelect: (t: Theme) => void;
  swatches: string[];
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(theme)}
      className={`flex flex-col items-stretch gap-2 rounded-lg border p-3 text-left transition-all ${
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50"
      }`}
    >
      <div className="flex h-10 overflow-hidden rounded-md">
        {swatches.map((c, i) => (
          <div key={i} className="flex-1" style={{ backgroundColor: c }} />
        ))}
      </div>
      <div className="text-sm font-medium">{label}</div>
    </button>
  );
}