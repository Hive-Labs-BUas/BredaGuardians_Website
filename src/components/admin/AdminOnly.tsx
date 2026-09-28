import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";

/** Renders staff-only controls (like delete) for full admins only. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return null;
  return <>{children}</>;
}
