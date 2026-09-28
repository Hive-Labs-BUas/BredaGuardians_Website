import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

/**
 * Records one anonymous page view. No names, emails or addresses are stored —
 * only the path, where the visit came from and a two-letter country code.
 */
export const recordPageView = createServerFn({ method: "POST" })
  .inputValidator((value) =>
    z
      .object({
        path: z.string().min(1).max(300),
        referrer: z.string().max(300).optional().nullable(),
      })
      .parse(value),
  )
  .handler(async ({ data }) => {
    let country: string | null = null;
    try {
      const request = getRequest();
      country =
        request.headers.get("cf-ipcountry") ??
        request.headers.get("x-vercel-ip-country") ??
        null;
    } catch {
      country = null;
    }
    if (country && !/^[A-Za-z]{2}$/.test(country)) country = null;

    const referrer = (data.referrer ?? "").trim();
    await publicClient()
      .from("page_views")
      .insert({
        path: data.path.slice(0, 300),
        referrer: referrer ? referrer.slice(0, 300) : null,
        country: country ? country.toUpperCase() : null,
      });
    return { ok: true };
  });

type Bucket = { key: string; views: number };

/** Aggregated visitor numbers for the admin dashboard. Staff only. */
export const getVisitorStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .in("role", ["admin", "intern"])
      .maybeSingle();
    if (!role) throw new Error("Staff only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("page_views")
      .select("path, country, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(50000);
    if (error) throw error;

    const rows = data ?? [];
    const now = Date.now();
    const within = (days: number) =>
      rows.filter((row) => now - new Date(row.created_at).getTime() <= days * 24 * 60 * 60 * 1000);

    const count = (list: typeof rows, keyOf: (row: (typeof rows)[number]) => string | null): Bucket[] => {
      const map = new Map<string, number>();
      for (const row of list) {
        const key = keyOf(row);
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([key, views]) => ({ key, views }))
        .sort((a, b) => b.views - a.views);
    };

    const byDay = new Map<string, number>();
    for (const row of rows) {
      const day = new Date(row.created_at).toISOString().slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    return {
      today: within(1).length,
      week: within(7).length,
      month: rows.length,
      pages: count(within(30), (row) => row.path).slice(0, 8),
      countries: count(within(30), (row) => row.country).slice(0, 8),
      daily: [...byDay.entries()]
        .sort((a, b) => (a[0] < b[0] ? -1 : 1))
        .slice(-14)
        .map(([day, views]) => ({ day, views })),
    };
  });
