import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export type Team = {
  id: string;
  slug: string;
  game: string;
  name: string;
  tagline: string;
  blurb: string;
  image_url: string | null;
  logo_url: string | null;
  visible: boolean;
  sort_order: number;
};

export type TeamPlayer = {
  id: string;
  team_id: string;
  name: string;
  handle: string;
  role: string;
  photo_url: string | null;
  visible: boolean;
  sort_order: number;
  country_code?: string | null;
  country_codes?: string[] | null;
  birth_date?: string | null;
  is_captain?: boolean | null;
};

/** All visible teams, ordered the way staff arranged them in the admin panel. */
export function useTeams(initialData?: Team[]) {
  return useQuery({
    queryKey: ["teams"],
    ...(initialData ? { initialData } : {}),
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });
}

/** One team page: the team, its roster and its match results. */
export function useTeamPage(slug: string, initialData?: unknown) {
  return useQuery({
    queryKey: ["team-page", slug],
    ...(initialData ? { initialData: initialData as never } : {}),
    queryFn: async () => {
      const { data: team, error } = await supabase
        .from("teams")
        .select("*")
        .eq("slug", slug)
        .eq("visible", true)
        .maybeSingle();
      if (error) throw error;
      if (!team) return null;

      const [players, results] = await Promise.all([
        supabase
          .from("team_players")
          .select("*")
          .eq("team_id", team.id)
          .eq("visible", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("match_results")
          .select("*")
          .eq("team_id", team.id)
          .eq("visible", true)
          .order("played_at", { ascending: false })
          .limit(8),
      ]);
      if (players.error) throw players.error;
      if (results.error) throw results.error;

      return {
        team: team as Team,
        players: (players.data ?? []) as TeamPlayer[],
        results: results.data ?? [],
      };
    },
  });
}

export type TeamWithSquad = Team & {
  players: TeamPlayer[];
  results: {
    id: string;
    outcome: string;
    competition: string;
    stage: string;
    game: string;
    opponent: string;
    opponent_logo_url: string | null;
    team_logo_url: string | null;
    score_us: number;
    score_them: number;
    played_at: string;
  }[];
};

/** Every visible team with its roster and latest results — used by the Hall of Fame. */
export function useTeamsWithSquads(initialData?: TeamWithSquad[]) {
  return useQuery({
    queryKey: ["teams-with-squads"],
    ...(initialData ? { initialData } : {}),
    queryFn: async (): Promise<TeamWithSquad[]> => {
      const [teams, players, results] = await Promise.all([
        supabase.from("teams").select("*").eq("visible", true).order("sort_order", { ascending: true }),
        supabase.from("team_players").select("*").eq("visible", true).order("sort_order", { ascending: true }),
        supabase
          .from("match_results")
          .select("*")
          .eq("visible", true)
          .order("played_at", { ascending: false }),
      ]);
      if (teams.error) throw teams.error;
      if (players.error) throw players.error;
      if (results.error) throw results.error;

      return ((teams.data ?? []) as Team[]).map((team) => ({
        ...team,
        players: ((players.data ?? []) as TeamPlayer[]).filter((p) => p.team_id === team.id),
        results: (results.data ?? [])
          .filter((r: { team_id: string | null; game: string }) =>
            r.team_id ? r.team_id === team.id : r.game?.toLowerCase() === team.game?.toLowerCase(),
          )
          .slice(0, 4) as TeamWithSquad["results"],
      }));
    },
  });
}
