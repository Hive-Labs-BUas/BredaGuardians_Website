import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PublicNews = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  image_url: string | null;
  publish_date: string;
  content?: string | null;
  document_url?: string | null;
  document_name?: string | null;
};

const NEWS_FIELDS =
  "id, title, slug, excerpt, image_url, publish_date, content, document_url, document_name";

export function useNews(initialData?: PublicNews[]) {
  return useQuery({
    queryKey: ["news"],
    ...(initialData ? { initialData } : {}),
    queryFn: async (): Promise<PublicNews[]> => {
      const { data, error } = await supabase
        .from("news")
        .select(NEWS_FIELDS)
        .eq("published", true)
        .order("publish_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PublicNews[];
    },
  });
}

export type PublicResearch = {
  id: string;
  title: string;
  category: string;
  summary: string;
  cover_image_url: string | null;
  link_url: string | null;
  entry_date: string;
  content?: string | null;
  document_url?: string | null;
  document_name?: string | null;
  document_size_bytes?: number | null;
  game?: string | null;
};

const RESEARCH_FIELDS =
  "id, title, category, summary, cover_image_url, link_url, entry_date, content, document_url, document_name, document_size_bytes, game";

export function useResearch(initialData?: PublicResearch[]) {
  return useQuery({
    queryKey: ["research"],
    ...(initialData ? { initialData } : {}),
    queryFn: async (): Promise<PublicResearch[]> => {
      const { data, error } = await supabase
        .from("research")
        .select(RESEARCH_FIELDS)
        .eq("published", true)
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PublicResearch[];
    },
  });
}


export function useHallOfFame(initialData?: unknown) {
  return useQuery({
    queryKey: ["hall_of_fame"],
    ...(initialData ? { initialData: initialData as never } : {}),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hall_of_fame")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export type PublicFaq = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sort_order: number;
};

export function useFaqs(initialData?: PublicFaq[]) {
  return useQuery({
    queryKey: ["faqs"],
    ...(initialData ? { initialData } : {}),
    queryFn: async (): Promise<PublicFaq[]> => {
      const { data, error } = await supabase
        .from("faqs")
        .select("id, category, question, answer, sort_order")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export type PublicOpeningHours = {
  hours: {
    id: string;
    day_of_week: number;
    opens_at: string | null;
    closes_at: string | null;
    closed: boolean;
  }[];
  special: { id: string; label: string; day: string; note: string; is_closure: boolean }[];
};

export function useOpeningHours(initialData?: PublicOpeningHours) {
  return useQuery({
    queryKey: ["opening_hours"],
    ...(initialData ? { initialData } : {}),
    queryFn: async (): Promise<PublicOpeningHours> => {
      const [hours, special] = await Promise.all([
        supabase.from("opening_hours").select("id, day_of_week, opens_at, closes_at, closed"),
        supabase
          .from("special_days")
          .select("id, label, day, note, is_closure")
          .order("day", { ascending: true }),
      ]);
      if (hours.error) throw hours.error;
      if (special.error) throw special.error;
      return { hours: hours.data ?? [], special: special.data ?? [] };
    },
  });
}

export function useMyMembership(userId: string | undefined) {
  return useQuery({
    queryKey: ["membership", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const [membership, subscription, orders] = await Promise.all([
        supabase.from("memberships").select("*").eq("user_id", userId!).maybeSingle(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("orders")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false }),
      ]);
      if (membership.error) throw membership.error;
      if (subscription.error) throw subscription.error;
      if (orders.error) throw orders.error;
      return { membership: membership.data, subscription: subscription.data, orders: orders.data ?? [] };
    },
  });
}

export type MyShopRequest = {
  id: string;
  product_name: string;
  size: string | null;
  quantity: number;
  unit_price_cents: number;
  status: string;
  note: string;
  voucher_code: string | null;
  discount_cents: number;
  created_at: string;
};

/** The signed-in member's own merch/product requests (read-own policy). */
export function useMyShopRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ["my-shop-requests", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<MyShopRequest[]> => {
      const { data, error } = await supabase
        .from("shop_requests")
        .select(
          "id, product_name, size, quantity, unit_price_cents, status, note, voucher_code, discount_cents, created_at",
        )
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyShopRequest[];
    },
  });
}

export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function useMatchResults() {
  return useQuery({
    queryKey: ["match_results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("match_results")
        .select("*")
        .eq("visible", true)
        .order("played_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

type MatchLike = { status?: string | null; played_at: string; score_us: number | null; score_them: number | null };

/** A match is upcoming when it is marked scheduled or has no score yet and is in the future. */
export function isUpcomingMatch(match: MatchLike): boolean {
  if (match.status === "scheduled") return true;
  if (match.status === "played") return false;
  const noScore = match.score_us === null || match.score_them === null;
  return noScore && new Date(match.played_at).getTime() > Date.now();
}


export function useInterns(initialData?: unknown) {
  return useQuery({
    queryKey: ["interns"],
    ...(initialData ? { initialData: initialData as never } : {}),
    queryFn: async () => {
      const [team, positions] = await Promise.all([
        supabase.from("interns").select("*").eq("visible", true).order("sort_order"),
        supabase.from("intern_positions").select("*").eq("active", true).order("sort_order"),
      ]);
      if (team.error) throw team.error;
      if (positions.error) throw positions.error;
      return { team: team.data ?? [], positions: positions.data ?? [] };
    },
  });
}

export type PersonRow = {
  id: string;
  name: string;
  role: string;
  blurb: string;
  photo_url: string | null;
  linkedin_url?: string | null;
  is_core?: boolean | null;
  alumni?: boolean | null;
  started_on?: string | null;
  ended_on?: string | null;
};

/** Splits the people table into the core crew, current interns and alumni. */
export function splitPeople<T extends PersonRow>(rows: T[] | undefined) {
  const list = rows ?? [];
  return {
    core: list.filter((row) => row.is_core === true && row.alumni !== true),
    interns: list.filter((row) => row.is_core !== true && row.alumni !== true),
    alumni: list.filter((row) => row.alumni === true),
  };
}


export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function useShopProducts() {
  return useQuery({
    queryKey: ["shop_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shop_products")
        .select("*")
        .eq("visible", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function formatEuros(cents: number) {
  return `€${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export type SocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  visible: boolean;
  sort_order: number;
};

/** Editable social links, managed from the admin panel. */
export function useSocials() {
  return useQuery({
    queryKey: ["site_socials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_socials")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SocialLink[];
    },
  });
}

export type SiteImage = {
  id: string;
  key: string;
  label: string;
  url: string;
  sort_order: number;
};

/** Editable pictures for fixed spots on the site, managed from the admin panel. */
export function useSiteImages() {
  return useQuery({
    queryKey: ["site_images"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_images")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SiteImage[];
    },
  });
}

/** Look up one editable picture, falling back to the built-in image. */
export function pickImage(rows: SiteImage[] | undefined, key: string, fallback: string): string {
  const found = rows?.find((row) => row.key === key)?.url?.trim();
  return found && found.length > 0 ? found : fallback;
}

export type SiteSetting = {
  id: string;
  key: string;
  label: string;
  value: string;
  description: string;
};

/** Editable short texts (like the Minecraft server address) managed from the admin panel. */
export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("id, key, label, value, description")
        .order("key", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SiteSetting[];
    },
  });
}

/** Look up one editable text, falling back to a built-in default. */
export function pickSetting(rows: SiteSetting[] | undefined, key: string, fallback: string): string {
  const found = rows?.find((row) => row.key === key)?.value?.trim();
  return found && found.length > 0 ? found : fallback;
}
