import { createFileRoute, redirect } from "@tanstack/react-router";

// The teams overview is now called Rosters — keep the old link working.
export const Route = createFileRoute("/hall-of-fame")({
  beforeLoad: () => {
    throw redirect({ to: "/rosters", replace: true });
  },
});
