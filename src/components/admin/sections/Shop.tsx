import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminOnly } from "@/components/admin/AdminOnly";
import { supabase } from "@/integrations/supabase/client";
import type { AdminData } from "@/lib/admin-data";
import { formatDate, formatEuros } from "@/lib/queries";
import { categoriesFrom, normalizeCategory, prettyCategory } from "@/lib/shop-categories";
import { setShopRequestStatus } from "@/lib/shop.functions";

type Product = AdminData["shopProducts"][number];
type VoucherRow = AdminData["shopVouchers"][number];

type VoucherForm = {
  id?: string;
  code: string;
  description: string;
  kind: string;
  value: string;
  min_spend: string;
  applies_to: string;
  expires_at: string;
  max_uses: string;
  active: boolean;
};

function emptyVoucher(): VoucherForm {
  return {
    code: "",
    description: "",
    kind: "percent",
    value: "10",
    min_spend: "0",
    applies_to: "all",
    expires_at: "",
    max_uses: "",
    active: true,
  };
}

function toVoucherForm(row: VoucherRow): VoucherForm {
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    kind: row.kind,
    value: row.kind === "percent" ? String(row.value) : (row.value / 100).toFixed(2),
    min_spend: (row.min_spend_cents / 100).toFixed(2),
    applies_to: row.applies_to,
    expires_at: row.expires_at ? String(row.expires_at).slice(0, 10) : "",
    max_uses: row.max_uses === null ? "" : String(row.max_uses),
    active: row.active,
  };
}

type RequestRow = AdminData["shopRequests"][number];

type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  price: string;
  sizes: string;
  image_url: string;
  in_stock: boolean;
  visible: boolean;
  sort_order: number;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function emptyProduct(): ProductForm {
  return {
    name: "",
    slug: "",
    category: "apparel",
    description: "",
    price: "0",
    sizes: "",
    image_url: "",
    in_stock: true,
    visible: true,
    sort_order: 100,
  };
}

function toForm(row: Product): ProductForm {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    price: (row.price_cents / 100).toFixed(2),
    sizes: row.sizes.join(", "),
    image_url: row.image_url ?? "",
    in_stock: row.in_stock,
    visible: row.visible,
    sort_order: row.sort_order,
  };
}

const STATUSES = ["awaiting_payment", "paid", "handed_over", "cancelled"] as const;

const STATUS_LABEL: Record<string, string> = {
  awaiting_payment: "awaiting payment",
  paid: "paid",
  handed_over: "handed over",
  cancelled: "cancelled",
};

export function Shop({ data }: { data: AdminData | undefined }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ProductForm | null>(null);
  const [open, setOpen] = useState<RequestRow | null>(null);
  const [note, setNote] = useState("");
  const [voucher, setVoucher] = useState<VoucherForm | null>(null);
  const changeStatus = useServerFn(setShopRequestStatus);

  const products = data?.shopProducts ?? [];
  const requests = data?.shopRequests ?? [];
  const vouchers = data?.shopVouchers ?? [];
  const productCategories = categoriesFrom(products);

  const setVoucherField = <K extends keyof VoucherForm>(key: K, value: VoucherForm[K]): void =>
    setVoucher((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function saveVoucher(): Promise<void> {
    if (!voucher) return;
    const code = voucher.code.trim().toUpperCase();
    if (!code) {
      toast.error("Give the code a name, e.g. WELCOME10.");
      return;
    }
    const raw = Number(voucher.value.replace(",", "."));
    const payload = {
      code,
      description: voucher.description.trim(),
      kind: voucher.kind,
      value: voucher.kind === "percent" ? Math.round(raw) : Math.round(raw * 100),
      min_spend_cents: Math.round(Number(voucher.min_spend.replace(",", ".")) * 100) || 0,
      applies_to: voucher.applies_to,
      expires_at: voucher.expires_at || null,
      max_uses: voucher.max_uses.trim() === "" ? null : Number(voucher.max_uses),
      active: voucher.active,
    };
    const { error } = voucher.id
      ? await supabase.from("shop_vouchers").update(payload).eq("id", voucher.id)
      : await supabase.from("shop_vouchers").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(voucher.id ? "Code saved" : "Code created");
    setVoucher(null);
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  }

  async function removeVoucher(row: VoucherRow): Promise<void> {
    if (!window.confirm(`Delete ${row.code}?`)) return;
    const { error } = await supabase.from("shop_vouchers").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
  }

  const voucherColumns: Column<VoucherRow>[] = [
    { key: "code", header: "Code", sortable: true, value: (row) => row.code, cell: (row) => row.code },
    {
      key: "discount",
      header: "Discount",
      sortable: true,
      value: (row) => row.value,
      cell: (row) => (row.kind === "percent" ? `${row.value}%` : formatEuros(row.value)),
    },
    {
      key: "applies_to",
      header: "Applies to",
      sortable: true,
      value: (row) => row.applies_to,
      cell: (row) => <Tag>{row.applies_to}</Tag>,
    },
    {
      key: "min_spend",
      header: "Min. spend",
      value: (row) => row.min_spend_cents,
      cell: (row) => (row.min_spend_cents > 0 ? formatEuros(row.min_spend_cents) : "—"),
    },
    {
      key: "uses",
      header: "Used",
      sortable: true,
      value: (row) => row.uses,
      cell: (row) => `${row.uses}${row.max_uses === null ? "" : ` / ${row.max_uses}`}`,
    },
    {
      key: "expires_at",
      header: "Expires",
      sortable: true,
      value: (row) => row.expires_at ?? "",
      cell: (row) => (row.expires_at ? formatDate(String(row.expires_at)) : "—"),
    },
    {
      key: "active",
      header: "State",
      value: (row) => (row.active ? "active" : "off"),
      cell: (row) => (
        <span className="text-muted-foreground">{row.active ? "Active" : "Switched off"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setVoucher(toVoucherForm(row))}>
            <Pencil className="size-4" />
          </Button>
          <AdminOnly>
            <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => void removeVoucher(row)}>
              <Trash2 className="size-4" />
            </Button>
          </AdminOnly>
        </div>
      ),
    },
  ];

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]): void =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  const statusMutation = useMutation({
    mutationFn: (input: { id: string; status: (typeof STATUSES)[number]; note?: string }) =>
      changeStatus({ data: input }),
    onSuccess: async () => {
      toast.success("Request updated");
      setOpen(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-data"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function saveProduct(): Promise<void> {
    if (!form) return;
    if (!form.name.trim()) {
      toast.error("Give the item a name.");
      return;
    }
    const payload = {
      name: form.name.trim(),
      slug: (form.slug.trim() || slugify(form.name)).slice(0, 80),
      category: normalizeCategory(form.category) || "other",
      description: form.description.trim(),
      price_cents: Math.round(Number(form.price.replace(",", ".")) * 100) || 0,
      sizes: form.sizes
        .split(",")
        .map((size) => size.trim())
        .filter(Boolean),
      image_url: form.image_url.trim() || null,
      in_stock: form.in_stock,
      visible: form.visible,
      sort_order: Number(form.sort_order) || 0,
    };
    const { error } = form.id
      ? await supabase.from("shop_products").update(payload).eq("id", form.id)
      : await supabase.from("shop_products").insert(payload);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(form.id ? "Item saved" : "Item added");
    setForm(null);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      queryClient.invalidateQueries({ queryKey: ["shop_products"] }),
    ]);
  }

  async function removeProduct(row: Product): Promise<void> {
    if (!window.confirm(`Delete ${row.name}?`)) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", row.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Deleted");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      queryClient.invalidateQueries({ queryKey: ["shop_products"] }),
    ]);
  }

  const productColumns: Column<Product>[] = [
    { key: "name", header: "Item", sortable: true, value: (row) => row.name, cell: (row) => row.name },
    {
      key: "category",
      header: "Category",
      sortable: true,
      value: (row) => row.category,
      cell: (row) => <Tag>{prettyCategory(row.category)}</Tag>,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      value: (row) => row.price_cents,
      cell: (row) => formatEuros(row.price_cents),
    },
    {
      key: "sizes",
      header: "Sizes",
      value: (row) => row.sizes.join(", "),
      cell: (row) => <span className="text-muted-foreground">{row.sizes.join(", ") || "—"}</span>,
    },
    {
      key: "state",
      header: "State",
      value: (row) => `${row.visible ? "visible" : "hidden"} ${row.in_stock ? "in stock" : "sold out"}`,
      cell: (row) => (
        <span className="text-muted-foreground">
          {row.visible ? "Visible" : "Hidden"} · {row.in_stock ? "In stock" : "Sold out"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => setForm(toForm(row))}>
            <Pencil className="size-4" />
          </Button>
          <AdminOnly>
<Button size="icon" variant="ghost" aria-label="Delete" onClick={() => void removeProduct(row)}>
            <Trash2 className="size-4" />
          </Button>
</AdminOnly>
        </div>
      ),
    },
  ];

  const requestColumns: Column<RequestRow>[] = [
    {
      key: "created_at",
      header: "Requested",
      sortable: true,
      className: "whitespace-nowrap",
      value: (row) => row.created_at,
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "product_name",
      header: "Item",
      sortable: true,
      value: (row) => row.product_name,
      cell: (row) => row.product_name,
    },
    {
      key: "email",
      header: "Member",
      value: (row) => row.email ?? "",
      cell: (row) => <span className="text-muted-foreground">{row.email ?? "—"}</span>,
    },
    {
      key: "size",
      header: "Size",
      value: (row) => row.size ?? "",
      cell: (row) => row.size ?? "—",
    },
    {
      key: "quantity",
      header: "Qty",
      value: (row) => row.quantity,
      cell: (row) => row.quantity,
    },
    {
      key: "total",
      header: "Total",
      value: (row) => row.unit_price_cents * row.quantity,
      cell: (row) => formatEuros(row.unit_price_cents * row.quantity),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      value: (row) => row.status,
      cell: (row) => <Tag>{STATUS_LABEL[row.status] ?? row.status}</Tag>,
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
              setNote(row.note);
            }}
          >
            Open
          </Button>
          {row.status === "awaiting_payment" && (
            <Button
              size="sm"
              onClick={() => statusMutation.mutate({ id: row.id, status: "paid" })}
              disabled={statusMutation.isPending}
            >
              Mark paid
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="products">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="products">Items</TabsTrigger>
            <TabsTrigger value="requests">
              Requests
              {requests.filter((row) => row.status === "awaiting_payment").length > 0 &&
                ` (${requests.filter((row) => row.status === "awaiting_payment").length})`}
            </TabsTrigger>
            <TabsTrigger value="vouchers">Discount codes</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setVoucher(emptyVoucher())}>
              <Plus className="size-4" /> New code
            </Button>
            <Button onClick={() => setForm(emptyProduct())}>
              <Plus className="size-4" /> New item
            </Button>
          </div>
        </div>

        <TabsContent value="products" className="mt-6">
          <DataTable
            rows={products}
            columns={productColumns}
            searchPlaceholder="Search items…"
            empty="No shop items yet."
            exportName="shop-items"
          />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <DataTable
            rows={requests}
            columns={requestColumns}
            searchPlaceholder="Search requests…"
            empty="No shop requests yet."
            exportName="shop-requests"
          />
        </TabsContent>

        <TabsContent value="vouchers" className="mt-6">
          <DataTable
            rows={vouchers}
            columns={voucherColumns}
            searchPlaceholder="Search codes…"
            empty="No discount codes yet."
            exportName="shop-vouchers"
          />
        </TabsContent>
      </Tabs>

      {/* ---------- VOUCHER EDITOR ---------- */}
      <Dialog open={voucher !== null} onOpenChange={(next) => !next && setVoucher(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{voucher?.id ? "Edit discount code" : "New discount code"}</DialogTitle>
            <DialogDescription>
              Members type the code on the shop page; the discount is checked again on our side.
            </DialogDescription>
          </DialogHeader>

          {voucher && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-code">Code</Label>
                  <Input
                    id="voucher-code"
                    value={voucher.code}
                    onChange={(event) => setVoucherField("code", event.target.value.toUpperCase())}
                    placeholder="WELCOME10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-kind">Type</Label>
                  <select
                    id="voucher-kind"
                    value={voucher.kind}
                    onChange={(event) => setVoucherField("kind", event.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  >
                    <option value="percent">Percentage off</option>
                    <option value="fixed">Fixed amount off</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-value">
                    {voucher.kind === "percent" ? "Percentage" : "Amount in euros"}
                  </Label>
                  <Input
                    id="voucher-value"
                    value={voucher.value}
                    onChange={(event) => setVoucherField("value", event.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-scope">Applies to</Label>
                  <select
                    id="voucher-scope"
                    value={voucher.applies_to}
                    onChange={(event) => setVoucherField("applies_to", event.target.value)}
                    className="h-10 w-full rounded-md border border-border bg-surface px-3 text-sm"
                  >
                    <option value="all">Everything</option>
                    <option value="membership">Membership only</option>
                    <option value="apparel">Apparel only</option>
                    <option value="accessories">Accessories only</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-min">Minimum spend in euros</Label>
                  <Input
                    id="voucher-min"
                    value={voucher.min_spend}
                    onChange={(event) => setVoucherField("min_spend", event.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-max">Maximum uses (blank = unlimited)</Label>
                  <Input
                    id="voucher-max"
                    value={voucher.max_uses}
                    onChange={(event) => setVoucherField("max_uses", event.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="voucher-expires">Last day it works (optional)</Label>
                  <Input
                    id="voucher-expires"
                    type="date"
                    value={voucher.expires_at}
                    onChange={(event) => setVoucherField("expires_at", event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="voucher-description">Note for staff</Label>
                <Textarea
                  id="voucher-description"
                  rows={2}
                  value={voucher.description}
                  onChange={(event) => setVoucherField("description", event.target.value)}
                  placeholder="Intro offer for new members"
                />
              </div>

              <label className="flex items-center gap-3 text-sm">
                <Switch
                  checked={voucher.active}
                  onCheckedChange={(next) => setVoucherField("active", next)}
                />
                Code is active
              </label>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setVoucher(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveVoucher()}>Save code</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- ITEM EDITOR ---------- */}
      <Dialog open={form !== null} onOpenChange={(next) => !next && setForm(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form?.id ? "Edit item" : "New item"}</DialogTitle>
            <DialogDescription>Shown on the shop page under its category.</DialogDescription>
          </DialogHeader>

          {form && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="shop-name">Name</Label>
                  <Input
                    id="shop-name"
                    value={form.name}
                    onChange={(event) => set("name", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-category">Category</Label>
                  <Input
                    id="shop-category"
                    value={form.category}
                    onChange={(event) => set("category", event.target.value)}
                    list="shop-category-options"
                    placeholder="apparel, accessories, minecraft-keys…"
                  />
                  <datalist id="shop-category-options">
                    {productCategories.map((slug) => (
                      <option key={slug} value={slug}>
                        {prettyCategory(slug)}
                      </option>
                    ))}
                  </datalist>
                  <p className="text-xs text-muted-foreground">
                    Pick an existing category or type a new one — it gets its own block on the shop page.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-price">Price in euros</Label>
                  <Input
                    id="shop-price"
                    value={form.price}
                    onChange={(event) => set("price", event.target.value)}
                    inputMode="decimal"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-sizes">Sizes (comma separated)</Label>
                  <Input
                    id="shop-sizes"
                    value={form.sizes}
                    onChange={(event) => set("sizes", event.target.value)}
                    placeholder="S, M, L, XL"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-order">Sort order</Label>
                  <Input
                    id="shop-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(event) => set("sort_order", Number(event.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="shop-slug">Slug</Label>
                  <Input
                    id="shop-slug"
                    value={form.slug}
                    onChange={(event) => set("slug", event.target.value)}
                    placeholder={slugify(form.name)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="shop-description">Description</Label>
                <Textarea
                  id="shop-description"
                  rows={3}
                  value={form.description}
                  onChange={(event) => set("description", event.target.value)}
                />
              </div>

              <ImageField
                value={form.image_url}
                onChange={(next) => set("image_url", next)}
                folder="shop"
                label="Item photo"
              />

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={form.visible} onCheckedChange={(next) => set("visible", next)} />
                  Visible on the shop page
                </label>
                <label className="flex items-center gap-3 text-sm">
                  <Switch checked={form.in_stock} onCheckedChange={(next) => set("in_stock", next)} />
                  In stock
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => setForm(null)}>
                  Cancel
                </Button>
                <Button onClick={() => void saveProduct()}>Save item</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- REQUEST DETAIL ---------- */}
      <Dialog open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{open?.product_name}</DialogTitle>
            <DialogDescription>
              {open ? `${open.email ?? "Member"} · ${formatDate(open.created_at)}` : ""}
            </DialogDescription>
          </DialogHeader>

          {open && (
            <div className="space-y-4 text-sm">
              <p className="text-muted-foreground">
                Size: {open.size ?? "—"} · Quantity: {open.quantity} ·{" "}
                {formatEuros(open.unit_price_cents * open.quantity)}
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="shop-note">Staff note</Label>
                <Textarea
                  id="shop-note"
                  rows={3}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Paid in cash, size L handed over…"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={open.status === status ? "default" : "outline"}
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ id: open.id, status, note })}
                  >
                    {STATUS_LABEL[status]}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
