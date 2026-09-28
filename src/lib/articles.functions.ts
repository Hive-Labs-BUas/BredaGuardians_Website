import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

function createPublicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export const getNewsArticle = createServerFn({ method: "GET" })
  .validator((value) => z.object({ slug: z.string().min(1).max(180) }).parse(value))
  .handler(async ({ data }) => {
    const { data: article, error } = await createPublicClient()
      .from("news")
      .select("id, title, slug, excerpt, content, image_url, publish_date, document_url, document_name")
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    return article;
  });

export const getResearchEntry = createServerFn({ method: "GET" })
  .validator((value) => z.object({ id: z.string().uuid() }).parse(value))
  .handler(async ({ data }) => {
    const { data: entry, error } = await createPublicClient()
      .from("research")
      .select("id, title, category, summary, cover_image_url, link_url, entry_date, content, takeaways, document_url, document_name, document_size_bytes, game")
      .eq("id", data.id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    return entry;
  });

export const getRelatedResearch = createServerFn({ method: "GET" })
  .validator((value) =>
    z.object({ id: z.string().uuid(), category: z.string().min(1).max(120) }).parse(value),
  )
  .handler(async ({ data }) => {
    const client = createPublicClient();
    const select = "id, title, category, summary, cover_image_url, entry_date";

    const sameCategory = await client
      .from("research")
      .select(select)
      .eq("published", true)
      .eq("category", data.category)
      .neq("id", data.id)
      .order("entry_date", { ascending: false })
      .limit(3);
    if (sameCategory.error) throw sameCategory.error;

    const found = sameCategory.data ?? [];
    if (found.length >= 3) return found;

    const fill = await client
      .from("research")
      .select(select)
      .eq("published", true)
      .neq("id", data.id)
      .order("entry_date", { ascending: false })
      .limit(6);
    if (fill.error) throw fill.error;

    const seen = new Set(found.map((item) => item.id));
    for (const item of fill.data ?? []) {
      if (found.length >= 3) break;
      if (!seen.has(item.id)) found.push(item);
    }
    return found;
  });
