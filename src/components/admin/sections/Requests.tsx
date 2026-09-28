import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Mail, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { Tag } from "@/components/site/Bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";
import { getApplicationFileUrl } from "@/lib/applications.functions";
import { formatDate } from "@/lib/queries";

const STATUSES = ["new", "in progress", "done"] as const;

type Kind = "contact_submissions" | "applications";

type RequestRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  status: string;
  internal_note: string;
  body: string;
  position?: string;
  cv_path?: string | null;
  letter_path?: string | null;
};

export function Requests({ data, userId }: { data: AdminData | undefined; userId: string }) {
  const [kind, setKind] = useState<Kind>("contact_submissions");
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<RequestRow | null>(null);
  const [note, setNote] = useState("");
  const queryClient = useQueryClient();
  const fileUrl = useServerFn(getApplicationFileUrl);

  async function openAttachment(path: string): Promise<void> {
    try {
      const { url } = await fileUrl({ data: { path } });
      window.open(url, "_blank", "noreferrer");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open that file.");
    }
  }

  const all: RequestRow[] =
    kind === "contact_submissions"
      ? (data?.messages ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          created_at: row.created_at,
          status: row.status,
          internal_note: row.internal_note,
          body: row.message,
        }))
      : (data?.applications ?? []).map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          created_at: row.created_at,
          status: row.status,
          internal_note: row.internal_note,
          body: row.motivation,
          position: row.position,
          cv_path: (row as { cv_path?: string | null }).cv_path ?? null,
          letter_path: (row as { letter_path?: string | null }).letter_path ?? null,
        }));

  const rows = filter === "all" ? all : all.filter((row) => row.status === filter);

  async function update(id: string, patch: Record<string, unknown>): Promise<void> {
    const { error } = await supabase.from(kind).update(patch as never).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  }

  async function setStatus(row: RequestRow, status: string): Promise<void> {
    await update(row.id, {
      status,
      handled_by: userId,
      handled_at: new Date().toISOString(),
    });
    toast.success(`Marked as ${status}`);
  }

  async function remove(row: RequestRow): Promise<void> {
    if (!window.confirm(`Delete the request from ${row.name}?`)) return;
    const { error } = await supabase.from(kind).delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  }

  const columns: Column<RequestRow>[] = [
    {
      key: "created_at",
      header: "Received",
      sortable: true,
      className: "whitespace-nowrap",
      value: (row) => row.created_at,
      cell: (row) => formatDate(row.created_at),
    },
    { key: "name", header: "Name", sortable: true, value: (row) => row.name, cell: (row) => row.name },
    { key: "email", header: "Email", value: (row) => row.email, cell: (row) => row.email },
    ...(kind === "applications"
      ? [
          {
            key: "position",
            header: "Role",
            value: (row: RequestRow) => row.position ?? "",
            cell: (row: RequestRow) => <span className="text-primary">{row.position}</span>,
          },
        ]
      : []),
    {
      key: "body",
      header: kind === "applications" ? "Motivation" : "Message",
      value: (row) => row.body,
      className: "max-w-sm",
      cell: (row) => <span className="line-clamp-2 text-muted-foreground">{row.body}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (row) => row.status,
      cell: (row) => <Tag>{row.status}</Tag>,
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setOpen(row);
              setNote(row.internal_note);
            }}
          >
            Open
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
        <Tabs value={kind} onValueChange={(value) => setKind(value as Kind)}>
          <TabsList className="bg-surface">
            <TabsTrigger value="contact_submissions" className="min-h-11">Contact messages</TabsTrigger>
            <TabsTrigger value="applications" className="min-h-11">Applications</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex flex-wrap gap-2">
          {["all", ...STATUSES].map((value) => (
            <Button
              key={value}
              size="sm"
              variant={filter === value ? "default" : "outline"}
              onClick={() => setFilter(value)}
            >
              {value}
            </Button>
          ))}
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        searchPlaceholder="Search name, email, message…"
        empty="Nothing in this list."
        exportName={`breda-guardians-${kind}`}
      />

      {open && (
        <Dialog open onOpenChange={(isOpen) => !isOpen && setOpen(null)}>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{open.name}</DialogTitle>
              <DialogDescription>
                {open.email} · {formatDate(open.created_at)}
                {open.position ? ` · ${open.position}` : ""}
              </DialogDescription>
            </DialogHeader>

            <p className="whitespace-pre-line rounded-lg border border-border bg-surface p-4 text-sm text-muted-foreground">
              {open.body}
            </p>

            {(open.cv_path || open.letter_path) && (
              <div className="flex flex-wrap gap-2">
                {open.cv_path && (
                  <Button size="sm" variant="outline" onClick={() => void openAttachment(open.cv_path!)}>
                    <Download className="size-4" /> CV
                  </Button>
                )}
                {open.letter_path && (
                  <Button size="sm" variant="outline" onClick={() => void openAttachment(open.letter_path!)}>
                    <Download className="size-4" /> Motivation letter
                  </Button>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="req-note">Internal note</Label>
              <Textarea
                id="req-note"
                rows={4}
                value={note}
                maxLength={2000}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Only the team sees this."
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={open.status === status ? "default" : "outline"}
                    onClick={() => {
                      void setStatus(open, status);
                      setOpen({ ...open, status });
                    }}
                  >
                    {status}
                  </Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <a href={`mailto:${open.email}?subject=Breda%20Guardians`}>
                    <Mail className="size-4" /> Reply
                  </a>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    void update(open.id, { internal_note: note });
                    toast.success("Note saved");
                    setOpen(null);
                  }}
                >
                  Save note
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
