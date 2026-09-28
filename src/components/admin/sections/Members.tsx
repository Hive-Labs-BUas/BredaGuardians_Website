import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/admin/DataTable";
import { Tag } from "@/components/site/Bits";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteUserAccount, listMembers, setUserRole } from "@/lib/admin.functions";
import { endMembership, setMembershipPaid } from "@/lib/membership.functions";
import type { AdminData } from "@/lib/admin-data";
import { formatDate } from "@/lib/queries";
import { MEMBERSHIP_TIERS } from "@/lib/site-data";

type Member = {
  id: string;
  email: string;
  name: string;
  role: string;
  tier: string | null;
  status: string | null;
  expiresAt: string | null;
  endedAt: string | null;
  createdAt: string;
  lastSignInAt: string | null;
};

function tierLabel(id: string | null): string {
  if (!id) return "—";
  const tier = MEMBERSHIP_TIERS.find((t) => t.id === id);
  return tier ? `${tier.name} · ${tier.priceLabel}` : id;
}

export function Members({ data }: { data: AdminData | undefined }) {
  const fetchMembers = useServerFn(listMembers);
  const changeRole = useServerFn(setUserRole);
  const markPaid = useServerFn(setMembershipPaid);
  const revoke = useServerFn(endMembership);
  const removeAccount = useServerFn(deleteUserAccount);
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["admin-members"],
    queryFn: async () => (await fetchMembers()) as Member[],
  });

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: "admin" | "intern" | "captain" | "member" }) =>
      changeRole({ data: input }),
    onSuccess: async () => {
      toast.success("Access updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-members"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const paidMutation = useMutation({
    mutationFn: (input: { userId: string; paid: boolean; email?: string }) => markPaid({ data: input }),
    onSuccess: async (_result, input) => {
      toast.success(input.paid ? "Payment confirmed — membership active" : "Marked as not paid yet");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-members"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const revokeMutation = useMutation({
    mutationFn: (input: { userId: string; email?: string }) => revoke({ data: input }),
    onSuccess: async () => {
      toast.success("Membership ended — the history is kept");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-members"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (input: { userId: string }) => removeAccount({ data: input }),
    onSuccess: async () => {
      toast.success("Account deleted");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-members"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-data"] }),
      ]);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const allMemberships = (membersQuery.data ?? []).filter((row) => row.tier);
  const pendingRows = allMemberships.filter((row) => row.status === "awaiting_payment");
  const activeRows = allMemberships.filter((row) => row.status === "active");
  const endedRows = allMemberships.filter(
    (row) => row.status !== "active" && row.status !== "awaiting_payment",
  );
  const membershipColumns: Column<Member>[] = [
    { key: "name", header: "Name", sortable: true, value: (row) => row.name, cell: (row) => row.name },
    { key: "email", header: "Email", sortable: true, value: (row) => row.email, cell: (row) => row.email },
    {
      key: "tier",
      header: "Tier",
      sortable: true,
      value: (row) => row.tier ?? "",
      cell: (row) => tierLabel(row.tier),
    },
    {
      key: "status",
      header: "Payment",
      sortable: true,
      value: (row) => row.status ?? "",
      cell: (row) =>
        row.status === "active" ? (
          <Tag>Paid</Tag>
        ) : (
          <span className="text-primary">Awaiting payment</span>
        ),
    },
    {
      key: "expiresAt",
      header: "Runs until",
      sortable: true,
      className: "whitespace-nowrap",
      value: (row) => row.expiresAt ?? "",
      cell: (row) => (row.expiresAt ? formatDate(row.expiresAt) : "—"),
    },
    {
      key: "action",
      header: "Register payment",
      className: "text-right whitespace-nowrap",
      value: (row) => row.status ?? "",
      cell: (row) => (
        <Button
          size="sm"
          variant={row.status === "active" ? "outline" : "default"}
          disabled={paidMutation.isPending}
          onClick={() =>
            paidMutation.mutate({
              userId: row.id,
              paid: row.status !== "active",
              email: row.email,
            })
          }
        >
          {row.status === "active" ? "Mark unpaid" : "Mark as paid"}
        </Button>
      ),
    },
  ];

  const activeColumns: Column<Member>[] = [
    ...membershipColumns.slice(0, 5),
    {
      key: "revoke",
      header: "Manage",
      className: "text-right whitespace-nowrap",
      value: (row) => row.status ?? "",
      cell: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={paidMutation.isPending}
            onClick={() => paidMutation.mutate({ userId: row.id, paid: false, email: row.email })}
          >
            Mark unpaid
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={revokeMutation.isPending}
            onClick={() => {
              if (!window.confirm(`End the membership of ${row.name}? They lose access straight away.`)) return;
              revokeMutation.mutate({ userId: row.id, email: row.email });
            }}
          >
            Remove membership
          </Button>
        </div>
      ),
    },
  ];

  const endedColumns: Column<Member>[] = [
    ...membershipColumns.slice(0, 3),
    {
      key: "endedAt",
      header: "Ended",
      sortable: true,
      className: "whitespace-nowrap",
      value: (row) => row.endedAt ?? "",
      cell: (row) => (row.endedAt ? formatDate(row.endedAt) : "—"),
    },
    {
      key: "reactivate",
      header: "Manage",
      className: "text-right whitespace-nowrap",
      value: (row) => row.status ?? "",
      cell: (row) => (
        <Button
          size="sm"
          disabled={paidMutation.isPending}
          onClick={() => paidMutation.mutate({ userId: row.id, paid: true, email: row.email })}
        >
          Reactivate as paid
        </Button>
      ),
    },
  ];

  const memberColumns: Column<Member>[] = [
    { key: "name", header: "Name", sortable: true, value: (row) => row.name, cell: (row) => row.name },
    { key: "email", header: "Email", sortable: true, value: (row) => row.email, cell: (row) => row.email },
    {
      key: "tier",
      header: "Membership",
      sortable: true,
      value: (row) => row.tier ?? "",
      cell: (row) => (row.tier ? <Tag>{row.tier}</Tag> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "status",
      header: "Status",
      value: (row) => row.status ?? "",
      cell: (row) => row.status ?? "—",
    },
    {
      key: "createdAt",
      header: "Joined",
      sortable: true,
      className: "whitespace-nowrap",
      value: (row) => row.createdAt,
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "role",
      header: "Access",
      value: (row) => row.role,
      className: "text-right whitespace-nowrap",
      cell: (row) => (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Tag>
            {row.role === "admin"
              ? "Admin"
              : row.role === "intern"
                ? "Intern"
                : row.role === "captain"
                  ? "Team captain"
                  : "Member"}
          </Tag>
          <select
            aria-label={`Access level for ${row.name}`}
            value={row.role === "admin" || row.role === "intern" || row.role === "captain" ? row.role : "member"}
            disabled={roleMutation.isPending}
            onChange={(e) =>
              roleMutation.mutate({
                userId: row.id,
                role: e.target.value as "admin" | "intern" | "captain" | "member",
              })
            }
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="member">Member — no admin access</option>
            <option value="captain">Team captain — rosters only</option>
            <option value="intern">Intern — add and edit</option>
            <option value="admin">Admin — full access</option>
          </select>
        </div>
      ),
    },
    {
      key: "delete",
      header: "Delete",
      className: "text-right whitespace-nowrap",
      value: (row) => row.email,
      cell: (row) => (
        <Button
          size="sm"
          variant="destructive"
          disabled={deleteMutation.isPending}
          onClick={() => {
            if (
              !window.confirm(
                `Permanently delete ${row.name} (${row.email})? This also removes their membership, access level, payments and requests. This cannot be undone.`,
              )
            )
              return;
            deleteMutation.mutate({ userId: row.id });
          }}
        >
          Delete account
        </Button>
      ),
    },
  ];

  const orders = data?.orders ?? [];
  const orderColumns: Column<(typeof orders)[number]>[] = [
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      value: (row) => row.created_at,
      cell: (row) => formatDate(row.created_at),
    },
    { key: "tier", header: "Tier", sortable: true, value: (row) => row.tier, cell: (row) => row.tier },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      value: (row) => row.amount_cents / 100,
      cell: (row) => `€${(row.amount_cents / 100).toFixed(2)}`,
    },
    { key: "status", header: "Status", value: (row) => row.status, cell: (row) => <Tag>{row.status}</Tag> },
  ];

  const signups = data?.signups ?? [];
  const signupColumns: Column<(typeof signups)[number]>[] = [
    {
      key: "created_at",
      header: "Signed up",
      sortable: true,
      value: (row) => row.created_at,
      cell: (row) => formatDate(row.created_at),
    },
    { key: "email", header: "Email", sortable: true, value: (row) => row.email, cell: (row) => row.email },
  ];

  const events = data?.events ?? [];
  const eventColumns: Column<(typeof events)[number]>[] = [
    {
      key: "created_at",
      header: "When",
      sortable: true,
      value: (row) => row.created_at,
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "event_type",
      header: "Event",
      value: (row) => row.event_type,
      cell: (row) => <span className="text-primary">{row.event_type}</span>,
    },
    { key: "email", header: "Member", value: (row) => row.email ?? "", cell: (row) => row.email ?? "—" },
    { key: "tier", header: "Tier", value: (row) => row.tier ?? "", cell: (row) => row.tier ?? "—" },
  ];

  return (
    <Tabs defaultValue="memberships" className="space-y-6">
      <TabsList className="bg-surface">
        <TabsTrigger value="memberships" className="min-h-11">Memberships</TabsTrigger>
        <TabsTrigger value="people" className="min-h-11">People</TabsTrigger>
        <TabsTrigger value="orders" className="min-h-11">Payments</TabsTrigger>
        <TabsTrigger value="newsletter" className="min-h-11">Newsletter</TabsTrigger>
        <TabsTrigger value="activity" className="min-h-11">Activity</TabsTrigger>
      </TabsList>

      <TabsContent value="memberships" className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Members request a tier on the website and pay in person at the Hive. Mark them as paid here once
          you have the money — that activates their membership straight away.
        </p>
        <div className="space-y-3">
          <h3 className="font-display text-2xl uppercase tracking-wide">Awaiting payment</h3>
          <DataTable
            rows={pendingRows}
            columns={membershipColumns}
            searchPlaceholder="Search name, email, tier…"
            empty={membersQuery.isLoading ? "Loading…" : "No open membership requests."}
            exportName="breda-guardians-membership-requests"
          />
        </div>

        <div className="space-y-3 pt-4">
          <h3 className="font-display text-2xl uppercase tracking-wide">Active members</h3>
          <p className="text-sm text-muted-foreground">
            Paid and active. You can set a member back to unpaid or remove their membership completely.
          </p>
          <DataTable
            rows={activeRows}
            columns={activeColumns}
            searchPlaceholder="Search active members…"
            empty={membersQuery.isLoading ? "Loading…" : "No active memberships yet."}
            exportName="breda-guardians-active-members"
          />
        </div>

        {endedRows.length > 0 && (
          <div className="space-y-3 pt-4">
            <h3 className="font-display text-2xl uppercase tracking-wide">Ended memberships</h3>
            <DataTable
              rows={endedRows}
              columns={endedColumns}
              searchPlaceholder="Search ended memberships…"
              empty="Nothing here."
              exportName="breda-guardians-ended-members"
            />
          </div>
        )}
      </TabsContent>

      <TabsContent value="people">
        <DataTable
          rows={membersQuery.data ?? []}
          columns={memberColumns}
          searchPlaceholder="Search name, email, tier…"
          empty={membersQuery.isLoading ? "Loading…" : "No accounts yet."}
          exportName="breda-guardians-members"
        />
      </TabsContent>
      <TabsContent value="orders">
        <DataTable rows={orders} columns={orderColumns} searchPlaceholder="Search payments…" exportName="breda-guardians-payments" />
      </TabsContent>
      <TabsContent value="newsletter">
        <DataTable rows={signups} columns={signupColumns} searchPlaceholder="Search email…" exportName="breda-guardians-newsletter" />
      </TabsContent>
      <TabsContent value="activity">
        <DataTable rows={events} columns={eventColumns} searchPlaceholder="Search activity…" exportName="breda-guardians-activity" />
      </TabsContent>
    </Tabs>
  );
}
