import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { ArticleImage } from "@/components/site/ArticleImage";
import { DocumentField } from "@/components/admin/DocumentField";
import { ImageField } from "@/components/admin/ImageField";
import { RichTextEditor } from "@/components/admin/RichTextEditor";

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
import { supabase } from "@/integrations/supabase/client";

export type ArticleKind = "news" | "research" | "hall_of_fame";

export const ARTICLE_LABELS: Record<ArticleKind, string> = {
  news: "News story",
  research: "Research study",
  hall_of_fame: "Hall of Fame entry",
};

export type ArticleDraft = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  content: string;
  image: string;
  link: string;
  date: string;
  published: boolean;
  sortOrder: number;
  documentUrl: string;
  documentName: string;
  documentSizeBytes: number | null;
  takeaways: string;
  game: string;
};

const today = (): string => new Date().toISOString().slice(0, 10);

export function emptyDraft(): ArticleDraft {
  return {
    title: "",
    slug: "",
    category: "Case Study",
    summary: "",
    content: "",
    image: "",
    link: "",
    date: today(),
    published: true,
    sortOrder: 0,
    documentUrl: "",
    documentName: "",
    documentSizeBytes: null,
    takeaways: "",
    game: "",
  };
}

export function toDraft(kind: ArticleKind, row: Record<string, unknown>): ArticleDraft {
  const str = (key: string): string => (row[key] == null ? "" : String(row[key]));
  const shared = {
    id: str("id"),
    content: str("content"),
    documentUrl: str("document_url"),
    documentName: str("document_name"),
    documentSizeBytes: row["document_size_bytes"] == null ? null : Number(row["document_size_bytes"]),
    takeaways: str("takeaways"),
    game: str("game"),
  };
  if (kind === "news") {
    return {
      ...shared,
      title: str("title"),
      slug: str("slug"),
      category: "News",
      summary: str("excerpt"),
      image: str("image_url"),
      link: "",
      date: str("publish_date") || today(),
      published: Boolean(row["published"]),
      sortOrder: 0,
    };
  }
  if (kind === "research") {
    return {
      ...shared,
      title: str("title"),
      slug: "",
      category: str("category") || "Case Study",
      summary: str("summary"),
      image: str("cover_image_url"),
      link: str("link_url"),
      date: str("entry_date") || today(),
      published: Boolean(row["published"]),
      sortOrder: 0,
    };
  }
  return {
    ...shared,
    title: str("title"),
    slug: "",
    category: "Hall of Fame",
    summary: str("description"),
    image: str("image_url"),
    link: "",
    date: str("achieved_on") || today(),
    published: true,
    sortOrder: Number(row["sort_order"] ?? 0),
  };
}


function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * One editor for every content type. Fields adapt to the chosen kind so staff
 * only ever learn a single form.
 */
export function ArticleEditor({
  kind,
  draft,
  onClose,
}: {
  kind: ArticleKind;
  draft: ArticleDraft;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ArticleDraft>(draft);
  const [saving, setSaving] = useState(false);
  const [social, setSocial] = useState({ label: "", url: "" });
  const insertRef = useRef<((html: string) => void) | null>(null);
  const queryClient = useQueryClient();


  const set = <K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]): void =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function save(publish: boolean): Promise<void> {
    const title = form.title.trim();
    const summary = form.summary.trim();
    if (title.length < 3) {
      toast.error("Give it a title of at least 3 characters.");
      return;
    }
    if (summary.length < 10) {
      toast.error("Add a short summary of at least 10 characters.");
      return;
    }

    const published = kind === "hall_of_fame" ? true : publish;
    const doc = {
      document_url: form.documentUrl.trim() || null,
      document_name: form.documentUrl.trim() ? form.documentName.trim() || "Document" : null,
    };
    const body = form.content.trim();
    const payload =
      kind === "news"
        ? {
            title,
            slug: (form.slug.trim() || slugify(title)).slice(0, 120),
            excerpt: summary.slice(0, 500),
            content: body || summary,
            image_url: form.image.trim() || null,
            publish_date: form.date,
            published,
            ...doc,
          }
        : kind === "research"
          ? {
              title,
              category: form.category.trim() || "Case Study",
              summary: summary.slice(0, 2000),
              content: body || null,
              cover_image_url: form.image.trim() || null,
              link_url: form.link.trim() || null,
              game: form.game.trim() || null,
              document_size_bytes: form.documentUrl.trim() ? form.documentSizeBytes : null,
              takeaways: form.takeaways.trim(),
              entry_date: form.date,
              published,
              ...doc,
            }
          : {
              title,
              description: summary.slice(0, 2000),
              content: body || null,
              image_url: form.image.trim() || null,
              achieved_on: form.date,
              sort_order: Number.isFinite(form.sortOrder) ? form.sortOrder : 0,
              ...doc,
            };


    setSaving(true);
    const { error } = form.id
      ? await supabase.from(kind).update(payload as never).eq("id", form.id)
      : await supabase.from(kind).insert(payload as never);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Changes saved" : published ? "Published" : "Draft saved");
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: [kind] });
    onClose();
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[94vh] w-[97vw] max-w-[80rem] flex-col overflow-hidden p-0 sm:max-w-[80rem]">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>
            {form.id ? "Edit" : "New"} {ARTICLE_LABELS[kind].toLowerCase()}
          </DialogTitle>
          <DialogDescription>
            Write on the left, set the details on the right. Nothing goes live until you save.
          </DialogDescription>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-5 overflow-y-auto px-6 py-5">
            <div className="space-y-2">
              <Label htmlFor="ae-title">Title</Label>
              <Input
                id="ae-title"
                className="h-12 text-lg"
                value={form.title}
                maxLength={140}
                onChange={(event) => {
                  const next = event.target.value;
                  setForm((prev) => ({
                    ...prev,
                    title: next,
                    slug: prev.id || prev.slug !== slugify(prev.title) ? prev.slug : slugify(next),
                  }));
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ae-summary">Short summary</Label>
              <Textarea
                id="ae-summary"
                rows={4}
                maxLength={2000}
                value={form.summary}
                onChange={(event) => set("summary", event.target.value)}
                placeholder="One or two sentences shown on the overview card."
              />
            </div>

            {kind === "research" && (
              <div className="space-y-2">
                <Label htmlFor="ae-takeaways">Key takeaways (optional)</Label>
                <Textarea
                  id="ae-takeaways"
                  rows={4}
                  maxLength={1200}
                  value={form.takeaways}
                  onChange={(event) => set("takeaways", event.target.value)}
                  placeholder={"One takeaway per line. Leave empty to hide the box."}
                />
                <p className="text-xs text-muted-foreground">
                  Write these yourself — one per line. They show in the box beside the study.
                </p>
              </div>
            )}

            <RichTextEditor
              value={form.content}
              onChange={(next) => set("content", next)}
              folder={kind}
              label="Full story"
              minHeight="30rem"
              onReady={(api) => {
                insertRef.current = api.insertHtml;
              }}
            />

            <div className="surface-card space-y-3 bg-surface-2 p-4">
              <p className="text-sm font-medium">Add a social link</p>
              <p className="text-xs text-muted-foreground">
                Drops a link into the story where your cursor is — handy for crediting a player or a partner.
              </p>
              <div className="grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
                <div className="space-y-2">
                  <Label htmlFor="ae-social-label">Name</Label>
                  <Input
                    id="ae-social-label"
                    value={social.label}
                    placeholder="Instagram"
                    onChange={(event) => setSocial({ ...social, label: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ae-social-url">Link</Label>
                  <Input
                    id="ae-social-url"
                    value={social.url}
                    placeholder="https://…"
                    onChange={(event) => setSocial({ ...social, url: event.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const url = social.url.trim();
                    if (!url) {
                      toast.error("Add the link first.");
                      return;
                    }
                    const text = social.label.trim() || url;
                    insertRef.current?.(
                      `<p><a href="${url}" target="_blank" rel="noreferrer">${text}</a></p>`,
                    );
                    setSocial({ label: "", url: "" });
                  }}
                >
                  Insert
                </Button>
              </div>
            </div>

            <DocumentField
              url={form.documentUrl}
              name={form.documentName}
                sizeBytes={form.documentSizeBytes}
              folder={kind}
                onChange={(next) => setForm((prev) => ({ ...prev, documentUrl: next.url, documentName: next.name, documentSizeBytes: next.sizeBytes }))}
            />
          </div>

          <aside className="min-w-0 space-y-5 overflow-y-auto border-t border-border bg-surface/40 px-6 py-5 lg:border-l lg:border-t-0">
            {kind !== "hall_of_fame" && (
              <div className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                <Label htmlFor="ae-published" className="text-sm">
                  Visible on the site
                </Label>
                <Switch
                  id="ae-published"
                  checked={form.published}
                  onCheckedChange={(checked) => set("published", checked)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="ae-date">Date</Label>
              <Input
                id="ae-date"
                type="date"
                value={form.date}
                onChange={(event) => set("date", event.target.value)}
              />
            </div>

            {kind === "hall_of_fame" && (
              <div className="space-y-2">
                <Label htmlFor="ae-order">Order</Label>
                <Input
                  id="ae-order"
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => set("sortOrder", Number(event.target.value))}
                />
              </div>
            )}

            {kind === "news" && (
              <div className="space-y-2">
                <Label htmlFor="ae-slug">Web address</Label>
                <Input
                  id="ae-slug"
                  value={form.slug}
                  onChange={(event) => set("slug", slugify(event.target.value))}
                  placeholder="auto-filled from the title"
                />
              </div>
            )}

            {kind === "research" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ae-category">Category</Label>
                  <Input
                    id="ae-category"
                    value={form.category}
                    maxLength={60}
                    onChange={(event) => set("category", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ae-game">Game (optional)</Label>
                  <Input
                    id="ae-game"
                    value={form.game}
                    maxLength={80}
                    onChange={(event) => set("game", event.target.value)}
                    placeholder="Valorant"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ae-link">Link to the full study (optional)</Label>
                  <Input
                    id="ae-link"
                    value={form.link}
                    onChange={(event) => set("link", event.target.value)}
                    placeholder="https://…"
                  />
                </div>
              </>
            )}

            <ImageField value={form.image} onChange={(next) => set("image", next)} folder={kind} />

            <div>
              <p className="eyebrow">Card preview</p>
              <div className="surface-card mt-2 overflow-hidden bg-surface-2">
                <ArticleImage
                  src={form.image || null}
                  alt={form.title || "Preview"}
                  label={kind === "news" ? "News" : form.category}
                  title={form.title || "Your title"}
                  className="h-36 w-full"
                />
                <div className="p-4">
                  <h3 className="text-lg leading-tight">{form.title || "Your title"}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                    {form.summary || "Your summary shows up here."}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-wrap justify-end gap-3 border-t border-border px-6 py-4">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          {kind !== "hall_of_fame" && (
            <Button type="button" variant="outline" disabled={saving} onClick={() => void save(false)}>
              Save as draft
            </Button>
          )}
          <Button type="button" disabled={saving} onClick={() => void save(true)}>
            {saving ? "Saving…" : form.id ? "Save changes" : "Publish"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

