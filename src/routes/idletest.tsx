import { createFileRoute } from "@tanstack/react-router";
import { IdleOverlay } from "@/components/flowsync/IdleOverlay";

export const Route = createFileRoute("/idletest")({
  component: () => <IdleOverlay userName="Test" enabled />,
});
