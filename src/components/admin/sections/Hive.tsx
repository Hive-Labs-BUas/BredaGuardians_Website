import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function Hive({ data }: { data: AdminData | undefined }) {
  const queryClient = useQueryClient();
  const [special, setSpecial] = useState({ label: "", day: "", note: "", is_closure: true });

  async function refresh(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: ["opening_hours"] });
  }

  async function saveHour(
    id: string,
    patch: { opens_at?: string | null; closes_at?: string | null; closed?: boolean },
  ): Promise<void> {
    const { error } = await supabase.from("opening_hours").update(patch).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  async function addSpecial(): Promise<void> {
    if (!special.label.trim() || !special.day) {
      toast.error("Add a name and a date.");
      return;
    }
    const { error } = await supabase.from("special_days").insert({
      label: special.label.trim(),
      day: special.day,
      note: special.note.trim(),
      is_closure: special.is_closure,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Special day added");
    setSpecial({ label: "", day: "", note: "", is_closure: true });
    await refresh();
  }

  async function removeSpecial(id: string): Promise<void> {
    const { error } = await supabase.from("special_days").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  const hours = [...(data?.hours ?? [])].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <div className="space-y-8">
      <div className="surface-card bg-surface-2 p-6">
        <h2 className="text-2xl">Opening hours</h2>
        <p className="text-sm text-muted-foreground">Changes go live on the Opening Hours page straight away.</p>
        <div className="mt-5 space-y-3">
          {hours.map((row) => (
            <div
              key={row.id}
              className="grid items-center gap-3 rounded-lg border border-border bg-surface p-3 sm:grid-cols-[8rem_1fr_1fr_auto]"
            >
              <span className="font-medium">{DAYS[row.day_of_week] ?? `Day ${row.day_of_week}`}</span>
              <Input
                type="time"
                defaultValue={row.opens_at ?? ""}
                disabled={row.closed}
                onBlur={(event) => void saveHour(row.id, { opens_at: event.target.value || null })}
                aria-label="Opens at"
              />
              <Input
                type="time"
                defaultValue={row.closes_at ?? ""}
                disabled={row.closed}
                onBlur={(event) => void saveHour(row.id, { closes_at: event.target.value || null })}
                aria-label="Closes at"
              />
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Switch
                  checked={row.closed}
                  onCheckedChange={(checked) => void saveHour(row.id, { closed: checked })}
                />
                Closed
              </label>
            </div>
          ))}
          {hours.length === 0 && <p className="text-sm text-muted-foreground">No opening hours set yet.</p>}
        </div>
      </div>

      <div className="surface-card bg-surface-2 p-6">
        <h2 className="text-2xl">Special days and closures</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_10rem_1fr_auto]">
          <div className="space-y-2">
            <Label htmlFor="sp-label">Name</Label>
            <Input
              id="sp-label"
              value={special.label}
              onChange={(event) => setSpecial({ ...special, label: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-day">Date</Label>
            <Input
              id="sp-day"
              type="date"
              value={special.day}
              onChange={(event) => setSpecial({ ...special, day: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sp-note">Note</Label>
            <Input
              id="sp-note"
              value={special.note}
              onChange={(event) => setSpecial({ ...special, note: event.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={() => void addSpecial()}>
              <Plus className="size-4" /> Add
            </Button>
          </div>
        </div>

        <ul className="mt-6 space-y-2">
          {(data?.specialDays ?? []).map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-sm"
            >
              <span>
                <strong>{row.label}</strong> · {row.day} {row.note && `· ${row.note}`}
              </span>
              <AdminOnly>
<Button size="icon" variant="ghost" aria-label="Delete" onClick={() => void removeSpecial(row.id)}>
                <Trash2 className="size-4" />
              </Button>
</AdminOnly>
            </li>
          ))}
          {(data?.specialDays ?? []).length === 0 && (
            <li className="text-sm text-muted-foreground">No special days planned.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
