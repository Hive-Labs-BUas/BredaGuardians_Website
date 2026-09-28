import { createFileRoute, redirect } from "@tanstack/react-router";

// The interns page is now called Our Team — keep the old link working.
export const Route = createFileRoute("/interns")({
  beforeLoad: () => {
    throw redirect({ to: "/our-team", replace: true });
  },
});
