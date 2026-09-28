import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, Eye, FileText, Globe2, Mail, TrendingUp, UserCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AdminData } from "@/lib/admin-data";
import { getVisitorStats } from "@/lib/analytics.functions";
import { countryFlag } from "@/lib/people";
import { formatDate } from "@/lib/queries";

export type AdminSectionId =
  | "overview"
  | "articles"
  | "results" | "teams"
  | "requests"
  | "members"
  | "shop"
  | "hive"
  | "staff"
  | "site";


function Stat({
  icon: Icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="admin-metric group w-full border border-border/70 bg-surface/70 p-4 text-left transition-all hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 sm:p-5"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4 text-primary" aria-hidden />
        <p className="text-xs uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-3 font-display text-3xl text-foreground">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </button>
  );
}

export function Overview({
  data,
  isLoading,
  onGo,
}: {
  data: AdminData | undefined;
  isLoading: boolean;
  onGo: (section: AdminSectionId) => void;
}) {
  const loadStats = useServerFn(getVisitorStats);
  const visitors = useQuery({ queryKey: ["visitor-stats"], queryFn: () => loadStats({}) });
  const orders = data?.orders ?? [];
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const monthRevenue =
    orders
      .filter((order) => new Date(order.created_at) >= monthStart)
      .reduce((sum, order) => sum + order.amount_cents, 0) / 100;
  const totalRevenue = orders.reduce((sum, order) => sum + order.amount_cents, 0) / 100;
  const openMessages = (data?.messages ?? []).filter((m) => m.status !== "done").length;
  const openApplications = (data?.applications ?? []).filter((a) => a.status !== "done").length;
  const activeMembers = (data?.memberships ?? []).filter((m) => m.status === "active").length;
  const drafts =
    (data?.news ?? []).filter((n) => !n.published).length +
    (data?.research ?? []).filter((r) => !r.published).length;

  const attention = [
    openMessages > 0
      ? { label: `${openMessages} contact message${openMessages === 1 ? "" : "s"} waiting for a reply`, go: "requests" as const }
      : null,
    openApplications > 0
      ? { label: `${openApplications} application${openApplications === 1 ? "" : "s"} to review`, go: "requests" as const }
      : null,
    drafts > 0 ? { label: `${drafts} unpublished draft${drafts === 1 ? "" : "s"}`, go: "articles" as const } : null,
    (data?.results ?? []).length === 0
      ? { label: "No match results published yet", go: "results" as const }
      : null,
  ].filter(Boolean) as { label: string; go: AdminSectionId }[];

  const stats = visitors.data;
  const maxDay = Math.max(1, ...(stats?.daily ?? []).map((d) => d.views));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat
          icon={UserCheck}
          label="Active members"
          value={isLoading ? "—" : activeMembers}
          onClick={() => onGo("members")}
        />
        <Stat
          icon={TrendingUp}
          label="Monthly revenue"
          value={isLoading ? "—" : `€${monthRevenue.toFixed(2)}`}
          hint={`€${totalRevenue.toFixed(2)} all time`}
          onClick={() => onGo("shop")}
        />
        <Stat icon={Mail} label="Open messages" value={isLoading ? "—" : openMessages} onClick={() => onGo("requests")} />
        <Stat icon={Users} label="Newsletter" value={isLoading ? "—" : data?.signups.length ?? 0} onClick={() => onGo("members")} />
        <Stat
          icon={FileText}
          label="Published"
          value={isLoading ? "—" : (data?.news ?? []).filter((n) => n.published).length + (data?.research ?? []).filter((r) => r.published).length}
          hint={`${drafts} draft${drafts === 1 ? "" : "s"}`}
          onClick={() => onGo("articles")}
        />
        <Stat icon={AlertTriangle} label="Applications" value={isLoading ? "—" : openApplications} onClick={() => onGo("requests")} />
      </div>

      <div className="admin-panel border border-border/70 bg-surface/65 p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-2 text-2xl">
            <Eye className="size-5 text-primary" aria-hidden /> Website visits
          </h2>
          <p className="text-xs text-muted-foreground">
            Anonymous page views — no names or emails are stored. Last 30 days.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: "Today", value: stats?.today },
            { label: "Last 7 days", value: stats?.week },
            { label: "Last 30 days", value: stats?.month },
          ].map((item) => (
            <div key={item.label} className="rounded-lg border border-border bg-background/45 p-3 sm:p-5">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-2 font-display text-3xl text-primary">
                {visitors.isLoading ? "—" : item.value ?? 0}
              </p>
            </div>
          ))}
        </div>

        {(stats?.daily ?? []).length > 0 && (
          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Views per day</p>
            <div className="mt-3 flex h-24 items-end gap-1.5">
              {(stats?.daily ?? []).map((day) => (
                <div
                  key={day.day}
                  title={`${day.day}: ${day.views} views`}
                  className="flex-1 rounded-t bg-primary/60"
                  style={{ height: `${Math.max(4, (day.views / maxDay) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Most visited pages</p>
            <ul className="mt-3 space-y-2 text-sm">
              {(stats?.pages ?? []).map((page) => (
                <li key={page.key} className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-muted-foreground">{page.key}</span>
                  <span className="font-semibold text-primary">{page.views}</span>
                </li>
              ))}
              {(stats?.pages ?? []).length === 0 && (
                <li className="text-muted-foreground">
                  {visitors.isLoading ? "Loading…" : "No visits recorded yet."}
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
              <Globe2 className="size-3.5 text-primary" aria-hidden /> Where visitors come from
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {(stats?.countries ?? []).map((country) => (
                <li key={country.key} className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground">
                    {countryFlag(country.key) ?? ""} {country.key}
                  </span>
                  <span className="font-semibold text-primary">{country.views}</span>
                </li>
              ))}
              {(stats?.countries ?? []).length === 0 && (
                <li className="text-muted-foreground">
                  {visitors.isLoading ? "Loading…" : "Country data appears once the site is live."}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="admin-panel border border-border/70 bg-surface/65 p-5 sm:p-6">
          <h2 className="text-2xl">Needs attention</h2>
          <ul className="mt-4 space-y-3">
            {attention.map((item) => (
              <li key={item.label} className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">{item.label}</span>
                <Button size="sm" variant="outline" onClick={() => onGo(item.go)}>
                  Open
                </Button>
              </li>
            ))}
            {attention.length === 0 && (
              <li className="text-sm text-muted-foreground">All clear — nothing waiting on you.</li>
            )}
          </ul>
        </div>

        <div className="admin-panel border border-border/70 bg-surface/65 p-5 sm:p-6">
          <h2 className="text-2xl">Latest membership activity</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(data?.events ?? []).slice(0, 6).map((event) => (
              <li key={event.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-primary">{event.event_type}</span>
                <span className="text-muted-foreground">
                  {event.email ?? "—"} · {formatDate(event.created_at)}
                </span>
              </li>
            ))}
            {(data?.events ?? []).length === 0 && (
              <li className="text-muted-foreground">No membership activity yet.</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
