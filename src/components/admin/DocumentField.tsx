import { FileText, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

/**
 * Attach a document (PDF, Word, slides) to an article. Uploads to the media
 * library and stores the public path plus a readable name.
 */
export function DocumentField({
  url,
  name,
  sizeBytes,
  onChange,
  folder,
  label = "Attached document (optional)",
}: {
  url: string;
  name: string;
  sizeBytes?: number | null;
  onChange: (next: { url: string; name: string; sizeBytes: number | null }) => void;
  folder: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function upload(file: File): Promise<void> {
    if (file.size > 20 * 1024 * 1024) {
      toast.error("That file is larger than 20 MB.");
      return;
    }
    setBusy(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const path = `${folder}/docs/${crypto.randomUUID()}.${ext}`;
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
    onChange({ url: `/api/public/media/${path}`, name: file.name, sizeBytes: file.size });
    toast.success("Document uploaded");
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {url ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-3">
          <FileText className="size-5 shrink-0 text-primary" aria-hidden />
          <Input
            value={name}
            placeholder="Name shown to readers"
            onChange={(event) => onChange({ url, name: event.target.value, sizeBytes: sizeBytes ?? null })}
            className="min-w-40 flex-1"
          />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            aria-label="Remove document"
            onClick={() => onChange({ url: "", name: "", sizeBytes: null })}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No document attached yet.</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
          event.target.value = "";
        }}
      />
      <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {busy ? "Uploading…" : url ? "Replace document" : "Upload document"}
      </Button>
    </div>
  );
}
