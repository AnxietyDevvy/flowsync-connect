import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { checkUnlocked } from "@/lib/site-gate.functions";

export const Route = createFileRoute("/_gated")({
  beforeLoad: async ({ location }) => {
    const { unlocked } = await checkUnlocked();
    if (!unlocked) {
      throw redirect({
        to: "/unlock",
        search: { redirect: location.href },
      });
    }
  },
  component: () => <Outlet />,
});