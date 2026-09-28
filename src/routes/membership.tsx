import { createFileRoute, redirect } from "@tanstack/react-router";

/** Membership now lives inside the shop, at the top of the page. */
export const Route = createFileRoute("/membership")({
  beforeLoad: () => {
    throw redirect({ to: "/shop", replace: true });
  },
});
