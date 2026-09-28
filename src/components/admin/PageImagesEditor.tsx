import { useQueryClient } from "@tanstack/react-query";

import { ImageField } from "@/components/admin/ImageField";
import { supabase } from "@/integrations/supabase/client";
import { useSiteImages } from "@/lib/queries";

/**
 * Picture slots for fixed spots on the public pages (About page hero and the
 * four "What we offer" cards). Uploading or pasting a link saves immediately.
 */
export function PageImagesEditor({ only, exclude, intro }: { only?: string[]; exclude?: string[]; intro?: string } = {}) {
  const { data, isLoading } = useSiteImages();
  const queryClient = useQueryClient();
  const rows = (data ?? []).filter((row) => (only ? only.includes(row.key) : !(exclude ?? []).includes(row.key)));

  async function save(id: string, url: string): Promise<void> {
    await supabase.from("site_images").update({ url } as never).eq("id", id);
    await queryClient.invalidateQueries({ queryKey: ["site_images"] });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        {intro ??
          "These pictures appear on the About page. Upload a new one or paste a link — the page updates right away. Leave a slot empty to use the standard picture."}
      </p>

      {isLoading && <p className="text-sm text-muted-foreground">Loading pictures…</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        {rows.map((row) => (
          <div key={row.id} className="surface-card bg-surface-2 p-5">
            <ImageField
              label={row.label}
              value={row.url}
              folder="site"
              onChange={(next) => void save(row.id, next)}
            />
          </div>
        ))}
      </div>

      {!isLoading && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">No picture slots yet.</p>
      )}
    </div>
  );
}
