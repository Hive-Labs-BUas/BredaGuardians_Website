import { useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { ImageField } from "@/components/admin/ImageField";
import { Tag } from "@/components/site/Bits";
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
import { AdminOnly } from "@/components/admin/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";
import { formatDateTime } from "@/lib/queries";

type ResultRow = AdminData["results"][number];

type ResultForm = {
  id?: string;
  outcome: string;
  competition: string;
  stage: string;
  game: string;
  opponent: string;
  score_us: number;
  score_them: number;
  played_at: string;
  opponent_logo_url: string;
  stream_url: string;
  visible: boolean;
};

function toLocalInput(value: string): string {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function emptyResult(): ResultForm {
  return {
    outcome: "victory",
    competition: "",
    stage: "",
    game: "",
    opponent: "",
    score_us: 0,
    score_them: 0,
    played_at: toLocalInput(new Date().toISOString()),
    opponent_logo_url: "",
    stream_url: "",
    visible: true,
  };
}

export function Results({ data }: { data: AdminData | undefined }) {
  const [form, setForm] = useState<ResultForm | null>(null);
  const queryClient = useQueryClient();
  const rows = data?.results ?? [];

  const set = <K extends keyof ResultForm>(key: K, value: ResultForm[K]): void =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function save(): Promise<void> {
    if (!form) return;
    if (!form.competition.trim() || !form.opponent.trim() || !form.game.trim()) {
      toast.error("Fill in the competition, opponent and game.");
      return;
    }
    const payload = {
      outcome: form.outcome,
      competition: form.competition.trim(),
      stage: form.stage.trim(),
      game: form.game.trim(),
      opponent: form.opponent.trim(),
      score_us: Number(form.score_us) || 0,
      score_them: Number(form.score_them) || 0,
      played_at: new Date(form.played_at).toISOString(),
      opponent_logo_url: form.opponent_logo_url.trim() || null,
      stream_url: form.stream_url.trim() || null,
      visible: form.visible,
    };
    const { error } = form.id
      ? await supabase.from("match_results").update(payload).eq("id", form.id)
      : await supabase.from("match_results").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Result updated" : "Result added");
    setForm(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: ["match_results"] });
  }

  async function remove(row: ResultRow): Promise<void> {
    if (!window.confirm(`Delete the result against ${row.opponent}?`)) return;
    const { error } = await supabase.from("match_results").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Result deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: ["match_results"] });
  }

  const columns: Column<ResultRow>[] = [
    {
      key: "played_at",
      header: "Played",
      sortable: true,
      className: "whitespace-nowrap",
      value: (row) => row.played_at,
      cell: (row) => formatDateTime(row.played_at),
    },
    { key: "game", header: "Game", sortable: true, value: (row) => row.game, cell: (row) => row.game },
    {
      key: "opponent",
      header: "Opponent",
      sortable: true,
      value: (row) => row.opponent,
      cell: (row) => row.opponent,
    },
    {
      key: "score",
      header: "Score",
      value: (row) => `${row.score_us}-${row.score_them}`,
      cell: (row) => (
        <span className="font-display text-primary">
          {row.score_us}–{row.score_them}
        </span>
      ),
    },
    {
      key: "outcome",
      header: "Result",
      value: (row) => row.outcome,
      cell: (row) => <Tag>{row.outcome.toUpperCase()}</Tag>,
    },
    {
      key: "visible",
      header: "Shown",
      value: (row) => (row.visible ? "yes" : "no"),
      cell: (row) => (row.visible ? "Yes" : "Hidden"),
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit"
            onClick={() =>
              setForm({
                id: row.id,
                outcome: row.outcome,
                competition: row.competition,
                stage: row.stage,
                game: row.game,
                opponent: row.opponent,
                score_us: row.score_us ?? 0,
                score_them: row.score_them ?? 0,

                played_at: toLocalInput(row.played_at),
                opponent_logo_url: row.opponent_logo_url ?? "",
                stream_url: row.stream_url ?? "",
                visible: row.visible,
              })
            }
          >
            <Pencil className="size-4" />
          </Button>
          <AdminOnly>
<Button size="icon" variant="ghost" aria-label="Delete" onClick={() => void remove(row)}>
            <Trash2 className="size-4" />
          </Button>
</AdminOnly>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl">Match results</h2>
          <p className="text-sm text-muted-foreground">These show up at the top of the Hall of Fame page.</p>
        </div>
        <Button onClick={() => setForm(emptyResult())}>
          <Plus className="size-4" /> Add result
        </Button>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search opponent, game…"
        empty="No results added yet."
        exportName="breda-guardians-results"
      />

      {form && (
        <Dialog open onOpenChange={(open) => !open && setForm(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? "Edit result" : "New result"}</DialogTitle>
              <DialogDescription>Add the score and the match details.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="r-competition">Competition</Label>
                <Input
                  id="r-competition"
                  value={form.competition}
                  onChange={(event) => set("competition", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-stage">Stage or week</Label>
                <Input id="r-stage" value={form.stage} onChange={(event) => set("stage", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-game">Game</Label>
                <Input id="r-game" value={form.game} onChange={(event) => set("game", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-opponent">Opponent</Label>
                <Input
                  id="r-opponent"
                  value={form.opponent}
                  onChange={(event) => set("opponent", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-us">Our score</Label>
                <Input
                  id="r-us"
                  type="number"
                  value={form.score_us}
                  onChange={(event) => set("score_us", Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-them">Their score</Label>
                <Input
                  id="r-them"
                  type="number"
                  value={form.score_them}
                  onChange={(event) => set("score_them", Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-date">Date and time</Label>
                <Input
                  id="r-date"
                  type="datetime-local"
                  value={form.played_at}
                  onChange={(event) => set("played_at", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-outcome">Outcome</Label>
                <select
                  id="r-outcome"
                  value={form.outcome}
                  onChange={(event) => set("outcome", event.target.value)}
                  className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="victory">Victory</option>
                  <option value="defeat">Defeat</option>
                  <option value="draw">Draw</option>
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="r-stream">Stream or VOD link (optional)</Label>
                <Input
                  id="r-stream"
                  value={form.stream_url}
                  onChange={(event) => set("stream_url", event.target.value)}
                  placeholder="https://…"
                />
              </div>
              <div className="sm:col-span-2">
                <ImageField
                  label="Opponent logo"
                  folder="results"
                  value={form.opponent_logo_url}
                  onChange={(next) => set("opponent_logo_url", next)}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3 sm:col-span-2">
                <Label htmlFor="r-visible" className="text-sm">
                  Show on the website
                </Label>
                <Switch
                  id="r-visible"
                  checked={form.visible}
                  onCheckedChange={(checked) => set("visible", checked)}
                />
              </div>
            </div>

            <div className="mt-2 flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button onClick={() => void save()}>Save result</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
