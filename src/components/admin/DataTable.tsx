import { Download, Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Plain text used for search and CSV export. */
  value?: (row: T) => string | number;
  className?: string;
  sortable?: boolean;
};

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Searchable, sortable, paginated table used by every admin section.
 * Also exports the current (filtered) rows to a spreadsheet file.
 */
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  searchPlaceholder = "Search…",
  empty = "Nothing here yet.",
  exportName,
  toolbar,
  pageSize = 15,
}: {
  rows: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  empty?: string;
  exportName?: string;
  toolbar?: ReactNode;
  pageSize?: number;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(0);

  const text = (row: T, col: Column<T>): string =>
    String(col.value ? col.value(row) : "").toLowerCase();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? rows.filter((row) => columns.some((col) => text(row, col).includes(q)))
      : rows.slice();
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.value) {
        base.sort((a, b) => {
          const av = col.value!(a);
          const bv = col.value!(b);
          const cmp =
            typeof av === "number" && typeof bv === "number"
              ? av - bv
              : String(av).localeCompare(String(bv));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, columns, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  function exportCsv(): void {
    const head = columns.map((c) => csvEscape(c.header)).join(",");
    const body = filtered
      .map((row) => columns.map((c) => csvEscape(String(c.value ? c.value(row) : ""))).join(","))
      .join("\n");
    const blob = new Blob([`${head}\n${body}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportName ?? "export"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
        {toolbar}
        {exportName && (
          <Button type="button" variant="outline" size="sm" className="ml-auto" onClick={exportCsv}>
            <Download className="size-4" /> Export
          </Button>
        )}
      </div>

      <div className="grid gap-3 md:hidden">
        {visible.map((row) => (
          <article key={row.id} className="admin-panel border border-border/70 bg-surface/70 p-4">
            <dl className="space-y-3">
              {columns.map((col) => (
                <div key={col.key} className="grid grid-cols-[minmax(5.5rem,0.4fr)_minmax(0,1fr)] gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <dt className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">{col.header}</dt>
                  <dd className="min-w-0 break-words text-sm text-foreground">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
        {visible.length === 0 && <div className="admin-panel border border-border/70 bg-surface/70 p-5 text-sm text-muted-foreground">{empty}</div>}
      </div>

      <div className="admin-panel hidden overflow-x-auto border border-border/70 bg-surface/70 p-2 md:block">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={col.className}>
                  {col.sortable && col.value ? (
                    <button
                      type="button"
                      className="inline-flex min-h-8 items-center gap-1 hover:text-primary"
                      onClick={() =>
                        setSort((prev) =>
                          prev?.key === col.key
                            ? { key: col.key, dir: prev.dir === "asc" ? "desc" : "asc" }
                            : { key: col.key, dir: "asc" },
                        )
                      }
                    >
                      {col.header}
                      {sort?.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-muted-foreground">
                  {empty}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {filtered.length} result{filtered.length === 1 ? "" : "s"} · page {current + 1} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
