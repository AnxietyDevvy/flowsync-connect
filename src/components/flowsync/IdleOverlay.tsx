import { useEffect, useState } from "react";
import { useIdle } from "@/hooks/use-idle";
import idleSpriteAsset from "@/assets/idle-sprite.png.asset.json";

const BUBBLES = Array.from({ length: 14 }, (_, i) => {
  const size = 40 + ((i * 37) % 120);
  return {
    size,
    left: (i * 71) % 100,
    delay: (i * 1.3) % 8,
    duration: 12 + ((i * 3) % 10),
    drift: i % 2 === 0 ? 30 : -30,
  };
});

export function IdleOverlay({ userName, enabled = true }: { userName: string; enabled?: boolean }) {
  const isIdle = useIdle(30000);
  const active = enabled && isIdle;
  const [visible, setVisible] = useState(false);
  const [waking, setWaking] = useState(false);

  useEffect(() => {
    if (active) {
      setWaking(false);
      setVisible(true);
      return;
    }
    if (!visible) return;
    setWaking(true);
    const t = setTimeout(() => {
      setVisible(false);
      setWaking(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-background/95 backdrop-blur-sm transition-opacity duration-500 ${
        waking ? "opacity-0" : "opacity-100 animate-fade-in"
      }`}
      aria-hidden="true"
    >
      {BUBBLES.map((b, i) => (
        <span
          key={i}
          className="idle-bubble"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: `${b.left}%`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            ["--drift" as string]: `${b.drift}px`,
          }}
        />
      ))}
      <div className="relative flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
        <img
          src={idleSpriteAsset.url}
          alt="Idle mode illustration"
          className="max-h-[45vh] w-auto max-w-full object-contain drop-shadow-2xl md:max-h-[55vh]"
        />
        {waking ? (
          <>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Welcome back{userName ? `, ${userName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">Resuming your session…</p>
          </>
        ) : (
          <>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              In Idle Mode
            </h1>
            <p className="text-sm text-muted-foreground">
              Move your mouse or press any key to resume
            </p>
          </>
        )}
      </div>
    </div>
  );
}