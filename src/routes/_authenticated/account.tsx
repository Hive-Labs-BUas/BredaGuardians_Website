import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Crown,
  CreditCard,
  FileText,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Shield,
  ShoppingBag,
  Sparkles,
  Ticket,
  Trash2,
  User,
  Camera,
  ChevronRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { PageHeader, Tag } from "@/components/site/Bits";
import { SafeImage } from "@/components/site/SafeImage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  cancelMembership,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "@/lib/account.functions";
import { formatDate, useMyMembership, useMyShopRequests, useNews } from "@/lib/queries";
import { MEMBERSHIP_TIERS, SITE } from "@/lib/site-data";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({
    meta: [
      { title: "Your Account — Breda Guardians" },
      { name: "description", content: "Manage your Breda Guardians membership and order history." },
      { property: "og:title", content: "Your Account — Breda Guardians" },
      { property: "og:description", content: "Manage your Breda Guardians membership." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Account,
});

function tier(id: string) {
  return MEMBERSHIP_TIERS.find((t) => t.id === id);
}

function tierName(id: string) {
  return tier(id)?.name ?? id;
}

function tierPerks(id: string) {
  return tier(id)?.perks ?? [];
}

/** Perks from tiers that cost more than the member's current tier. */
function upsellPerks(currentTierId: string) {
  const current = tier(currentTierId);
  if (!current) return [];
  const owned = new Set(current.perks);
  const higher = MEMBERSHIP_TIERS.filter((t) => t.priceCents > current.priceCents).sort(
    (a, b) => a.priceCents - b.priceCents,
  );
  const extra: { perk: string; tierName: string }[] = [];
  for (const t of higher) {
    for (const perk of t.perks) {
      if (!owned.has(perk) && !extra.some((e) => e.perk === perk)) {
        extra.push({ perk, tierName: t.name });
      }
    }
  }
  return extra.slice(0, 5);
}

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Waiting for payment at the Hive",
  pending_payment: "Waiting for payment at the Hive",
  awaiting_payment: "Waiting for payment at the Hive",
  cancelled: "Ended",
  canceled: "Ended",
  ended: "Ended",
  expired: "Ended",
};

function statusLabel(status: string | null | undefined) {
  if (!status) return "—";
  return STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

const REQUEST_STATUS_LABELS: Record<string, string> = {
  pending: "Waiting for the team",
  approved: "Approved",
  ready: "Ready to pick up",
  completed: "Picked up",
  rejected: "Declined",
  cancelled: "Cancelled",
};

function requestStatusLabel(status: string) {
  return REQUEST_STATUS_LABELS[status] ?? status.replace(/_/g, " ");
}

function euros(cents: number) {
  return `€${(cents / 100).toFixed(2)}`;
}

function daysUntil(date: string) {
  const diff = new Date(date).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

const perkIcons: Record<string, React.ReactNode> = {
  "Discord access": <MessageCircle className="size-4" />,
  "Tournament entry": <Ticket className="size-4" />,
  "Premium Discord role": <Crown className="size-4" />,
  "Team tryout priority": <Shield className="size-4" />,
  "Community events": <Ticket className="size-4" />,
  "Hive voting rights": <Crown className="size-4" />,
  "Everything in Guardian": <Crown className="size-4" />,
  "Exclusive merch drops": <Ticket className="size-4" />,
  "Mentorship sessions": <User className="size-4" />,
};

function StatCard({
  label,
  value,
  hint,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "surface-card bg-surface-2 p-5",
        highlight && "membership-active bg-primary/5",
      )}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className={cn("mt-2 font-display text-2xl", highlight && "text-primary")}>{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("surface-card bg-surface-2 p-6 md:p-8", className)}>{children}</div>;
}

function Account() {
  const { user, profile, isAdmin, refresh } = useAuth();
  const { data, isLoading } = useMyMembership(user?.id);
  const { data: requests, isLoading: requestsLoading } = useMyShopRequests(user?.id);
  const { data: news } = useNews();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const doUpdateProfile = useServerFn(updateProfile);
  const doUploadAvatar = useServerFn(uploadAvatar);
  const doRemoveAvatar = useServerFn(removeAvatar);
  const doCancelMembership = useServerFn(cancelMembership);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [isSavingName, setIsSavingName] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? "");
  }, [profile?.display_name]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  async function handleSaveName() {
    setIsSavingName(true);
    try {
      await doUpdateProfile({ data: { displayName } });
      await refresh();
      toast.success("Display name saved");
    } catch {
      toast.error("Could not save your display name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await doUploadAvatar({ data: formData });
      await refresh();
      toast.success("Profile picture updated");
    } catch {
      toast.error("Could not upload that picture. Please try another one.");
    } finally {
      setIsUploadingAvatar(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    try {
      await doRemoveAvatar();
      await refresh();
      toast.success("Profile picture removed");
    } catch {
      toast.error("Could not remove your profile picture.");
    }
  }

  async function handleCancelMembership() {
    setIsCancelling(true);
    try {
      await doCancelMembership();
      await queryClient.invalidateQueries({ queryKey: ["membership", user?.id] });
      toast.success("Your membership has been cancelled");
    } catch {
      toast.error("Could not cancel your membership. Please contact the team.");
    } finally {
      setIsCancelling(false);
    }
  }

  const membership = data?.membership;
  const subscription = data?.subscription;
  const orders = data?.orders ?? [];
  const isActive = membership?.status === "active";
  const isPending = Boolean(membership && !isActive && /pending|awaiting/.test(membership.status));
  const remaining = membership?.expires_at ? daysUntil(membership.expires_at) : null;
  const myRequests = requests ?? [];
  const latestNews = (news ?? []).slice(0, 3);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title={profile?.display_name ? `Hey, ${profile.display_name}` : "Your Account"}
        intro={user?.email ?? undefined}
      />

      <section className="section-y">
        <div className="container-site flex flex-col gap-6">
          {/* Welcome band */}
          <div
            className={cn(
              "surface-card bg-surface-2 flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8",
              isActive && "membership-active",
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface ring-2 ring-primary/25">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                ) : (
                  <User className="size-7 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display text-2xl">
                  {profile?.display_name || "Guardian"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {isLoading
                    ? "Loading your membership…"
                    : membership
                      ? `${tierName(membership.tier)} · ${statusLabel(membership.status)}`
                      : "No membership yet"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin && (
                <Button asChild variant="secondary">
                  <Link to="/admin">
                    <Shield className="mr-2 size-4" /> Admin panel
                  </Link>
                </Button>
              )}
              <Button variant="outline" onClick={() => void signOut()}>
                <LogOut className="mr-2 size-4" /> Sign out
              </Button>
            </div>
          </div>

          {/* Stat cards */}
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-28 rounded-xl bg-surface-2" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                label="Membership"
                value={membership ? statusLabel(membership.status) : "None"}
                hint={membership ? tierName(membership.tier) : "Join to unlock the perks"}
                icon={<Crown className="size-4" />}
                highlight={isActive}
              />
              <StatCard
                label="Days remaining"
                value={remaining !== null && remaining > 0 ? `${remaining}` : "—"}
                hint={
                  membership?.expires_at
                    ? `Ends ${formatDate(membership.expires_at)}`
                    : "No end date on file"
                }
                icon={<Clock className="size-4" />}
              />
              <StatCard
                label="Merch requests"
                value={`${myRequests.length}`}
                hint={myRequests.length === 0 ? "Nothing requested yet" : "See the requests tab"}
                icon={<ShoppingBag className="size-4" />}
              />
            </div>
          )}

          {!isLoading && !membership && (
            <Panel className="bg-primary/5">
              <h2 className="font-display text-2xl text-primary">Become a Guardian</h2>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Pick a membership to get your Discord role, community play nights and access to the
                Hive. Payment is handled in person at the Hive.
              </p>
              <Button asChild size="lg" className="mt-5">
                <Link to="/shop">See memberships</Link>
              </Button>
            </Panel>
          )}

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-surface-2 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requests">My requests</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-6">
              {isLoading ? (
                <Skeleton className="h-72 rounded-xl bg-surface-2" />
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
                  <Panel className={cn(isActive && "membership-active")}>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-xl font-semibold">Membership</h2>
                      {membership ? <Tag>{statusLabel(membership.status)}</Tag> : null}
                    </div>

                    {membership ? (
                      <div className="mt-5">
                        <p className="font-display text-4xl text-primary">
                          {tierName(membership.tier)}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Started {formatDate(membership.started_at)}
                          {membership.expires_at && ` · renews ${formatDate(membership.expires_at)}`}
                          {remaining !== null && remaining > 0 && ` (in ${remaining} days)`}
                          {subscription?.current_period_end &&
                            ` · period ends ${formatDate(subscription.current_period_end)}`}
                        </p>

                        {isPending && (
                          <p className="mt-4 rounded-lg bg-surface p-4 text-sm text-muted-foreground">
                            Your membership starts as soon as you pay in person at the Hive — bring
                            it up at the desk and the team will confirm it for you.
                          </p>
                        )}

                        <div className="mt-5 grid gap-2 sm:grid-cols-2">
                          {tierPerks(membership.tier).map((perk) => (
                            <div
                              key={perk}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <span className="text-primary">
                                {perkIcons[perk] ?? <Crown className="size-4" />}
                              </span>
                              {perk}
                            </div>
                          ))}
                        </div>

                        {isActive && (
                          <div className="mt-6 rounded-lg bg-primary/10 p-4">
                            <p className="text-sm font-medium text-primary">Discord role</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              The team will add your Discord role manually after your membership is
                              confirmed. Join the server below and introduce yourself.
                            </p>
                            <Button
                              asChild
                              size="sm"
                              className="mt-3 bg-[#5865F2] text-white hover:bg-[#4752C4]"
                            >
                              <a href={SITE.discordUrl} target="_blank" rel="noreferrer">
                                <MessageCircle className="mr-2 size-4" /> Join Discord
                              </a>
                            </Button>
                          </div>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3">
                          <Button asChild variant="secondary" size="lg">
                            <Link to="/shop">Change tier</Link>
                          </Button>
                          {isActive && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="lg"
                                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                                >
                                  Cancel membership
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="border-border bg-background">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel your membership?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will cancel your membership immediately. Your access ends
                                    straight away and you will not be charged again.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Keep membership</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => void handleCancelMembership()}
                                    disabled={isCancelling}
                                    className="bg-destructive text-white hover:bg-destructive/90"
                                  >
                                    {isCancelling ? "Cancelling…" : "Yes, cancel"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5">
                        <p className="text-sm text-muted-foreground">
                          You don't have a membership yet.
                        </p>
                        <Button asChild size="lg" className="mt-5">
                          <Link to="/shop">Get membership</Link>
                        </Button>
                      </div>
                    )}
                  </Panel>

                  <div className="flex flex-col gap-6">
                    {membership && upsellPerks(membership.tier).length > 0 && (
                      <Panel>
                        <h2 className="flex items-center gap-2 text-xl font-semibold">
                          <Sparkles className="size-5 text-primary" /> Unlock more
                        </h2>
                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                          {upsellPerks(membership.tier).map((item) => (
                            <li key={item.perk} className="flex items-start gap-2">
                              <Crown className="mt-0.5 size-4 shrink-0 text-primary/70" />
                              <span>
                                {item.perk}
                                <span className="text-xs text-muted-foreground/70">
                                  {" "}
                                  · {item.tierName}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ul>
                        <Button asChild variant="secondary" className="mt-5 w-full">
                          <Link to="/shop">Compare tiers</Link>
                        </Button>
                      </Panel>
                    )}

                    <Panel>
                      <h2 className="text-xl font-semibold">Quick actions</h2>
                      <div className="mt-5 flex flex-col gap-3">
                        <Button asChild variant="secondary" className="h-12 justify-between">
                          <Link to="/shop">
                            <span className="flex items-center gap-2">
                              <CreditCard className="size-4" /> Shop &amp; memberships
                            </span>
                            <ChevronRight className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="secondary" className="h-12 justify-between">
                          <a href={SITE.discordUrl} target="_blank" rel="noreferrer">
                            <span className="flex items-center gap-2">
                              <MessageCircle className="size-4" /> Join our Discord
                            </span>
                            <ChevronRight className="size-4" />
                          </a>
                        </Button>
                      </div>
                    </Panel>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* My requests */}
            <TabsContent value="requests" className="mt-6">
              <Panel>
                <h2 className="text-xl font-semibold">My requests</h2>
                {requestsLoading ? (
                  <div className="mt-5 space-y-3">
                    {[0, 1, 2].map((i) => (
                      <Skeleton key={i} className="h-20 rounded-lg bg-surface" />
                    ))}
                  </div>
                ) : myRequests.length === 0 ? (
                  <div className="mt-5">
                    <p className="text-sm text-muted-foreground">
                      You haven't requested any merch yet.
                    </p>
                    <Button asChild variant="secondary" className="mt-4">
                      <Link to="/shop">Browse the shop</Link>
                    </Button>
                  </div>
                ) : (
                  <ul className="mt-5 space-y-3">
                    {myRequests.map((r) => (
                      <li key={r.id} className="rounded-lg bg-surface p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium">
                              <Package className="size-4 text-primary" />
                              {r.product_name}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {r.size ? `Size ${r.size} · ` : ""}
                              {r.quantity}× {euros(r.unit_price_cents)}
                              {r.discount_cents > 0 && ` · −${euros(r.discount_cents)}`}
                              {r.voucher_code && ` · voucher ${r.voucher_code}`}
                            </p>
                            {r.note ? (
                              <p className="mt-1 text-sm text-muted-foreground">{r.note}</p>
                            ) : null}
                          </div>
                          <div className="text-right">
                            <Tag>{requestStatusLabel(r.status)}</Tag>
                            <p className="mt-2 text-xs text-muted-foreground">
                              {formatDate(r.created_at)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </TabsContent>

            {/* Payments */}
            <TabsContent value="payments" className="mt-6">
              <Panel>
                <h2 className="text-xl font-semibold">Payments</h2>
                {isLoading ? (
                  <Skeleton className="mt-5 h-40 rounded-lg bg-surface" />
                ) : orders.length === 0 ? (
                  <p className="mt-5 text-sm text-muted-foreground">
                    No payments on your account yet.
                  </p>
                ) : (
                  <>
                    {/* Cards on phones */}
                    <ul className="mt-5 space-y-3 md:hidden">
                      {orders.map((order) => (
                        <li key={order.id} className="rounded-lg bg-surface p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{tierName(order.tier)}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {formatDate(order.created_at)} · {euros(order.amount_cents)}
                              </p>
                            </div>
                            <Tag>{statusLabel(order.status)}</Tag>
                          </div>
                          {order.receipt_url ? (
                            <a
                              href={order.receipt_url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <FileText className="size-4" /> Receipt
                            </a>
                          ) : null}
                        </li>
                      ))}
                    </ul>

                    {/* Table on wider screens */}
                    <div className="mt-5 hidden overflow-x-auto md:block">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-border/60">
                            <th className="pb-3 font-medium">Date</th>
                            <th className="pb-3 font-medium">Tier</th>
                            <th className="pb-3 font-medium">Amount</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map((order) => (
                            <tr key={order.id} className="border-b border-border/30 last:border-0">
                              <td className="py-3 align-top">{formatDate(order.created_at)}</td>
                              <td className="py-3 align-top">{tierName(order.tier)}</td>
                              <td className="py-3 align-top">{euros(order.amount_cents)}</td>
                              <td className="py-3 align-top text-primary">
                                {statusLabel(order.status)}
                              </td>
                              <td className="py-3 align-top">
                                {order.receipt_url ? (
                                  <a
                                    href={order.receipt_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 text-primary hover:underline"
                                  >
                                    <FileText className="size-4" /> Receipt
                                  </a>
                                ) : null}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Panel>
            </TabsContent>

            {/* Profile */}
            <TabsContent value="profile" className="mt-6">
              <Panel className="max-w-2xl">
                <h2 className="text-xl font-semibold">Profile</h2>
                <div className="mt-5 flex items-center gap-4">
                  <div className="relative">
                    <div className="flex size-20 items-center justify-center overflow-hidden rounded-full bg-surface ring-2 ring-primary/20">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="" className="size-full object-cover" />
                      ) : (
                        <User className="size-8 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={isUploadingAvatar}
                      className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-primary text-black shadow transition hover:brightness-110"
                      aria-label="Upload avatar"
                    >
                      <Camera className="size-4" />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => void handleAvatarChange(e)}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg">
                      {profile?.display_name || "Guardian"}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="displayName">Display name</Label>
                    <div className="flex gap-2">
                      <Input
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Your display name"
                        className="h-11 bg-surface"
                      />
                      <Button
                        onClick={() => void handleSaveName()}
                        disabled={isSavingName || displayName === (profile?.display_name ?? "")}
                        size="icon"
                        className="h-11 w-11 shrink-0"
                        aria-label="Save display name"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {profile?.avatar_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void handleRemoveAvatar()}
                      >
                        <Trash2 className="mr-2 size-4" /> Remove picture
                      </Button>
                    )}
                    <Button asChild variant="outline" size="sm">
                      <Link to="/auth" search={{ redirect: "/account" }}>
                        Change password
                      </Link>
                    </Button>
                  </div>
                </div>
              </Panel>
            </TabsContent>
          </Tabs>

          {/* Latest news */}
          {latestNews.length > 0 && (
            <div>
              <h2 className="font-display text-2xl">Latest from Breda Guardians</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                {latestNews.map((item) => (
                  <Link
                    key={item.id}
                    to="/news/$slug"
                    params={{ slug: item.slug }}
                    className="surface-card bg-surface-2 hover-glow group overflow-hidden"
                  >
                    <SafeImage
                      src={item.image_url}
                      alt={item.title}
                      className="h-36 w-full"
                    />
                    <div className="p-5">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {formatDate(item.publish_date)}
                      </p>
                      <p className="mt-2 font-medium group-hover:text-primary">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.excerpt}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
