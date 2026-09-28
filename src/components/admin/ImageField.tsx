import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

/**
 * Picture picker for admin forms: upload a file to the media library or paste
 * a link. Uploaded files are served from /api/public/media/<path>.
 */
export function ImageField({
  value,
  onChange,
  folder,
  label = "Picture",
}: {
  value: string;
  onChange: (next: string) => void;
  folder: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function upload(file: File): Promise<void> {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("That picture is larger than 10 MB.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type || "application/octet-stream",
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onChange(`/api/public/media/${path}`);
    toast.success("Picture uploaded");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap items-start gap-3">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-border bg-surface">
          {value ? (
            <>
              <img src={value} alt="" className="size-full object-cover" />
              <button
                type="button"
                aria-label="Remove picture"
                onClick={() => onChange("")}
                className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-background/80 text-foreground"
              >
                <X className="size-3.5" />
              </button>
            </>
          ) : (
            <span className="grid size-full place-items-center text-muted-foreground">
              <ImagePlus className="size-6" />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="/images/example.jpg or https://…"
          />
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
            {busy ? "Uploading…" : "Upload picture"}
          </Button>
        </div>
      </div>
    </div>
  );
}
