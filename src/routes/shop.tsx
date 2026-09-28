import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Armchair,
  ArrowLeft,
  BadgePercent,
  Check,
  Loader2,
  Minus,
  Monitor,
  Package,
  Plus,
  ShoppingBag,
  Sparkles,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import membershipHero from "@/assets/shop-hero.png.asset.json";
import { ArticleImage } from "@/components/site/ArticleImage";
import { EsportsPageHero, Tag } from "@/components/site/Bits";
import { SizeChart } from "@/components/site/SizeChart";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { requestMembership } from "@/lib/membership.functions";
import { formatEuros, useMyMembership, useShopProducts } from "@/lib/queries";
import { checkVoucher, requestShopItem } from "@/lib/shop.functions";
import { categoriesFrom, normalizeCategory, prettyCategory } from "@/lib/shop-categories";
import { MEMBERSHIP_TIERS, type MembershipTier, SITE_URL } from "@/lib/site-data";
import { cn } from "@/lib/utils";

const TITLE = "Breda Guardians Shop — Membership, Apparel & Accessories";
const DESCRIPTION =
  "Shop Breda Guardians: esports club membership from €15, matchday apparel and Hive accessories. Request here, pay in person at The Hive in Breda.";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:url", content: `${SITE_URL}/shop` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/shop` }],
  }),
  component: Shop,
});

/** "all" | "membership" | any product category slug from the admin panel. */
type CategoryId = string;

/** Hand-written copy for our long-standing categories; new ones get a neutral intro. */
const CATEGORY_COPY: Record<
  string,
  {
    icon: typeof ShoppingBag;
    intro: string;
    sizeChart?: boolean;
    explainer?: { eyebrow: string; title: string; paragraphs: string[] };
  }
> = {
  apparel: {
    icon: ShoppingBag,
    intro: "The kit our players and supporters wear — gold on black, on campus and on stage.",
    sizeChart: true,
    explainer: {
      eyebrow: "About our apparel",
      title: "Wear The Crest",
      paragraphs: [
        "Our apparel is the same look you see on our rosters at BUas Cup matches and LAN days: the matchday jersey, a heavyweight training hoodie for late scrims, an everyday tee and a snapback cap. Designed with the club, not printed in bulk for resale.",
        "Pick your size on the card and send the request. Our staff check the size at The Hive, you pay in person, and you walk out with it. Not sure about a size? Use the size chart, ask in our Discord, or drop by during opening hours and try one on.",
      ],
    },
  },
  accessories: {
    icon: Package,
    intro: "Smaller everyday gear for your desk, your bag and your campus pass.",
    explainer: {
      eyebrow: "About our accessories",
      title: "Small Things, Same Standard",
      paragraphs: [
        "Desk mats, bottles, keychains, lanyards and sticker packs — the little things that make a setup feel like yours. They are also the easiest way to support the club or to pick up a gift for a teammate.",
        "Same flow as everything else here: request it, then pay and collect at The Hive during opening hours.",
      ],
    },
  },
};


const SUPPORT_BENEFITS = [
  { icon: Monitor, title: "Upgraded gear", description: "New peripherals, monitors and PC upgrades for the Hive stations." },
  { icon: Armchair, title: "Comfier setups", description: "Proper gaming chairs and desks so long sessions stay sharp." },
  { icon: Sparkles, title: "A better Hive", description: "Lighting, sound and layout improvements to the space itself." },
  { icon: Users, title: "Community nights", description: "Tournaments, LANs and socials funded for every member." },
];

const BUY_STEPS = [
  "Pick what you want here — your request is saved to your account right away.",
  "Pay in person at The Hive during opening hours. Cash or card with our staff.",
  "Staff confirm the payment, activate your membership or hand your item over.",
];

/** Comparison rows for "Which membership is for you" — same lines for every tier. */
const COMPARE_ROWS: { label: string; tiers: string[] }[] = [
  { label: "Member role in our Discord", tiers: ["rookie", "guardian", "legend"] },
  { label: "Entry to all community play nights", tiers: ["rookie", "guardian", "legend"] },
  { label: "Hive drop-in during opening hours", tiers: ["rookie", "guardian", "legend"] },
  { label: "Members-only newsletter", tiers: ["rookie", "guardian", "legend"] },
  { label: "Priority booking on Hive stations", tiers: ["guardian", "legend"] },
  { label: "Monthly coaching and VOD review", tiers: ["guardian", "legend"] },
  { label: "Discount on Guardians merch", tiers: ["guardian", "legend"] },
  { label: "Guaranteed tryout slot each season", tiers: ["guardian", "legend"] },
  { label: "Reserved seat at every home match", tiers: ["legend"] },
  { label: "Guardians jersey included", tiers: ["legend"] },
  { label: "Name on the supporters wall", tiers: ["legend"] },
  { label: "Invite to the season dinner", tiers: ["legend"] },
];

const BEST_FOR: Record<string, string> = {
  rookie: "Trying the club out for a term.",
  guardian: "Regulars who play most weeks.",
  legend: "All-in for the full season.",
};

const TIERS_ASC = [...MEMBERSHIP_TIERS].sort((a, b) => a.priceCents - b.priceCents);

function Explainer({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-gradient relative mt-12 overflow-hidden rounded-2xl p-7 md:mt-16 md:p-10">
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative max-w-3xl">
        <p className="eyebrow">{eyebrow}</p>
        <h3 className="mt-3 text-2xl md:text-3xl">{title}</h3>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

type Product = NonNullable<ReturnType<typeof useShopProducts>["data"]>[number];

type Draft =
  | { kind: "product"; product: Product; size: string; quantity: number }
  | { kind: "membership"; tier: MembershipTier };

function Shop() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products, isLoading } = useShopProducts();
  const { data: mine } = useMyMembership(user?.id);
  const activeTierId =
    mine?.membership && mine.membership.status === "active" ? mine.membership.tier : null;
  const askForMembership = useServerFn(requestMembership);
  const askForItem = useServerFn(requestShopItem);
  const askVoucher = useServerFn(checkVoucher);

  const [category, setCategory] = useState<CategoryId>("all");
  const [showCompare, setShowCompare] = useState(false);
  const [sending, setSending] = useState(false);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [step, setStep] = useState<"details" | "confirm">("details");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [applied, setApplied] = useState<{ code: string; discountCents: number } | null>(null);

  const productCategories = categoriesFrom(products ?? []);
  const tabs: { id: CategoryId; label: string }[] = [
    { id: "all", label: "See all" },
    { id: "membership", label: "Membership" },
    ...productCategories.map((slug) => ({ id: slug, label: prettyCategory(slug) })),
  ];
  const itemsIn = (slug: string): Product[] =>
    (products ?? []).filter((item) => normalizeCategory(item.category) === slug);

  function needsAccount(): boolean {
    if (user) return false;
    toast.info("Create an account first — it takes a moment.");
    void navigate({ to: "/auth", search: { redirect: "/shop" } });
    return true;
  }

  function openProduct(product: Product): void {
    setDraft({ kind: "product", product, size: product.sizes[0] ?? "", quantity: 1 });
    setStep("details");
    setCode("");
    setApplied(null);
  }

  function openTier(tier: MembershipTier): void {
    if (needsAccount()) return;
    setDraft({ kind: "membership", tier });
    setStep("details");
    setCode("");
    setApplied(null);
  }

  const subtotal = !draft
    ? 0
    : draft.kind === "membership"
      ? draft.tier.priceCents
      : draft.product.price_cents * draft.quantity;
  const discount = applied?.discountCents ?? 0;
  const total = Math.max(0, subtotal - discount);
  const scope: "membership" | "apparel" | "accessories" = !draft
    ? "membership"
    : draft.kind === "membership"
      ? "membership"
      : draft.product.category === "apparel"
        ? "apparel"
        : "accessories";

  async function applyCode(): Promise<void> {
    if (!code.trim() || !draft) return;
    setChecking(true);
    try {
      const result = await askVoucher({
        data: { code: code.trim(), scope, subtotalCents: subtotal },
      });
      setApplied({ code: result.code, discountCents: result.discountCents });
      toast.success(`Code ${result.code} applied — ${formatEuros(result.discountCents)} off.`);
    } catch (error) {
      setApplied(null);
      toast.error(error instanceof Error ? error.message : "That code didn't work.");
    } finally {
      setChecking(false);
    }
  }

  async function send(): Promise<void> {
    if (!draft) return;
    if (needsAccount()) return;
    setSending(true);
    try {
      if (draft.kind === "membership") {
        await askForMembership({
          data: { tier: draft.tier.id, ...(applied ? { voucherCode: applied.code } : {}) },
        });
        await queryClient.invalidateQueries({ queryKey: ["membership", user?.id] });
        toast.success(
          `${draft.tier.name} requested. Bring ${formatEuros(total)} to The Hive and our staff will activate it.`,
        );
      } else {
        await askForItem({
          data: {
            productId: draft.product.id,
            quantity: draft.quantity,
            ...(draft.size ? { size: draft.size } : {}),
            ...(applied ? { voucherCode: applied.code } : {}),
          },
        });
        toast.success(
          `${draft.product.name} requested. Bring ${formatEuros(total)} to The Hive and our staff will hand it over.`,
        );
      }
      setDraft(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "That didn't go through. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function ProductCard({ item }: { item: Product }): React.ReactElement {
    const needsSize = item.sizes.length > 0;
    return (
      <article className="panel-gradient hover-glow group flex flex-col overflow-hidden">
        <button
          type="button"
          onClick={() => openProduct(item)}
          aria-label={`Quick view: ${item.name}`}
          className="relative block aspect-square w-full overflow-hidden border-b border-border bg-surface-2"
        >
          <div className="size-full transition-transform duration-500 group-hover:scale-[1.06]">
            <ArticleImage
              src={item.image_url}
              alt={item.name}
              label={prettyCategory(item.category)}
              title={item.name}
            />
          </div>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent"
          />
          <span className="absolute bottom-3 left-3 rounded-md bg-background/70 px-2.5 py-1 font-display text-lg text-primary backdrop-blur">
            {formatEuros(item.price_cents)}
          </span>
          {!item.in_stock && (
            <span className="absolute left-3 top-3">
              <Tag>Sold out</Tag>
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 translate-y-full bg-primary/90 py-2 text-center text-xs font-bold uppercase tracking-[0.18em] text-background transition-transform duration-300 group-hover:translate-y-0">
            Quick view
          </span>
        </button>

        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-lg leading-snug">{item.name}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
          {needsSize && (
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
              Sizes: {item.sizes.join(" · ")}
            </p>
          )}
          <Button
            className="mt-5 w-full"
            variant={item.in_stock ? "secondary" : "outline"}
            disabled={!item.in_stock}
            onClick={() => openProduct(item)}
          >
            {item.in_stock ? (needsSize ? "Choose size" : "Request item") : "Sold out"}
          </Button>
        </div>
      </article>
    );
  }

  function ProductGrid({ items }: { items: Product[] }): React.ReactElement {
    if (isLoading) {
      return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((key) => (
            <div key={key} className="surface-card h-80 animate-pulse bg-surface" />
          ))}
        </div>
      );
    }
    if (items.length === 0) {
      return <p className="text-sm text-muted-foreground">Nothing in this category yet — check back soon.</p>;
    }
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    );
  }

  const showMembership = category === "all" || category === "membership";

  const voucherBlock = (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Ticket className="size-4 text-primary" /> Discount code
      </p>
      {applied ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-primary">
            <BadgePercent className="size-4" /> {applied.code} · {formatEuros(applied.discountCents)} off
          </span>
          <button
            type="button"
            onClick={() => {
              setApplied(null);
              setCode("");
            }}
            className="inline-flex min-h-9 items-center gap-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
          >
            <X className="size-3.5" /> Remove
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Input
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="Enter code"
            aria-label="Discount code"
          />
          <Button variant="outline" onClick={() => void applyCode()} disabled={checking || !code.trim()}>
            {checking ? <Loader2 className="size-4 animate-spin" /> : "Apply"}
          </Button>
        </div>
      )}
    </div>
  );

  const totalsBlock = (
    <dl className="space-y-1.5 text-sm">
      <div className="flex justify-between">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd>{formatEuros(subtotal)}</dd>
      </div>
      {discount > 0 && (
        <div className="flex justify-between text-primary">
          <dt>Discount ({applied?.code})</dt>
          <dd>− {formatEuros(discount)}</dd>
        </div>
      )}
      <div className="flex justify-between border-t border-border pt-2 font-display text-xl">
        <dt>To pay at The Hive</dt>
        <dd className="text-primary">{formatEuros(total)}</dd>
      </div>
    </dl>
  );

  return (
    <>
      <EsportsPageHero
        eyebrow="Shop"
        title="Membership,"
        accent="Kit & Gear"
        intro="Back the club and wear the crest. Pick your membership tier or grab apparel and accessories, then pay in person at The Hive."
        image={membershipHero.url}
        imageAlt="Suited banana guardian representing the Breda Guardians shop"
        imageWidth={704}
        imageHeight={1248}
        className="min-h-[34rem] sm:min-h-[38rem] md:min-h-[44rem]"
        imageClassName="object-contain object-bottom -right-56 bottom-0 h-[28rem] opacity-70 sm:-right-28 sm:h-[34rem] md:right-12 md:h-[44rem] md:opacity-95 lg:right-[max(14rem,calc((100vw_-_var(--site-max))/2))]"
      >
        <Button asChild size="lg">
          <a href="#shop-categories">Start Shopping</a>
        </Button>
        <p className="w-full text-xs text-muted-foreground">
          No online payment — request what you want and settle up with our staff at The Hive.
        </p>
      </EsportsPageHero>

      <section id="shop-categories" className="section-y-first scroll-mt-20">
        <div className="container-site">
          {/* ---------- CATEGORY TABS ---------- */}
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Shop categories">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={category === item.id}
                onClick={() => setCategory(item.id)}
                className={cn(
                  "min-h-11 rounded-lg border px-4 text-sm font-semibold transition-colors",
                  category === item.id
                    ? "border-primary bg-primary/12 text-primary"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* ---------- MEMBERSHIP (ALWAYS ON TOP) ---------- */}
          {showMembership && (
            <div className="mt-12">
              <div className="flex flex-wrap items-center gap-3">
                <Sparkles className="size-5 text-primary" aria-hidden />
                <h2 className="text-2xl md:text-3xl">Membership</h2>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-expanded={showCompare}
                  aria-controls="membership-compare"
                  onClick={() => setShowCompare((open) => !open)}
                >
                  {showCompare ? "Hide compare" : "Compare"}
                </Button>
              </div>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                The core of the club: play at The Hive, join every community night and back our rosters.
              </p>

              <div className="mt-12 grid items-stretch gap-6 md:mt-14 md:grid-cols-3 md:items-center">
                {MEMBERSHIP_TIERS.map((tier) => {
                  const isActive = activeTierId === tier.id;
                  return (
                  <div
                    key={tier.id}
                    className={cn(
                      "panel-gradient hover-glow relative flex flex-col overflow-hidden",
                      tier.popular ? "card-featured z-10 p-8 md:scale-[1.045] md:p-10" : "p-7 md:p-8",
                      isActive && "membership-active z-20",
                    )}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                    />
                    {isActive ? (
                      <span className="gold-gradient mb-4 flex w-fit items-center gap-2 rounded-full px-3.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em]">
                        <Check className="size-3.5" aria-hidden /> Active — your membership
                      </span>
                    ) : (
                      tier.popular && (
                        <span className="gold-gradient mb-4 w-fit rounded-full px-3.5 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em]">
                          Most popular
                        </span>
                      )
                    )}
                    <h3 className={cn("text-3xl", tier.popular ? "md:text-4xl" : "")}>{tier.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{tier.blurb}</p>
                    <p className="mt-6 flex items-end gap-2">
                      <span
                        className={cn(
                          "gradient-text font-display leading-none",
                          tier.popular ? "text-6xl" : "text-5xl",
                        )}
                      >
                        {tier.priceLabel}
                      </span>
                      <span className="pb-1 text-sm font-normal tracking-normal text-muted-foreground">
                        {tier.period}
                      </span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-2.5 text-sm text-muted-foreground">
                      {tier.perks.map((perk) => (
                        <li key={perk} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                          {perk}
                        </li>
                      ))}
                    </ul>
                    {isActive ? (
                      <Button asChild size="lg" className="mt-7 w-full">
                        <Link to="/account">View your membership</Link>
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant={tier.popular ? "default" : "secondary"}
                        className="mt-7 w-full"
                        onClick={() => openTier(tier)}
                      >
                        Request {tier.name}
                      </Button>
                    )}
                  </div>
                  );
                })}
              </div>

              {/* ---------- WHICH MEMBERSHIP IS FOR YOU ---------- */}
              {showCompare && (
              <div id="membership-compare" className="panel-gradient relative mt-12 overflow-hidden rounded-2xl p-6 md:mt-16 md:p-10">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl"
                />
                <div className="relative">
                  <p className="eyebrow">Compare</p>
                  <h3 className="mt-3 text-2xl md:text-3xl">Which Membership Is For You?</h3>
                  <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                    Same lines, side by side. Every tier gets you into The Hive — the longer ones add
                    coaching, priority booking and matchday extras.
                  </p>

                  {/* Desktop: aligned comparison table */}
                  <div className="mt-8 hidden md:block">
                    <table className="w-full table-fixed border-collapse text-sm">
                      <thead>
                        <tr>
                          <th className="w-[38%] py-3 text-left align-bottom">
                            <span className="eyebrow">What you get</span>
                          </th>
                          {TIERS_ASC.map((tier) => (
                            <th key={tier.id} className="px-3 py-3 text-center align-bottom">
                              <span className="block font-display text-xl">{tier.name}</span>
                              <span className="mt-1 block gradient-text font-display text-3xl leading-none">
                                {tier.priceLabel}
                              </span>
                              <span className="mt-1 block text-xs font-normal tracking-normal text-muted-foreground">
                                {tier.period}
                              </span>
                            </th>
                          ))}
                        </tr>
                        <tr>
                          <th className="py-2 text-left text-xs font-normal uppercase tracking-wider text-muted-foreground">
                            Best for
                          </th>
                          {TIERS_ASC.map((tier) => (
                            <th
                              key={tier.id}
                              className="px-3 py-2 text-center text-xs font-normal leading-relaxed text-muted-foreground"
                            >
                              {BEST_FOR[tier.id]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {COMPARE_ROWS.map((row) => (
                          <tr key={row.label} className="border-t border-border/70">
                            <th scope="row" className="py-3 pr-4 text-left font-normal text-muted-foreground">
                              {row.label}
                            </th>
                            {TIERS_ASC.map((tier) => (
                              <td key={tier.id} className="px-3 py-3 text-center">
                                {row.tiers.includes(tier.id) ? (
                                  <Check className="mx-auto size-4 text-primary" aria-label="Included" />
                                ) : (
                                  <Minus className="mx-auto size-4 text-muted-foreground/40" aria-label="Not included" />
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-border">
                          <td />
                          {TIERS_ASC.map((tier) => (
                            <td key={tier.id} className="px-3 pt-5">
                              <Button
                                className="w-full"
                                variant={tier.popular ? "default" : "secondary"}
                                onClick={() => openTier(tier)}
                              >
                                Request
                              </Button>
                            </td>
                          ))}
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Mobile: stacked, equal cards */}
                  <div className="mt-6 grid gap-4 md:hidden">
                    {TIERS_ASC.map((tier) => (
                      <div key={tier.id} className="rounded-xl border border-border bg-surface-2 p-5">
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="text-xl">{tier.name}</h4>
                          <span className="gradient-text font-display text-2xl">{tier.priceLabel}</span>
                        </div>
                        <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                          {tier.period} · {BEST_FOR[tier.id]}
                        </p>
                        <ul className="mt-4 space-y-2 text-sm">
                          {COMPARE_ROWS.map((row) => {
                            const included = row.tiers.includes(tier.id);
                            return (
                              <li
                                key={row.label}
                                className={cn(
                                  "flex items-start gap-2.5",
                                  included ? "text-muted-foreground" : "text-muted-foreground/40",
                                )}
                              >
                                {included ? (
                                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                                ) : (
                                  <Minus className="mt-0.5 size-4 shrink-0" />
                                )}
                                {row.label}
                              </li>
                            );
                          })}
                        </ul>
                        <Button
                          className="mt-5 w-full"
                          variant={tier.popular ? "default" : "secondary"}
                          onClick={() => openTier(tier)}
                        >
                          Request {tier.name}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}

              {/* ---------- WHAT MEMBERSHIP IS FOR ---------- */}
              <div className="panel-gradient relative mt-12 overflow-hidden rounded-2xl p-7 md:mt-16 md:p-10">
                <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14">
                  <div>
                    <p className="eyebrow">What membership is for</p>
                    <h3 className="mt-3 text-2xl md:text-3xl">You Pay To Support The Hive</h3>
                    <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                      Breda Guardians is the student esports community. We run four competitive rosters, weekly community nights and The Hive —
                      our on-campus gaming space with 16 stations, open to members during opening hours.
                    </p>
                    <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                      We are a student community, not a business. Every euro from a membership goes
                      straight back into the place you play: better gear, better chairs, better desks and
                      more room to compete.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {SUPPORT_BENEFITS.map((benefit) => (
                      <div key={benefit.title} className="hover-glow rounded-xl border border-border/70 bg-surface/50 p-5">
                        <benefit.icon className="size-6 text-primary" />
                        <h4 className="mt-3 text-lg">{benefit.title}</h4>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ---------- PRODUCT CATEGORIES (ADDED IN THE ADMIN PANEL) ---------- */}
          {productCategories
            .filter((slug) => category === "all" || category === slug)
            .map((slug) => {
              const copy = CATEGORY_COPY[slug];
              const Icon = copy?.icon ?? Package;
              return (
                <div key={slug} className="mt-20 md:mt-28">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <Icon className="size-5 text-primary" aria-hidden />
                        <h2 className="text-2xl md:text-3xl">{prettyCategory(slug)}</h2>
                      </div>
                      {copy?.intro && (
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{copy.intro}</p>
                      )}
                    </div>
                    {copy?.sizeChart && <SizeChart />}
                  </div>
                  <div className="mt-8">
                    <ProductGrid items={itemsIn(slug)} />
                  </div>

                  {copy?.explainer && (
                    <Explainer eyebrow={copy.explainer.eyebrow} title={copy.explainer.title}>
                      {copy.explainer.paragraphs.map((text) => (
                        <p key={text}>{text}</p>
                      ))}
                    </Explainer>
                  )}
                </div>
              );
            })}


          {/* ---------- HOW BUYING WORKS ---------- */}
          <div className="mt-20 grid gap-6 md:mt-28 md:grid-cols-3">
            {BUY_STEPS.map((text, index) => (
              <div key={text} className="rounded-xl border border-border bg-surface-2 p-6">
                <span className="font-display text-3xl text-primary">0{index + 1}</span>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- QUICK VIEW / REQUEST PREVIEW ---------- */}
      <Dialog open={draft !== null} onOpenChange={(next) => !next && setDraft(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          {draft && step === "details" && draft.kind === "product" && (
            <>
              <DialogHeader>
                <DialogTitle>{draft.product.name}</DialogTitle>
                <DialogDescription>
                  {prettyCategory(draft.product.category)} · pay in person at The Hive
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-surface-2">
                  <ArticleImage
                    src={draft.product.image_url}
                    alt={draft.product.name}
                    label={prettyCategory(draft.product.category)}
                    title={draft.product.name}
                  />
                </div>

                <div className="space-y-5">
                  <p className="font-display text-3xl text-primary">
                    {formatEuros(draft.product.price_cents)}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {draft.product.description}
                  </p>

                  {draft.product.sizes.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">Choose size</p>
                        {draft.product.sizes.length > 1 && <SizeChart />}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {draft.product.sizes.map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => setDraft({ ...draft, size })}
                            className={cn(
                              "min-h-10 rounded-md border px-3.5 text-sm font-semibold transition-colors",
                              draft.size === size
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border bg-surface-2 text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold">Quantity</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="One fewer"
                        onClick={() => setDraft({ ...draft, quantity: Math.max(1, draft.quantity - 1) })}
                      >
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-8 text-center font-display text-xl">{draft.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="One more"
                        onClick={() => setDraft({ ...draft, quantity: Math.min(10, draft.quantity + 1) })}
                      >
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {voucherBlock}

                  <Button
                    size="lg"
                    className="w-full"
                    disabled={!draft.product.in_stock || (draft.product.sizes.length > 0 && !draft.size)}
                    onClick={() => setStep("confirm")}
                  >
                    {draft.product.in_stock ? "Review request" : "Sold out"}
                  </Button>
                </div>
              </div>
            </>
          )}

          {draft && step === "details" && draft.kind === "membership" && (
            <>
              <DialogHeader>
                <DialogTitle>{draft.tier.name} membership</DialogTitle>
                <DialogDescription>{draft.tier.period} · pay in person at The Hive</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <p className="font-display text-4xl text-primary">{draft.tier.priceLabel}</p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {draft.tier.perks.map((perk) => (
                    <li key={perk} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                      {perk}
                    </li>
                  ))}
                </ul>
                {voucherBlock}
                <Button size="lg" className="w-full" onClick={() => setStep("confirm")}>
                  Review request
                </Button>
              </div>
            </>
          )}

          {draft && step === "confirm" && (
            <>
              <DialogHeader>
                <DialogTitle>Check your request</DialogTitle>
                <DialogDescription>
                  Nothing is charged online. Confirm and pay our staff at The Hive.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {draft.kind === "membership"
                          ? `${draft.tier.name} membership`
                          : draft.product.name}
                      </p>
                      <p className="mt-1 text-muted-foreground">
                        {draft.kind === "membership"
                          ? draft.tier.period
                          : [
                              draft.size ? `Size ${draft.size}` : null,
                              `Quantity ${draft.quantity}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                      </p>
                    </div>
                    <p className="font-display text-lg">{formatEuros(subtotal)}</p>
                  </div>
                </div>

                {totalsBlock}

                <p className="text-sm text-muted-foreground">
                  Pay at The Hive (Room Fe0.032) during opening hours, cash or card. Our staff confirm
                  the payment and then{" "}
                  {draft.kind === "membership" ? "activate your membership" : "hand your item over"}.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <Button variant="ghost" onClick={() => setStep("details")} disabled={sending}>
                    <ArrowLeft className="mr-1.5 size-4" /> Back
                  </Button>
                  <Button size="lg" onClick={() => void send()} disabled={sending}>
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 size-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      `Confirm request · ${formatEuros(total)}`
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
