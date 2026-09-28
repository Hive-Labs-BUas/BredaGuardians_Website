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
import { useSocials } from "@/lib/queries";

const PLATFORMS = ["discord", "instagram", "tiktok", "youtube", "twitch", "linkedin"];

/** Editable social links shown in the footer. */
export function SocialsEditor() {
  const { data, isLoading } = useSocials();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ platform: "instagram", label: "Instagram", url: "" });

  async function refresh(): Promise<void> {
    await queryClient.invalidateQueries({ queryKey: ["site_socials"] });
  }

  async function save(id: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from("site_socials").update(patch as never).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refresh();
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        These links appear in the footer. Hide a channel with the switch until it is ready.
      </p>

      <div className="space-y-3">
        {(data ?? []).map((social) => (
          <div
            key={social.id}
            className="surface-card grid gap-3 bg-surface-2 p-4 md:grid-cols-[9rem_1fr_auto_auto] md:items-end"
          >
            <div className="space-y-2">
              <Label htmlFor={`label-${social.id}`}>Name</Label>
              <Input
                id={`label-${social.id}`}
                defaultValue={social.label}
                onBlur={(event) => void save(social.id, { label: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`url-${social.id}`}>Link</Label>
              <Input
                id={`url-${social.id}`}
                defaultValue={social.url}
                placeholder="https://…"
                onBlur={(event) => void save(social.id, { url: event.target.value.trim() })}
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch
                id={`visible-${social.id}`}
                checked={social.visible}
                onCheckedChange={(checked) => void save(social.id, { visible: checked })}
              />
              <Label htmlFor={`visible-${social.id}`}>Visible</Label>
            </div>
            <AdminOnly>
<Button
              size="icon"
              variant="ghost"
              aria-label={`Delete ${social.label}`}
              onClick={async () => {
                if (!window.confirm(`Remove ${social.label}?`)) return;
                const { error } = await supabase.from("site_socials").delete().eq("id", social.id);
                if (error) {
                  toast.error(error.message);
                  return;
                }
                await refresh();
              }}
            >
              <Trash2 className="size-4" />
            </Button>
</AdminOnly>
          </div>
        ))}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">No social links yet.</p>
        )}
      </div>

      <div className="surface-card grid gap-3 bg-surface-2 p-5 md:grid-cols-[10rem_10rem_1fr_auto] md:items-end">
        <div className="space-y-2">
          <Label htmlFor="new-platform">Platform</Label>
          <select
            id="new-platform"
            value={draft.platform}
            onChange={(event) =>
              setDraft({
                ...draft,
                platform: event.target.value,
                label: event.target.value.charAt(0).toUpperCase() + event.target.value.slice(1),
              })
            }
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {PLATFORMS.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-label">Name</Label>
          <Input id="new-label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-url">Link</Label>
          <Input
            id="new-url"
            value={draft.url}
            placeholder="https://…"
            onChange={(e) => setDraft({ ...draft, url: e.target.value })}
          />
        </div>
        <Button
          onClick={async () => {
            if (!draft.url.trim()) {
              toast.error("Add a link first.");
              return;
            }
            const { error } = await supabase.from("site_socials").insert({
              platform: draft.platform,
              label: draft.label.trim() || draft.platform,
              url: draft.url.trim(),
              sort_order: (data?.length ?? 0) + 1,
            });
            if (error) {
              toast.error(error.message);
              return;
            }
            setDraft({ platform: "instagram", label: "Instagram", url: "" });
            await refresh();
            toast.success("Social link added");
          }}
        >
          <Plus className="size-4" /> Add
        </Button>
      </div>
    </div>
  );
}
