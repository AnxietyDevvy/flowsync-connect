import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { createHash, timingSafeEqual } from "node:crypto";

type GateSession = {
  unlocked?: boolean;
  failed?: number;
  lockedUntil?: number;
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function getSessionConfig() {
  const password = process.env.SESSION_SECRET;
  if (!password) throw new Error("SESSION_SECRET is not set");
  return {
    password,
    name: "flowsync-gate",
    // Omit maxAge so the cookie is a session cookie (cleared when browser closes).
    cookie: {
      httpOnly: true,
      secure: true,
      sameSite: "lax" as const,
      path: "/",
    },
  };
}

function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

export const checkUnlocked = createServerFn({ method: "GET" }).handler(async () => {
  const session = await useSession<GateSession>(getSessionConfig());
  return { unlocked: Boolean(session.data.unlocked) };
});

export const unlockSite = createServerFn({ method: "POST" })
  .inputValidator((data: { password: string }) => data)
  .handler(async ({ data }) => {
    const expected = process.env.SITE_PASSWORD;
    if (!expected) throw new Error("SITE_PASSWORD is not set");
    const session = await useSession<GateSession>(getSessionConfig());
    const now = Date.now();
    const lockedUntil = session.data.lockedUntil ?? 0;
    if (lockedUntil > now) {
      return {
        ok: false as const,
        retryAfterSeconds: Math.ceil((lockedUntil - now) / 1000),
      };
    }
    if (typeof data.password !== "string" || data.password.length === 0 || data.password.length > 200) {
      return { ok: false as const };
    }
    if (!passwordMatches(data.password, expected)) {
      const failed = (session.data.failed ?? 0) + 1;
      if (failed >= MAX_ATTEMPTS) {
        await session.update({ failed: 0, lockedUntil: now + LOCKOUT_MS });
        return { ok: false as const, retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) };
      }
      await session.update({ failed });
      return { ok: false as const };
    }
    await session.update({ unlocked: true, failed: 0, lockedUntil: 0 });
    return { ok: true as const };
  });

export const lockSite = createServerFn({ method: "POST" }).handler(async () => {
  const session = await useSession<GateSession>(getSessionConfig());
  await session.clear();
  return { ok: true as const };
});