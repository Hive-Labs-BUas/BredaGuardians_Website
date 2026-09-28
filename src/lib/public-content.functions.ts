import { createClient } from "@supabase/supabase-js";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import type { Database } from "@/integrations/supabase/types";

/**
 * Public, session-free reads used by route loaders so that news, research,
 * FAQ, opening hours and rosters are present in the server-rendered HTML.
 */
function publicClient() {
  return createClient<Database>(
    process.env["SUPABASE_URL"]!,
    process.env["SUPABASE_PUBLISHABLE_KEY"]!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

const NEWS_FIELDS =
  "id, title, slug, excerpt, image_url, publish_date, content, document_url, document_name";
const RESEARCH_FIELDS =
  "id, title, category, summary, cover_image_url, link_url, entry_date, content, document_url, document_name, document_size_bytes, game";

export const getPublicNews = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("news")
    .select(NEWS_FIELDS)
    .eq("published", true)
    .order("publish_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

export const getPublicNewsArticle = createServerFn({ method: "GET" })
  .validator((value) => z.object({ slug: z.string().min(1).max(200) }).parse(value))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: article, error } = await client
      .from("news")
      .select(NEWS_FIELDS)
      .eq("slug", data.slug)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    if (!article) return null;
    const { data: more } = await client
      .from("news")
      .select("id, title, slug, excerpt, image_url, publish_date")
      .eq("published", true)
      .neq("slug", data.slug)
      .order("publish_date", { ascending: false })
      .limit(3);
    return { article, more: more ?? [] };
  });

export const getPublicResearch = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("research")
    .select(RESEARCH_FIELDS)
    .eq("published", true)
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
});


export const getPublicFaqs = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("faqs")
    .select("id, category, question, answer, sort_order")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
});

export const getPublicOpeningHours = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [hours, special] = await Promise.all([
    client.from("opening_hours").select("id, day_of_week, opens_at, closes_at, closed"),
    client
      .from("special_days")
      .select("id, label, day, note, is_closure")
      .order("day", { ascending: true }),
  ]);
  if (hours.error) throw hours.error;
  if (special.error) throw special.error;
  return { hours: hours.data ?? [], special: special.data ?? [] };
});

/** Rosters page: every visible team with its line-up, results and next matches. */
export const getPublicRosters = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [honours, teams, players, results, news] = await Promise.all([
    client
      .from("hall_of_fame")
      .select("id, title, description, image_url, achieved_on, sort_order, content")
      .order("sort_order", { ascending: true }),
    client.from("teams").select("*").eq("visible", true).order("sort_order", { ascending: true }),
    client
      .from("team_players")
      .select("*")
      .eq("visible", true)
      .order("sort_order", { ascending: true }),
    client
      .from("match_results")
      .select("*")
      .eq("visible", true)
      .order("played_at", { ascending: false }),
    client
      .from("news")
      .select("id, title, slug, excerpt, image_url, publish_date")
      .eq("published", true)
      .order("publish_date", { ascending: false })
      .limit(3),
  ]);
  if (honours.error) throw honours.error;
  if (teams.error) throw teams.error;
  if (players.error) throw players.error;
  if (results.error) throw results.error;
  if (news.error) throw news.error;

  const teamList = teams.data ?? [];
  const allResults = results.data ?? [];
  const now = Date.now();
  const upcoming = (row: (typeof allResults)[number]) =>
    row.status === "scheduled" ||
    (row.status !== "played" &&
      (row.score_us === null || row.score_them === null) &&
      new Date(row.played_at).getTime() > now);

  const squads = teamList.map((team) => {
    // Match strictly on team, so two teams in the same game never share results.
    const sameGame = teamList.filter((other) => other.game?.toLowerCase() === team.game?.toLowerCase());
    const mine = allResults.filter((row) =>
      row.team_id ? row.team_id === team.id : sameGame.length === 1 && row.game?.toLowerCase() === team.game?.toLowerCase(),
    );
    return {
      ...team,
      players: (players.data ?? []).filter((p) => p.team_id === team.id),
      results: mine.filter((row) => !upcoming(row)).slice(0, 4),
      upcoming: mine
        .filter(upcoming)
        .sort((a, b) => new Date(a.played_at).getTime() - new Date(b.played_at).getTime())
        .slice(0, 3),
    };
  });

  return {
    honours: honours.data ?? [],
    teams: squads,
    news: news.data ?? [],
  };
});

/** Hall of Fame subpage: achievements timeline plus current and former crew. */
export const getPublicHallOfFame = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [honours, people, results, news] = await Promise.all([
    client
      .from("hall_of_fame")
      .select("id, title, description, image_url, achieved_on, sort_order, content, document_url, document_name")
      .order("achieved_on", { ascending: false }),
    client.from("interns").select("*").eq("visible", true).order("sort_order", { ascending: true }),
    client
      .from("match_results")
      .select("*")
      .eq("visible", true)
      .eq("outcome", "Victory")
      .order("played_at", { ascending: false })
      .limit(12),
    client
      .from("news")
      .select("id, title, slug, excerpt, image_url, publish_date")
      .eq("published", true)
      .order("publish_date", { ascending: false })
      .limit(6),
  ]);
  if (honours.error) throw honours.error;
  if (people.error) throw people.error;
  if (results.error) throw results.error;
  if (news.error) throw news.error;

  return {
    honours: honours.data ?? [],
    people: people.data ?? [],
    victories: results.data ?? [],
    news: news.data ?? [],
  };
});


export const getPublicTeamPage = createServerFn({ method: "GET" })
  .validator((value) => z.object({ slug: z.string().min(1).max(120) }).parse(value))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: team, error } = await client
      .from("teams")
      .select("*")
      .eq("slug", data.slug)
      .eq("visible", true)
      .maybeSingle();
    if (error) throw error;
    if (!team) return null;

    const [players, results] = await Promise.all([
      client
        .from("team_players")
        .select("*")
        .eq("team_id", team.id)
        .eq("visible", true)
        .order("sort_order", { ascending: true }),
      client
        .from("match_results")
        .select("*")
        .eq("team_id", team.id)
        .eq("visible", true)
        .order("played_at", { ascending: false })
        .limit(8),
    ]);
    if (players.error) throw players.error;
    if (results.error) throw results.error;

    return { team, players: players.data ?? [], results: results.data ?? [] };
  });

export const getPublicHome = createServerFn({ method: "GET" }).handler(async () => {
  const client = publicClient();
  const [news, teams, interns, positions] = await Promise.all([
    client
      .from("news")
      .select("id, title, slug, excerpt, image_url, publish_date")
      .eq("published", true)
      .order("publish_date", { ascending: false })
      .limit(6),
    client.from("teams").select("*").eq("visible", true).order("sort_order", { ascending: true }),
    client.from("interns").select("*").eq("visible", true).order("sort_order", { ascending: true }),
    client
      .from("intern_positions")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);
  if (news.error) throw news.error;
  if (teams.error) throw teams.error;
  if (interns.error) throw interns.error;
  if (positions.error) throw positions.error;
  return {
    news: news.data ?? [],
    teams: teams.data ?? [],
    interns: { team: interns.data ?? [], positions: positions.data ?? [] },
  };
});
