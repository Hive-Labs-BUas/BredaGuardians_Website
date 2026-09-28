import { createFileRoute, redirect } from "@tanstack/react-router";

// Teams now live on the Rosters page — keep the old URL working.
export const Route = createFileRoute("/teams/")({
  beforeLoad: () => {
    throw redirect({ to: "/rosters", replace: true });
  },
});
