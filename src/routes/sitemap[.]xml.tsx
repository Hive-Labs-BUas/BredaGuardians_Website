import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { SITE_URL } from "@/lib/site-data";

const PATHS = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.9" },
  { path: "/shop", priority: "0.9" },
  { path: "/research", priority: "0.8" },
  { path: "/our-team", priority: "0.8" },
  { path: "/live", priority: "0.6" },
  { path: "/rosters", priority: "0.8" },
  { path: "/rosters/hall-of-fame", priority: "0.6" },
  { path: "/opening-hours", priority: "0.6" },
  { path: "/faq", priority: "0.6" },
  { path: "/contact", priority: "0.6" },
  { path: "/privacy", priority: "0.3" },
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = SITE_URL;
        const client = createClient<Database>(
          process.env["SUPABASE_URL"]!,
          process.env["SUPABASE_PUBLISHABLE_KEY"]!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const [researchResult, teamsResult] = await Promise.all([
          client.from("research").select("id, updated_at").eq("published", true),
          client.from("teams").select("slug, updated_at").eq("visible", true),
        ]);
        const articlePaths = [
          ...(researchResult.data ?? []).map((item) => ({ path: `/research/${item.id}`, priority: "0.7", lastmod: item.updated_at.slice(0, 10) })),
          ...(teamsResult.data ?? []).map((item) => ({ path: `/teams/${item.slug}`, priority: "0.7", lastmod: item.updated_at.slice(0, 10) })),
        ];
        const urls = [
          ...PATHS.map((entry) => ({ ...entry, lastmod: undefined as string | undefined })),
          ...articlePaths,
        ]
          .map(
            (entry) =>
              `  <url>\n    <loc>${origin}${entry.path}</loc>\n${entry.lastmod ? `    <lastmod>${entry.lastmod}</lastmod>\n` : ""}    <priority>${entry.priority}</priority>\n  </url>`,
          )
          .join("\n");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
