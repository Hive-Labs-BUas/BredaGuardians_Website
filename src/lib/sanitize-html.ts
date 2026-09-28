/**
 * Small, runtime-agnostic HTML cleaner for article bodies written in the admin
 * panel. Runs on the server (SSR) and in the browser, with no dependencies.
 *
 * It removes anything executable (scripts, styles, embeds, inline event
 * handlers, javascript: links) and keeps the formatting tags the editor can
 * produce.
 */
const BLOCKED_TAGS = /<\s*\/?\s*(script|style|iframe|object|embed|form|input|link|meta|svg|math)\b[^>]*>/gi;
const BLOCKED_BLOCKS = /<\s*(script|style)\b[\s\S]*?<\s*\/\s*\1\s*>/gi;
const EVENT_ATTRS = /\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi;
const DANGEROUS_URLS = /\s(href|src)\s*=\s*("|')?\s*(javascript|data:text\/html|vbscript):[^"'>\s]*("|')?/gi;

export function sanitizeArticleHtml(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(BLOCKED_BLOCKS, "")
    .replace(BLOCKED_TAGS, "")
    .replace(EVENT_ATTRS, "")
    .replace(DANGEROUS_URLS, "")
    .trim();
}

/** True when the value contains real words, not just empty editor markup. */
export function hasRichText(input: string | null | undefined): boolean {
  if (!input) return false;
  return sanitizeArticleHtml(input)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim().length > 0;
}
