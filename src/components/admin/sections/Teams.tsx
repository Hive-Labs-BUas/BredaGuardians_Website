import { useQueryClient } from "@tanstack/react-query";
import { Crown, ExternalLink, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ImageField } from "@/components/admin/ImageField";
import { COUNTRIES } from "@/lib/countries";
import { ageFrom, countryFlag, nationalityCodes } from "@/lib/people";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { RosterData } from "@/lib/admin-data";

type TeamRow = RosterData["teams"][number];
type PlayerRow = RosterData["teamPlayers"][number];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Teams, their public pages and their rosters — all editable here. */
export function Teams({ data, rosterOnly = false }: { data: RosterData | undefined; rosterOnly?: boolean }) {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Partial<TeamRow> | null>(null);
  const [rosterFor, setRosterFor] = useState<TeamRow | null>(null);

  const teams = data?.teams ?? [];
  const players = data?.teamPlayers ?? [];

  const refresh = async (): Promise<void> => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      queryClient.invalidateQueries({ queryKey: ["roster-data"] }),
      queryClient.invalidateQueries({ queryKey: ["teams"] }),
      queryClient.invalidateQueries({ queryKey: ["teams-with-squads"] }),
      queryClient.invalidateQueries({ queryKey: ["team-page"] }),
    ]);
  };

  async function removeTeam(row: TeamRow): Promise<void> {
    if (!window.confirm(`Delete ${row.name} and its roster?`)) return;
    const { error } = await supabase.from("teams").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Team deleted");
    await refresh();
  }

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
        {rosterOnly
          ? "Use the people icon on a team to add players and edit their gamer tag, role, nationalities, date of birth and photo. Team names and descriptions are managed by the club staff."
          : "Every team here shows up on the Rosters page and gets its own page with the full line-up. Use the people icon to add players, their role, nationalities and date of birth. Only admins can delete a team or a player."}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">{rosterOnly ? "Rosters" : "Teams & rosters"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Each team has its own public page at /teams/&lt;link name&gt;.
          </p>
        </div>
        {rosterOnly ? null : (
          <Button
            onClick={() =>
              setEditing({ name: "", game: "", slug: "", tagline: "", blurb: "", visible: true, sort_order: teams.length + 1 })
            }
          >
            <Plus className="size-4" /> New team
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const roster = players.filter((p) => p.team_id === team.id);
          return (
            <article key={team.id} className="surface-card bg-surface-2 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-primary">{team.game}</p>
                  <h3 className="mt-1 truncate text-xl">{team.name}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    /teams/{team.slug} · {roster.length} player{roster.length === 1 ? "" : "s"} ·{" "}
                    {team.visible ? "Visible" : "Hidden"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button size="icon" variant="ghost" aria-label="Open team page" title="Open the team page" asChild>
                    <a href={`/teams/${team.slug}`} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  {rosterOnly ? null : (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Edit team"
                      title="Edit the team details"
                      onClick={() => setEditing(team)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Edit roster"
                    title="Add or edit players"
                    onClick={() => setRosterFor(team)}
                  >
                    <Users className="size-4" />
                  </Button>
                  {isAdmin && !rosterOnly ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Delete team"
                      title="Delete this team (admins only)"
                      onClick={() => void removeTeam(team)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
              {team.tagline ? <p className="mt-3 text-sm text-muted-foreground">{team.tagline}</p> : null}
            </article>
          );
        })}
      </div>

      {editing ? <TeamDialog draft={editing} onClose={() => setEditing(null)} onSaved={refresh} /> : null}
      {rosterFor ? (
        <RosterDialog
          team={rosterFor}
          players={players.filter((p) => p.team_id === rosterFor.id)}
          canDelete={isAdmin}
          onClose={() => setRosterFor(null)}
          onSaved={refresh}
        />
      ) : null}
    </div>
  );
}

function TeamDialog({
  draft,
  onClose,
  onSaved,
}: {
  draft: Partial<TeamRow>;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState(draft);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof TeamRow, value: unknown): void => setForm((prev) => ({ ...prev, [key]: value }));

  async function save(): Promise<void> {
    const name = String(form.name ?? "").trim();
    const game = String(form.game ?? "").trim();
    if (name.length < 2 || game.length < 2) {
      toast.error("Give the team a name and a game.");
      return;
    }
    setSaving(true);
    const payload = {
      name,
      game,
      slug: (String(form.slug ?? "").trim() || slugify(name)).slice(0, 80),
      tagline: String(form.tagline ?? "").trim(),
      blurb: String(form.blurb ?? "").trim(),
      image_url: String(form.image_url ?? "").trim() || null,
      logo_url: String(form.logo_url ?? "").trim() || null,
      visible: form.visible !== false,
      sort_order: Number(form.sort_order ?? 0),
    };
    const { error } = form.id
      ? await supabase.from("teams").update(payload).eq("id", form.id)
      : await supabase.from("teams").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Team saved");
    await onSaved();
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit team" : "New team"}</DialogTitle>
          <DialogDescription>This is what visitors see on the team's own page.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Team name</Label>
              <Input value={String(form.name ?? "")} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Game</Label>
              <Input value={String(form.game ?? "")} onChange={(e) => set("game", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Link name</Label>
              <Input
                value={String(form.slug ?? "")}
                placeholder="valorant"
                onChange={(e) => set("slug", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={Number(form.sort_order ?? 0)}
                onChange={(e) => set("sort_order", Number(e.target.value))}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>One-line tagline</Label>
            <Input value={String(form.tagline ?? "")} onChange={(e) => set("tagline", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea rows={4} value={String(form.blurb ?? "")} onChange={(e) => set("blurb", e.target.value)} />
          </div>
          <ImageField
            label="Team picture"
            folder="teams"
            value={String(form.image_url ?? "")}
            onChange={(next) => set("image_url", next)}
          />
          <ImageField
            label="Game logo"
            folder="teams"
            value={String(form.logo_url ?? "")}
            onChange={(next) => set("logo_url", next)}
          />
          <label className="flex items-center gap-3 text-sm">
            <Switch checked={form.visible !== false} onCheckedChange={(v) => set("visible", v)} />
            Show this team on the website
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save team"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RosterDialog({
  team,
  players,
  canDelete,
  onClose,
  onSaved,
}: {
  team: TeamRow;
  players: PlayerRow[];
  canDelete: boolean;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<Partial<PlayerRow> | null>(null);
  const [saving, setSaving] = useState(false);

  async function savePlayer(): Promise<void> {
    if (!draft) return;
    const name = String(draft.name ?? "").trim();
    if (name.length < 2) {
      toast.error("Add the player's name.");
      return;
    }
    setSaving(true);
    const payload = {
      team_id: team.id,
      name,
      handle: String(draft.handle ?? "").trim(),
      role: String(draft.role ?? "").trim(),
      photo_url: String(draft.photo_url ?? "").trim() || null,
      country_code: String(draft.country_code ?? "").trim().toUpperCase() || null,
      country_codes: (draft.country_codes ?? []).map((code) => String(code).trim().toUpperCase()),
      birth_date: String(draft.birth_date ?? "").trim() || null,
      is_captain: draft.is_captain === true,
      visible: draft.visible !== false,
      sort_order: Number(draft.sort_order ?? players.length + 1),
    };
    const { error } = draft.id
      ? await supabase.from("team_players").update(payload).eq("id", draft.id)
      : await supabase.from("team_players").insert(payload);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Player saved");
    setDraft(null);
    await onSaved();
  }

  async function removePlayer(row: PlayerRow): Promise<void> {
    if (!window.confirm(`Remove ${row.name} from the roster?`)) return;
    const { error } = await supabase.from("team_players").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Player removed");
    await onSaved();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{team.name} roster</DialogTitle>
          <DialogDescription>Players shown on the team's public page.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 truncate text-sm font-semibold">
                  {player.handle || player.name}
                  {player.is_captain ? <Crown className="size-4 text-primary" aria-label="Team captain" /> : null}
                  {nationalityCodes(player).map((code) => (
                    <span key={code} aria-hidden>
                      {countryFlag(code)}
                    </span>
                  ))}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {player.name}
                  {player.role ? ` · ${player.role}` : ""}
                  {ageFrom(player.birth_date) !== null ? ` · ${ageFrom(player.birth_date)} yrs` : ""}
                  {player.visible ? "" : " · hidden"}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="icon" variant="ghost" aria-label="Edit player" onClick={() => setDraft(player)}>
                  <Pencil className="size-4" />
                </Button>
                {canDelete ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Remove player"
                    onClick={() => void removePlayer(player)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          {players.length === 0 ? (
            <p className="text-sm text-muted-foreground">No players on this roster yet.</p>
          ) : null}
        </div>

        {draft ? (
          <div className="space-y-4 rounded-lg border border-border p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Real name</Label>
                <Input
                  value={String(draft.name ?? "")}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Gamer tag</Label>
                <Input
                  value={String(draft.handle ?? "")}
                  onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  value={String(draft.role ?? "")}
                  placeholder="Duelist, IGL, coach…"
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Main nationality</Label>
                <select
                  value={String(draft.country_code ?? "")}
                  onChange={(e) => setDraft({ ...draft, country_code: e.target.value || null })}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Not shown</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {countryFlag(country.code)} {country.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Extra nationalities</Label>
                <select
                  value=""
                  onChange={(e) => {
                    const code = e.target.value;
                    if (!code) return;
                    const extras = (draft.country_codes ?? []) as string[];
                    if (extras.includes(code) || code === draft.country_code) return;
                    setDraft({ ...draft, country_codes: [...extras, code] });
                  }}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Add a nationality…</option>
                  {COUNTRIES.filter(
                    (country) =>
                      country.code !== draft.country_code &&
                      !((draft.country_codes ?? []) as string[]).includes(country.code),
                  ).map((country) => (
                    <option key={country.code} value={country.code}>
                      {countryFlag(country.code)} {country.name}
                    </option>
                  ))}
                </select>
                {((draft.country_codes ?? []) as string[]).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {((draft.country_codes ?? []) as string[]).map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            country_codes: ((draft.country_codes ?? []) as string[]).filter((c) => c !== code),
                          })
                        }
                        className="inline-flex min-h-9 items-center gap-2 rounded-full border border-border bg-surface-2 px-3 text-sm"
                        aria-label={`Remove ${COUNTRIES.find((c) => c.code === code)?.name ?? code}`}
                      >
                        {countryFlag(code)} {COUNTRIES.find((c) => c.code === code)?.name ?? code}
                        <X className="size-3.5 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Pick any additional nationality from the list — all flags show next to the player's name. Tap a flag to
                  remove it.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Date of birth</Label>
                <Input
                  type="date"
                  value={String(draft.birth_date ?? "")}
                  onChange={(e) => setDraft({ ...draft, birth_date: e.target.value || null })}
                />
                <p className="text-xs text-muted-foreground">Only the age is shown on the website.</p>
              </div>
              <div className="space-y-2">
                <Label>Team captain</Label>
                <label className="flex h-11 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={draft.is_captain === true}
                    onChange={(e) => setDraft({ ...draft, is_captain: e.target.checked })}
                  />
                  Captain of this team
                </label>
                <p className="text-xs text-muted-foreground">Shows a captain badge on the team page.</p>
              </div>
              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={Number(draft.sort_order ?? players.length + 1)}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
                <p className="text-xs text-muted-foreground">Lower numbers show first.</p>
              </div>
            </div>
            <ImageField
              label="Player photo"
              folder="teams"
              value={String(draft.photo_url ?? "")}
              onChange={(next) => setDraft({ ...draft, photo_url: next })}
            />
            <label className="flex items-center gap-3 text-sm">
              <Switch
                checked={draft.visible !== false}
                onCheckedChange={(v) => setDraft({ ...draft, visible: v })}
              />
              Show this player
            </label>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDraft(null)}>
                Cancel
              </Button>
              <Button disabled={saving} onClick={() => void savePlayer()}>
                {saving ? "Saving…" : "Save player"}
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setDraft({ visible: true })}>
            <Plus className="size-4" /> Add player
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
