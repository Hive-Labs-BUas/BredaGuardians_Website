/**
 * Shop categories are free-form: staff can add any category in the admin panel
 * (for example "minecraft-keys") and the shop page picks it up automatically.
 */

/** Store categories as lowercase slugs so filtering and links stay stable. */
export function normalizeCategory(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Turn a stored slug into a readable heading, e.g. "minecraft-keys" → "Minecraft Keys". */
export function prettyCategory(value: string): string {
  const cleaned = value.replace(/[-_]+/g, " ").trim();
  if (!cleaned) return "Other";
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Categories that keep their own hand-written copy on the shop page, in display order. */
export const FEATURED_CATEGORIES = ["apparel", "accessories"] as const;

/** Unique category slugs from a product list, featured ones first, then A–Z. */
export function categoriesFrom(items: { category: string }[]): string[] {
  const seen = new Set<string>();
  for (const item of items) {
    const slug = normalizeCategory(item.category);
    if (slug) seen.add(slug);
  }
  const featured = FEATURED_CATEGORIES.filter((slug) => seen.has(slug));
  const rest = [...seen].filter((slug) => !FEATURED_CATEGORIES.includes(slug as never)).sort();
  return [...featured, ...rest];
}
