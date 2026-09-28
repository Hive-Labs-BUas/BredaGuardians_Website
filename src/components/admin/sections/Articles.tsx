import { useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  ARTICLE_LABELS,
  ArticleEditor,
  emptyDraft,
  toDraft,
  type ArticleDraft,
  type ArticleKind,
} from "@/components/admin/ArticleEditor";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/components/site/Bits";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";
import { formatDate } from "@/lib/queries";

type Row = Record<string, unknown> & { id: string };

export function Articles({ data }: { data: AdminData | undefined }) {
  const [kind, setKind] = useState<ArticleKind>("news");
  const [draft, setDraft] = useState<ArticleDraft | null>(null);
  const queryClient = useQueryClient();

  const rows: Row[] =
    kind === "news"
      ? ((data?.news ?? []) as unknown as Row[])
      : kind === "research"
        ? ((data?.research ?? []) as unknown as Row[])
        : ((data?.hallOfFame ?? []) as unknown as Row[]);

  const title = (row: Row): string => String(row["title"] ?? "");
  const date = (row: Row): string =>
    String(row["publish_date"] ?? row["entry_date"] ?? row["achieved_on"] ?? "");

  async function remove(row: Row): Promise<void> {
    if (!window.confirm(`Delete “${title(row)}”? This cannot be undone.`)) return;
    const { error } = await supabase.from(kind).delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    await queryClient.invalidateQueries({ queryKey: [kind] });
  }

  function duplicate(row: Row): void {
    const copy = toDraft(kind, row);
    delete copy.id;
    setDraft({ ...copy, title: `${copy.title} (copy)`, slug: "", published: false });
  }

  /** Where this item lives on the public website. */
  function publicUrl(row: Row): string {
    if (kind === "news") {
      const slug = String(row["slug"] ?? "").trim();
      return slug ? `/news/${slug}` : "/";
    }
    if (kind === "research") return `/research/${row.id}`;
    return `/rosters/hall-of-fame#${row.id}`;
  }

  const columns: Column<Row>[] = [
    {
      key: "title",
      header: "Title",
      value: title,
      sortable: true,
      cell: (row) => <span className="font-medium">{title(row)}</span>,
    },
    {
      key: "date",
      header: "Date",
      value: date,
      sortable: true,
      className: "whitespace-nowrap",
      cell: (row) => (date(row) ? formatDate(date(row)) : "—"),
    },
    {
      key: "status",
      header: "Status",
      value: (row) => (kind === "hall_of_fame" || row["published"] ? "live" : "draft"),
      cell: (row) => <Tag>{kind === "hall_of_fame" || row["published"] ? "Live" : "Draft"}</Tag>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="flex justify-end gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Open page"
            title={
              kind === "hall_of_fame" || row["published"]
                ? "Open this page on the website"
                : "Open the page — it is only visible to you until you publish it"
            }
            asChild
          >
            <a href={publicUrl(row)} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" />
            </a>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Edit"
            title="Edit this item"
            onClick={() => setDraft(toDraft(kind, row))}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Duplicate"
            title="Make a copy to start from"
            onClick={() => duplicate(row)}
          >
            <Copy className="size-4" />
          </Button>
          <AdminOnly>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Delete"
              title="Delete permanently (admins only)"
              onClick={() => void remove(row)}
            >
              <Trash2 className="size-4" />
            </Button>
          </AdminOnly>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <p className="rounded-lg border border-border bg-surface-2 px-4 py-3 text-sm text-muted-foreground">
        Write and publish everything that appears under News, Research and the Hall of Fame. Pick a tab, then use the
        arrow button on a row to see the live page. Only admins can delete.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Tabs value={kind} onValueChange={(value) => setKind(value as ArticleKind)}>
          <TabsList className="bg-surface">
            <TabsTrigger value="news" className="min-h-11">News</TabsTrigger>
            <TabsTrigger value="research" className="min-h-11">Research</TabsTrigger>
            <TabsTrigger value="hall_of_fame" className="min-h-11">Hall of Fame</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button onClick={() => setDraft(emptyDraft())}>
          <Plus className="size-4" /> New {ARTICLE_LABELS[kind].toLowerCase()}
        </Button>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search by title…"
        empty="Nothing published yet — create your first one."
        exportName={`breda-guardians-${kind}`}
      />

      {draft && <ArticleEditor kind={kind} draft={draft} onClose={() => setDraft(null)} />}
    </div>
  );
}
