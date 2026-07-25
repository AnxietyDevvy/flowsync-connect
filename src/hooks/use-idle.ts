import { useEffect, useState } from "react";

const EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"] as const;

export function useIdle(timeoutMs: number = 30000) {
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setIsIdle(true), timeoutMs);
    };
    const onActivity = () => {
      if (isIdle) setIsIdle(false);
      reset();
    };
    EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      EVENTS.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [isIdle, timeoutMs]);

  return isIdle;
}