import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

/** Everything the admin control room needs, in one refreshable query. */
export function useAdminData(enabled: boolean) {
  return useQuery({
    queryKey: ["admin-data"],
    enabled,
    queryFn: async () => {
      const [
        messages,
        signups,
        orders,
        memberships,
        news,
        research,
        hallOfFame,
        results,
        applications,
        events,
        faqs,
        hours,
        specialDays,
        interns,
        positions,
        shopProducts,
        shopRequests,
        shopVouchers,
        teams,
        teamPlayers,
      ] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("newsletter_signups").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("memberships").select("*").order("started_at", { ascending: false }),
        supabase.from("news").select("*").order("publish_date", { ascending: false }),
        supabase.from("research").select("*").order("entry_date", { ascending: false }),
        supabase.from("hall_of_fame").select("*").order("sort_order", { ascending: true }),
        supabase.from("match_results").select("*").order("played_at", { ascending: false }),
        supabase.from("applications").select("*").order("created_at", { ascending: false }),
        supabase.from("membership_events").select("*").order("created_at", { ascending: false }).limit(200),
        supabase.from("faqs").select("*").order("sort_order", { ascending: true }),
        supabase.from("opening_hours").select("*").order("day_of_week", { ascending: true }),
        supabase.from("special_days").select("*").order("day", { ascending: true }),
        supabase.from("interns").select("*").order("sort_order", { ascending: true }),
        supabase.from("intern_positions").select("*").order("sort_order", { ascending: true }),
        supabase.from("shop_products").select("*").order("sort_order", { ascending: true }),
        supabase.from("shop_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("shop_vouchers").select("*").order("created_at", { ascending: false }),
        supabase.from("teams").select("*").order("sort_order", { ascending: true }),
        supabase.from("team_players").select("*").order("sort_order", { ascending: true }),
      ]);

      for (const result of [
        messages,
        signups,
        orders,
        memberships,
        news,
        research,
        hallOfFame,
        results,
        applications,
        events,
        faqs,
        hours,
        specialDays,
        interns,
        positions,
        shopProducts,
        shopRequests,
        shopVouchers,
        teams,
        teamPlayers,
      ]) {
        if (result.error) throw result.error;
      }

      return {
        messages: messages.data ?? [],
        signups: signups.data ?? [],
        orders: orders.data ?? [],
        memberships: memberships.data ?? [],
        news: news.data ?? [],
        research: research.data ?? [],
        hallOfFame: hallOfFame.data ?? [],
        results: results.data ?? [],
        applications: applications.data ?? [],
        events: events.data ?? [],
        faqs: faqs.data ?? [],
        hours: hours.data ?? [],
        specialDays: specialDays.data ?? [],
        interns: interns.data ?? [],
        positions: positions.data ?? [],
        shopProducts: shopProducts.data ?? [],
        shopRequests: shopRequests.data ?? [],
        shopVouchers: shopVouchers.data ?? [],
        teams: teams.data ?? [],
        teamPlayers: teamPlayers.data ?? [],
      };
    },
  });
}

export type AdminData = NonNullable<ReturnType<typeof useAdminData>["data"]>;

/** Just the teams and their players — what a team captain is allowed to edit. */
export type RosterData = { teams: AdminData["teams"]; teamPlayers: AdminData["teamPlayers"] };

export function useRosterData(enabled: boolean) {
  return useQuery({
    queryKey: ["roster-data"],
    enabled,
    queryFn: async (): Promise<RosterData> => {
      const [teams, teamPlayers] = await Promise.all([
        supabase.from("teams").select("*").order("sort_order", { ascending: true }),
        supabase.from("team_players").select("*").order("sort_order", { ascending: true }),
      ]);
      if (teams.error) throw teams.error;
      if (teamPlayers.error) throw teamPlayers.error;
      return { teams: teams.data ?? [], teamPlayers: teamPlayers.data ?? [] };
    },
  });
}
