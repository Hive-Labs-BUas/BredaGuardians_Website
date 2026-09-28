import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/admin-login")({
  head: () => ({
    meta: [
      { title: "Admin Login — Breda Guardians" },
      { name: "description", content: "Staff sign-in for the Breda Guardians admin panel." },
      { property: "og:title", content: "Admin Login — Breda Guardians" },
      { property: "og:description", content: "Staff sign-in for the Breda Guardians admin panel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/auth", replace: true });
  }, [navigate]);

  return null;
}
