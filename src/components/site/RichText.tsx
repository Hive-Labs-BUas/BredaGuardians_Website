import { cn } from "@/lib/utils";
import { sanitizeArticleHtml } from "@/lib/sanitize-html";

/** Renders an article body written in the admin panel's editor. */
export function RichText({ html, className }: { html: string | null | undefined; className?: string }) {
  const clean = sanitizeArticleHtml(html);
  if (!clean) return null;
  return (
    <div
      className={cn("rich-text", className)}
      // Sanitised above: scripts, styles, embeds and event handlers are stripped.
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
